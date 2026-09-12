import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ClipboardList,
  Eye,
  Feather,
  Layers,
  QrCode,
  Scale,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Badge, Button, Card } from '../components/ui.jsx'
import { Mark } from '../components/AppShell.jsx'
import { FRAMEWORKS } from '../data/pedagogy.js'

const STEPS = [
  {
    icon: Zap,
    title: 'The teacher sweeps the class',
    body: 'Not "tell me about Aarav". One prompt at a time, tap every child it was true of. Forty children in about ninety seconds.',
  },
  {
    icon: Feather,
    title: 'The exceptions get a story',
    body: 'For the child who did something worth a sentence, a short structured note: what I saw, what I think it means, what to offer next.',
  },
  {
    icon: Layers,
    title: 'The picture builds itself',
    body: 'Strengths, dispositions, the conditions in which they do their best work, and the next step just past what they manage alone.',
  },
  {
    icon: QrCode,
    title: 'The parent scans the report card',
    body: 'A QR sticker on the physical card they already receive. No app, no new system, nothing for the school to replace.',
  },
]

const PROOFS = [
  {
    icon: Scale,
    title: 'It measures its own bias',
    body: 'A record built on visible behaviour under-describes quiet children. Kidchemy shows the teacher exactly how unevenly attention is landing, and who has not been seen in a month.',
  },
  {
    icon: Eye,
    title: 'Teachers can withhold',
    body: 'Every observation is shared or school-only. A teacher who knows a parent reads every concern stops recording concerns, and the data quietly dies. So concerns default to staff only.',
  },
  {
    icon: ClipboardList,
    title: 'It produces the card schools already owe',
    body: 'NEP 2020 asks Indian schools for a Holistic Progress Card across five domains, with self, peer and parent input. Kidchemy assembles it from taps the teacher already made.',
  },
  {
    icon: ShieldCheck,
    title: 'Nothing is invented',
    body: 'Every sentence traces to a counted observation. No model writes a claim about a child. When a teacher asks why it says something, there is an answer.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-dvh bg-paper">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <Mark size={28} />
            <span className="font-display text-lg font-semibold text-ink">
              Kidchemy
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button as={Link} to="/login" size="sm" variant="quiet">
              Sign in
            </Button>
            <Button as={Link} to="/login?mode=signup" size="sm" variant="primary">
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-16 text-center sm:pt-24">
        <Badge tone="accent" icon={Sparkles} className="mb-5">
          Aligned with the NEP 2020 Holistic Progress Card
        </Badge>
        <h1 className="font-display text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl">
          Every child is more than the number on their report card.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          Teachers notice extraordinary things every single day and have nowhere
          to put them. Kidchemy turns those noticings into a real picture of a
          child, in the time a teacher actually has.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/login?mode=signup" variant="primary" size="lg" iconRight={ArrowRight}>
            Start with one class
          </Button>
          <Button as={Link} to="/login" size="lg">
            I already have an account
          </Button>
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          Teachers need a school code. Parents need the code on their child's
          report card sticker.
        </p>
      </section>

      {/* ── The problem, stated plainly ─────────────────────── */}
      <section className="border-y border-line bg-card py-16">
        <div className="mx-auto max-w-3xl px-5">
          <p className="kc-eyebrow mb-3">The problem</p>
          <p className="font-display text-2xl leading-snug text-ink sm:text-3xl">
            A child who scores 58% in Science gets called weak in Science. That
            same child might ask the best questions in the room, understand the
            concept better than anyone, and simply lose half of it on paper.
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            The report card tells you where a child stands. It says nothing
            about who they are, how they think, or what to do next. The student
            internalises a number as an identity, the parent chases marks
            because marks are the only signal they get, and the teacher watches
            all of it knowing better and having no way to say so.
          </p>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <p className="kc-eyebrow mb-2">How it works</p>
        <h2 className="mb-8 font-display text-3xl font-semibold text-ink">
          Four steps, and none of them add an hour to a teacher's week
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <Card key={s.title}>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-tint text-accent-ink">
                  <s.icon size={17} strokeWidth={2.1} />
                </span>
                <span className="kc-tnum text-2xs font-bold text-ink-faint">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Why it does not become a horoscope ──────────────── */}
      <section className="border-y border-line bg-card py-16">
        <div className="mx-auto max-w-5xl px-5">
          <p className="kc-eyebrow mb-2">Why you can believe it</p>
          <h2 className="mb-3 font-display text-3xl font-semibold text-ink">
            Most products like this become a horoscope
          </h2>
          <p className="mb-8 max-w-2xl text-lg text-ink-soft">
            Warm generic prose and relentless positivity produce a page that
            could describe any child. Four decisions keep this one honest.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PROOFS.map((p) => (
              <div key={p.title} className="rounded-[14px] border border-line p-5">
                <p.icon size={18} className="mb-3 text-moss" />
                <h3 className="font-display text-lg font-semibold text-ink">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it is built on ─────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <p className="kc-eyebrow mb-2">What it is built on</p>
        <h2 className="mb-3 font-display text-3xl font-semibold text-ink">
          Borrowed from people who worked this out already
        </h2>
        <p className="mb-8 max-w-2xl text-lg text-ink-soft">
          None of this is new. Observation-led assessment has a century of
          practice behind it. What has been missing is a way to do it in a class
          of forty without a second teacher in the room.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(FRAMEWORKS).map((f) => (
            <div key={f.id} className="rounded-[12px] border border-line bg-card p-4">
              <p className="text-sm font-bold text-ink">{f.label}</p>
              <p className="mt-1 text-sm text-ink-soft">{f.oneLine}</p>
              <p className="mt-2 text-2xs text-ink-faint">Used for: {f.usedFor}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-sm text-ink-faint">
          What we refused matters too. Learning styles are not supported by the
          evidence, so this product never tells you your child is a visual
          learner. And it does not name careers for children below Class 9,
          because a career suggested at eleven becomes a label that sticks
          harder than a percentage.
        </p>
      </section>

      {/* ── Close ───────────────────────────────────────────── */}
      <section className="border-t border-line bg-card py-16">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink">
            Start with one class, one teacher, four weeks.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-ink-soft">
            Not a rollout. One teacher, one section, and the question that
            actually matters: is she still logging in week four without anyone
            asking her to?
          </p>
          <Button
            as={Link}
            to="/login?mode=signup"
            variant="primary"
            size="lg"
            className="mt-7"
            iconRight={ArrowRight}
          >
            Get started
          </Button>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-2">
            <Mark size={22} />
            <span className="text-sm font-semibold text-ink">Kidchemy</span>
          </div>
          <p className="text-xs text-ink-faint">
            Children's data stays with the school. No advertising, no third
            party analytics on parent pages, ever.
          </p>
        </div>
      </footer>
    </div>
  )
}
