import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { GraduationCap, Heart, Info, KeyRound, ShieldCheck } from 'lucide-react'
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
import { mfaStatus, mfaVerify } from '../data/supabase.js'

const ROLES = [
  {
    id: 'teacher',
    label: 'I teach',
    icon: GraduationCap,
    blurb: 'You log observations for your class.',
    codeLabel: 'School code',
    codeHint: 'Your coordinator gives you this in person. It expires, and it only opens your own school.',
    codePlaceholder: 'SCHOOL-CODE',
  },
  {
    id: 'parent',
    label: 'I am a parent',
    icon: Heart,
    blurb: "You read your child's profile.",
    codeLabel: null,
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
  const { signIn, signUp, signOut, session, profile, ready } = useAuth()
  const [mfa, setMfa] = useState(null) // { factorId } while a second factor is owed
  const [otp, setOtp] = useState('')

  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [role, setRole] = useState('teacher')
  const [form, setForm] = useState({ email: '', password: '', fullName: '', code: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const noProfile = params.get('state') === 'no-profile'
  const wasIdle = params.get('state') === 'idle'

  // Already signed in: go where they belong, once any second factor is in.
  useEffect(() => {
    if (!ready || !session || !profile) return
    let alive = true
    ;(async () => {
      try {
        const st = await mfaStatus()
        if (!alive) return
        if (st.next === 'aal2' && st.current !== 'aal2' && st.totp[0]) {
          setMfa({ factorId: st.totp[0].id })
          return
        }
      } catch {
        /* no MFA configured on the project: carry on */
      }
      if (!alive) return
      const from = location.state?.from
      // Only follow in-app paths, never an absolute URL smuggled into state.
      const safeFrom = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : null
      navigate(safeFrom || homeFor(profile.role), { replace: true })
    })()
    return () => {
      alive = false
    }
  }, [ready, session, profile, navigate, location.state])

  const verifyOtp = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await mfaVerify(mfa.factorId, otp)
      setMfa(null)
      setOtp('')
      navigate(homeFor(profile?.role), { replace: true })
    } catch (err) {
      setError(readableAuthError(err))
    } finally {
      setBusy(false)
    }
  }

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
          {wasIdle && (
            <Callout tone="neutral" icon={ShieldCheck} className="mb-4">
              You were signed out after a while with no activity, so nobody
              else at this device can open your class.
            </Callout>
          )}
          {notice && (
            <Callout tone="moss" className="mb-4">
              {notice}
            </Callout>
          )}

          {mfa ? (
            <Card>
              <form onSubmit={verifyOtp} className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  <KeyRound size={16} className="text-accent" /> Second step
                </div>
                <Field
                  label="Six-digit code from your authenticator app"
                  hint="This account can change any school's settings, so it needs both your password and your phone."
                  error={error}
                >
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    autoFocus
                    className="kc-tnum tracking-[0.3em]"
                  />
                </Field>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => { setMfa(null); signOut() }}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={busy} className="flex-1 justify-center" disabled={otp.trim().length < 6}>
                    Verify
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
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
                hint={
                  mode === 'signup'
                    ? 'At least eight characters. A short sentence is easier to remember and harder to guess.'
                    : undefined
                }
                required
              >
                <Input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  minLength={mode === 'signup' ? 8 : 6}
                />
              </Field>

              {mode === 'signup' && role === 'parent' && (
                <p className="rounded-[10px] bg-paper-2 px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
                  After you sign in, you will link your child with the code on
                  their report card sticker and their first name, and you will
                  see exactly what you are agreeing to first.
                </p>
              )}

              {mode === 'signup' && role === 'teacher' && (
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
          )}

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
            share.{' '}
            <Link to="/privacy" className="font-semibold text-ink-soft underline underline-offset-2">
              How we protect children’s data
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
