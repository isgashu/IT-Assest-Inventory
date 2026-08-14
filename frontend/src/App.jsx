import { useState } from 'react'
import { ReactComponent as Logo } from '../assets/logo.svg'
import './tailwind.css'

const pages = {
  login: 'Login',
  dashboard: 'Dashboard',
  laptops: 'Laptops',
  employees: 'Employees',
  vendors: 'Vendors',
  issues: 'Issues',
  reports: 'Reports',
  importExport: 'Import/Export',
  backups: 'Backups',
  auditLogs: 'Audit Logs',
  users: 'Users',
  settings: 'Settings'
}

function App() {
  const [showSidebar, setShowSidebar] = useState(true)
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)

  const toggleSidebar = () => setShowSidebar(!showSidebar)
  const setPage = (page) => setCurrentPage(page)

  const navLinks = [
    { key: 'dashboard', label: 'Dashboard', icon: 'Layout' },
    { key: 'laptops', label: 'Laptops', icon: 'File' },
    { key: 'employees', label: 'Employees', icon: 'Users' },
    { key: 'vendors', label: 'Vendors', icon: 'Package' },
    { key: 'issues', label: 'Issues', icon: 'AlertCircle' },
    { key: 'reports', label: 'Reports', icon: 'BarChart' },
    { key: 'importExport', label: 'Import/Export', icon: 'Upload' },
    { key: 'backups', label: 'Backups', icon: 'Download' },
    { key: 'auditLogs', label: 'Audit Logs', icon: 'Log' },
    { key: 'users', label: 'Users', icon: 'User' },
    { key: 'settings', label: 'Settings', icon: 'Settings' }
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">IT Asset Mgmt</span>
          </div>
          
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle sidebar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path className="stroke-2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex min-h-screen">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-64 bg-white dark:bg-gray-800 shadow-right sticky top-16 h-screen text-gray-600 dark:text-gray-400 flex flex-col">
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">IT Asset</span>
            </div>
            <nav className="flex-1">
              {navLinks.map((link) => (
                <button
                  key={link.key}
                  onClick={() => setPage(link.key)}
                  className={`w-full flex items-center gap-3 py-2 px-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${currentPage === link.key ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium' : ''}`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path className="stroke-2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden md:block">{link.label}</span>
                </button>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPage('login')}
                className="w-full py-2 px-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Logout
              </button>
            </div>
          </aside>
        )}

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          {currentPage === 'login' && <LoginPage setUser={setUser} setPage={setPage} />}
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'laptops' && <LaptopsPage />}
          {currentPage === 'employees' && <EmployeesPage />}
          {currentPage === 'vendors' && <VendorsPage />}
          {currentPage === 'issues' && <IssuesPage />}
          {currentPage === 'reports' && <ReportsPage />}
          {currentPage === 'importExport' && <ImportExportPage />}
          {currentPage === 'backups' && <BackupsPage />}
          {currentPage === 'auditLogs' && <AuditLogsPage />}
          {currentPage === 'users' && <UsersPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  )
}

function LoginPage({ setUser, setPage }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    // TODO: Call auth API
    if (email === 'admin@example.com' && password === 'password123') {
      setUser({ id: 1, name: 'Admin', role: 'ADMIN' })
      setPage('dashboard')
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Sign In</h2>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            onClick={handleLogin}
            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-opacity-90 font-medium transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

// Placeholder page components
const DashboardPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
    <p className="text-gray-600">Dashboard content will appear here</p>
  </div>
)

const LaptopsPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Laptops</h1>
    <p className="text-gray-600">Laptops content will appear here</p>
  </div>
)

const EmployeesPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Employees</h1>
    <p className="text-gray-600">Employees content will appear here</p>
  </div>
)

const VendorsPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Vendors</h1>
    <p className="text-gray-600">Vendors content will appear here</p>
  </div>
)

const IssuesPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Issues</h1>
    <p className="text-gray-600">Issues content will appear here</p>
  </div>
)

const ReportsPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Reports</h1>
    <p className="text-gray-600">Reports content will appear here</p>
  </div>
)

const ImportExportPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Import/Export</h1>
    <p className="text-gray-600">Import/Export content will appear here</p>
  </div>
)

const BackupsPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Backups</h1>
    <p className="text-gray-600">Backups content will appear here</p>
  </div>
)

const AuditLogsPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
    <p className="text-gray-600">Audit Logs content will appear here</p>
  </div>
)

const UsersPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Users</h1>
    <p className="text-gray-600">Users content will appear here</p>
  </div>
)

const SettingsPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>
    <p className="text-gray-600">Settings content will appear here</p>
  </div>
)

export default App