import { Router } from "express"
import { z } from "zod"
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.middleware"
import {
  createInterview,
  interviewStatuses,
  interviewTypes,
  listInterviews,
  updateInterview,
} from "../services/interviews.service"

const router = Router()

const optionalUrl = z.string().trim().url().optional().or(z.literal(""))
const optionalText = z.string().trim().max(5_000).optional().or(z.literal(""))

const createInterviewSchema = z.object({
  applicationId: z.string().min(1, "Application is required"),
  scheduledAt: z.coerce.date(),
  type: z.enum(interviewTypes).default("VIDEO"),
  meetingUrl: optionalUrl,
  prepNotes: optionalText,
  outcome: z.string().trim().max(2_000).optional().or(z.literal("")),
  status: z.enum(interviewStatuses).default("SCHEDULED"),
})

const updateInterviewSchema = createInterviewSchema
  .omit({ applicationId: true })
  .partial()

router.use(requireAuth)

router.get("/", async (request: AuthenticatedRequest, response) => {
  const interviews = await listInterviews(request.userId!)
  return response.status(200).json({ interviews })
})

router.post("/", async (request: AuthenticatedRequest, response) => {
  const parsed = createInterviewSchema.safeParse(request.body)
  if (!parsed.success) {
    return response.status(400).json({ message: "Invalid interview data", errors: parsed.error.flatten().fieldErrors })
  }

  try {
    const input = parsed.data
    const interview = await createInterview(request.userId!, {
      ...input,
      meetingUrl: input.meetingUrl || undefined,
      prepNotes: input.prepNotes || undefined,
      outcome: input.outcome || undefined,
    })
    return response.status(201).json({ interview })
  } catch (error) {
    if (error instanceof Error && error.message === "APPLICATION_NOT_FOUND") {
      return response.status(404).json({ message: "Application not found" })
    }
    return response.status(500).json({ message: "Could not schedule interview" })
  }
})

router.patch("/:interviewId", async (request: AuthenticatedRequest, response) => {
  const { interviewId } = request.params
  const parsed = updateInterviewSchema.safeParse(request.body)
  if (Array.isArray(interviewId) || !parsed.success) {
    return response.status(400).json({ message: "Invalid interview update", errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors })
  }

  try {
    const input = parsed.data
    const interview = await updateInterview(request.userId!, interviewId, {
      ...input,
      meetingUrl: input.meetingUrl === "" ? null : input.meetingUrl,
      prepNotes: input.prepNotes === "" ? null : input.prepNotes,
      outcome: input.outcome === "" ? null : input.outcome,
    })
    return response.status(200).json({ interview })
  } catch (error) {
    if (error instanceof Error && error.message === "INTERVIEW_NOT_FOUND") {
      return response.status(404).json({ message: "Interview not found" })
    }
    return response.status(500).json({ message: "Could not update interview" })
  }
})

export default router
