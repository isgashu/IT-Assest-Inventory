const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const Database = require('better-sqlite3');

const db = require('../db').db;
const { v4: uuidv4 } = require('uuid');

const backupDir = path.join(__dirname, '..', 'backups');
const configuredDatabasePath = process.env.DATABASE_PATH;
const databasePath = configuredDatabasePath && path.isAbsolute(configuredDatabasePath)
  ? configuredDatabasePath
  : path.join(__dirname, '..', configuredDatabasePath || 'dev.db');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Helper to get database size
const getDbSize = () => {
  const stats = fs.statSync(databasePath);
  return stats.size;
};

// Generate backup filename
const generateBackupName = () => {
  const now = new Date();
  return `backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.sqlite`;
};

// Create backup
router.post('/create', (req, res) => {
  try {
    const backupName = req.body.name || generateBackupName();
    const sourcePath = databasePath;
    const backupPath = path.join(backupDir, `${backupName}.sqlite`);

    // Copy database file
    fs.copyFileSync(sourcePath, backupPath);

    const size = getDbSize();

    // Record audit log
    const ipAddress = req.ip || 'unknown';
    const now = new Date();

    db.prepare(
      'INSERT INTO audit_log (user_id, action, module, record_id, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      req.user ? req.user.id : null,
      'BACKUP',
      'Database',
      null,
      `Backup created: ${backupName}`,
      ipAddress,
      now
    );

    res.json({
      success: true,
      backupName: `${backupName}.sqlite`,
      path: backupPath,
      size: size,
      created: now.toISOString(),
      message: 'Backup created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed: ' + error.message });
  }
});

// List backups
router.get('/', (req, res) => {
  try {
    const backups = [];

    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sqlite'));

      files.forEach(file => {
        const filepath = path.join(backupDir, file);
        const stats = fs.statSync(filepath);

        backups.push({
          name: file,
          path: filepath,
          size: stats.size,
          created: stats.mtime,
          sizeFormatted: (stats.size / 1024).toFixed(2) + ' KB'
        });
      });
    }

    res.json({ backups });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list backups: ' + error.message });
  }
});

// Restore backup
router.post('/restore', (req, res) => {
  try {
    const { backupPath } = req.body;

    if (!backupPath || !fs.existsSync(backupPath)) {
      return res.status(400).json({ error: 'Backup file not found' });
    }

    const sourcePath = backupPath;
    const targetPath = databasePath;

    // Create safety backup before restore
    const safetyBackup = path.join(backupDir, `safety_${Date.now()}.sqlite`);
    fs.copyFileSync(sourcePath, safetyBackup);

    // Copy backup to target
    fs.copyFileSync(sourcePath, targetPath);

    // Record audit log
    const ipAddress = req.ip || 'unknown';
    const now = new Date();

    db.prepare(
      'INSERT INTO audit_log (user_id, action, module, record_id, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      req.user ? req.user.id : null,
      'RESTORE',
      'Database',
      null,
      `Database restored from: ${path.basename(backupPath)}`,
      ipAddress,
      now
    );

    res.json({
      success: true,
      message: 'Database restored successfully',
      safetyBackup: safetyBackup,
      restored: now.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Restore failed: ' + error.message });
  }
});

// Delete backup
router.delete('/:backupName', (req, res) => {
  try {
    const { backupName } = req.params;
    const backupPath = path.join(backupDir, backupName);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    fs.unlinkSync(backupPath);

    // Record audit log
    const ipAddress = req.ip || 'unknown';
    const now = new Date();

    db.prepare(
      'INSERT INTO audit_log (user_id, action, module, record_id, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      req.user ? req.user.id : null,
      'DELETE',
      'Database Backup',
      null,
      `Backup deleted: ${backupName}`,
      ipAddress,
      now
    );

    res.json({
      success: true,
      message: 'Backup deleted successfully',
      deleted: backupName
    });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed: ' + error.message });
  }
});

// Get backup info
router.get('/:backupName', (req, res) => {
  try {
    const { backupName } = req.params;
    const backupPath = path.join(backupDir, backupName);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    const stats = fs.statSync(backupPath);

    res.json({
      name: backupName,
      path: backupPath,
      size: stats.size,
      sizeFormatted: (stats.size / 1024).toFixed(2) + ' KB',
      created: stats.mtime,
      sizeKb: Math.round(stats.size / 1024)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get backup info: ' + error.message });
  }
});

module.exports = router;
