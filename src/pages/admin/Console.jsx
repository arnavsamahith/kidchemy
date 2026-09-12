import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Building2,
  Database,
  Eye,
  KeyRound,
  Scale,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  Button,
  Callout,
  Card,
  CardHead,
  Meter,
  Stat,
  Table,
  Td,
  Th,
} from '../../components/ui.jsx'
import { useStore } from '../../data/store.jsx'
import {
  allObservations,
  attentionGap,
  byClass,
  toneBalance,
  visibilitySplit,
} from '../../data/analytics.js'
import { loadAuditLog, loadProfiles } from '../../data/supabase.js'

export default function AdminConsole() {
  const { students, settings } = useStore()
  const [profiles, setProfiles] = useState([])
  const [audit, setAudit] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all([loadProfiles(), loadAuditLog(20)])
      .then(([p, a]) => {
        if (!alive) return
        setProfiles(p)
        setAudit(a)
      })
      .catch((e) => alive && setErr(e))
    return () => {
      alive = false
    }
  }, [])

  const active = useMemo(() => students.filter((s) => !s.archived), [students])
  const classes = useMemo(() => byClass(active), [active])
  const obs = allObservations(active)
  const gap = useMemo(() => attentionGap(active), [active])
  const vis = useMemo(() => visibilitySplit(active), [active])
  const skew = useMemo(() => toneBalance(active), [active])

  const counts = useMemo(() => {
    const by = { teacher: 0, parent: 0, admin: 0 }
    profiles.forEach((p) => {
      by[p.role] = (by[p.role] || 0) + 1
    })
    return by
  }, [profiles])

  return (
    <AppShell
      wide
      eyebrow="Superadmin"
      title="Console"
      subtitle="Everything across every class, plus the switches that change how the product behaves without a deploy."
      actions={
        <>
          <Button as={Link} to="/admin/config" icon={Settings}>
            Configuration
          </Button>
          <Button as={Link} to="/admin/people" variant="primary" icon={Shield}>
            Accounts and codes
          </Button>
        </>
      }
    >
      {err && (
        <Callout tone="alert" icon={AlertTriangle} className="mb-4">
          Some admin data could not be loaded. Confirm your account has the
          admin role, and that the v3 schema has been applied.
        </Callout>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Students" value={active.length} icon={Users} />
        <Stat label="Classes" value={classes.length} icon={Building2} />
        <Stat label="Observations" value={obs.length} icon={Database} />
        <Stat
          label="Teachers"
          value={counts.teacher || 0}
          hint={`${counts.parent || 0} parents, ${counts.admin || 0} admins`}
          icon={Shield}
        />
        <Stat
          label="Reaching parents"
          value={`${100 - vis.schoolPct}%`}
          tone={vis.schoolPct > 60 ? 'warn' : 'good'}
          icon={Eye}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card flush>
          <div className="p-5 pb-0">
            <CardHead
              eyebrow="Classes"
              title="Coverage by class"
              subtitle="A class with a roster and no observations is a pilot that has already stalled."
            />
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Class</Th>
                <Th>School</Th>
                <Th align="right">Students</Th>
                <Th align="right">Observations</Th>
                <Th className="w-40">Covered</Th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const pct = c.count ? Math.round((c.coverage / c.count) * 100) : 0
                return (
                  <tr key={c.key}>
                    <Td className="font-bold text-ink">
                      {c.grade ? `Grade ${c.grade}${c.section || ''}` : 'Unassigned'}
                    </Td>
                    <Td>{c.school || '-'}</Td>
                    <Td align="right">{c.count}</Td>
                    <Td align="right">{c.observations}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Meter
                          pct={pct}
                          tone={pct >= 80 ? 'good' : pct >= 40 ? 'warn' : 'alert'}
                          className="w-20"
                        />
                        <span className="kc-tnum text-2xs text-ink-faint">{pct}%</span>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead
              eyebrow="Health"
              title="Signals worth watching"
              subtitle="The three ways a pilot dies quietly."
            />
            <ul className="space-y-3">
              <li>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                    <Scale size={12} /> Attention spread
                  </span>
                  <span className="kc-tnum text-sm font-bold text-ink">
                    {gap.spread}%
                  </span>
                </div>
                <Meter
                  pct={gap.spread}
                  tone={gap.spread > 70 ? 'alert' : gap.spread > 45 ? 'warn' : 'good'}
                />
                <p className="mt-1 text-2xs text-ink-faint">
                  High means quiet children are being missed.
                </p>
              </li>
              <li>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                    <Eye size={12} /> Withheld from parents
                  </span>
                  <span className="kc-tnum text-sm font-bold text-ink">
                    {vis.schoolPct}%
                  </span>
                </div>
                <Meter
                  pct={vis.schoolPct}
                  tone={vis.schoolPct > 60 ? 'warn' : 'good'}
                />
                <p className="mt-1 text-2xs text-ink-faint">
                  Very high usually means the sharing defaults are wrong.
                </p>
              </li>
              <li>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                    <AlertTriangle size={12} /> Concern-heavy records
                  </span>
                  <span className="kc-tnum text-sm font-bold text-ink">
                    {skew.length}
                  </span>
                </div>
                <Meter
                  pct={active.length ? (skew.length / active.length) * 100 : 0}
                  tone={skew.length ? 'warn' : 'good'}
                />
                <p className="mt-1 text-2xs text-ink-faint">
                  Children whose record is more than half growth edges.
                </p>
              </li>
            </ul>
          </Card>

          <Card>
            <CardHead
              eyebrow="Recent"
              title="Audit trail"
              actions={
                <Button size="sm" as={Link} to="/admin/audit">
                  All
                </Button>
              }
            />
            {audit.length ? (
              <ul className="space-y-1.5">
                {audit.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-xs">
                    <Activity size={11} className="shrink-0 text-ink-faint" />
                    <span className="font-semibold text-ink">{a.action}</span>
                    <span className="truncate text-ink-faint">{a.entity_id}</span>
                    <span className="ml-auto shrink-0 kc-tnum text-2xs text-ink-faint">
                      {String(a.created_at).slice(0, 10)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-faint">Nothing logged yet.</p>
            )}
          </Card>
        </div>
      </div>

      <Callout tone="info" icon={KeyRound} className="mt-5">
        The first superadmin has to be made by hand in the Supabase SQL editor,
        because promoting to admin requires an existing admin. The exact two
        lines are at the bottom of{' '}
        <code className="rounded bg-paper-2 px-1 py-0.5 text-xs">
          supabase/schema.sql
        </code>
        . After that, everything is done from here.
      </Callout>
    </AppShell>
  )
}
