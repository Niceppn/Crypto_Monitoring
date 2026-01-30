import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { promotionAPI } from '../services/api'
import Sidebar from './Sidebar'
import ModernTable from './ModernTable'
import './SavedItems.css'

function SavedItems({ onLogout }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchSavedItems()
    fetchStats()
  }, [])

  const fetchSavedItems = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await promotionAPI.getSavedItems()
      console.log('Saved Items Response:', response)
      
      if (response && response.success && response.data) {
        setData(response)
      } else if (response && response.data) {
        setData(response)
      } else {
        setData(response)
      }
    } catch (err) {
      setError(err.message || 'Failed to load saved items')
      console.error('Error fetching saved items:', err)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await promotionAPI.getSavedItemsStats()
      setStats(response.data)
    } catch (err) {
      console.error('Error fetching saved items stats:', err)
    }
  }

  const handleDeleteSelected = async (selectedIds) => {
    if (selectedIds.size === 0) {
      setError('Please select at least one item to delete')
      return
    }

    try {
      setError('')
      setSuccess('')

      // Convert selected IDs back to row data for deletion
      const itemsToDelete = []
      selectedIds.forEach(item => {
        try {
          const rowData = JSON.parse(item)
          itemsToDelete.push(rowData)
        } catch (e) {
          console.error('Error parsing selected item:', e)
        }
      })

      // Call API to delete selected items
      const response = await promotionAPI.deleteSavedItems(itemsToDelete)
      
      if (response.success) {
        setSuccess(`Successfully deleted ${selectedIds.size} items!`)
        // Refresh data after deletion
        await fetchSavedItems()
        await fetchStats()
      } else {
        setError('Failed to delete selected items')
      }
    } catch (err) {
      setError(err.message || 'Failed to delete selected items')
      console.error('Delete error:', err)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all saved items? This action cannot be undone.')) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await promotionAPI.clearAllSavedItems()
      
      if (response.success) {
        setSuccess('Successfully cleared all saved items!')
        // Refresh data after clearing
        await fetchSavedItems()
        await fetchStats()
      } else {
        setError('Failed to clear saved items')
      }
    } catch (err) {
      setError(err.message || 'Failed to clear saved items')
      console.error('Clear error:', err)
    }
  }

  const handleSidebarLogout = async () => {
    await authAPI.logout()
    if (onLogout) {
      onLogout()
    }
    navigate('/login')
  }

  const columns = ['maker_fee', 'taker_fee', 'scrape_time', 'created_at', 'saved_at']

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleSidebarLogout} />
      <div className="dashboard-content">
        <div className="saved-items">
          <div className="saved-header">
            <div>
              <h1 className="saved-title">Saved Items</h1>
              <p className="saved-subtitle">Your saved promotion fee data</p>
            </div>
            <div className="header-buttons">
              <button
                className="btn btn-secondary clear-button"
                onClick={handleClearAll}
                disabled={!data || !data.data || data.data.length === 0}
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="stats-container">
              <div className="stat-card glass">
                <div className="stat-label">Total Saved Items</div>
                <div className="stat-value">{stats.totalSavedItems || 0}</div>
              </div>
              <div className="stat-card glass">
                <div className="stat-label">Unique Symbols</div>
                <div className="stat-value">{stats.uniqueSymbols || 0}</div>
              </div>
              {stats.latestSaved && (
                <div className="stat-card glass">
                  <div className="stat-label">Last Saved</div>
                  <div className="stat-value-small">
                    {new Date(stats.latestSaved.saved_at).toLocaleString()}
                  </div>
                  <div className="stat-subtitle">
                    {stats.latestSaved.symbol}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="message error-message">
              {error}
            </div>
          )}
          {success && (
            <div className="message success-message">
              {success}
            </div>
          )}

          {/* Data Table */}
          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading saved items...</p>
            </div>
          ) : data && data.data && Array.isArray(data.data) && data.data.length > 0 ? (
            <div className="data-section glass">
              <div className="data-header">
                <div className="data-info">
                  Showing {data.pagination?.total || data.data.length} saved items
                </div>
              </div>
              <ModernTable
                columns={columns}
                rows={data.data.map(row => ({
                  maker_fee: row.maker_fee || '',
                  taker_fee: row.taker_fee || '',
                  scrape_time: row.scrape_time ? new Date(row.scrape_time).toLocaleString() : '',
                  created_at: row.created_at ? new Date(row.created_at).toLocaleString() : '',
                  saved_at: row.saved_at ? new Date(row.saved_at).toLocaleString() : ''
                }))}
                pagination={data.pagination}
                onSelectionChange={(selectedSet) => {
                  // Handle selection for deletion
                  if (selectedSet.size > 0) {
                    handleDeleteSelected(selectedSet)
                  }
                }}
              />
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💾</div>
              <p className="empty-text">No saved items found. Select and save items from the Promotion Fee page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SavedItems
