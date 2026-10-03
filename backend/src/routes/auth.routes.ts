import { Router, type Response } from 'express'
import { z } from 'zod'
import { loginUser, registerUser } from '../services/auth.service'

const router = Router()

const authInputSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function setAuthCookie(response: Response, token: string) {
  response.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  })
}

router.post('/register', async (request, response) => {
  const parsedInput = authInputSchema.safeParse(request.body)

  if (!parsedInput.success) {
    return response.status(400).json({
      message: 'Invalid registration data',
      errors: parsedInput.error.flatten().fieldErrors,
    })
  }

  try {
    const { user, token } = await registerUser(
      parsedInput.data.email,
      parsedInput.data.password,
    )

    setAuthCookie(response, token)

    return response.status(201).json({ user })
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      return response.status(409).json({
        message: 'An account with this email already exists',
      })
    }

    return response.status(500).json({
      message: 'Could not create account',
    })
  }
})

router.post('/login', async (request, response) => {
  const parsedInput = authInputSchema.safeParse(request.body)

  if (!parsedInput.success) {
    return response.status(400).json({
      message: 'Invalid login data',
      errors: parsedInput.error.flatten().fieldErrors,
    })
  }

  try {
    const { user, token } = await loginUser(
      parsedInput.data.email,
      parsedInput.data.password,
    )

    setAuthCookie(response, token)

    return response.status(200).json({ user })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      return response.status(401).json({
        message: 'Incorrect email or password',
      })
    }

    return response.status(500).json({
      message: 'Could not log in',
    })
  }
})

router.post('/logout', (_request, response) => {
  response.clearCookie('token')
  return response.status(204).send()
})

export default router
