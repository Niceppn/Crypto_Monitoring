import { useState, useEffect, useCallback } from 'react'
import { schemaAPI } from '../services/api'
import './ModernTable.css'

function ModernTable({ columns, rows, schemaName, pagination: initialPagination, onSelectionChange }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [tableData, setTableData] = useState({ columns: columns || [], rows: rows || [] })
  const [pagination, setPagination] = useState(initialPagination || { total: 0, totalPages: 0, page: 1, limit: 10 })
  const [isLoading, setIsLoading] = useState(false)
  const rowsPerPage = pagination.limit || 10

  // If schemaName is provided, fetch data from API
  const fetchData = useCallback(async (page, search) => {
    if (!schemaName) return

    try {
      setIsLoading(true)
      const response = await schemaAPI.getData(schemaName, page, rowsPerPage, search)
      
      if (response && response.data) {
        setTableData({
          columns: response.columns || columns || [],
          rows: response.data || []
        })
        setPagination(response.pagination || pagination)
      }
    } catch (error) {
      console.error('Error fetching table data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [schemaName, columns, pagination, rowsPerPage])

  useEffect(() => {
    if (schemaName) {
      fetchData(currentPage, searchQuery)
    } else {
      // Use provided data
      setTableData({ columns: columns || [], rows: rows || [] })
    }
  }, [schemaName, currentPage, searchQuery, columns, rows])

  // Filter rows based on search
  const filteredRows = tableData.rows.filter(row => {
    if (!searchQuery) return true
    return Object.values(row).some(value => 
      value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Pagination for client-side data
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedRows = schemaName ? tableData.rows : filteredRows.slice(startIndex, endIndex)
  const totalPages = schemaName ? pagination.totalPages : Math.ceil(filteredRows.length / rowsPerPage)

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
    if (schemaName) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle row selection
  const handleRowSelection = (row) => {
    const rowId = getRowId(row)
    const newSelectedItems = new Set(selectedItems)
    
    if (newSelectedItems.has(rowId)) {
      newSelectedItems.delete(rowId)
    } else {
      newSelectedItems.add(rowId)
    }
    
    setSelectedItems(newSelectedItems)
    if (onSelectionChange) {
      onSelectionChange(newSelectedItems)
    }
  }

  const getRowId = (row) => {
    // Create a unique ID from row data
    return JSON.stringify(row)
  }

  const handleRowClick = (row) => {
    // Toggle selection
    handleRowSelection(row)
  }

  return (
    <div className="modern-table-wrapper">
      {/* Search and Controls */}
      <div className="table-controls">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="search-icon">🔍</div>
        </div>
        
        <div className="table-info">
          <span className="info-text">
            {selectedItems.size > 0 && (
              <span className="selected-count">
                {selectedItems.size} selected
              </span>
            )}
            Showing {paginatedRows.length} of {schemaName ? pagination.total : filteredRows.length} items
          </span>
        </div>
      </div>

      {/* Modern Table */}
      <div className="modern-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : paginatedRows.length > 0 ? (
          <div className="table-scroll">
            <table className="modern-table">
              <thead>
                <tr className="table-header-row">
                  {tableData.columns.map((column, index) => (
                    <th key={index} className="table-header-cell">
                      <div className="header-content">
                        <span className="header-text">
                          {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <div className="header-indicator"></div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, rowIndex) => {
                  const rowId = getRowId(row)
                  const isSelected = selectedItems.has(rowId)
                  return (
                    <tr
                      key={rowIndex}
                      className={`table-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => handleRowClick(row)}
                    >
                      {tableData.columns.map((column, colIndex) => (
                        <td key={colIndex} className="table-cell">
                          <div className="cell-content">
                            {row[column] || '-'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No data found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn prev-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              className="pagination-btn next-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModernTable
