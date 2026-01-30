// Mock database schemas
export const schemas = [
  {
    id: 1,
    name: 'transactions',
    displayName: 'Transactions',
    icon: '💸',
    rowCount: 15234,
    description: 'Cryptocurrency transaction records'
  },
  {
    id: 2,
    name: 'wallets',
    displayName: 'Wallets',
    icon: '👛',
    rowCount: 8921,
    description: 'User wallet information'
  },
  {
    id: 3,
    name: 'tokens',
    displayName: 'Tokens',
    icon: '🪙',
    rowCount: 456,
    description: 'Token metadata and details'
  },
  {
    id: 4,
    name: 'blocks',
    displayName: 'Blocks',
    icon: '🧱',
    rowCount: 234567,
    description: 'Blockchain block data'
  },
  {
    id: 5,
    name: 'users',
    displayName: 'Users',
    icon: '👤',
    rowCount: 1234,
    description: 'User account information'
  },
  {
    id: 6,
    name: 'prices',
    displayName: 'Price History',
    icon: '📈',
    rowCount: 98765,
    description: 'Historical price data'
  }
];

// Mock data for each schema
export const schemaData = {
  transactions: {
    columns: ['id', 'hash', 'from_address', 'to_address', 'amount', 'token', 'timestamp', 'status'],
    rows: [
      { id: 1, hash: '0x1234...5678', from_address: '0xabcd...efgh', to_address: '0xijkl...mnop', amount: '1.5', token: 'ETH', timestamp: '2024-01-15 10:30:00', status: 'Confirmed' },
      { id: 2, hash: '0x2345...6789', from_address: '0xbcde...fghi', to_address: '0xjklm...nopq', amount: '0.8', token: 'BTC', timestamp: '2024-01-15 11:15:00', status: 'Pending' },
      { id: 3, hash: '0x3456...7890', from_address: '0xcdef...ghij', to_address: '0xklmn...opqr', amount: '2.3', token: 'ETH', timestamp: '2024-01-15 12:00:00', status: 'Confirmed' },
      { id: 4, hash: '0x4567...8901', from_address: '0xdefg...hijk', to_address: '0xlmnop...qrst', amount: '5.0', token: 'USDT', timestamp: '2024-01-15 13:20:00', status: 'Confirmed' },
      { id: 5, hash: '0x5678...9012', from_address: '0xefgh...ijkl', to_address: '0xmnopq...rstu', amount: '0.5', token: 'BTC', timestamp: '2024-01-15 14:45:00', status: 'Failed' },
      { id: 6, hash: '0x6789...0123', from_address: '0xfghi...jklm', to_address: '0xnopqr...stuv', amount: '10.2', token: 'ETH', timestamp: '2024-01-15 15:30:00', status: 'Confirmed' },
      { id: 7, hash: '0x7890...1234', from_address: '0xghij...klmn', to_address: '0xopqrs...tuvw', amount: '3.7', token: 'USDC', timestamp: '2024-01-15 16:00:00', status: 'Pending' },
      { id: 8, hash: '0x8901...2345', from_address: '0xhijk...lmno', to_address: '0xpqrst...uvwx', amount: '1.2', token: 'ETH', timestamp: '2024-01-15 17:15:00', status: 'Confirmed' },
      { id: 9, hash: '0x9012...3456', from_address: '0xijkl...mnop', to_address: '0xqrstu...vwxy', amount: '0.9', token: 'BTC', timestamp: '2024-01-15 18:00:00', status: 'Confirmed' },
      { id: 10, hash: '0x0123...4567', from_address: '0xjklm...nopq', to_address: '0xrstuv...wxyz', amount: '4.5', token: 'ETH', timestamp: '2024-01-15 19:30:00', status: 'Pending' },
      { id: 11, hash: '0x1234...5678', from_address: '0xklmn...opqr', to_address: '0xstuvw...xyza', amount: '2.1', token: 'USDT', timestamp: '2024-01-15 20:00:00', status: 'Confirmed' },
      { id: 12, hash: '0x2345...6789', from_address: '0xlmnop...qrst', to_address: '0xtuvwx...yzab', amount: '6.8', token: 'ETH', timestamp: '2024-01-15 21:15:00', status: 'Confirmed' },
      { id: 13, hash: '0x3456...7890', from_address: '0xmnopq...rstu', to_address: '0xuvwxy...zabc', amount: '0.3', token: 'BTC', timestamp: '2024-01-15 22:00:00', status: 'Pending' },
      { id: 14, hash: '0x4567...8901', from_address: '0xnopqr...stuv', to_address: '0xvwxyz...abcd', amount: '8.9', token: 'ETH', timestamp: '2024-01-15 23:30:00', status: 'Confirmed' },
      { id: 15, hash: '0x5678...9012', from_address: '0xopqrs...tuvw', to_address: '0xwxyza...bcde', amount: '1.7', token: 'USDC', timestamp: '2024-01-16 00:00:00', status: 'Confirmed' }
    ]
  },
  wallets: {
    columns: ['id', 'address', 'balance', 'token_count', 'first_seen', 'last_active', 'status'],
    rows: [
      { id: 1, address: '0xabcd...efgh', balance: '125.5 ETH', token_count: 12, first_seen: '2023-06-15', last_active: '2024-01-15', status: 'Active' },
      { id: 2, address: '0xbcde...fghi', balance: '89.2 BTC', token_count: 8, first_seen: '2023-07-20', last_active: '2024-01-14', status: 'Active' },
      { id: 3, address: '0xcdef...ghij', balance: '234.7 ETH', token_count: 15, first_seen: '2023-05-10', last_active: '2024-01-15', status: 'Active' },
      { id: 4, address: '0xdefg...hijk', balance: '45.3 USDT', token_count: 5, first_seen: '2023-08-05', last_active: '2024-01-13', status: 'Inactive' },
      { id: 5, address: '0xefgh...ijkl', balance: '567.8 ETH', token_count: 20, first_seen: '2023-04-01', last_active: '2024-01-15', status: 'Active' }
    ]
  },
  tokens: {
    columns: ['id', 'symbol', 'name', 'contract_address', 'decimals', 'total_supply', 'price_usd', 'market_cap'],
    rows: [
      { id: 1, symbol: 'ETH', name: 'Ethereum', contract_address: '0x0000...0000', decimals: 18, total_supply: '120M', price_usd: '$2,450.00', market_cap: '$294B' },
      { id: 2, symbol: 'BTC', name: 'Bitcoin', contract_address: 'N/A', decimals: 8, total_supply: '21M', price_usd: '$42,500.00', market_cap: '$892B' },
      { id: 3, symbol: 'USDT', name: 'Tether', contract_address: '0x1234...5678', decimals: 6, total_supply: '95B', price_usd: '$1.00', market_cap: '$95B' },
      { id: 4, symbol: 'USDC', name: 'USD Coin', contract_address: '0x2345...6789', decimals: 6, total_supply: '28B', price_usd: '$1.00', market_cap: '$28B' }
    ]
  },
  blocks: {
    columns: ['id', 'block_number', 'hash', 'timestamp', 'transactions', 'gas_used', 'gas_limit', 'miner'],
    rows: [
      { id: 1, block_number: 18500000, hash: '0xabcd...efgh', timestamp: '2024-01-15 10:00:00', transactions: 245, gas_used: '15,234,567', gas_limit: '30,000,000', miner: '0xminer1...' },
      { id: 2, block_number: 18500001, hash: '0xbcde...fghi', timestamp: '2024-01-15 10:12:00', transactions: 198, gas_used: '12,456,789', gas_limit: '30,000,000', miner: '0xminer2...' },
      { id: 3, block_number: 18500002, hash: '0xcdef...ghij', timestamp: '2024-01-15 10:24:00', transactions: 312, gas_used: '18,567,890', gas_limit: '30,000,000', miner: '0xminer1...' }
    ]
  },
  users: {
    columns: ['id', 'username', 'email', 'wallet_address', 'created_at', 'last_login', 'status'],
    rows: [
      { id: 1, username: 'crypto_trader', email: 'trader@example.com', wallet_address: '0xuser1...', created_at: '2023-01-15', last_login: '2024-01-15', status: 'Active' },
      { id: 2, username: 'blockchain_dev', email: 'dev@example.com', wallet_address: '0xuser2...', created_at: '2023-02-20', last_login: '2024-01-14', status: 'Active' },
      { id: 3, username: 'crypto_enthusiast', email: 'enthusiast@example.com', wallet_address: '0xuser3...', created_at: '2023-03-10', last_login: '2024-01-15', status: 'Active' }
    ]
  },
  prices: {
    columns: ['id', 'symbol', 'price', 'change_24h', 'volume_24h', 'market_cap', 'timestamp'],
    rows: [
      { id: 1, symbol: 'ETH', price: '$2,450.00', change_24h: '+5.2%', volume_24h: '$12.5B', market_cap: '$294B', timestamp: '2024-01-15 10:00:00' },
      { id: 2, symbol: 'BTC', price: '$42,500.00', change_24h: '+2.8%', volume_24h: '$28.3B', market_cap: '$892B', timestamp: '2024-01-15 10:00:00' },
      { id: 3, symbol: 'USDT', price: '$1.00', change_24h: '0.0%', volume_24h: '$45.2B', market_cap: '$95B', timestamp: '2024-01-15 10:00:00' }
    ]
  }
};

