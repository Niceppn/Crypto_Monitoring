const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token')
}

// Helper function to set auth token
const setToken = (token) => {
  localStorage.setItem('token', token)
}

// Helper function to remove auth token
const removeToken = () => {
  localStorage.removeItem('token')
}

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken()
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    
    if (response.success && response.token) {
      setToken(response.token)
    }
    
    return response
  },

  logout: async () => {
    removeToken()
    return { success: true }
  },

  verify: async () => {
    return apiRequest('/auth/verify')
  },
}

// Schema API
export const schemaAPI = {
  getAll: async () => {
    const response = await apiRequest('/schemas')
    return response.data || []
  },

  getByName: async (schemaName) => {
    const response = await apiRequest(`/schemas/${schemaName}`)
    return response.data
  },

  getData: async (schemaName, page = 1, limit = 10, search = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    })
    
    const response = await apiRequest(`/schemas/${schemaName}/data?${params}`)
    return response.data
  },

  getStats: async (schemaName) => {
    const response = await apiRequest(`/schemas/${schemaName}/stats`)
    return response.data
  },
}

// Excel API
export const excelAPI = {
  upload: async (formData) => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/excel/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed')
    }

    return data
  },

  save: async (data) => {
    return apiRequest('/excel/save', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getSelected: async (page = 1, limit = 50, importTime = null) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(importTime && { importTime }),
    })
    
    const response = await apiRequest(`/excel/selected?${params}`)
    return response.data
  },

  getUnselected: async (page = 1, limit = 50, importTime = null) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(importTime && { importTime }),
    })
    
    const response = await apiRequest(`/excel/unselected?${params}`)
    return response.data
  },

  getHistory: async () => {
    const response = await apiRequest('/excel/history')
    return response.data || []
  },
}

// Promotion API
export const promotionAPI = {
  run: async () => {
    return apiRequest('/promotion/run', {
      method: 'POST',
    })
  },

  // Get unsaved promotion fees data (excluding already saved items)
  getUnsavedData: async (page = 1, limit = 50, scrapeTime = null) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(scrapeTime && { scrapeTime }),
    })
    
    const response = await apiRequest(`/promotion/unsaved-data?${params}`)
    return response
  },

  getData: async (page = 1, limit = 50, scrapeTime = null) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(scrapeTime && { scrapeTime }),
    })
    
    const response = await apiRequest(`/promotion/data?${params}`)
    return response
  },

  getHistory: async () => {
    const response = await apiRequest('/promotion/history')
    return response.data || []
  },

  getStats: async () => {
    const response = await apiRequest('/promotion/stats')
    return response.data
  },

  // Saved items endpoints
  saveSelectedItems: async (items) => {
    return apiRequest('/promotion/save-selected', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
  },

  getSavedItems: async (page = 1, limit = 50) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    const response = await apiRequest(`/promotion/saved-items?${params}`)
    return response
  },

  getSavedItemsStats: async () => {
    const response = await apiRequest('/promotion/saved-items-stats')
    return response.data
  },

  deleteSavedItems: async (items) => {
    return apiRequest('/promotion/delete-saved', {
      method: 'DELETE',
      body: JSON.stringify({ items }),
    })
  },

  clearAllSavedItems: async () => {
    return apiRequest('/promotion/clear-saved', {
      method: 'DELETE',
    })
  },
}

// Collector API
export const collectorAPI = {
  start: async (symbol) => {
    return apiRequest('/collector/start', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    })
  },

  stop: async (symbol) => {
    return apiRequest('/collector/stop', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    })
  },

  getStatus: async (symbol = null) => {
    const params = symbol ? `?symbol=${symbol}` : ''
    const response = await apiRequest(`/collector/status${params}`)
    return response.data
  },

  getStats: async (symbol = null) => {
    const params = symbol ? `?symbol=${symbol}` : ''
    const response = await apiRequest(`/collector/stats${params}`)
    return response.data
  },

  getTrades: async (symbol = null, page = 1, limit = 50) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(symbol && { symbol }),
    })

    const response = await apiRequest(`/collector/trades?${params}`)
    return response
  },

  clearTrades: async (symbol) => {
    return apiRequest('/collector/clear', {
      method: 'DELETE',
      body: JSON.stringify({ symbol }),
    })
  },
}

// Bot API
export const botAPI = {
  getAll: async () => {
    const response = await apiRequest('/bots')
    return response.data || []
  },

  getById: async (botId) => {
    const response = await apiRequest(`/bots/${botId}`)
    return response.data
  },

  start: async (botId) => {
    return apiRequest(`/bots/${botId}/start`, { method: 'POST' })
  },

  stop: async (botId) => {
    return apiRequest(`/bots/${botId}/stop`, { method: 'POST' })
  },

  restart: async (botId) => {
    return apiRequest(`/bots/${botId}/restart`, { method: 'POST' })
  },

  getStats: async (botId) => {
    const response = await apiRequest(`/bots/${botId}/stats`)
    return response.data
  }
}

// Logs API
export const logsAPI = {
  getLogs: async (botId, page = 1, limit = 100) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    const response = await apiRequest(`/logs/${botId}?${params}`)
    return response
  },

  getTailLogs: async (botId, lines = 100) => {
    const params = new URLSearchParams({ lines: lines.toString() })
    const response = await apiRequest(`/logs/${botId}/tail?${params}`)
    return response.data || []
  }
}

