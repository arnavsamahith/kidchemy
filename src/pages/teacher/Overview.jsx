import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Clock,
  Eye,
  EyeOff,
  Feather,
  QrCode,
  Scale,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
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
} from '../../components/ui.jsx'
import { useStore } from '../../data/store.jsx'
import { useAuth } from '../../data/auth.jsx'
import {
  allObservations,
  attentionGap,
  coverage,
  overdue,
  toneBalance,
  visibilitySplit,
} from '../../data/analytics.js'
import { hasStory, profileDepth } from '../../data/derive.js'
import { classLabel } from '../../data/roster.js'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Overview() {
  const { students, settings, school, loading } = useStore()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const period = settings?.terms?.current || 'Term 1'
  const overdueDays = settings?.policy?.overdueDays ?? 21

  const stats = useMemo(() => {
    const active = students.filter((s) => !s.archived)
    const obs = allObservations(active)
    const cov = coverage(active, period)
    const gap = attentionGap(active)
    const late = overdue(active, overdueDays)
    const vis = visibilitySplit(active)
    const skew = toneBalance(active)
    const stories = obs.filter(hasStory).length
    const thisWeek = obs.filter((o) => {
      const d = new Date(o.date)
      return Number.isFinite(d.getTime()) && Date.now() - d.getTime() < 7 * 864e5
    }).length
    return { active, obs, cov, gap, late, vis, skew, stories, thisWeek }
  }, [students, period, overdueDays])

  const { active, obs, cov, gap, late, vis, skew, stories, thisWeek } = stats

  if (!loading && !active.length) {
    return (
      <AppShell
        title="No class yet"
        subtitle="Import your roster and the rest of this fills in."
      >
        <EmptyState
          icon={Users}
          title="Your roster is empty"
          body="Paste the class list your school already exports, or add students one at a time. Kidchemy reads name, student id, grade, section and roll number."
          action={
            <Button variant="primary" icon={Users} as={Link} to="/teacher/roster">
              Import a roster
            </Button>
          }
        />
      </AppShell>
    )
  }

  const firstName = (profile?.full_name || 'there').split(' ')[0]

  return (
    <AppShell
      eyebrow={`${school?.name || ''} ${period}`.trim()}
      title={`${greeting()}, ${firstName}`}
      subtitle={
        thisWeek
          ? `${thisWeek} observation${thisWeek === 1 ? '' : 's'} recorded in the last seven days. Class sweep is the fastest way to add more.`
          : 'Nothing recorded in the last seven days. A class sweep takes about ninety seconds.'
      }
      actions={
        <>
          <Button as={Link} to="/teacher/ptm" icon={ClipboardList}>
            Parent meeting sheets
          </Button>
          <Button as={Link} to="/teacher/sweep" variant="primary" icon={Zap}>
            Run a class sweep
          </Button>
        </>
      }
    >
      {/* ── Numbers ─────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          label="Children"
          value={active.length}
          hint={classLabel(active[0]) || school?.className}
          icon={Users}
          onClick={() => navigate('/teacher/roster')}
        />
        <Stat
          label={`Logged in ${period}`}
          value={`${cov.done}/${cov.total}`}
          hint={`${cov.pct}% of the class has at least one entry`}
          tone={cov.pct >= 80 ? 'good' : cov.pct >= 40 ? 'warn' : 'alert'}
          icon={Sparkles}
        />
        <Stat
          label="Written stories"
          value={stories}
          hint="Observations with a note, not only taps"
          tone={stories ? 'ink' : 'faint'}
          icon={Feather}
        />
        <Stat
          label="Not seen recently"
          value={late.length}
          hint={`No entry in over ${overdueDays} days`}
          tone={late.length ? 'alert' : 'good'}
          icon={Clock}
          onClick={() => navigate('/teacher/roster?filter=overdue')}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* ── Who has not been seen ─────────────────────────── */}
        <Card>
          <CardHead
            eyebrow="The work"
            title="Children we have not looked at"
            subtitle="Thinnest profiles first. A quiet child in the third row still has a parent who will scan the code."
            actions={
              <Button size="sm" as={Link} to="/teacher/roster" iconRight={ArrowRight}>
                Full roster
              </Button>
            }
          />
          {gap.rows.slice(0, 6).length === 0 ? (
            <EmptyState icon={Users} title="Nobody here yet" />
          ) : (
            <ul className="divide-y divide-line-soft">
              {gap.rows.slice(0, 6).map((row) => {
                const student = active.find((s) => s.id === row.id)
                const depth = profileDepth(student?.observations || [])
                return (
                  <li key={row.id}>
                    <Link
                      to={`/teacher/student/${row.id}`}
                      className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-paper-2/50 -mx-2 px-2 rounded-lg"
                    >
                      <Avatar name={row.name} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-ink">
                            {row.name}
                          </span>
                          {row.rollNo ? (
                            <span className="kc-tnum text-2xs text-ink-faint">
                              Roll {row.rollNo}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block">
                          <Meter
                            pct={depth.score}
                            tone={
                              depth.score >= 60
                                ? 'good'
                                : depth.score >= 25
                                  ? 'warn'
                                  : 'alert'
                            }
                          />
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-2xs font-bold text-ink-soft">
                          {depth.label}
                        </span>
                        <span className="kc-tnum block text-2xs text-ink-faint">
                          {row.count} entr{row.count === 1 ? 'y' : 'ies'}
                          {row.daysSince != null ? ` - ${row.daysSince}d ago` : ''}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          {/* ── Fairness check ──────────────────────────────── */}
          <Card>
            <CardHead
              eyebrow="Fairness"
              title="How evenly attention is spread"
              subtitle="A system that rewards visible behaviour under-describes quiet children. This is that bias, measured."
            />
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-ink-soft">
                    Spread between most and least observed
                  </span>
                  <span className="kc-tnum text-sm font-bold text-ink">
                    {gap.spread}%
                  </span>
                </div>
                <Meter
                  pct={gap.spread}
                  tone={gap.spread > 70 ? 'alert' : gap.spread > 45 ? 'warn' : 'good'}
                />
                <p className="mt-1.5 text-2xs text-ink-faint">
                  Most observed child has {gap.max}, least has {gap.min}. Average{' '}
                  {gap.mean}.
                </p>
              </div>

              {gap.spread > 55 && (
                <Callout tone="warn" icon={Scale}>
                  Attention is landing unevenly. A class sweep spreads it out,
                  because it asks about every child on every prompt.
                </Callout>
              )}
            </div>
          </Card>

          {/* ── What parents can see ────────────────────────── */}
          <Card>
            <CardHead
              eyebrow="Visibility"
              title="What parents can see"
              subtitle="Every observation is either shared or school-only, and you choose."
            />
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <Eye size={14} className="text-moss" />
                  <span className="font-bold text-ink kc-tnum">{vis.shared}</span>
                  <span className="text-ink-faint">shared</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-sm">
                  <EyeOff size={14} className="text-ink-faint" />
                  <span className="font-bold text-ink kc-tnum">{vis.school}</span>
                  <span className="text-ink-faint">school only</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-semibold text-ink kc-tnum">
                  {100 - vis.schoolPct}%
                </p>
                <p className="text-2xs text-ink-faint">reaches parents</p>
              </div>
            </div>
            {vis.schoolPct > 60 && obs.length > 5 && (
              <Callout tone="warn" icon={AlertTriangle} className="mt-3">
                Most of the record is being withheld. That usually means the
                sharing defaults are wrong rather than that the class is.
              </Callout>
            )}
          </Card>

          {/* ── Tone check ──────────────────────────────────── */}
          {skew.length > 0 && (
            <Card>
              <CardHead
                eyebrow="Tone"
                title="Records leaning on concerns"
                subtitle="These children have more growth edges logged than strengths. Worth a second look before a parent reads it."
              />
              <ul className="space-y-2">
                {skew.slice(0, 4).map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <Avatar name={r.name} size={26} />
                    <Link
                      to={`/teacher/student/${r.id}`}
                      className="flex-1 truncate text-sm font-semibold text-ink hover:text-accent"
                    >
                      {r.name}
                    </Link>
                    <Badge tone="warn">{r.edgePct}% concerns</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="bg-accent-tint border-accent-line">
            <div className="flex items-start gap-3">
              <QrCode size={18} className="mt-0.5 shrink-0 text-accent-ink" />
              <div>
                <p className="text-sm font-bold text-ink">
                  Report card stickers
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  One QR sticker per child, ready to print and stick on the
                  physical report card before the next parent meeting.
                </p>
                <Button
                  as={Link}
                  to="/teacher/stickers"
                  size="sm"
                  variant="primary"
                  className="mt-3"
                  iconRight={ArrowRight}
                >
                  Print stickers
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
