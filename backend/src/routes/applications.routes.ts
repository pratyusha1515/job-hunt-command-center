import { Router } from 'express'
import { z } from 'zod'
import {
  applicationStatuses,
  createApplication,
  listApplications,
  updateApplicationStatus,
  updateApplicationNotes,
} from '../services/applications.service'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware'

const router = Router()

const createApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
})

const updateStatusSchema = z.object({
  status: z.enum(applicationStatuses),
})

const updateNotesSchema = z.object({
  notes: z.string().trim().max(5_000).nullable(),
})

router.use(requireAuth)

router.get('/', async (request: AuthenticatedRequest, response) => {
  const applications = await listApplications(request.userId!)
  return response.status(200).json({ applications })
})

router.post('/', async (request: AuthenticatedRequest, response) => {
  const parsedInput = createApplicationSchema.safeParse(request.body)

  if (!parsedInput.success) {
    return response.status(400).json({
      message: 'Invalid application data',
      errors: parsedInput.error.flatten().fieldErrors,
    })
  }

  try {
    const application = await createApplication(
      request.userId!,
      parsedInput.data.jobId,
    )

    return response.status(201).json({ application })
  } catch (error) {
    if (error instanceof Error && error.message === 'JOB_NOT_FOUND') {
      return response.status(404).json({
        message: 'Job not found',
      })
    }

    if (
      error instanceof Error &&
      error.message === 'APPLICATION_ALREADY_EXISTS'
    ) {
      return response.status(409).json({
        message: 'This job already has an application',
      })
    }

    return response.status(500).json({
      message: 'Could not create application',
    })
  }
})

router.patch(
  '/:applicationId/status',
  async (request: AuthenticatedRequest, response) => {
    const { applicationId } = request.params
    const parsedInput = updateStatusSchema.safeParse(request.body)

    if (Array.isArray(applicationId) || !parsedInput.success) {
      return response.status(400).json({
        message: 'Invalid application update',
      })
    }

    try {
      const application = await updateApplicationStatus(
        request.userId!,
        applicationId,
        parsedInput.data.status,
      )

      return response.status(200).json({ application })
    } catch (error) {
      if (error instanceof Error && error.message === 'APPLICATION_NOT_FOUND') {
        return response.status(404).json({
          message: 'Application not found',
        })
      }

      return response.status(500).json({
        message: 'Could not update application',
      })
    }
  },
)

export default router
