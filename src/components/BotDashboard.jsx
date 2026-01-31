import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { botAPI } from '../services/api'
import Sidebar from './Sidebar'
import BotCard from './BotCard'
import './BotDashboard.css'

function BotDashboard({ onLogout }) {
  const navigate = useNavigate()
  const [bots, setBots] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBots()
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchBots, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchBots = async () => {
    try {
      const data = await botAPI.getAll()
      setBots(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBotAction = async (action, botId) => {
    try {
      setError('')
      if (action === 'start') {
        await botAPI.start(botId)
      } else if (action === 'stop') {
        await botAPI.stop(botId)
      }
      // Refresh immediately after action
      await fetchBots()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="dashboard">
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-content">
        <div className="bot-dashboard">
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Bot Management</h1>
              <p className="dashboard-subtitle">Monitor and control your Python bots</p>
            </div>
          </header>

          {error && <div className="message error-message">{error}</div>}

          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading bots...</p>
            </div>
          ) : (
            <div className="bot-grid">
              {bots.length === 0 ? (
                <div className="empty-state">
                  <p>No bots configured yet</p>
                </div>
              ) : (
                bots.map(bot => (
                  <BotCard
                    key={bot.id}
                    bot={bot}
                    onAction={handleBotAction}
                    onViewDetails={() => navigate(`/bots/${bot.id}`)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BotDashboard
