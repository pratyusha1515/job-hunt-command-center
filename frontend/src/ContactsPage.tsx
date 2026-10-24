
import { useMemo, useState, type FormEvent } from 'react'
import {
  ContactRound,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import type { Contact, ContactInput } from './lib/api'

type Props = {
  contacts: Contact[]
  isLoading: boolean
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
  onAdd: () => void
  showForm: boolean
  editingContact: Contact | null
  form: ContactInput
  setForm: (form: ContactInput) => void
  onCancel: () => void
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500'

export default function ContactsPage({
  contacts,
  isLoading,
  onSave,
  onEdit,
  onDelete,
  onAdd,
  showForm,
  editingContact,
  form,
  setForm,
  onCancel,
}: Props) {
  const [query, setQuery] = useState('')

  const filteredContacts = useMemo(() => {
    const value = query.trim().toLowerCase()

    if (!value) return contacts

    return contacts.filter((contact) =>
      [
        contact.name,
        contact.company ?? '',
        contact.jobTitle ?? '',
        contact.email ?? '',
      ].some((field) => field.toLowerCase().includes(value)),
    )
  }, [contacts, query])

  return (
    <section className="animate-rise-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold tracking-[0.16em] text-indigo-600">
            NETWORK & REFERRALS
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Build your network.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Keep useful connections and follow-up details in one place.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          onClick={onAdd}
          type="button"
        >
          <Plus className="size-4" /> Add contact
        </button>
      </div>

      {showForm && (
        <form
          className="mt-6 grid gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 sm:grid-cols-2"
          onSubmit={onSave}
        >
          <label className="text-sm font-bold text-slate-700">
            Name *
            <input
              className={inputClass}
              required
              maxLength={120}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>

          <label className="text-sm font-bold text-slate-700">
            Company
            <input
              className={inputClass}
              value={form.company ?? ''}
              onChange={(event) =>
                setForm({ ...form, company: event.target.value })
              }
            />
          </label>

          <label className="text-sm font-bold text-slate-700">
            Job title
            <input
              className={inputClass}
              value={form.jobTitle ?? ''}
              onChange={(event) =>
                setForm({ ...form, jobTitle: event.target.value })
              }
            />
          </label>

          <label className="text-sm font-bold text-slate-700">
            Email
            <input
              className={inputClass}
              type="email"
              value={form.email ?? ''}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </label>

          <label className="text-sm font-bold text-slate-700 sm:col-span-2">
            LinkedIn profile URL
            <input
              className={inputClass}
              type="url"
              value={form.linkedinUrl ?? ''}
              onChange={(event) =>
                setForm({ ...form, linkedinUrl: event.target.value })
              }
              placeholder="https://www.linkedin.com/in/..."
            />
          </label>

          <label className="text-sm font-bold text-slate-700 sm:col-span-2">
            Notes
            <textarea
              className={`${inputClass} min-h-24`}
              value={form.notes ?? ''}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              placeholder="Referral details, follow-up ideas..."
            />
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              {isLoading
                ? 'Saving…'
                : editingContact
                  ? 'Save changes'
                  : 'Save contact'}
            </button>

            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600"
              disabled={isLoading}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
        <Search className="size-4 text-slate-400" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Search by name, company, role, or email..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="whitespace-nowrap text-xs text-slate-400">
          {filteredContacts.length} contacts
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredContacts.map((contact) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            key={contact.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ContactRound className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-extrabold">{contact.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {[contact.jobTitle, contact.company]
                      .filter(Boolean)
                      .join(' · ') || 'No role or company added'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  aria-label={`Edit ${contact.name}`}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  onClick={() => onEdit(contact)}
                  type="button"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  aria-label={`Delete ${contact.name}`}
                  className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  disabled={isLoading}
                  onClick={() => onDelete(contact)}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {contact.email && (
              <a
                className="mt-4 flex items-center gap-2 break-all text-sm text-indigo-600 hover:underline"
                href={`mailto:${contact.email}`}
              >
                <Mail className="size-4 shrink-0" />
                {contact.email}
              </a>
            )}

            {contact.linkedinUrl && (
              <a
                className="mt-2 inline-block text-sm font-bold text-indigo-600 hover:underline"
                href={contact.linkedinUrl}
                rel="noreferrer"
                target="_blank"
              >
                View LinkedIn profile ↗
              </a>
            )}

            {contact.notes && (
              <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">
                {contact.notes}
              </p>
            )}
          </article>
        ))}
      </div>

      {!filteredContacts.length && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <ContactRound className="mx-auto size-8 text-indigo-500" />
          <h2 className="mt-3 font-extrabold">
            {query ? 'No matching contacts' : 'Your network starts here'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {query
              ? 'Try another search term.'
              : 'Save recruiters, alumni, mentors, and people who may help with referrals.'}
          </p>
        </div>
      )}
    </section>
  )
}
