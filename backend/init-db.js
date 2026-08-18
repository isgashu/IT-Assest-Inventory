const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const configuredDatabasePath = process.env.DATABASE_PATH;
const dbPath = configuredDatabasePath && path.isAbsolute(configuredDatabasePath)
  ? configuredDatabasePath
  : path.join(__dirname, configuredDatabasePath || 'dev.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS laptop (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machineName TEXT,
  brand TEXT,
  model TEXT,
  serialNumber TEXT UNIQUE,
  assetCode TEXT,
  employeeId TEXT,
  vendorId TEXT,
  status TEXT DEFAULT 'Spare',
  processor TEXT,
  memory TEXT,
  ssd TEXT,
  storageType TEXT,
  storageCapacity TEXT,
  gpu TEXT,
  displaySize TEXT,
  operatingSystem TEXT,
  msOffice365 TEXT,
  antivirus TEXT,
  username TEXT,
  passwordEmail TEXT,
  topApps TEXT,
  purchaseDate TEXT,
  purchasePrice REAL,
  invoiceNumber TEXT,
  warrantyExpiry TEXT,
  handedOverDate TEXT,
  handedOverBy TEXT,
  handoverCondition TEXT,
  location TEXT DEFAULT 'India HQ',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employee (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT NOT NULL,
  employeeId TEXT UNIQUE,
  email TEXT,
  teamsId TEXT,
  profilePhoto TEXT DEFAULT 'default-avatar.png',
  contactNumber TEXT,
  department TEXT,
  designation TEXT,
  joiningDate TEXT,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  vendorId TEXT UNIQUE,
  contactPerson TEXT,
  mobile TEXT,
  email TEXT,
  companyName TEXT,
  address TEXT,
  gstNumber TEXT,
  website TEXT,
  status TEXT DEFAULT 'Active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT,
  module TEXT,
  record_id TEXT,
  description TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

const laptopSchema = db.prepare('PRAGMA table_info(laptop)').all();
const laptopSchemaNames = new Set(laptopSchema.map((column) => column.name));
const laptopMigrations = [
  ['storageType', 'TEXT'],
  ['storageCapacity', 'TEXT'],
  ['username', 'TEXT'],
  ['passwordEmail', 'TEXT'],
  ['location', "TEXT DEFAULT 'India HQ'"],
];
laptopMigrations.forEach(([column, definition]) => {
  if (!laptopSchemaNames.has(column)) db.exec(`ALTER TABLE laptop ADD COLUMN ${column} ${definition}`);
});

db.prepare("UPDATE laptop SET storageType = 'SSD' WHERE (storageType IS NULL OR storageType = '') AND lower(ssd) LIKE '%ssd%'").run();
db.prepare("UPDATE laptop SET storageCapacity = trim(replace(replace(replace(ssd, 'SSD', ''), 'ssd', ''), '  ', ' ')) WHERE (storageCapacity IS NULL OR storageCapacity = '') AND ssd IS NOT NULL AND ssd <> ''").run();
db.prepare("UPDATE laptop SET location = 'India HQ' WHERE location IS NULL OR location = ''").run();

const count = db.prepare('SELECT COUNT(*) as count FROM user').get().count;
if (count === 0) {
  const hashed = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO user (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Administrator',
    'admin@example.com',
    hashed,
    'ADMIN'
  );
  console.log('Seeded admin user: admin@example.com / admin123');
} else {
  console.log('User table already has data, skipping seed.');
}

const laptopCount = db.prepare('SELECT COUNT(*) AS count FROM laptop').get().count;
const employeeCount = db.prepare('SELECT COUNT(*) AS count FROM employee').get().count;
const vendorCount = db.prepare('SELECT COUNT(*) AS count FROM vendor').get().count;

if (laptopCount === 0 && employeeCount === 0 && vendorCount === 0) {
  const seedInventory = db.transaction(() => {
    const employeeInsert = db.prepare(
      `INSERT INTO employee (fullName, employeeId, email, department, designation, joiningDate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const departments = ['Finance', 'Operations', 'Sales', 'IT', 'Marketing', 'People', 'Engineering', 'Legal'];
    const firstNames = ['Aarav', 'Ishita', 'Rohan', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Kavya', 'Rahul', 'Neha', 'Aditya', 'Pooja'];
    const lastNames = ['Sharma', 'Patel', 'Nair', 'Mehta', 'Singh', 'Reddy', 'Kapoor', 'Iyer'];

    for (let index = 0; index < 39; index += 1) {
      const name = `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
      const employeeId = `EMP-${String(index + 1).padStart(4, '0')}`;
      const department = departments[index % departments.length];
      employeeInsert.run(name, employeeId, `${name.toLowerCase().replace(/\s+/g, '.')}@isesolutions.in`, department, index % 3 === 0 ? 'Manager' : 'Specialist', `202${index % 5}-0${(index % 8) + 1}-15`, 'Active');
    }

    const vendorInsert = db.prepare(
      `INSERT INTO vendor (name, vendorId, contactPerson, mobile, email, companyName, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const vendorNames = ['Dell Technologies India', 'Lenovo India', 'HP India', 'Reliance Digital Business', 'Ingram Micro India'];
    vendorNames.forEach((name, index) => vendorInsert.run(name, `VND-${String(index + 1).padStart(3, '0')}`, `Contact ${index + 1}`, `+91 98${String(index + 1).padStart(2, '0')}000000`, `vendor${index + 1}@isesolutions.in`, name, 'India', 'Active'));

    const laptopInsert = db.prepare(
      `INSERT INTO laptop (machineName, brand, model, serialNumber, assetCode, employeeId, vendorId, status, processor, memory, ssd, storageType, storageCapacity, operatingSystem, msOffice365, antivirus, purchaseDate, purchasePrice, handedOverDate, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const brands = ['Dell', 'Dell', 'Lenovo', 'Lenovo', 'Lenovo', 'HP', 'Lenovo', 'Lenovo', 'Other', 'Apple', 'HONOR'];
    const statuses = ['Assigned', 'Assigned', 'Assigned', 'Assigned', 'Assigned', 'Assigned', 'Spare', 'Under Repair', 'Retired'];
    for (let index = 0; index < 45; index += 1) {
      const status = statuses[index % statuses.length];
      const brand = brands[index % brands.length];
      const year = 2021 + (index % 6);
      const month = (index % 12) + 1;
      const employeeId = status === 'Assigned' ? `EMP-${String((index % 39) + 1).padStart(4, '0')}` : null;
      const vendorId = `VND-${String((index % 5) + 1).padStart(3, '0')}`;
      laptopInsert.run(
        `IND-${['FIN', 'OPS', 'SAL', 'IT', 'HR'][index % 5]}-${String(index + 1).padStart(3, '0')}`,
        brand,
        brand === 'Dell' ? 'Latitude 5440' : brand === 'Lenovo' ? 'ThinkPad T14 Gen 4' : brand === 'HP' ? 'ProBook 450 G10' : 'Business Laptop',
        `IN-${brand.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(6, '0')}`,
        `AST-${String(index + 1).padStart(5, '0')}`,
        employeeId,
        vendorId,
        status,
        index % 2 === 0 ? 'Intel Core i5' : 'Intel Core i7',
        index % 3 === 0 ? '16 GB RAM' : '8 GB RAM',
        index % 4 === 0 ? '1 TB SSD' : '512 GB SSD',
        'SSD',
        index % 4 === 0 ? '1 TB' : '512 GB',
        'Windows 11',
        index % 3 === 0 ? 'Yes' : 'No',
        index % 2 === 0 ? 'Yes' : 'No',
        `${year}-${String(month).padStart(2, '0')}-01`,
        45000 + ((index * 2750) % 42000),
        employeeId ? `${year}-${String(month).padStart(2, '0')}-15` : null,
        'India HQ'
      );
    }
  });

  seedInventory();
  console.log('Seeded India inventory: 45 laptops, 39 employees, and 5 vendors.');
} else {
  console.log('Inventory tables already have data, skipping demo seed.');
}

console.log('Database initialized successfully.');
db.close();
