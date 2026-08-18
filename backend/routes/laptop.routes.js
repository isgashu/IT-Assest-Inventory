const express = require('express');
const db = require('../db.js').db;
const { normalizeDate } = require('../utils/date.js');

const router = express.Router();

const laptopColumns = [
  'machineName', 'brand', 'model', 'serialNumber', 'assetCode',
  'employeeId', 'vendorId', 'status', 'processor', 'memory', 'ssd',
  'storageType', 'storageCapacity', 'gpu', 'displaySize', 'operatingSystem', 'msOffice365', 'antivirus',
  'username', 'passwordEmail', 'topApps', 'purchaseDate', 'purchasePrice', 'invoiceNumber',
  'warrantyExpiry', 'handedOverDate', 'handedOverBy', 'handoverCondition', 'location',
];

function getLaptop(id) {
  return db.prepare(`
    SELECT laptop.*, employee.fullName AS employeeName, vendor.name AS vendorName
    FROM laptop
    LEFT JOIN employee ON employee.employeeId = laptop.employeeId
    LEFT JOIN vendor ON vendor.vendorId = laptop.vendorId
    WHERE laptop.id = ?
  `).get(id);
}

function validateLaptop(body) {
  if (!body.machineName || !body.brand || !body.model || !body.serialNumber) {
    return 'Machine name, brand, model, and serial number are required';
  }
  if (body.purchasePrice !== undefined && body.purchasePrice !== null && body.purchasePrice !== '') {
    const purchasePrice = Number(String(body.purchasePrice).replace(/[₹,\s]/g, ''));
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) return 'Purchase price must be a valid non-negative number';
  }
  if (body.storageType && !['ssd', 'hdd'].includes(String(body.storageType).toLowerCase())) return 'Storage type must be SSD or HDD';
  for (const field of ['purchaseDate', 'handedOverDate', 'warrantyExpiry']) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      try {
        normalizeDate(body[field]);
      } catch (error) {
        return `${field} must use DD/MM/YYYY or YYYY-MM-DD format`;
      }
    }
  }
  return null;
}

function valueForColumn(body, column, existing = {}) {
  if (['purchaseDate', 'handedOverDate', 'warrantyExpiry'].includes(column)) return normalizeDate(body[column] ?? existing[column]);
  if (column === 'purchasePrice') return body[column] === '' || body[column] == null ? null : Number(String(body[column]).replace(/[₹,\s]/g, ''));
  if (column === 'storageType') return body[column] ? String(body[column]).toUpperCase() : (existing[column] ? String(existing[column]).toUpperCase() : null);
  if (column === 'location') return body[column] ?? existing[column] ?? 'India HQ';
  return body[column] !== undefined ? body[column] : existing[column] ?? (column === 'status' ? 'Assigned' : null);
}

function writeAudit(action, recordId, description) {
  db.prepare(
    `INSERT INTO audit_log (action, module, record_id, description) VALUES (?, ?, ?, ?)`
  ).run(action, 'Laptops', String(recordId), description);
}

router.get('/', (req, res) => {
  try {
    const { search, status, brand, employee } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(
        laptop.machineName LIKE ? OR laptop.brand LIKE ? OR laptop.model LIKE ? OR
        laptop.serialNumber LIKE ? OR laptop.assetCode LIKE ? OR employee.fullName LIKE ?
      )`);
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }
    if (status) {
      conditions.push('laptop.status = ?');
      params.push(status);
    }
    if (brand) {
      conditions.push('laptop.brand = ?');
      params.push(brand);
    }
    if (employee) {
      conditions.push('(laptop.employeeId = ? OR employee.fullName = ?)');
      params.push(employee, employee);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(`
       SELECT laptop.*, employee.fullName AS employeeName, vendor.name AS vendorName
       FROM laptop
       LEFT JOIN employee ON employee.employeeId = laptop.employeeId
       LEFT JOIN vendor ON vendor.vendorId = laptop.vendorId
      ${where}
      ORDER BY laptop.id DESC
    `).all(...params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load laptops' });
  }
});

router.get('/:id', (req, res) => {
  const laptop = getLaptop(Number.parseInt(req.params.id, 10));
  if (!laptop) return res.status(404).json({ error: 'Laptop not found' });
  return res.json(laptop);
});

router.post('/', (req, res) => {
  try {
    const validationError = validateLaptop(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const values = laptopColumns.map((column) => valueForColumn(req.body, column));
    const placeholders = laptopColumns.map(() => '?').join(', ');
    const result = db.prepare(`INSERT INTO laptop (${laptopColumns.join(', ')}) VALUES (${placeholders})`).run(...values);
    writeAudit('Created laptop', result.lastInsertRowid, `${req.body.machineName} was added`);
    return res.status(201).json(getLaptop(result.lastInsertRowid));
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Serial number already exists' });
    return res.status(500).json({ error: 'Failed to create laptop' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = getLaptop(id);
    if (!existing) return res.status(404).json({ error: 'Laptop not found' });
    const validationError = validateLaptop({ ...existing, ...req.body });
    if (validationError) return res.status(400).json({ error: validationError });

    const assignments = laptopColumns.map((column) => `${column} = ?`).join(', ');
    const values = laptopColumns.map((column) => valueForColumn(req.body, column, existing));
    db.prepare(`UPDATE laptop SET ${assignments} WHERE id = ?`).run(...values, id);
    writeAudit('Updated laptop', id, `${req.body.machineName || existing.machineName} was updated`);
    return res.json(getLaptop(id));
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Serial number already exists' });
    return res.status(500).json({ error: 'Failed to update laptop' });
  }
});

router.post('/import', (req, res) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (!rows.length) return res.status(400).json({ error: 'No laptop rows were provided' });

    const errors = [];
    const seenSerials = new Set();
    rows.forEach((row, index) => {
      if (!row.machineName || !row.brand || !row.model || !row.serialNumber) {
        errors.push({ row: index + 2, message: 'Machine, brand, model, and serial number are required' });
      }
      const serial = String(row.serialNumber || '').trim().toLowerCase();
      if (serial && seenSerials.has(serial)) errors.push({ row: index + 2, message: `Duplicate serial number in CSV: ${row.serialNumber}` });
      if (serial) seenSerials.add(serial);
      const validationError = validateLaptop(row);
      if (validationError) errors.push({ row: index + 2, message: validationError });
    });
    if (errors.length) return res.status(400).json({ error: 'CSV validation failed', details: errors.slice(0, 20) });

    const existingSerials = new Set(db.prepare('SELECT serialNumber FROM laptop WHERE serialNumber IS NOT NULL').all().map((row) => String(row.serialNumber).toLowerCase()));
    const skipped = [];
    const toInsert = rows.filter((row) => {
      const serial = String(row.serialNumber).trim();
      if (existingSerials.has(serial.toLowerCase())) {
        skipped.push({ serialNumber: serial, message: 'Serial number already exists' });
        return false;
      }
      existingSerials.add(serial.toLowerCase());
      return true;
    });

    const insert = db.prepare(`INSERT INTO laptop (${laptopColumns.join(', ')}) VALUES (${laptopColumns.map(() => '?').join(', ')})`);
    const transaction = db.transaction((items) => items.map((row) => {
      const result = insert.run(...laptopColumns.map((column) => valueForColumn(row, column)));
      writeAudit('Created laptop', result.lastInsertRowid, `${row.machineName} was imported`);
      return getLaptop(result.lastInsertRowid);
    }));
    const laptops = transaction(toInsert);
    return res.status(201).json({ laptops, imported: laptops.length, skipped });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'CSV import failed' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = getLaptop(id);
    if (!existing) return res.status(404).json({ error: 'Laptop not found' });
    db.prepare('DELETE FROM laptop WHERE id = ?').run(id);
    writeAudit('Deleted laptop', id, `${existing.machineName} was deleted`);
    return res.json({ message: 'Laptop deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete laptop' });
  }
});

module.exports = router;
