import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CircleAlert,
  ArrowRight,
  GraduationCap,
  Loader2,
  Mail,
  UserRound,
} from 'lucide-react'
import { useAuth, readableAuthError } from '../data/auth.jsx'
import { Sprig, Arc } from '../components/Ornament.jsx'

const ROLES = [
  {
    id: 'teacher',
    label: 'Teacher',
    icon: GraduationCap,
    blurb: 'Log observations, see the class, write remarks.',
    codeLabel: 'School code',
    codeHint: 'The code your coordinator gave you. Pilot class: VIDYA-6A',
    codeRequired: true,
  },
  {
    id: 'parent',
    label: 'Parent',
    icon: UserRound,
    blurb: "Read your child's profile as their teachers built it.",
    codeLabel: "Your child's code",
    codeHint: 'Printed on the report-card sticker, e.g. ARYAN-4821',
    codeRequired: true,
  },
]

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { signIn, signUp, session, profile, ready } = useAuth()

  const [role, setRole] = useState(params.get('role') === 'parent' ? 'parent' : 'teacher')
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [code, setCode] = useState(params.get('code') || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(
    params.get('state') === 'no-profile'
      ? 'Your account exists but has no role attached yet. Sign out and create the account again with a school or child code.'
      : null
  )

  const active = ROLES.find((r) => r.id === role)

  // Already signed in? Go where this person belongs.
  useEffect(() => {
    if (!ready || !session || !profile) return
    const from = location.state?.from
    if (from && from !== '/login') navigate(from, { replace: true })
    else navigate(profile.role === 'teacher' ? '/teacher' : '/parent', { replace: true })
  }, [ready, session, profile, navigate, location.state])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        const res = await signUp({ email, password, role, fullName, code })
        if (!res.session) {
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
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Left: what this is ──────────────────────────────── */}
      <div className="relative hidden overflow-hidden border-r border-line bg-paper-2/70 px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <Arc className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 text-clay opacity-60" />
        <Sprig className="pointer-events-none absolute -bottom-10 right-4 h-80 w-52 text-moss opacity-70" />

        <Link to="/" className="relative text-xs font-semibold uppercase tracking-[0.22em] text-clay">
          Kidchemy
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-[44px] leading-[1.05] text-ink">
            A child is not
            <br />a percentage.
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">
            Teachers see extraordinary things every day and have nowhere to put
            them. Kidchemy gives them somewhere — a few taps per child — and
            turns it into a profile a parent actually wants to read.
          </p>
        </div>

        <div className="relative grid gap-2 text-sm text-ink-faint">
          <p>Teachers log. Parents read. Nobody is ranked.</p>
          <p>It sits on top of the report card. It replaces nothing.</p>
        </div>
      </div>

      {/* ── Right: the form ─────────────────────────────────── */}
      <div className="flex min-h-dvh flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-[420px]">
          <Link
            to="/"
            className="text-xs font-semibold uppercase tracking-[0.22em] text-clay lg:hidden"
          >
            Kidchemy
          </Link>

          <h1 className="mt-4 font-display text-3xl text-ink lg:mt-0">
            {mode === 'signin' ? 'Sign in' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {mode === 'signin'
              ? 'Two doors, one school. Pick yours.'
              : 'Your role decides what you can see — and what you cannot.'}
          </p>

          {/* Role switch */}
          <div
            role="tablist"
            aria-label="Account type"
            className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-card p-1.5"
          >
            {ROLES.map((r) => {
              const Icon = r.icon
              const on = role === r.id
              return (
                <button
                  key={r.id}
                  role="tab"
                  aria-selected={on}
                  type="button"
                  onClick={() => {
                    setRole(r.id)
                    setError(null)
                  }}
                  className={[
                    'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    on
                      ? 'bg-moss text-white'
                      : 'text-ink-soft hover:bg-paper-2 hover:text-ink',
                  ].join(' ')}
                >
                  <Icon size={16} /> {r.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-ink-faint">{active.blurb}</p>

          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === 'signup' && (
              <Field label="Your name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder={role === 'teacher' ? 'Ms. Rekha Iyer' : 'Sunita Mehta'}
                  className={inputCls}
                />
              </Field>
            )}

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@school.edu.in"
                className={inputCls}
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="At least 6 characters"
                className={inputCls}
              />
            </Field>

            {mode === 'signup' && (
              <Field label={active.codeLabel} hint={active.codeHint}>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required={active.codeRequired}
                  placeholder={role === 'teacher' ? 'VIDYA-6A' : 'ARYAN-4821'}
                  className={`${inputCls} kc-tnum tracking-wider`}
                />
              </Field>
            )}

            {error && (
              <p className="flex items-start gap-2 rounded-xl border border-alert/30 bg-alert/10 px-3.5 py-3 text-sm text-alert">
                <CircleAlert size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            {notice && (
              <p className="flex items-start gap-2 rounded-xl border border-moss/30 bg-moss-tint px-3.5 py-3 text-sm text-moss-dark">
                <Mail size={16} className="mt-0.5 shrink-0" />
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-moss px-6 py-3 font-semibold text-white transition hover:bg-moss-dark disabled:cursor-not-allowed disabled:bg-ink-faint/40"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {mode === 'signin'
                ? `Sign in as ${active.label.toLowerCase()}`
                : `Create ${active.label.toLowerCase()} account`}
            </button>
          </form>

          <p className="mt-5 text-sm text-ink-soft">
            {mode === 'signin' ? "Don't have an account yet? " : 'Already have one? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
                setNotice(null)
              }}
              className="font-semibold text-moss underline underline-offset-4"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <div className="mt-8 rounded-2xl border border-line bg-card px-4 py-3.5 text-xs leading-relaxed text-ink-faint">
            <p className="font-semibold text-ink-soft">Pilot codes</p>
            <p className="mt-1">
              Teacher: <span className="kc-tnum text-ink">VIDYA-6A</span> · Parent
              of Aryan: <span className="kc-tnum text-ink">ARYAN-4821</span> ·
              Parent of Priya: <span className="kc-tnum text-ink">PRIYA-7136</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none transition placeholder:text-ink-faint focus:border-moss'

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </span>
      <span className="mt-2 block">{children}</span>
      {hint && <span className="mt-1.5 block text-xs text-ink-faint">{hint}</span>}
    </label>
  )
}
