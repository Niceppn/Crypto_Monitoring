import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database file path
const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'crypto_monitoring.db')

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log('📁 Created data directory')
}

let db = null

export const getDatabase = () => {
  if (!db) {
    db = new Database(dbPath)
    // Enable foreign keys
    db.pragma('foreign_keys = ON')
    console.log('✅ SQLite database connected')
  }
  return db
}

export const closeDatabase = () => {
  if (db) {
    db.close()
    db = null
    console.log('📊 Database connection closed')
  }
}

// Initialize database schema
export const initializeDatabase = () => {
  const database = getDatabase()
  
  // Create transactions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount REAL NOT NULL,
      token TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `)

  // Create wallets table
  database.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL UNIQUE,
      balance TEXT NOT NULL,
      token_count INTEGER NOT NULL,
      first_seen TEXT NOT NULL,
      last_active TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `)

  // Create tokens table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      contract_address TEXT,
      decimals INTEGER NOT NULL,
      total_supply TEXT NOT NULL,
      price_usd TEXT NOT NULL,
      market_cap TEXT NOT NULL
    )
  `)

  // Create blocks table
  database.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_number INTEGER NOT NULL UNIQUE,
      hash TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      transactions INTEGER NOT NULL,
      gas_used TEXT NOT NULL,
      gas_limit TEXT NOT NULL,
      miner TEXT NOT NULL
    )
  `)

  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `)

  // Create prices table
  database.exec(`
    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      price TEXT NOT NULL,
      change_24h TEXT NOT NULL,
      volume_24h TEXT NOT NULL,
      market_cap TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `)

  // Create binance_fees_selected table (สำหรับข้อมูลที่เลือก)
  database.exec(`
    CREATE TABLE IF NOT EXISTS binance_fees_selected (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      maker_fee TEXT NOT NULL,
      taker_fee TEXT NOT NULL,
      import_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create binance_fees_unselected table (สำหรับข้อมูลที่ไม่เลือก)
  database.exec(`
    CREATE TABLE IF NOT EXISTS binance_fees_unselected (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      maker_fee TEXT NOT NULL,
      taker_fee TEXT NOT NULL,
      import_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create import_history table (เก็บประวัติการ import)
  database.exec(`
    CREATE TABLE IF NOT EXISTS import_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      total_records INTEGER NOT NULL,
      selected_count INTEGER NOT NULL,
      unselected_count INTEGER NOT NULL,
      import_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create promotion_fees table (สำหรับข้อมูลที่ scrape จาก Binance)
  database.exec(`
    CREATE TABLE IF NOT EXISTS promotion_fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      maker_fee TEXT NOT NULL,
      taker_fee TEXT NOT NULL,
      scrape_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(symbol, scrape_time)
    )
  `)

  // Create scrape_history table (เก็บประวัติการ scrape)
  database.exec(`
    CREATE TABLE IF NOT EXISTS scrape_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_records INTEGER NOT NULL,
      new_records INTEGER NOT NULL,
      scrape_time TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('✅ Database schema initialized')
}

// Get row count for a table
export const getTableRowCount = (tableName) => {
  const database = getDatabase()
  try {
    const result = database.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get()
    return result.count || 0
  } catch (error) {
    console.error(`Error getting row count for ${tableName}:`, error)
    return 0
  }
}

// Get all table names
export const getTableNames = () => {
  const database = getDatabase()
  try {
    const tables = database.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()
    return tables.map(t => t.name)
  } catch (error) {
    console.error('Error getting table names:', error)
    return []
  }
}
