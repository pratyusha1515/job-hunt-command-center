import { prisma } from '../lib/prisma'

export async function getDashboardSummary(userId: string) {
  const [totalJobs, totalApplications, statusCounts] = await Promise.all([
    prisma.job.count({
      where: { userId },
    }),
    prisma.application.count({
      where: {
        job: { userId },
      },
    }),
    prisma.application.groupBy({
      by: ['status'],
      where: {
        job: { userId },
      },
      _count: {
        _all: true,
      },
    }),
  ])

  const [recentJobs, recentApplications] = await Promise.all([
    prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.application.findMany({
      where: { job: { userId } },
      include: { job: true },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    }),
  ])

  return {
    totalJobs,
    totalApplications,
    statusCounts: statusCounts.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
    recentJobs,
    recentApplications,
  }
}
