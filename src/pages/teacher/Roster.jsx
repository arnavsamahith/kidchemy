import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpDown,
  Copy,
  NotebookPen,
  Plus,
  Search,
  UserRoundPlus,
  X,
} from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { useStore } from '../../data/store.jsx'
import { topDimensions } from '../../data/derive.js'
import {
  daysSince,
  lastObservation,
  seriesColor,
  subjectPicture,
} from '../../data/analytics.js'
import { FREQUENCIES, PERIODS } from '../../data/taxonomy.js'

const CURRENT_TERM = PERIODS[PERIODS.length - 1]

const SORTS = [
  { id: 'name', label: 'Name' },
  { id: 'stale', label: 'Longest since logged' },
  { id: 'count', label: 'Most observations' },
]

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export default function Roster() {
  const { students, school, setFrequency, addStudent } = useStore()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('name')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = students.filter((s) => s.name.toLowerCase().includes(q))
    const withMeta = filtered.map((s) => {
      const last = lastObservation(s)
      return { ...s, last, gap: daysSince(last?.date) ?? 9999 }
    })
    if (sort === 'stale') withMeta.sort((a, b) => b.gap - a.gap)
    else if (sort === 'count')
      withMeta.sort((a, b) => b.observations.length - a.observations.length)
    else withMeta.sort((a, b) => a.name.localeCompare(b.name))
    return withMeta
  }, [students, query, sort])

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      /* clipboard blocked — the code is on screen anyway */
    }
  }

  const submitNew = async (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    try {
      await addStudent({
        id: slugify(name) || `student-${Date.now()}`,
        name,
        frequency: 'Weekly',
        accessCode: `${name.split(' ')[0].toUpperCase().slice(0, 6)}-${Math.floor(
          1000 + Math.random() * 8999
        )}`,
      })
      setNewName('')
      setAdding(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell
      title="Children"
      subtitle={`${students.length} in ${school.className}`}
      actions={
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink"
        >
          {adding ? <X size={15} /> : <UserRoundPlus size={15} />}
          {adding ? 'Cancel' : 'Add a child'}
        </button>
      }
    >
      {adding && (
        <form
          onSubmit={submitNew}
          className="kc-fade mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-5"
        >
          <label className="min-w-[220px] flex-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Full name
            </span>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Meera Krishnan"
              className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-2.5 outline-none focus:border-moss"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !newName.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moss-dark disabled:bg-ink-faint/40"
          >
            <Plus size={15} /> Add to {school.className}
          </button>
          <p className="w-full text-xs text-ink-faint">
            A parent access code is generated automatically — you'll see it in
            the table and on the sticker sheet.
          </p>
        </form>
      )}

      {/* Filters — one row, above the data */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a child…"
            className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-moss"
          />
        </label>
        <div className="flex items-center gap-2 text-sm text-ink-faint">
          <ArrowUpDown size={15} />
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              className={[
                'rounded-full px-3 py-1.5 text-sm font-medium transition',
                sort === s.id
                  ? 'bg-moss-tint text-moss-dark'
                  : 'text-ink-soft hover:bg-paper-2',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="kc-scroll overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-line text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              <th className="px-5 py-3.5">Child</th>
              <th className="px-5 py-3.5">Signature strengths</th>
              <th className="px-5 py-3.5">Subjects</th>
              <th className="px-5 py-3.5">Last logged</th>
              <th className="px-5 py-3.5">Cadence</th>
              <th className="px-5 py-3.5">Parent code</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const top = topDimensions(s.observations, 2)
              const subjects = subjectPicture(s).filter((x) => x.understanding)
              const thisTerm = s.observations.some((o) => o.period === CURRENT_TERM)
              return (
                <tr
                  key={s.id}
                  className="border-b border-line-soft last:border-0 align-top transition hover:bg-paper-2/50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: seriesColor(i) }}
                      />
                      <Link
                        to={`/teacher/student/${s.id}`}
                        className="font-display text-lg text-ink underline-offset-4 hover:underline"
                      >
                        {s.name}
                      </Link>
                    </div>
                    <p className="kc-tnum mt-1 pl-5 text-xs text-ink-faint">
                      {s.observations.length} obs ·{' '}
                      <span className={thisTerm ? 'text-moss-dark' : 'text-clay-dark'}>
                        {thisTerm ? `${CURRENT_TERM} done` : 'term pending'}
                      </span>
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    {top.length ? (
                      <ul className="flex flex-wrap gap-1.5">
                        {top.map((d) => (
                          <li
                            key={d.id}
                            className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft"
                          >
                            {d.label} <span className="kc-tnum">{d.score}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-ink-faint">No evidence yet</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {subjects.length ? (
                      <ul className="grid gap-1 text-xs text-ink-soft">
                        {subjects.slice(0, 3).map((x) => (
                          <li key={x.subject}>
                            <span className="text-ink">{x.subject}</span> ·{' '}
                            {x.understanding}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="kc-tnum px-5 py-4 text-sm text-ink-soft">
                    {s.last ? (
                      <>
                        {s.last.date}
                        <span className="block text-xs text-ink-faint">
                          {s.gap === 0 ? 'today' : `${s.gap} days ago`}
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={s.frequency || 'Weekly'}
                      onChange={(e) => setFrequency(s.id, e.target.value)}
                      className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm text-ink-soft outline-none focus:border-moss"
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    {s.accessCode ? (
                      <button
                        type="button"
                        onClick={() => copy(s.accessCode, s.id)}
                        className="kc-tnum inline-flex items-center gap-1.5 rounded-lg bg-paper-2 px-2.5 py-1.5 text-xs font-semibold tracking-wider text-ink-soft transition hover:bg-paper-3"
                        title="Copy for the parent"
                      >
                        {s.accessCode}
                        <Copy size={12} />
                      </button>
                    ) : (
                      <span className="text-sm text-ink-faint">—</span>
                    )}
                    {copied === s.id && (
                      <span className="ml-2 text-xs text-moss-dark">Copied</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/teacher/student/${s.id}/observe`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-moss px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-moss-dark"
                    >
                      <NotebookPen size={14} /> Observe
                    </Link>
                  </td>
                </tr>
              )
            })}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-ink-faint">
                  No child matches “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
