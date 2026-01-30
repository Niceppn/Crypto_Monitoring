import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { getDatabase } from '../config/database.js'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const execAsync = promisify(exec)
const router = express.Router()

// Run Python scraping script
router.post('/run', verifyToken, async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'scrape_binance_fees.py')
    
    // Execute Python script
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`)
    
    // Parse output to get results
    const output = stdout + stderr
    
    // Get latest scrape results
    const db = getDatabase()
    const latestScrape = db.prepare(`
      SELECT * FROM scrape_history 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get()

    res.json({
      success: true,
      message: 'Scraping completed',
      output: output,
      scrape: latestScrape
    })
  } catch (error) {
    console.error('Error running scrape script:', error)
    res.status(500).json({
      error: 'Failed to run scraping script',
      message: error.message
    })
  }
})

// Get promotion fees data
router.get('/data', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { page = 1, limit = 50, scrapeTime } = req.query

    let query = 'SELECT * FROM promotion_fees'
    const params = []

    if (scrapeTime) {
      query += ' WHERE scrape_time = ?'
      params.push(scrapeTime)
    }

    query += ' ORDER BY created_at DESC'

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    query += ' LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const rows = db.prepare(query).all(...params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM promotion_fees'
    if (scrapeTime) {
      countQuery += ' WHERE scrape_time = ?'
    }
    const total = db.prepare(countQuery).get(scrapeTime ? [scrapeTime] : []).total

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
    console.error('Error fetching promotion fees:', error)
    res.status(500).json({ error: 'Failed to fetch promotion fees' })
  }
})

// Get scrape history
router.get('/history', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const history = db.prepare(`
      SELECT * FROM scrape_history 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all()

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Error fetching scrape history:', error)
    res.status(500).json({ error: 'Failed to fetch scrape history' })
  }
})

// Get latest scrape stats
router.get('/stats', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    
    // Get latest scrape
    const latestScrape = db.prepare(`
      SELECT * FROM scrape_history 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get()

    // Get total unique symbols
    const totalSymbols = db.prepare(`
      SELECT COUNT(DISTINCT symbol) as total FROM promotion_fees
    `).get().total

    // Get total records
    const totalRecords = db.prepare(`
      SELECT COUNT(*) as total FROM promotion_fees
    `).get().total

    res.json({
      success: true,
      data: {
        latestScrape,
        totalSymbols,
        totalRecords
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router

