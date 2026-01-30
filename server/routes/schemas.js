import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { getDatabase, getTableRowCount } from '../config/database.js'

const router = express.Router()

// Schema metadata mapping
const schemaMetadata = {
  transactions: {
    id: 1,
    name: 'transactions',
    displayName: 'Transactions',
    icon: '💸',
    description: 'Cryptocurrency transaction records'
  },
  wallets: {
    id: 2,
    name: 'wallets',
    displayName: 'Wallets',
    icon: '👛',
    description: 'User wallet information'
  },
  tokens: {
    id: 3,
    name: 'tokens',
    displayName: 'Tokens',
    icon: '🪙',
    description: 'Token metadata and details'
  },
  blocks: {
    id: 4,
    name: 'blocks',
    displayName: 'Blocks',
    icon: '🧱',
    description: 'Blockchain block data'
  },
  users: {
    id: 5,
    name: 'users',
    displayName: 'Users',
    icon: '👤',
    description: 'User account information'
  },
  prices: {
    id: 6,
    name: 'prices',
    displayName: 'Price History',
    icon: '📈',
    description: 'Historical price data'
  }
}

// Get all schemas with real row counts from database
router.get('/', verifyToken, (req, res) => {
  try {
    const schemas = Object.values(schemaMetadata).map(meta => {
      const rowCount = getTableRowCount(meta.name)
      return {
        ...meta,
        rowCount
      }
    })

    res.json({
      success: true,
      data: schemas
    })
  } catch (error) {
    console.error('Error fetching schemas:', error)
    res.status(500).json({ 
      error: 'Failed to fetch schemas' 
    })
  }
})

// Get schema by name
router.get('/:schemaName', verifyToken, (req, res) => {
  try {
    const { schemaName } = req.params
    const meta = schemaMetadata[schemaName]
    
    if (!meta) {
      return res.status(404).json({ 
        error: 'Schema not found' 
      })
    }

    const rowCount = getTableRowCount(schemaName)
    const schema = {
      ...meta,
      rowCount
    }

    res.json({
      success: true,
      data: schema
    })
  } catch (error) {
    console.error('Error fetching schema:', error)
    res.status(500).json({ 
      error: 'Failed to fetch schema' 
    })
  }
})

// Get schema data (table rows) from database
router.get('/:schemaName/data', verifyToken, (req, res) => {
  try {
    const { schemaName } = req.params
    const { page = 1, limit = 10, search = '' } = req.query

    const db = getDatabase()
    
    // Check if table exists
    if (!schemaMetadata[schemaName]) {
      return res.status(404).json({ 
        error: 'Schema not found' 
      })
    }

    // Get table structure
    const tableInfo = db.prepare(`PRAGMA table_info(${schemaName})`).all()
    const columns = tableInfo.map(col => col.name)

    // Build query
    let query = `SELECT * FROM ${schemaName}`
    const params = []

    // Add search filter
    if (search) {
      const searchConditions = columns.map(col => `${col} LIKE ?`).join(' OR ')
      query += ` WHERE ${searchConditions}`
      const searchPattern = `%${search}%`
      params.push(...columns.map(() => searchPattern))
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${schemaName}`
    if (search) {
      const searchConditions = columns.map(col => `${col} LIKE ?`).join(' OR ')
      countQuery += ` WHERE ${searchConditions}`
    }
    const totalResult = db.prepare(countQuery).get(...params)
    const total = totalResult.total || 0

    // Add pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum
    query += ` LIMIT ? OFFSET ?`
    params.push(limitNum, offset)

    // Execute query
    const rows = db.prepare(query).all(...params)

    res.json({
      success: true,
      data: {
        columns,
        rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching schema data:', error)
    res.status(500).json({ 
      error: 'Failed to fetch schema data',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Get schema statistics
router.get('/:schemaName/stats', verifyToken, (req, res) => {
  try {
    const { schemaName } = req.params
    const meta = schemaMetadata[schemaName]
    
    if (!meta) {
      return res.status(404).json({ 
        error: 'Schema not found' 
      })
    }

    const db = getDatabase()
    const tableInfo = db.prepare(`PRAGMA table_info(${schemaName})`).all()
    const columns = tableInfo.map(col => col.name)
    const rowCount = getTableRowCount(schemaName)

    res.json({
      success: true,
      data: {
        name: meta.name,
        displayName: meta.displayName,
        rowCount,
        columnCount: columns.length,
        columns
      }
    })
  } catch (error) {
    console.error('Error fetching schema stats:', error)
    res.status(500).json({ 
      error: 'Failed to fetch schema stats' 
    })
  }
})

export default router
