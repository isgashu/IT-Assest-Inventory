const express = require('express');
const db = require('../db.js').db;
const { normalizeDate } = require('../utils/date.js');

const router = express.Router();

function getEmployee(id) {
  return db.prepare('SELECT * FROM employee WHERE id = ?').get(id);
}

function writeAudit(action, recordId, description) {
  db.prepare('INSERT INTO audit_log (action, module, record_id, description) VALUES (?, ?, ?, ?)').run(action, 'Employees', String(recordId), description);
}

router.get('/', (req, res) => {
  try {
    const { search, department } = req.query;
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push('(fullName LIKE ? OR employeeId LIKE ? OR email LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (department) {
      conditions.push('department = ?');
      params.push(department);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const employees = db.prepare(`SELECT * FROM employee ${where} ORDER BY fullName ASC`).all(...params);
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load employees' });
  }
});

router.get('/:id', (req, res) => {
  const employee = getEmployee(Number.parseInt(req.params.id, 10));
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  return res.json(employee);
});

router.post('/', (req, res) => {
  try {
    if (!req.body.fullName || !req.body.email) return res.status(400).json({ error: 'Full name and email are required' });
    const employeeId = req.body.employeeId || `EMP-${Date.now()}`;
    let joiningDate;
    try {
      joiningDate = normalizeDate(req.body.joiningDate || new Date().toISOString().slice(0, 10));
    } catch {
      return res.status(400).json({ error: 'Joining date must use DD/MM/YYYY or YYYY-MM-DD format' });
    }
    const result = db.prepare(
      `INSERT INTO employee (fullName, employeeId, email, teamsId, profilePhoto, contactNumber, department, designation, joiningDate, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.body.fullName, employeeId, req.body.email, req.body.teamsId || '', req.body.profilePhoto || 'default-avatar.png',
      req.body.contactNumber || '', req.body.department || 'IT', req.body.designation || 'Staff',
      joiningDate, req.body.status || 'Active', req.body.notes || ''
    );
    writeAudit('Created employee', result.lastInsertRowid, `${req.body.fullName} was added`);
    return res.status(201).json(getEmployee(result.lastInsertRowid));
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Employee ID already exists' });
    return res.status(500).json({ error: 'Failed to create employee' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = getEmployee(id);
    if (!existing) return res.status(404).json({ error: 'Employee not found' });
    const fields = ['fullName', 'employeeId', 'email', 'teamsId', 'profilePhoto', 'contactNumber', 'department', 'designation', 'joiningDate', 'status', 'notes'];
    if (req.body.joiningDate !== undefined) {
      try {
        req.body.joiningDate = normalizeDate(req.body.joiningDate);
      } catch {
        return res.status(400).json({ error: 'Joining date must use DD/MM/YYYY or YYYY-MM-DD format' });
      }
    }
    const assignments = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => req.body[field] !== undefined ? req.body[field] : existing[field]);
    db.prepare(`UPDATE employee SET ${assignments} WHERE id = ?`).run(...values, id);
    writeAudit('Updated employee', id, `${req.body.fullName || existing.fullName} was updated`);
    return res.json(getEmployee(id));
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Employee ID already exists' });
    return res.status(500).json({ error: 'Failed to update employee' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = getEmployee(id);
    if (!existing) return res.status(404).json({ error: 'Employee not found' });
    db.prepare('UPDATE laptop SET employeeId = NULL WHERE employeeId = ?').run(existing.employeeId);
    db.prepare('DELETE FROM employee WHERE id = ?').run(id);
    writeAudit('Deleted employee', id, `${existing.fullName} was deleted`);
    return res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete employee' });
  }
});

router.get('/:id/with-laptops', (req, res) => {
  const employee = getEmployee(Number.parseInt(req.params.id, 10));
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  const assignedLaptops = db.prepare('SELECT * FROM laptop WHERE employeeId = ? ORDER BY id DESC').all(employee.employeeId);
  return res.json({ ...employee, assignedLaptops });
});

module.exports = router;
