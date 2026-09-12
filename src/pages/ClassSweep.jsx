import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleSlash,
  Eye,
  EyeOff,
  Timer,
  Undo2,
  Zap,
} from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Meter,
  Segmented,
  Toast,
  cx,
  useToast,
} from '../components/ui.jsx'
import { useStore } from '../data/store.jsx'
import { useAuth } from '../data/auth.jsx'
import { TAG_GROUPS, PERIODS } from '../data/taxonomy.js'
import { DISPOSITIONS } from '../data/pedagogy.js'
import { byRoll, classLabel } from '../data/roster.js'

/* ══════════════════════════════════════════════════════════════════
   Class sweep
   The inversion that makes this product survive contact with a real
   teacher. Instead of "tell me about Aarav", it asks "who did this
   this week", once per prompt, and the whole class is logged in under
   two minutes.
   ══════════════════════════════════════════════════════════════════ */

// The prompt deck. Strength tags first, then two dispositions, because a
// teacher's memory is organised by event rather than by child.
function buildDeck() {
  const tagPrompts = TAG_GROUPS.filter((g) => !g.watchGroup)
    .flatMap((g) =>
      g.tags
        .filter((t) => Object.keys(t.dims || {}).length || t.condition)
        .map((t) => ({
          kind: 'tag',
          id: t.id,
          label: t.label,
          group: g.label,
          accent: g.accent,
        }))
    )
    // Keep the deck short enough that it actually gets finished.
    .filter((_, i) => i % 2 === 0)
    .slice(0, 8)

  const dispositionPrompts = DISPOSITIONS.slice(0, 3).map((d) => ({
    kind: 'disposition',
    id: d.id,
    label: d.prompt,
    group: d.label,
    accent: 'moss',
  }))

  return [...tagPrompts, ...dispositionPrompts]
}

export default function ClassSweep() {
  const { students, school, settings, addBatchObservations } = useStore()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useToast()

  const roster = useMemo(
    () => students.filter((s) => !s.archived).sort(byRoll),
    [students]
  )

  const deck = useMemo(buildDeck, [])
  const [step, setStep] = useState(0)
  // picks: { [promptId]: Set<studentId> }
  const [picks, setPicks] = useState({})
  const [period, setPeriod] = useState(settings?.terms?.current || PERIODS[0])
  const [visibility, setVisibility] = useState(
    settings?.policy?.defaultVisibility || 'shared'
  )
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const prompt = deck[step]
  const chosen = picks[prompt?.id] || []

  const toggle = (studentId) => {
    setPicks((prev) => {
      const cur = prev[prompt.id] || []
      return {
        ...prev,
        [prompt.id]: cur.includes(studentId)
          ? cur.filter((id) => id !== studentId)
          : [...cur, studentId],
      }
    })
  }

  const totalTaps = Object.values(picks).reduce((n, arr) => n + arr.length, 0)
  const touched = new Set(Object.values(picks).flat())

  const save = async () => {
    // One observation per child, carrying every prompt they were tapped on.
    const byStudent = new Map()
    Object.entries(picks).forEach(([promptId, ids]) => {
      const p = deck.find((d) => d.id === promptId)
      ids.forEach((id) => {
        if (!byStudent.has(id)) byStudent.set(id, { tags: [], dispositions: [] })
        const entry = byStudent.get(id)
        if (p.kind === 'tag') entry.tags.push(promptId)
        else entry.dispositions.push(promptId)
      })
    })

    if (!byStudent.size) {
      setToast({ message: 'Nothing tapped yet.', tone: 'warn' })
      return
    }

    const date = new Date().toISOString().slice(0, 10)
    const entries = [...byStudent.entries()].map(([studentId, e]) => ({
      studentId,
      period,
      date,
      teacher: profile?.full_name || school?.teacher || 'Teacher',
      tags: e.tags,
      dispositions: e.dispositions,
      visibility,
      story: {},
      tagNotes: {},
      subjects: [],
      milestone: null,
    }))

    setSaving(true)
    try {
      await addBatchObservations(entries)
      setDone(true)
    } catch {
      setToast({ message: 'Could not save. Check your connection.', tone: 'alert' })
    } finally {
      setSaving(false)
    }
  }

  if (!roster.length) {
    return (
      <AppShell title="Class sweep">
        <EmptyState
          icon={Zap}
          title="No students to sweep"
          body="Import a roster first and this becomes the fastest ninety seconds in your week."
          action={
            <Button variant="primary" onClick={() => navigate('/teacher/roster')}>
              Go to the roster
            </Button>
          }
        />
      </AppShell>
    )
  }

  if (done) {
    return (
      <AppShell title="Sweep saved" bare={false}>
        <Card className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-moss-tint text-moss">
            <Check size={26} strokeWidth={2.4} />
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            {touched.size} child{touched.size === 1 ? '' : 'ren'} logged
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            {totalTaps} observation{totalTaps === 1 ? '' : 's'} recorded for {period}.
            Every profile you touched has just changed.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button onClick={() => navigate('/teacher/roster')} icon={ArrowRight}>
              See the roster
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setPicks({})
                setStep(0)
                setDone(false)
              }}
              icon={Undo2}
            >
              Sweep again
            </Button>
          </div>
        </Card>
        <Toast toast={toast} />
      </AppShell>
    )
  }

  return (
    <AppShell
      eyebrow="Class sweep"
      title={`Who did this, in ${school?.className || classLabel(roster[0])}?`}
      subtitle="Tap every child this was true of. Skip anything that does not apply. The whole deck takes about ninety seconds."
      actions={
        <>
          <Segmented
            options={settings?.terms?.periods || PERIODS}
            value={period}
            onChange={setPeriod}
            size="sm"
          />
          <Button
            variant={visibility === 'shared' ? 'secondary' : 'quiet'}
            size="sm"
            icon={visibility === 'shared' ? Eye : EyeOff}
            onClick={() =>
              setVisibility((v) => (v === 'shared' ? 'school' : 'shared'))
            }
          >
            {visibility === 'shared' ? 'Parents can see' : 'School only'}
          </Button>
        </>
      }
    >
      {/* Progress */}
      <div className="mb-4 flex items-center gap-3">
        <Meter pct={((step + 1) / deck.length) * 100} tone="accent" className="flex-1" />
        <span className="kc-tnum shrink-0 text-xs font-bold text-ink-faint">
          {step + 1} of {deck.length}
        </span>
      </div>

      <Card className="mb-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge tone={prompt.accent === 'moss' ? 'moss' : 'accent'}>
              {prompt.group}
            </Badge>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-snug text-ink">
              {prompt.label}
            </h2>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-semibold text-accent-ink kc-tnum">
              {chosen.length}
            </p>
            <p className="text-2xs text-ink-faint">tapped</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {roster.map((s) => {
            const active = chosen.includes(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={active}
                className={cx(
                  'flex items-center gap-2.5 rounded-[12px] border p-2.5 text-left transition-all duration-150',
                  active
                    ? 'border-accent bg-accent text-white shadow-[var(--shadow-card)]'
                    : 'border-line bg-card hover:border-ink-faint/45 hover:bg-paper-2/60'
                )}
              >
                {active ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25">
                    <Check size={16} strokeWidth={3} />
                  </span>
                ) : (
                  <Avatar name={s.name} size={32} />
                )}
                <span className="min-w-0">
                  <span
                    className={cx(
                      'block truncate text-xs font-bold',
                      active ? 'text-white' : 'text-ink'
                    )}
                  >
                    {s.name}
                  </span>
                  <span
                    className={cx(
                      'kc-tnum block text-2xs',
                      active ? 'text-white/75' : 'text-ink-faint'
                    )}
                  >
                    {s.rollNo ? `Roll ${s.rollNo}` : s.studentCode || ''}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          icon={ArrowLeft}
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>

        <span className="text-xs text-ink-faint">
          {touched.size} of {roster.length} children touched so far
        </span>

        {step < deck.length - 1 ? (
          <div className="flex gap-2">
            <Button
              variant="quiet"
              icon={CircleSlash}
              onClick={() => setStep((s) => s + 1)}
            >
              Nobody
            </Button>
            <Button
              variant="primary"
              iconRight={ArrowRight}
              onClick={() => setStep((s) => s + 1)}
            >
              Next prompt
            </Button>
          </div>
        ) : (
          <Button variant="primary" icon={Check} loading={saving} onClick={save}>
            Save the sweep
          </Button>
        )}
      </div>

      <Callout tone="neutral" icon={Timer} className="mt-5">
        <p>
          A per-child form takes about 45 seconds. Across 40 children that is
          half an hour. This deck asks the question the way memory actually
          stores it, which is by event rather than by child, and it covers the
          whole class in a fraction of the time.
        </p>
        <p className="mt-2">
          Use the per-child form for the exception: the child who did something
          worth a sentence. That sentence is what a parent remembers.
        </p>
      </Callout>

      <Toast toast={toast} />
    </AppShell>
  )
}
