import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is required')
  }

  return secret
}

const jwtSecret = getJwtSecret()
const tokenLifetime = 60 * 60 * 24 * 7

function createToken(userId: string) {
  return jwt.sign({ sub: userId }, jwtSecret, {
    expiresIn: tokenLifetime,
  })
}

export async function registerUser(email: string, password: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error('EMAIL_ALREADY_EXISTS')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  })

  return { user, token: createToken(user.id) }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error('INVALID_CREDENTIALS')
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token: createToken(user.id),
  }
}
