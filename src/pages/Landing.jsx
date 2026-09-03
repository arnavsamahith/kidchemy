import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  GraduationCap,
  MessageSquareQuote,
  QrCode,
  ShieldCheck,
  UserRound,
  Zap,
} from 'lucide-react'
import { useAuth } from '../data/auth.jsx'
import { Sprig, Arc, Seed } from '../components/Ornament.jsx'

const HOW = [
  {
    icon: Zap,
    title: 'The teacher taps',
    body: 'A whole class in under two minutes. Tap a behaviour, tap the names it describes, done.',
  },
  {
    icon: MessageSquareQuote,
    title: 'And writes one line',
    body: 'Every tag has room for the teacher’s own words — the specific thing they saw, in the moment they saw it.',
  },
  {
    icon: QrCode,
    title: 'The parent scans',
    body: 'A sticker on the report card opens a profile written by the people who were actually in the room.',
  },
]

const PROMISES = [
  {
    icon: ShieldCheck,
    title: 'Nothing is generated',
    body: 'Every sentence traces back to a tag a teacher tapped or a line a teacher typed. No model writes about your child.',
  },
  {
    icon: Eye,
    title: 'The teacher decides what is shared',
    body: 'Concerns stay in school records by default. Parents see strengths and specifics, not a file about their child.',
  },
  {
    icon: Seed,
    title: 'Nobody is ranked',
    body: 'There is no class position, no percentile, no leaderboard. A thin profile stays honestly thin.',
  },
]

export default function Landing() {
  const { session, profile } = useAuth()
  const home = profile?.role === 'teacher' ? '/teacher' : '/parent'

  return (
    <div className="min-h-dvh bg-paper">
      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-moss text-[13px] font-bold text-white"
            >
              K
            </span>
            <span className="font-display text-[17px] text-ink">Kidchemy</span>
          </span>
          {session && profile ? (
            <Link
              to={home}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss-dark"
            >
              Go to my workspace <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <Arc className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] text-clay opacity-50" />
        <Sprig className="pointer-events-none absolute -bottom-16 left-[62%] hidden h-96 w-56 text-moss opacity-40 lg:block" />
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
            For Indian schools
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-[44px] leading-[1.05] text-ink sm:text-[68px]">
            A child is not a percentage.
          </h1>
          <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            Teachers see extraordinary things every day and have nowhere to put
            them. Kidchemy gives them somewhere — a few taps per child — and
            turns it into a profile a parent actually wants to read.
          </p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-faint">
            It sits on top of the report card. It replaces nothing.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/login?role=teacher"
              className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 font-semibold text-white transition hover:bg-moss-dark"
            >
              <GraduationCap size={17} /> I'm a teacher
            </Link>
            <Link
              to="/login?role=parent"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3 font-semibold text-ink-soft transition hover:border-ink-faint hover:text-ink"
            >
              <UserRound size={17} /> I'm a parent
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="font-display text-3xl text-ink">Three steps, one term</h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {HOW.map((h, i) => {
            const Icon = h.icon
            return (
              <li key={h.title} className="rounded-2xl border border-line bg-card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-moss-tint text-moss-dark">
                  <Icon size={19} />
                </span>
                <p className="kc-tnum mt-5 text-xs font-semibold text-ink-faint">
                  0{i + 1}
                </p>
                <h3 className="mt-1 font-display text-xl text-ink">{h.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                  {h.body}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Promises ───────────────────────────────────────── */}
      <section className="border-y border-line bg-paper-2/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="font-display text-3xl text-ink">What Kidchemy will not do</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            The restraint is the product. Anything that would turn a child into
            a number has been deliberately left out.
          </p>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {PROMISES.map((p) => {
              const Icon = p.icon
              return (
                <li key={p.title} className="rounded-2xl border border-line bg-card p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-tint text-clay-dark">
                    <Icon className="h-5 w-5" size={19} />
                  </span>
                  <h3 className="mt-5 font-display text-xl text-ink">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                    {p.body}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ── Two doors ──────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-line bg-card p-8">
            <GraduationCap size={22} className="text-moss" />
            <h3 className="mt-4 font-display text-2xl text-ink">Teachers</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              A workspace for the whole class: the sweep, per-child files with
              full history, custom remarks under every tag, and honest class
              insights that tell you what you haven't looked at yet.
            </p>
            <Link
              to="/login?role=teacher&mode=signup"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moss-dark"
            >
              Create a teacher account <ArrowRight size={15} />
            </Link>
            <p className="mt-3 text-xs text-ink-faint">
              Needs a school code from your coordinator.
            </p>
          </div>

          <div className="rounded-3xl border border-line bg-card p-8">
            <UserRound size={22} className="text-clay" />
            <h3 className="mt-4 font-display text-2xl text-ink">Parents</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              One profile per child, written by the people who teach them.
              Strengths with the evidence behind them, what to do this month,
              and questions worth asking at dinner.
            </p>
            <Link
              to="/login?role=parent&mode=signup"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-ink-faint hover:text-ink"
            >
              Use my child's code <ArrowRight size={15} />
            </Link>
            <p className="mt-3 text-xs text-ink-faint">
              The code is on the report-card sticker.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 text-sm text-ink-faint sm:px-8">
          Kidchemy · Pehchaan — a truer picture of every child. Profiles are
          shared only with the school and the family.
        </div>
      </footer>
    </div>
  )
}
