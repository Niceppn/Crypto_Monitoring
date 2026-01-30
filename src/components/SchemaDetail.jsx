import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { schemaAPI, authAPI } from '../services/api'
import DataTable from './DataTable'
import './SchemaDetail.css'

function SchemaDetail({ onLogout }) {
  const { schemaName } = useParams()
  const navigate = useNavigate()
  const [schema, setSchema] = useState(null)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSchemaData()
  }, [schemaName])

  const fetchSchemaData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const [schemaInfo, stats] = await Promise.all([
        schemaAPI.getByName(schemaName),
        schemaAPI.getStats(schemaName)
      ])
      
      setSchema(schemaInfo)
      
      // Fetch first page of data
      const dataResponse = await schemaAPI.getData(schemaName, 1, 10, '')
      setData(dataResponse)
    } catch (err) {
      setError(err.message || 'Failed to load schema data')
      console.error('Error fetching schema data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  const handleLogout = async () => {
    await authAPI.logout()
    onLogout()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="schema-detail">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading schema...</p>
        </div>
      </div>
    )
  }

  if (error || !schema) {
    return (
      <div className="schema-detail">
        <header className="detail-header">
          <div className="header-content">
            <button className="back-button" onClick={handleBack}>
              ← Back
            </button>
          </div>
        </header>
        <div className="error-container">
          <p>{error || 'Schema not found'}</p>
          <button className="btn btn-primary" onClick={fetchSchemaData}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="schema-detail">
      <header className="detail-header">
        <div className="header-content">
          <div className="header-left">
            <button className="back-button" onClick={handleBack}>
              ← Back
            </button>
            <div className="schema-header-info">
              <div className="schema-header-icon">{schema.icon}</div>
              <div>
                <h1 className="detail-title">{schema.displayName}</h1>
                <p className="detail-subtitle">{schema.description}</p>
              </div>
            </div>
          </div>
          <button className="btn btn-secondary logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="detail-main">
        <div className="detail-stats">
          <div className="stat-card glass">
            <div className="stat-label">Total Rows</div>
            <div className="stat-value">{schema.rowCount.toLocaleString()}</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-label">Columns</div>
            <div className="stat-value">{data?.columns?.length || 0}</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-label">Schema Name</div>
            <div className="stat-value-small">{schema.name}</div>
          </div>
        </div>

        {data && (
          <div className="data-table-container glass">
            <DataTable 
              schemaName={schemaName}
              columns={data.columns} 
              rows={data.rows}
              pagination={data.pagination}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default SchemaDetail

