import { Router } from 'express'
import { authenticationController } from '../controllers/authenticationController'
import { authenticateToken } from '../middleware/authentication'

const router = Router()

// Public routes
router.post('/register', authenticationController.register)
router.post('/login', authenticationController.login)

// Protected routes
router.get('/me', authenticateToken, authenticationController.getMe)

export default router