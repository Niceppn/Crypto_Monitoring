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

// Get promotion fees data (excluding saved items)
router.get('/unsaved-data', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { page = 1, limit = 50, scrapeTime } = req.query

    // Debug: Check sample data from promotion_fees
    const sampleData = db.prepare('SELECT * FROM promotion_fees LIMIT 3').all()
    console.log('Sample promotion_fees data:', sampleData) // Debug
    
    // Debug: Check sample data from saved_promotion_fees
    const sampleSaved = db.prepare('SELECT * FROM saved_promotion_fees LIMIT 3').all()
    console.log('Sample saved_promotion_fees data:', sampleSaved) // Debug

    // Use NOT EXISTS to exclude saved items
    let query = `
      SELECT pf.* 
      FROM promotion_fees pf
      WHERE NOT EXISTS (
        SELECT 1 FROM saved_promotion_fees spf 
        WHERE spf.symbol = pf.symbol 
          AND spf.maker_fee = pf.maker_fee 
          AND spf.taker_fee = pf.taker_fee 
          AND spf.scrape_time = pf.scrape_time
      )
    `
    const params = []

    if (scrapeTime) {
      query += ' AND pf.scrape_time = ?'
      params.push(scrapeTime)
    }

    query += ' ORDER BY pf.created_at DESC'

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    query += ' LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    console.log('Unsaved data query:', query) // Debug
    console.log('Params:', params) // Debug

    const rows = db.prepare(query).all(...params)

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM promotion_fees pf
      WHERE NOT EXISTS (
        SELECT 1 FROM saved_promotion_fees spf 
        WHERE spf.symbol = pf.symbol 
          AND spf.maker_fee = pf.maker_fee 
          AND spf.taker_fee = pf.taker_fee 
          AND spf.scrape_time = pf.scrape_time
      )
    `
    if (scrapeTime) {
      countQuery += ' AND pf.scrape_time = ?'
    }
    const total = db.prepare(countQuery).get(scrapeTime ? [scrapeTime] : []).total

    console.log('Unsaved rows found:', rows.length) // Debug
    console.log('Total unsaved:', total) // Debug

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
    console.error('Error fetching unsaved promotion fees:', error)
    res.status(500).json({ error: 'Failed to fetch unsaved promotion fees' })
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

// Save selected items
router.post('/save-selected', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { items } = req.body
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items data' })
    }

    console.log('Saving items:', items.length) // Debug
    console.log('Sample item:', items[0]) // Debug

    const savedItems = []
    const now = new Date().toISOString()

    // Begin transaction
    const transaction = db.transaction(() => {
      items.forEach(item => {
        // Check if item already exists
        const existing = db.prepare(`
          SELECT id FROM saved_promotion_fees 
          WHERE symbol = ? AND maker_fee = ? AND taker_fee = ? AND scrape_time = ?
        `).get(
          item.symbol,
          item.maker_fee,
          item.taker_fee,
          item.scrape_time
        )

        if (!existing) {
          // Insert new saved item
          const result = db.prepare(`
            INSERT INTO saved_promotion_fees (symbol, maker_fee, taker_fee, scrape_time, created_at, saved_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            item.symbol,
            item.maker_fee,
            item.taker_fee,
            item.scrape_time,
            item.created_at,
            now
          )
          savedItems.push({ id: result.lastInsertRowid, ...item, saved_at: now })
          console.log('Saved item:', item.symbol) // Debug
        } else {
          console.log('Item already saved:', item.symbol) // Debug
        }
      })
    })

    transaction()

    // Check total saved items after save
    const totalSaved = db.prepare('SELECT COUNT(*) as total FROM saved_promotion_fees').get().total
    console.log('Total saved items after save:', totalSaved) // Debug

    res.json({
      success: true,
      message: `Saved ${savedItems.length} new items (skipped ${items.length - savedItems.length} duplicates)`,
      data: savedItems
    })
  } catch (error) {
    console.error('Error saving selected items:', error)
    res.status(500).json({ error: 'Failed to save selected items' })
  }
})

// Get saved items
router.get('/saved-items', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { page = 1, limit = 50 } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    const rows = db.prepare(`
      SELECT * FROM saved_promotion_fees 
      ORDER BY saved_at DESC 
      LIMIT ? OFFSET ?
    `).all(limitNum, offset)

    // Get total count
    const total = db.prepare(`
      SELECT COUNT(*) as total FROM saved_promotion_fees
    `).get().total

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
    console.error('Error fetching saved items:', error)
    res.status(500).json({ error: 'Failed to fetch saved items' })
  }
})

// Get saved items stats
router.get('/saved-items-stats', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    
    // Get total saved items
    const totalSavedItems = db.prepare(`
      SELECT COUNT(*) as total FROM saved_promotion_fees
    `).get().total

    // Get unique symbols
    const uniqueSymbols = db.prepare(`
      SELECT COUNT(DISTINCT symbol) as total FROM saved_promotion_fees
    `).get().total

    // Get latest saved item
    const latestSaved = db.prepare(`
      SELECT * FROM saved_promotion_fees 
      ORDER BY saved_at DESC 
      LIMIT 1
    `).get()

    res.json({
      success: true,
      data: {
        totalSavedItems,
        uniqueSymbols,
        latestSaved
      }
    })
  } catch (error) {
    console.error('Error fetching saved items stats:', error)
    res.status(500).json({ error: 'Failed to fetch saved items stats' })
  }
})

// Delete saved items
router.delete('/delete-saved', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { items } = req.body
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items data' })
    }

    const deletedCount = db.transaction(() => {
      let count = 0
      items.forEach(item => {
        const result = db.prepare(`
          DELETE FROM saved_promotion_fees 
          WHERE symbol = ? AND maker_fee = ? AND taker_fee = ? AND scrape_time = ?
        `).run(
          item.symbol,
          item.maker_fee,
          item.taker_fee,
          item.scrape_time
        )
        count += result.changes
      })
      return count
    })()

    res.json({
      success: true,
      message: `Deleted ${deletedCount} items`,
      deletedCount
    })
  } catch (error) {
    console.error('Error deleting saved items:', error)
    res.status(500).json({ error: 'Failed to delete saved items' })
  }
})

// Clear all saved items
router.delete('/clear-saved', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    
    const result = db.prepare(`
      DELETE FROM saved_promotion_fees
    `).run()

    res.json({
      success: true,
      message: `Cleared ${result.changes} saved items`,
      deletedCount: result.changes
    })
  } catch (error) {
    console.error('Error clearing saved items:', error)
    res.status(500).json({ error: 'Failed to clear saved items' })
  }
})

export default router

