import { useEffect, useState } from 'react'
import Logo from '../assets/logo.svg?react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faUsers, faTruck, faBuilding, faFile, faArchive, faLayoutDashboard, faSearch, faBorderAll, faExclamationTriangle, faTable, faDownload, faUpload, faPrint, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { PieChart, Pie, Cell as PieCell, Tooltip as TooltipChart, Legend as LegendChart, ResponsiveContainer as ResponsiveContainerChart } from 'recharts'
import './tailwind.css'

const API_BASE = 'http://localhost:5000/api'

function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [brandData, setBrandData] = useState(null)
  const [ageData, setAgeData] = useState(null)
  const [costData, setCostData] = useState(null)
  const [statusData, setStatusData] = useState(null)
  const [issueData, setIssueData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch all stats in parallel
      const [
        statsResp,
        brandResp,
        ageResp,
        costResp,
        statusResp,
        issueResp
      ] = await Promise.all([
        fetch(`${API_BASE}/admin/dashboard`, { credentials: 'include' }),
        fetch(`${API_BASE}/laptops/brand-stats`, { credentials: 'include' }),
        fetch(`${API_BASE}/laptops/age-distribution`, { credentials: 'include' }),
        fetch(`${API_BASE}/laptops/cost-stats`, { credentials: 'include' }),
        fetch(`${API_BASE}/laptops/status-distribution`, { credentials: 'include' }),
        fetch(`${API_BASE}/issues/status-distribution`, { credentials: 'include' })
      ])

      if (!statsResp.ok) throw new Error('Failed to fetch dashboard stats')
      if (!brandResp.ok) throw new Error('Failed to fetch brand stats')
      if (!ageResp.ok) throw new Error('Failed to fetch age distribution')
      if (!costResp.ok) throw new Error('Failed to fetch cost stats')
      if (!statusResp.ok) throw new Error('Failed to fetch status distribution')
      if (!issueResp.ok) throw new Error('Failed to fetch issue distribution')

      const [
        statsData,
        brandDataResult,
        ageDataResult,
        costDataResult,
        statusDataResult,
        issueDataResult
      ] = await Promise.all([
        statsResp.json(),
        brandResp.json(),
        ageResp.json(),
        costResp.json(),
        statusResp.json(),
        issueResp.json()
      ])

      setStats(statsData)
      setBrandData(brandDataResult)
      setAgeData(ageDataResult)
      setCostData(costDataResult)
      setStatusData(statusDataResult)
      setIssueData(issueDataResult)
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-billow h-6 w-6 mx-auto my-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 bg-red-100 dark:bg-red-900 text-red-700 p-4 rounded mb-4">
        {error}
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Laptops</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalLaptops}</p>
              </div>
              <FontAwesomeIcon icon={faFile} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assigned</p>
                <p className="text-2xl font-bold text-success">{stats.assignedLaptops}</p>
              </div>
              <FontAwesomeIcon icon={faCheck} className="text-success" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-info">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Spare</p>
                <p className="text-2xl font-bold text-info">{stats.spareLaptops}</p>
              </div>
              <FontAwesomeIcon icon={faTruck} className="text-info" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Under Repair</p>
                <p className="text-2xl font-bold text-warning">{stats.underRepairLaptops}</p>
              </div>
              <FontAwesomeIcon icon={faFile} className="text-warning" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-error">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Damaged</p>
                <p className="text-2xl font-bold text-error">{stats.damagedLaptops}</p>
              </div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-error" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
                <p className="text-2xl font-bold text-primary">{stats.totalEmployees}</p>
              </div>
              <FontAwesomeIcon icon={faUsers} className="text-primary" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-info">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Vendors</p>
                <p className="text-2xl font-bold text-info">{stats.totalVendors}</p>
              </div>
              <FontAwesomeIcon icon={faBuilding} className="text-info" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Purchase Value</p>
                <p className="text-2xl font-bold text-primary">${stats.totalPurchaseValue.toLocaleString()}</p>
              </div>
              <FontAwesomeIcon icon={faDollarSign} className="text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      {brandData && ageData && (
        <div class="grid grid-cols-1 gap-6 mb-8">
          <BarChart
            data={brandData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            height={300}
            layout="horizontal"
          >
            <Legend />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Cell dataKey="count" fill="#8884d8" />
          </BarChart>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart data={ageData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Pie dataKey="count" data={ageData} nameKey="name" />
              <TooltipChart />
              <LegendChart />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charts Row 2 */}
      {costData && statusData && issueData && (
        <div class="grid grid-cols-1 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart data={statusData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Pie dataKey="count" data={statusData} nameKey="name" />
              <TooltipChart />
              <LegendChart />
            </PieChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart data={issueData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Pie dataKey="count" data={issueData} nameKey="name" />
              <TooltipChart />
              <LegendChart />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Table */}
      {stats && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Detailed Statistics</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-200">
              <thead className="text-xs text-gray-600 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th scope="col" className="py-3 px-6 font-medium">Metric</th>
                  <th scope="col" className="py-3 px-6 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-3 px-6 font-medium">Total Laptops</td>
                  <td className="py-3 px-6">{stats.totalLaptops}</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-3 px-6 font-medium">Assigned</td>
                  <td className="py-3 px-6">{stats.assignedLaptops}</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-3 px-6 font-medium">Spare</td>
                  <td className="py-3 px-6">{stats.spareLaptops}</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-3 px-6 font-medium">Under Repair</td>
                  <td className="py-3 px-6">{stats.underRepairLaptops}</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-3 px-6 font-medium">Damaged</td>
                  <td className="py-3 px-6">{stats.damagedLaptops}</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-3 px-6 font-medium">Total Employees</td>
                  <td className="py-3 px-6">{stats.totalEmployees}</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-3 px-6 font-medium">Total Vendors</td>
                  <td className="py-3 px-6">{stats.totalVendors}</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-3 px-6 font-medium">Total Purchase Value</td>
                  <td className="py-3 px-6">${stats.totalPurchaseValue.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage