import { prisma } from "../lib/prisma"

export const interviewTypes = ["PHONE", "VIDEO", "ONSITE", "TECHNICAL", "HR", "OTHER"] as const
export const interviewStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const

export type InterviewType = (typeof interviewTypes)[number]
export type InterviewStatus = (typeof interviewStatuses)[number]

const interviewInclude = { application: { include: { job: true } } } as const

export async function listInterviews(userId: string) {
  return prisma.interview.findMany({
    where: { application: { job: { userId } } },
    include: interviewInclude,
    orderBy: { scheduledAt: "asc" },
  })
}

export async function createInterview(
  userId: string,
  input: {
    applicationId: string
    scheduledAt: Date
    type: InterviewType
    meetingUrl?: string
    prepNotes?: string
    outcome?: string
    status?: InterviewStatus
  },
) {
  const application = await prisma.application.findFirst({
    where: { id: input.applicationId, job: { userId } },
  })

  if (!application) throw new Error("APPLICATION_NOT_FOUND")

  return prisma.interview.create({
    data: input,
    include: interviewInclude,
  })
}

export async function updateInterview(
  userId: string,
  interviewId: string,
  input: {
    scheduledAt?: Date
    type?: InterviewType
    meetingUrl?: string | null
    prepNotes?: string | null
    outcome?: string | null
    status?: InterviewStatus
  },
) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, application: { job: { userId } } },
  })

  if (!interview) throw new Error("INTERVIEW_NOT_FOUND")

  return prisma.interview.update({
    where: { id: interviewId },
    data: input,
    include: interviewInclude,
  })
}
