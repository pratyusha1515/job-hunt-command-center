
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

type ResumeInput = {
  title?: string
  targetRole?: string
  fileUrl?: string
  notes?: string
  isDefault?: boolean
}

export async function getResumes(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createResume(
  userId: string,
  input: ResumeInput,
) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.resume.updateMany({
        where: { userId },
        data: { isDefault: false },
      })
    }

    return tx.resume.create({
      data: {
        userId,
        title: input.title ?? 'Untitled Resume',
        targetRole: input.targetRole,
        fileUrl: input.fileUrl,
        notes: input.notes,
        isDefault: input.isDefault ?? false,
      },
    })
  })
}

export async function updateResume(
  userId: string,
  resumeId: string,
  input: ResumeInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.resume.findFirst({
      where: { id: resumeId, userId },
    })

    if (!existing) return null

    if (input.isDefault) {
      await tx.resume.updateMany({
        where: { userId },
        data: { isDefault: false },
      })
    }

    return tx.resume.update({
      where: { id: resumeId },
      data: input,
    })
  })
}

export async function deleteResume(
  userId: string,
  resumeId: string,
) {
  const existing = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true },
  })

  if (!existing) return false

  await prisma.resume.delete({
    where: { id: resumeId },
  })

  return true
}
