const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
// Create the local schema before opening the application connection.
require('./init-db.js');

// Import security middleware
const securityMiddleware = require('./middleware/security.middleware.js');

// Import routes
const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const laptopRoutes = require('./routes/laptop.routes.js');
const employeeRoutes = require('./routes/employee.routes.js');
const vendorRoutes = require('./routes/vendor.routes.js');
const importRoutes = require('./routes/import.routes.js');
const exportRoutes = require('./routes/export.routes.js');
const backupRoutes = require('./routes/backup.routes.js');
const { verifyToken, requireAdmin } = require('./middleware/auth.middleware.js');
const { dateToUtc, dateYear } = require('./utils/date.js');

// Database
const configuredDatabasePath = process.env.DATABASE_PATH;
const databasePath = configuredDatabasePath && path.isAbsolute(configuredDatabasePath)
  ? configuredDatabasePath
  : path.join(__dirname, configuredDatabasePath || 'dev.db');
const db = new Database(databasePath);

// Middleware
app.use(morgan('dev'));
app.use(securityMiddleware);
app.use(express.json({ limit: '10kb' }));

// CORS
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/laptops', verifyToken, laptopRoutes);
app.use('/api/employees', verifyToken, employeeRoutes);
app.use('/api/vendors', verifyToken, vendorRoutes);
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/backup', backupRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

function getAgeInYears(purchaseDate) {
  if (!purchaseDate) return NaN;
  const date = dateToUtc(purchaseDate);
  if (!date) return NaN;
  return Math.max(0, (Date.now() - date.getTime()) / 31557600000);
}

function normalizeDashboardStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value.includes('repair')) return 'Under repair';
  if (value.includes('retir')) return 'Retired';
  if (value.includes('spare') || value.includes('available')) return 'Available';
  return 'Assigned';
}

// User routes - protected
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role FROM user').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin-only routes
app.get('/api/admin/dashboard', verifyToken, requireAdmin, (req, res) => {
  try {
    const laptopRows = db.prepare('SELECT brand, purchaseDate, purchasePrice, status, employeeId, location FROM laptop').all();
    const totalLaptops = laptopRows.length;
    const totalEmployees = db.prepare('SELECT COUNT(*) AS count FROM employee').get().count;
    const totalVendors = db.prepare('SELECT COUNT(*) AS count FROM vendor').get().count;
    const assignedEmployees = db.prepare("SELECT COUNT(DISTINCT employeeId) AS count FROM laptop WHERE employeeId IS NOT NULL AND employeeId <> ''").get().count;
    const purchaseCount = laptopRows.filter((laptop) => laptop.purchasePrice !== null && laptop.purchasePrice !== '').length;
    const totalPurchaseValue = laptopRows.reduce((sum, laptop) => sum + (Number(laptop.purchasePrice) || 0), 0);
    const ages = laptopRows.map((laptop) => getAgeInYears(laptop.purchaseDate)).filter(Number.isFinite);
    const averageAge = ages.length ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;

    const brandMap = new Map();
    const ageMap = new Map([['<1y', 0], ['1-2y', 0], ['2-3y', 0], ['3y+', 0]]);
    const statusMap = new Map([['Assigned', 0], ['Available', 0], ['Under repair', 0], ['Retired', 0]]);
    const spendMap = new Map();

    laptopRows.forEach((laptop) => {
      const brand = String(laptop.brand || 'Other').trim() || 'Other';
      const brandKey = brand.toLowerCase();
      brandMap.set(brandKey, { label: brand, value: (brandMap.get(brandKey)?.value || 0) + 1 });

      const age = getAgeInYears(laptop.purchaseDate);
      const ageBucket = age < 1 ? '<1y' : age < 2 ? '1-2y' : age < 3 ? '2-3y' : '3y+';
      ageMap.set(ageBucket, ageMap.get(ageBucket) + 1);

      const status = normalizeDashboardStatus(laptop.status);
      statusMap.set(status, statusMap.get(status) + 1);

       const year = dateYear(laptop.purchaseDate);
      if (year && Number(laptop.purchasePrice)) spendMap.set(year, (spendMap.get(year) || 0) + Number(laptop.purchasePrice));
    });

    const recentActivity = db.prepare('SELECT action, description, created_at AS time FROM audit_log ORDER BY created_at DESC LIMIT 5').all().map((item) => ({
      action: item.action || 'Inventory updated',
      detail: item.description || 'A record changed in the console',
      time: item.time || 'Recently',
      tone: item.action?.toLowerCase().includes('issue') ? 'green' : item.action?.toLowerCase().includes('vendor') ? 'blue' : 'cyan',
    }));

    res.json({
      totalLaptops,
      totalEmployees,
      totalVendors,
      assignedEmployees,
      purchaseCount,
      totalPurchaseValue,
      averageAge,
      brandData: [...brandMap.values()].sort((first, second) => second.value - first.value),
      ageData: [...ageMap.entries()].map(([label, value]) => ({ label, value })),
      spendData: [...spendMap.entries()].sort(([first], [second]) => first.localeCompare(second)).map(([label, value]) => ({ label, value })),
      statusData: [
        { label: 'Assigned', value: statusMap.get('Assigned'), tone: 'cyan' },
        { label: 'Available', value: statusMap.get('Available'), tone: 'green' },
        { label: 'Under repair', value: statusMap.get('Under repair'), tone: 'orange' },
        { label: 'Retired', value: statusMap.get('Retired'), tone: 'muted' },
      ],
       locationData: [...laptopRows.reduce((locations, laptop) => {
         const label = String(laptop.location || 'Unassigned location').trim() || 'Unassigned location';
         locations.set(label, (locations.get(label) || 0) + 1);
         return locations;
       }, new Map())].map(([label, value]) => ({ label, value })).sort((first, second) => second.value - first.value),
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('ERROR Stack:', err.stack);
  console.error('ERROR Message:', err.message);
  console.error('ERROR IP:', req.ip);
  console.error('ERROR URL:', req.originalUrl);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({ success: false, error: message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
