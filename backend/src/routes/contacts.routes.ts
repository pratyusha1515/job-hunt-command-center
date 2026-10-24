
import { Router } from 'express'
import { z } from 'zod'
import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from '../services/contacts.service'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware'

const router = Router()

const optionalText = z.string().trim().max(5000).optional().or(z.literal(''))

const contactFields = {
  name: z.string().trim().min(1, 'Name is required').max(120),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  jobTitle: z.string().trim().max(160).optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email').max(254).optional().or(z.literal('')),
  linkedinUrl: z.string().trim().url('Enter a valid URL').max(2048).optional().or(z.literal('')),
  notes: optionalText,
  lastContacted: z.coerce.date().optional(),
}

const createContactSchema = z.object(contactFields)

const updateContactSchema = z
  .object(contactFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  })

router.use(requireAuth)

router.get('/', async (request: AuthenticatedRequest, response) => {
  try {
    const contacts = await listContacts(request.userId!)
    return response.status(200).json({ contacts })
  } catch {
    return response.status(500).json({ message: 'Could not load contacts' })
  }
})

router.post('/', async (request: AuthenticatedRequest, response) => {
  const parsed = createContactSchema.safeParse(request.body)

  if (!parsed.success) {
    return response.status(400).json({
      message: 'Invalid contact data',
      errors: parsed.error.flatten().fieldErrors,
    })
  }

  try {
    const input = parsed.data
    const contact = await createContact(request.userId!, {
      name: input.name,
      company: input.company || undefined,
      jobTitle: input.jobTitle || undefined,
      email: input.email || undefined,
      linkedinUrl: input.linkedinUrl || undefined,
      notes: input.notes || undefined,
      lastContacted: input.lastContacted,
    })

    return response.status(201).json({ contact })
  } catch {
    return response.status(500).json({ message: 'Could not create contact' })
  }
})

router.patch('/:contactId', async (request: AuthenticatedRequest, response) => {
  const { contactId } = request.params
  const parsed = updateContactSchema.safeParse(request.body)

  if (Array.isArray(contactId) || !parsed.success) {
    return response.status(400).json({
      message: 'Invalid contact update',
      errors: parsed.success
        ? undefined
        : parsed.error.flatten().fieldErrors,
    })
  }

  const input = parsed.data

  try {
    const contact = await updateContact(request.userId!, contactId, {
      ...input,
      company: input.company === '' ? null : input.company,
      jobTitle: input.jobTitle === '' ? null : input.jobTitle,
      email: input.email === '' ? null : input.email,
      linkedinUrl: input.linkedinUrl === '' ? null : input.linkedinUrl,
      notes: input.notes === '' ? null : input.notes,
    })

    return response.status(200).json({ contact })
  } catch (error) {
    if (error instanceof Error && error.message === 'CONTACT_NOT_FOUND') {
      return response.status(404).json({ message: 'Contact not found' })
    }

    return response.status(500).json({ message: 'Could not update contact' })
  }
})

router.delete('/:contactId', async (request: AuthenticatedRequest, response) => {
  const { contactId } = request.params

  if (Array.isArray(contactId)) {
    return response.status(400).json({ message: 'Invalid contact ID' })
  }

  try {
    await deleteContact(request.userId!, contactId)
    return response.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'CONTACT_NOT_FOUND') {
      return response.status(404).json({ message: 'Contact not found' })
    }

    return response.status(500).json({ message: 'Could not delete contact' })
  }
})

export default router
