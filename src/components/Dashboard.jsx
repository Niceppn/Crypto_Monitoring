import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { schemaAPI, authAPI } from '../services/api'
import SchemaCard from './SchemaCard'
import Sidebar from './Sidebar'
import './Dashboard.css'

function Dashboard({ onLogout }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [schemas, setSchemas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSchemas()
  }, [])

  const fetchSchemas = async () => {
    try {
      setIsLoading(true)
      setError('')
      const data = await schemaAPI.getAll()
      setSchemas(data)
    } catch (err) {
      setError(err.message || 'Failed to load database schemas')
      console.error('Error fetching schemas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSchemas = schemas.filter(schema =>
    schema.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schema.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate metrics
  const totalSchemas = schemas.length
  const totalTables = schemas.length // Each schema is a table in SQLite
  const totalRows = schemas.reduce((sum, schema) => sum + (schema.rowCount || 0), 0)

  const handleSidebarLogout = async () => {
    await authAPI.logout()
    onLogout()
    navigate('/login')
  }

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleSidebarLogout} />
      <div className="dashboard-content">
        <header className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="dashboard-title">Crypto Monitor</h1>
            <p className="dashboard-subtitle">Database Monitoring Dashboard</p>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {/* Metrics Cards */}
        <div className="metrics-container">
          <div className="metric-card">
            <div className="metric-header">
              <h3 className="metric-title">Total Schemas</h3>
              <div className="metric-icon database-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5" stroke="currentColor" strokeWidth="2"/>
                  <ellipse cx="12" cy="12" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{totalSchemas}</div>
            <div className="metric-subtitle">Active database schemas</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <h3 className="metric-title">Total Tables</h3>
              <div className="metric-icon grid-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{totalTables}</div>
            <div className="metric-subtitle">Across all schemas</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <h3 className="metric-title">Total Rows</h3>
              <div className="metric-icon chart-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{totalRows.toLocaleString()}</div>
            <div className="metric-subtitle">Records in database</div>
          </div>
        </div>

        {/* Database Schemas Section */}
        <div className="schemas-section">
          <div className="schemas-section-header">
            <h2 className="schemas-section-title">Database Schemas</h2>
            {!isLoading && !error && (
              <div className="schemas-count-badge">{filteredSchemas.length}</div>
            )}
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading schemas...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5" stroke="currentColor" strokeWidth="2"/>
                  <ellipse cx="12" cy="12" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <p className="empty-text">No schemas found in the database</p>
            </div>
          ) : filteredSchemas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5" stroke="currentColor" strokeWidth="2"/>
                  <ellipse cx="12" cy="12" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <p className="empty-text">No schemas found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="schemas-grid">
              {filteredSchemas.map((schema, index) => (
                <SchemaCard
                  key={schema.id}
                  schema={schema}
                  onClick={() => navigate(`/schema/${schema.name}`)}
                  delay={index * 0.1}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  )
}

export default Dashboard
