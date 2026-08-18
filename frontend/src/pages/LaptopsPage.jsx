import { useState, useEffect } from 'react'
import Logo from '../assets/logo.svg?react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faFilter, faSortAlphaDown, faSortAlphaUp, faTimes } from '@fortawesome/free-solid-svg-icons'
import './tailwind.css'

const API_BASE = 'http://localhost:5000/api'

function LaptopsPage() {
  const [laptops, setLaptops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '',
    employee: ''
  })

  // Sort state
  const [sort, setSort] = useState({ field: 'machineName', direction: 'asc' })

  useEffect(() => {
    fetchLaptops()
  }, [page, pageSize, filters])

  const fetchLaptops = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...filters,
        sortField: sort.field,
        sortDirection: sort.direction
      })

      const resp = await fetch(`${API_BASE}/laptops?${params}`, {
        credentials: 'include'
      })

      if (!resp.ok) {
        const errData = await resp.json()
        throw new Error(errData.error || 'Failed to fetch laptops')
      }

      const data = await resp.json()
      setLaptops(data.laptops)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err.message || 'Failed to fetch laptops')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this laptop?')) {
      try {
        const resp = await fetch(`${API_BASE}/laptops/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        })

        if (resp.ok) {
          setLaptops(laptops.filter(l => l.id !== id))
          setTotalPages(Math.ceil((totalPages * pageSize - 1) / pageSize) || 1)
        } else {
          const err = await resp.json()
          alert(err.error || 'Failed to delete laptop')
        }
      } catch (err) {
        alert('Error deleting laptop')
      }
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value === '' ? '' : value }))
    setPage(1) // Reset to first page on filter change
  }

  const handleSortChange = (field) => {
    setSort(prev => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { field, direction: 'asc' }
    })
    setPage(1)
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-billow h-6 w-6 mx-auto my-4"></div>
        <p className="text-gray-600">Loading laptops...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 dark:bg-red-900 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={fetchLaptops}
          className="mt-2 py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0">
          {/* Search */}
          <div className="flex-1 sm:w-64">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search laptops..."
                onChange={(e) => setFilters(prev => ({ ...filters, search: e.target.value }))}
                value={filters.search}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-sm"
                aria-label="Search laptops"
              />
            </div>
          </div>

          {/* Status Filter */}
          {/* Brand Filter */}
          <div className="flex-1 sm:w-48">
            <select
              value={filters.brand || ''}
              onChange={handleFilterChange}
              name="brand"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-sm appearance-none pr-8"
              aria-label="Filter by brand"
            >
              <option value="">All Brands</option>
              <option value="HP">HP</option>
              <option value="Dell">Dell</option>
              <option value="Lenovo">Lenovo</option>
              <option value="Acer">Acer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 sm:w-48">
            <select
              value={filters.status || ''}
              onChange={handleFilterChange}
              name="status"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-sm appearance-none pr-8"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Spare">Spare</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Damaged">Damaged</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              className="py-2 px-3 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium transition-colors"
              title="Reset filters"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Laptop Table */}
      {loading ? (
        <div className="p-4">
          <div className="animate-spin rounded-billow h-6 w-6 mx-auto my-4"></div>
          <p className="text-gray-600">Loading laptops...</p>
        </div>
      ) : error ? (
        <div className="p-4">
          <div className="bg-red-100 dark:bg-red-900 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={fetchLaptops}
            className="mt-2 py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
          >
            Retry
          </button>
        </div>
      ) : laptops.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-gray-500">No laptops found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="rounded-md overflow-hidden shadow-sm dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-800">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-200">
              <thead className="text-xs text-gray-600 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th scope="col" className="py-3 pr-6">
                    <span className="font-medium">Machine Name</span>
                  </th>
                  <th scope="col" className="py-3 pr-6">
                    <span className="font-medium">Brand</span>
                  </th>
                  <th scope="col" className="py-3 pr-6">
                    <span className="font-medium">Model</span>
                  </th>
                  <th scope="col" className="py-3 pr-6">
                    <span className="font-medium">Serial Number</span>
                  </th>
                  <th scope="col" className="py-3 pr-6">
                    <span className="font-medium">Asset Code</span>
                  </th>
                  <th scope="col" className="py-3 pr-6">
                    <span className="font-medium">Employee</span>
                  </th>
                  <th scope="col" className="py-3 pr-6">
                    <span className="font-medium">Status</span>
                  </th>
                  <th scope="col" className="py-3 pr-6 text-right">
                    <span className="font-medium">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {laptops.map((laptop) => (
                  <tr key={laptop.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-100">
                    <td className="py-3 pr-6 font-medium">
                      {laptop.machineName}
                    </td>
                    <td className="py-3 pr-6">
                      {laptop.brand}
                    </td>
                    <td className="py-3 pr-6">
                      {laptop.model}
                    </td>
                    <td className="py-3 pr-6">
                      {laptop.serialNumber}
                    </td>
                    <td className="py-3 pr-6">
                      {laptop.assetCode}
                    </td>
                    <td className="py-3 pr-6">
                      {laptop.employeeId ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400">{laptop.employeeId}</span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-300">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 pr-6">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          laptop.status === 'Assigned'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : laptop.status === 'Spare'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : laptop.status === 'Under Repair'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : laptop.status === 'Damaged'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : laptop.status === 'Lost'
                                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                                    : 'bg-gray-500 text-white dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {laptop.status}
                      </span>
                    </td>
                    <td className="py-3 pr-6 text-right">
                      <FontAwesomeIcon icon={faEdit} className="mr-2 text-gray-400 dark:text-gray-500 hover:text-primary" title="Edit" />
                      <FontAwesomeIcon icon={faTrash} className="text-gray-400 dark:text-gray-500 hover:text-red-500" title="Delete" onClick={() => handleDelete(laptop.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <nav aria-label="Page navigation">
                <ul className="flex">
                  {/* Previous */}
                  <li>
                    <button
                      onClick={() => page > 1 ? setPage(page - 1) : null}
                      className={`inline-flex items-center px-2 py-1 m-1 rounded-md ${
                        page === 1
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}
                      disabled={page <= 1}
                      aria-label="Previous page"
                    >
                      <span aria-hidden="true" className="sr-only">Previous</span>
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path className="stroke-2" d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                  </li>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <li key={pageNum}>
                      <button
                        onClick={() => setPage(pageNum)}
                        className={`inline-flex items-center px-2 py-1 m-1 rounded-md ${
                          page === pageNum
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-400'
                        }`}
                        aria-label={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    </li>
                  ))}

                  {/* Next */}
                  <li>
                    <button
                      onClick={() => page < totalPages ? setPage(page + 1) : null}
                      className={`inline-flex items-center px-2 py-1 m-1 rounded-md ${
                        page === totalPages
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}
                      aria-label="Next page"
                      disabled={page >= totalPages}
                      >
                        <span aria-hidden="true" className="sr-only">Next</span>
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path className="stroke-2" d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}

export default LaptopsPage