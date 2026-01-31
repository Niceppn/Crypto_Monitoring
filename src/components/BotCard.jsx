function BotCard({ bot, onAction, onViewDetails }) {
  const formatUptime = (startedAt) => {
    if (!startedAt) return '-'
    const start = new Date(startedAt)
    const now = new Date()
    const hours = Math.floor((now - start) / (1000 * 60 * 60))
    const minutes = Math.floor((now - start) / (1000 * 60)) % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="bot-card glass">
      <div className="bot-card-header">
        <h3>{bot.name}</h3>
        <span className={`status-badge ${bot.status}`}>
          <span className="status-indicator"></span>
          {bot.status === 'running' ? 'Running' : 'Stopped'}
        </span>
      </div>

      <p className="bot-description">{bot.description}</p>

      <div className="bot-metrics">
        <div className="metric">
          <span className="metric-label">Uptime</span>
          <span className="metric-value">{formatUptime(bot.started_at)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Restarts</span>
          <span className="metric-value">{bot.restart_count}</span>
        </div>
      </div>

      <div className="bot-actions">
        {bot.status === 'stopped' ? (
          <button
            className="btn btn-primary"
            onClick={() => onAction('start', bot.id)}
          >
            ▶ Start
          </button>
        ) : (
          <button
            className="btn btn-danger"
            onClick={() => onAction('stop', bot.id)}
          >
            ⏹ Stop
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={onViewDetails}
        >
          View Details
        </button>
      </div>
    </div>
  )
}

export default BotCard
