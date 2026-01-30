import './SchemaCard.css'

function SchemaCard({ schema, onClick, delay = 0 }) {
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  return (
    <div
      className="schema-card glass fade-in"
      onClick={onClick}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="schema-card-header">
        <div className="schema-icon">{schema.icon}</div>
        <div className="schema-info">
          <h3 className="schema-name">{schema.displayName}</h3>
          <p className="schema-description">{schema.description}</p>
        </div>
      </div>
      
      <div className="schema-card-footer">
        <div className="row-count-container">
          <span className="row-count-label">Total Rows</span>
          <span className="row-count-value">{formatNumber(schema.rowCount)}</span>
        </div>
        <div className="schema-arrow">→</div>
      </div>
    </div>
  )
}

export default SchemaCard

