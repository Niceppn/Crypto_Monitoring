import { getDatabase, initializeDatabase } from '../config/database.js'

const seedBots = () => {
  console.log('🌱 Seeding bots...')

  initializeDatabase()
  const db = getDatabase()

  // Clear existing bots
  db.exec('DELETE FROM bots')

  // Insert sample bots
  const insertBot = db.prepare(`
    INSERT INTO bots (name, description, script_path, script_args, log_path, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const bots = [
    {
      name: 'BTC Collector',
      description: 'Collects real-time Bitcoin trading data from Binance WebSocket',
      script_path: 'scripts/crypto_collector.py',
      script_args: '["btcusdt"]',
      log_path: 'logs/crypto_collector_btcusdt.log',
      status: 'stopped'
    },
    {
      name: 'Binance Fee Scraper',
      description: 'Scrapes promotion fee data from Binance trading page',
      script_path: 'scripts/scrape_binance_fees.py',
      script_args: '[]',
      log_path: 'logs/scrape_binance_fees.log',
      status: 'stopped'
    }
  ]

  bots.forEach(bot => {
    insertBot.run(
      bot.name,
      bot.description,
      bot.script_path,
      bot.script_args,
      bot.log_path,
      bot.status
    )
  })

  console.log(`✅ Seeded ${bots.length} bots`)
}

seedBots()
