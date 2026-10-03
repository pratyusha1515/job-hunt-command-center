import { Router } from 'express'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware'
import { getDashboardSummary } from '../services/dashboard.service'

const router = Router()

router.use(requireAuth)

router.get('/', async (request: AuthenticatedRequest, response) => {
  const summary = await getDashboardSummary(request.userId!)

  return response.status(200).json({ summary })
})

export default router
