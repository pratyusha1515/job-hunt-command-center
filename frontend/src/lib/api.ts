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
  job: Job
}

export type DashboardSummary = {
  totalJobs: number
  totalApplications: number
  statusCounts: Array<{
    status: ApplicationStatus
    count: number
  }>
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

  createJob(job: {
    company: string
    title: string
    location?: string
    source: JobSource
  }) {
    return apiRequest<{ job: Job }>('/jobs', {
      method: 'POST',
      body: job,
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

  updateApplicationStatus(id: string, status: ApplicationStatus) {
    return apiRequest<{ application: Application }>(
      `/applications/${id}/status`,
      {
        method: 'PATCH',
        body: { status },
      },
    )
  },

  getDashboard() {
    return apiRequest<{ summary: DashboardSummary }>('/dashboard')
  },
}