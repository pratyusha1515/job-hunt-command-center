import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is required')
  }

  return secret
}

const jwtSecret = getJwtSecret()
export type AuthenticatedRequest = Request & {
  userId?: string
}

export function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) {
  const token = request.cookies.token

  if (!token) {
    return response.status(401).json({
      message: 'Authentication required',
    })
  }

  try {
    const payload = jwt.verify(token, jwtSecret)

    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      return response.status(401).json({
        message: 'Invalid authentication token',
      })
    }

    request.userId = payload.sub
    return next()
  } catch {
    return response.status(401).json({
      message: 'Invalid or expired authentication token',
    })
  }
}
