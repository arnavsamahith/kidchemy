import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  Save,
  Timer,
  Trash2,
} from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHead,
  Chip,
  Field,
  Input,
  Segmented,
  Select,
  Textarea,
  Toast,
  cx,
  useToast,
} from '../components/ui.jsx'
import { useStore } from '../data/store.jsx'
import { useAuth } from '../data/auth.jsx'
import {
  ENGAGEMENT,
  MILESTONES,
  PERIODS,
  SUBJECTS,
  TAG_GROUPS,
  TAG_MAP,
  UNDERSTANDING,
} from '../data/taxonomy.js'
import {
  DISPOSITIONS,
  STORY_PARTS,
  checkLanguage,
  FRAMEWORKS,
} from '../data/pedagogy.js'
import { classLabel } from '../data/roster.js'

const todayISO = () => new Date().toISOString().slice(0, 10)

/* ─── The Learning Story block ───────────────────────────────── */

function StoryField({ part, value, onChange }) {
  const findings = useMemo(() => checkLanguage(value), [value])
  const framework = part.framework ? FRAMEWORKS[part.framework] : null

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
        <span className="text-xs font-bold text-ink">{part.label}</span>
        {part.required && (
          <span className="text-2xs font-semibold text-accent">required</span>
        )}
        {framework && (
          <Badge tone="outline" className="ml-auto">
            {framework.label}
          </Badge>
        )}
      </div>
      <p className="mb-1.5 text-xs text-ink-faint">{part.hint}</p>
      <Textarea
        value={value}
        maxLength={part.max}
        rows={part.id === 'saw' ? 4 : 2}
        placeholder={part.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {findings.map((f, i) => (
            <p key={i} className="flex items-start gap-1.5 text-xs text-warn">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>
                <strong>"{f.match}"</strong> {f.why} {f.tryThis}
              </span>
            </p>
          ))}
        </div>
        <span className="kc-tnum shrink-0 text-2xs text-ink-faint">
          {value.length}/{part.max}
        </span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════ */

export default function ObservationForm() {
  const { studentId, observationId } = useParams()
  const navigate = useNavigate()
  const { getStudent, addObservation, updateObservation, deleteObservation, settings, school } =
    useStore()
  const { profile } = useAuth()
  const [toast, setToast] = useToast()

  const student = getStudent(studentId)
  const existing = student?.observations?.find((o) => o.id === observationId)
  const isEdit = Boolean(existing)

  const [period, setPeriod] = useState(settings?.terms?.current || PERIODS[0])
  const [date, setDate] = useState(todayISO())
  const [tags, setTags] = useState([])
  const [tagNotes, setTagNotes] = useState({})
  const [dispositions, setDispositions] = useState([])
  const [story, setStory] = useState({ context: '', saw: '', meant: '', next: '' })
  const [milestone, setMilestone] = useState(null)
  const [visibility, setVisibility] = useState(
    settings?.policy?.defaultVisibility || 'shared'
  )
  const [concentration, setConcentration] = useState('')
  const [selfChosen, setSelfChosen] = useState(false)
  const [artefactUrl, setArtefactUrl] = useState('')
  const [subjects, setSubjects] = useState([])
  const [showSubjects, setShowSubjects] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!existing) return
    setPeriod(existing.period || PERIODS[0])
    setDate(existing.date || todayISO())
    setTags(existing.tags || [])
    setTagNotes(existing.tagNotes || {})
    setDispositions(existing.dispositions || [])
    setStory({
      context: existing.story?.context || '',
      saw: existing.story?.saw || existing.note || '',
      meant: existing.story?.meant || '',
      next: existing.story?.next || '',
    })
    setMilestone(existing.milestone || null)
    setVisibility(existing.visibility || 'shared')
    setConcentration(existing.concentrationMinutes ?? '')
    setSelfChosen(Boolean(existing.selfChosen))
    setArtefactUrl(existing.artefactUrl || '')
    setSubjects(existing.subjects || [])
    if (existing.subjects?.length) setShowSubjects(true)
  }, [existing])

  // Growth-edge tags default the whole observation to school-only, because a
  // teacher who knows a parent reads the concern stops recording concerns.
  const hasWatchTag = tags.some((t) => TAG_MAP[t]?.isWatch)
  useEffect(() => {
    if (hasWatchTag && settings?.policy?.watchTagsSchoolOnly !== false) {
      setVisibility('school')
    }
  }, [hasWatchTag, settings?.policy?.watchTagsSchoolOnly])

  if (!student) {
    return (
      <AppShell title="Student not found">
        <Card>
          <p className="text-sm text-ink-soft">
            That student is not in your roster.
          </p>
          <Button className="mt-3" as={Link} to="/teacher/roster">
            Back to the roster
          </Button>
        </Card>
      </AppShell>
    )
  }

  const toggleTag = (id) =>
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))

  const toggleDisposition = (id) =>
    setDispositions((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )

  const setSubject = (name, patch) =>
    setSubjects((prev) => {
      const found = prev.find((s) => s.subject === name)
      if (found) return prev.map((s) => (s.subject === name ? { ...s, ...patch } : s))
      return [...prev, { subject: name, understanding: '', engagement: '', note: '', ...patch }]
    })

  const canSave = tags.length > 0 || dispositions.length > 0 || story.saw.trim().length > 0

  const submit = async () => {
    if (!canSave) {
      setToast({ message: 'Tap at least one thing, or write what you saw.', tone: 'warn' })
      return
    }
    const payload = {
      id: existing?.id,
      period,
      date,
      teacher: profile?.full_name || school?.teacher || 'Teacher',
      tags,
      tagNotes,
      dispositions,
      story,
      note: story.saw || null,
      milestone,
      visibility,
      concentrationMinutes: concentration === '' ? null : Number(concentration),
      selfChosen,
      artefactUrl,
      subjects,
    }
    setSaving(true)
    try {
      if (isEdit) await updateObservation(student.id, payload)
      else await addObservation(student.id, payload)
      navigate(`/teacher/student/${student.id}`)
    } catch {
      setToast({ message: 'Could not save. Check your connection.', tone: 'alert' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell
      eyebrow={`${classLabel(student)}${student.rollNo ? ` - Roll ${student.rollNo}` : ''}`}
      title={isEdit ? `Edit an observation of ${student.name}` : `Observing ${student.name}`}
      subtitle="Use this for the child who did something worth a sentence. For everyone else, the class sweep is faster and fairer."
      actions={
        <>
          <Button as={Link} to={`/teacher/student/${student.id}`} icon={ArrowLeft}>
            Cancel
          </Button>
          <Button variant="primary" icon={Save} loading={saving} onClick={submit}>
            {isEdit ? 'Save changes' : 'Save observation'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {/* ── The story ─────────────────────────────────── */}
          <Card>
            <CardHead
              eyebrow="Learning story"
              title="What happened"
              subtitle="Notice, recognise, respond. Only two of these four are required, so it survives a busy week."
            />
            <div className="space-y-4">
              {STORY_PARTS.map((part) => (
                <StoryField
                  key={part.id}
                  part={part}
                  value={story[part.id] || ''}
                  onChange={(v) => setStory((prev) => ({ ...prev, [part.id]: v }))}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                label="Something they made"
                hint="A photo or file link. Reggio: let the artefact be the evidence."
              >
                <Input
                  value={artefactUrl}
                  onChange={(e) => setArtefactUrl(e.target.value)}
                  placeholder="https://"
                />
              </Field>
              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <Field
                  label="Concentrated for"
                  hint="Minutes of sustained attention, if you watched."
                >
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                    placeholder="10"
                  />
                </Field>
                <Button
                  size="md"
                  variant={selfChosen ? 'moss' : 'secondary'}
                  icon={selfChosen ? Check : Timer}
                  onClick={() => setSelfChosen((v) => !v)}
                  className="mb-6"
                >
                  Self chosen
                </Button>
              </div>
            </div>
          </Card>

          {/* ── Tags ──────────────────────────────────────── */}
          <Card>
            <CardHead
              eyebrow="What you noticed"
              title="Tap what was true"
              subtitle={`${tags.length} selected. Tap a selected one twice to add your own remark about it.`}
            />
            <div className="space-y-4">
              {TAG_GROUPS.map((group) => (
                <div key={group.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <p className="kc-eyebrow">{group.label}</p>
                    {group.watchGroup && (
                      <Badge tone="warn">School only by default</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        active={tags.includes(tag.id)}
                        tone={group.watchGroup ? 'warn' : group.accent === 'moss' ? 'moss' : 'accent'}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.label}
                      </Chip>
                    ))}
                  </div>
                  {/* Per-tag remarks for the tags selected in this group */}
                  {group.tags
                    .filter((t) => tags.includes(t.id))
                    .map((t) => (
                      <input
                        key={`note-${t.id}`}
                        value={tagNotes[t.id] || ''}
                        onChange={(e) =>
                          setTagNotes((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        placeholder={`Anything specific about "${t.label}"? Optional.`}
                        className="mt-2 h-8 w-full rounded-lg border border-line-soft bg-paper-2/50 px-2.5 text-xs text-ink placeholder:text-ink-faint/70 focus:border-accent focus:bg-card focus:outline-none"
                      />
                    ))}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Side column ─────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHead eyebrow="When" title="Term and date" />
            <div className="space-y-3">
              <Field label="Term">
                <Segmented
                  options={settings?.terms?.periods || PERIODS}
                  value={period}
                  onChange={setPeriod}
                />
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHead
              eyebrow="Dispositions"
              title="How they met the learning"
              subtitle="A different question from what they are good at. Carr's five."
            />
            <div className="space-y-1.5">
              {DISPOSITIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDisposition(d.id)}
                  aria-pressed={dispositions.includes(d.id)}
                  className={cx(
                    'w-full rounded-[10px] border p-2.5 text-left transition-colors',
                    dispositions.includes(d.id)
                      ? 'border-moss bg-moss-tint'
                      : 'border-line hover:border-ink-faint/40 hover:bg-paper-2/60'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cx(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        dispositions.includes(d.id)
                          ? 'border-moss bg-moss text-white'
                          : 'border-line'
                      )}
                    >
                      {dispositions.includes(d.id) && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="text-xs font-bold text-ink">{d.label}</span>
                  </span>
                  <span className="mt-1 block pl-6 text-2xs leading-snug text-ink-faint">
                    {d.prompt}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead eyebrow="Flag" title="Was this a moment?" />
            <div className="flex flex-wrap gap-1.5">
              {MILESTONES.map((m) => (
                <Chip
                  key={m.id}
                  active={milestone === m.id}
                  tone={m.schoolOnly ? 'warn' : 'accent'}
                  onClick={() => setMilestone((cur) => (cur === m.id ? null : m.id))}
                >
                  {m.label}
                </Chip>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead eyebrow="Visibility" title="Who can read this" />
            <div className="space-y-2">
              {[
                {
                  id: 'shared',
                  icon: Eye,
                  title: 'Shared with parents',
                  body: 'Appears on the profile the family sees.',
                },
                {
                  id: 'school',
                  icon: EyeOff,
                  title: 'School only',
                  body: 'Stays with staff. Use this freely; it is what keeps the record honest.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibility(opt.id)}
                  className={cx(
                    'w-full rounded-[10px] border p-3 text-left transition-colors',
                    visibility === opt.id
                      ? 'border-accent bg-accent-tint'
                      : 'border-line hover:border-ink-faint/40'
                  )}
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-ink">
                    <opt.icon size={14} />
                    {opt.title}
                  </span>
                  <span className="mt-1 block text-2xs leading-snug text-ink-faint">
                    {opt.body}
                  </span>
                </button>
              ))}
            </div>
            {hasWatchTag && (
              <Callout tone="warn" icon={Info} className="mt-3">
                You tapped a growth edge, so this was set to school only. You can
                still share it if you want the parent in the conversation.
              </Callout>
            )}
          </Card>

          {/* ── Subjects, collapsed ────────────────────────── */}
          <Card>
            <button
              type="button"
              onClick={() => setShowSubjects((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span>
                <span className="kc-eyebrow block">Optional</span>
                <span className="font-display text-lg font-semibold text-ink">
                  Subject detail
                </span>
              </span>
              <ChevronDown
                size={17}
                className={cx('text-ink-faint transition-transform', showSubjects && 'rotate-180')}
              />
            </button>
            {showSubjects && (
              <div className="mt-4 space-y-3">
                {SUBJECTS.map((name) => {
                  const row = subjects.find((s) => s.subject === name) || {}
                  return (
                    <div key={name} className="rounded-[10px] border border-line-soft p-3">
                      <p className="mb-2 text-xs font-bold text-ink">{name}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Select
                          value={row.understanding || ''}
                          onChange={(e) => setSubject(name, { understanding: e.target.value })}
                        >
                          <option value="">Understanding</option>
                          {UNDERSTANDING.map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </Select>
                        <Select
                          value={row.engagement || ''}
                          onChange={(e) => setSubject(name, { engagement: e.target.value })}
                        >
                          <option value="">Engagement</option>
                          {ENGAGEMENT.map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {isEdit && (
            <Button
              variant="danger"
              icon={Trash2}
              className="w-full"
              onClick={async () => {
                await deleteObservation(student.id, existing.id)
                navigate(`/teacher/student/${student.id}`)
              }}
            >
              Delete this observation
            </Button>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </AppShell>
  )
}
