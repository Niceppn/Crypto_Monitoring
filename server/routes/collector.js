import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { getDatabase } from '../config/database.js'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Store running processes
const runningProcesses = new Map()

// Start collector
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { symbol } = req.body

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' })
    }

    const normalizedSymbol = symbol.toLowerCase()

    // Check if already running
    if (runningProcesses.has(normalizedSymbol)) {
      return res.status(400).json({
        error: 'Collector is already running for this symbol',
        symbol: normalizedSymbol.toUpperCase()
      })
    }

    const db = getDatabase()
    const scriptPath = path.join(__dirname, '..', 'scripts', 'crypto_collector.py')

    // Spawn Python process
    const process = spawn('python3', [scriptPath, normalizedSymbol], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const pid = process.pid

    // Store process
    runningProcesses.set(normalizedSymbol, {
      process,
      pid,
      symbol: normalizedSymbol,
      startedAt: new Date().toISOString()
    })

    // Update database status
    db.prepare(`
      INSERT INTO collector_status (symbol, is_running, pid, started_at, updated_at)
      VALUES (?, 1, ?, ?, ?)
      ON CONFLICT(symbol) DO UPDATE SET
        is_running = 1,
        pid = ?,
        started_at = ?,
        stopped_at = NULL,
        updated_at = ?
    `).run(
      normalizedSymbol.toUpperCase(),
      pid,
      new Date().toISOString(),
      new Date().toISOString(),
      pid,
      new Date().toISOString(),
      new Date().toISOString()
    )

    // Handle process output
    process.stdout.on('data', (data) => {
      console.log(`[${normalizedSymbol.toUpperCase()}] ${data.toString()}`)
    })

    process.stderr.on('data', (data) => {
      console.error(`[${normalizedSymbol.toUpperCase()}] Error: ${data.toString()}`)
    })

    // Handle process exit
    process.on('exit', (code) => {
      console.log(`[${normalizedSymbol.toUpperCase()}] Process exited with code ${code}`)

      // Update database
      const db = getDatabase()
      db.prepare(`
        UPDATE collector_status
        SET is_running = 0, stopped_at = ?, updated_at = ?
        WHERE symbol = ?
      `).run(new Date().toISOString(), new Date().toISOString(), normalizedSymbol.toUpperCase())

      // Remove from running processes
      runningProcesses.delete(normalizedSymbol)
    })

    res.json({
      success: true,
      message: `Collector started for ${normalizedSymbol.toUpperCase()}`,
      data: {
        symbol: normalizedSymbol.toUpperCase(),
        pid,
        startedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error starting collector:', error)
    res.status(500).json({
      error: 'Failed to start collector',
      message: error.message
    })
  }
})

// Stop collector
router.post('/stop', verifyToken, async (req, res) => {
  try {
    const { symbol } = req.body

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' })
    }

    const normalizedSymbol = symbol.toLowerCase()

    if (!runningProcesses.has(normalizedSymbol)) {
      return res.status(400).json({
        error: 'Collector is not running for this symbol',
        symbol: normalizedSymbol.toUpperCase()
      })
    }

    const { process: proc, pid } = runningProcesses.get(normalizedSymbol)

    // Kill the process
    proc.kill('SIGTERM')

    // Update database
    const db = getDatabase()
    db.prepare(`
      UPDATE collector_status
      SET is_running = 0, stopped_at = ?, updated_at = ?
      WHERE symbol = ?
    `).run(new Date().toISOString(), new Date().toISOString(), normalizedSymbol.toUpperCase())

    // Remove from map
    runningProcesses.delete(normalizedSymbol)

    res.json({
      success: true,
      message: `Collector stopped for ${normalizedSymbol.toUpperCase()}`,
      data: {
        symbol: normalizedSymbol.toUpperCase(),
        stoppedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error stopping collector:', error)
    res.status(500).json({
      error: 'Failed to stop collector',
      message: error.message
    })
  }
})

// Get collector status
router.get('/status', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { symbol } = req.query

    if (symbol) {
      // Get status for specific symbol
      const status = db.prepare(`
        SELECT * FROM collector_status
        WHERE symbol = ?
      `).get(symbol.toUpperCase())

      res.json({
        success: true,
        data: status || null
      })
    } else {
      // Get all statuses
      const statuses = db.prepare(`
        SELECT * FROM collector_status
        ORDER BY updated_at DESC
      `).all()

      res.json({
        success: true,
        data: statuses
      })
    }
  } catch (error) {
    console.error('Error fetching status:', error)
    res.status(500).json({ error: 'Failed to fetch status' })
  }
})

// Get trade statistics
router.get('/stats', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { symbol } = req.query

    let query = `
      SELECT
        symbol,
        COUNT(*) as total_trades,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price,
        SUM(quantity) as total_volume,
        MIN(readable_time) as first_trade,
        MAX(readable_time) as last_trade
      FROM crypto_trades
    `

    if (symbol) {
      query += ` WHERE symbol = ?`
    }

    query += ` GROUP BY symbol`

    const stats = symbol
      ? db.prepare(query).all(symbol.toUpperCase())
      : db.prepare(query).all()

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

// Get recent trades
router.get('/trades', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { symbol, page = 1, limit = 50 } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = `
      SELECT * FROM crypto_trades
    `
    let countQuery = `
      SELECT COUNT(*) as total FROM crypto_trades
    `

    const params = []

    if (symbol) {
      query += ` WHERE symbol = ?`
      countQuery += ` WHERE symbol = ?`
      params.push(symbol.toUpperCase())
    }

    query += ` ORDER BY timestamp_ms DESC LIMIT ? OFFSET ?`

    const rows = db.prepare(query).all(...params, limitNum, offset)
    const total = db.prepare(countQuery).get(...params).total

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Error fetching trades:', error)
    res.status(500).json({ error: 'Failed to fetch trades' })
  }
})

// Clear trades for a symbol
router.delete('/clear', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { symbol } = req.body

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' })
    }

    const result = db.prepare(`
      DELETE FROM crypto_trades WHERE symbol = ?
    `).run(symbol.toUpperCase())

    res.json({
      success: true,
      message: `Cleared ${result.changes} trades for ${symbol.toUpperCase()}`,
      deletedCount: result.changes
    })
  } catch (error) {
    console.error('Error clearing trades:', error)
    res.status(500).json({ error: 'Failed to clear trades' })
  }
})

export default router
