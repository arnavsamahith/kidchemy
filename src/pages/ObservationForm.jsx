import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useStore } from '../data/store.jsx'
import {
  TAG_GROUPS,
  MILESTONES,
  SUBJECTS,
  UNDERSTANDING,
  ENGAGEMENT,
  FREQUENCIES,
  PERIODS,
} from '../data/taxonomy.js'
import Chip from '../components/Chip.jsx'

const MAX_NOTE = 200
const MAX_SUBJECT_NOTE = 100

export default function ObservationForm() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { getStudent, addObservation, setFrequency, school } = useStore()
  const student = getStudent(studentId)

  const [tags, setTags] = useState([])
  const [note, setNote] = useState('')
  const [milestone, setMilestone] = useState(null)
  const [period, setPeriod] = useState(PERIODS[PERIODS.length - 1])
  const [detailed, setDetailed] = useState(false)
  const [subjects, setSubjects] = useState(() =>
    SUBJECTS.map((subject) => ({
      subject,
      understanding: '',
      engagement: '',
      note: '',
    }))
  )
  // visibility: 'shared' shows in parent view; 'school' is teacher/admin only.
  // Concerns (milestone === 'attention') default to school-only.
  const [visibility, setVisibility] = useState('shared')
  const [saved, setSaved] = useState(false)

  // Auto-suggest school-only when teacher marks "needs attention"
  const handleMilestone = (id) => {
    const next = milestone === id ? null : id
    setMilestone(next)
    if (next === 'attention' && visibility === 'shared') setVisibility('school')
    if (next !== 'attention' && visibility === 'school') setVisibility('shared')
  }

  const started = tags.length > 0 || note.trim() || milestone

  const estimate = useMemo(() => {
    const base = 40 + tags.length * 4 + (note ? 25 : 0)
    const extra = detailed ? 60 : 0
    return Math.round((base + extra) / 15) * 15
  }, [tags.length, note, detailed])

  if (!student) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-ink-soft">No such student.</p>
        <Link to="/teacher" className="mt-4 inline-block text-moss underline">
          Back to class
        </Link>
      </div>
    )
  }

  const toggleTag = (id) =>
    setTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )

  const setSubjectField = (subject, field, value) =>
    setSubjects((prev) =>
      prev.map((s) => (s.subject === subject ? { ...s, [field]: value } : s))
    )

  const submit = (e) => {
    e.preventDefault()
    addObservation(student.id, {
      period,
      date: new Date().toISOString().slice(0, 10),
      teacher: school.teacher,
      tags,
      note: note.trim(),
      milestone,
      visibility,
      subjects: detailed
        ? subjects.filter((s) => s.understanding || s.engagement || s.note)
        : [],
    })
    setSaved(true)
    setTimeout(() => navigate('/teacher'), 1400)
  }

  if (saved) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-tint text-moss-dark">
          <Check size={30} />
        </div>
        <h2 className="mt-6 font-display text-2xl text-ink">
          Saved for {student.name.split(' ')[0]}
        </h2>
        <p className="mt-2 text-ink-soft">
          {visibility === 'shared'
            ? "Their parent profile has been updated."
            : "Saved for school records — parents won't see this one."}
        </p>
        <Link
          to={`/profile/${student.id}`}
          className="mt-6 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-ink-faint hover:text-ink"
        >
          See what changed
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl px-5 pb-40 pt-6 sm:px-8">
      <Link
        to="/teacher"
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink"
      >
        <ArrowLeft size={15} /> {school.className}
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{student.name}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
          <Clock size={14} /> About {estimate} seconds at this length
        </p>
      </header>

      {/* Period */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Term
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Chip key={p} selected={period === p} onClick={() => setPeriod(p)}>
              {p}
            </Chip>
          ))}
        </div>
      </section>

      {/* Tags */}
      {TAG_GROUPS.map((group) => (
        <section key={group.id} className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
            {group.label}
          </h2>
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
        </section>
      ))}

      {/* Note */}
      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          One specific thing
        </h2>
        <p className="mt-1 text-sm text-ink-faint">
          Optional — but this is the line parents remember.
        </p>
        <textarea
          value={note}
          maxLength={MAX_NOTE}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Something specific you noticed today…"
          className="mt-3 w-full resize-none rounded-2xl border border-line bg-white p-4 text-ink outline-none transition placeholder:text-ink-faint focus:border-moss"
        />
        <p className="mt-1 text-right text-xs text-ink-faint">
          {note.length}/{MAX_NOTE}
        </p>
      </section>

      {/* Milestone */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Was today unusual?
        </h2>
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
      </section>

      {/* Visibility toggle — the key schema decision */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Who can see this observation?
        </h2>
        <p className="mt-1 text-sm text-ink-faint">
          School-only stays in your records. Shared shows on the parent profile.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setVisibility('shared')}
            className={[
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
              visibility === 'shared'
                ? 'border-moss bg-moss-tint text-moss-dark'
                : 'border-line text-ink-soft hover:border-ink-faint hover:text-ink',
            ].join(' ')}
          >
            <Eye size={15} /> Shared with parents
          </button>
          <button
            type="button"
            onClick={() => setVisibility('school')}
            className={[
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
              visibility === 'school'
                ? 'border-clay bg-clay-tint text-clay'
                : 'border-line text-ink-soft hover:border-ink-faint hover:text-ink',
            ].join(' ')}
          >
            <EyeOff size={15} /> School only
          </button>
        </div>
        {milestone === 'attention' && visibility === 'school' && (
          <p className="mt-2 text-xs text-clay">
            Auto-set to school-only because you flagged "Needs attention". Change it above if you want parents to see this.
          </p>
        )}
      </section>

      {/* Subjects — collapsed by default so the daily log stays fast */}
      <section className="mt-10 rounded-2xl border border-line bg-white/60 p-5">
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
                  className="mt-3 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:border-moss"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Frequency */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          How often will you update {student.name.split(' ')[0]}?
        </h2>
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
      </section>

      {/* Sticky submit */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <p className="text-sm text-ink-faint">
            {tags.length} tag{tags.length === 1 ? '' : 's'}
            {milestone ? ' · milestone' : ''}
            {note ? ' · note' : ''}
            {' · '}
            <span className={visibility === 'school' ? 'text-clay' : 'text-moss-dark'}>
              {visibility === 'school' ? 'school only' : 'shared'}
            </span>
          </p>
          <button
            type="submit"
            disabled={!started}
            className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-ink-faint/40 hover:bg-moss-dark"
          >
            <Sparkles size={16} /> Save observation
          </button>
        </div>
      </div>
    </form>
  )
}
