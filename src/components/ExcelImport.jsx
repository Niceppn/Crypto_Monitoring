import { useState, useRef } from 'react'
import { excelAPI } from '../services/api'
import './ExcelImport.css'

function ExcelImport() {
  const [file, setFile] = useState(null)
  const [data, setData] = useState([])
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      setSuccess('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await excelAPI.upload(formData)
      
      if (response.success) {
        setData(response.data)
        setSelectedRows(new Set()) // Reset selections
        setSuccess(`Successfully loaded ${response.total} records`)
      }
    } catch (err) {
      setError(err.message || 'Failed to upload file')
      console.error('Upload error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleRow = (id) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map(row => row.id)))
    }
  }

  const handleSave = async () => {
    if (data.length === 0) {
      setError('No data to save')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const importTime = new Date().toISOString()
      const selected = data.filter(row => selectedRows.has(row.id))
      const unselected = data.filter(row => !selectedRows.has(row.id))

      const response = await excelAPI.save({
        selected,
        unselected,
        importTime
      })

      if (response.success) {
        setSuccess(`Saved successfully! Selected: ${response.selected}, Unselected: ${response.unselected}`)
        setData([])
        setSelectedRows(new Set())
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save data')
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCount = selectedRows.size
  const unselectedCount = data.length - selectedCount

  const handleSidebarLogout = async () => {
    await authAPI.logout()
    if (onLogout) {
      onLogout()
    }
    navigate('/login')
  }

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleSidebarLogout} />
      <div className="dashboard-content">
        <div className="excel-import">
      <div className="excel-import-header">
        <h1 className="excel-import-title">Excel Import</h1>
        <p className="excel-import-subtitle">Upload and manage Binance fees data</p>
      </div>

      <div className="excel-import-content">
        {/* Upload Section */}
        <div className="upload-section glass">
          <h2>Upload Excel File</h2>
          <div className="upload-controls">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {file ? file.name : 'Choose Excel File'}
            </label>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || isLoading}
            >
              {isLoading ? 'Uploading...' : 'Upload & Parse'}
            </button>
          </div>
        </div>

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
        {data.length > 0 && (
          <div className="data-section glass">
            <div className="data-header">
              <div className="data-stats">
                <span>Total: {data.length}</span>
                <span className="selected-count">Selected: {selectedCount}</span>
                <span className="unselected-count">Unselected: {unselectedCount}</span>
              </div>
              <div className="data-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleSelectAll}
                >
                  {selectedRows.size === data.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save to Database'}
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === data.length && data.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Symbol</th>
                    <th>Maker Fee</th>
                    <th>Taker Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr
                      key={row.id}
                      className={selectedRows.has(row.id) ? 'selected' : ''}
                    >
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => handleToggleRow(row.id)}
                        />
                      </td>
                      <td>{row.symbol}</td>
                      <td>{row.makerFee}</td>
                      <td>{row.takerFee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default ExcelImport

