import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Filter,
  NotebookPen,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { ChartFrame, StatTile } from '../../components/charts.jsx'
import StrengthMap from '../../components/StrengthMap.jsx'
import { useStore } from '../../data/store.jsx'
import {
  dimensionScores,
  evidenceSummary,
  growthHighlights,
  learningStyle,
} from '../../data/derive.js'
import {
  daysSince,
  filterObservations,
  lastObservation,
  subjectPicture,
  tagRemarks,
} from '../../data/analytics.js'
import {
  MILESTONES,
  MILESTONE_MAP,
  PERIODS,
  TAG_MAP,
} from '../../data/taxonomy.js'

export default function StudentDetail() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { getStudent, deleteObservation, students, loading } = useStore()
  const student = getStudent(studentId)

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('')
  const [tag, setTag] = useState('')
  const [milestone, setMilestone] = useState('')
  const [visibility, setVisibility] = useState('')
  const [confirming, setConfirming] = useState(null)

  const observations = useMemo(
    () =>
      [...(student?.observations || [])].sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      ),
    [student]
  )

  const shown = useMemo(
    () => filterObservations(observations, { query, period, tag, milestone, visibility }),
    [observations, query, period, tag, milestone, visibility]
  )

  const usedTags = useMemo(() => {
    const set = new Set(observations.flatMap((o) => o.tags || []))
    return [...set].map((id) => ({ id, label: TAG_MAP[id]?.label || id }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [observations])

  if (!student) {
    if (loading) return <AppShell title="Loading…"><p className="text-ink-faint">One moment.</p></AppShell>
    if (!students.length) return <Navigate to="/teacher" replace />
    return (
      <AppShell title="Not found">
        <p className="text-ink-soft">
          No child with that id.{' '}
          <Link to="/teacher/roster" className="text-moss underline underline-offset-4">
            Back to the roster
          </Link>
        </p>
      </AppShell>
    )
  }

  const dims = dimensionScores(student.observations)
  const highlights = growthHighlights(student.observations)
  const style = learningStyle(student, student.observations)
  const subjects = subjectPicture(student).filter((s) => s.understanding || s.engagement)
  const remarks = tagRemarks(student.observations)
  const last = lastObservation(student)
  const gap = daysSince(last?.date)
  const sharedCount = student.observations.filter(
    (o) => (o.visibility || 'shared') === 'shared'
  ).length
  const anyFilter = query || period || tag || milestone || visibility

  const remove = async (obsId) => {
    await deleteObservation(student.id, obsId)
    setConfirming(null)
  }

  return (
    <AppShell
      title={student.name}
      subtitle={`${student.className || ''} · ${evidenceSummary(student.observations)}`}
      actions={
        <>
          <Link
            to={`/profile/${student.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink"
          >
            Parent view <ArrowUpRight size={14} />
          </Link>
          <Link
            to={`/teacher/student/${student.id}/observe`}
            className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss-dark"
          >
            <NotebookPen size={15} /> New observation
          </Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Observations"
          value={student.observations.length}
          hint={`${sharedCount} shared with the parent`}
        />
        <StatTile
          label="Last logged"
          value={gap === null ? '—' : gap === 0 ? 'Today' : `${gap}d`}
          hint={last?.date ? `${last.period} · ${last.teacher}` : 'Nothing yet'}
          tone={gap !== null && gap > 45 ? 'warn' : 'ink'}
        />
        <StatTile
          label="Custom remarks"
          value={remarks.length}
          hint="Tag-level notes in your words"
        />
        <StatTile
          label="Cadence"
          value={student.frequency || 'Weekly'}
          hint="How often you plan to update"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ChartFrame
          title="Observed strengths"
          subtitle="Seven dimensions, each built only from the tags behind it."
        >
          <StrengthMap dims={dims} />
        </ChartFrame>

        <div className="grid gap-5">
          <ChartFrame title="How they learn best">
            <p className="text-[15px] leading-relaxed text-ink-soft">{style}</p>
            {highlights.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {highlights.map((h) => (
                  <li key={h.id} className="flex items-baseline gap-2 text-sm">
                    <span className="kc-tnum font-semibold text-good">
                      +{h.delta}
                    </span>
                    <span className="text-ink-soft">{h.label} since Term 1</span>
                  </li>
                ))}
              </ul>
            )}
          </ChartFrame>

          <ChartFrame title="Subjects" subtitle="Latest recorded picture per subject.">
            {subjects.length ? (
              <ul className="grid gap-2.5">
                {subjects.map((s) => (
                  <li
                    key={s.subject}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-paper-2 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-ink">{s.subject}</span>
                    <span className="text-xs text-ink-soft">
                      {s.understanding || '—'}
                      {s.engagement ? ` · ${s.engagement} engagement` : ''}
                    </span>
                    {s.note && (
                      <p className="w-full text-xs leading-relaxed text-ink-faint">
                        {s.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-faint">
                No subject detail recorded yet. Add it once a term from the
                observation form.
              </p>
            )}
          </ChartFrame>
        </div>
      </div>

      {/* ── Timeline ───────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl text-ink">Observation history</h2>

        <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-card px-4 py-3">
          <label className="relative min-w-[200px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, remarks, tags…"
              className="w-full rounded-full border border-line bg-paper py-2.5 pl-10 pr-4 text-sm outline-none focus:border-moss"
            />
          </label>

          <Filter size={15} className="text-ink-faint" />
          <Select value={period} onChange={setPeriod} label="All terms" options={PERIODS.map((p) => ({ value: p, label: p }))} />
          <Select
            value={tag}
            onChange={setTag}
            label="Any tag"
            options={usedTags.map((t) => ({ value: t.id, label: t.label }))}
          />
          <Select
            value={milestone}
            onChange={setMilestone}
            label="Any milestone"
            options={MILESTONES.map((m) => ({ value: m.id, label: m.label }))}
          />
          <Select
            value={visibility}
            onChange={setVisibility}
            label="Any visibility"
            options={[
              { value: 'shared', label: 'Shared' },
              { value: 'school', label: 'School only' },
            ]}
          />

          {anyFilter && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setPeriod('')
                setTag('')
                setMilestone('')
                setVisibility('')
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-2"
            >
              <X size={14} /> Clear
            </button>
          )}
          <span className="kc-tnum ml-auto text-sm text-ink-faint">
            {shown.length} of {observations.length}
          </span>
        </div>

        {shown.length ? (
          <ol className="relative grid gap-4 border-l border-line pl-6">
            {shown.map((o) => (
              <li key={o.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[29px] top-5 h-2.5 w-2.5 rounded-full border-2 border-paper"
                  style={{
                    background:
                      (o.visibility || 'shared') === 'shared'
                        ? 'var(--color-series-1)'
                        : 'var(--color-series-3)',
                  }}
                />
                <article className="rounded-2xl border border-line bg-card p-5">
                  <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="kc-tnum text-sm font-semibold text-ink">
                      {o.date}
                    </span>
                    <span className="rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                      {o.period}
                    </span>
                    {o.teacher && (
                      <span className="text-xs text-ink-faint">{o.teacher}</span>
                    )}
                    {o.milestone && (
                      <span className="rounded-full bg-clay-tint px-2.5 py-0.5 text-xs font-semibold text-clay-dark">
                        {MILESTONE_MAP[o.milestone]?.label || o.milestone}
                      </span>
                    )}
                    <span
                      className={[
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        (o.visibility || 'shared') === 'shared'
                          ? 'bg-moss-tint text-moss-dark'
                          : 'bg-paper-3 text-ink-soft',
                      ].join(' ')}
                    >
                      {(o.visibility || 'shared') === 'shared' ? (
                        <>
                          <Eye size={12} /> Shared
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} /> School only
                        </>
                      )}
                    </span>

                    <span className="ml-auto flex items-center gap-1">
                      <Link
                        to={`/teacher/student/${student.id}/observe/${o.id}`}
                        className="rounded-lg p-2 text-ink-faint transition hover:bg-paper-2 hover:text-ink"
                        aria-label="Edit this observation"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirming(o.id)}
                        className="rounded-lg p-2 text-ink-faint transition hover:bg-paper-2 hover:text-alert"
                        aria-label="Delete this observation"
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </header>

                  {o.note && (
                    <p className="mt-3 border-l-2 border-moss/30 pl-3 text-[15px] italic leading-relaxed text-ink-soft">
                      “{o.note}”
                    </p>
                  )}

                  {(o.tags || []).length > 0 && (
                    <ul className="mt-3 grid gap-2">
                      {(o.tags || []).map((t) => {
                        const remark = (o.tagNotes || {})[t]
                        return (
                          <li key={t} className="flex flex-wrap items-baseline gap-2">
                            <span className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft">
                              {TAG_MAP[t]?.label || t}
                            </span>
                            {remark && (
                              <span className="min-w-0 flex-1 text-sm leading-relaxed text-ink-soft">
                                — {remark}
                              </span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {(o.subjects || []).length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
                      {o.subjects.map((s, i) => (
                        <li key={`${s.subject}-${i}`}>
                          <span className="text-ink-soft">{s.subject}</span>
                          {s.understanding ? ` · ${s.understanding}` : ''}
                          {s.engagement ? ` · ${s.engagement}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}

                  {confirming === o.id && (
                    <div className="kc-fade mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-alert/30 bg-alert/10 px-4 py-3">
                      <p className="text-sm text-alert">
                        Delete this observation? The profile will be rebuilt
                        without it.
                      </p>
                      <button
                        type="button"
                        onClick={() => remove(o.id)}
                        className="rounded-full bg-alert px-4 py-1.5 text-sm font-semibold text-white"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink-soft"
                      >
                        Keep it
                      </button>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl border border-dashed border-line px-5 py-12 text-center text-sm text-ink-faint">
            {observations.length
              ? 'Nothing matches those filters.'
              : `No observations yet for ${student.name.split(' ')[0]}.`}
          </p>
        )}
      </section>
    </AppShell>
  )
}

function Select({ value, onChange, label, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-line bg-paper px-3 py-2 text-sm text-ink-soft outline-none focus:border-moss"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
