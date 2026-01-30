import { getDatabase, initializeDatabase } from '../config/database.js'

const seedDatabase = () => {
  console.log('🌱 Seeding database...')
  
  // Initialize schema
  initializeDatabase()
  const db = getDatabase()

  // Clear existing data
  db.exec(`
    DELETE FROM transactions;
    DELETE FROM wallets;
    DELETE FROM tokens;
    DELETE FROM blocks;
    DELETE FROM users;
    DELETE FROM prices;
  `)

  // Insert transactions
  const insertTransaction = db.prepare(`
    INSERT INTO transactions (hash, from_address, to_address, amount, token, timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const transactions = [
    ['0x1234...5678', '0xabcd...efgh', '0xijkl...mnop', 1.5, 'ETH', '2024-01-15 10:30:00', 'Confirmed'],
    ['0x2345...6789', '0xbcde...fghi', '0xjklm...nopq', 0.8, 'BTC', '2024-01-15 11:15:00', 'Pending'],
    ['0x3456...7890', '0xcdef...ghij', '0xklmn...opqr', 2.3, 'ETH', '2024-01-15 12:00:00', 'Confirmed'],
    ['0x4567...8901', '0xdefg...hijk', '0xlmnop...qrst', 5.0, 'USDT', '2024-01-15 13:20:00', 'Confirmed'],
    ['0x5678...9012', '0xefgh...ijkl', '0xmnopq...rstu', 0.5, 'BTC', '2024-01-15 14:45:00', 'Failed'],
    ['0x6789...0123', '0xfghi...jklm', '0xnopqr...stuv', 10.2, 'ETH', '2024-01-15 15:30:00', 'Confirmed'],
    ['0x7890...1234', '0xghij...klmn', '0xopqrs...tuvw', 3.7, 'USDC', '2024-01-15 16:00:00', 'Pending'],
    ['0x8901...2345', '0xhijk...lmno', '0xpqrst...uvwx', 1.2, 'ETH', '2024-01-15 17:15:00', 'Confirmed'],
    ['0x9012...3456', '0xijkl...mnop', '0xqrstu...vwxy', 0.9, 'BTC', '2024-01-15 18:00:00', 'Confirmed'],
    ['0x0123...4567', '0xjklm...nopq', '0xrstuv...wxyz', 4.5, 'ETH', '2024-01-15 19:30:00', 'Pending'],
    ['0x1234...5678', '0xklmn...opqr', '0xstuvw...xyza', 2.1, 'USDT', '2024-01-15 20:00:00', 'Confirmed'],
    ['0x2345...6789', '0xlmnop...qrst', '0xtuvwx...yzab', 6.8, 'ETH', '2024-01-15 21:15:00', 'Confirmed'],
    ['0x3456...7890', '0xmnopq...rstu', '0xuvwxy...zabc', 0.3, 'BTC', '2024-01-15 22:00:00', 'Pending'],
    ['0x4567...8901', '0xnopqr...stuv', '0xvwxyz...abcd', 8.9, 'ETH', '2024-01-15 23:30:00', 'Confirmed'],
    ['0x5678...9012', '0xopqrs...tuvw', '0xwxyza...bcde', 1.7, 'USDC', '2024-01-16 00:00:00', 'Confirmed']
  ]

  const insertManyTransactions = db.transaction((transactions) => {
    for (const tx of transactions) {
      insertTransaction.run(...tx)
    }
  })

  insertManyTransactions(transactions)
  console.log(`✅ Inserted ${transactions.length} transactions`)

  // Insert wallets
  const insertWallet = db.prepare(`
    INSERT INTO wallets (address, balance, token_count, first_seen, last_active, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const wallets = [
    ['0xabcd...efgh', '125.5 ETH', 12, '2023-06-15', '2024-01-15', 'Active'],
    ['0xbcde...fghi', '89.2 BTC', 8, '2023-07-20', '2024-01-14', 'Active'],
    ['0xcdef...ghij', '234.7 ETH', 15, '2023-05-10', '2024-01-15', 'Active'],
    ['0xdefg...hijk', '45.3 USDT', 5, '2023-08-05', '2024-01-13', 'Inactive'],
    ['0xefgh...ijkl', '567.8 ETH', 20, '2023-04-01', '2024-01-15', 'Active']
  ]

  const insertManyWallets = db.transaction((wallets) => {
    for (const wallet of wallets) {
      insertWallet.run(...wallet)
    }
  })

  insertManyWallets(wallets)
  console.log(`✅ Inserted ${wallets.length} wallets`)

  // Insert tokens
  const insertToken = db.prepare(`
    INSERT INTO tokens (symbol, name, contract_address, decimals, total_supply, price_usd, market_cap)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const tokens = [
    ['ETH', 'Ethereum', '0x0000...0000', 18, '120M', '$2,450.00', '$294B'],
    ['BTC', 'Bitcoin', 'N/A', 8, '21M', '$42,500.00', '$892B'],
    ['USDT', 'Tether', '0x1234...5678', 6, '95B', '$1.00', '$95B'],
    ['USDC', 'USD Coin', '0x2345...6789', 6, '28B', '$1.00', '$28B']
  ]

  const insertManyTokens = db.transaction((tokens) => {
    for (const token of tokens) {
      insertToken.run(...token)
    }
  })

  insertManyTokens(tokens)
  console.log(`✅ Inserted ${tokens.length} tokens`)

  // Insert blocks
  const insertBlock = db.prepare(`
    INSERT INTO blocks (block_number, hash, timestamp, transactions, gas_used, gas_limit, miner)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const blocks = [
    [18500000, '0xabcd...efgh', '2024-01-15 10:00:00', 245, '15,234,567', '30,000,000', '0xminer1...'],
    [18500001, '0xbcde...fghi', '2024-01-15 10:12:00', 198, '12,456,789', '30,000,000', '0xminer2...'],
    [18500002, '0xcdef...ghij', '2024-01-15 10:24:00', 312, '18,567,890', '30,000,000', '0xminer1...']
  ]

  const insertManyBlocks = db.transaction((blocks) => {
    for (const block of blocks) {
      insertBlock.run(...block)
    }
  })

  insertManyBlocks(blocks)
  console.log(`✅ Inserted ${blocks.length} blocks`)

  // Insert users
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, wallet_address, created_at, last_login, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const users = [
    ['crypto_trader', 'trader@example.com', '0xuser1...', '2023-01-15', '2024-01-15', 'Active'],
    ['blockchain_dev', 'dev@example.com', '0xuser2...', '2023-02-20', '2024-01-14', 'Active'],
    ['crypto_enthusiast', 'enthusiast@example.com', '0xuser3...', '2023-03-10', '2024-01-15', 'Active']
  ]

  const insertManyUsers = db.transaction((users) => {
    for (const user of users) {
      insertUser.run(...user)
    }
  })

  insertManyUsers(users)
  console.log(`✅ Inserted ${users.length} users`)

  // Insert prices
  const insertPrice = db.prepare(`
    INSERT INTO prices (symbol, price, change_24h, volume_24h, market_cap, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const prices = [
    ['ETH', '$2,450.00', '+5.2%', '$12.5B', '$294B', '2024-01-15 10:00:00'],
    ['BTC', '$42,500.00', '+2.8%', '$28.3B', '$892B', '2024-01-15 10:00:00'],
    ['USDT', '$1.00', '0.0%', '$45.2B', '$95B', '2024-01-15 10:00:00']
  ]

  const insertManyPrices = db.transaction((prices) => {
    for (const price of prices) {
      insertPrice.run(...price)
    }
  })

  insertManyPrices(prices)
  console.log(`✅ Inserted ${prices.length} price records`)

  console.log('✅ Database seeding completed!')
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('seedDatabase') ||
                     process.argv[1]?.endsWith('seedDatabase.js')

if (isMainModule) {
  try {
    seedDatabase()
    console.log('✅ Seeding completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

export default seedDatabase

