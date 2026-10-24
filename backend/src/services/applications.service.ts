import { prisma } from '../lib/prisma'

export const applicationStatuses = [
  'APPLIED',
  'OA',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
  'GHOSTED',
] as const

export type ApplicationStatus = (typeof applicationStatuses)[number]

export async function createApplication(userId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId,
    },
  })

  if (!job) {
    throw new Error('JOB_NOT_FOUND')
  }

  const existingApplication = await prisma.application.findUnique({
    where: { jobId },
  })

  if (existingApplication) {
    throw new Error('APPLICATION_ALREADY_EXISTS')
  }

  return prisma.application.create({
    data: { jobId },
    include: { job: true },
  })
}

export async function listApplications(userId: string) {
  return prisma.application.findMany({
    where: {
      job: { userId },
    },
    include: { job: true },
    orderBy: {
      updatedAt: 'desc',
    },
  })
}

export async function updateApplicationNotes(
  userId: string,
  applicationId: string,
  notes: string | null,
) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, job: { userId } },
  })

  if (!application) {
    throw new Error('APPLICATION_NOT_FOUND')
  }

  return prisma.application.update({
    where: { id: applicationId },
    data: { notes },
    include: { job: true },
  })
}

export async function updateApplicationStatus(
  userId: string,
  applicationId: string,
  status: ApplicationStatus,
) {
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      job: { userId },
    },
  })

  if (!application) {
    throw new Error('APPLICATION_NOT_FOUND')
  }

  return prisma.application.update({
    where: { id: applicationId },
    data: { status },
    include: { job: true },
  })
}
