import { type FormEvent, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardList,
  LogOut,
  Plus,
  Sparkles,
} from 'lucide-react'
import {
  api,
  type Application,
  type ApplicationStatus,
  type DashboardSummary,
  type Job,
  type JobSource,
  type User,
} from './lib/api'

type View = 'dashboard' | 'jobs' | 'applications'
type AuthMode = 'login' | 'register'

const navItems: Array<{
  id: View
  label: string
  icon: typeof ChartNoAxesCombined
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { id: 'jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { id: 'applications', label: 'Applications', icon: ClipboardList },
]

const statusStyles: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  OA: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  INTERVIEW: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  OFFER: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  WITHDRAWN: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  GHOSTED: 'bg-slate-100 text-slate-700 ring-slate-600/20',
}

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  OA: 'Assessment',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  GHOSTED: 'Ghosted',
}

const sourceLabels: Record<JobSource, string> = {
  LINKEDIN: 'LinkedIn',
  NAUKRI: 'Naukri',
  COMPANY_WEBSITE: 'Company website',
  REFERRAL: 'Referral',
  OTHER: 'Other',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [showJobForm, setShowJobForm] = useState(false)
  const [jobForm, setJobForm] = useState({
    company: '',
    title: '',
    location: '',
    source: 'LINKEDIN' as JobSource,
  })

  const appliedJobIds = useMemo(
    () => new Set(applications.map((application) => application.job.id)),
    [applications],
  )

  async function loadWorkspace() {
    const [jobsResult, applicationsResult, dashboardResult] =
      await Promise.all([
        api.getJobs(),
        api.getApplications(),
        api.getDashboard(),
      ])

    setJobs(jobsResult.jobs)
    setApplications(applicationsResult.applications)
    setSummary(dashboardResult.summary)
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
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

  async function handleCreateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await api.createJob({
        company: jobForm.company,
        title: jobForm.title,
        location: jobForm.location || undefined,
        source: jobForm.source,
      })

      setJobForm({
        company: '',
        title: '',
        location: '',
        source: 'LINKEDIN',
      })
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

  async function handleCreateApplication(jobId: string) {
    setError('')
    setIsLoading(true)

    try {
      await api.createApplication(jobId)
      setActiveView('applications')
      await loadWorkspace()
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

  async function handleStatusChange(
    applicationId: string,
    status: ApplicationStatus,
  ) {
    setError('')
    setIsLoading(true)

    try {
      await api.updateApplicationStatus(applicationId, status)
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

  async function handleLogout() {
    await api.logout()
    setUser(null)
    setJobs([])
    setApplications([])
    setSummary(null)
    setEmail('')
    setPassword('')
    setActiveView('dashboard')
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/40 lg:grid-cols-2">
          <section className="hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="flex items-center gap-3 text-lg font-bold">
              <span className="grid size-10 place-items-center rounded-xl bg-white/15">
                <Sparkles className="size-5" />
              </span>
              Job Hunt Command Center
            </div>
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
                Organize your search
              </p>
              <h1 className="max-w-md text-4xl font-semibold leading-tight">
                Make every application more intentional.
              </h1>
              <p className="mt-5 max-w-md leading-7 text-indigo-100">
                Save opportunities, track your pipeline, and know exactly what
                deserves your attention.
              </p>
            </div>
            <p className="text-sm text-indigo-200">Your private career workspace.</p>
          </section>

          <section className="flex items-center justify-center p-7 sm:p-12">
            <div className="w-full max-w-sm">
              <div className="mb-8 lg:hidden">
                <div className="flex items-center gap-3 font-bold text-slate-900">
                  <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
                    <Sparkles className="size-5" />
                  </span>
                  Job Hunt Command Center
                </div>
              </div>

              <p className="text-sm font-medium text-indigo-600">
                {authMode === 'login' ? 'Welcome back' : 'Get started'}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {authMode === 'login' ? 'Sign in to your workspace' : 'Create your account'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {authMode === 'login'
                  ? 'Continue managing your job search with clarity.'
                  : 'Start tracking your opportunities in one focused place.'}
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleAuthSubmit}>
                <label className="block text-sm font-medium text-slate-700">
                  Email address
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Password
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    type="password"
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}
                  <ChevronRight className="size-4" />
                </button>
              </form>

              <button
                className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login')
                  setError('')
                }}
                type="button"
              >
                {authMode === 'login'
                  ? 'New here? Create an account'
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  const interviewCount =
    summary?.statusCounts.find((item) => item.status === 'INTERVIEW')?.count ?? 0
  const offerCount =
    summary?.statusCounts.find((item) => item.status === 'OFFER')?.count ?? 0

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
          <div className="flex items-center gap-3 px-2 font-bold">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
              <Sparkles className="size-5" />
            </span>
            <span className="leading-tight">Job Hunt<br />Command Center</span>
          </div>

          <nav className="mt-10 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id

              return (
                <button
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  type="button"
                >
                  <Icon className="size-5" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <button
            className="mt-10 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={handleLogout}
            type="button"
          >
            <LogOut className="size-5" />
            Sign out
          </button>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div>
              <p className="text-sm text-slate-500">Your job search workspace</p>
              <h1 className="text-lg font-bold">
                {activeView === 'dashboard'
                  ? 'Dashboard'
                  : activeView === 'jobs'
                    ? 'Saved jobs'
                    : 'Applications'}
              </h1>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
              {user.email}
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {error && (
              <p className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            {activeView === 'dashboard' && (
              <section>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">Good to see you</p>
                    <h2 className="mt-1 text-3xl font-bold tracking-tight">
                      Keep your momentum.
                    </h2>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    onClick={() => {
                      setActiveView('jobs')
                      setShowJobForm(true)
                    }}
                    type="button"
                  >
                    <Plus className="size-4" />
                    Add a job
                  </button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Saved jobs', summary?.totalJobs ?? 0, 'All opportunities'],
                    ['Applications', summary?.totalApplications ?? 0, 'Active pipeline'],
                    ['Interviews', interviewCount, 'High-priority focus'],
                    ['Offers', offerCount, 'Celebrations ahead'],
                  ].map(([label, value, description]) => (
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
                      <p className="text-sm font-medium text-slate-500">{label}</p>
                      <p className="mt-3 text-3xl font-bold">{value}</p>
                      <p className="mt-2 text-xs text-slate-400">{description}</p>
                    </article>
                  ))}
                </div>

                <article className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Application pipeline</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Your current application stages.
                      </p>
                    </div>
                    <ClipboardList className="size-5 text-slate-400" />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {(summary?.statusCounts ?? []).map((item) => (
                      <div className="rounded-xl bg-slate-50 p-4" key={item.status}>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                        <p className="mt-3 text-2xl font-bold">{item.count}</p>
                      </div>
                    ))}
                    {!summary?.statusCounts.length && (
                      <p className="col-span-full rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                        Create an application to start your pipeline.
                      </p>
                    )}
                  </div>
                </article>
              </section>
            )}

            {activeView === 'jobs' && (
              <section>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Saved jobs</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Capture opportunities before they get lost.
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    onClick={() => setShowJobForm(!showJobForm)}
                    type="button"
                  >
                    <Plus className="size-4" />
                    Add job
                  </button>
                </div>

                {showJobForm && (
                  <form className="mt-6 grid gap-4 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={handleCreateJob}>
                    <label className="text-sm font-medium text-slate-700">
                      Company
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
                        value={jobForm.company}
                        onChange={(event) => setJobForm({ ...jobForm, company: event.target.value })}
                        required
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Role
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
                        value={jobForm.title}
                        onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })}
                        required
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Location
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
                        value={jobForm.location}
                        onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Source
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500"
                        value={jobForm.source}
                        onChange={(event) => setJobForm({ ...jobForm, source: event.target.value as JobSource })}
                      >
                        {Object.entries(sourceLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <div className="md:col-span-2 flex justify-end gap-3">
                      <button className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600" onClick={() => setShowJobForm(false)} type="button">
                        Cancel
                      </button>
                      <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700" disabled={isLoading} type="submit">
                        Save job
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {jobs.map((job) => (
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={job.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-bold">{job.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{job.company}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {sourceLabels[job.source]}
                        </span>
                      </div>
                      <p className="mt-4 text-sm text-slate-500">
                        {job.location || 'Location not specified'} · Saved {formatDate(job.createdAt)}
                      </p>
                      <div className="mt-5">
                        {appliedJobIds.has(job.id) ? (
                          <span className="text-sm font-semibold text-emerald-600">Application created</span>
                        ) : (
                          <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700" onClick={() => handleCreateApplication(job.id)} type="button">
                            Create application →
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                  {!jobs.length && (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 xl:col-span-2">
                      No saved jobs yet. Add your first opportunity to get started.
                    </p>
                  )}
                </div>
              </section>
            )}

            {activeView === 'applications' && (
              <section>
                <h2 className="text-2xl font-bold">Applications</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Keep your application pipeline current.
                </p>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-4 font-semibold">Company</th>
                          <th className="px-5 py-4 font-semibold">Role</th>
                          <th className="px-5 py-4 font-semibold">Applied</th>
                          <th className="px-5 py-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {applications.map((application) => (
                          <tr key={application.id}>
                            <td className="px-5 py-4 font-semibold">{application.job.company}</td>
                            <td className="px-5 py-4 text-slate-600">{application.job.title}</td>
                            <td className="px-5 py-4 text-slate-500">{formatDate(application.appliedAt)}</td>
                            <td className="px-5 py-4">
                              <select
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset outline-none ${statusStyles[application.status]}`}
                                value={application.status}
                                onChange={(event) => handleStatusChange(application.id, event.target.value as ApplicationStatus)}
                              >
                                {(Object.keys(statusLabels) as ApplicationStatus[]).map((status) => (
                                  <option key={status} value={status}>{statusLabels[status]}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!applications.length && (
                    <p className="p-10 text-center text-sm text-slate-500">
                      Create an application from the Jobs page to begin tracking it.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default App