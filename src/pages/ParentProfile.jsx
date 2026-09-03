import { Link, useParams } from 'react-router-dom'
import {
  Compass,
  Heart,
  MessageCircleQuestion,
  Sparkles,
  Sprout,
  TrendingUp,
} from 'lucide-react'
import { useStore } from '../data/store.jsx'
import {
  buildNarrative,
  conversationStarters,
  dimensionScores,
  evidenceSummary,
  growthHighlights,
  growthSeries,
  learningStyle,
  milestonesOf,
  parentActions,
  pathwaysFor,
} from '../data/derive.js'
import StrengthMap from '../components/StrengthMap.jsx'
import { Sprig, Seed } from '../components/Ornament.jsx'

function Section({ title, icon: Icon, children, delay = 0 }) {
  return (
    <section
      className="kc-rise mt-12 sm:mt-16"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="flex items-center gap-2.5 font-display text-2xl text-ink sm:text-[28px]">
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-moss-tint text-moss-dark">
            <Icon size={17} />
          </span>
        )}
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function ParentProfile() {
  const { studentId } = useParams()
  const { getStudent, school } = useStore()
  const student = getStudent(studentId)

  if (!student) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-ink-soft">We couldn't find that profile.</p>
        <Link to="/" className="mt-4 inline-block text-moss underline">
          Go home
        </Link>
      </div>
    )
  }

  const first = student.name.split(' ')[0]

  // Parents only see observations marked 'shared' (or with no visibility set —
  // seed data pre-dates the flag; treat missing as 'shared').
  const allObs = student.observations
  const obs = allObs.filter((o) => !o.visibility || o.visibility === 'shared')
  const schoolOnlyCount = allObs.length - obs.length

  const dims = dimensionScores(obs)
  const narrative = buildNarrative(student, obs)
  const style = learningStyle(student, obs)
  const series = growthSeries(obs)
  const highlights = growthHighlights(obs)
  const paths = pathwaysFor(obs)
  const actions = parentActions(obs)
  const questions = conversationStarters(obs)
  const milestones = milestonesOf(obs).slice(0, 3)

  // Thin-profile state: fewer than 2 shared observations.
  const isThin = obs.length < 2

  return (
    <article className="mx-auto w-full max-w-3xl px-5 pb-28 pt-6 sm:px-8">
      {/* Hero */}
      <header className="kc-rise relative overflow-hidden rounded-3xl border border-line bg-white/70 px-6 py-10 sm:px-10 sm:py-14">
        <Sprig className="pointer-events-none absolute -right-4 -top-6 h-56 w-40 text-moss" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
          {school.name} · {student.className}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
          Here's who
          <br />
          {student.name} is
          <br />
          this term.
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
          Not a score. Not a rank. What {first}'s teachers have actually seen,
          gathered up and written down.
        </p>
        <p className="mt-6 text-xs text-ink-faint">
          {evidenceSummary(obs)}
          {schoolOnlyCount > 0 && (
            <span className="ml-2 text-ink-faint/60">
              (+{schoolOnlyCount} school-only)
            </span>
          )}
        </p>
      </header>

      {/* Thin-profile notice — honest, not padding */}
      {isThin && (
        <div className="mt-8 rounded-2xl border border-line bg-paper-2 px-6 py-5">
          <p className="text-[15px] leading-relaxed text-ink-soft">
            We're still getting to know {first}. This profile will fill out as
            teachers observe more — check back after the next term.
          </p>
        </div>
      )}

      {/* Who they are */}
      {!isThin && (
        <Section title={`Who ${first} is`} icon={Sparkles} delay={60}>
          <p className="font-display text-xl leading-[1.55] text-ink sm:text-[26px] sm:leading-[1.5]">
            {narrative}
          </p>
        </Section>
      )}

      {/* Strengths */}
      <Section title={`What ${first} is good at`} icon={Heart} delay={120}>
        {obs.length > 0 ? (
          <>
            <p className="mb-6 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              These are not marks. Each one shows how often and how strongly a
              teacher has seen this in {first}. An empty axis means we haven't
              seen it yet — not that it isn't there.
            </p>
            <StrengthMap dims={dims} />
          </>
        ) : (
          <p className="text-[15px] text-ink-soft">
            No observations shared yet — {first}'s teachers are still building
            this picture.
          </p>
        )}
      </Section>

      {/* Learning style */}
      {style && !isThin && (
        <Section title={`How ${first} learns best`} icon={Sprout} delay={160}>
          <div className="rounded-3xl border border-line bg-clay-tint/50 p-6 sm:p-8">
            <p className="text-lg leading-relaxed text-ink">{style}</p>
          </div>
        </Section>
      )}

      {/* Growth */}
      {series.length > 1 && (
        <Section title={`How ${first} is growing`} icon={TrendingUp} delay={200}>
          <ol className="relative ml-3 border-l border-line pl-6">
            {series.map((s, i) => (
              <li key={s.period} className="pb-8 last:pb-0">
                <span
                  className={`absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-paper ${
                    i === series.length - 1 ? 'bg-clay' : 'bg-moss'
                  }`}
                />
                <p className="font-semibold text-ink">{s.period}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {i === 0
                    ? `Where ${first} started: ${s.standing.join(' · ')}`
                    : s.moved.length
                      ? `Grew this term: ${s.moved.join(' · ')}`
                      : 'Steady — the same picture, held.'}
                </p>
              </li>
            ))}
          </ol>

          {highlights.length > 0 && (
            <div className="mt-4 rounded-2xl bg-moss-tint p-5">
              <p className="text-[15px] leading-relaxed text-moss-dark">
                Since Term 1,{' '}
                {highlights
                  .map((h) => `${first}'s ${h.label.toLowerCase()} has grown clearly`)
                  .join(', and ')}
                .
              </p>
            </div>
          )}

          {milestones.length > 0 && (
            <ul className="mt-4 grid gap-2">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="rounded-2xl border border-line bg-white/70 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-clay">
                    {m.milestoneLabel} · {m.period}
                  </p>
                  {m.note && (
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
                      "{m.note}"
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Pathways */}
      {paths.length > 0 && !isThin && (
        <Section title={`Where ${first} could go`} icon={Compass} delay={240}>
          <p className="mb-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            Possibilities, not predictions. Children change. This is only what
            the current pattern tends to suit.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {paths.map((p) => (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-3xl border border-line bg-white/70 p-6"
              >
                <Seed className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 text-clay" />
                <h3 className="font-display text-xl text-ink">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                  {p.body}
                </p>
                <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-faint">
                  {p.next}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Parent actions */}
      {actions.length > 0 && (
        <Section title="What you can do this month" icon={Sprout} delay={280}>
          <ul className="grid gap-3">
            {actions.map((a, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-2xl border border-line bg-white/70 p-5"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-tint font-display text-sm text-clay">
                  {i + 1}
                </span>
                <p className="text-[15px] leading-relaxed text-ink">{a}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <Section
          title={`Questions to ask ${first}`}
          icon={MessageCircleQuestion}
          delay={320}
        >
          <div className="rounded-3xl border border-line bg-paper-2 p-6 sm:p-8">
            <ul className="grid gap-4">
              {questions.map((q, i) => (
                <li key={i} className="font-display text-xl leading-snug text-ink">
                  "{q}"
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-ink-faint">
              Ask one. Then stop talking. The second half of the answer is the
              part worth hearing.
            </p>
          </div>
        </Section>
      )}

      <footer className="mt-16 border-t border-line pt-6 text-sm text-ink-faint">
        <p>
          Written by {first}'s teachers at {school.name}. Kidchemy does not
          rank children and does not share this profile with anyone outside the
          school and the family.
        </p>
        <Link
          to="/teacher"
          className="mt-3 inline-block text-moss underline underline-offset-4"
        >
          Teacher view (demo)
        </Link>
      </footer>
    </article>
  )
}
