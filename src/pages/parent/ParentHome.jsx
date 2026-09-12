import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LogOut, Plus, Sparkles } from 'lucide-react'
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
} from '../../components/ui.jsx'
import { classLabel } from '../../data/roster.js'

export default function ParentHome() {
  const { profile, signOut, linkChild } = useAuth()
  const { students, refresh, loading, school } = useStore()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)

  const claim = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await linkChild(code)
      setCode('')
      setAdding(false)
      await refresh()
    } catch (err) {
      setError(readableAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const firstName = (profile?.full_name || '').split(' ')[0]

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

        {students.length === 0 && !loading ? (
          <EmptyState
            icon={Sparkles}
            title="No child linked yet"
            body="Enter the code printed on the sticker on your child's report card. It looks something like ABCD-1234."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
                Enter a code
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
                <li key={s.id}>
                  <Link
                    to={`/profile/${s.id}`}
                    className="group block rounded-[14px] border border-line bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:border-accent/40 hover:shadow-[var(--shadow-raised)]"
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
                </li>
              )
            })}
          </ul>
        )}

        {/* Add another child */}
        <div className="mt-8">
          {adding || students.length === 0 ? (
            <Card>
              <form onSubmit={claim} className="space-y-3">
                <Field
                  label="Code from the report card sticker"
                  error={error}
                  hint="Not case sensitive. If it does not work, the school can reprint it."
                >
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ABCD-1234"
                    autoFocus
                    className="kc-tnum tracking-wider"
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  {students.length > 0 && (
                    <Button type="button" onClick={() => setAdding(false)}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    loading={busy}
                    disabled={!code.trim()}
                  >
                    Add child
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Button icon={Plus} onClick={() => setAdding(true)}>
              Add another child
            </Button>
          )}
        </div>

        <Callout tone="neutral" className="mt-8">
          <p className="text-xs">
            You only see observations a teacher chose to share with you. Staff
            keep some notes for the school alone, which is what lets them record
            honest things about a hard week without it becoming a report.
          </p>
        </Callout>
      </main>
    </div>
  )
}
