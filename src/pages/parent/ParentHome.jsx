import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Download,
  FileQuestion,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserMinus,
} from 'lucide-react'
import { useAuth, readableAuthError } from '../../data/auth.jsx'
import { useStore } from '../../data/store.jsx'
import {
  evidenceSummary,
  profileDepth,
  topDimensions,
} from '../../data/derive.js'
import { Mark } from '../../components/AppShell.jsx'
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Field,
  Input,
  Meter,
  Modal,
  Select,
  Textarea,
  Toast,
  cx,
  useToast,
} from '../../components/ui.jsx'
import { classLabel } from '../../data/roster.js'
import { NOTICE_VERSION, PURPOSES } from '../../data/privacy.js'
import { downloadJson } from '../../data/safety.js'
import {
  confirmLink,
  fileDataRequest,
  loadDataRequests,
  pendingLinks,
  withdrawConsent,
} from '../../data/supabase.js'

/* ─── Consent: one checkbox per purpose, nothing pre-ticked ───── */

function ConsentBlock({ value, onChange }) {
  return (
    <div className="rounded-[12px] border border-line bg-paper p-4">
      <p className="text-xs font-bold text-ink">
        Before you link, here is what the school uses Kidchemy for.
      </p>
      <ul className="mt-3 space-y-2.5">
        {PURPOSES.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                checked={value.includes(p.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked ? [...value, p.id] : value.filter((x) => x !== p.id)
                  )
                }
              />
              <span>
                <span className="block text-sm font-semibold text-ink">{p.label}</span>
                <span className="block text-xs leading-relaxed text-ink-faint">{p.detail}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        No ads, no selling, no sharing outside the school. You can download,
        correct or erase your child&rsquo;s record, or withdraw, at any time.{' '}
        <Link to="/privacy" target="_blank" className="font-semibold text-accent-ink underline underline-offset-2">
          Read the full notice
        </Link>
        .
      </p>
    </div>
  )
}

const allRequired = (v) => PURPOSES.filter((p) => p.required).every((p) => v.includes(p.id))

/* ─── Rights requests ─────────────────────────────────────────── */

const REQUEST_KINDS = {
  correction: {
    title: 'Ask for a correction',
    hint: 'What is wrong, and what should it say? The teacher who wrote it is asked first.',
  },
  erasure: {
    title: 'Ask for this record to be erased',
    hint: 'The school confirms with you before anything is deleted. Some records, like the progress card itself, the school may have to keep by law; they will tell you which.',
  },
  grievance: {
    title: 'Raise a concern',
    hint: 'Anything about how your child’s information is handled. You will get a reply within 30 days.',
  },
  nominee: {
    title: 'Name someone to act for you',
    hint: 'Their name, relationship, and email. They can use these rights if you cannot.',
  },
}

function RequestModal({ kind, student, onClose, onDone }) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  if (!kind) return null
  const meta = REQUEST_KINDS[kind]
  const send = async () => {
    setBusy(true)
    setErr(null)
    try {
      await fileDataRequest({ studentId: student?.id, kind, body })
      onDone('Sent. You will hear back within 30 days, usually much sooner.')
      onClose()
      setBody('')
    } catch (e) {
      setErr(readableAuthError(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={meta.title}
      subtitle={student ? `About ${student.name.split(' ')[0]}` : undefined}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={send} disabled={!body.trim()}>
            Send to the school
          </Button>
        </>
      }
    >
      <Field label="Your message" hint={meta.hint} error={err}>
        <Textarea rows={5} value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} />
      </Field>
    </Modal>
  )
}

function exportChild(student) {
  const shared = (student.observations || []).filter(
    (o) => (o.visibility || 'shared') === 'shared'
  )
  downloadJson(`kidchemy-${student.name.split(' ')[0].toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`, {
    exported_at: new Date().toISOString(),
    notice_version: NOTICE_VERSION,
    child: {
      name: student.name,
      class: classLabel(student),
      school: student.school,
      roll_no: student.rollNo ?? null,
    },
    observations: shared.map((o) => ({
      date: o.date,
      period: o.period,
      teacher: o.teacher,
      tags: o.tags,
      story: o.story,
      note: o.note,
      milestone: o.milestone,
      subjects: o.subjects,
    })),
    in_their_words: (student.selfAssessments || []).map(
      ({ period, date, enjoyed, hard, want_next, feeling }) => ({ period, date, enjoyed, hard, want_next, feeling })
    ),
    your_notes: (student.parentNotes || []).map(({ period, body, created_at }) => ({ period, body, created_at })),
  })
}

/* ══════════════════════════════════════════════════════════════════ */

export default function ParentHome() {
  const { profile, signOut, linkChild } = useAuth()
  const { students, refresh, loading, school } = useStore()
  const [toast, setToast] = useToast()
  const [form, setForm] = useState({ code: '', firstName: '', relationship: 'Parent' })
  const [purposes, setPurposes] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [pending, setPending] = useState([])
  const [pendingConsent, setPendingConsent] = useState([])
  const [requests, setRequests] = useState([])
  const [req, setReq] = useState(null) // { kind, student }

  const loadExtras = useCallback(async () => {
    const [p, r] = await Promise.all([
      pendingLinks().catch(() => []),
      loadDataRequests().catch(() => []),
    ])
    setPending(p || [])
    setRequests(r || [])
  }, [])

  useEffect(() => {
    loadExtras()
  }, [loadExtras])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const claim = async (e) => {
    e.preventDefault()
    if (!allRequired(purposes)) {
      setError(readableAuthError('CONSENT_REQUIRED'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await linkChild({
        code: form.code,
        firstName: form.firstName,
        relationship: form.relationship,
        notice: NOTICE_VERSION,
        purposes,
      })
      setForm({ code: '', firstName: '', relationship: 'Parent' })
      setPurposes([])
      setAdding(false)
      await refresh()
      setToast({ message: 'Linked. You can withdraw at any time from this page.' })
    } catch (err) {
      setError(readableAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const confirmPending = async (sid) => {
    if (!allRequired(pendingConsent)) {
      setToast({ message: 'Tick each item to confirm.', tone: 'warn' })
      return
    }
    try {
      await confirmLink(sid, NOTICE_VERSION, pendingConsent)
      setPendingConsent([])
      await Promise.all([refresh(), loadExtras()])
    } catch (e) {
      setToast({ message: readableAuthError(e), tone: 'alert' })
    }
  }

  const withdraw = async (s) => {
    if (
      !window.confirm(
        `Withdraw consent for ${s.name.split(' ')[0]}? Your access to their page stops now. The school keeps the record it needs for the progress card unless you also ask for erasure.`
      )
    )
      return
    try {
      await withdrawConsent(s.id)
      await refresh()
      setToast({ message: 'Consent withdrawn. Your access has ended.' })
    } catch (e) {
      setToast({ message: readableAuthError(e), tone: 'alert' })
    }
  }

  const firstName = (profile?.full_name || '').split(' ')[0]
  const showForm = adding || (students.length === 0 && pending.length === 0)

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <Mark size={26} />
            <span className="font-display text-base font-semibold text-ink">
              Kidchemy
            </span>
          </Link>
          <Button size="sm" variant="quiet" icon={LogOut} onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <div className="mb-8">
          <p className="kc-eyebrow">{school?.name || 'Your school'}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {firstName ? `Hello, ${firstName}` : 'Your children'}
          </h1>
          <p className="mt-2 max-w-lg text-base text-ink-soft">
            One page per child, written from what their teachers have actually
            watched happen. Not a grade, and not a ranking.
          </p>
        </div>

        {/* Links made before consent was recorded */}
        {pending.map((p) => (
          <Card key={p.student_id} className="mb-4">
            <p className="kc-eyebrow">{p.school}</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">
              Confirm before you see {p.first_name}&rsquo;s page
            </p>
            <div className="mt-3">
              <ConsentBlock value={pendingConsent} onChange={setPendingConsent} />
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="primary" onClick={() => confirmPending(p.student_id)}>
                I agree, show me
              </Button>
            </div>
          </Card>
        ))}

        {students.length === 0 && !loading && pending.length === 0 && !showForm ? (
          <EmptyState
            icon={Sparkles}
            title="No child linked yet"
            body="Enter the code printed on the sticker on your child's report card, and their first name."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
                Link my child
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {students.map((s) => {
              const shared = (s.observations || []).filter(
                (o) => (o.visibility || 'shared') === 'shared'
              )
              const depth = profileDepth(shared)
              const top = topDimensions(shared, 3)
              return (
                <li key={s.id} className="rounded-[14px] border border-line bg-card shadow-[var(--shadow-card)]">
                  <Link
                    to={`/profile/${s.id}`}
                    className="group block rounded-t-[14px] p-5 transition-colors hover:bg-paper/60"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar name={s.name} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-xl font-semibold text-ink group-hover:text-accent">
                          {s.name}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {classLabel(s)} - {s.school}
                        </p>
                      </div>
                      <ArrowRight
                        size={18}
                        className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                      />
                    </div>

                    {top.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {top.map((d) => (
                          <Badge key={d.id} tone="moss">
                            {d.label}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-3">
                      <Meter
                        pct={depth.score}
                        tone={depth.score >= 60 ? 'good' : depth.score >= 25 ? 'warn' : 'faint'}
                      />
                      <p className="mt-1.5 text-xs text-ink-faint">
                        {evidenceSummary(shared)}
                      </p>
                    </div>
                  </Link>

                  {/* Your data and rights, per child */}
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-line-soft px-4 py-2.5">
                    <span className="mr-1 flex items-center gap-1 text-2xs font-bold uppercase tracking-[0.12em] text-ink-faint">
                      <ShieldCheck size={12} /> Your rights
                    </span>
                    <Button size="sm" variant="quiet" icon={Download} onClick={() => exportChild(s)}>
                      Download
                    </Button>
                    <Button size="sm" variant="quiet" icon={Pencil} onClick={() => setReq({ kind: 'correction', student: s })}>
                      Correct
                    </Button>
                    <Button size="sm" variant="quiet" icon={Trash2} onClick={() => setReq({ kind: 'erasure', student: s })}>
                      Erase
                    </Button>
                    <Button size="sm" variant="quiet" icon={UserMinus} onClick={() => withdraw(s)}>
                      Withdraw
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Link a child */}
        <div className="mt-8">
          {showForm ? (
            <Card>
              <form onSubmit={claim} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
                  <Field label="Code from the report card sticker" hint="Not case sensitive.">
                    <Input
                      value={form.code}
                      onChange={set('code')}
                      placeholder="ABCD-1234"
                      autoFocus
                      autoComplete="off"
                      className="kc-tnum tracking-wider"
                    />
                  </Field>
                  <Field label="Your child's first name" hint="As the school writes it.">
                    <Input value={form.firstName} onChange={set('firstName')} autoComplete="off" />
                  </Field>
                </div>
                <Field label="You are their">
                  <Select value={form.relationship} onChange={set('relationship')}>
                    {['Parent', 'Mother', 'Father', 'Guardian', 'Grandparent'].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </Select>
                </Field>
                <ConsentBlock value={purposes} onChange={setPurposes} />
                {error && (
                  <p className="rounded-[10px] border border-alert/25 bg-alert-tint px-3 py-2 text-sm text-alert">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  {(students.length > 0 || pending.length > 0) && (
                    <Button type="button" onClick={() => setAdding(false)}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    loading={busy}
                    disabled={!form.code.trim() || !form.firstName.trim() || !allRequired(purposes)}
                  >
                    I agree, link my child
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Button icon={Plus} onClick={() => setAdding(true)}>
              Link another child
            </Button>
          )}
        </div>

        {/* Requests the family has made */}
        {requests.length > 0 && (
          <Card className="mt-8">
            <p className="kc-eyebrow">Your requests</p>
            <ul className="mt-2 divide-y divide-line-soft">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-ink-soft">
                    {REQUEST_KINDS[r.kind]?.title || r.kind}
                    <span className="ml-2 kc-tnum text-2xs text-ink-faint">
                      {String(r.created_at).slice(0, 10)}
                    </span>
                    {r.response && (
                      <span className="mt-0.5 block text-xs text-ink-faint">{r.response}</span>
                    )}
                  </span>
                  <Badge tone={r.status === 'done' ? 'moss' : r.status === 'rejected' ? 'alert' : 'neutral'}>
                    {r.status.replace('_', ' ')}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Callout tone="neutral" className="mt-8">
          <p className="text-xs">
            You only see observations a teacher chose to share with you. Staff
            keep some notes for the school alone, which is what lets them record
            honest things about a hard week without it becoming a report.
          </p>
          <p className={cx('mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs')}>
            <Link to="/privacy" className="font-semibold text-accent-ink underline underline-offset-2">
              Privacy and safety
            </Link>
            <button
              type="button"
              onClick={() => setReq({ kind: 'grievance', student: students[0] })}
              className="inline-flex items-center gap-1 font-semibold text-accent-ink underline underline-offset-2"
            >
              <FileQuestion size={12} /> Raise a concern
            </button>
            <button
              type="button"
              onClick={() => setReq({ kind: 'nominee', student: students[0] })}
              className="font-semibold text-accent-ink underline underline-offset-2"
            >
              Name a nominee
            </button>
          </p>
        </Callout>
      </main>

      <RequestModal
        kind={req?.kind}
        student={req?.student}
        onClose={() => setReq(null)}
        onDone={(m) => {
          setToast({ message: m })
          loadExtras()
        }}
      />
      <Toast toast={toast} />
    </div>
  )
}
