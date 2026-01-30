import { useState, useEffect, useCallback } from 'react'
import { schemaAPI } from '../services/api'
import './DataTable.css'

function DataTable({ columns, rows, schemaName, pagination: initialPagination, showCheckboxes = false, onSelectionChange }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRow, setSelectedRow] = useState(null)
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
      const data = await schemaAPI.getData(schemaName, page, rowsPerPage, search)
      setTableData(data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching table data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [schemaName, rowsPerPage])

  // Load data when schemaName, page, or search changes
  useEffect(() => {
    if (schemaName) {
      fetchData(currentPage, searchQuery)
    }
  }, [schemaName, currentPage, searchQuery, fetchData])

  // Use provided data if no schemaName (backward compatibility)
  useEffect(() => {
    if (!schemaName && columns && rows) {
      setTableData({ columns, rows })
    }
  }, [schemaName, columns, rows])

  // Debounce search
  useEffect(() => {
    if (!schemaName) return
    
    const timer = setTimeout(() => {
      setCurrentPage(1)
      if (searchQuery || currentPage === 1) {
        fetchData(1, searchQuery)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Client-side filtering if no API (backward compatibility)
  const filteredRows = schemaName ? tableData.rows : (
    searchQuery ? tableData.rows.filter(row => {
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    }) : tableData.rows
  )

  const totalPages = schemaName ? pagination.totalPages : Math.ceil(filteredRows.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedRows = schemaName ? filteredRows : filteredRows.slice(startIndex, endIndex)
  const totalRows = schemaName ? pagination.total : filteredRows.length

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSelectedRow(null)
    if (schemaName) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle checkbox selection
  const handleCheckboxChange = (rowId, checked) => {
    const newSelectedItems = new Set(selectedItems)
    if (checked) {
      newSelectedItems.add(rowId)
    } else {
      newSelectedItems.delete(rowId)
    }
    setSelectedItems(newSelectedItems)
    if (onSelectionChange) {
      onSelectionChange(newSelectedItems)
    }
  }

  const handleSelectAll = (checked) => {
    const newSelectedItems = new Set()
    if (checked) {
      paginatedRows.forEach(row => {
        newSelectedItems.add(getRowId(row))
      })
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
    setSelectedRow(selectedRow === row ? null : row)
  }

  return (
    <div className="data-table-wrapper">
      <div className="table-controls">
        <div className="search-container">
          <input
            type="text"
            className="input search-input"
            placeholder="Search in table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="table-info">
          {isLoading ? (
            'Loading...'
          ) : (
            `Showing ${startIndex + 1}-${Math.min(endIndex, totalRows)} of ${totalRows} rows`
          )}
        </div>
      </div>

      <div className="table-container">
        {isLoading ? (
          <div className="table-loading">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {showCheckboxes && (
                  <th className="table-header checkbox-header">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={paginatedRows.length > 0 && paginatedRows.every(row => selectedItems.has(getRowId(row)))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                )}
                {tableData.columns.map((column, index) => (
                  <th key={index} className="table-header">
                    {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, rowIndex) => {
                  const rowId = getRowId(row)
                  const isSelected = selectedItems.has(rowId)
                  return (
                    <tr
                      key={rowIndex}
                      className={`table-row ${selectedRow === row ? 'selected' : ''} ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => handleRowClick(row)}
                    >
                      {showCheckboxes && (
                        <td className="table-cell checkbox-cell" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="checkbox-input"
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(rowId, e.target.checked)}
                          />
                        </td>
                      )}
                      {tableData.columns.map((column, colIndex) => (
                        <td key={colIndex} className="table-cell">
                          {row[column] || '-'}
                        </td>
                      ))}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={tableData.columns.length + (showCheckboxes ? 1 : 0)} className="no-data">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedRow && (
        <div className="row-details glass">
          <div className="row-details-header">
            <h3>Row Details</h3>
            <button className="close-button" onClick={() => setSelectedRow(null)}>×</button>
          </div>
          <div className="row-details-content">
            {tableData.columns.map((column) => (
              <div key={column} className="detail-item">
                <span className="detail-label">
                  {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                </span>
                <span className="detail-value">{selectedRow[column] || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="pagination-ellipsis">...</span>
              }
              return null
            })}
          </div>

          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default DataTable

