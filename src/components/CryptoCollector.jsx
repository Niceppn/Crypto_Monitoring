import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collectorAPI, authAPI } from '../services/api'
import Sidebar from './Sidebar'
import './CryptoCollector.css'

function CryptoCollector({ onLogout }) {
  const navigate = useNavigate()
  const [symbol, setSymbol] = useState('btcusdt')
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetchStatus()
    fetchStats()

    // Auto-refresh stats every 5 seconds
    const interval = setInterval(() => {
      fetchStatus()
      fetchStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [symbol])

  const fetchStatus = async () => {
    try {
      const data = await collectorAPI.getStatus(symbol.toUpperCase())
      if (data) {
        setStatus(data)
        setIsRunning(data.is_running === 1)
      } else {
        setStatus(null)
        setIsRunning(false)
      }
    } catch (err) {
      console.error('Error fetching status:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await collectorAPI.getStats(symbol.toUpperCase())
      if (data && data.length > 0) {
        setStats(data[0])
      } else {
        setStats(null)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleStart = async () => {
    if (!symbol.trim()) {
      setError('Please enter a symbol')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await collectorAPI.start(symbol)

      if (response.success) {
        setSuccess(`Collector started for ${symbol.toUpperCase()}!`)
        setIsRunning(true)
        await fetchStatus()
        await fetchStats()
      }
    } catch (err) {
      setError(err.message || 'Failed to start collector')
      console.error('Start error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await collectorAPI.stop(symbol)

      if (response.success) {
        setSuccess(`Collector stopped for ${symbol.toUpperCase()}`)
        setIsRunning(false)
        await fetchStatus()
      }
    } catch (err) {
      setError(err.message || 'Failed to stop collector')
      console.error('Stop error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = async () => {
    if (!window.confirm(`Are you sure you want to clear all trades for ${symbol.toUpperCase()}?`)) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await collectorAPI.clearTrades(symbol)

      if (response.success) {
        setSuccess(response.message)
        await fetchStats()
      }
    } catch (err) {
      setError(err.message || 'Failed to clear trades')
      console.error('Clear error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSidebarLogout = async () => {
    await authAPI.logout()
    if (onLogout) {
      onLogout()
    }
    navigate('/login')
  }

  const formatNumber = (num) => {
    if (!num) return '0'
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(num)
  }

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleSidebarLogout} />
      <div className="dashboard-content">
        <div className="crypto-collector">
          <div className="collector-header">
            <div>
              <h1 className="collector-title">Crypto Data Collector</h1>
              <p className="collector-subtitle">Real-time Binance WebSocket Data Collection</p>
            </div>
          </div>

          {/* Control Panel */}
          <div className="control-panel glass">
            <div className="control-group">
              <label htmlFor="symbol">Trading Pair Symbol</label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toLowerCase())}
                placeholder="e.g., btcusdt, ethusdt"
                className="symbol-input"
                disabled={isRunning}
              />
              <p className="input-hint">Common pairs: btcusdt, ethusdt, bnbusdt, xrpusdt, adausdt</p>
            </div>

            <div className="control-buttons">
              {!isRunning ? (
                <button
                  className="btn btn-primary"
                  onClick={handleStart}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></span>
                      Starting...
                    </>
                  ) : (
                    '▶ Start Collector'
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={handleStop}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></span>
                      Stopping...
                    </>
                  ) : (
                    '⏹ Stop Collector'
                  )}
                </button>
              )}

              <button
                className="btn btn-secondary"
                onClick={handleClear}
                disabled={isLoading || !stats || stats.total_trades === 0}
              >
                🗑 Clear Data
              </button>
            </div>
          </div>

          {/* Status Badge */}
          {status && (
            <div className="status-badge">
              <span className={`status-indicator ${isRunning ? 'running' : 'stopped'}`}></span>
              <span className="status-text">
                {isRunning ? `Collecting ${symbol.toUpperCase()}` : 'Stopped'}
              </span>
              {isRunning && status.started_at && (
                <span className="status-time">
                  Started: {new Date(status.started_at).toLocaleString()}
                </span>
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

          {/* Statistics Cards */}
          {stats ? (
            <div className="stats-container">
              <div className="stat-card glass">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-label">Total Trades</div>
                  <div className="stat-value">{formatNumber(stats.total_trades)}</div>
                </div>
              </div>

              <div className="stat-card glass">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">Average Price</div>
                  <div className="stat-value">${formatNumber(stats.avg_price)}</div>
                </div>
              </div>

              <div className="stat-card glass">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-label">Max Price</div>
                  <div className="stat-value">${formatNumber(stats.max_price)}</div>
                </div>
              </div>

              <div className="stat-card glass">
                <div className="stat-icon">📉</div>
                <div className="stat-content">
                  <div className="stat-label">Min Price</div>
                  <div className="stat-value">${formatNumber(stats.min_price)}</div>
                </div>
              </div>

              <div className="stat-card glass">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-label">Total Volume</div>
                  <div className="stat-value">{formatNumber(stats.total_volume)}</div>
                </div>
              </div>

              <div className="stat-card glass">
                <div className="stat-icon">🕐</div>
                <div className="stat-content">
                  <div className="stat-label">Latest Trade</div>
                  <div className="stat-value-small">
                    {stats.last_trade ? new Date(stats.last_trade).toLocaleString() : '-'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p className="empty-text">No data collected yet. Start the collector to begin.</p>
            </div>
          )}

          {/* Info Section */}
          <div className="info-section glass">
            <h3>About This Collector</h3>
            <ul>
              <li>✅ Real-time data collection from Binance WebSocket</li>
              <li>✅ Stores trade data directly to SQLite database</li>
              <li>✅ Supports any Binance trading pair (e.g., btcusdt, ethusdt)</li>
              <li>✅ Automatic reconnection on connection loss</li>
              <li>✅ Records price, quantity, side (BUY/SELL), and timestamp</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CryptoCollector
