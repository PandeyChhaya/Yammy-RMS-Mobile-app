import { generateSecret, verify } from 'otplib'
import qrcode from 'qrcode'
import prisma from '../../db.js'

export const generateTotpSecret = async (user_id: number) => {
  const user = await prisma.users.findUnique({ where: { user_id } })
  if (!user) throw new Error('User not found')

  const secret = generateSecret()
  const otpAuthUrl = `otpauth://totp/YAMMY:${user.user_email}?secret=${secret}&issuer=YAMMY`
  const qrDataUrl = await qrcode.toDataURL(otpAuthUrl)

  await prisma.users.update({
    where: { user_id },
    data: { totp_secret: secret },
  })

  return { secret, qrDataUrl }
}

export const verifyAndEnableTotp = async (user_id: number, token: string) => {
  const user = await prisma.users.findUnique({ where: { user_id } })
  if (!user) throw new Error('User not found')
  if (!user.totp_secret) throw new Error('No TOTP secret found')

  const isValid = verify({ token, secret: user.totp_secret })
  if (!isValid) throw new Error('Invalid code')

  await prisma.users.update({
    where: { user_id },
    data: { totp_enabled: true },
  })

  return { message: '2FA enabled successfully' }
}

export const verifyTotpLogin = async (user_id: number, token: string) => {
  const user = await prisma.users.findUnique({ where: { user_id } })
  if (!user) throw new Error('User not found')
  if (!user.totp_secret) throw new Error('2FA not set up')

  const isValid = verify({ token, secret: user.totp_secret })
  if (!isValid) throw new Error('Invalid code')

  return { message: 'Verified' }
}

export const resetFirstLoginPassword = async (user_id: number, newPassword: string) => {
  const bcrypt = await import('bcrypt')
  const hashed = await bcrypt.hash(newPassword, 10)

  await prisma.users.update({
    where: { user_id },
    data: {
      user_password: hashed,
      first_login: false,
    },
  })

  return { message: 'Password updated' }
}