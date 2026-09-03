import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarClock,
  CircleCheck,
  CircleDashed,
  Loader2,
  NotebookPen,
  Users,
  Zap,
} from 'lucide-react'
import { useStore } from '../data/store.jsx'
import { topDimensions } from '../data/derive.js'
import { Arc } from '../components/Ornament.jsx'

function lastSeen(observations) {
  if (!observations.length) return null
  return observations[observations.length - 1]
}

export default function TeacherDashboard() {
  const { students, school, loading } = useStore()

  const done = students.filter((s) =>
    s.observations.some((o) => o.period === 'Term 3')
  ).length

  // Students not observed in a while (no observations this term)
  const needsAttention = students.filter(
    (s) => !s.observations.some((o) => o.period === 'Term 3')
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8 sm:px-8">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-white/70 p-6 sm:p-8">
        <Arc className="pointer-events-none absolute -right-10 -top-14 h-56 w-56 text-moss" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
          Teacher workspace
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
          {school.className}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {school.name} · {school.city} · {school.teacher}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-paper-2 px-3.5 py-1.5 text-ink-soft">
            <Users size={15} /> {students.length} children
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-paper-2 px-3.5 py-1.5 text-ink-soft">
            <CircleCheck size={15} /> {done} of {students.length} logged this term
          </span>
          {loading && (
            <span className="inline-flex items-center gap-2 rounded-full bg-paper-2 px-3.5 py-1.5 text-ink-soft">
              <Loader2 size={15} className="animate-spin" /> Syncing…
            </span>
          )}
        </div>

        {/* Class-sweep CTA */}
        <div className="mt-6">
          <Link
            to="/teacher/sweep"
            className="inline-flex items-center gap-2 rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay/90"
          >
            <Zap size={15} /> Log whole class in 2 min
          </Link>
          <p className="mt-2 text-xs text-ink-faint">
            "Who asked a great question today?" — tap names, done.
          </p>
        </div>
      </header>

      {/* Nudge: students without a Term 3 log */}
      {needsAttention.length > 0 && needsAttention.length < students.length && (
        <div className="mt-6 rounded-2xl border border-clay/30 bg-clay-tint/50 px-5 py-4">
          <p className="text-sm font-semibold text-clay">
            {needsAttention.length}{' '}
            {needsAttention.length === 1 ? 'child' : 'children'} not yet logged
            this term:
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {needsAttention.map((s) => s.name.split(' ')[0]).join(', ')}
          </p>
        </div>
      )}

      <h2 className="mb-3 mt-10 font-display text-xl text-ink">Your class</h2>

      <ul className="grid gap-3">
        {students.map((s) => {
          const last = lastSeen(s.observations)
          const thisTerm = s.observations.some((o) => o.period === 'Term 3')
          const top = topDimensions(s.observations, 2)
          return (
            <li
              key={s.id}
              className="rounded-2xl border border-line bg-white/70 p-4 transition hover:border-moss/50 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl text-ink">{s.name}</h3>
                    {thisTerm ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-moss-tint px-2 py-0.5 text-[11px] font-semibold text-moss-dark">
                        <CircleCheck size={12} /> Term 3 logged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-clay-tint px-2 py-0.5 text-[11px] font-semibold text-clay">
                        <CircleDashed size={12} /> Not yet this term
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-faint">
                    {s.observations.length} observation
                    {s.observations.length === 1 ? '' : 's'}
                    {last ? ` · last on ${last.date}` : ''}
                    <span className="inline-flex items-center gap-1 pl-2">
                      <CalendarClock size={13} /> {s.frequency}
                    </span>
                  </p>
                  {top.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {top.map((d) => (
                        <span
                          key={d.id}
                          className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-soft"
                        >
                          {d.label}
                        </span>
                      ))}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/profile/${s.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink"
                  >
                    Parent view <ArrowUpRight size={15} />
                  </Link>
                  <Link
                    to={`/teacher/${s.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-moss px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-moss-dark"
                  >
                    <NotebookPen size={15} /> Observe
                  </Link>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
