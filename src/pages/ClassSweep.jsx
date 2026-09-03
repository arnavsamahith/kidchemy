/**
 * ClassSweep — the fast whole-class flow.
 *
 * Instead of "tell me about Aryan", it asks "who did this today?" and lets
 * the teacher tap names under each behaviour. A remark can still be attached
 * to any one child under any one tag, without leaving the flow.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  MessageSquarePlus,
  Sparkles,
  Zap,
} from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { useStore } from '../data/store.jsx'
import { TAG_GROUPS, PERIODS } from '../data/taxonomy.js'
import Chip from '../components/Chip.jsx'

const SWEEP_GROUPS = TAG_GROUPS
const ALL_SWEEP_TAGS = SWEEP_GROUPS.flatMap((g) => g.tags)
const MAX_TAG_NOTE = 160

const emptySelections = () =>
  Object.fromEntries(ALL_SWEEP_TAGS.map((t) => [t.id, new Set()]))

const key = (tagId, studentId) => `${tagId}|${studentId}`

export default function ClassSweep() {
  const { students, school, addBatchObservations } = useStore()

  const [period, setPeriod] = useState(PERIODS[PERIODS.length - 1])
  const [step, setStep] = useState('sweep') // 'sweep' | 'done'
  const [selections, setSelections] = useState(emptySelections)
  const [remarks, setRemarks] = useState({})
  const [openRemark, setOpenRemark] = useState(null)
  const [saving, setSaving] = useState(false)

  const toggleStudent = (tagId, studentId) =>
    setSelections((prev) => {
      const next = new Set(prev[tagId])
      if (next.has(studentId)) {
        next.delete(studentId)
        setOpenRemark((r) => (r === key(tagId, studentId) ? null : r))
      } else {
        next.add(studentId)
      }
      return { ...prev, [tagId]: next }
    })

  const totalTags = useMemo(
    () => Object.values(selections).reduce((sum, s) => sum + s.size, 0),
    [selections]
  )
  const touched = useMemo(() => {
    const set = new Set()
    Object.values(selections).forEach((s) => s.forEach((id) => set.add(id)))
    return set
  }, [selections])

  const remarkCount = Object.values(remarks).filter((t) => t?.trim()).length

  const submit = async () => {
    const byStudent = {}
    Object.entries(selections).forEach(([tagId, ids]) =>
      ids.forEach((sid) => {
        if (!byStudent[sid]) byStudent[sid] = { tags: [], tagNotes: {} }
        byStudent[sid].tags.push(tagId)
        const r = remarks[key(tagId, sid)]
        if (r?.trim()) byStudent[sid].tagNotes[tagId] = r.trim()
      })
    )

    const entries = Object.entries(byStudent).map(([studentId, v]) => ({
      studentId,
      period,
      date: new Date().toISOString().slice(0, 10),
      teacher: school.teacher,
      tags: v.tags,
      tagNotes: v.tagNotes,
      note: '',
      milestone: null,
      visibility: 'shared',
      subjects: [],
    }))

    if (!entries.length) return
    setSaving(true)
    try {
      await addBatchObservations(entries)
      setStep('done')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'done') {
    return (
      <AppShell title="Sweep saved">
        <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-tint text-moss-dark">
            <Check size={30} />
          </div>
          <h2 className="mt-6 font-display text-2xl text-ink">
            {touched.size} {touched.size === 1 ? 'child' : 'children'} logged
          </h2>
          <p className="mt-2 text-ink-soft">
            {totalTags} tags and {remarkCount} remark
            {remarkCount === 1 ? '' : 's'} recorded. Profiles have been rebuilt.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/teacher"
              className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-ink-faint hover:text-ink"
            >
              Back to overview
            </Link>
            <button
              type="button"
              onClick={() => {
                setSelections(emptySelections())
                setRemarks({})
                setStep('sweep')
              }}
              className="rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss-dark"
            >
              Log another sweep
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Who did this today?"
      subtitle={`${school.className} · tap the children each behaviour describes`}
      actions={
        <span className="inline-flex items-center gap-2 rounded-full bg-clay-tint px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-clay-dark">
          <Zap size={13} /> Class sweep
        </span>
      }
    >
      <Link
        to="/teacher"
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink"
      >
        <ArrowLeft size={15} /> Overview
      </Link>

      <div className="mt-5 rounded-2xl border border-line bg-card p-5">
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
      </div>

      <div className="mt-5 grid gap-5 pb-32 lg:grid-cols-2">
        {SWEEP_GROUPS.map((group) => (
          <section
            key={group.id}
            className="rounded-2xl border border-line bg-card p-5"
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
              {group.label}
            </h2>
            <ul className="mt-3 divide-y divide-line-soft">
              {group.tags.map((tag) => {
                const sel = selections[tag.id]
                return (
                  <li key={tag.id} className="py-3.5 first:pt-0 last:pb-0">
                    <p className="mb-2.5 text-sm font-semibold text-ink">
                      {tag.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {students.map((s) => {
                        const active = sel.has(s.id)
                        return (
                          <span key={s.id} className="inline-flex items-stretch">
                            <button
                              type="button"
                              onClick={() => toggleStudent(tag.id, s.id)}
                              className={[
                                'rounded-l-full border px-3.5 py-1.5 text-sm font-medium transition',
                                active
                                  ? group.accent === 'clay'
                                    ? 'border-clay bg-clay-tint text-clay-dark'
                                    : 'border-moss bg-moss-tint text-moss-dark'
                                  : 'rounded-r-full border-line bg-paper text-ink-soft hover:border-ink-faint hover:text-ink',
                              ].join(' ')}
                            >
                              {s.name.split(' ')[0]}
                            </button>
                            {active && (
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenRemark((r) =>
                                    r === key(tag.id, s.id) ? null : key(tag.id, s.id)
                                  )
                                }
                                aria-label={`Add a remark about ${s.name.split(' ')[0]}`}
                                className={[
                                  'rounded-r-full border border-l-0 px-2.5 transition',
                                  group.accent === 'clay'
                                    ? 'border-clay bg-clay-tint text-clay-dark'
                                    : 'border-moss bg-moss-tint text-moss-dark',
                                  remarks[key(tag.id, s.id)]?.trim()
                                    ? 'opacity-100'
                                    : 'opacity-60 hover:opacity-100',
                                ].join(' ')}
                              >
                                <MessageSquarePlus size={14} />
                              </button>
                            )}
                          </span>
                        )
                      })}
                    </div>

                    {students.map((s) => {
                      const k = key(tag.id, s.id)
                      if (openRemark !== k || !sel.has(s.id)) return null
                      const value = remarks[k] || ''
                      return (
                        <div key={k} className="kc-fade mt-3">
                          <textarea
                            autoFocus
                            rows={2}
                            maxLength={MAX_TAG_NOTE}
                            value={value}
                            onChange={(e) =>
                              setRemarks((prev) => ({ ...prev, [k]: e.target.value }))
                            }
                            placeholder={`${s.name.split(' ')[0]} — what did this look like?`}
                            className="w-full resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm leading-relaxed outline-none placeholder:text-ink-faint focus:border-moss"
                          />
                          <p className="kc-tnum mt-1 text-right text-xs text-ink-faint">
                            {value.length}/{MAX_TAG_NOTE}
                          </p>
                        </div>
                      )
                    })}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="kc-tnum text-sm text-ink-faint">
            {totalTags} tag{totalTags === 1 ? '' : 's'} across {touched.size} child
            {touched.size === 1 ? '' : 'ren'}
            {remarkCount ? ` · ${remarkCount} remark${remarkCount === 1 ? '' : 's'}` : ''}
          </p>
          <button
            type="button"
            disabled={totalTags === 0 || saving}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 font-semibold text-white transition hover:bg-moss-dark disabled:cursor-not-allowed disabled:bg-ink-faint/40"
          >
            <Sparkles size={16} /> {saving ? 'Saving…' : 'Save sweep'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
