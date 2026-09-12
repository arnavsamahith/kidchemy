import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { GraduationCap, Heart, Info, ShieldCheck } from 'lucide-react'
import { useAuth, readableAuthError } from '../data/auth.jsx'
import { Mark } from '../components/AppShell.jsx'
import {
  Button,
  Callout,
  Card,
  Field,
  Input,
  cx,
} from '../components/ui.jsx'
import { TEACHER_CODE_HINT } from '../data/seed.js'

const ROLES = [
  {
    id: 'teacher',
    label: 'I teach',
    icon: GraduationCap,
    blurb: 'You log observations for your class.',
    codeLabel: 'School code',
    codeHint: `Your coordinator has this. The pilot class code is ${TEACHER_CODE_HINT}.`,
    codePlaceholder: 'VIDYA-7C',
  },
  {
    id: 'parent',
    label: 'I am a parent',
    icon: Heart,
    blurb: "You read your child's profile.",
    codeLabel: "Code from your child's report card",
    codeHint: 'Printed on the Kidchemy sticker. You can also add it later.',
    codePlaceholder: 'ABCD-1234',
  },
]

function homeFor(role) {
  if (role === 'admin') return '/admin'
  if (role === 'teacher') return '/teacher'
  return '/parent'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { signIn, signUp, session, profile, ready } = useAuth()

  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [role, setRole] = useState('teacher')
  const [form, setForm] = useState({ email: '', password: '', fullName: '', code: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const noProfile = params.get('state') === 'no-profile'

  // Already signed in: go where they belong.
  useEffect(() => {
    if (!ready || !session || !profile) return
    const from = location.state?.from
    navigate(from || homeFor(profile.role), { replace: true })
  }, [ready, session, profile, navigate, location.state])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const roleMeta = ROLES.find((r) => r.id === role)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signin') {
        await signIn(form.email, form.password)
      } else {
        const res = await signUp({
          email: form.email,
          password: form.password,
          role,
          fullName: form.fullName,
          code: form.code,
        })
        if (!res?.session) {
          setNotice(
            'Account created. Check your inbox to confirm the email address, then sign in.'
          )
          setMode('signin')
        }
      }
    } catch (err) {
      setError(readableAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <Mark size={28} />
            <span className="font-display text-lg font-semibold text-ink">
              Kidchemy
            </span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-ink-faint hover:text-ink">
            Back to the site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl font-semibold text-ink">
              {mode === 'signin' ? 'Sign in' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              {mode === 'signin'
                ? 'Teachers land on their class. Parents land on their child.'
                : 'Two kinds of account, and they see very different things.'}
            </p>
          </div>

          {noProfile && (
            <Callout tone="warn" icon={Info} className="mb-4">
              You are signed in, but your account has no role attached yet. Sign
              out and sign up again with a school or child code, or ask your
              coordinator to set the role for you.
            </Callout>
          )}
          {notice && (
            <Callout tone="moss" className="mb-4">
              {notice}
            </Callout>
          )}

          <Card>
            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <p className="kc-eyebrow mb-2">Which are you?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={cx(
                          'rounded-[12px] border p-3 text-left transition-colors',
                          role === r.id
                            ? 'border-accent bg-accent-tint'
                            : 'border-line hover:border-ink-faint/45'
                        )}
                      >
                        <r.icon
                          size={17}
                          className={cx(
                            'mb-1.5',
                            role === r.id ? 'text-accent-ink' : 'text-ink-faint'
                          )}
                        />
                        <span className="block text-sm font-bold text-ink">
                          {r.label}
                        </span>
                        <span className="mt-0.5 block text-2xs leading-snug text-ink-faint">
                          {r.blurb}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <Field label="Your name" required>
                  <Input
                    value={form.fullName}
                    onChange={set('fullName')}
                    autoComplete="name"
                    placeholder="Rekha Iyer"
                  />
                </Field>
              )}

              <Field label="Email" required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  required
                  placeholder="you@school.edu.in"
                />
              </Field>

              <Field
                label="Password"
                hint={mode === 'signup' ? 'At least six characters.' : undefined}
                required
              >
                <Input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                />
              </Field>

              {mode === 'signup' && (
                <Field
                  label={roleMeta.codeLabel}
                  hint={roleMeta.codeHint}
                  required={role === 'teacher'}
                >
                  <Input
                    value={form.code}
                    onChange={set('code')}
                    placeholder={roleMeta.codePlaceholder}
                    className="kc-tnum tracking-wider"
                    required={role === 'teacher'}
                  />
                </Field>
              )}

              {error && (
                <p className="rounded-[10px] border border-alert/25 bg-alert-tint px-3 py-2 text-sm text-alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={busy}
                className="w-full justify-center"
              >
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          </Card>

          <p className="mt-4 text-center text-sm text-ink-soft">
            {mode === 'signin' ? "No account yet? " : 'Already have one? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
              className="font-semibold text-accent-ink underline underline-offset-4"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            A teacher account needs a school code, so the class roster is never
            open to whoever finds the link. A parent only ever sees the child
            whose code they hold, and only the observations a teacher chose to
            share.
          </p>
        </div>
      </main>
    </div>
  )
}
