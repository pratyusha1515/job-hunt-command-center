
import { prisma } from '../lib/prisma'

export type ContactInput = {
  name: string
  company?: string
  jobTitle?: string
  email?: string
  linkedinUrl?: string
  notes?: string
  lastContacted?: Date
}

export type ContactUpdateInput = {
  name?: string
  company?: string | null
  jobTitle?: string | null
  email?: string | null
  linkedinUrl?: string | null
  notes?: string | null
  lastContacted?: Date | null
}

export async function listContacts(userId: string) {
  return prisma.contact.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createContact(
  userId: string,
  input: ContactInput,
) {
  return prisma.contact.create({
    data: {
      ...input,
      userId,
    },
  })
}

export async function updateContact(
  userId: string,
  contactId: string,
  input: ContactUpdateInput,
) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
  })

  if (!contact) {
    throw new Error('CONTACT_NOT_FOUND')
  }

  return prisma.contact.update({
    where: { id: contactId },
    data: input,
  })
}

export async function deleteContact(
  userId: string,
  contactId: string,
) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
  })

  if (!contact) {
    throw new Error('CONTACT_NOT_FOUND')
  }

  await prisma.contact.delete({
    where: { id: contactId },
  })
}
