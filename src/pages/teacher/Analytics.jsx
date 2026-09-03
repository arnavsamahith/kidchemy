import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, MessageSquareQuote, Table } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  CadenceColumns,
  ChartFrame,
  DimensionHeatmap,
  GrowthLines,
  TagBars,
} from '../../components/charts.jsx'
import { useStore } from '../../data/store.jsx'
import {
  allObservations,
  cadenceByMonth,
  classGrowth,
  dimensionMatrix,
  milestoneBreakdown,
  tagFrequency,
  tagRemarks,
  unusedTags,
} from '../../data/analytics.js'
import { TAG_MAP } from '../../data/taxonomy.js'

export default function Analytics() {
  const { students, school } = useStore()
  const [showTable, setShowTable] = useState(false)
  const [tagFilter, setTagFilter] = useState(null)

  const matrix = useMemo(() => dimensionMatrix(students), [students])
  const growth = useMemo(() => classGrowth(students), [students])
  const tags = useMemo(() => tagFrequency(students), [students])
  const cadence = useMemo(() => cadenceByMonth(students), [students])
  const milestones = useMemo(() => milestoneBreakdown(students), [students])
  const unused = useMemo(() => unusedTags(students), [students])
  const obs = allObservations(students)

  const remarks = useMemo(
    () =>
      students.flatMap((s) =>
        tagRemarks(s.observations).map((r) => ({
          ...r,
          studentId: s.id,
          studentName: s.name,
        }))
      ),
    [students]
  )

  const filteredRemarks = tagFilter
    ? remarks.filter((r) => r.tagId === tagFilter)
    : remarks

  return (
    <AppShell
      title="Class insights"
      subtitle={`${school.className} · built from ${obs.length} observations`}
      actions={
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink"
        >
          <Table size={15} /> {showTable ? 'Hide' : 'Show'} the numbers
        </button>
      }
    >
      <p className="mb-6 flex max-w-3xl items-start gap-2.5 rounded-2xl border border-line bg-card px-4 py-3.5 text-sm leading-relaxed text-ink-soft">
        <Info size={16} className="mt-0.5 shrink-0 text-ink-faint" />
        Every number here is a count of the tags you tapped — nothing is
        inferred, predicted, or scored by a model. If a chart looks wrong, the
        fix is another observation, not a better algorithm.
      </p>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartFrame
          title="Growth across the year"
          subtitle="Average of all seven dimensions at the end of each term. Cumulative — it can only be pushed up by new evidence."
          footer="Hover a term for what moved."
        >
          <GrowthLines growth={growth} />
        </ChartFrame>

        <ChartFrame
          title="Which tags you actually use"
          subtitle="Click a tag to pull up every remark you wrote under it."
          footer={
            unused.length
              ? `${unused.length} tags have never been used in this class — worth a look before the next sweep.`
              : 'Every tag in the vocabulary has been used at least once.'
          }
        >
          <TagBars data={tags} onSelectTag={setTagFilter} activeTag={tagFilter} />
        </ChartFrame>
      </div>

      <div className="mt-5">
        <ChartFrame
          title="Where the evidence sits"
          subtitle="Each child against each dimension. Pale means you have not seen it yet — not that it isn't there."
        >
          <DimensionHeatmap matrix={matrix} />
        </ChartFrame>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ChartFrame
          title="How often this gets used"
          subtitle="Observations logged per month across the class."
          footer="Weekly beats thorough. A thin record every week is worth more than a perfect one every term."
        >
          <CadenceColumns data={cadence} />
        </ChartFrame>

        <ChartFrame title="Days worth marking" subtitle="Milestones recorded so far.">
          {milestones.length ? (
            <ul className="grid gap-2.5">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-paper-2 px-4 py-3"
                >
                  <span className="text-sm text-ink">{m.label}</span>
                  <span className="kc-tnum text-sm font-semibold text-ink-soft">
                    {m.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-faint">No milestones recorded yet.</p>
          )}
        </ChartFrame>
      </div>

      {/* ── Remark ledger ─────────────────────────────────── */}
      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-xl text-ink">
            <MessageSquareQuote size={18} className="text-clay" />
            Your remarks
            {tagFilter && (
              <span className="text-base font-normal text-ink-faint">
                · {TAG_MAP[tagFilter]?.label}
              </span>
            )}
          </h2>
          {tagFilter && (
            <button
              type="button"
              onClick={() => setTagFilter(null)}
              className="text-sm font-medium text-moss underline underline-offset-4"
            >
              Show all
            </button>
          )}
        </div>

        {filteredRemarks.length ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {filteredRemarks.map((r, i) => (
              <li
                key={`${r.observationId}-${r.tagId}-${i}`}
                className="rounded-2xl border border-line bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Link
                    to={`/teacher/student/${r.studentId}`}
                    className="font-semibold text-ink underline-offset-4 hover:underline"
                  >
                    {r.studentName}
                  </Link>
                  <span className="rounded-full bg-moss-tint px-2 py-0.5 font-medium text-moss-dark">
                    {r.tagLabel}
                  </span>
                  <span className="kc-tnum text-ink-faint">
                    {r.period} · {r.date}
                  </span>
                  {r.visibility === 'school' && (
                    <span className="rounded-full bg-clay-tint px-2 py-0.5 font-medium text-clay-dark">
                      school only
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-ink-faint">
            No remarks under this tag yet. Add one from the observation form —
            every tag you tap gets its own line for your own words.
          </p>
        )}
      </section>

      {/* ── Table view: nothing is gated behind a chart ────── */}
      {showTable && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl text-ink">The numbers</h2>
          <div className="kc-scroll overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  <th className="px-5 py-3">Child</th>
                  {matrix.dimensions.map((d) => (
                    <th key={d.id} className="px-3 py-3 text-right">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((r) => (
                  <tr key={r.id} className="border-b border-line-soft last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">{r.name}</td>
                    {r.cells.map((c) => (
                      <td key={c.id} className="kc-tnum px-3 py-3 text-right text-ink-soft">
                        {c.score}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppShell>
  )
}
