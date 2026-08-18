export const dashboardStats = [
  { label: 'Laptops', value: '45', detail: 'Avg age 3.9 yrs', icon: 'laptop', tone: 'cyan' },
  { label: 'Employees', value: '39', detail: '32 with assigned devices', icon: 'users', tone: 'blue' },
  { label: 'Vendors', value: '5', detail: 'All contracts active', icon: 'building', tone: 'orange' },
  { label: 'Total spend', value: '₹25,63,000', detail: '45 purchases', icon: 'wallet', tone: 'purple' },
]

export const brandData = [
  { label: 'Dell', value: 12 },
  { label: 'HP', value: 3 },
  { label: 'Lenovo', value: 25 },
  { label: 'Other', value: 2 },
  { label: 'Apple', value: 1 },
  { label: 'HONOR', value: 1 },
  { label: 'dell', value: 1 },
]

export const ageData = [
  { label: '<1y', value: 4 },
  { label: '1-2y', value: 7 },
  { label: '2-3y', value: 2 },
  { label: '3y+', value: 31 },
]

export const spendData = [
  { label: '2021', value: 220000 },
  { label: '2022', value: 340000 },
  { label: '2023', value: 410000 },
  { label: '2024', value: 760000 },
  { label: '2025', value: 510000 },
  { label: '2026', value: 323000 },
]

export const statusData = [
  { label: 'Assigned', value: 32, tone: 'cyan' },
  { label: 'Available', value: 7, tone: 'green' },
  { label: 'Under repair', value: 4, tone: 'orange' },
  { label: 'Retired', value: 2, tone: 'muted' },
]

export const locationData = [
  { label: 'India HQ', value: 28 },
  { label: 'Mumbai Office', value: 9 },
  { label: 'Delhi Branch', value: 5 },
  { label: 'Remote', value: 3 },
]

export const recentActivity = [
  { action: 'Laptop assigned', detail: 'Latitude 5440 to Mariam Ahmed', time: '12 min ago', tone: 'cyan' },
  { action: 'Vendor updated', detail: 'Gulf Business Machines', time: '48 min ago', tone: 'blue' },
  { action: 'Issue resolved', detail: 'Battery replacement - LAP-021', time: '2 hrs ago', tone: 'green' },
  { action: 'Backup completed', detail: 'Nightly India production backup', time: '6 hrs ago', tone: 'purple' },
]

export const laptops = [
  { id: 'LAP-001', machineName: 'DXB-FIN-014', brand: 'Dell', model: 'Latitude 5440', serialNumber: 'DL5440-8K2P1', employee: 'Mariam Ahmed', department: 'Finance', status: 'Assigned', location: 'Dubai HQ', purchaseDate: 'Jan 2024', purchasePrice: 5200 },
  { id: 'LAP-002', machineName: 'DXB-OPS-007', brand: 'Lenovo', model: 'ThinkPad T14 Gen 4', serialNumber: 'LNV-T14-4M88', employee: 'Omar Hassan', department: 'Operations', status: 'Assigned', location: 'JLT Office', purchaseDate: 'Mar 2024', purchasePrice: 6100 },
  { id: 'LAP-003', machineName: 'DXB-SAL-021', brand: 'HP', model: 'ProBook 450 G10', serialNumber: 'HP450-91Q2X', employee: 'Noor Al Mansoori', department: 'Sales', status: 'Assigned', location: 'Dubai HQ', purchaseDate: 'Apr 2023', purchasePrice: 4300 },
  { id: 'LAP-004', machineName: 'DXB-IT-003', brand: 'Lenovo', model: 'ThinkPad X1 Carbon', serialNumber: 'LNV-X1-7D42', employee: 'Yousef Karim', department: 'IT', status: 'Available', location: 'Dubai HQ', purchaseDate: 'Jun 2024', purchasePrice: 7200 },
  { id: 'LAP-005', machineName: 'DXB-MKT-009', brand: 'Apple', model: 'MacBook Pro 14', serialNumber: 'APL-MBP-5A33', employee: 'Layla Saeed', department: 'Marketing', status: 'Assigned', location: 'JLT Office', purchaseDate: 'Sep 2023', purchasePrice: 8900 },
  { id: 'LAP-006', machineName: 'DXB-HR-006', brand: 'Dell', model: 'Latitude 5420', serialNumber: 'DL5420-3L19A', employee: 'Fatima Rahman', department: 'People', status: 'Under repair', location: 'Dubai HQ', purchaseDate: 'Feb 2022', purchasePrice: 3900 },
  { id: 'LAP-007', machineName: 'DXB-ENG-018', brand: 'Lenovo', model: 'ThinkPad T14 Gen 3', serialNumber: 'LNV-T14-2P71', employee: 'Ahmed Nasser', department: 'Engineering', status: 'Assigned', location: 'Deira Branch', purchaseDate: 'Nov 2022', purchasePrice: 5400 },
  { id: 'LAP-008', machineName: 'DXB-ADM-002', brand: 'Dell', model: 'Latitude 5430', serialNumber: 'DL5430-0A84M', employee: 'Rashid Ali', department: 'Administration', status: 'Available', location: 'Dubai HQ', purchaseDate: 'Jul 2023', purchasePrice: 4700 },
  { id: 'LAP-009', machineName: 'DXB-LEG-004', brand: 'Lenovo', model: 'ThinkPad L14', serialNumber: 'LNV-L14-9T56', employee: 'Sara Joseph', department: 'Legal', status: 'Assigned', location: 'Dubai HQ', purchaseDate: 'Jan 2021', purchasePrice: 3200 },
  { id: 'LAP-010', machineName: 'DXB-PRJ-011', brand: 'Dell', model: 'Precision 3580', serialNumber: 'DLP-3580-2W7', employee: 'Khalid Noor', department: 'Projects', status: 'Assigned', location: 'JLT Office', purchaseDate: 'Aug 2024', purchasePrice: 7800 },
  { id: 'LAP-011', machineName: 'DXB-SUP-015', brand: 'HONOR', model: 'MagicBook X16', serialNumber: 'HNR-X16-44C9', employee: 'Unassigned', department: 'Support', status: 'Available', location: 'Dubai HQ', purchaseDate: 'Dec 2024', purchasePrice: 3000 },
  { id: 'LAP-012', machineName: 'DXB-OPS-023', brand: 'Lenovo', model: 'ThinkPad E14 Gen 5', serialNumber: 'LNV-E14-5F18', employee: 'Huda Zayed', department: 'Operations', status: 'Damaged', location: 'Deira Branch', purchaseDate: 'May 2022', purchasePrice: 3600 },
]

export const employees = [
  { id: 'EMP-1001', fullName: 'Mariam Ahmed', email: 'mariam.ahmed@isesolutions.ae', department: 'Finance', designation: 'Finance Manager', device: 'DXB-FIN-014', status: 'Active', location: 'Dubai HQ' },
  { id: 'EMP-1002', fullName: 'Omar Hassan', email: 'omar.hassan@isesolutions.ae', department: 'Operations', designation: 'Operations Lead', device: 'DXB-OPS-007', status: 'Active', location: 'JLT Office' },
  { id: 'EMP-1003', fullName: 'Noor Al Mansoori', email: 'noor.mansoori@isesolutions.ae', department: 'Sales', designation: 'Account Executive', device: 'DXB-SAL-021', status: 'Active', location: 'Dubai HQ' },
  { id: 'EMP-1004', fullName: 'Yousef Karim', email: 'yousef.karim@isesolutions.ae', department: 'IT', designation: 'Systems Engineer', device: 'DXB-IT-003', status: 'Active', location: 'Dubai HQ' },
  { id: 'EMP-1005', fullName: 'Layla Saeed', email: 'layla.saeed@isesolutions.ae', department: 'Marketing', designation: 'Marketing Specialist', device: 'DXB-MKT-009', status: 'Active', location: 'JLT Office' },
  { id: 'EMP-1006', fullName: 'Fatima Rahman', email: 'fatima.rahman@isesolutions.ae', department: 'People', designation: 'People Partner', device: 'DXB-HR-006', status: 'On leave', location: 'Dubai HQ' },
  { id: 'EMP-1007', fullName: 'Ahmed Nasser', email: 'ahmed.nasser@isesolutions.ae', department: 'Engineering', designation: 'Engineering Manager', device: 'DXB-ENG-018', status: 'Active', location: 'Deira Branch' },
  { id: 'EMP-1008', fullName: 'Sara Joseph', email: 'sara.joseph@isesolutions.ae', department: 'Legal', designation: 'Legal Counsel', device: 'DXB-LEG-004', status: 'Active', location: 'Dubai HQ' },
]

export const vendors = [
  { id: 'VND-001', name: 'Gulf Business Machines', contactPerson: 'Adeel Khan', email: 'adeel@gbm.ae', category: 'Hardware', devices: 18, status: 'Active', location: 'Dubai' },
  { id: 'VND-002', name: 'Alpha Data', contactPerson: 'Nadia Thomas', email: 'nadia@alphadata.ae', category: 'Hardware', devices: 12, status: 'Active', location: 'Abu Dhabi' },
  { id: 'VND-003', name: 'Mideast Systems', contactPerson: 'Rohan Mehta', email: 'rohan@mideast.ae', category: 'Software', devices: 8, status: 'Active', location: 'Dubai' },
  { id: 'VND-004', name: 'Emirates Office Solutions', contactPerson: 'Hassan Saleh', email: 'hassan@eos.ae', category: 'Accessories', devices: 5, status: 'Active', location: 'Jebel Ali' },
  { id: 'VND-005', name: 'TechServe Gulf', contactPerson: 'Maya George', email: 'maya@techserve.ae', category: 'Support', devices: 2, status: 'Review', location: 'Dubai' },
]

export const issues = [
  { id: 'ISS-2041', title: 'Battery replacement', asset: 'DXB-HR-006', reporter: 'Fatima Rahman', priority: 'Medium', status: 'In progress', opened: '18 Jun 2026', owner: 'Yousef Karim' },
  { id: 'ISS-2040', title: 'VPN access unavailable', asset: 'DXB-ENG-018', reporter: 'Ahmed Nasser', priority: 'High', status: 'Open', opened: '18 Jun 2026', owner: 'IT Service Desk' },
  { id: 'ISS-2039', title: 'Damaged display panel', asset: 'DXB-OPS-023', reporter: 'Huda Zayed', priority: 'High', status: 'Open', opened: '17 Jun 2026', owner: 'TechServe Gulf' },
  { id: 'ISS-2038', title: 'Keyboard replacement', asset: 'DXB-ADM-002', reporter: 'Rashid Ali', priority: 'Low', status: 'Resolved', opened: '16 Jun 2026', owner: 'IT Service Desk' },
  { id: 'ISS-2037', title: 'Slow startup time', asset: 'DXB-SAL-021', reporter: 'Noor Al Mansoori', priority: 'Medium', status: 'Resolved', opened: '15 Jun 2026', owner: 'Yousef Karim' },
  { id: 'ISS-2036', title: 'Missing power adapter', asset: 'DXB-IT-003', reporter: 'Yousef Karim', priority: 'Low', status: 'Closed', opened: '14 Jun 2026', owner: 'IT Service Desk' },
]

export const reports = [
  { id: 'RPT-001', name: 'Dubai Fleet Utilization', description: 'Assignment, availability, and age analysis for all Dubai locations.', type: 'Inventory', updated: 'Today, 09:40', status: 'Ready', coverage: 96 },
  { id: 'RPT-002', name: 'Quarterly Spend Review', description: 'Purchase cost, vendor split, and warranty exposure for Q2.', type: 'Finance', updated: 'Yesterday, 16:20', status: 'Ready', coverage: 88 },
  { id: 'RPT-003', name: 'Open Issues Summary', description: 'Outstanding incidents grouped by priority and owner.', type: 'Service', updated: '18 Jun 2026', status: 'Ready', coverage: 74 },
  { id: 'RPT-004', name: 'Compliance Register', description: 'Asset handover and security control checks across the fleet.', type: 'Compliance', updated: '17 Jun 2026', status: 'Draft', coverage: 61 },
]

export const importJobs = [
  { id: 'IMP-0091', file: 'dubai-laptop-register-june.csv', type: 'Laptop inventory', records: 12, owner: 'Admin', status: 'Completed', date: '18 Jun 2026, 08:30' },
  { id: 'IMP-0090', file: 'employee-directory-q2.xlsx', type: 'Employees', records: 39, owner: 'Admin', status: 'Completed', date: '01 Jun 2026, 14:10' },
  { id: 'IMP-0089', file: 'vendor-contracts-2026.xlsx', type: 'Vendors', records: 5, owner: 'Admin', status: 'Completed', date: '28 May 2026, 11:45' },
]

export const backups = [
  { id: 'BKP-7821', name: 'Dubai production snapshot', type: 'Full backup', size: '18.4 MB', status: 'Completed', created: '18 Jun 2026, 02:00', retention: '30 days' },
  { id: 'BKP-7820', name: 'Dubai production snapshot', type: 'Full backup', size: '18.2 MB', status: 'Completed', created: '17 Jun 2026, 02:00', retention: '30 days' },
  { id: 'BKP-7819', name: 'Before asset import', type: 'Manual backup', size: '17.9 MB', status: 'Completed', created: '16 Jun 2026, 08:27', retention: '90 days' },
  { id: 'BKP-7818', name: 'Dubai production snapshot', type: 'Full backup', size: '17.8 MB', status: 'Completed', created: '16 Jun 2026, 02:00', retention: '30 days' },
]

export const auditLogs = [
  { id: 'LOG-9012', action: 'Updated laptop', module: 'Laptops', record: 'DXB-HR-006', user: 'Admin', timestamp: '18 Jun 2026, 10:12', source: 'Dubai HQ' },
  { id: 'LOG-9011', action: 'Resolved issue', module: 'Issues', record: 'ISS-2038', user: 'Yousef Karim', timestamp: '18 Jun 2026, 09:44', source: 'Dubai HQ' },
  { id: 'LOG-9010', action: 'Created employee', module: 'Employees', record: 'EMP-1008', user: 'Admin', timestamp: '17 Jun 2026, 16:20', source: 'Dubai HQ' },
  { id: 'LOG-9009', action: 'Exported report', module: 'Reports', record: 'RPT-002', user: 'Admin', timestamp: '17 Jun 2026, 15:02', source: 'JLT Office' },
  { id: 'LOG-9008', action: 'Updated vendor', module: 'Vendors', record: 'VND-005', user: 'Admin', timestamp: '17 Jun 2026, 12:18', source: 'Dubai HQ' },
  { id: 'LOG-9007', action: 'Signed in', module: 'Auth', record: 'admin@example.com', user: 'Admin', timestamp: '17 Jun 2026, 08:02', source: 'Dubai HQ' },
]

export const users = [
  { id: 'USR-001', name: 'Admin', email: 'admin@example.com', role: 'Administrator', lastSeen: 'Now', status: 'Active', location: 'Dubai HQ' },
  { id: 'USR-002', name: 'Yousef Karim', email: 'yousef.karim@isesolutions.ae', role: 'IT Manager', lastSeen: '12 min ago', status: 'Active', location: 'Dubai HQ' },
  { id: 'USR-003', name: 'Nadia Thomas', email: 'nadia.thomas@isesolutions.ae', role: 'Inventory Manager', lastSeen: '2 hrs ago', status: 'Active', location: 'JLT Office' },
  { id: 'USR-004', name: 'Mariam Ahmed', email: 'mariam.ahmed@isesolutions.ae', role: 'Viewer', lastSeen: 'Yesterday', status: 'Active', location: 'Dubai HQ' },
  { id: 'USR-005', name: 'Rashid Ali', email: 'rashid.ali@isesolutions.ae', role: 'Viewer', lastSeen: '3 days ago', status: 'Inactive', location: 'Deira Branch' },
]
