const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Database = require('better-sqlite3');

const db = new Database('./dev.db', { verbose: console.log });

// Helper functions for database operations
const run = (sql, params) => db.run(sql, params);
const get = (sql, params) => db.get(sql, params);
const all = (sql, params) => db.all(sql, params);
const prepare = (sql) => db.prepare(sql);

// Middleware setup
const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Auth routes
const authRoutes = require('./routes/auth.routes.js');
app.use('/api/auth', authRoutes);

// User routes
const userRoutes = require('./routes/user.routes.js');
app.use('/api/users', userRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ success: false, error: message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;