import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authenticationRoutes from './routes/authenticationRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Yammy Fresh API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders'
    }
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Yammy Fresh API is running',
    timestamp: new Date().toISOString()
  })
})

// Routes
app.use('/api/auth', authenticationRoutes)  // ✅ FIXED

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:3000`)
  console.log(`📊 Health check: http://localhost:3000/health`)
  console.log(`🔐 Auth: http://localhost:3000/api/auth`)
})