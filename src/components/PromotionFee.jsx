import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { promotionAPI, authAPI } from '../services/api'
import Sidebar from './Sidebar'
import DataTable from './DataTable'
import './PromotionFee.css'

function PromotionFee({ onLogout }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await promotionAPI.getData(1, 50, '')
      console.log('API Response:', response) // Debug
      
      // API returns { success: true, data: {...}, pagination: {...} }
      if (response && response.success && response.data) {
        setData(response.data)
      } else if (response && response.data) {
        setData(response)
      } else {
        setData(response)
      }
    } catch (err) {
      setError(err.message || 'Failed to load data')
      console.error('Error fetching data:', err)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await promotionAPI.getStats()
      setStats(response.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleRun = async () => {
    setIsRunning(true)
    setError('')
    setSuccess('')

    try {
      const response = await promotionAPI.run()
      
      if (response.success) {
        setSuccess('Scraping completed successfully!')
        // Wait a bit for database to be updated
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Refresh data after scraping
        await fetchData()
        await fetchStats()
      }
    } catch (err) {
      setError(err.message || 'Failed to run scraping script')
      console.error('Run error:', err)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSidebarLogout = async () => {
    await authAPI.logout()
    if (onLogout) {
      onLogout()
    }
    navigate('/login')
  }

  const columns = ['symbol', 'maker_fee', 'taker_fee', 'scrape_time', 'created_at']

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleSidebarLogout} />
      <div className="dashboard-content">
        <div className="promotion-fee">
          <div className="promotion-header">
            <div>
              <h1 className="promotion-title">Promotion Fee</h1>
              <p className="promotion-subtitle">Binance Trading Promotion Fees</p>
            </div>
            <button
              className="btn btn-primary run-button"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></span>
                  Running...
                </>
              ) : (
                '▶ Run Scraper'
              )}
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="stats-container">
              <div className="stat-card glass">
                <div className="stat-label">Total Symbols</div>
                <div className="stat-value">{stats.totalSymbols || 0}</div>
              </div>
              <div className="stat-card glass">
                <div className="stat-label">Total Records</div>
                <div className="stat-value">{stats.totalRecords || 0}</div>
              </div>
              {stats.latestScrape && (
                <div className="stat-card glass">
                  <div className="stat-label">Last Scrape</div>
                  <div className="stat-value-small">
                    {new Date(stats.latestScrape.scrape_time).toLocaleString()}
                  </div>
                  <div className="stat-subtitle">
                    {stats.latestScrape.new_records} new records
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
              <p>Loading data...</p>
            </div>
          ) : data && data.data && Array.isArray(data.data) && data.data.length > 0 ? (
            <div className="data-section glass">
              <div className="data-header">
                <div className="data-info">
                  Showing {data.pagination?.total || (data.data ? data.data.length : (Array.isArray(data) ? data.length : 0))} records
                </div>
              </div>
              <DataTable
                columns={columns}
                rows={data.data.map(row => ({
                  symbol: row.symbol || '',
                  maker_fee: row.maker_fee || '',
                  taker_fee: row.taker_fee || '',
                  scrape_time: row.scrape_time ? new Date(row.scrape_time).toLocaleString() : '',
                  created_at: row.created_at ? new Date(row.created_at).toLocaleString() : ''
                }))}
                pagination={data.pagination}
              />
            </div>
          ) : !isLoading ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p className="empty-text">No data available. Click "Run Scraper" to start scraping.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromotionFee

