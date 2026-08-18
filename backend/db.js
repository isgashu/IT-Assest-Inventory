const Database = require('better-sqlite3');
const path = require('path');

const configuredDatabasePath = process.env.DATABASE_PATH;
const databasePath = configuredDatabasePath && path.isAbsolute(configuredDatabasePath)
  ? configuredDatabasePath
  : path.join(__dirname, configuredDatabasePath || 'dev.db');
const db = new Database(databasePath);

// Helper functions
const run = (sql, params) => db.run(sql, params);
const get = (sql, params) => db.get(sql, params);
const all = (sql, params) => db.all(sql, params);

module.exports = { db, run, get, all };
