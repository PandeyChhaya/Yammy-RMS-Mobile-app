import { Request, Response } from 'express'
import { authenthicationService } from '../services/authenticationService'

export const authenticationController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, restaurantName, phone, address } = req.body

      // Validation
      if (!email || !password || !name || !restaurantName || !phone || !address) {
        return res.status(400).json({ error: 'All fields are required' })
      }

      const result = await authenthicationService.register({
        email,
        password,
        name,
        restaurantName,
        phone,
        address
      })

      res.status(201).json(result)
    } catch (error: any) {
      console.error('Register error:', error)
      res.status(400).json({ error: error.message })
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
      }

      const result = await authenthicationService.login({ email, password })

      res.json(result)
    } catch (error: any) {
      console.error('Login error:', error)
      res.status(401).json({ error: error.message })
    }
  },

  async getMe(req: Request, res: Response) {
    try {
      const userId = req.user!.userId

      const user = await authenthicationService.getMe(userId)

      res.json(user)
    } catch (error: any) {
      console.error('Get me error:', error)
      res.status(404).json({ error: error.message })
    }
  }
}