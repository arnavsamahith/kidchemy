import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  MessageSquarePlus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { useStore } from '../data/store.jsx'
import {
  TAG_GROUPS,
  TAG_MAP,
  MILESTONES,
  SUBJECTS,
  UNDERSTANDING,
  ENGAGEMENT,
  FREQUENCIES,
  PERIODS,
} from '../data/taxonomy.js'
import Chip from '../components/Chip.jsx'

const MAX_NOTE = 240
const MAX_TAG_NOTE = 160
const MAX_SUBJECT_NOTE = 120

const emptySubjects = () =>
  SUBJECTS.map((subject) => ({ subject, understanding: '', engagement: '', note: '' }))

export default function ObservationForm() {
  const { studentId, observationId } = useParams()
  const navigate = useNavigate()
  const {
    getStudent,
    addObservation,
    updateObservation,
    setFrequency,
    school,
    students,
    loading,
  } = useStore()

  const student = getStudent(studentId)
  const editing = observationId
    ? student?.observations.find((o) => o.id === observationId)
    : null

  const [tags, setTags] = useState([])
  const [tagNotes, setTagNotes] = useState({})
  const [openRemark, setOpenRemark] = useState(null)
  const [note, setNote] = useState('')
  const [milestone, setMilestone] = useState(null)
  const [period, setPeriod] = useState(PERIODS[PERIODS.length - 1])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [detailed, setDetailed] = useState(false)
  const [subjects, setSubjects] = useState(emptySubjects)
  const [visibility, setVisibility] = useState('shared')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // Load an existing observation into the form when editing.
  useEffect(() => {
    if (!editing) return
    setTags(editing.tags || [])
    setTagNotes(editing.tagNotes || {})
    setNote(editing.note || '')
    setMilestone(editing.milestone || null)
    setPeriod(editing.period || PERIODS[PERIODS.length - 1])
    setDate(editing.date || new Date().toISOString().slice(0, 10))
    setVisibility(editing.visibility || 'shared')
    if (editing.subjects?.length) {
      setDetailed(true)
      setSubjects(
        emptySubjects().map(
          (s) => editing.subjects.find((x) => x.subject === s.subject) || s
        )
      )
    }
  }, [editing?.id])

  const started = tags.length > 0 || note.trim() || milestone
  const remarkCount = Object.entries(tagNotes).filter(
    ([id, t]) => tags.includes(id) && t?.trim()
  ).length

  const estimate = useMemo(() => {
    const base = 40 + tags.length * 4 + (note ? 25 : 0) + remarkCount * 20
    return Math.round((base + (detailed ? 60 : 0)) / 15) * 15
  }, [tags.length, note, detailed, remarkCount])

  if (!student) {
    if (loading) {
      return (
        <AppShell title="Loading…">
          <p className="text-ink-faint">One moment.</p>
        </AppShell>
      )
    }
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

  const first = student.name.split(' ')[0]

  const toggleTag = (id) => {
    setTags((prev) => {
      const on = prev.includes(id)
      if (on) {
        setOpenRemark((r) => (r === id ? null : r))
        return prev.filter((t) => t !== id)
      }
      // Opening the remark box straight away is the whole point — the remark
      // is worth more than the tag, and it is only ever written in the moment.
      setOpenRemark(id)
      return [...prev, id]
    })
  }

  const setRemark = (id, text) =>
    setTagNotes((prev) => ({ ...prev, [id]: text.slice(0, MAX_TAG_NOTE) }))

  const clearRemark = (id) =>
    setTagNotes((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

  const handleMilestone = (id) => {
    const next = milestone === id ? null : id
    setMilestone(next)
    if (next === 'attention' && visibility === 'shared') setVisibility('school')
    if (next !== 'attention' && visibility === 'school' && !editing)
      setVisibility('shared')
  }

  const setSubjectField = (subject, field, value) =>
    setSubjects((prev) =>
      prev.map((s) => (s.subject === subject ? { ...s, [field]: value } : s))
    )

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      id: editing?.id,
      period,
      date,
      teacher: school.teacher,
      tags,
      note: note.trim(),
      milestone,
      visibility,
      tagNotes,
      subjects: detailed
        ? subjects.filter((s) => s.understanding || s.engagement || s.note)
        : editing?.subjects || [],
    }
    try {
      if (editing) await updateObservation(student.id, payload)
      else await addObservation(student.id, payload)
      setSaved(true)
      setTimeout(() => navigate(`/teacher/student/${student.id}`), 1200)
    } catch (err) {
      setError(
        'That did not save. Check your connection and try again — nothing has been lost from this form.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <AppShell title="Saved">
        <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-tint text-moss-dark">
            <Check size={30} />
          </div>
          <h2 className="mt-6 font-display text-2xl text-ink">
            {editing ? 'Updated' : 'Saved'} for {first}
          </h2>
          <p className="mt-2 text-ink-soft">
            {visibility === 'shared'
              ? 'Their parent profile has been rebuilt with this.'
              : "Kept in school records — parents won't see this one."}
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title={editing ? `Edit an observation` : `Observe ${first}`}
      subtitle={
        editing
          ? `${student.name} · originally logged ${editing.date}`
          : `${student.name} · ${student.className || school.className}`
      }
    >
      <Link
        to={`/teacher/student/${student.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to {first}'s file
      </Link>

      <form onSubmit={submit} className="mt-6 grid gap-5 pb-32 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* ── Left column: the taps ─────────────────────────── */}
        <div className="grid gap-5">
          <Card>
            <p className="flex items-center gap-2 text-sm text-ink-faint">
              <Clock size={14} /> About {estimate} seconds at this length
            </p>

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <Label>Term</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PERIODS.map((p) => (
                    <Chip key={p} selected={period === p} onClick={() => setPeriod(p)}>
                      {p}
                    </Chip>
                  ))}
                </div>
              </div>
              <label className="block">
                <Label>Date</Label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="kc-tnum mt-2 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-moss"
                />
              </label>
            </div>
          </Card>

          {/* Tags with per-tag remarks */}
          {TAG_GROUPS.map((group) => (
            <Card key={group.id}>
              <div className="flex items-baseline justify-between gap-3">
                <Label>{group.label}</Label>
                <span className="text-xs text-ink-faint">{group.hint}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    tone={group.accent}
                    selected={tags.includes(tag.id)}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.label}
                  </Chip>
                ))}
              </div>

              {/* One remark box per selected tag in this group. */}
              {group.tags.some((t) => tags.includes(t.id)) && (
                <ul className="mt-4 grid gap-2.5 border-t border-line-soft pt-4">
                  {group.tags
                    .filter((t) => tags.includes(t.id))
                    .map((t) => {
                      const value = tagNotes[t.id] || ''
                      const open = openRemark === t.id || value.length > 0
                      return (
                        <li key={t.id} className="rounded-xl bg-paper-2/70 px-3.5 py-3">
                          <button
                            type="button"
                            onClick={() => setOpenRemark(open && !value ? null : t.id)}
                            className="flex w-full items-center gap-2 text-left"
                          >
                            <MessageSquarePlus
                              size={15}
                              className={value ? 'text-moss' : 'text-ink-faint'}
                            />
                            <span className="flex-1 text-sm font-medium text-ink">
                              {t.label}
                            </span>
                            <span className="text-xs text-ink-faint">
                              {value ? 'remark added' : 'add a remark'}
                            </span>
                            <ChevronDown
                              size={15}
                              className={`text-ink-faint transition ${open ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {open && (
                            <div className="kc-fade mt-2.5">
                              <textarea
                                value={value}
                                onChange={(e) => setRemark(t.id, e.target.value)}
                                rows={2}
                                maxLength={MAX_TAG_NOTE}
                                placeholder={`What did "${t.label.toLowerCase()}" look like today, specifically?`}
                                className="w-full resize-none rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm leading-relaxed outline-none placeholder:text-ink-faint focus:border-moss"
                              />
                              <div className="mt-1 flex items-center justify-between">
                                {value ? (
                                  <button
                                    type="button"
                                    onClick={() => clearRemark(t.id)}
                                    className="inline-flex items-center gap-1 text-xs text-ink-faint hover:text-alert"
                                  >
                                    <Trash2 size={12} /> Clear
                                  </button>
                                ) : (
                                  <span />
                                )}
                                <span className="kc-tnum text-xs text-ink-faint">
                                  {value.length}/{MAX_TAG_NOTE}
                                </span>
                              </div>
                            </div>
                          )}
                        </li>
                      )
                    })}
                </ul>
              )}
            </Card>
          ))}

          {/* Subject detail */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-ink">Subject detail</h2>
                <p className="text-sm text-ink-faint">
                  Skip this on a daily log. Fill it once a term.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailed((v) => !v)}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink-faint hover:text-ink"
              >
                {detailed ? 'Hide' : 'Add subject detail'}
              </button>
            </div>

            {detailed && (
              <div className="mt-5 grid gap-4">
                {subjects.map((s) => (
                  <div key={s.subject} className="rounded-xl border border-line p-4">
                    <h3 className="font-semibold text-ink">{s.subject}</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <fieldset>
                        <legend className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                          Concept understanding
                        </legend>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {UNDERSTANDING.map((u) => (
                            <Chip
                              key={u}
                              selected={s.understanding === u}
                              onClick={() =>
                                setSubjectField(
                                  s.subject,
                                  'understanding',
                                  s.understanding === u ? '' : u
                                )
                              }
                            >
                              {u}
                            </Chip>
                          ))}
                        </div>
                      </fieldset>
                      <fieldset>
                        <legend className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                          Engagement
                        </legend>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ENGAGEMENT.map((u) => (
                            <Chip
                              key={u}
                              tone="clay"
                              selected={s.engagement === u}
                              onClick={() =>
                                setSubjectField(
                                  s.subject,
                                  'engagement',
                                  s.engagement === u ? '' : u
                                )
                              }
                            >
                              {u}
                            </Chip>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                    <input
                      value={s.note}
                      maxLength={MAX_SUBJECT_NOTE}
                      onChange={(e) => setSubjectField(s.subject, 'note', e.target.value)}
                      placeholder="What to focus on next…"
                      className="mt-3 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:border-moss"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column: the writing ─────────────────────── */}
        <div className="grid content-start gap-5 xl:sticky xl:top-[104px]">
          <Card>
            <Label>One specific thing</Label>
            <p className="mt-1 text-sm text-ink-faint">
              Optional — but this is the line parents remember.
            </p>
            <textarea
              value={note}
              maxLength={MAX_NOTE}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Something specific you noticed today…"
              className="mt-3 w-full resize-none rounded-xl border border-line bg-paper p-4 leading-relaxed outline-none placeholder:text-ink-faint focus:border-moss"
            />
            <p className="kc-tnum mt-1 text-right text-xs text-ink-faint">
              {note.length}/{MAX_NOTE}
            </p>
          </Card>

          <Card>
            <Label>Was today unusual?</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {MILESTONES.map((m) => (
                <Chip
                  key={m.id}
                  tone="clay"
                  selected={milestone === m.id}
                  onClick={() => handleMilestone(m.id)}
                >
                  {m.label}
                </Chip>
              ))}
            </div>
          </Card>

          <Card>
            <Label>Who can see this?</Label>
            <p className="mt-1 text-sm text-ink-faint">
              School-only stays in your records. Shared shows on the parent
              profile — including the remarks above.
            </p>
            <div className="mt-3 grid gap-2">
              <VisButton
                on={visibility === 'shared'}
                onClick={() => setVisibility('shared')}
                icon={Eye}
                tone="moss"
              >
                Shared with parents
              </VisButton>
              <VisButton
                on={visibility === 'school'}
                onClick={() => setVisibility('school')}
                icon={EyeOff}
                tone="clay"
              >
                School only
              </VisButton>
            </div>
            {milestone === 'attention' && visibility === 'school' && (
              <p className="mt-2 text-xs leading-relaxed text-clay-dark">
                Auto-set to school-only because you flagged “Needs attention”.
                Change it above if you want parents to see this.
              </p>
            )}
          </Card>

          <Card>
            <Label>How often will you update {first}?</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {FREQUENCIES.map((f) => (
                <Chip
                  key={f}
                  selected={student.frequency === f}
                  onClick={() => setFrequency(student.id, f)}
                >
                  {f}
                </Chip>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Sticky submit ─────────────────────────────────── */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="kc-tnum text-sm text-ink-faint">
              {tags.length} tag{tags.length === 1 ? '' : 's'}
              {remarkCount ? ` · ${remarkCount} remark${remarkCount === 1 ? '' : 's'}` : ''}
              {milestone ? ' · milestone' : ''}
              {note ? ' · note' : ''}
              {' · '}
              <span className={visibility === 'school' ? 'text-clay-dark' : 'text-moss-dark'}>
                {visibility === 'school' ? 'school only' : 'shared'}
              </span>
            </p>
            {error && (
              <p className="w-full text-sm text-alert sm:w-auto">{error}</p>
            )}
            <button
              type="submit"
              disabled={!started || saving}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 font-semibold text-white transition hover:bg-moss-dark disabled:cursor-not-allowed disabled:bg-ink-faint/40"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {editing ? 'Save changes' : 'Save observation'}
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  )
}

function Card({ children }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
      {children}
    </section>
  )
}

function Label({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
      {children}
    </h2>
  )
}

function VisButton({ on, onClick, icon: Icon, tone, children }) {
  const active =
    tone === 'clay'
      ? 'border-clay bg-clay-tint text-clay-dark'
      : 'border-moss bg-moss-tint text-moss-dark'
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
        on ? active : 'border-line text-ink-soft hover:border-ink-faint hover:text-ink',
      ].join(' ')}
    >
      <Icon size={15} /> {children}
    </button>
  )
}
