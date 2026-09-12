import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Info,
  MessageSquareQuote,
  Scale,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  CadenceColumns,
  ChartFrame,
  DimensionHeatmap,
  GrowthLines,
  TagBars,
} from '../../components/charts.jsx'
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  CardHead,
  EmptyState,
  Meter,
  Stat,
  Table,
  Tabs,
  Td,
  Th,
} from '../../components/ui.jsx'
import { useStore } from '../../data/store.jsx'
import {
  allObservations,
  attentionGap,
  cadenceByMonth,
  classBlindSpots,
  classGrowth,
  dimensionMatrix,
  milestoneBreakdown,
  tagFrequency,
  tagRemarks,
  toneBalance,
  unusedTags,
  visibilitySplit,
} from '../../data/analytics.js'
import { TAG_MAP } from '../../data/taxonomy.js'

export default function Analytics() {
  const { students, school } = useStore()
  const [tab, setTab] = useState('patterns')
  const [showTable, setShowTable] = useState(false)
  const [tagFilter, setTagFilter] = useState(null)

  const active = useMemo(() => students.filter((s) => !s.archived), [students])

  const matrix = useMemo(() => dimensionMatrix(active), [active])
  const growth = useMemo(() => classGrowth(active), [active])
  const tags = useMemo(() => tagFrequency(active), [active])
  const cadence = useMemo(() => cadenceByMonth(active), [active])
  const milestones = useMemo(() => milestoneBreakdown(active), [active])
  const unused = useMemo(() => unusedTags(active), [active])
  const blind = useMemo(() => classBlindSpots(active), [active])
  const gap = useMemo(() => attentionGap(active), [active])
  const skew = useMemo(() => toneBalance(active), [active])
  const vis = useMemo(() => visibilitySplit(active), [active])
  const obs = allObservations(active)

  const remarks = useMemo(
    () =>
      active.flatMap((s) =>
        tagRemarks(s.observations).map((r) => ({
          ...r,
          studentId: s.id,
          studentName: s.name,
        }))
      ),
    [active]
  )

  const filteredRemarks = tagFilter
    ? remarks.filter((r) => r.tagId === tagFilter)
    : remarks

  if (!obs.length) {
    return (
      <AppShell title="Patterns">
        <EmptyState
          icon={BarChart3}
          title="Nothing to analyse yet"
          body="Run one class sweep and this page has something to say."
          action={
            <Button as={Link} to="/teacher/sweep" variant="primary">
              Run a class sweep
            </Button>
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      wide
      eyebrow="Patterns"
      title="What the class record actually says"
      subtitle={`${school?.className || 'This class'}, built from ${obs.length} observation${obs.length === 1 ? '' : 's'}.`}
      actions={
        <Button icon={TableIcon} onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'Hide' : 'Show'} the numbers
        </Button>
      }
      tabs={
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'patterns', label: 'Patterns', icon: TrendingUp },
            { value: 'fairness', label: 'Fairness', icon: Scale },
            { value: 'remarks', label: 'Your words', icon: MessageSquareQuote, count: remarks.length },
          ]}
        />
      }
    >
      <Callout tone="neutral" icon={Info} className="mb-5 max-w-3xl">
        Every number here is a count of tags you tapped. Nothing is inferred,
        predicted or scored by a model. If a chart looks wrong, the fix is
        another observation rather than a better algorithm.
      </Callout>

      {/* ── Patterns ──────────────────────────────────────── */}
      {tab === 'patterns' && (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartFrame
              title="Growth across the year"
              subtitle="Average of all dimensions at the end of each term. Cumulative, so it only moves up with new evidence."
              footer="Hover a term for what moved."
            >
              <GrowthLines growth={growth} />
            </ChartFrame>

            <ChartFrame
              title="Which tags you actually use"
              subtitle="Click a tag to pull up every remark you wrote under it."
              footer={
                unused.length
                  ? `${unused.length} tags have never been used in this class. Worth a look before the next sweep.`
                  : 'Every tag in the vocabulary has been used at least once.'
              }
            >
              <TagBars
                data={tags}
                onSelectTag={(t) => {
                  setTagFilter(t)
                  setTab('remarks')
                }}
                activeTag={tagFilter}
              />
            </ChartFrame>
          </div>

          <ChartFrame
            title="Where the evidence sits"
            subtitle="Each child against each dimension. Pale means we have not seen it yet, not that it is absent."
          >
            <DimensionHeatmap matrix={matrix} />
          </ChartFrame>

          <div className="grid gap-5 xl:grid-cols-2">
            <ChartFrame
              title="How often this gets used"
              subtitle="Observations logged per month across the class."
              footer="Weekly beats thorough. A thin record every week is worth more than a perfect one every term."
            >
              <CadenceColumns data={cadence} />
            </ChartFrame>

            <ChartFrame
              title="Class blind spots"
              subtitle="Dimensions almost nobody in this class has been observed on."
            >
              {blind.length ? (
                <ul className="space-y-2.5">
                  {blind.map((b) => (
                    <li key={b.id}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-sm font-semibold text-ink">{b.label}</span>
                        <span className="kc-tnum text-xs text-ink-faint">
                          {b.seen} of {b.total} children
                        </span>
                      </div>
                      <Meter pct={(b.seen / Math.max(b.total, 1)) * 100} tone="warn" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-faint">
                  No blind spots. Every dimension has been observed across most
                  of the class.
                </p>
              )}
            </ChartFrame>
          </div>

          {milestones.length > 0 && (
            <Card>
              <CardHead eyebrow="Moments" title="Days worth marking" />
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {milestones.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-[12px] bg-paper-2 px-4 py-3"
                  >
                    <span className="text-sm text-ink">{m.label}</span>
                    <span className="kc-tnum text-sm font-bold text-ink-soft">
                      {m.count}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* ── Fairness ──────────────────────────────────────── */}
      {tab === 'fairness' && (
        <div className="space-y-5">
          <Callout tone="warn" icon={Scale} title="Why this tab exists">
            A record built on visible behaviour will systematically
            under-describe quiet children. That is the same bias report cards
            have, wearing nicer clothes. The only defence is to measure it.
          </Callout>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Attention spread"
              value={`${gap.spread}%`}
              hint="Gap between most and least observed"
              tone={gap.spread > 70 ? 'alert' : gap.spread > 45 ? 'warn' : 'good'}
            />
            <Stat label="Average per child" value={gap.mean} hint="Observations" />
            <Stat
              label="Never observed"
              value={gap.rows.filter((r) => r.count === 0).length}
              tone={gap.rows.some((r) => r.count === 0) ? 'alert' : 'good'}
              hint="Children with no record at all"
            />
            <Stat
              label="Reaches parents"
              value={`${100 - vis.schoolPct}%`}
              hint={`${vis.school} kept school only`}
              tone={vis.schoolPct > 60 ? 'warn' : 'ink'}
            />
          </div>

          <Card flush>
            <div className="p-5 pb-0">
              <CardHead
                eyebrow="Everyone"
                title="Attention, thinnest first"
                subtitle="The top of this list is the work for next week."
              />
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th className="w-40">Depth</Th>
                  <Th align="right">Entries</Th>
                  <Th align="right">Written</Th>
                  <Th align="right">Teachers</Th>
                  <Th align="right">Last seen</Th>
                </tr>
              </thead>
              <tbody>
                {gap.rows.map((r) => (
                  <tr key={r.id} className="hover:bg-paper-2/45">
                    <Td>
                      <Link
                        to={`/teacher/student/${r.id}`}
                        className="flex items-center gap-2.5 font-semibold text-ink hover:text-accent"
                      >
                        <Avatar name={r.name} size={26} />
                        {r.name}
                      </Link>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Meter
                          pct={r.depth}
                          tone={r.depth >= 60 ? 'good' : r.depth >= 25 ? 'warn' : 'alert'}
                          className="w-16"
                        />
                        <span className="text-2xs text-ink-faint">{r.depthLabel}</span>
                      </div>
                    </Td>
                    <Td align="right">{r.count}</Td>
                    <Td align="right">{r.stories}</Td>
                    <Td align="right">{r.teachers}</Td>
                    <Td align="right">
                      {r.daysSince == null ? (
                        <Badge tone="alert">Never</Badge>
                      ) : (
                        `${r.daysSince}d`
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {skew.length > 0 && (
            <Card>
              <CardHead
                eyebrow="Tone"
                title="Records leaning on concerns"
                subtitle="More growth edges logged than strengths. Worth balancing before a parent reads it."
              />
              <ul className="space-y-2">
                {skew.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <Avatar name={r.name} size={28} />
                    <Link
                      to={`/teacher/student/${r.id}`}
                      className="flex-1 truncate text-sm font-semibold text-ink hover:text-accent"
                    >
                      {r.name}
                    </Link>
                    <span className="kc-tnum text-xs text-ink-faint">
                      {r.strength} strengths, {r.edge} edges
                    </span>
                    <Badge tone="warn">{r.edgePct}%</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* ── Remarks ───────────────────────────────────────── */}
      {tab === 'remarks' && (
        <div>
          {tagFilter && (
            <div className="mb-3 flex items-center gap-2">
              <Badge tone="accent">{TAG_MAP[tagFilter]?.label || tagFilter}</Badge>
              <Button size="sm" variant="quiet" onClick={() => setTagFilter(null)}>
                Show all
              </Button>
            </div>
          )}
          {filteredRemarks.length ? (
            <ul className="grid gap-3 lg:grid-cols-2">
              {filteredRemarks.map((r, i) => (
                <li
                  key={`${r.observationId}-${r.tagId}-${i}`}
                  className="rounded-[14px] border border-line bg-card p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/teacher/student/${r.studentId}`}
                      className="text-xs font-bold text-ink hover:text-accent"
                    >
                      {r.studentName}
                    </Link>
                    <Badge tone="moss">{r.tagLabel}</Badge>
                    <span className="kc-tnum text-2xs text-ink-faint">
                      {r.period} {r.date}
                    </span>
                    {r.visibility === 'school' && <Badge tone="warn">school only</Badge>}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={MessageSquareQuote}
              title="No remarks under this tag yet"
              body="Every tag you tap gets its own line in the observation form for your own words. Those lines are the most quotable thing in the product."
            />
          )}
        </div>
      )}

      {/* ── Raw numbers: nothing is gated behind a chart ───── */}
      {showTable && (
        <Card flush className="mt-5">
          <div className="p-5 pb-0">
            <CardHead eyebrow="Raw" title="The numbers behind the charts" />
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Child</Th>
                {matrix.dimensions.map((d) => (
                  <Th key={d.id} align="right">
                    {d.label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((r) => (
                <tr key={r.id}>
                  <Td className="font-semibold text-ink">{r.name}</Td>
                  {r.cells.map((c) => (
                    <Td key={c.id} align="right">
                      {c.score}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </AppShell>
  )
}
