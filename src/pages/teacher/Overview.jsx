import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CircleAlert,
  Flag,
  MessageSquareQuote,
  NotebookPen,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  ChartFrame,
  DimensionHeatmap,
  Meter,
  StatTile,
} from '../../components/charts.jsx'
import { useStore } from '../../data/store.jsx'
import { topDimensions, milestonesOf } from '../../data/derive.js'
import {
  allObservations,
  classBlindSpots,
  coverage,
  dimensionMatrix,
  daysSince,
  lastObservation,
  remarkCount,
  seriesColor,
} from '../../data/analytics.js'
import { PERIODS } from '../../data/taxonomy.js'

const CURRENT_TERM = PERIODS[PERIODS.length - 1]

export default function Overview() {
  const { students, school, error } = useStore()

  const obs = allObservations(students)
  const cov = coverage(students, CURRENT_TERM)
  const matrix = dimensionMatrix(students)
  const blind = classBlindSpots(students)
  const remarks = remarkCount(students)
  const recent = [...obs]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5)

  return (
    <AppShell
      title={`Good to see you, ${(school.teacher || 'there').split(' ').slice(-1)[0]}`}
      subtitle={`${school.className} · ${school.name}`}
      actions={
        <Link
          to="/teacher/sweep"
          className="inline-flex items-center gap-2 rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white transition hover:bg-clay-dark"
        >
          <Zap size={15} /> Class sweep
        </Link>
      }
    >
      {error && (
        <p className="mb-6 flex items-start gap-2 rounded-2xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">
          <CircleAlert size={16} className="mt-0.5 shrink-0" />
          Couldn't reach the server. What you see may be out of date — hit
          Refresh once you're back online.
        </p>
      )}

      {/* ── The four numbers worth glancing at ─────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Children"
          value={students.length}
          icon={Users}
          hint={`${school.className}`}
        />
        <StatTile
          label="Observations"
          value={obs.length}
          icon={NotebookPen}
          hint={`${obs.filter((o) => o.period === CURRENT_TERM).length} this term`}
        />
        <StatTile
          label="Custom remarks"
          value={remarks}
          icon={MessageSquareQuote}
          hint="Your own words attached to a tag"
        />
        <StatTile
          label="Milestones"
          value={obs.filter((o) => o.milestone).length}
          icon={Sparkles}
          hint="Days worth marking"
        />
      </div>

      {/* ── Coverage ───────────────────────────────────────── */}
      <div className="mt-5 rounded-2xl border border-line bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg text-ink">
            {CURRENT_TERM} coverage
          </h2>
          <p className="kc-tnum text-sm text-ink-soft">
            {cov.logged.length} of {students.length} logged · {cov.pct}%
          </p>
        </div>
        <div className="mt-3">
          <Meter pct={cov.pct} tone={cov.pct === 100 ? 'good' : 'warn'} />
        </div>
        {cov.missing.length > 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            Not yet this term:{' '}
            {cov.missing.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ', '}
                <Link
                  to={`/teacher/student/${s.id}`}
                  className="font-medium text-clay underline underline-offset-4"
                >
                  {s.name.split(' ')[0]}
                </Link>
              </span>
            ))}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Every child has at least one observation this term.
          </p>
        )}
      </div>

      {/* ── Children ───────────────────────────────────────── */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ink">Your class</h2>
          <Link
            to="/teacher/roster"
            className="text-sm font-medium text-moss underline underline-offset-4"
          >
            Full roster
          </Link>
        </div>
        <ul className="grid gap-4 lg:grid-cols-2">
          {students.map((s, i) => {
            const last = lastObservation(s)
            const gap = daysSince(last?.date)
            const top = topDimensions(s.observations, 3)
            const ms = milestonesOf(s.observations)[0]
            return (
              <li
                key={s.id}
                className="rounded-2xl border border-line bg-card p-5 transition hover:border-moss/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: seriesColor(i) }}
                      />
                      <h3 className="truncate font-display text-xl text-ink">
                        {s.name}
                      </h3>
                    </div>
                    <p className="kc-tnum mt-1 text-sm text-ink-faint">
                      {s.observations.length} observation
                      {s.observations.length === 1 ? '' : 's'}
                      {gap !== null && ` · last ${gap === 0 ? 'today' : `${gap} days ago`}`}
                    </p>
                  </div>
                  <span
                    className={[
                      'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      s.observations.some((o) => o.period === CURRENT_TERM)
                        ? 'bg-moss-tint text-moss-dark'
                        : 'bg-clay-tint text-clay-dark',
                    ].join(' ')}
                  >
                    {s.observations.some((o) => o.period === CURRENT_TERM)
                      ? `${CURRENT_TERM} logged`
                      : 'Not yet this term'}
                  </span>
                </div>

                {top.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {top.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft"
                      >
                        {d.label}
                      </li>
                    ))}
                  </ul>
                )}

                {ms?.note && (
                  <p className="mt-3 border-l-2 border-clay/40 pl-3 text-sm italic leading-relaxed text-ink-soft">
                    “{ms.note}”
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/teacher/student/${s.id}/observe`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-moss px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-moss-dark"
                  >
                    <NotebookPen size={15} /> Observe
                  </Link>
                  <Link
                    to={`/teacher/student/${s.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink"
                  >
                    Open file
                  </Link>
                  <Link
                    to={`/profile/${s.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink"
                  >
                    Parent view <ArrowUpRight size={14} />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Heatmap + blind spots ──────────────────────────── */}
      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <ChartFrame
          title="Where the evidence sits"
          subtitle="Scores rise with repeated evidence and never reach 100 — nothing about a child is finished."
          footer="Built from tags only. Hover a cell to see the band."
        >
          <DimensionHeatmap matrix={matrix} />
        </ChartFrame>

        <div className="grid gap-5">
          <ChartFrame
            title="What you haven't seen yet"
            subtitle="Dimensions with almost no evidence across the whole class."
          >
            {blind.length ? (
              <ul className="grid gap-3">
                {blind.map((d) => (
                  <li key={d.id} className="flex items-start gap-3">
                    <Flag size={15} className="mt-0.5 shrink-0 text-warn" />
                    <div>
                      <p className="text-sm font-medium text-ink">{d.label}</p>
                      <p className="text-xs leading-relaxed text-ink-faint">
                        {d.blurb}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">
                Every dimension has evidence behind it. That is rare — keep going.
              </p>
            )}
          </ChartFrame>

          <ChartFrame title="Latest entries">
            {recent.length ? (
              <ul className="grid gap-3">
                {recent.map((o) => (
                  <li key={o.id} className="border-l-2 border-line pl-3">
                    <p className="text-sm font-medium text-ink">
                      <Link
                        to={`/teacher/student/${o.studentId}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {o.studentName}
                      </Link>
                      <span className="kc-tnum ml-2 text-xs font-normal text-ink-faint">
                        {o.date}
                      </span>
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">
                      {o.note || `${(o.tags || []).length} tags recorded`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">Nothing logged yet.</p>
            )}
          </ChartFrame>
        </div>
      </div>
    </AppShell>
  )
}
