const express = require('express');
const db = require('../db.js').db;

const router = express.Router();

function getVendor(id) {
  return db.prepare('SELECT * FROM vendor WHERE id = ?').get(id);
}

function writeAudit(action, recordId, description) {
  db.prepare('INSERT INTO audit_log (action, module, record_id, description) VALUES (?, ?, ?, ?)').run(action, 'Vendors', String(recordId), description);
}

router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    if (!search) return res.json(db.prepare('SELECT * FROM vendor ORDER BY name ASC').all());
    const term = `%${search}%`;
    return res.json(db.prepare('SELECT * FROM vendor WHERE name LIKE ? OR contactPerson LIKE ? OR email LIKE ? ORDER BY name ASC').all(term, term, term));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load vendors' });
  }
});

router.get('/:id', (req, res) => {
  const vendor = getVendor(Number.parseInt(req.params.id, 10));
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  return res.json(vendor);
});

router.post('/', (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: 'Vendor name is required' });
    const vendorId = req.body.vendorId || `VND-${Date.now()}`;
    const result = db.prepare(
      `INSERT INTO vendor (name, vendorId, contactPerson, mobile, email, companyName, address, gstNumber, website, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.body.name, vendorId, req.body.contactPerson || '', req.body.mobile || '', req.body.email || '',
      req.body.companyName || req.body.name, req.body.address || 'India', req.body.gstNumber || '', req.body.website || '', req.body.status || 'Active'
    );
    writeAudit('Created vendor', result.lastInsertRowid, `${req.body.name} was added`);
    return res.status(201).json(getVendor(result.lastInsertRowid));
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Vendor ID already exists' });
    return res.status(500).json({ error: 'Failed to create vendor' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = getVendor(id);
    if (!existing) return res.status(404).json({ error: 'Vendor not found' });
    const fields = ['name', 'vendorId', 'contactPerson', 'mobile', 'email', 'companyName', 'address', 'gstNumber', 'website', 'status'];
    const assignments = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => req.body[field] !== undefined ? req.body[field] : existing[field]);
    db.prepare(`UPDATE vendor SET ${assignments} WHERE id = ?`).run(...values, id);
    writeAudit('Updated vendor', id, `${req.body.name || existing.name} was updated`);
    return res.json(getVendor(id));
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Vendor ID already exists' });
    return res.status(500).json({ error: 'Failed to update vendor' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = getVendor(id);
    if (!existing) return res.status(404).json({ error: 'Vendor not found' });
    db.prepare('UPDATE laptop SET vendorId = NULL WHERE vendorId = ?').run(existing.vendorId);
    db.prepare('DELETE FROM vendor WHERE id = ?').run(id);
    writeAudit('Deleted vendor', id, `${existing.name} was deleted`);
    return res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

router.get('/:id/laptops', (req, res) => {
  const vendor = getVendor(Number.parseInt(req.params.id, 10));
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  return res.json(db.prepare('SELECT * FROM laptop WHERE vendorId = ? ORDER BY id DESC').all(vendor.vendorId));
});

module.exports = router;
