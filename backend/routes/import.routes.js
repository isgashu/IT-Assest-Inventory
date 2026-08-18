const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const db = require('../db.js').db;

// Helper to run SQL queries
const run = (sql, params) => db.run(sql, params);
const get = (sql, params) => db.get(sql, params);
const all = (sql, params) => db.all(sql, params);

// Import validation helper
const validateImportData = (data, model) => {
  const errors = [];
  
  switch (model) {
    case 'laptop':
      for (const row of data) {
        if (!row.serialNumber) errors.push({ row: 'Missing Serial Number', field: 'serialNumber' });
        if (!row.assetCode) errors.push({ row: 'Missing Asset Code', field: 'assetCode' });
      }
      break;
      
    case 'employee':
      for (const row of data) {
        if (!row.fullName) errors.push({ row: 'Missing Full Name', field: 'fullName' });
        if (!row.email) errors.push({ row: 'Missing Email', field: 'email' });
      }
      break;
      
    case 'vendor':
      for (const row of data) {
        if (!row.name) errors.push({ row: 'Missing Vendor Name', field: 'name' });
      }
      break;
  }
  
  return errors;
};

// Import Laptops
router.post('/laptops', async (req, res) => {
  try {
    const { file, module } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    if (module === 'laptop') {
      // Process Excel file
      if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
        const workbook = new ExcelJS.Workbook();
        await workbook.read(file);
        const worksheet = workbook.getWorksheet(1);
        
        worksheet.eachRow((row, rowIndex) => {
          if (rowIndex === 1) return; // Skip header
          
          const rowData = {
            machineName: row.getCell(1).value,
            brand: row.getCell(2).value,
            model: row.getCell(3).value,
            serialNumber: row.getCell(4).value,
            assetCode: row.getCell(5).value,
            employeeId: row.getCell(6).value || null,
            vendorId: row.getCell(7).value || null,
            status: row.getCell(8).value || 'Assigned',
            processor: row.getCell(9).value || '',
            memory: row.getCell(10).value || '',
            ssd: row.getCell(11).value || '',
            gpu: row.getCell(12).value || '',
            displaySize: row.getCell(13).value || '',
            operatingSystem: row.getCell(14).value || '',
            msOffice365: row.getCell(15).value || '',
            antivirus: row.getCell(16).value || '',
            topApps: row.getCell(17).value || '',
            purchaseDate: row.getCell(18).value || null,
            purchasePrice: row.getCell(19).value ? parseFloat(row.getCell(19).value) : null,
            invoiceNumber: row.getCell(20).value || '',
            warrantyExpiry: row.getCell(21).value || null,
            handedOverDate: row.getCell(22).value || null,
            handedOverBy: row.getCell(23).value || '',
            handoverCondition: row.getCell(24).value || ''
          };
          
          // Validate required fields
          if (!rowData.serialNumber || !rowData.assetCode) {
            errors.push({ row: rowIndex, message: 'Missing Serial Number or Asset Code' });
            return;
          }
          
          // Check for duplicate serial number
          const existing = all('SELECT id FROM laptop WHERE serialNumber = ?', [rowData.serialNumber]);
          if (existing.length > 0) {
            errors.push({ row: rowIndex, message: 'Duplicate Serial Number: ' + rowData.serialNumber });
            return;
          }
          
          results.push(rowData);
        });
      }
      
      // Process CSV file
      else if (file.endsWith('.csv')) {
        // CSV processing
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation errors', 
        details: errors.slice(0, 5) 
      });
    }

    // Import records
    const imported = [];
    for (const row of results) {
      try {
        const result = run(
          `INSERT INTO laptop (machineName, brand, model, serialNumber, assetCode, employeeId, vendorId, status, processor, memory, ssd, gpu, displaySize, operatingSystem, msOffice365, antivirus, topApps, purchaseDate, purchasePrice, invoiceNumber, warrantyExpiry, handedOverDate, handedOverBy, handoverCondition) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.machineName, row.brand, row.model, row.serialNumber, row.assetCode,
            row.employeeId, row.vendorId, row.status, row.processor, row.memory,
            row.ssd, row.gpu, row.displaySize, row.operatingSystem, row.msOffice365,
            row.antivirus, row.topApps, row.purchaseDate, row.purchasePrice,
            row.invoiceNumber, row.warrantyExpiry, row.handedOverDate,
            row.handedOverBy, row.handoverCondition
          ]
        );
        
        imported.push({ id: result.lastInsertRowid, ...row });
      } catch (err) {
        errors.push({ row: row.row, message: err.message });
      }
    }

    res.json({ 
      success: results.length,
      imported,
      errors: errors.slice(0, 10),
      total: results.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Import failed: ' + error.message });
  }
});

// Import Employees
router.post('/employees', async (req, res) => {
  try {
    const { file } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.read(file);
      const worksheet = workbook.getWorksheet(1);
      
      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return;
        
        const rowData = {
          fullName: row.getCell(1).value,
          employeeId: row.getCell(2).value,
          email: row.getCell(3).value,
          teamsId: row.getCell(4).value || '',
          profilePhoto: row.getCell(5).value || 'default-avatar.png',
          contactNumber: row.getCell(6).value || '',
          department: row.getCell(7).value || 'IT',
          designation: row.getCell(8).value || 'Staff',
          joiningDate: row.getCell(9).value || new Date().toISOString().split('T')[0],
          status: row.getCell(10).value || 'Active',
          notes: row.getCell(11).value || ''
        };
        
        if (!rowData.fullName || !rowData.email) {
          errors.push({ row: rowIndex, message: 'Missing required fields' });
          return;
        }
        
        // Check for duplicate employee ID
        const existing = all('SELECT id FROM employee WHERE employeeId = ?', [rowData.employeeId]);
        if (existing.length > 0 && rowData.employeeId) {
          errors.push({ row: rowIndex, message: 'Duplicate Employee ID: ' + rowData.employeeId });
          return;
        }
        
        results.push(rowData);
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation errors', details: errors.slice(0, 5) });
    }

    const imported = [];
    for (const row of results) {
      try {
        const result = run(
          `INSERT INTO employee (fullName, employeeId, email, teamsId, profilePhoto, contactNumber, department, designation, joiningDate, status, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.fullName, row.employeeId, row.email, row.teamsId,
            row.profilePhoto, row.contactNumber, row.department,
            row.designation, row.joiningDate, row.status, row.notes
          ]
        );
        imported.push({ id: result.lastInsertRowid, ...row });
      } catch (err) {
        errors.push({ row: row.row, message: err.message });
      }
    }

    res.json({ success: results.length, imported, errors: errors.slice(0, 10), total: results.length });
  } catch (error) {
    res.status(500).json({ error: 'Import failed: ' + error.message });
  }
});

// Import Vendors
router.post('/vendors', async (req, res) => {
  try {
    const { file } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.read(file);
      const worksheet = workbook.getWorksheet(1);
      
      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return;
        
        const rowData = {
          name: row.getCell(1).value,
          contactPerson: row.getCell(2).value,
          mobile: row.getCell(3).value,
          email: row.getCell(4).value,
          companyName: row.getCell(5).value || '',
          address: row.getCell(6).value || '',
          gstNumber: row.getCell(7).value || '',
          website: row.getCell(8).value || '',
          status: row.getCell(9).value || 'Active'
        };
        
        if (!rowData.name) {
          errors.push({ row: rowIndex, message: 'Missing Vendor Name' });
          return;
        }
        
        results.push(rowData);
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation errors', details: errors.slice(0, 5) });
    }

    const imported = [];
    for (const row of results) {
      try {
        const result = run(
          `INSERT INTO vendor (name, vendorId, contactPerson, mobile, email, companyName, address, gstNumber, website, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.name, row.vendorId || `VND-${Date.now()}`, row.contactPerson,
            row.mobile, row.email, row.companyName, row.address,
            row.gstNumber, row.website, row.status
          ]
        );
        imported.push({ id: result.lastInsertRowid, ...row });
      } catch (err) {
        errors.push({ row: row.row, message: err.message });
      }
    }

    res.json({ success: results.length, imported, errors: errors.slice(0, 10), total: results.length });
  } catch (error) {
    res.status(500).json({ error: 'Import failed: ' + error.message });
  }
});

module.exports = router;