import { Router } from 'express'
import { z } from 'zod'
import {
  createJob,
  deleteJob,
  listJobs,
} from '../services/jobs.service'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware'

const router = Router()

const jobInputSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(120),
  title: z.string().trim().min(1, 'Job title is required').max(160),
  location: z.string().trim().max(120).optional(),
  jobUrl: z.string().trim().url('Enter a valid URL').optional(),
  description: z.string().trim().max(20_000).optional(),
  source: z
    .enum(['LINKEDIN', 'NAUKRI', 'COMPANY_WEBSITE', 'REFERRAL', 'OTHER'])
    .default('OTHER'),
  notes: z.string().trim().max(5_000).optional(),
})

router.use(requireAuth)

router.get('/', async (request: AuthenticatedRequest, response) => {
  const jobs = await listJobs(request.userId!)
  return response.status(200).json({ jobs })
})

router.post('/', async (request: AuthenticatedRequest, response) => {
  const parsedInput = jobInputSchema.safeParse(request.body)

  if (!parsedInput.success) {
    return response.status(400).json({
      message: 'Invalid job data',
      errors: parsedInput.error.flatten().fieldErrors,
    })
  }

  const job = await createJob(request.userId!, parsedInput.data)

  return response.status(201).json({ job })
})

router.delete('/:jobId', async (request: AuthenticatedRequest, response) => {
  const { jobId } = request.params

  if (Array.isArray(jobId)) {
    return response.status(400).json({
      message: 'Invalid job ID',
    })
  }

  try {
    await deleteJob(request.userId!, jobId)
    return response.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'JOB_NOT_FOUND') {
      return response.status(404).json({
        message: 'Job not found',
      })
    }

    return response.status(500).json({
      message: 'Could not delete job',
    })
  }
})
export default router
