import { prisma } from '../lib/prisma'

export type JobInput = {
  company: string
  title: string
  location?: string
  jobUrl?: string
  description?: string
  source: 'LINKEDIN' | 'NAUKRI' | 'COMPANY_WEBSITE' | 'REFERRAL' | 'OTHER'
  notes?: string
}

export async function createJob(userId: string, input: JobInput) {
  return prisma.job.create({
    data: {
      userId,
      ...input,
    },
  })
}

export async function listJobs(userId: string) {
  return prisma.job.findMany({
    where: { userId },
    include: {
      application: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function deleteJob(userId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId,
    },
  })

  if (!job) {
    throw new Error('JOB_NOT_FOUND')
  }

  await prisma.job.delete({
    where: { id: jobId },
  })
}
