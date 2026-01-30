import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import SchemaDetail from './components/SchemaDetail'
import ExcelImport from './components/ExcelImport'
import PromotionFee from './components/PromotionFee'
import './styles/App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedAuth = localStorage.getItem('isAuthenticated')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    localStorage.setItem('isAuthenticated', 'true')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('isAuthenticated')
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
              <Dashboard onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/schema/:schemaName" 
          element={
            isAuthenticated ? 
              <SchemaDetail onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/excel-import" 
          element={
            isAuthenticated ? 
              <ExcelImport onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/promotion-fee" 
          element={
            isAuthenticated ? 
              <PromotionFee onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          } 
        />
      </Routes>
    </Router>
  )
}

export default App

