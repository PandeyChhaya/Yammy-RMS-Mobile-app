import type { Request, Response } from 'express'
import {
    generateTotpSecret,
    resetFirstLoginPassword,
    verifyAndEnableTotp,
    verifyTotpLogin,
} from './twofa.service.js'

export const getQrCode = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body
    const result = await generateTotpSecret(Number(user_id))
    res.status(200).json(result)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const enableTotp = async (req: Request, res: Response) => {
  try {
    const { user_id, token } = req.body
    const result = await verifyAndEnableTotp(Number(user_id), token)
    res.status(200).json(result)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const verifyTotp = async (req: Request, res: Response) => {
  try {
    const { user_id, token } = req.body
    const result = await verifyTotpLogin(Number(user_id), token)
    res.status(200).json(result)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const forcePasswordReset = async (req: Request, res: Response) => {
  try {
    const { user_id, new_password } = req.body
    const result = await resetFirstLoginPassword(Number(user_id), new_password)
    res.status(200).json(result)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}