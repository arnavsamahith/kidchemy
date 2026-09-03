/**
 * ClassSweep — the fast whole-class logging flow.
 *
 * Instead of "tell me about Aryan", we ask:
 *   "Who did this today?"  [Aryan] [Priya] [Rohan] …
 *
 * Seven prompts, a few taps each — whole class logged in < 2 min.
 * Same data model as the per-child form, one-tenth the effort.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Sparkles, Zap } from 'lucide-react'
import { useStore } from '../data/store.jsx'
import { TAG_GROUPS, MILESTONES, PERIODS } from '../data/taxonomy.js'
import Chip from '../components/Chip.jsx'

// Pick a curated subset of tags for the sweep — fast, high-signal.
const SWEEP_GROUPS = TAG_GROUPS.map((g) => ({
  ...g,
  tags: g.tags.filter((t) => !t.style || t.id === 'needs-time'), // keep style tags too
}))

export default function ClassSweep() {
  const navigate = useNavigate()
  const { students, school, addBatchObservations } = useStore()

  const [period, setPeriod] = useState(PERIODS[PERIODS.length - 1])
  const [step, setStep] = useState('setup') // 'setup' | 'sweep' | 'done'

  // { tagId: Set<studentId> }
  const [selections, setSelections] = useState(() =>
    Object.fromEntries(
      SWEEP_GROUPS.flatMap((g) => g.tags).map((t) => [t.id, new Set()])
    )
  )

  const toggleStudent = (tagId, studentId) => {
    setSelections((prev) => {
      const next = new Set(prev[tagId])
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return { ...prev, [tagId]: next }
    })
  }

  const totalTags = Object.values(selections).reduce(
    (sum, s) => sum + s.size,
    0
  )

  const submit = () => {
    // Build one observation entry per student that has ≥1 tag.
    const byStudent = {}
    Object.entries(selections).forEach(([tagId, studentIds]) => {
      studentIds.forEach((sid) => {
        if (!byStudent[sid]) byStudent[sid] = []
        byStudent[sid].push(tagId)
      })
    })

    const entries = Object.entries(byStudent).map(([studentId, tags]) => ({
      studentId,
      period,
      date: new Date().toISOString().slice(0, 10),
      teacher: school.teacher,
      tags,
      note: '',
      milestone: null,
      visibility: 'shared',
      subjects: [],
    }))

    if (entries.length) addBatchObservations(entries)
    setStep('done')
  }

  if (step === 'done') {
    const logged = Object.values(selections).reduce((acc, s) => {
      s.forEach((sid) => acc.add(sid))
      return acc
    }, new Set()).size

    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-tint text-moss-dark">
          <Check size={30} />
        </div>
        <h2 className="mt-6 font-display text-2xl text-ink">
          {logged} {logged === 1 ? 'child' : 'children'} logged
        </h2>
        <p className="mt-2 text-ink-soft">
          Profiles updated. Parents will see the changes the next time they
          scan.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/teacher"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-ink-faint hover:text-ink"
          >
            Back to class
          </Link>
          <button
            onClick={() => {
              setSelections(
                Object.fromEntries(
                  SWEEP_GROUPS.flatMap((g) => g.tags).map((t) => [t.id, new Set()])
                )
              )
              setStep('setup')
            }}
            className="rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss-dark"
          >
            Log another sweep
          </button>
        </div>
      </div>
    )
  }

  if (step === 'setup') {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-6 sm:px-8">
        <Link
          to="/teacher"
          className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink"
        >
          <ArrowLeft size={15} /> {school.className}
        </Link>

        <header className="mt-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-clay-tint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-clay">
            <Zap size={12} /> Class sweep
          </div>
          <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
            Who did this today?
          </h1>
          <p className="mt-2 text-ink-soft">
            For each behaviour below, tap the children it describes this week.
            Whole class logged in under two minutes.
          </p>
        </header>

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

        <div className="mt-8">
          <button
            onClick={() => setStep('sweep')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-moss px-6 py-4 font-semibold text-white transition hover:bg-moss-dark sm:w-auto"
          >
            <Sparkles size={17} /> Start sweep — {school.className}
          </button>
        </div>
      </div>
    )
  }

  // step === 'sweep'
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-40 pt-6 sm:px-8">
      <button
        onClick={() => setStep('setup')}
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <header className="mt-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          {school.className} · {period}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Tap a student's name next to the behaviour you saw this week.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {SWEEP_GROUPS.map((group) => (
          <section key={group.id}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
              {group.label}
            </h2>
            <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white/60">
              {group.tags.map((tag) => {
                const sel = selections[tag.id]
                return (
                  <div key={tag.id} className="px-4 py-3.5 sm:px-5">
                    <p className="mb-2.5 text-sm font-semibold text-ink">
                      {tag.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {students.map((s) => {
                        const active = sel.has(s.id)
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStudent(tag.id, s.id)}
                            className={[
                              'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                              active
                                ? group.accent === 'clay'
                                  ? 'border-clay bg-clay-tint text-clay'
                                  : 'border-moss bg-moss-tint text-moss-dark'
                                : 'border-line bg-white text-ink-soft hover:border-ink-faint hover:text-ink',
                            ].join(' ')}
                          >
                            {s.name.split(' ')[0]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Sticky submit */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <p className="text-sm text-ink-faint">
            {totalTags} tag{totalTags === 1 ? '' : 's'} across{' '}
            {(() => {
              const s = new Set()
              Object.values(selections).forEach((set) => set.forEach((id) => s.add(id)))
              return s.size
            })()} student
            {(() => {
              const s = new Set()
              Object.values(selections).forEach((set) => set.forEach((id) => s.add(id)))
              return s.size === 1 ? '' : 's'
            })()}
          </p>
          <button
            type="button"
            disabled={totalTags === 0}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-ink-faint/40 hover:bg-moss-dark"
          >
            <Check size={16} /> Save sweep
          </button>
        </div>
      </div>
    </div>
  )
}
