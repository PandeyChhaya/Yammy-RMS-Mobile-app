import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

interface RegisterData {
  email: string
  password: string
  name: string
  restaurantName: string
  phone: string
  address: string
}

interface LoginData {
  email: string
  password: string
}

export const authenthicationService = {
  async register(data: RegisterData) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new Error('Email already registered')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create restaurant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: data.restaurantName,
          owner_email: data.email,
          phone: data.phone,
          address: data.address,
          status: 'active'
        }
      })

      // Create user (owner)
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: 'admin',
          restaurant_id: restaurant.id
        }
      })

      return { restaurant, user }
    })

    // Generate JWT
    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        restaurantId: result.restaurant.id
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        restaurantId: result.restaurant.id,
        restaurantName: result.restaurant.name
      }
    }
  },

  async login(data: LoginData) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        restaurant: true
      }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password)
    if (!validPassword) {
      throw new Error('Invalid credentials')
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurant_id
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurant_id,
        restaurantName: user.restaurant.name
      }
    }
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurant_id,
      restaurantName: user.restaurant.name
    }
  }
}