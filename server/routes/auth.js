import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const router = express.Router()

// Mock users database (in production, use real database)
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', // password: admin123
    email: 'admin@crypto.com'
  },
  {
    id: 2,
    username: 'user',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', // password: user123
    email: 'user@crypto.com'
  }
]

// Initialize default passwords (for demo purposes)
const initializePasswords = async () => {
  for (let user of users) {
    if (user.username === 'admin') {
      user.password = await bcrypt.hash('admin123', 10)
    } else if (user.username === 'user') {
      user.password = await bcrypt.hash('user123', 10)
    }
  }
}

// Initialize on module load
initializePasswords()

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      })
    }

    // Find user
    const user = users.find(u => u.username === username)
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    )

    // Return success response
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
})

// Verify token endpoint
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      })
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    )

    res.json({
      valid: true,
      user: decoded
    })
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid token' 
    })
  }
})

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  })
})

export default router

