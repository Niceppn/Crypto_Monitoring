import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { schemaAPI, authAPI } from '../services/api'
import SchemaCard from './SchemaCard'
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
      const data = await schemaAPI.getAll()
      setSchemas(data)
    } catch (err) {
      setError(err.message || 'Failed to load schemas')
      console.error('Error fetching schemas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSchemas = schemas.filter(schema =>
    schema.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schema.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLogout = async () => {
    await authAPI.logout()
    onLogout()
    navigate('/login')
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title gradient-text">Dashboard</h1>
            <p className="dashboard-subtitle">Database Schema Overview</p>
          </div>
          <button className="btn btn-secondary logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading schemas...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchSchemas}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="dashboard-controls">
              <div className="search-container">
                <input
                  type="text"
                  className="input search-input"
                  placeholder="Search schemas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="search-icon">🔍</span>
              </div>
              <div className="schema-count">
                {filteredSchemas.length} {filteredSchemas.length === 1 ? 'schema' : 'schemas'}
              </div>
            </div>

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

            {filteredSchemas.length === 0 && (
              <div className="no-results">
                <p>No schemas found matching "{searchQuery}"</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default Dashboard

