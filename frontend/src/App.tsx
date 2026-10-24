import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ContactRound,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Pencil,
  Trash2,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  api,
  type Application,
  type ApplicationStatus,
  type Contact,
  type ContactInput,
  type DashboardSummary,
  type Interview,
  type InterviewStatus,
  type InterviewType,
  type Job,
  type JobSource,
  type User,
} from './lib/api'
import ContactsPage from './ContactsPage'
export type AuthMode = 'login' | 'register'
export type Page =
  | 'dashboard'
  | 'jobs'
  | 'applications'
  | 'kanban'
  | 'interviews'
  | 'contacts'
  | 'resumes'
  | 'analytics'
  | 'settings'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { path: '/applications', label: 'Applications', icon: ClipboardList },
  { path: '/interviews', label: 'Interviews', icon: CalendarDays },
  { path: '/contacts', label: 'Contacts', icon: ContactRound },
  { path: '/resumes', label: 'Resumes', icon: FileText },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  OA: 'Assessment',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  GHOSTED: 'Ghosted',
}

const statusStyles: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-blue-50 text-blue-700',
  OA: 'bg-violet-50 text-violet-700',
  INTERVIEW: 'bg-amber-50 text-amber-700',
  OFFER: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  WITHDRAWN: 'bg-slate-100 text-slate-600',
  GHOSTED: 'bg-slate-100 text-slate-600',
}

const sourceLabels: Record<JobSource, string> = {
  LINKEDIN: 'LinkedIn',
  NAUKRI: 'Naukri',
  COMPANY_WEBSITE: 'Company site',
  REFERRAL: 'Referral',
  OTHER: 'Other',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

const interviewTypeLabels: Record<InterviewType, string> = {
  PHONE: "Phone screen",
  VIDEO: "Video interview",
  ONSITE: "On-site interview",
  TECHNICAL: "Technical interview",
  HR: "HR conversation",
  OTHER: "Other",
}

const interviewStatusLabels: Record<InterviewStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

function getPage(pathname: string): Page {
  if (pathname === '/applications/kanban') return 'kanban'
  if (pathname.startsWith('/jobs')) return 'jobs'
  if (pathname.startsWith('/applications')) return 'applications'

  return (pathname.slice(1) || 'dashboard') as Page
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [user, setUser] = useState<User | null>(null)
const [authMode, setAuthMode] = useState<AuthMode>('login')
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [isMenuOpen, setIsMenuOpen] = useState(false)
const [jobs, setJobs] = useState<Job[]>([])
const [applications, setApplications] = useState<Application[]>([])
const [interviews, setInterviews] = useState<Interview[]>([])
const [showInterviewForm, setShowInterviewForm] = useState(false)
const [interviewForm, setInterviewForm] = useState({
  applicationId: '',
  scheduledAt: '',
  type: 'VIDEO' as InterviewType,
  meetingUrl: '',
  prepNotes: '',
})
const [summary, setSummary] = useState<DashboardSummary | null>(null)
const [showJobForm, setShowJobForm] = useState(false)
const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [jobQuery, setJobQuery] = useState('')
  const [jobSourceFilter, setJobSourceFilter] = useState<JobSource | 'ALL'>('ALL')
  const [applicationQuery, setApplicationQuery] = useState('')
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL')

const [jobForm, setJobForm] = useState({
  company: '',
  title: '',
  location: '',
  jobUrl: '',
  description: '',
  notes: '',
  source: 'LINKEDIN' as JobSource,
})
const [contacts, setContacts] = useState<Contact[]>([])
const [showContactForm, setShowContactForm] = useState(false)
const [editingContact, setEditingContact] = useState<Contact | null>(null)

const [contactForm, setContactForm] = useState<ContactInput>({
  name: '',
  company: '',
  jobTitle: '',
  email: '',
  linkedinUrl: '',
  notes: '',
})

  const page = getPage(location.pathname)

  const appliedJobIds = useMemo(
    () => new Set(applications.map((item) => item.job.id)),
    [applications],
  )

  const filteredJobs = useMemo(() => {
    const query = jobQuery.trim().toLowerCase()

    return jobs.filter((job) => {
      const matchesQuery = !query || [job.company, job.title, job.location ?? ''].some((value) => value.toLowerCase().includes(query))
      const matchesSource = jobSourceFilter === 'ALL' || job.source === jobSourceFilter

      return matchesQuery && matchesSource
    })
  }, [jobQuery, jobs, jobSourceFilter])

  const filteredApplications = useMemo(() => {
    const query = applicationQuery.trim().toLowerCase()

    return applications.filter((application) => {
      const matchesQuery = !query || [application.job.company, application.job.title].some((value) => value.toLowerCase().includes(query))
      const matchesStatus = applicationStatusFilter === 'ALL' || application.status === applicationStatusFilter

      return matchesQuery && matchesStatus
    })
  }, [applicationQuery, applicationStatusFilter, applications])

  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/dashboard', { replace: true })
    }
  }, [location.pathname, navigate, user])

  async function loadWorkspace() {
    const [jobsResult, applicationsResult, dashboardResult, interviewsResult] =
      await Promise.all([
        api.getJobs(),
        api.getApplications(),
        api.getDashboard(),
        api.getInterviews(),
      ])

    setJobs(jobsResult.jobs)
    setApplications(applicationsResult.applications)
    setSummary(dashboardResult.summary)
    setInterviews(interviewsResult.interviews)
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result =
        authMode === 'login'
          ? await api.login(email, password)
          : await api.register(email, password)

      setUser(result.user)
      await loadWorkspace()
      navigate('/dashboard')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not authenticate',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const jobInput = {
        company: jobForm.company,
        title: jobForm.title,
        location: jobForm.location || undefined,
        jobUrl: jobForm.jobUrl || undefined,
        description: jobForm.description || undefined,
        notes: jobForm.notes || undefined,
        source: jobForm.source,
      }

      if (editingJob) {
        await api.updateJob(editingJob.id, jobInput)
      } else {
        await api.createJob(jobInput)
      }

      setJobForm({
        company: '',
        title: '',
        location: '',
        jobUrl: '',
        description: '',
        notes: '',
        source: 'LINKEDIN',
      })
      setEditingJob(null)

      setShowJobForm(false)
      await loadWorkspace()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not save job',
      )
    } finally {
      setIsLoading(false)
    }
  }

  function beginEditingJob(job: Job) {
    setEditingJob(job)
    setJobForm({
      company: job.company,
      title: job.title,
      location: job.location ?? '',
      jobUrl: job.jobUrl ?? '',
      description: job.description ?? '',
      notes: job.notes ?? '',
      source: job.source,
    })
    setShowJobForm(true)
  }

  async function handleDeleteJob(job: Job) {
    if (!window.confirm(`Delete  at ? This cannot be undone.`)) {
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await api.deleteJob(job.id)
      await loadWorkspace()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not delete job')
    } finally {
      setIsLoading(false)
    }
  }

  async function createApplication(jobId: string) {
    setIsLoading(true)

    try {
      await api.createApplication(jobId)
      await loadWorkspace()
      navigate('/applications/kanban')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not create application',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function updateApplicationNotes(id: string, notes: string | null) {
    setError('')
    setIsLoading(true)

    try {
      await api.updateApplicationNotes(id, notes)
      await loadWorkspace()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update application notes')
    } finally {
      setIsLoading(false)
    }
  }

  async function updateStatus(id: string, status: ApplicationStatus) {
    setIsLoading(true)

    try {
      await api.updateApplicationStatus(id, status)
      await loadWorkspace()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not update application',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await api.createInterview({
        applicationId: interviewForm.applicationId,
        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        type: interviewForm.type,
        meetingUrl: interviewForm.meetingUrl || undefined,
        prepNotes: interviewForm.prepNotes || undefined,
      })
      setInterviewForm({
        applicationId: "",
        scheduledAt: "",
        type: "VIDEO",
        meetingUrl: "",
        prepNotes: "",
      })
      setShowInterviewForm(false)
      await loadWorkspace()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not schedule interview")
    } finally {
      setIsLoading(false)
    }
  }

  async function updateInterviewStatus(id: string, status: InterviewStatus) {
    setError("")
    setIsLoading(true)

    try {
      await api.updateInterview(id, { status })
      await loadWorkspace()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update interview")
    } finally {
      setIsLoading(false)
    }
  }

function resetContactForm() {
  setContactForm({
    name: '',
    company: '',
    jobTitle: '',
    email: '',
    linkedinUrl: '',
    notes: '',
  })
  setEditingContact(null)
  setShowContactForm(false)
}

async function handleSaveContact(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setError('')
  setIsLoading(true)

  try {
    const input: ContactInput = {
      name: contactForm.name.trim(),
      company: contactForm.company?.trim() || undefined,
      jobTitle: contactForm.jobTitle?.trim() || undefined,
      email: contactForm.email?.trim() || undefined,
      linkedinUrl: contactForm.linkedinUrl?.trim() || undefined,
      notes: contactForm.notes?.trim() || undefined,
    }

    if (editingContact) {
      await api.updateContact(editingContact.id, input)
    } else {
      await api.createContact(input)
    }

    resetContactForm()
    const result = await api.getContacts()
    setContacts(result.contacts)
  } catch (requestError) {
    setError(
      requestError instanceof Error
        ? requestError.message
        : 'Could not save contact',
    )
  } finally {
    setIsLoading(false)
  }
}

function beginEditingContact(contact: Contact) {
  setEditingContact(contact)
  setContactForm({
    name: contact.name,
    company: contact.company ?? '',
    jobTitle: contact.jobTitle ?? '',
    email: contact.email ?? '',
    linkedinUrl: contact.linkedinUrl ?? '',
    notes: contact.notes ?? '',
  })
  setShowContactForm(true)
}

async function handleDeleteContact(contact: Contact) {
  if (!window.confirm(`Delete ${contact.name} from your contacts?`)) return

  setError('')
  setIsLoading(true)

  try {
    await api.deleteContact(contact.id)
    setContacts((current) => current.filter((item) => item.id !== contact.id))
  } catch (requestError) {
    setError(
      requestError instanceof Error
        ? requestError.message
        : 'Could not delete contact',
    )
  } finally {
    setIsLoading(false)
  }
}


  async function logout() {
    await api.logout()
    setUser(null)
    setJobs([])
    setApplications([])
    setInterviews([])
    setSummary(null)
    navigate('/')
  }

  if (!user) {
    const isLogin = authMode === 'login'

    return (
      <main className="min-h-screen bg-[#fbfcfe] px-5 py-7 text-slate-900">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
            <Sparkles className="size-5" />
          </span>
          <p className="text-sm font-extrabold leading-tight">
            Job Hunt
            <br />
            Command Center
          </p>
        </div>

        <section className="mx-auto flex min-h-[calc(100vh-95px)] max-w-md items-center">
          <div className="w-full animate-rise-in">
            <p className="text-center text-xs font-extrabold tracking-[0.16em] text-indigo-600">
              YOUR CAREER WORKSPACE
            </p>
            <h1 className="mt-3 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              {isLogin
                ? 'Stay focused on what’s next.'
                : 'Start your search with clarity.'}
            </h1>
            <p className="mt-4 text-center leading-7 text-slate-500">
              Save opportunities, manage applications, and build momentum in
              one focused place.
            </p>

            <form
              className="mt-9 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40"
              onSubmit={handleAuth}
            >
              <label className="block text-sm font-bold text-slate-700">
                Email
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Password
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  type="password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60"
                disabled={isLoading}
                type="submit"
              >
                {isLoading
                  ? 'Please wait…'
                  : isLogin
                    ? 'Sign in'
                    : 'Create account'}
                <ChevronRight className="size-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isLogin ? 'New here?' : 'Already have an account?'}{' '}
              <button
                className="font-bold text-indigo-600"
                onClick={() => {
                  setAuthMode(isLogin ? 'register' : 'login')
                  setError('')
                }}
                type="button"
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          </div>
        </section>
      </main>
    )
  }

  const title = {
    dashboard: 'Dashboard',
    jobs: 'Job tracker',
    applications: 'Applications',
    kanban: 'Application pipeline',
    interviews: 'Interviews',
    contacts: 'Contacts',
    resumes: 'Resumes',
    analytics: 'Analytics',
    settings: 'Settings',
  }[page]

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[270px] border-r border-slate-200 bg-white p-5 transition-transform duration-300 lg:translate-x-0 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
            <Sparkles className="size-5" />
          </span>
          <p className="text-sm font-extrabold leading-tight">
            Job Hunt
            <br />
            Command Center
          </p>
        </div>

        <nav className="mt-10 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`
              }
              key={path}
              onClick={() => setIsMenuOpen(false)}
              to={path}
            >
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-slate-50 p-3">
          <p className="truncate text-xs font-bold text-slate-700">{user.email}</p>
          <button
            className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-600"
            onClick={logout}
            type="button"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {isMenuOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <section className="min-h-screen lg:pl-[270px]">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setIsMenuOpen(true)}
              type="button"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="hidden text-xs font-medium text-slate-400 sm:block">
                Your job search workspace
              </p>
              <h2 className="font-extrabold">{title}</h2>
            </div>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            onClick={() => {
              setShowJobForm(true)
              navigate('/jobs')
            }}
            type="button"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add job</span>
          </button>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
          {error && (
            <div className="mb-5 flex justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
              <button onClick={() => setError('')} type="button">
                <X className="size-4" />
              </button>
            </div>
          )}

          {page === 'dashboard' && (
            <>
              <section className="animate-rise-in rounded-3xl bg-slate-900 px-7 py-9 text-white shadow-xl sm:px-10">
                <p className="text-sm font-bold text-indigo-200">GOOD TO SEE YOU</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Your search, in one calm workspace.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Save opportunities, track applications, and always know your
                  next best move.
                </p>
              </section>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Saved jobs', summary?.totalJobs ?? 0],
                  ['Applications', summary?.totalApplications ?? 0],
                  [
                    'Interviews',
                    summary?.statusCounts.find(
                      (item) => item.status === 'INTERVIEW',
                    )?.count ?? 0,
                  ],
                  [
                    'Offers',
                    summary?.statusCounts.find(
                      (item) => item.status === 'OFFER',
                    )?.count ?? 0,
                  ],
                ].map(([label, count]) => (
                  <article
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    key={label}
                  >
                    <p className="text-sm font-bold text-slate-500">{label}</p>
                    <p className="mt-3 text-3xl font-extrabold">{count}</p>
                  </article>
                ))}
              <section className="mt-6 grid gap-4 xl:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-extrabold">Recently saved jobs</h2>
                      <p className="mt-1 text-sm text-slate-500">Your latest opportunities.</p>
                    </div>
                    <BriefcaseBusiness className="size-5 text-indigo-500" />
                  </div>
                  <div className="mt-4 divide-y divide-slate-100">
                    {(summary?.recentJobs ?? []).map((job) => (
                      <div className="flex items-center justify-between gap-3 py-3" key={job.id}>
                        <div>
                          <p className="text-sm font-bold">{job.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{job.company} · Saved {formatDate(job.createdAt)}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{sourceLabels[job.source]}</span>
                      </div>
                    ))}
                    {!summary?.recentJobs.length && (
                      <p className="py-8 text-center text-sm text-slate-500">Add your first opportunity from Jobs to see it here.</p>
                    )}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-extrabold">Recent application activity</h2>
                      <p className="mt-1 text-sm text-slate-500">Latest updates to your pipeline.</p>
                    </div>
                    <ClipboardList className="size-5 text-indigo-500" />
                  </div>
                  <div className="mt-4 divide-y divide-slate-100">
                    {(summary?.recentApplications ?? []).map((application) => (
                      <div className="flex items-center justify-between gap-3 py-3" key={application.id}>
                        <div>
                          <p className="text-sm font-bold">{application.job.company}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{application.job.title} · Updated {formatDate(application.updatedAt)}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold `}>{statusLabels[application.status]}</span>
                      </div>
                    ))}
                    {!summary?.recentApplications.length && (
                      <p className="py-8 text-center text-sm text-slate-500">Create an application from a saved job to begin your pipeline.</p>
                    )}
                  </div>
                </article>
              </section>
              </div>
            </>
          )}

          {page === 'jobs' && (
            <>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.16em] text-indigo-600">
                    OPPORTUNITY TRACKER
                  </p>
                  <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                    Build your next move.
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Save promising roles, then turn the right ones into
                    applications.
                  </p>
                </div>
              </div>

              {showJobForm && (
                <form
                  className="mt-6 grid gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 sm:grid-cols-2"
                  onSubmit={handleSaveJob}
                >
                  {[
                    ['Company', 'company', 'e.g. Atlassian'],
                    ['Role', 'title', 'e.g. Frontend Engineer'],
                    ['Location', 'location', 'e.g. Hyderabad / Remote'],
                  ].map(([label, field, placeholder]) => (
                    <label className="text-sm font-bold text-slate-700" key={field}>
                      {label}
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500"
                        placeholder={placeholder}
                        required={field !== 'location'}
                        value={jobForm[field as 'company' | 'title' | 'location']}
                        onChange={(event) =>
                          setJobForm({
                            ...jobForm,
                            [field]: event.target.value,
                          })
                        }
                      />
                    </label>
                  ))}

                  <label className="text-sm font-bold text-slate-700">
                    Source
                    <select
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                      value={jobForm.source}
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          source: event.target.value as JobSource,
                        })
                      }
                    >
                      {Object.entries(sourceLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
              <label className="text-sm font-bold text-slate-700">
  Job URL
  <input
    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500"
    placeholder="https://company.com/jobs/..."
    type="url"
    value={jobForm.jobUrl}
    onChange={(event) =>
      setJobForm({ ...jobForm, jobUrl: event.target.value })
    }
  />
</label>

<label className="text-sm font-bold text-slate-700 sm:col-span-2">
  Job description
  <textarea
    className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500"
    placeholder="Paste the important parts of the job description…"
    value={jobForm.description}
    onChange={(event) =>
      setJobForm({ ...jobForm, description: event.target.value })
    }
  />
</label>

<label className="text-sm font-bold text-slate-700 sm:col-span-2">
  Private notes
  <textarea
    className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500"
    placeholder="Referral details, follow-up ideas, salary expectations…"
    value={jobForm.notes}
    onChange={(event) =>
      setJobForm({ ...jobForm, notes: event.target.value })
    }
  />
</label>


                  <div className="flex justify-end gap-3 sm:col-span-2">
                    <button
                      className="px-4 py-2.5 text-sm font-bold text-slate-600"
                      onClick={() => {
                        setShowJobForm(false)
                        setEditingJob(null)
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"
                      disabled={isLoading}
                      type="submit"
                    >
                      {editingJob ? 'Save changes' : 'Save opportunity'}
                    </button>
                  </div>
                </form>
              )}              <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Search jobs</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-indigo-500 placeholder:text-slate-400 focus:ring-2"
                    placeholder="Search company, role, or location"
                    value={jobQuery}
                    onChange={(event) => setJobQuery(event.target.value)}
                  />
                </label>
                <select
                  aria-label="Filter jobs by source"
                  className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none ring-indigo-500 focus:ring-2"
                  value={jobSourceFilter}
                  onChange={(event) => setJobSourceFilter(event.target.value as JobSource | 'ALL')}
                >
                  <option value="ALL">All sources</option>
                  {Object.entries(sourceLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {filteredJobs.map((job) => (
                  <article
                    className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    key={job.id}
                  >
                    <div>
                      <p className="font-extrabold">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {job.company} · {job.location || 'Location not specified'}
                      </p>
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        Saved {formatDate(job.createdAt)} ·{' '}
                        {sourceLabels[job.source]}
                      </p>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                      {appliedJobIds.has(job.id) ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="size-3.5" />
                          In pipeline
                        </span>
                      ) : (
                        <button
                          className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                          disabled={isLoading}
                          onClick={() => createApplication(job.id)}
                          type="button"
                        >
                          Apply & track
                        </button>
                      )}
                      <button
                        aria-label={`Edit `}
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        disabled={isLoading}
                        onClick={() => beginEditingJob(job)}
                        type="button"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        aria-label={`Delete `}
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        disabled={isLoading}
                        onClick={() => handleDeleteJob(job)}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </article>
                ))}

                {!jobs.length ? (
                  <p className="p-10 text-center text-sm text-slate-500">
                    No jobs saved yet. Add your first opportunity above.
                  </p>
                ) : !filteredJobs.length ? (
                  <p className="p-10 text-center text-sm text-slate-500">
                    No jobs match your search or filter.
                  </p>
                ) : null}
              </div>
            </>
          )}

          {page === 'applications' && (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.16em] text-indigo-600">
                    APPLICATIONS
                  </p>
                  <h1 className="mt-2 text-3xl font-extrabold">
                    Keep your pipeline current.
                  </h1>
                </div>
                <button
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"
                  onClick={() => navigate('/applications/kanban')}
                  type="button"
                >
                  Board view
                </button>
              </div>
              <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Search applications</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-indigo-500 placeholder:text-slate-400 focus:ring-2"
                    placeholder="Search company or role"
                    value={applicationQuery}
                    onChange={(event) => setApplicationQuery(event.target.value)}
                  />
                </label>
                <select
                  aria-label="Filter applications by status"
                  className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none ring-indigo-500 focus:ring-2"
                  value={applicationStatusFilter}
                  onChange={(event) => setApplicationStatusFilter(event.target.value as ApplicationStatus | 'ALL')}
                >
                  <option value="ALL">All stages</option>
                  {(Object.keys(statusLabels) as ApplicationStatus[]).map((status) => (
                    <option key={status} value={status}>{statusLabels[status]}</option>
                  ))}
                </select>
              </div>

              <ApplicationTable
                applications={filteredApplications}
                emptyMessage={applications.length ? 'No applications match your search or filter.' : 'Create an application from Jobs to begin tracking it.'}
                isLoading={isLoading}
                onNotesChange={updateApplicationNotes}
                onChange={updateStatus}
              />
            </>
          )}

          {page === 'kanban' && (
            <>
              <p className="text-xs font-extrabold tracking-[0.16em] text-indigo-600">
                APPLICATION PIPELINE
              </p>
              <h1 className="mt-2 text-3xl font-extrabold">
                See the whole story.
              </h1>

              <div className="mt-6 grid gap-4 xl:grid-cols-4">
                {(['APPLIED', 'OA', 'INTERVIEW', 'OFFER'] as ApplicationStatus[]).map(
                  (stage) => (
                    <section
                      className="min-h-72 rounded-2xl bg-slate-100 p-3"
                      key={stage}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[stage]}`}
                        >
                          {statusLabels[stage]}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {
                            applications.filter(
                              (item) => item.status === stage,
                            ).length
                          }
                        </span>
                      </div>

                      <div className="space-y-3">
                        {applications
                          .filter((item) => item.status === stage)
                          .map((item) => (
                            <article
                              className="rounded-xl bg-white p-4 shadow-sm"
                              key={item.id}
                            >
                              <p className="font-extrabold">
                                {item.job.company}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {item.job.title}
                              </p>
                              <select
                                className="mt-4 w-full rounded-lg bg-slate-50 px-2 py-2 text-xs font-bold text-slate-600"
                                disabled={isLoading}
                                value={item.status}
                                onChange={(event) =>
                                  updateStatus(
                                    item.id,
                                    event.target.value as ApplicationStatus,
                                  )
                                }
                              >
                                {(['APPLIED', 'OA', 'INTERVIEW', 'OFFER'] as ApplicationStatus[]).map(
                                  (status) => (
                                    <option key={status} value={status}>
                                      {statusLabels[status]}
                                    </option>
                                  ),
                                )}
                              </select>
                            </article>
                          ))}
                      </div>
                    </section>
                  ),
                )}
              </div>
            </>
          )}

          {page === "interviews" && (
            <InterviewsPage
              applications={applications}
              interviews={interviews}
              isLoading={isLoading}
              interviewForm={interviewForm}
              showForm={showInterviewForm}
              onFormChange={setInterviewForm}
              onShowForm={setShowInterviewForm}
              onSubmit={handleSaveInterview}
              onStatusChange={updateInterviewStatus}
            />
      
          )}

{page === 'contacts' && (
  <ContactsPage
    contacts={contacts}
    isLoading={isLoading}
    onSave={handleSaveContact}
    onEdit={beginEditingContact}
    onDelete={handleDeleteContact}
    onAdd={() => {
      resetContactForm()
      setShowContactForm(true)
    }}
    showForm={showContactForm}
    editingContact={editingContact}
    form={contactForm}
    setForm={setContactForm}
    onCancel={resetContactForm}
  />
)}


          {['contacts', 'resumes', 'analytics', 'settings'].includes(
            page,
          ) && (
            <section className="animate-rise-in">
              <p className="text-xs font-extrabold tracking-[0.16em] text-indigo-600">
                {page.toUpperCase()}
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                Your {page} workspace.
              </h1>
              <article className="mt-6 grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <Sparkles className="mx-auto size-8 text-indigo-500" />
                  <h2 className="mt-4 text-lg font-extrabold">
                    This page is ready for its data layer.
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Its design and navigation are complete. We will connect it
                    to its own database model rather than showing fake data.
                  </p>
                </div>
              </article>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

function InterviewsPage({
  applications,
  interviews,
  isLoading,
  interviewForm,
  showForm,
  onFormChange,
  onShowForm,
  onSubmit,
  onStatusChange,
}: {
  applications: Application[]
  interviews: Interview[]
  isLoading: boolean
  interviewForm: { applicationId: string; scheduledAt: string; type: InterviewType; meetingUrl: string; prepNotes: string }
  showForm: boolean
  onFormChange: (form: { applicationId: string; scheduledAt: string; type: InterviewType; meetingUrl: string; prepNotes: string }) => void
  onShowForm: (show: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onStatusChange: (id: string, status: InterviewStatus) => void
}) {
  return (
    <section className="animate-rise-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold tracking-[0.16em] text-indigo-600">INTERVIEW PLANNER</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Prepare with intention.</h1>
          <p className="mt-2 text-sm text-slate-500">Schedule each conversation and keep its preparation in one calm place.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60" disabled={!applications.length} onClick={() => onShowForm(true)} type="button">
          <Plus className="size-4" /> Schedule interview
        </button>
      </div>

      {!applications.length && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Create an application first, then you can schedule its interview.</p>}

      {showForm && (
        <form className="mt-6 grid gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">
            Application
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" required value={interviewForm.applicationId} onChange={(event) => onFormChange({ ...interviewForm, applicationId: event.target.value })}>
              <option value="">Choose an application</option>
              {applications.map((application) => <option key={application.id} value={application.id}>{application.job.company} — {application.job.title}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">
            Date and time
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500" required type="datetime-local" value={interviewForm.scheduledAt} onChange={(event) => onFormChange({ ...interviewForm, scheduledAt: event.target.value })} />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Interview type
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" value={interviewForm.type} onChange={(event) => onFormChange({ ...interviewForm, type: event.target.value as InterviewType })}>
              {(Object.keys(interviewTypeLabels) as InterviewType[]).map((type) => <option key={type} value={type}>{interviewTypeLabels[type]}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">
            Meeting link <span className="font-medium text-slate-400">(optional)</span>
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="https://meet.google.com/..." type="url" value={interviewForm.meetingUrl} onChange={(event) => onFormChange({ ...interviewForm, meetingUrl: event.target.value })} />
          </label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">
            Preparation notes <span className="font-medium text-slate-400">(optional)</span>
            <textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="Topics to revise, questions to ask, or stories to prepare…" value={interviewForm.prepNotes} onChange={(event) => onFormChange({ ...interviewForm, prepNotes: event.target.value })} />
          </label>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button className="px-4 py-2.5 text-sm font-bold text-slate-600" onClick={() => onShowForm(false)} type="button">Cancel</button>
            <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60" disabled={isLoading} type="submit">Schedule interview</button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {interviews.map((interview) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={interview.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-extrabold">{interview.application.job.company}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">{interview.application.job.title} · {interviewTypeLabels[interview.type]}</p>
                <p className="mt-3 text-sm font-bold text-indigo-700">{formatDateTime(interview.scheduledAt)}</p>
                {interview.prepNotes && <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-slate-500">{interview.prepNotes}</p>}
                {interview.meetingUrl && <a className="mt-3 inline-block text-sm font-bold text-indigo-600 hover:text-indigo-800" href={interview.meetingUrl} rel="noreferrer" target="_blank">Open meeting link</a>}
              </div>
              <select aria-label="Update interview status" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500" disabled={isLoading} value={interview.status} onChange={(event) => onStatusChange(interview.id, event.target.value as InterviewStatus)}>
                {(Object.keys(interviewStatusLabels) as InterviewStatus[]).map((status) => <option key={status} value={status}>{interviewStatusLabels[status]}</option>)}
              </select>
            </div>
          </article>
        ))}
        {!interviews.length && (
          <article className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div>
              <CalendarDays className="mx-auto size-8 text-indigo-500" />
              <h2 className="mt-4 text-lg font-extrabold">No interviews scheduled yet.</h2>
              <p className="mt-2 text-sm text-slate-500">When a conversation is booked, add it here so preparation never gets lost.</p>
            </div>
          </article>
        )}
      </div>
    </section>
  )
}

function ApplicationTable({
  applications,
  emptyMessage,
  isLoading,
  onChange,
  onNotesChange,
}: {
  applications: Application[]
  emptyMessage: string
  isLoading: boolean
  onChange: (id: string, status: ApplicationStatus) => void
  onNotesChange: (id: string, notes: string | null) => void
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-4">Company</th>
            <th className="px-5 py-4">Role</th>
            <th className="px-5 py-4">Applied</th>
            <th className="px-5 py-4">Stage</th>
            <th className="px-5 py-4">Notes</th>
            <th className="px-5 py-4">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((item) => (
            <tr className="hover:bg-slate-50" key={item.id}>
              <td className="px-5 py-4 font-bold">{item.job.company}</td>
              <td className="px-5 py-4 text-slate-600">{item.job.title}</td>
              <td className="px-5 py-4 text-slate-500">
                {formatDate(item.appliedAt)}
              </td>
              <td className="px-5 py-4">
                <select
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyles[item.status]}`}
                  disabled={isLoading}
                  value={item.status}
                  onChange={(event) =>
                    onChange(item.id, event.target.value as ApplicationStatus)
                  }
                >
                  {(Object.keys(statusLabels) as ApplicationStatus[]).map(
                    (status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ),
                  )}
                </select>              </td>
              <td className="px-5 py-4">
                <input
                  className="w-48 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500"
                  defaultValue={item.notes ?? ''}
                  disabled={isLoading}
                  onBlur={(event) => {
                    const notes = event.target.value.trim() || null
                    if (notes !== item.notes) onNotesChange(item.id, notes)
                  }}
                  placeholder="Add a note"
                />
              </td>
              <td className="px-5 py-4 text-slate-500">{formatDate(item.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!applications.length && (
        <p className="p-10 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      )}
    </div>
  )
}

export default App