const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
 PdfKit = require('pdfkit');
 const fs = require('fs');
 const path = require('path');
  const db = require('../db').db;
  const { formatDate } = require('../utils/date.js');

 const run = (sql, params) => db.run(sql, params);
 const get = (sql, params) => db.get(sql, params);
 const all = (sql, params) => db.all(sql, params);

// Helper to build WHERE clause from query parameters
const buildWhereClause = (filters) => {
  const conditions = [];
  const params = [];

  if (filters.brand) {
    conditions.push('brand = ?');
    params.push(filters.brand);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.employee) {
    conditions.push('employeeId = ?');
    params.push(filters.employee);
  }
  if (filters.vendor) {
    conditions.push('vendorId = ?');
    params.push(filters.vendor);
  }
  if (filters.search) {
    conditions.push('(machineName LIKE ? OR serialNumber LIKE ? OR assetCode LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  return { where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', params };
};

// Export Laptops to Excel
router.get('/laptops/excel', async (req, res) => {
  try {
    const { brand, status, employee, search } = req.query;

    const { where, params } = buildWhereClause({ brand, status, employee, search });

    const laptops = await all(`SELECT * FROM laptop ${where}`, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laptop Inventory');

    // Add headers
    worksheet.columns = [
      { header: 'Machine Name', key: 'machineName', width: 25 },
      { header: 'Brand', key: 'brand', width: 15 },
      { header: 'Model', key: 'model', width: 20 },
      { header: 'Serial Number', key: 'serialNumber', width: 25 },
      { header: 'Asset Code', key: 'assetCode', width: 20 },
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Purchase Date', key: 'purchaseDate', width: 15 },
      { header: 'Purchase Price', key: 'purchasePrice', width: 15 },
    ];

    // Add data rows
    laptops.forEach(laptop => {
      worksheet.addRow({
        machineName: laptop.machineName,
        brand: laptop.brand,
        model: laptop.model,
        serialNumber: laptop.serialNumber,
        assetCode: laptop.assetCode,
        employeeId: laptop.employeeId || '',
        status: laptop.status,
        purchaseDate: formatDate(laptop.purchaseDate),
        purchasePrice: laptop.purchasePrice ? `₹${laptop.purchasePrice.toLocaleString('en-IN')}` : '',
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=laptops_export_' + new Date().toISOString().split('T')[0] + '.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Export failed: ' + error.message });
  }
});

// Export Laptops to CSV
router.get('/laptops/csv', async (req, res) => {
  try {
    const { brand, status, employee, search } = req.query;

    const { where, params } = buildWhereClause({ brand, status, employee, search });

    const laptops = await all(`SELECT * FROM laptop ${where}`, params);

    if (laptops.length === 0) {
      return res.status(404).json({ error: 'No data found with the applied filters' });
    }

    const headers = ['Machine Name', 'Brand', 'Model', 'Serial Number', 'Asset Code', 'Employee ID', 'Status', 'Purchase Date', 'Purchase Price'];
    const rows = laptops.map(laptop => [
      laptop.machineName,
      laptop.brand,
      laptop.model,
      laptop.serialNumber,
      laptop.assetCode,
      laptop.employeeId || '',
      laptop.status,
       formatDate(laptop.purchaseDate),
      laptop.purchasePrice ? `₹${laptop.purchasePrice.toLocaleString('en-IN')}` : '',
    ]);

    // CSV format
    const csvRows = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=laptops_export_' + new Date().toISOString().split('T')[0] + '.csv');

    res.status(200).send(csvRows);
  } catch (error) {
    res.status(500).json({ error: 'Export failed: ' + error.message });
  }
});

// Export Dashboard Stats
router.get('/dashboard/stats/excel', async (req, res) => {
  try {
    const totalLaptops = await get('SELECT COUNT(*) as count FROM laptop').then(r => r.count);
    const assignedLaptops = await get('SELECT COUNT(*) as count FROM laptop WHERE status = "Assigned"').then(r => r.count);
    const spareLaptops = await get('SELECT COUNT(*) as count FROM laptop WHERE status = "Spare"').then(r => r.count);
    const underRepairLaptops = await get('SELECT COUNT(*) as count FROM laptop WHERE status = "Under Repair"').then(r => r.count);
    const damagedLaptops = await get('SELECT COUNT(*) as count FROM laptop WHERE status = "Damaged"').then(r => r.count);
    const totalEmployees = await get('SELECT COUNT(*) as count FROM employee').then(r => r.count);
    const totalVendors = await get('SELECT COUNT(*) as count FROM vendor').then(r => r.count);
    const totalPurchaseValue = await get('SELECT IFNULL(SUM(purchasePrice), 0) as total FROM laptop WHERE purchasePrice IS NOT NULL').then(r => r.total);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dashboard Statistics');

    worksheet.addRow(['IT Asset Management Dashboard Report']);
    worksheet.addRow(['Generated: ' + new Date().toLocaleString()]);
    worksheet.addRow([]); // blank row
    worksheet.addRow(['Metric', 'Value']);
    worksheet.addRow(['Total Laptops', totalLaptops]);
    worksheet.addRow(['Assigned', assignedLaptops]);
    worksheet.addRow(['Spare', spareLaptops]);
    worksheet.addRow(['Under Repair', underRepairLaptops]);
    worksheet.addRow(['Damaged', damagedLaptops]);
    worksheet.addRow(['Total Employees', totalEmployees]);
    worksheet.addRow(['Total Vendors', totalVendors]);
     worksheet.addRow(['Total Purchase Value', `₹${totalPurchaseValue.toLocaleString('en-IN')}`]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=dashboard_stats_' + new Date().toISOString().split('T')[0] + '.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Export failed: ' + error.message });
  }
});

module.exports = router;
