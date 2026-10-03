import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlarmClock,
  Eraser,
  FileQuestion,
  KeyRound,
  RefreshCw,
  Shield,
  ShieldAlert,
  Smartphone,
} from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHead,
  EmptyState,
  Field,
  Input,
  Select,
  Table,
  Td,
  Textarea,
  Th,
  Toast,
  useToast,
} from '../../components/ui.jsx'
import { useStore } from '../../data/store.jsx'
import { readableAuthError } from '../../data/auth.jsx'
import {
  applyRetention,
  eraseStudent,
  loadDataRequests,
  mfaEnroll,
  mfaStatus,
  mfaUnenroll,
  mfaVerify,
  saveSetting,
  updateDataRequest,
} from '../../data/supabase.js'

const KIND_LABEL = {
  access: 'Access',
  correction: 'Correction',
  erasure: 'Erasure',
  withdraw: 'Withdrawal',
  grievance: 'Grievance',
  nominee: 'Nominee',
}

const PRIVACY_DEFAULTS = {
  noticeVersion: '2026-10',
  retentionMonthsAfterLeaving: 12,
  auditLogDays: 400,
  linkAttemptsPerHour: 5,
  maxGuardiansPerChild: 4,
  requestDueDays: 30,
  grievanceOfficer: { name: '', email: '', phone: '' },
}

/* ─── Rights requests queue ───────────────────────────────────── */

function RequestRow({ r, students, onSaved, onError }) {
  const [status, setStatus] = useState(r.status)
  const [response, setResponse] = useState(r.response || '')
  const [busy, setBusy] = useState(false)
  const child = students.find((s) => s.id === r.student_id)
  const overdue = r.status !== 'done' && r.status !== 'rejected' && new Date(r.due_at) < new Date()

  const save = async () => {
    setBusy(true)
    try {
      await updateDataRequest(r.id, { status, response: response.trim() || null })
      onSaved()
    } catch (e) {
      onError(readableAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr className="align-top">
      <Td>
        <Badge tone={r.kind === 'erasure' || r.kind === 'grievance' ? 'warn' : 'neutral'}>
          {KIND_LABEL[r.kind] || r.kind}
        </Badge>
        <p className="mt-1 kc-tnum text-2xs text-ink-faint">{String(r.created_at).slice(0, 10)}</p>
      </Td>
      <Td className="max-w-[16rem]">
        <p className="text-xs font-semibold text-ink">{child?.name || r.student_id || 'General'}</p>
        <p className="mt-1 whitespace-pre-wrap text-xs text-ink-soft">{r.body}</p>
      </Td>
      <Td>
        <span className={overdue ? 'font-bold text-alert' : 'text-ink-faint'}>
          {String(r.due_at).slice(0, 10)}
        </span>
      </Td>
      <Td className="min-w-[14rem]">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 text-xs">
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Textarea
          rows={2}
          className="mt-1.5 text-xs"
          placeholder="Reply the family will see"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        />
        <Button size="sm" className="mt-1.5" loading={busy} onClick={save}>
          Save
        </Button>
      </Td>
    </tr>
  )
}

/* ─── Admin two-factor ────────────────────────────────────────── */

function TwoFactorCard({ onToast }) {
  const [st, setSt] = useState(null)
  const [enrol, setEnrol] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const load = useCallback(() => {
    mfaStatus().then(setSt).catch(() => setSt({ totp: [], current: 'aal1' }))
  }, [])
  useEffect(load, [load])

  const start = async () => {
    setErr(null)
    try {
      setEnrol(await mfaEnroll())
    } catch (e) {
      setErr(readableAuthError(e))
    }
  }
  const verify = async () => {
    setBusy(true)
    setErr(null)
    try {
      await mfaVerify(enrol.id, code)
      setEnrol(null)
      setCode('')
      onToast({ message: 'Two-step sign-in is on for this account.' })
      load()
    } catch (e) {
      setErr(readableAuthError(e))
    } finally {
      setBusy(false)
    }
  }
  const remove = async (id) => {
    if (!window.confirm('Turn off two-step sign-in? Anyone with your password could then act as a superadmin.')) return
    try {
      await mfaUnenroll(id)
      load()
    } catch (e) {
      setErr(readableAuthError(e))
    }
  }

  const on = st?.totp?.length > 0

  return (
    <Card>
      <CardHead
        eyebrow="Your account"
        title={on ? 'Two-step sign-in is on' : 'Turn on two-step sign-in'}
        subtitle="A superadmin can see every school. Once this is on, admin powers need the six-digit code from your phone as well as your password."
      />
      {err && <Callout tone="alert" className="mb-3">{err}</Callout>}
      {on ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="moss" icon={Smartphone}>Authenticator app</Badge>
          <Button size="sm" variant="quiet" onClick={() => remove(st.totp[0].id)}>
            Turn off
          </Button>
        </div>
      ) : enrol ? (
        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <img
            src={enrol.totp?.qr_code}
            alt="Scan with Google Authenticator, Microsoft Authenticator or similar"
            className="h-40 w-40 rounded-[10px] border border-line bg-white p-2"
          />
          <div className="space-y-2">
            <p className="text-xs text-ink-soft">
              Scan this with any authenticator app, then type the code it shows.
              Cannot scan? Enter this key by hand:
            </p>
            <code className="block break-all rounded bg-paper-2 px-2 py-1 text-2xs">{enrol.totp?.secret}</code>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="kc-tnum tracking-[0.3em]"
            />
            <Button variant="primary" loading={busy} disabled={code.trim().length < 6} onClick={verify}>
              Verify and turn on
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="primary" icon={KeyRound} onClick={start}>
          Set up with an authenticator app
        </Button>
      )}
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════════ */

export default function AdminPrivacy() {
  const { students, settings, setSettings, refresh } = useStore()
  const [toast, setToast] = useToast()
  const [requests, setRequests] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [cfg, setCfg] = useState(() => ({ ...PRIVACY_DEFAULTS, ...(settings.privacy || {}) }))
  const [eraseId, setEraseId] = useState('')
  const [eraseName, setEraseName] = useState('')

  useEffect(() => {
    setCfg({ ...PRIVACY_DEFAULTS, ...(settings.privacy || {}) })
  }, [settings.privacy])

  const load = useCallback(() => {
    loadDataRequests()
      .then(setRequests)
      .catch((e) => setErr(readableAuthError(e)))
  }, [])
  useEffect(load, [load])

  const open = requests.filter((r) => r.status === 'open' || r.status === 'in_progress')
  const overdue = open.filter((r) => new Date(r.due_at) < new Date())
  const archived = useMemo(() => students.filter((s) => s.archived), [students])
  const target = students.find((s) => s.id === eraseId)

  const saveCfg = async () => {
    setBusy(true)
    try {
      const next = {
        ...cfg,
        retentionMonthsAfterLeaving: Math.max(1, Number(cfg.retentionMonthsAfterLeaving) || 12),
        auditLogDays: Math.max(365, Number(cfg.auditLogDays) || 400),
        linkAttemptsPerHour: Math.min(20, Math.max(1, Number(cfg.linkAttemptsPerHour) || 5)),
        maxGuardiansPerChild: Math.min(8, Math.max(1, Number(cfg.maxGuardiansPerChild) || 4)),
      }
      await saveSetting('privacy', next)
      setSettings({ privacy: next })
      setToast({ message: 'Privacy settings saved.' })
    } catch (e) {
      setErr(readableAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  const runRetention = async () => {
    if (!window.confirm(`Erase every child who left more than ${cfg.retentionMonthsAfterLeaving} months ago, and audit entries older than ${cfg.auditLogDays} days? This cannot be undone.`)) return
    setBusy(true)
    try {
      const r = await applyRetention()
      setToast({ message: `Done. ${r?.children_erased ?? 0} records erased, ${r?.log_rows_removed ?? 0} old log rows removed.` })
      refresh()
    } catch (e) {
      setErr(readableAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  const erase = async () => {
    if (!target) return
    setBusy(true)
    try {
      await eraseStudent(target.id, 'Erasure from /admin/privacy')
      setToast({ message: `${target.name}'s record has been erased.` })
      setEraseId('')
      setEraseName('')
      refresh()
    } catch (e) {
      setErr(readableAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  const officer = cfg.grievanceOfficer || {}
  const setOfficer = (k) => (e) =>
    setCfg((c) => ({ ...c, grievanceOfficer: { ...(c.grievanceOfficer || {}), [k]: e.target.value } }))

  return (
    <AppShell
      wide
      eyebrow="Superadmin"
      title="Privacy and safety"
      subtitle="Family requests, retention, erasure and account security. Under the DPDP Act the school decides; Kidchemy carries it out."
      actions={
        <Button icon={RefreshCw} onClick={load}>
          Refresh
        </Button>
      }
    >
      {err && (
        <Callout tone="alert" className="mb-4">
          {err}
        </Callout>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Open requests', open.length, FileQuestion],
          ['Overdue', overdue.length, AlarmClock],
          ['Children who left', archived.length, Eraser],
          ['Notice version', cfg.noticeVersion, Shield],
        ].map(([label, value, Icon]) => (
          <div key={label} className="rounded-[12px] border border-line bg-card p-4">
            <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.12em] text-ink-faint">
              <Icon size={12} /> {label}
            </p>
            <p className={`mt-1 font-display text-2xl font-semibold ${label === 'Overdue' && value ? 'text-alert' : 'text-ink'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <Card flush className="mb-5">
        <div className="p-5 pb-0">
          <CardHead
            eyebrow="Requests"
            title="What families have asked for"
            subtitle="Access, correction, erasure and grievances. Reply within 30 days; the Rules allow up to 90, families should not have to wait that long."
          />
        </div>
        {requests.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Kind</Th>
                <Th>About</Th>
                <Th>Due</Th>
                <Th>Status and reply</Th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <RequestRow key={r.id} r={r} students={students} onSaved={load} onError={setErr} />
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState icon={FileQuestion} title="No requests yet" body="When a family asks for a download, a correction or an erasure, it lands here with a due date." />
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead
            eyebrow="Retention"
            title="How long records are kept"
            subtitle="A child who leaves is erased automatically after this many months. Access logs are kept at least 365 days, as DPDP Rule 6 requires."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Months after a child leaves">
              <Input type="number" min={1} value={cfg.retentionMonthsAfterLeaving} onChange={(e) => setCfg((c) => ({ ...c, retentionMonthsAfterLeaving: e.target.value }))} />
            </Field>
            <Field label="Days to keep the audit log">
              <Input type="number" min={365} value={cfg.auditLogDays} onChange={(e) => setCfg((c) => ({ ...c, auditLogDays: e.target.value }))} />
            </Field>
            <Field label="Wrong codes allowed per hour">
              <Input type="number" min={1} max={20} value={cfg.linkAttemptsPerHour} onChange={(e) => setCfg((c) => ({ ...c, linkAttemptsPerHour: e.target.value }))} />
            </Field>
            <Field label="Guardians per child">
              <Input type="number" min={1} max={8} value={cfg.maxGuardiansPerChild} onChange={(e) => setCfg((c) => ({ ...c, maxGuardiansPerChild: e.target.value }))} />
            </Field>
          </div>
          <p className="kc-eyebrow mt-4">School grievance officer</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Input placeholder="Name" value={officer.name || ''} onChange={setOfficer('name')} />
            <Input placeholder="Email" value={officer.email || ''} onChange={setOfficer('email')} />
            <Input placeholder="Phone" value={officer.phone || ''} onChange={setOfficer('phone')} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" loading={busy} onClick={saveCfg}>
              Save
            </Button>
            <Button icon={Eraser} loading={busy} onClick={runRetention}>
              Run retention now
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead
              eyebrow="Erasure"
              title="Erase one child completely"
              subtitle="Observations, stories, their own words, classmates' notes about them, parent notes, links and consents. The audit log keeps only the fact that it happened."
            />
            <div className="space-y-2">
              <Select value={eraseId} onChange={(e) => { setEraseId(e.target.value); setEraseName('') }}>
                <option value="">Choose a child</option>
                {[...archived, ...students.filter((s) => !s.archived)].map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.archived ? '(left)' : ''}
                  </option>
                ))}
              </Select>
              {target && (
                <Field label={`Type “${target.name}” to confirm`}>
                  <Input value={eraseName} onChange={(e) => setEraseName(e.target.value)} autoComplete="off" />
                </Field>
              )}
              <Button
                icon={Eraser}
                loading={busy}
                disabled={!target || eraseName.trim() !== target.name}
                onClick={erase}
              >
                Erase permanently
              </Button>
            </div>
          </Card>
          <TwoFactorCard onToast={setToast} />
        </div>
      </div>

      <Callout tone="warn" icon={ShieldAlert} className="mt-5" title="If something goes wrong">
        Contain it first (rotate keys, suspend the account, rotate codes). Tell the
        school&rsquo;s principal the same day. Tell affected families without
        delay, in plain language. Send the Data Protection Board a detailed
        report within 72 hours. The full runbook is in docs/SECURITY.md.
      </Callout>
      <Toast toast={toast} />
    </AppShell>
  )
}
