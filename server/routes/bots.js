import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import botManager from '../services/botManager.js'
import { getDatabase } from '../config/database.js'

const router = express.Router()

// Get all bots
router.get('/', verifyToken, (req, res) => {
  try {
    const bots = botManager.getAllBotsStatus()
    res.json({ success: true, data: bots })
  } catch (error) {
    console.error('Error fetching bots:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get single bot
router.get('/:id', verifyToken, (req, res) => {
  try {
    const bot = botManager.getBotStatus(parseInt(req.params.id))
    res.json({ success: true, data: bot })
  } catch (error) {
    console.error('Error fetching bot:', error)
    res.status(404).json({ success: false, error: error.message })
  }
})

// Start bot
router.post('/:id/start', verifyToken, async (req, res) => {
  try {
    const result = await botManager.startBot(parseInt(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Error starting bot:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Stop bot
router.post('/:id/stop', verifyToken, async (req, res) => {
  try {
    const result = await botManager.stopBot(parseInt(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Error stopping bot:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Restart bot
router.post('/:id/restart', verifyToken, async (req, res) => {
  try {
    const result = await botManager.restartBot(parseInt(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Error restarting bot:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get bot statistics
router.get('/:id/stats', verifyToken, (req, res) => {
  try {
    const db = getDatabase()
    const botId = parseInt(req.params.id)

    const bot = botManager.getBotStatus(botId)

    // Get log counts by level
    const logStats = db.prepare(`
      SELECT level, COUNT(*) as count
      FROM bot_logs
      WHERE bot_id = ?
      GROUP BY level
    `).all(botId)

    const logCounts = {}
    logStats.forEach(stat => {
      logCounts[stat.level] = stat.count
    })

    // Calculate uptime
    let uptime = 0
    let uptimeFormatted = 'Not running'
    if (bot.status === 'running' && bot.started_at) {
      const startTime = new Date(bot.started_at)
      const now = new Date()
      uptime = Math.floor((now - startTime) / 1000) // seconds

      const hours = Math.floor(uptime / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)
      const seconds = uptime % 60
      uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`
    }

    const stats = {
      bot_id: botId,
      bot_name: bot.name,
      status: bot.status,
      uptime: uptime,
      uptime_formatted: uptimeFormatted,
      restart_count: bot.restart_count,
      log_counts: logCounts,
      started_at: bot.started_at,
      stopped_at: bot.stopped_at
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching bot stats:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
