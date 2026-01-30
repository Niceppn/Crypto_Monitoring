import express from 'express'
import multer from 'multer'
import xlsx from 'xlsx'
import { verifyToken } from '../middleware/auth.js'
import { getDatabase } from '../config/database.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads')
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'excel-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false)
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// Ensure uploads directory exists
import fs from 'fs'
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Upload and parse Excel file
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const filePath = req.file.path
    const workbook = xlsx.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    // Clean up uploaded file
    fs.unlinkSync(filePath)

    // Format data to match expected structure
    const formattedData = data.map((row, index) => {
      // Handle different column name variations
      const symbol = row['Symbol'] || row['symbol'] || row['SYMBOL'] || ''
      const makerFee = row['Maker Fee'] || row['maker_fee'] || row['MakerFee'] || row['MAKER_FEE'] || ''
      const takerFee = row['Taker Fee'] || row['taker_fee'] || row['TakerFee'] || row['TAKER_FEE'] || ''

      return {
        id: index + 1,
        symbol: symbol.toString(),
        makerFee: makerFee.toString(),
        takerFee: takerFee.toString()
      }
    }).filter(row => row.symbol && row.symbol.includes('/')) // Filter valid symbols

    res.json({
      success: true,
      data: formattedData,
      total: formattedData.length
    })
  } catch (error) {
    console.error('Error parsing Excel:', error)
    res.status(500).json({
      error: 'Failed to parse Excel file',
      message: error.message
    })
  }
})

// Save selected and unselected records
router.post('/save', verifyToken, async (req, res) => {
  try {
    const { selected, unselected, importTime } = req.body

    if (!selected || !unselected || !importTime) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const db = getDatabase()

    // Start transaction
    db.exec('BEGIN TRANSACTION')

    try {
      // Insert selected records
      const insertSelected = db.prepare(`
        INSERT INTO binance_fees_selected (symbol, maker_fee, taker_fee, import_time)
        VALUES (?, ?, ?, ?)
      `)

      const insertManySelected = db.transaction((records) => {
        for (const record of records) {
          insertSelected.run(record.symbol, record.makerFee, record.takerFee, importTime)
        }
      })

      insertManySelected(selected)

      // Insert unselected records
      const insertUnselected = db.prepare(`
        INSERT INTO binance_fees_unselected (symbol, maker_fee, taker_fee, import_time)
        VALUES (?, ?, ?, ?)
      `)

      const insertManyUnselected = db.transaction((records) => {
        for (const record of records) {
          insertUnselected.run(record.symbol, record.makerFee, record.takerFee, importTime)
        }
      })

      insertManyUnselected(unselected)

      // Save import history
      const insertHistory = db.prepare(`
        INSERT INTO import_history (filename, total_records, selected_count, unselected_count, import_time)
        VALUES (?, ?, ?, ?, ?)
      `)

      insertHistory.run(
        `import_${importTime}`,
        selected.length + unselected.length,
        selected.length,
        unselected.length,
        importTime
      )

      db.exec('COMMIT')

      res.json({
        success: true,
        message: 'Data saved successfully',
        selected: selected.length,
        unselected: unselected.length
      })
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Error saving data:', error)
    res.status(500).json({
      error: 'Failed to save data',
      message: error.message
    })
  }
})

// Get selected records
router.get('/selected', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { page = 1, limit = 50, importTime } = req.query

    let query = 'SELECT * FROM binance_fees_selected'
    const params = []

    if (importTime) {
      query += ' WHERE import_time = ?'
      params.push(importTime)
    }

    query += ' ORDER BY created_at DESC'

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    query += ' LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const rows = db.prepare(query).all(...params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM binance_fees_unselected'
    if (importTime) {
      countQuery += ' WHERE import_time = ?'
    }
    const total = db.prepare(countQuery).get(importTime ? [importTime] : []).total

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
    console.error('Error fetching selected records:', error)
    res.status(500).json({ error: 'Failed to fetch selected records' })
  }
})

// Get unselected records
router.get('/unselected', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const { page = 1, limit = 50, importTime } = req.query

    let query = 'SELECT * FROM binance_fees_unselected'
    const params = []

    if (importTime) {
      query += ' WHERE import_time = ?'
      params.push(importTime)
    }

    query += ' ORDER BY created_at DESC'

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    query += ' LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const rows = db.prepare(query).all(...params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM binance_fees_unselected'
    if (importTime) {
      countQuery += ' WHERE import_time = ?'
    }
    const total = db.prepare(countQuery).get(importTime || []).total

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
    console.error('Error fetching unselected records:', error)
    res.status(500).json({ error: 'Failed to fetch unselected records' })
  }
})

// Get import history
router.get('/history', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const history = db.prepare(`
      SELECT * FROM import_history 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all()

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Error fetching import history:', error)
    res.status(500).json({ error: 'Failed to fetch import history' })
  }
})

export default router

