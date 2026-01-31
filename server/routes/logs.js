import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { verifyToken } from '../middleware/auth.js'
import logReader from '../services/logReader.js'
import { getDatabase } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Get logs for a bot (from database)
router.get('/:botId', verifyToken, async (req, res) => {
  try {
    const botId = parseInt(req.params.botId)
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 100

    const result = await logReader.getLogsFromDatabase(botId, page, limit)
    res.json({ success: true, data: result.logs, ...result })
  } catch (error) {
    console.error('Error fetching logs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Stream logs in real-time (Server-Sent Events)
router.get('/:botId/stream', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const botId = parseInt(req.params.botId)

    // Get bot info
    const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(botId)

    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' })
    }

    // Resolve log path
    const projectRoot = path.join(__dirname, '..', '..')
    const logPath = bot.log_path ? path.join(projectRoot, bot.log_path) : null

    if (!logPath) {
      return res.status(400).json({ success: false, error: 'Bot has no log file configured' })
    }

    // Start streaming
    logReader.streamLogs(logPath, res, botId)
  } catch (error) {
    console.error('Error streaming logs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get log file tail (last N lines from file)
router.get('/:botId/tail', verifyToken, async (req, res) => {
  try {
    const db = getDatabase()
    const botId = parseInt(req.params.botId)
    const lines = parseInt(req.query.lines) || 100

    // Get bot info
    const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(botId)

    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' })
    }

    // Resolve log path
    const projectRoot = path.join(__dirname, '..', '..')
    const logPath = bot.log_path ? path.join(projectRoot, bot.log_path) : null

    if (!logPath) {
      return res.status(400).json({ success: false, error: 'Bot has no log file configured' })
    }

    const logs = await logReader.getTailLogs(logPath, lines)
    res.json({ success: true, data: logs })
  } catch (error) {
    console.error('Error reading log tail:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
