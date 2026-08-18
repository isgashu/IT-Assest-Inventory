import { useEffect, useRef, useState } from 'react'
import './tailwind.css'
import './console.css'
import {
  auditLogs,
  backups,
  employees,
  importJobs,
  issues,
  reports,
  users,
  vendors,
} from './data/mockData'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function apiHeaders(json = false) {
  const token = localStorage.getItem('token')
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const iconPaths = {
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  laptop: <><rect x="5" y="5" width="14" height="10" rx="1.5" /><path d="M3 19h18M8 19h8" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3 2.3-5 5.5-5s5 2 5.5 5M16 5.5a3 3 0 0 1 0 5.8M16 14c2.4.2 3.8 1.8 4.2 4" /></>,
  building: <><path d="M4 20V7l8-3 8 3v13M8 20v-4h8v4M8 9h1M11.5 9h1M15 9h1M8 12h1M11.5 12h1M15 12h1" /></>,
  issue: <><path d="m12 4 8 15H4L12 4Z" /><path d="M12 9v4M12 16h.01" /></>,
  chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /></>,
  upload: <><path d="M12 16V4M8 8l4-4 4 4M5 14v5h14v-5" /></>,
  download: <><path d="M12 4v12M8 12l4 4 4-4M5 19h14" /></>,
  archive: <><path d="M4 7h16v13H4zM3 4h18v3H3zM9 11h6" /></>,
  log: <><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></>,
  user: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.7-3.4 3-5 7-5s6.3 1.6 7 5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.6 1.6-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.6-1.6.1-.1A1.7 1.7 0 0 0 8.6 15a1.7 1.7 0 0 0-1.6-1H6v-2.4h1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.6-1.6.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.4v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.6 1.6-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H20V14h-.2a1.7 1.7 0 0 0-1.4 1Z" /></>,
  sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
  logout: <><path d="M14 8V5H4v14h10v-3M11 12h10M17 8l4 4-4 4" /></>,
  wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" /><path d="M4 7h15M15 12h4M16.5 12v.01" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" /></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  chevron: <path d="m8 10 4 4 4-4" />,
  edit: <><path d="m5 16-.8 4 4-.8L19 8.4 15.6 5 5 16Z" /><path d="m13.8 6.8 3.4 3.4" /></>,
  trash: <><path d="M5 7h14M10 11v5M14 11v5M8 7l1-3h6l1 3M7 7l1 14h8l1-14" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  refresh: <><path d="M19 8a7.5 7.5 0 0 0-13.2-1.8L4 8.5M4 4v4.5h4.5M5 16a7.5 7.5 0 0 0 13.2 1.8l1.8-2.3M20 20v-4.5h-4.5" /></>,
  database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" /></>,
  shield: <><path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h4M9 12h6M9 16h6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  globe: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8c-2-2.2-3-4.9-3-8s1-5.8 3-8Z" /></>,
  server: <><rect x="4" y="4" width="16" height="6" rx="1" /><rect x="4" y="14" width="16" height="6" rx="1" /><path d="M8 7h.01M8 17h.01" /></>,
  eye: <><path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z" /><circle cx="12" cy="12" r="2" /></>,
  save: <><path d="M5 4h12l2 2v14H5z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H4V5h6" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  list: <><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  detail: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
}

function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name] || iconPaths.dashboard}
    </svg>
  )
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'laptops', label: 'Laptops', icon: 'laptop' },
  { key: 'employees', label: 'Employees', icon: 'users' },
  { key: 'vendors', label: 'Vendors', icon: 'building' },
  { key: 'issues', label: 'Issues', icon: 'issue' },
  { key: 'reports', label: 'Reports', icon: 'chart' },
  { key: 'importExport', label: 'Import / Export', icon: 'upload' },
  { key: 'backups', label: 'Backups', icon: 'archive' },
  { key: 'auditLogs', label: 'Audit Logs', icon: 'log' },
  { key: 'users', label: 'Users', icon: 'user' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
]

function StatusBadge({ status }) {
  const label = String(status || 'Unknown')
  const statusClass = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return <span className={`status-badge status-${statusClass}`}>{label}</span>
}

function PageHeader({ title, subtitle, icon = 'dashboard', children, showIcon = false }) {
  return (
    <div className="page-header">
      <div className="page-heading">
        {showIcon && <div className="page-title-icon"><Icon name={icon} size={19} /></div>}
        <div>
          <p className="eyebrow">India operations</p>
          <h1>{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  )
}

function MetricCard({ label, value, detail, icon, tone }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon-${tone}`}><Icon name={icon} size={21} /></div>
      <div className="metric-copy">
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  )
}

function Panel({ title, subtitle, children, className = '', action }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function BarChart({ data, tone = 'cyan', valueSuffix = '' }) {
  const width = 760
  const height = 246
  const left = 42
  const right = 12
  const top = 12
  const bottom = 42
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const max = Math.max(...data.map((item) => item.value), 1)
  const step = plotWidth / data.length
  const barWidth = Math.min(72, step * 0.66)
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="chart-visual">
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart">
        {ticks.map((tick) => {
          const y = top + plotHeight - plotHeight * tick
          const label = Math.round(max * tick)
          return (
            <g key={tick}>
              <line className="chart-gridline" x1={left} x2={width - right} y1={y} y2={y} />
              <text className="chart-axis-text" x={left - 9} y={y + 4} textAnchor="end">{label}{valueSuffix}</text>
            </g>
          )
        })}
        <line className="chart-axis" x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} />
        {data.map((item, index) => {
          const barHeight = (item.value / max) * plotHeight
          const x = left + step * index + (step - barWidth) / 2
          const y = top + plotHeight - barHeight
          return (
            <g key={`${item.label}-${index}`}>
              <rect className={`chart-bar chart-bar-${tone}`} x={x} y={y} width={barWidth} height={barHeight} rx="6" />
              <text className="chart-value-text" x={x + barWidth / 2} y={y - 8} textAnchor="middle">{item.value}{valueSuffix}</text>
              <text className="chart-label-text" x={x + barWidth / 2} y={height - 14} textAnchor="middle">{item.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function LineChart({ data }) {
  const width = 1500
  const height = 270
  const left = 55
  const right = 18
  const top = 16
  const bottom = 40
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const max = Math.max(...data.map((item) => item.value), 1)
  const points = data.map((item, index) => {
    const x = left + (plotWidth / (data.length - 1)) * index
    const y = top + plotHeight - (item.value / max) * plotHeight
    return { ...item, x, y }
  })
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPoints = `${left},${top + plotHeight} ${linePoints} ${width - right},${top + plotHeight}`
  const ticks = [0, 0.33, 0.66, 1]

  return (
    <div className="chart-visual line-chart-visual">
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Purchase cost by year line chart">
        <defs>
          <linearGradient id="spend-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00a7b5" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#00a7b5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => {
          const y = top + plotHeight - plotHeight * tick
          return (
            <g key={tick}>
              <line className="chart-gridline" x1={left} x2={width - right} y1={y} y2={y} />
              <text className="chart-axis-text" x={left - 10} y={y + 4} textAnchor="end">{formatIndianCompactCurrency(max * tick)}</text>
            </g>
          )
        })}
        <polygon points={areaPoints} fill="url(#spend-area)" />
        <polyline className="chart-line" points={linePoints} />
        {points.map((point) => (
          <g key={point.label}>
            <circle className="chart-point" cx={point.x} cy={point.y} r="5.5" />
            <text className="chart-label-text" x={point.x} y={height - 14} textAnchor="middle">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

const indiaNumberFormatter = new Intl.NumberFormat('en-IN')
const indiaCurrencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

function formatIndianNumber(value) {
  return indiaNumberFormatter.format(Number(value) || 0)
}

function formatIndianCurrency(value) {
  return indiaCurrencyFormatter.format(Number(value) || 0)
}

function formatIndianDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || 'Recently'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function dateParts(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() }
  }
  const text = String(value ?? '').trim()
  if (!text) return null
  const displayMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/)
  const dashDisplayMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  const match = displayMatch || isoMatch || dashDisplayMatch
  if (!match) return null
  const [first, second, third] = match.slice(1).map(Number)
  const year = isoMatch ? first : third
  const month = second
  const day = isoMatch ? third : first
  const date = new Date(Date.UTC(year, month - 1, day))
  if (year < 1900 || year > 2200 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return { year, month, day }
}

function formatDateDisplay(value) {
  const parts = dateParts(value)
  return parts ? `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}/${parts.year}` : ''
}

function toIsoDate(value) {
  const parts = dateParts(value)
  return parts ? `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}` : null
}

function dateIsInvalid(value) {
  return Boolean(String(value || '').trim()) && !dateParts(value)
}

function formatIndianCompactCurrency(value) {
  const amount = Number(value) || 0
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}k`
  return formatIndianCurrency(amount)
}

function dashboardDataFromApi(payload) {
  const source = payload.stats || payload
  if (source.totalLaptops === undefined) return null
  const totalLaptops = Number(source.totalLaptops) || 0
  const totalEmployees = Number(source.totalEmployees) || 0
  const totalVendors = Number(source.totalVendors) || 0
  const totalSpend = Number(source.totalPurchaseValue ?? source.totalSpend) || 0
  const averageAge = Number(source.averageAge) || 0
  const mapChart = (items = []) => items.map((item) => ({ label: item.label ?? item.name, value: Number(item.value ?? item.count) || 0, tone: item.tone }))
  return {
    totals: { totalLaptops, totalEmployees, totalVendors, totalSpend },
    stats: [
      { label: 'Laptops', value: formatIndianNumber(totalLaptops), detail: `Avg age ${averageAge.toFixed(1)} yrs`, icon: 'laptop', tone: 'cyan' },
      { label: 'Employees', value: formatIndianNumber(totalEmployees), detail: `${formatIndianNumber(Number(source.assignedEmployees) || 0)} with assigned devices`, icon: 'users', tone: 'blue' },
      { label: 'Vendors', value: formatIndianNumber(totalVendors), detail: 'All contracts active', icon: 'building', tone: 'orange' },
      { label: 'Total spend', value: formatIndianCurrency(totalSpend), detail: `${formatIndianNumber(Number(source.purchaseCount) || totalLaptops)} purchases`, icon: 'wallet', tone: 'purple' },
    ],
    brandData: mapChart(payload.brandData),
    ageData: mapChart(payload.ageData),
    spendData: mapChart(payload.spendData),
    statusData: mapChart(payload.statusData),
    locationData: mapChart(payload.locationData),
    recentActivity: payload.recentActivity?.length
      ? payload.recentActivity.map((item) => ({ ...item, time: formatIndianDateTime(item.time) }))
      : [],
  }
}

function formatTableDate(value, key) {
  if (!value || !/(date|created|timestamp|lastseen|updated)/i.test(key)) return value
  const display = formatDateDisplay(value)
  if (display) return display
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed)
}

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    let active = true
    const loadDashboard = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE}/admin/dashboard`, { headers: apiHeaders() })
        if (!response.ok) throw new Error('Dashboard API unavailable')
        const apiData = dashboardDataFromApi(await response.json())
        if (!apiData) throw new Error('Dashboard response was invalid')
        if (active) {
          setDashboardData(apiData)
          setError('')
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load dashboard data')
      } finally {
        if (active) {
          setLoading(false)
          setLastUpdated(new Date())
        }
      }
    }
    loadDashboard()
    return () => { active = false }
  }, [refreshKey])

  useEffect(() => {
    const handleInventoryChange = () => setRefreshKey((current) => current + 1)
    window.addEventListener('inventory:changed', handleInventoryChange)
    const poll = window.setInterval(() => setRefreshKey((current) => current + 1), 15000)
    return () => {
      window.removeEventListener('inventory:changed', handleInventoryChange)
      window.clearInterval(poll)
    }
  }, [])

  if (!dashboardData && (loading || error)) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Real-time view of the India fleet, people, and spend." icon="dashboard">
          <button className="button button-secondary" onClick={() => setRefreshKey((current) => current + 1)} disabled={loading}><Icon name="refresh" size={15} /> {loading ? 'Refreshing...' : 'Retry'}</button>
        </PageHeader>
        <div className={`dashboard-state ${error ? 'dashboard-state-error' : ''}`}><Icon name={error ? 'issue' : 'database'} size={21} /><strong>{error || 'Loading database metrics...'}</strong><span>{error ? 'The dashboard does not display fallback or sample values.' : 'Reading the latest values from the server database.'}</span></div>
      </>
    )
  }

  if (!dashboardData) return null
  const { totals } = dashboardData
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time view of the India fleet, people, and spend."
        icon="dashboard"
      >
        <div className="location-chip"><Icon name="globe" size={15} /> India region</div>
        <button className="button button-secondary" onClick={() => setRefreshKey((current) => current + 1)} disabled={loading} title={`Last updated ${lastUpdated.toLocaleTimeString('en-IN')}`}><Icon name="refresh" size={15} /> {loading ? 'Refreshing...' : 'Refresh'}</button>
      </PageHeader>

      <div className="metric-grid">
        {dashboardData.stats.map((stat) => <MetricCard key={stat.label} {...stat} />)}
      </div>

      <div className="dashboard-grid">
        <Panel title="Brand-wise laptop count">
          <BarChart data={dashboardData.brandData} tone="cyan" />
        </Panel>
        <Panel title="Laptop age distribution">
          <BarChart data={dashboardData.ageData} tone="orange" />
        </Panel>
        <Panel title="Purchase cost by year" className="panel-wide">
          <LineChart data={dashboardData.spendData} />
        </Panel>
        <Panel title="Fleet by location" subtitle="Current asset distribution">
          <div className="distribution-list">
            {dashboardData.locationData.map((item, index) => (
              <div className="distribution-row" key={item.label}>
                <div className="distribution-label"><span className={`distribution-dot dot-${index}`} />{item.label}</div>
                <div className="distribution-value"><strong>{item.value}</strong><span>{totals.totalLaptops ? Math.round((item.value / totals.totalLaptops) * 100) : 0}%</span></div>
                <div className="distribution-track"><span style={{ width: `${totals.totalLaptops ? (item.value / totals.totalLaptops) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Asset status" subtitle="Availability at a glance">
          <div className="status-overview">
            {dashboardData.statusData.map((item) => (
              <div className="status-overview-item" key={item.label}>
                <div className={`status-overview-icon tone-${item.tone}`}><Icon name={item.label === 'Assigned' ? 'laptop' : item.label === 'Available' ? 'check' : item.label === 'Under repair' ? 'settings' : 'archive'} size={17} /></div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent activity" subtitle="Latest changes in the console" className="panel-wide">
          <div className="activity-list">
             {dashboardData.recentActivity.length ? dashboardData.recentActivity.map((item) => (
              <div className="activity-row" key={`${item.action}-${item.time}`}>
                <div className={`activity-icon tone-${item.tone}`}><Icon name={item.action.includes('Laptop') ? 'laptop' : item.action.includes('Vendor') ? 'building' : item.action.includes('Issue') ? 'check' : 'database'} size={16} /></div>
                <div className="activity-copy"><strong>{item.action}</strong><span>{item.detail}</span></div>
                <time>{item.time}</time>
              </div>
             )) : <div className="empty-activity">No database activity has been recorded yet.</div>}
          </div>
        </Panel>
      </div>
    </>
  )
}

function TableCard({ columns, rows, emptyMessage = 'No records found.' }) {
  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="empty-cell" colSpan={columns.length}>{emptyMessage}</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : formatTableDate(row[column.key], column.key)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer"><span>Showing {rows.length} sample records</span><span className="table-footer-location"><Icon name="globe" size={13} /> India region</span></div>
    </div>
  )
}

const laptopSearchFields = [
  'employee', 'machineName', 'brand', 'model', 'serialNumber', 'processor', 'ram',
  'storageType', 'storageCapacity', 'operatingSystem', 'office', 'antivirus', 'state', 'location',
]

const laptopViewModes = [
  { key: 'table', label: 'Table', icon: 'list' },
  { key: 'cards', label: 'Cards', icon: 'grid' },
  { key: 'compact', label: 'Compact', icon: 'list' },
  { key: 'detailed', label: 'Detailed', icon: 'detail' },
]

const csvTemplateHeaders = [
  'Employee Name', 'Machine', 'Username', 'Password/Email', 'Brand', 'Model', 'Processor', 'RAM',
  'Storage Type', 'Storage Capacity', 'Serial Number', 'Operating System', 'Office', 'Antivirus',
  'Purchase Price', 'Purchase Date', 'Handover Date', 'Status', 'Vendor',
]

function calculateLaptopAge(purchaseDate) {
  const parts = dateParts(purchaseDate)
  if (!parts) return '0.0'
  return Math.max(0, (Date.now() - Date.UTC(parts.year, parts.month - 1, parts.day)) / 31557600000).toFixed(1)
}

function stateFromStatus(status) {
  const normalizedStatus = String(status || '').toLowerCase()
  if (normalizedStatus.includes('repair')) return 'In Repair'
  if (normalizedStatus.includes('damage')) return 'Needs Attention'
  if (normalizedStatus.includes('spare') || normalizedStatus.includes('available')) return 'In Spare'
  if (normalizedStatus.includes('retir')) return 'Retired'
  return 'Working Fine'
}

function statusFromState(state) {
  if (state === 'In Spare') return 'Spare'
  if (state === 'In Repair') return 'Under Repair'
  if (state === 'Needs Attention') return 'Damaged'
  if (state === 'Retired') return 'Retired'
  return 'Assigned'
}

function parsePurchasePrice(value) {
  if (value === null || value === undefined || value === '') return null
  const numericValue = Number(String(value).replace(/[₹,\s]/g, ''))
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null
}

function formatPurchasePriceInput(value) {
  const numericValue = parsePurchasePrice(value)
  return numericValue === null ? '' : `₹${numericValue.toLocaleString('en-IN')}`
}

function displayPurchasePrice(value) {
  const numericValue = parsePurchasePrice(value)
  return numericValue === null ? '—' : formatIndianCurrency(numericValue)
}

function normalizeLaptop(source, index = 0) {
  const sourceEmployee = source.employeeName || source.employee || source.employeeId
  const employee = sourceEmployee && sourceEmployee !== 'Unassigned' ? sourceEmployee : 'In Spare'
  const storageType = String(source.storageType || (String(source.ssd || '').toLowerCase().includes('hdd') ? 'HDD' : String(source.ssd || '').trim() ? 'SSD' : '')).toUpperCase()
  const storageCapacity = source.storageCapacity || String(source.ssd || '').replace(/\b(ssd|hdd)\b/i, '').trim()
  const operatingSystem = source.operatingSystem || ''
  const office = source.office ?? source.msOffice365 ?? ''
  const state = source.state || stateFromStatus(source.status)
  const username = source.username || ''
  const passwordEmail = source.passwordEmail || ''

  return {
    ...source,
    id: source.id || `LAP-${String(index + 1).padStart(3, '0')}`,
    backendId: source.backendId || (typeof source.id === 'number' ? source.id : undefined),
    employee,
    employeeId: source.employeeId || '',
    machineName: source.machineName || '',
    username,
    passwordEmail,
    brand: source.brand || '',
    model: source.model || '',
    processor: source.processor || '',
    ram: source.ram || source.memory || '',
    storageType,
    storageCapacity,
    serialNumber: source.serialNumber || '',
    operatingSystem,
    office,
    antivirus: source.antivirus || '',
    purchaseDate: formatDateDisplay(source.purchaseDate),
    purchasePrice: parsePurchasePrice(source.purchasePrice),
    handedOverDate: formatDateDisplay(source.handedOverDate),
    warrantyExpiry: formatDateDisplay(source.warrantyExpiry),
    age: calculateLaptopAge(source.purchaseDate),
    state,
    status: source.status || statusFromState(state),
    vendorId: source.vendorId || '',
    vendorName: source.vendorName || source.vendorId || '',
    location: source.location || 'India HQ',
    department: source.department || '',
  }
}

function emptyLaptopForm() {
  return {
    employeeId: '',
    machineName: '',
    username: '',
    passwordEmail: '',
    brand: '',
    model: '',
    serialNumber: '',
    processor: '',
    ram: '',
    storageType: 'SSD',
    storageCapacity: '',
    operatingSystem: 'Windows 11',
    office: 'Microsoft 365',
    antivirus: 'Yes',
    purchaseDate: '',
    purchasePrice: '',
    handedOverDate: '',
    state: 'Working Fine',
    vendorId: '',
    location: 'India HQ',
    assetCode: '',
    invoiceNumber: '',
    warrantyExpiry: '',
    handedOverBy: '',
    handoverCondition: '',
    topApps: '',
    gpu: '',
    displaySize: '',
  }
}

function laptopToForm(laptop) {
  return {
    employeeId: laptop.employeeId || '',
    machineName: laptop.machineName,
    username: laptop.username,
    passwordEmail: laptop.passwordEmail,
    brand: laptop.brand,
    model: laptop.model,
    serialNumber: laptop.serialNumber,
    processor: laptop.processor,
    ram: laptop.ram,
    storageType: laptop.storageType,
    storageCapacity: laptop.storageCapacity,
    operatingSystem: laptop.operatingSystem,
    office: laptop.office,
    antivirus: laptop.antivirus,
    purchaseDate: laptop.purchaseDate,
    purchasePrice: laptop.purchasePrice === null || laptop.purchasePrice === undefined ? '' : String(laptop.purchasePrice),
    handedOverDate: laptop.handedOverDate,
    warrantyExpiry: laptop.warrantyExpiry || '',
    state: laptop.state,
    vendorId: laptop.vendorId || '',
    location: laptop.location,
    assetCode: laptop.assetCode || '',
    invoiceNumber: laptop.invoiceNumber || '',
    handedOverBy: laptop.handedOverBy || '',
    handoverCondition: laptop.handoverCondition || '',
    topApps: laptop.topApps || '',
    gpu: laptop.gpu || '',
    displaySize: laptop.displaySize || '',
  }
}

function laptopApiPayload(laptop) {
  return {
    machineName: laptop.machineName,
    brand: laptop.brand,
    model: laptop.model,
    serialNumber: laptop.serialNumber,
    assetCode: laptop.assetCode || laptop.machineName,
    employeeId: laptop.employeeId || null,
    vendorId: laptop.vendorId || null,
    status: laptop.status || statusFromState(laptop.state),
    processor: laptop.processor || '',
    memory: laptop.ram || '',
    ssd: [laptop.storageCapacity, laptop.storageType].filter(Boolean).join(' '),
    storageType: laptop.storageType || '',
    storageCapacity: laptop.storageCapacity || '',
    gpu: laptop.gpu || '',
    displaySize: laptop.displaySize || '',
    operatingSystem: laptop.operatingSystem,
    msOffice365: laptop.office,
    antivirus: laptop.antivirus,
    username: laptop.username || '',
    passwordEmail: laptop.passwordEmail || '',
    topApps: laptop.topApps || '',
    purchaseDate: toIsoDate(laptop.purchaseDate),
    purchasePrice: parsePurchasePrice(laptop.purchasePrice),
    invoiceNumber: laptop.invoiceNumber || '',
    warrantyExpiry: toIsoDate(laptop.warrantyExpiry),
    handedOverDate: toIsoDate(laptop.handedOverDate),
    handedOverBy: laptop.handedOverBy || '',
    handoverCondition: laptop.handoverCondition || '',
    location: laptop.location || 'India HQ',
  }
}

function laptopFieldValue(laptop, field) {
  if (field === 'purchasePrice') return formatPurchasePriceInput(laptop.purchasePrice)
  return String(laptop[field] ?? '')
}

function parseCsvRows(text) {
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]
    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      row.push(value.trim())
      value = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1
      row.push(value.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      value = ''
    } else {
      value += character
    }
  }

  if (value || row.length) {
    row.push(value.trim())
    if (row.some(Boolean)) rows.push(row)
  }

  if (rows.length < 2) return []
  const headers = rows.shift().map((header) => header.toLowerCase().replace(/[^a-z0-9]+/g, ''))
  return rows.map((values) => headers.reduce((record, header, index) => ({ ...record, [header]: values[index] || '' }), {}))
}

function importedLaptopFromRow(row) {
  const get = (names) => names.map((name) => row[name]).find(Boolean) || ''

  return {
    employeeName: get(['employee', 'employeename', 'employeeid']),
    machineName: get(['machine', 'machinename', 'asset', 'assetcode']),
    username: get(['username', 'user']),
    passwordEmail: get(['passwordemail', 'password', 'email', 'passwordemailaddress']),
    brand: get(['brand']),
    model: get(['model']),
    processor: get(['processor', 'cpu']),
    ram: get(['ram', 'memory']),
    storageType: get(['storagetype', 'disktype']),
    storageCapacity: get(['storagecapacity', 'diskcapacity']),
    serialNumber: get(['serial', 'serialnumber']),
    operatingSystem: get(['os', 'operatingsystem']),
    office: get(['office', 'msoffice365']),
    antivirus: get(['antivirus']),
    purchaseDate: get(['purchase', 'purchasedate']),
    purchasePrice: get(['purchaseprice', 'price', 'purchasecost', 'cost']),
    handedOverDate: get(['handover', 'handedoverdate']),
    state: get(['state', 'status']) || 'Working Fine',
    vendorName: get(['vendor', 'vendorname']),
  }
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function downloadTextFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]))
}

function LaptopField({ label, children, full = false, hint = '' }) {
  return <label className={`laptop-form-field ${full ? 'laptop-form-field-full' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

function LaptopFormSection({ title, icon, children }) {
  return <section className="laptop-form-section"><div className="laptop-form-section-heading"><span className="laptop-form-section-icon"><Icon name={icon} size={16} /></span><div><h3>{title}</h3><p>Keep this part of the asset record complete.</p></div></div><div className="laptop-form-grid">{children}</div></section>
}

function LaptopActionButtons({ row, onEdit, onDelete }) {
  return <div className="laptop-row-actions"><button className="laptop-action edit-action" onClick={() => onEdit(row)} aria-label={`Edit ${row.machineName}`} title="Edit laptop"><Icon name="edit" size={16} /></button><button className="laptop-action delete-action" onClick={() => onDelete(row)} aria-label={`Delete ${row.machineName}`} title="Delete laptop"><Icon name="trash" size={16} /></button></div>
}

function LaptopIdentity({ row, detailed = false }) {
  return <div className={`laptop-identity ${detailed ? 'laptop-identity-detailed' : ''}`}><div className="laptop-device-icon"><Icon name="laptop" size={20} /></div><div><strong>{row.machineName || 'Unnamed asset'}</strong><span>{row.brand} {row.model}</span>{detailed && <small>{row.serialNumber || 'No serial number'}</small>}</div></div>
}

function LaptopSpecGrid({ row, detailed = false }) {
  const fields = [
    ['CPU', row.processor], ['RAM', row.ram], ['Storage', [row.storageCapacity, row.storageType].filter(Boolean).join(' / ')],
    ['OS', row.operatingSystem], ['Office', row.office], ['Antivirus', row.antivirus],
  ]
  return <div className={`laptop-spec-grid ${detailed ? 'laptop-spec-grid-detailed' : ''}`}>{fields.map(([label, value]) => <div className="laptop-spec-item" key={label}><span>{label}</span><strong>{value || '—'}</strong></div>)}</div>
}

function LaptopManagementPage() {
  const [laptopRows, setLaptopRows] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [vendorOptions, setVendorOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [brandFilter, setBrandFilter] = useState('All')
  const [sortField, setSortField] = useState('none')
  const [sortDirection, setSortDirection] = useState('asc')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('isg-laptop-view') || 'table')
  const [modalOpen, setModalOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingBackendId, setEditingBackendId] = useState(null)
  const [form, setForm] = useState(emptyLaptopForm)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('success')
  const fileInputRef = useRef(null)

  const loadRows = async () => {
    const response = await fetch(`${API_BASE}/laptops`, { headers: apiHeaders() })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Laptop API unavailable')
    if (!Array.isArray(data)) throw new Error('Laptop API returned an invalid response')
    setLaptopRows(data.map(normalizeLaptop))
    return data
  }

  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`${API_BASE}/laptops`, { headers: apiHeaders() }),
      fetch(`${API_BASE}/employees`, { headers: apiHeaders() }),
      fetch(`${API_BASE}/vendors`, { headers: apiHeaders() }),
    ])
      .then(async ([laptopResponse, employeeResponse, vendorResponse]) => {
        const [laptopData, employeeData, vendorData] = await Promise.all([laptopResponse.json(), employeeResponse.json(), vendorResponse.json()])
        if (!laptopResponse.ok || !employeeResponse.ok || !vendorResponse.ok) throw new Error(laptopData.error || employeeData.error || vendorData.error || 'Inventory API unavailable')
        if (!active) return
        setLaptopRows(Array.isArray(laptopData) ? laptopData.map(normalizeLaptop) : [])
        setEmployeeOptions(Array.isArray(employeeData) ? employeeData : [])
        setVendorOptions(Array.isArray(vendorData) ? vendorData : [])
        setDataError('')
      })
      .catch((error) => {
        if (active) setDataError(error.message || 'Unable to load laptop data from the database')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    localStorage.setItem('isg-laptop-view', viewMode)
  }, [viewMode])

  const brandOptions = [...new Set(laptopRows.map((row) => row.brand).filter(Boolean))].sort()
  const activeFilterCount = (statusFilter !== 'All' ? 1 : 0) + (brandFilter !== 'All' ? 1 : 0) + (sortField !== 'none' ? 1 : 0)
  const visibleRows = laptopRows
    .filter((row) => {
      const searchableText = laptopSearchFields.map((field) => laptopFieldValue(row, field)).join(' ').toLowerCase()
      return searchableText.includes(query.trim().toLowerCase()) && (statusFilter === 'All' || row.state === statusFilter) && (brandFilter === 'All' || row.brand === brandFilter)
    })
    .sort((first, second) => {
      if (sortField === 'none') return 0
      const firstValue = sortField === 'purchasePrice' ? Number(first.purchasePrice) || 0 : sortField === 'purchaseDate' ? toIsoDate(first.purchaseDate) || '' : laptopFieldValue(first, sortField)
      const secondValue = sortField === 'purchasePrice' ? Number(second.purchasePrice) || 0 : sortField === 'purchaseDate' ? toIsoDate(second.purchaseDate) || '' : laptopFieldValue(second, sortField)
      const comparison = typeof firstValue === 'number' ? firstValue - secondValue : String(firstValue).localeCompare(String(secondValue), undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const setFormValue = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const setPriceValue = (event) => setForm((current) => ({ ...current, purchasePrice: event.target.value.replace(/[^0-9]/g, '') }))
  const normalizeFormDate = (name) => setForm((current) => ({ ...current, [name]: formatDateDisplay(current[name]) || current[name] }))

  const openAddModal = () => {
    setEditingId(null)
    setEditingBackendId(null)
    setForm(emptyLaptopForm())
    setNotice('')
    setModalOpen(true)
  }

  const openEditModal = (laptop) => {
    setEditingId(laptop.id)
    setEditingBackendId(laptop.backendId || (typeof laptop.id === 'number' ? laptop.id : null))
    setForm(laptopToForm(laptop))
    setNotice('')
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

  const handleSave = async (event) => {
    event.preventDefault()
    if (!form.machineName.trim() || !form.serialNumber.trim() || !form.brand.trim() || !form.model.trim()) {
      setNoticeType('error')
      setNotice('Machine, brand, model, and serial number are required.')
      return
    }
    if (parsePurchasePrice(form.purchasePrice) === null) {
      setNoticeType('error')
      setNotice('Laptop price must be a valid non-negative number in Indian rupees.')
      return
    }
    if (dateIsInvalid(form.purchaseDate) || dateIsInvalid(form.handedOverDate) || dateIsInvalid(form.warrantyExpiry)) {
      setNoticeType('error')
      setNotice('Purchase and handover dates must use DD/MM/YYYY.')
      return
    }
    const duplicateSerial = laptopRows.some((row) => row.serialNumber.toLowerCase() === form.serialNumber.trim().toLowerCase() && row.id !== editingId)
    if (duplicateSerial) {
      setNoticeType('error')
      setNotice('That serial number is already registered.')
      return
    }

    const selectedEmployee = employeeOptions.find((employee) => employee.employeeId === form.employeeId)
    const nextLaptop = normalizeLaptop({
      ...form,
      id: editingId || undefined,
      employeeId: form.employeeId,
      employeeName: selectedEmployee?.fullName || 'In Spare',
      status: statusFromState(form.state),
    })

    try {
      const endpoint = editingBackendId ? `${API_BASE}/laptops/${editingBackendId}` : `${API_BASE}/laptops`
      const response = await fetch(endpoint, {
        method: editingBackendId ? 'PUT' : 'POST',
        headers: apiHeaders(true),
        body: JSON.stringify(laptopApiPayload(nextLaptop)),
      })
      const responseData = await response.json()
      if (!response.ok) throw new Error(responseData.error || 'The laptop could not be saved')
      await loadRows()
      window.dispatchEvent(new CustomEvent('inventory:changed'))
      setNoticeType('success')
      setNotice(editingId ? `${responseData.machineName} was updated in the database.` : `${responseData.machineName} was added to the database.`)
      setModalOpen(false)
    } catch (error) {
      setNoticeType('error')
      setNotice(error.message || 'The laptop could not be saved.')
    }
  }

  const handleDelete = async (laptop) => {
    if (!window.confirm(`Delete ${laptop.machineName}? This cannot be undone.`)) return
    try {
      const backendId = laptop.backendId || (typeof laptop.id === 'number' ? laptop.id : null)
      if (!backendId) throw new Error('This record has no database identifier.')
      const response = await fetch(`${API_BASE}/laptops/${backendId}`, { method: 'DELETE', headers: apiHeaders() })
      const responseData = await response.json()
      if (!response.ok) throw new Error(responseData.error || 'The laptop could not be deleted')
      await loadRows()
      window.dispatchEvent(new CustomEvent('inventory:changed'))
      setNoticeType('success')
      setNotice(`${laptop.machineName} was deleted from the database.`)
    } catch (error) {
      setNoticeType('error')
      setNotice(error.message || 'The laptop could not be deleted.')
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setNoticeType('error')
      setNotice('CSV files only are supported. Download the sample template before importing.')
      return
    }

    const rows = parseCsvRows(await file.text())
    if (!rows.length) {
      setNoticeType('error')
      setNotice('The CSV has no data rows or a readable header row.')
      return
    }

    const existingSerials = new Set(laptopRows.map((row) => row.serialNumber.toLowerCase()))
    const fileSerials = new Set()
    const importedRows = []
    const validationErrors = []
    let skipped = 0
    rows.forEach((row, index) => {
      const rowNumber = index + 2
      const imported = importedLaptopFromRow(row)
      const serial = imported.serialNumber.trim().toLowerCase()
      if (!imported.machineName || !imported.brand || !imported.model || !imported.serialNumber) {
        validationErrors.push(`Row ${rowNumber}: Machine, Brand, Model, and Serial Number are required.`)
        return
      }
      if (dateIsInvalid(imported.purchaseDate) || dateIsInvalid(imported.handedOverDate)) {
        validationErrors.push(`Row ${rowNumber}: dates must use DD/MM/YYYY.`)
        return
      }
      if (imported.purchasePrice && parsePurchasePrice(imported.purchasePrice) === null) {
        validationErrors.push(`Row ${rowNumber}: Purchase Price must be a number such as 65000 or ₹65,000.`)
        return
      }
      if (imported.storageType && !['ssd', 'hdd'].includes(imported.storageType.toLowerCase())) {
        validationErrors.push(`Row ${rowNumber}: Storage Type must be SSD or HDD.`)
        return
      }
      if (fileSerials.has(serial) || existingSerials.has(serial)) {
        skipped += 1
        return
      }
      fileSerials.add(serial)
      const employee = employeeOptions.find((item) => String(item.employeeId || '').toLowerCase() === imported.employeeName.trim().toLowerCase() || String(item.fullName || '').toLowerCase() === imported.employeeName.trim().toLowerCase())
      const vendor = vendorOptions.find((item) => String(item.vendorId || '').toLowerCase() === imported.vendorName.trim().toLowerCase() || String(item.name || '').toLowerCase() === imported.vendorName.trim().toLowerCase())
      if (imported.employeeName && !employee) {
        validationErrors.push(`Row ${rowNumber}: Employee Name does not match an employee ID or full name in the database.`)
        return
      }
      if (imported.vendorName && !vendor) {
        validationErrors.push(`Row ${rowNumber}: Vendor does not match a vendor ID or name in the database.`)
        return
      }
      importedRows.push(normalizeLaptop({ ...imported, employeeId: employee?.employeeId || '', employeeName: employee?.fullName || 'In Spare', vendorId: vendor?.vendorId || '' }, index))
    })

    if (validationErrors.length) {
      setNoticeType('error')
      setNotice(`CSV validation failed: ${validationErrors.slice(0, 3).join(' ')}${validationErrors.length > 3 ? ` ${validationErrors.length - 3} more error(s).` : ''}`)
      return
    }
    if (!importedRows.length) {
      setNoticeType('error')
      setNotice(`No new rows to import. ${skipped} duplicate record(s) were skipped.`)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/laptops/import`, {
        method: 'POST',
        headers: apiHeaders(true),
        body: JSON.stringify({ rows: importedRows.map(laptopApiPayload) }),
      })
      const responseData = await response.json()
      if (!response.ok) {
        const details = responseData.details?.map((item) => `Row ${item.row}: ${item.message}`).join(' ') || responseData.error
        throw new Error(details || 'CSV import failed')
      }
      await loadRows()
      window.dispatchEvent(new CustomEvent('inventory:changed'))
      const backendSkipped = responseData.skipped?.length || 0
      setNoticeType('success')
      setNotice(`${responseData.imported} laptop${responseData.imported === 1 ? '' : 's'} imported successfully${skipped + backendSkipped ? `; ${skipped + backendSkipped} duplicate(s) skipped` : ''}.`)
    } catch (error) {
      setNoticeType('error')
      setNotice(error.message || 'Import failed.')
    }
  }

  const handleTemplateDownload = () => {
    const sample = ['Aarav Sharma', 'IND-IT-001', 'aarav.sharma', 'aarav@company.in', 'Dell', 'Latitude 5440', 'Intel Core i5 12th Gen', '16 GB', 'SSD', '512 GB', 'IN-DELL-000001', 'Windows 11', 'Microsoft 365', 'Yes', '65000', '15/04/2025', '20/04/2025', 'Working Fine', 'Dell Technologies India']
    const content = [csvTemplateHeaders, sample].map((row) => row.map(csvCell).join(',')).join('\r\n')
    downloadTextFile(`\ufeff${content}`, 'laptop-import-template.csv', 'text/csv;charset=utf-8')
    setNoticeType('success')
    setNotice('Sample CSV template downloaded.')
  }

  const handleCsvExport = () => {
    if (!visibleRows.length) {
      setNoticeType('error')
      setNotice('There are no matching laptops to export.')
      return
    }
    const rows = visibleRows.map((row) => [row.employee === 'In Spare' ? '' : row.employee, row.machineName, row.username, row.passwordEmail, row.brand, row.model, row.processor, row.ram, row.storageType, row.storageCapacity, row.serialNumber, row.operatingSystem, row.office, row.antivirus, row.purchasePrice ?? '', row.purchaseDate, row.handedOverDate, row.state, row.vendorName])
    const content = [csvTemplateHeaders, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    downloadTextFile(`\ufeff${content}`, `laptops-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
    setNoticeType('success')
    setNotice(`${visibleRows.length} laptop${visibleRows.length === 1 ? '' : 's'} exported with separate specification fields.`)
  }

  const handlePdfExport = () => {
    if (!visibleRows.length) {
      setNoticeType('error')
      setNotice('There are no matching laptops to export.')
      return
    }
    const printWindow = window.open('', '_blank', 'width=1500,height=900')
    if (!printWindow) {
      setNoticeType('error')
      setNotice('Allow pop-ups to generate the PDF export.')
      return
    }
    const rows = visibleRows.map((row) => `<tr><td>${escapeHtml(row.employee)}</td><td>${escapeHtml(row.machineName)}</td><td>${escapeHtml(`${row.brand} / ${row.model}`)}</td><td>${escapeHtml(row.processor)}</td><td>${escapeHtml(row.ram)}</td><td>${escapeHtml(`${row.storageCapacity} ${row.storageType}`)}</td><td>${escapeHtml(row.operatingSystem)}</td><td>${escapeHtml(row.office)}</td><td>${escapeHtml(displayPurchasePrice(row.purchasePrice))}</td><td>${escapeHtml(row.purchaseDate)}</td><td>${escapeHtml(row.handedOverDate)}</td><td>${escapeHtml(row.state)}</td></tr>`).join('')
    printWindow.document.write(`<!doctype html><html><head><title>India Laptop Inventory</title><style>body{font-family:Arial,sans-serif;color:#17252b;padding:24px}h1{font-size:22px;margin:0 0 5px}p{color:#61747a;font-size:12px;margin:0 0 20px}table{width:100%;border-collapse:collapse;font-size:8px}th,td{border:1px solid #cbd8dc;padding:6px;text-align:left;vertical-align:top}th{background:#eaf2f4;font-size:8px}tr:nth-child(even){background:#f7fafb}@media print{body{padding:0}}</style></head><body><h1>India Laptop Inventory</h1><p>Generated ${escapeHtml(formatDateDisplay(new Date()))} - ${visibleRows.length} records</p><table><thead><tr><th>Employee</th><th>Machine</th><th>Brand / Model</th><th>CPU</th><th>RAM</th><th>Storage</th><th>OS</th><th>Office</th><th>Price</th><th>Purchase</th><th>Handover</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  const renderTableView = () => <div className="laptop-table-card"><div className="laptop-table-scroll"><table className="laptop-table laptop-table-modern"><thead><tr><th>Asset</th><th>Assignment</th><th>Hardware</th><th>Software & security</th><th>Purchase</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{visibleRows.length ? visibleRows.map((row) => <tr key={row.id}><td><LaptopIdentity row={row} /></td><td><div className="laptop-primary-cell"><strong>{row.employee}</strong><span>{row.serialNumber}</span></div></td><td><div className="laptop-table-specs"><span>{row.processor || 'CPU not recorded'}</span><span>{row.ram || 'RAM not recorded'}</span><span>{[row.storageCapacity, row.storageType].filter(Boolean).join(' / ') || 'Storage not recorded'}</span></div></td><td><div className="laptop-table-specs"><span>{row.operatingSystem || 'OS not recorded'}</span><span>Office: {row.office || '—'}</span><span>AV: {row.antivirus || '—'}</span></div></td><td><div className="laptop-primary-cell"><strong>{displayPurchasePrice(row.purchasePrice)}</strong><span>{row.purchaseDate || 'No purchase date'}</span></div></td><td><StatusBadge status={row.state} /></td><td><LaptopActionButtons row={row} onEdit={openEditModal} onDelete={handleDelete} /></td></tr>) : <tr><td className="empty-cell" colSpan="7">{loading ? 'Loading laptops from the database...' : 'No laptops match the current view.'}</td></tr>}</tbody></table></div></div>

  const renderCompactView = () => <div className="laptop-table-card"><div className="laptop-table-scroll"><table className="laptop-table laptop-compact-table"><thead><tr><th>Machine</th><th>Employee</th><th>Brand / Model</th><th>Serial</th><th>Price</th><th>Purchase</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{visibleRows.length ? visibleRows.map((row) => <tr key={row.id}><td><strong>{row.machineName}</strong></td><td>{row.employee}</td><td>{row.brand} {row.model}</td><td className="serial-cell">{row.serialNumber}</td><td className="purchase-price-cell">{displayPurchasePrice(row.purchasePrice)}</td><td>{row.purchaseDate || '—'}</td><td><StatusBadge status={row.state} /></td><td><LaptopActionButtons row={row} onEdit={openEditModal} onDelete={handleDelete} /></td></tr>) : <tr><td className="empty-cell" colSpan="8">No laptops match the current view.</td></tr>}</tbody></table></div></div>

  const renderCardsView = () => <div className="laptop-card-grid">{visibleRows.length ? visibleRows.map((row) => <article className="laptop-asset-card" key={row.id}><div className="laptop-asset-card-header"><LaptopIdentity row={row} detailed /><StatusBadge status={row.state} /></div><LaptopSpecGrid row={row} /><div className="laptop-asset-meta"><span><Icon name="user" size={14} /> {row.employee}</span><span><Icon name="calendar" size={14} /> {row.purchaseDate || 'No purchase date'}</span><strong>{displayPurchasePrice(row.purchasePrice)}</strong></div><div className="laptop-asset-card-footer"><span>{row.location}</span><LaptopActionButtons row={row} onEdit={openEditModal} onDelete={handleDelete} /></div></article>) : <div className="laptop-empty-card">{loading ? 'Loading laptops from the database...' : 'No laptops match the current view.'}</div>}</div>

  const renderDetailedView = () => <div className="laptop-detailed-list">{visibleRows.length ? visibleRows.map((row) => <article className="laptop-detailed-card" key={row.id}><div className="laptop-detailed-header"><LaptopIdentity row={row} detailed /><div className="laptop-detailed-actions"><StatusBadge status={row.state} /><LaptopActionButtons row={row} onEdit={openEditModal} onDelete={handleDelete} /></div></div><div className="laptop-detail-sections"><div><h4>Hardware specifications</h4><LaptopSpecGrid row={row} detailed /></div><div><h4>Purchase and assignment</h4><div className="laptop-detail-facts"><span><small>Employee</small><strong>{row.employee}</strong></span><span><small>Vendor</small><strong>{row.vendorName || '—'}</strong></span><span><small>Price</small><strong>{displayPurchasePrice(row.purchasePrice)}</strong></span><span><small>Purchase date</small><strong>{row.purchaseDate || '—'}</strong></span><span><small>Handover date</small><strong>{row.handedOverDate || '—'}</strong></span><span><small>Serial number</small><strong>{row.serialNumber || '—'}</strong></span></div></div></div></article>) : <div className="laptop-empty-card">{loading ? 'Loading laptops from the database...' : 'No laptops match the current view.'}</div>}</div>

  return (
    <>
      <PageHeader title="Laptop Management" subtitle={`${laptopRows.length} database-connected assets across the India fleet.`} icon="laptop">
        <div className="laptop-header-actions">
          <input ref={fileInputRef} className="hidden-file-input" type="file" accept=".csv,text/csv" onChange={handleImport} />
          <button className="button button-secondary" onClick={() => setHelpOpen(true)}><Icon name="file" size={15} /> CSV help</button>
          <button className="button button-secondary" onClick={handleTemplateDownload}><Icon name="download" size={15} /> Template</button>
          <button className="button button-secondary" onClick={() => fileInputRef.current?.click()}><Icon name="upload" size={15} /> Import</button>
          <button className="button button-secondary" onClick={handleCsvExport}><Icon name="download" size={15} /> CSV</button>
          <button className="button button-secondary" onClick={handlePdfExport}><Icon name="file" size={15} /> PDF</button>
          <button className="button button-primary" onClick={openAddModal}><Icon name="plus" size={16} /> Add laptop</button>
        </div>
      </PageHeader>

      {dataError && <div className="notice-bar laptop-notice notice-error"><Icon name="issue" size={15} />{dataError}<button onClick={() => window.location.reload()}>Retry</button></div>}
      {notice && <div className={`notice-bar laptop-notice ${noticeType === 'error' ? 'notice-error' : ''}`}><Icon name={noticeType === 'error' ? 'issue' : 'check'} size={15} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification">Dismiss</button></div>}

      <section className="laptop-command-bar" aria-label="Laptop workspace controls">
        <label className="laptop-search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the asset register..." aria-label="Search laptops" /></label>
        <span className="laptop-results-count"><strong>{visibleRows.length}</strong> of {laptopRows.length} assets</span>
        <button className={`laptop-refine-button ${filtersOpen || activeFilterCount ? 'is-active' : ''}`} onClick={() => setFiltersOpen((open) => !open)}><Icon name="filter" size={15} /> Refine{activeFilterCount ? ` (${activeFilterCount})` : ''}</button>
        <div className="laptop-view-switcher" aria-label="Laptop view switcher">{laptopViewModes.map((mode) => <button key={mode.key} className={viewMode === mode.key ? 'is-active' : ''} onClick={() => setViewMode(mode.key)} aria-label={`${mode.label} view`} title={`${mode.label} view`}><Icon name={mode.icon} size={15} /><span>{mode.label}</span></button>)}</div>
      </section>

      {filtersOpen && <section className="laptop-refine-panel"><div><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Working Fine</option><option>In Spare</option><option>In Repair</option><option>Needs Attention</option><option>Retired</option></select></div><div><span>Brand</span><select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}><option>All</option>{brandOptions.map((brand) => <option key={brand}>{brand}</option>)}</select></div><div><span>Sort by</span><select value={sortField} onChange={(event) => setSortField(event.target.value)}><option value="none">Recently updated</option><option value="machineName">Machine</option><option value="employee">Employee</option><option value="brand">Brand</option><option value="purchaseDate">Purchase date</option><option value="purchasePrice">Laptop price</option></select></div><button className="sort-direction" onClick={() => setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')}><Icon name="refresh" size={14} /> {sortDirection === 'asc' ? 'Ascending' : 'Descending'}</button><button className="text-button" onClick={() => { setStatusFilter('All'); setBrandFilter('All'); setSortField('none'); setSortDirection('asc') }}>Clear all</button></section>}

      <div className="laptop-results-meta"><span><Icon name="database" size={13} /> Changes save directly to the inventory database</span><span><Icon name="globe" size={13} /> DD/MM/YYYY dates</span></div>
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'cards' && renderCardsView()}
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'detailed' && renderDetailedView()}

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section className="laptop-modal laptop-modal-modern" role="dialog" aria-modal="true" aria-labelledby="laptop-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><p className="eyebrow">India fleet register</p><h2 id="laptop-modal-title">{editingId ? 'Edit laptop' : 'Add laptop'}</h2><span>Every specification is stored as its own database field.</span></div><button className="drawer-close" onClick={closeModal} aria-label="Close laptop form">&times;</button></div>
            <form onSubmit={handleSave}>
              <LaptopFormSection title="Basic information" icon="laptop">
                <LaptopField label="Machine name"><input name="machineName" value={form.machineName} onChange={setFormValue} placeholder="IND-IT-024" required /></LaptopField>
                <LaptopField label="Brand"><input name="brand" value={form.brand} onChange={setFormValue} placeholder="Dell" required /></LaptopField>
                <LaptopField label="Model"><input name="model" value={form.model} onChange={setFormValue} placeholder="Latitude 5440" required /></LaptopField>
                <LaptopField label="Serial number"><input name="serialNumber" value={form.serialNumber} onChange={setFormValue} placeholder="IN-DELL-000024" required /></LaptopField>
              </LaptopFormSection>
              <LaptopFormSection title="Hardware specifications" icon="server">
                <LaptopField label="Processor / CPU"><input name="processor" value={form.processor} onChange={setFormValue} placeholder="Intel Core i5 12th Gen" /></LaptopField>
                <LaptopField label="RAM"><input name="ram" value={form.ram} onChange={setFormValue} placeholder="16 GB" /></LaptopField>
                <LaptopField label="Storage type"><select name="storageType" value={form.storageType} onChange={setFormValue}><option value="">Select type</option><option>SSD</option><option>HDD</option></select></LaptopField>
                <LaptopField label="Storage capacity"><input name="storageCapacity" value={form.storageCapacity} onChange={setFormValue} placeholder="512 GB" /></LaptopField>
              </LaptopFormSection>
              <LaptopFormSection title="Software and security" icon="shield">
                <LaptopField label="Operating system"><input name="operatingSystem" value={form.operatingSystem} onChange={setFormValue} placeholder="Windows 11" /></LaptopField>
                <LaptopField label="MS Office / Office 365"><select name="office" value={form.office} onChange={setFormValue}><option value="">Not specified</option><option>Microsoft 365</option><option>Office 2021</option><option>Office 2019</option><option>Yes</option><option>No</option><option>No Office</option></select></LaptopField>
                <LaptopField label="Antivirus"><select name="antivirus" value={form.antivirus} onChange={setFormValue}><option value="">Not specified</option><option>Yes</option><option>No</option></select></LaptopField>
              </LaptopFormSection>
              <LaptopFormSection title="Purchase information" icon="wallet">
                <LaptopField label="Laptop price (₹)"><input name="purchasePrice" value={formatPurchasePriceInput(form.purchasePrice)} onChange={setPriceValue} inputMode="numeric" placeholder="₹65,000" required /></LaptopField>
                <LaptopField label="Purchase date" hint="Use DD/MM/YYYY"><input name="purchaseDate" value={form.purchaseDate} onChange={setFormValue} onBlur={() => normalizeFormDate('purchaseDate')} placeholder="15/04/2025" inputMode="numeric" /></LaptopField>
                <LaptopField label="Vendor"><select name="vendorId" value={form.vendorId} onChange={setFormValue}><option value="">Not specified</option>{vendorOptions.map((vendor) => <option value={vendor.vendorId} key={vendor.vendorId}>{vendor.name}</option>)}</select></LaptopField>
              </LaptopFormSection>
              <LaptopFormSection title="Assignment information" icon="users">
                <LaptopField label="Employee"><select name="employeeId" value={form.employeeId} onChange={setFormValue}><option value="">In Spare / Unassigned</option>{employeeOptions.map((employee) => <option value={employee.employeeId} key={employee.employeeId}>{employee.fullName} ({employee.employeeId})</option>)}</select></LaptopField>
                <LaptopField label="Handover date" hint="Use DD/MM/YYYY"><input name="handedOverDate" value={form.handedOverDate} onChange={setFormValue} onBlur={() => normalizeFormDate('handedOverDate')} placeholder="20/04/2025" inputMode="numeric" /></LaptopField>
                <LaptopField label="Laptop status"><select name="state" value={form.state} onChange={setFormValue}><option>Working Fine</option><option>In Spare</option><option>In Repair</option><option>Needs Attention</option><option>Retired</option></select></LaptopField>
              </LaptopFormSection>
              <LaptopFormSection title="Access details" icon="user">
                <LaptopField label="Username"><input name="username" value={form.username} onChange={setFormValue} placeholder="aarav.sharma" /></LaptopField>
                <LaptopField label="Password / Email"><input name="passwordEmail" value={form.passwordEmail} onChange={setFormValue} placeholder="aarav@company.in" /></LaptopField>
              </LaptopFormSection>
              <div className="modal-footer"><button className="button button-secondary" type="button" onClick={closeModal}>Cancel</button><button className="button button-primary" type="submit"><Icon name="save" size={16} /> {editingId ? 'Save changes' : 'Add laptop'}</button></div>
            </form>
          </section>
        </div>
      )}

      {helpOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setHelpOpen(false)}><section className="csv-help-modal" role="dialog" aria-modal="true" aria-labelledby="csv-help-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">Validated import</p><h2 id="csv-help-title">CSV import instructions</h2><span>Prepare one laptop per row. Validation runs before anything is written.</span></div><button className="drawer-close" onClick={() => setHelpOpen(false)} aria-label="Close CSV help">&times;</button></div><div className="csv-help-content"><div className="csv-help-actions"><button className="button button-primary" onClick={handleTemplateDownload}><Icon name="download" size={15} /> Download sample CSV template</button></div><div className="csv-help-grid"><div><h3>Required columns</h3><p>Machine, Brand, Model, and Serial Number must contain values. Employee Name is optional when the laptop is kept in spare stock.</p><h3>Optional columns</h3><p>Username, Password/Email, Processor, RAM, Storage Type, Storage Capacity, Operating System, Office, Antivirus, Purchase Price, Purchase Date, Handover Date, Status, and Vendor.</p><h3>Accepted values</h3><p>Storage Type must be <strong>SSD</strong> or <strong>HDD</strong>. RAM and capacity can be entered as text such as <strong>16 GB</strong> and <strong>512 GB</strong>. Prices can be <strong>65000</strong> or <strong>₹65,000</strong>.</p></div><div><h3>Date and duplicate rules</h3><p>Enter Purchase Date and Handover Date as <strong>DD/MM/YYYY</strong>, for example <strong>15/04/2025</strong>. Blank optional dates remain blank; invalid dates stop the import.</p><p>Employee and Vendor values must match an existing database ID or full name. Existing serial numbers and duplicate serials inside the CSV are skipped and reported. Missing required fields, invalid prices, dates, storage types, employees, or vendors are reported by row and nothing from that invalid import is saved.</p><h3>Column order</h3><code>{csvTemplateHeaders.join(' | ')}</code></div></div></div></section></div>}
    </>
  )
}

const employeeColumns = [
  { key: 'fullName', label: 'Employee', render: (row) => <div className="primary-cell"><strong>{row.fullName}</strong><span>{row.id}</span></div> },
  { key: 'email', label: 'Email' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'device', label: 'Assigned device', render: (row) => row.device === 'Unassigned' ? <span className="muted-value">Unassigned</span> : row.device },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'actions', label: '', render: () => <button className="row-action" aria-label="More employee actions"><Icon name="more" size={17} /></button> },
]

const vendorColumns = [
  { key: 'name', label: 'Vendor', render: (row) => <div className="primary-cell"><strong>{row.name}</strong><span>{row.id}</span></div> },
  { key: 'contactPerson', label: 'Contact' },
  { key: 'email', label: 'Email' },
  { key: 'category', label: 'Category' },
  { key: 'devices', label: 'Assets supplied' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'actions', label: '', render: () => <button className="row-action" aria-label="More vendor actions"><Icon name="more" size={17} /></button> },
]

const issueColumns = [
  { key: 'id', label: 'Issue' },
  { key: 'title', label: 'Summary', render: (row) => <div className="primary-cell"><strong>{row.title}</strong><span>{row.asset}</span></div> },
  { key: 'reporter', label: 'Reported by' },
  { key: 'priority', label: 'Priority', render: (row) => <StatusBadge status={row.priority} /> },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'actions', label: '', render: () => <button className="row-action" aria-label="More issue actions"><Icon name="more" size={17} /></button> },
]

const reportColumns = [
  { key: 'name', label: 'Report', render: (row) => <div className="primary-cell"><strong>{row.name}</strong><span>{row.description}</span></div> },
  { key: 'type', label: 'Type' },
  { key: 'updated', label: 'Last updated' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'actions', label: '', render: () => <button className="row-action" aria-label="Open report"><Icon name="external" size={16} /></button> },
]

const importColumns = [
  { key: 'file', label: 'File', render: (row) => <div className="primary-cell"><strong>{row.file}</strong><span>{row.type}</span></div> },
  { key: 'records', label: 'Records' },
  { key: 'owner', label: 'Uploaded by' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
]

const backupColumns = [
  { key: 'name', label: 'Backup', render: (row) => <div className="primary-cell"><strong>{row.name}</strong><span>{row.id} - {row.type}</span></div> },
  { key: 'size', label: 'Size' },
  { key: 'created', label: 'Created' },
  { key: 'retention', label: 'Retention' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
]

const auditColumns = [
  { key: 'action', label: 'Action', render: (row) => <div className="primary-cell"><strong>{row.action}</strong><span>{row.module}</span></div> },
  { key: 'record', label: 'Record' },
  { key: 'user', label: 'User' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'source', label: 'Source' },
]

const userColumns = [
  { key: 'name', label: 'User', render: (row) => <div className="primary-cell"><strong>{row.name}</strong><span>{row.email}</span></div> },
  { key: 'role', label: 'Role' },
  { key: 'lastSeen', label: 'Last active' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'actions', label: '', render: () => <button className="row-action" aria-label="More user actions"><Icon name="more" size={17} /></button> },
]

function DataPage({ title, subtitle, icon, data, columns, searchPlaceholder, filterKey, filterOptions, actionLabel }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [notice, setNotice] = useState('')
  const filteredRows = data.filter((row) => {
    const searchableText = columns
      .filter((column) => column.key !== 'actions')
      .map((column) => row[column.key] || '')
      .join(' ')
      .toLowerCase()
    const matchesQuery = searchableText.includes(query.toLowerCase())
    const matchesFilter = !filterKey || filter === 'All' || row[filterKey] === filter
    return matchesQuery && matchesFilter
  })

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} icon={icon}>
        <button className="button button-primary" onClick={() => setNotice(`${actionLabel} form is ready for India records.`)}><Icon name="plus" size={16} /> {actionLabel}</button>
      </PageHeader>
      <div className="data-toolbar">
        <label className="search-field"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} /></label>
        {filterKey && (
          <label className="select-field"><Icon name="filter" size={15} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="All">All statuses</option>{filterOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select><Icon name="chevron" size={14} /></label>
        )}
        <span className="toolbar-count">{filteredRows.length} of {data.length} records</span>
      </div>
      {notice && <div className="notice-bar"><Icon name="check" size={15} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification">Dismiss</button></div>}
      <TableCard columns={columns} rows={filteredRows} />
    </>
  )
}

function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" subtitle="Ready-to-use views for the India IT operation." icon="chart">
        <button className="button button-primary"><Icon name="plus" size={16} /> Create report</button>
      </PageHeader>
      <div className="report-grid">
        {reports.map((report) => (
          <article className="report-card" key={report.id}>
            <div className="report-card-top"><div className="report-icon"><Icon name="file" size={19} /></div><StatusBadge status={report.status} /></div>
            <h2>{report.name}</h2>
            <p>{report.description}</p>
            <div className="report-progress"><div><span>Coverage</span><strong>{report.coverage}%</strong></div><div className="progress-track"><span style={{ width: `${report.coverage}%` }} /></div></div>
            <div className="report-card-footer"><span>{report.type} / {report.updated}</span><button className="text-button">Open <Icon name="external" size={14} /></button></div>
          </article>
        ))}
      </div>
      <Panel title="Report register" subtitle="Generated reports available to the India team" className="standalone-panel">
        <TableCard columns={reportColumns} rows={reports} />
      </Panel>
    </>
  )
}

function ImportExportPage() {
  return (
    <>
      <PageHeader title="Import / Export" subtitle="Move India inventory data in and out safely." icon="upload">
        <button className="button button-primary"><Icon name="upload" size={16} /> Import data</button>
      </PageHeader>
      <div className="operation-grid">
        <article className="operation-card"><div className="operation-icon tone-cyan"><Icon name="upload" size={21} /></div><div><h2>Import records</h2><p>Upload laptops, employees, or vendors from CSV or XLSX.</p></div><button className="button button-secondary">Choose file</button></article>
        <article className="operation-card"><div className="operation-icon tone-purple"><Icon name="download" size={21} /></div><div><h2>Export records</h2><p>Download a filtered India fleet register for sharing.</p></div><button className="button button-secondary">Export CSV</button></article>
        <article className="operation-card"><div className="operation-icon tone-orange"><Icon name="file" size={21} /></div><div><h2>Download template</h2><p>Use the validated template for clean imports.</p></div><button className="button button-secondary">Get template</button></article>
      </div>
      <Panel title="Recent import activity" subtitle="Last files processed by the console" className="standalone-panel">
        <TableCard columns={importColumns} rows={importJobs} />
      </Panel>
    </>
  )
}

function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [strictHandover, setStrictHandover] = useState(false)

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage console preferences for the India region." icon="settings">
        <button className="button button-primary"><Icon name="save" size={16} /> Save changes</button>
      </PageHeader>
      <div className="settings-grid">
        <Panel title="Workspace" subtitle="Basic information shown across the console">
          <div className="settings-form">
            <label><span>Workspace name</span><input defaultValue="ISG eSolutions Console" /></label>
            <label><span>Primary location</span><select defaultValue="India"><option>India</option><option>Mumbai</option><option>Bengaluru</option><option>Delhi</option></select></label>
            <label><span>Currency</span><select defaultValue="INR"><option>INR - Indian Rupee</option><option>USD - US Dollar</option></select></label>
          </div>
        </Panel>
        <Panel title="Notifications" subtitle="Choose what the admin receives">
          <div className="switch-list">
            <SwitchRow label="Issue alerts" description="Notify admins when a device issue is opened." value={emailAlerts} onChange={setEmailAlerts} />
            <SwitchRow label="Nightly backup" description="Create a daily snapshot at 02:00 India time." value={autoBackup} onChange={setAutoBackup} />
            <SwitchRow label="Strict handover checks" description="Require all handover fields before assignment." value={strictHandover} onChange={setStrictHandover} />
          </div>
        </Panel>
        <Panel title="Security & access" subtitle="Current controls for this workspace" className="panel-wide">
          <div className="security-grid"><div><Icon name="shield" size={20} /><strong>JWT sessions enabled</strong><span>Sessions expire after 24 hours.</span></div><div><Icon name="database" size={20} /><strong>SQLite data store</strong><span>Last backup completed 2 hours ago.</span></div><div><Icon name="globe" size={20} /><strong>India region</strong><span>All sample records are tagged to India offices.</span></div></div>
        </Panel>
      </div>
    </>
  )
}

function SwitchRow({ label, description, value, onChange }) {
  return (
    <div className="switch-row"><div><strong>{label}</strong><span>{description}</span></div><button type="button" className={`switch ${value ? 'switch-on' : ''}`} onClick={() => onChange(!value)} aria-pressed={value} aria-label={`${label}: ${value ? 'on' : 'off'}`}><span /></button></div>
  )
}

function LoginScreen({ onLogin, error, form, setForm }) {
  return (
    <div className="login-screen">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />
      <form className="login-card" onSubmit={onLogin}>
        <div className="login-brand"><span className="brand-mark"><Icon name="dashboard" size={18} /></span><span>ISG eSolutions Console</span></div>
        <p className="eyebrow">India IT operations</p>
        <h1>Welcome back</h1>
        <p className="login-subtitle">Sign in to manage your fleet, people, and spend.</p>
        {error && <div className="login-error"><Icon name="issue" size={15} />{error}</div>}
        <label className="login-field"><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@example.com" required /></label>
        <label className="login-field"><span>Password</span><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" required /></label>
        <button className="button button-primary button-large" type="submit">Sign in <Icon name="logout" size={16} /></button>
        <p className="login-hint">Demo access: admin@example.com / admin123</p>
      </form>
    </div>
  )
}

function LoadingScreen() {
  return <div className="loading-screen"><span className="loading-spinner" /><span>Loading console...</span></div>
}

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)
  const [showNavigation, setShowNavigation] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('isg-theme') || 'dark')
  const [loginError, setLoginError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loginForm, setLoginForm] = useState({ email: 'admin@example.com', password: 'admin123' })

  useEffect(() => {
    const selectedTheme = theme === 'light' ? 'light' : 'dark'
    document.documentElement.dataset.theme = selectedTheme
    localStorage.setItem('isg-theme', selectedTheme)
  }, [theme])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setCheckingAuth(false)
      return
    }

    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired')
        const data = await response.json()
        setUser(data)
        setCurrentPage('dashboard')
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => setCheckingAuth(false))
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('token', data.token)
      setUser(data)
      setCurrentPage('dashboard')
    } catch (error) {
      setLoginError(error.message || 'Unable to sign in')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setCurrentPage('login')
    setShowNavigation(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'laptops':
        return <LaptopManagementPage />
      case 'employees':
        return <DataPage title="Employees" subtitle="People and device assignments across India offices." icon="users" data={employees} columns={employeeColumns} searchPlaceholder="Search employees or departments..." filterKey="status" filterOptions={['Active', 'On leave', 'Inactive']} actionLabel="Add employee" />
      case 'vendors':
        return <DataPage title="Vendors" subtitle="Manage the partners supporting your India fleet." icon="building" data={vendors} columns={vendorColumns} searchPlaceholder="Search vendors or contacts..." filterKey="status" filterOptions={['Active', 'Review', 'Inactive']} actionLabel="Add vendor" />
      case 'issues':
        return <DataPage title="Issues" subtitle="Resolve device and service issues before they impact the team." icon="issue" data={issues} columns={issueColumns} searchPlaceholder="Search issue IDs, assets, or owners..." filterKey="status" filterOptions={['Open', 'In progress', 'Resolved', 'Closed']} actionLabel="Log issue" />
      case 'reports':
        return <ReportsPage />
      case 'importExport':
        return <ImportExportPage />
      case 'backups':
        return <DataPage title="Backups" subtitle="Protected snapshots of your India inventory data." icon="archive" data={backups} columns={backupColumns} searchPlaceholder="Search backups..." filterKey="status" filterOptions={['Completed', 'Running', 'Failed']} actionLabel="Run backup" />
      case 'auditLogs':
        return <DataPage title="Audit Logs" subtitle="A traceable history of activity in this workspace." icon="log" data={auditLogs} columns={auditColumns} searchPlaceholder="Search actions, records, or users..." actionLabel="Export logs" />
      case 'users':
        return <DataPage title="Users" subtitle="Control who can access the India operations console." icon="user" data={users} columns={userColumns} searchPlaceholder="Search users or email addresses..." filterKey="status" filterOptions={['Active', 'Inactive']} actionLabel="Invite user" />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  if (checkingAuth) return <LoadingScreen />
  if (currentPage === 'login') return <LoginScreen onLogin={handleLogin} error={loginError} form={loginForm} setForm={setLoginForm} />

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <button className="menu-button" onClick={() => setShowNavigation(true)} aria-label="Open navigation"><Icon name="menu" size={19} /></button>
          <button className="console-brand" onClick={() => setCurrentPage('dashboard')}><span>ISG eSolutions Console</span></button>
        </div>
        <div className="topbar-actions">
          <span className="system-status"><i />All systems normal</span>
          <span className="topbar-user">{user?.name || 'Admin'}</span>
          <button className="topbar-icon" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /></button>
          <button className="signout-button" onClick={handleLogout}><Icon name="logout" size={16} /><span>Sign out</span></button>
        </div>
      </header>

      {showNavigation && (
        <>
          <button className="drawer-backdrop" aria-label="Close navigation" onClick={() => setShowNavigation(false)} />
          <aside className="nav-drawer">
            <div className="drawer-header"><div><p className="eyebrow">Workspace</p><strong>India operations</strong></div><button className="drawer-close" onClick={() => setShowNavigation(false)} aria-label="Close navigation">&times;</button></div>
            <nav className="drawer-nav">
              {navItems.map((item) => <button key={item.key} className={`drawer-link ${currentPage === item.key ? 'drawer-link-active' : ''}`} onClick={() => { setCurrentPage(item.key); setShowNavigation(false) }}><Icon name={item.icon} size={17} /><span>{item.label}</span>{item.key === 'issues' && <em>3</em>}</button>)}
            </nav>
            <div className="drawer-footer"><div className="drawer-footer-icon"><Icon name="shield" size={16} /></div><div><strong>Protected workspace</strong><span>Last sync 2 min ago</span></div></div>
          </aside>
        </>
      )}

      <main className="main-content">{renderPage()}</main>
    </div>
  )
}

export default App
