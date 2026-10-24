const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export type User = {
  id: string
  email: string
  createdAt: string
}

export type JobSource =
  | 'LINKEDIN'
  | 'NAUKRI'
  | 'COMPANY_WEBSITE'
  | 'REFERRAL'
  | 'OTHER'
export type JobInput = {
  company: string
  title: string
  location?: string
  jobUrl?: string
  description?: string
  source: JobSource
  notes?: string
}
export type InterviewType = "PHONE" | "VIDEO" | "ONSITE" | "TECHNICAL" | "HR" | "OTHER"
export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED"

export type ApplicationStatus =
  | 'APPLIED'
  | 'OA'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'GHOSTED'

export type Job = {
  id: string
  company: string
  title: string
  location: string | null
  jobUrl: string | null
  description: string | null
  source: JobSource
  notes: string | null
  createdAt: string

}

export type Application = {
  id: string
  status: ApplicationStatus
  appliedAt: string
  notes: string | null
  updatedAt: string
  job: Job
}

export type Interview = {
  id: string
  scheduledAt: string
  type: InterviewType
  meetingUrl: string | null
  prepNotes: string | null
  outcome: string | null
  status: InterviewStatus
  application: Application
}

export type InterviewInput = {
  applicationId: string
  scheduledAt: string
  type: InterviewType
  meetingUrl?: string
  prepNotes?: string
  outcome?: string
  status?: InterviewStatus
}

export type Contact = {
  id: string
  name: string
  company: string | null
  jobTitle: string | null
  email: string | null
  linkedinUrl: string | null
  notes: string | null
  lastContacted: string | null
  createdAt: string
  updatedAt: string
}

export type ContactInput = {
  name: string
  company?: string
  jobTitle?: string
  email?: string
  linkedinUrl?: string
  notes?: string
  lastContacted?: string
}


export type DashboardSummary = {
  totalJobs: number
  totalApplications: number
  statusCounts: Array<{
    status: ApplicationStatus
    count: number
  }>
  recentJobs: Job[]
  recentApplications: Application[]
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Something went wrong')
  }

  return data as T
}

export const api = {
  register(email: string, password: string) {
    return apiRequest<{ user: User }>('/auth/register', {
      method: 'POST',
      body: { email, password },
    })
  },

  login(email: string, password: string) {
    return apiRequest<{ user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  },

  logout() {
    return apiRequest<void>('/auth/logout', {
      method: 'POST',
    })
  },

  getJobs() {
    return apiRequest<{ jobs: Job[] }>('/jobs')
  },

  createJob(job: JobInput) {
    return apiRequest<{ job: Job }>('/jobs', {
      method: 'POST',
      body: job,
    })
  },

  updateJob(id: string, job: Partial<JobInput>) {
    return apiRequest<{ job: Job }>(`/jobs/${id}`, {
      method: 'PATCH',
      body: job,
    })
  },

  deleteJob(id: string) {
    return apiRequest<void>(`/jobs/${id}`, {
      method: 'DELETE',
    })
  },

  getApplications() {
    return apiRequest<{ applications: Application[] }>('/applications')
  },

  createApplication(jobId: string) {
    return apiRequest<{ application: Application }>('/applications', {
      method: 'POST',
      body: { jobId },
    })
  },

  updateApplicationNotes(id: string, notes: string | null) {
    return apiRequest<{ application: Application }>(`/applications/${id}`, {
      method: 'PATCH',
      body: { notes },
    })
  },

  updateApplicationStatus(id: string, status: ApplicationStatus) {
    return apiRequest<{ application: Application }>(
      `/applications/${id}/status`,
      {
        method: 'PATCH',
        body: { status },
      },
    )
  },

  getInterviews() {
    return apiRequest<{ interviews: Interview[] }>("/interviews")
  },

  createInterview(interview: InterviewInput) {
    return apiRequest<{ interview: Interview }>("/interviews", {
      method: "POST",
      body: interview,
    })
  },

  updateInterview(id: string, interview: Partial<Omit<InterviewInput, "applicationId">>) {
    return apiRequest<{ interview: Interview }>(`/interviews/${id}`, {
      method: "PATCH",
      body: interview,
    })
  },

  getContacts() {
    return apiRequest<{ contacts: Contact[] }>('/contacts')
  },

  createContact(contact: ContactInput) {
    return apiRequest<{ contact: Contact }>('/contacts', {
      method: 'POST',
      body: contact,
    })
  },

  updateContact(id: string, contact: Partial<ContactInput>) {
    return apiRequest<{ contact: Contact }>(`/contacts/${id}`, {
      method: 'PATCH',
      body: contact,
    })
  },

  deleteContact(id: string) {
    return apiRequest<void>(`/contacts/${id}`, {
      method: 'DELETE',
    })
  },


  getDashboard() {
    return apiRequest<{ summary: DashboardSummary }>('/dashboard')
  },
}