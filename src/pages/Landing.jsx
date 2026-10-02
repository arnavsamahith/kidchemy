import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  ClipboardList,
  Eye,
  EyeOff,
  Feather,
  Heart,
  Layers,
  MessageCircle,
  Printer,
  QrCode,
  Scale,
  ShieldCheck,
  Sprout,
  Timer,
  Users,
  Zap,
} from 'lucide-react'
import { Button, cx } from '../components/ui.jsx'
import { Mark } from '../components/AppShell.jsx'
import { FRAMEWORKS } from '../data/pedagogy.js'

/* ══════════════════════════════════════════════════════════════════
   EDIT ME. Everything personal on this page lives here.
   Put your photo at public/about/arnav.jpg (portrait, roughly 4:5).
   Until it exists, a branded placeholder shows instead.
   Leave a field empty to hide it.
   ══════════════════════════════════════════════════════════════════ */

const FOUNDER = {
  name: 'Arnav',
  role: 'Founder, Kidchemy',
  college: '', // e.g. 'B.Tech, Indian Institute of Technology Madras'
  photo: '/about/arnav.jpg',
  linkedin: '', // full URL
  email: 'arnavsamahith@gmail.com',
}

const PILOT_MAILTO = `mailto:${FOUNDER.email}?subject=${encodeURIComponent(
  'Kidchemy pilot for our school'
)}&body=${encodeURIComponent(
  'Hi Arnav,\n\nSchool name:\nCity:\nBoard (CBSE / ICSE / State / IB):\nClasses we would like to start with:\nBest number to reach me:\n\nThanks,'
)}`

/* ─── Sample child for the hero tree and the profile excerpt ───────
   Fictional. Every line is the kind of thing a teacher actually taps. */

const DIMENSIONS = [
  {
    id: 'empathy',
    label: 'Empathy',
    x: 98,
    y: 330,
    lp: 'above',
    fork: 430,
    band: 2,
    note: 'Noticed Kabir eating alone and pulled him into the lunch game.',
    who: 'Ms. Rao, 14 Aug',
  },
  {
    id: 'creativity',
    label: 'Creativity',
    x: 128,
    y: 196,
    fork: 395,
    band: 1,
    note: 'Turned leftover chart paper into a board game for her table.',
    who: 'Mr. Iyer, 22 Aug',
  },
  {
    id: 'curiosity',
    label: 'Curiosity',
    x: 206,
    y: 112,
    fork: 385,
    band: 3,
    note: 'Asked why the moon follows the car, then drew three ways to test it.',
    who: 'Ms. Rao, 2 Sep',
  },
  {
    id: 'communication',
    label: 'Communication',
    x: 300,
    y: 72,
    lp: 'above',
    fork: 385,
    band: 2,
    note: 'Explained her fraction method to the class using a roti.',
    who: 'Ms. Rao, 9 Sep',
  },
  {
    id: 'logic',
    label: 'Logic',
    x: 394,
    y: 112,
    fork: 385,
    band: 2,
    note: 'Sorted the class library by a rule she invented, and explained the rule.',
    who: 'Ms. D’Souza, 18 Aug',
  },
  {
    id: 'persistence',
    label: 'Persistence',
    x: 462,
    y: 196,
    fork: 395,
    band: 1,
    note: 'Rebuilt the paper bridge four times until it held a textbook.',
    who: 'Mr. Iyer, 5 Sep',
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    x: 502,
    y: 330,
    lp: 'above',
    fork: 430,
    band: 0,
    note: 'Not observed yet this term. The profile says so, rather than guessing.',
    who: 'No observations yet',
  },
]

const BANDS = [
  'not yet observed',
  'starting to show',
  'often seen',
  'a signature strength',
]
const BAND_R = [5, 7.5, 10, 13]

/* ─── Audiences ──────────────────────────────────────────────── */

const AUDIENCES = [
  {
    id: 'schools',
    tab: 'School leaders',
    icon: Building2,
    headline: 'The Holistic Progress Card, without an extra hour of writing.',
    pain: 'NEP 2020 and the PARAKH templates ask for a five-domain, multi-voice progress card for every child. Most schools have no tool for it, and their teachers are already stretched.',
    gives: [
      {
        title: 'HPC-ready from day one',
        body: 'Observations map to the PARAKH domains and the Stream, Mountain, Sky levels. The term card assembles itself.',
      },
      {
        title: 'Parent meetings that land',
        body: 'Every teacher walks in with a one-page sheet per child: what to praise, what to raise, what to ask.',
      },
      {
        title: 'A school parents choose',
        body: 'Show prospective families a real portrait of a child. The school down the road shows a mark sheet.',
      },
      {
        title: 'Your data stays yours',
        body: 'Children’s data stays with the school. No ads, no third-party tracking, designed around the DPDP Act.',
      },
    ],
  },
  {
    id: 'teachers',
    tab: 'Teachers',
    icon: Feather,
    headline: 'Two minutes a week. For the whole class.',
    pain: 'You notice extraordinary things about forty children every day. Then the parent meeting arrives, and all you have is marks and memory.',
    gives: [
      {
        title: 'Taps, not essays',
        body: 'One prompt at a time. Who asked a question that made the class think? Tap the names. Done.',
      },
      {
        title: 'Your PTM, prepared',
        body: 'Print a sheet per child the evening before. Three things to praise, one to raise, two questions to ask.',
      },
      {
        title: 'See who you haven’t seen',
        body: 'A gentle nudge about the quiet child you have not noted in four weeks. Every child gets looked at.',
      },
      {
        title: 'Concerns stay with you',
        body: 'Anything you mark school-only never reaches a parent. You decide what is shared.',
      },
    ],
  },
  {
    id: 'parents',
    tab: 'Parents',
    icon: Heart,
    headline: 'The first time someone describes your child instead of scoring them.',
    pain: 'A percentage tells you where your child stands. It says nothing about who they are, what lights them up, or what to do at home this month.',
    gives: [
      {
        title: 'A portrait, not a scorecard',
        body: 'Who your child is, what they do well and how they are growing, in plain language you can read in two minutes.',
      },
      {
        title: 'Scan the report card',
        body: 'A QR code on the card you already receive. Works on any phone, on a slow connection. No app to install.',
      },
      {
        title: 'What to try this month',
        body: 'Three specific things to do at home, and questions that start a real conversation at dinner.',
      },
      {
        title: 'Growth you can see',
        body: 'Term by term, a tree that branches as new strengths show up. Not a ladder to fall behind on.',
      },
    ],
  },
  {
    id: 'children',
    tab: 'Children',
    icon: Sprout,
    headline: 'To be seen, not sorted.',
    pain: 'A child who scores 58% starts to believe they are 58%. Their curiosity, kindness and grit never make it onto the page.',
    gives: [
      {
        title: 'Strengths as things they do',
        body: '“Rebuilt the bridge until it held”, never “weak student”. Language that always leaves room to grow.',
      },
      {
        title: 'No ranks, no comparisons',
        body: 'Nothing in Kidchemy places one child against another. Not on any screen, not on any printout.',
      },
      {
        title: 'Their own voice',
        body: 'Self-reflection prompts, as the HPC intends, so children get to say what they are proud of.',
      },
      {
        title: 'No labels too early',
        body: 'No career predictions before Class 9. At eleven, a suggested career sticks harder than any mark.',
      },
    ],
  },
]

const STEPS = [
  {
    icon: Zap,
    title: 'The teacher sweeps the class',
    body: 'Not “tell me about Aarav”. One prompt at a time, tap every child it was true of. Forty children in about ninety seconds.',
  },
  {
    icon: Feather,
    title: 'The moments get a story',
    body: 'For the child who did something worth a sentence: what I saw, what I think it means, what to offer next.',
  },
  {
    icon: Layers,
    title: 'The picture builds itself',
    body: 'Strengths, dispositions, the conditions in which they do their best work, and the next step just past what they manage alone.',
  },
  {
    icon: QrCode,
    title: 'The parent scans the report card',
    body: 'A QR sticker on the card they already receive. No app, no new system, nothing for the school to replace.',
  },
]

const PROOFS = [
  {
    icon: ShieldCheck,
    title: 'Nothing is invented',
    body: 'Every sentence traces to a counted observation. When anyone asks why it says something, there is an answer, with dates.',
  },
  {
    icon: Scale,
    title: 'It measures its own bias',
    body: 'Records built on visible behaviour under-describe quiet children. Kidchemy shows teachers whose attention is landing where.',
  },
  {
    icon: EyeOff,
    title: 'Teachers can withhold',
    body: 'Every note is shared or school-only. Concerns default to staff only, so teachers keep recording them honestly.',
  },
  {
    icon: Eye,
    title: 'Thin means thin',
    body: 'If a child has only been seen a little, the profile says so plainly. No padding, no horoscope.',
  },
]

const MARQUEE = [
  'Asks the second question',
  'Helps a friend catch up',
  'Rebuilds it until it holds',
  'Notices who is left out',
  'Explains it with a roti',
  'Waits, then tries again',
  'Draws three ways to test it',
  'Leads without being asked',
]

const HPC_DOMAINS_SHORT = [
  'Physical',
  'Socio-emotional',
  'Cognitive',
  'Language',
  'Aesthetic & cultural',
]

/* ══════════════════════════════════════════════════════════════════
   Motion helpers
   ══════════════════════════════════════════════════════════════════ */

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.kc-reveal')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function useScrollProgress(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 800
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)))
      el.style.setProperty('--p', p.toFixed(3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
}

function Reveal({ as: Tag = 'div', delay = 0, className, children, ...rest }) {
  return (
    <Tag
      className={cx('kc-reveal', className)}
      style={{ '--d': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

function Eyebrow({ n, children, light = false }) {
  return (
    <p
      className={cx(
        'mb-4 flex items-center gap-3 text-2xs font-bold uppercase tracking-[0.16em]',
        light ? 'text-white/70' : 'text-ink-faint'
      )}
    >
      {n && (
        <span className={cx('kc-tnum', light ? 'text-white' : 'text-accent')}>
          {n}
        </span>
      )}
      <span
        className={cx('h-px w-8', light ? 'bg-white/40' : 'bg-ink-faint/40')}
      />
      {children}
    </p>
  )
}

/* ══════════════════════════════════════════════════════════════════
   The growth tree. A number dissolves, and a child grows in its place.
   Branches are not a ladder: nothing is above or below anything else.
   ══════════════════════════════════════════════════════════════════ */

const LEAF = 'M0 0 C6 -13 17 -21 30 -23 C29 -8 20 1 7 2 Z'

function branchPath(d) {
  const sx = 300
  const sy = d.fork
  const dx = d.x - sx
  return `M${sx} ${sy} C ${sx + dx * 0.08} ${sy - 70}, ${d.x - dx * 0.35} ${
    d.y + 70
  }, ${d.x} ${d.y + (d.band ? BAND_R[d.band] : 5)}`
}

function GrowthTree() {
  const [active, setActive] = useState(2)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(
      () => setActive((a) => (a + 1) % DIMENSIONS.length),
      3400
    )
    return () => clearInterval(t)
  }, [paused])

  const d = DIMENSIONS[active]

  return (
    <div className="relative">
      <svg
        viewBox="0 0 600 560"
        className="h-auto w-full"
        role="img"
        aria-label="A score of 58 percent fades, and a branching tree of a child's strengths grows in its place."
      >
        {/* The number */}
        <text
          x="300"
          y="330"
          textAnchor="middle"
          className="kc-dissolve font-display"
          style={{ fontSize: 200, fontWeight: 600, fill: 'var(--color-ink)' }}
        >
          58%
        </text>

        {/* Ground */}
        <path
          d="M150 548 C 230 541, 370 541, 450 548"
          pathLength="1"
          className="kc-draw"
          style={{ '--d': '1300ms' }}
          stroke="var(--color-line)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Trunk */}
        <path
          d="M300 546 C 297 500, 304 450, 300 380"
          pathLength="1"
          className="kc-draw"
          style={{ '--d': '1500ms' }}
          stroke="var(--color-ink)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Branches */}
        {DIMENSIONS.map((dim, i) => (
          <path
            key={dim.id}
            d={branchPath(dim)}
            pathLength="1"
            className="kc-draw"
            style={{ '--d': `${2100 + i * 120}ms` }}
            stroke={dim.band ? 'var(--color-ink)' : 'var(--color-ink-faint)'}
            strokeOpacity={dim.band ? 0.85 : 0.5}
            strokeWidth={dim.band ? 2.6 : 1.8}
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {/* Leaves along the branches */}
        {DIMENSIONS.filter((dim) => dim.band > 0).map((dim, i) => {
          const mx = 300 + (dim.x - 300) * 0.55
          const my = dim.fork + (dim.y - dim.fork) * 0.55
          const flip = dim.x < 300 ? -1 : 1
          return (
            <g
              key={`leaf-${dim.id}`}
              transform={`translate(${mx} ${my}) scale(${0.55 * flip} 0.55)`}
            >
              <path
                d={LEAF}
                className="kc-bloom"
                style={{ '--d': `${2900 + i * 110}ms` }}
                fill={i % 2 ? 'var(--color-moss)' : 'var(--color-accent)'}
              />
            </g>
          )
        })}

        {/* Nodes */}
        {DIMENSIONS.map((dim, i) => {
          const r = BAND_R[dim.band]
          const isActive = i === active
          const left = !dim.lp && dim.x < 300
          const right = !dim.lp && dim.x > 300
          const tx = left ? dim.x - r - 10 : right ? dim.x + r + 10 : dim.x
          const ty = left || right ? dim.y + 6 : dim.y - r - 12
          const anchor = left ? 'end' : right ? 'start' : 'middle'
          return (
            <g
              key={`node-${dim.id}`}
              className="kc-bloom cursor-pointer"
              style={{ '--d': `${3000 + i * 130}ms` }}
              onMouseEnter={() => {
                setActive(i)
                setPaused(true)
              }}
              onMouseLeave={() => setPaused(false)}
              onClick={() => {
                setActive(i)
                setPaused(true)
              }}
              tabIndex={0}
              onFocus={() => {
                setActive(i)
                setPaused(true)
              }}
              role="button"
              aria-label={`${dim.label}: ${BANDS[dim.band]}`}
            >
              {isActive && (
                <circle
                  cx={dim.x}
                  cy={dim.y}
                  r={r + 9}
                  fill="var(--color-accent-tint)"
                />
              )}
              <circle
                cx={dim.x}
                cy={dim.y}
                r={r}
                fill={
                  dim.band === 0
                    ? 'var(--color-paper)'
                    : dim.band === 3
                      ? 'var(--color-accent)'
                      : dim.band === 2
                        ? 'var(--color-ramp-4)'
                        : 'var(--color-ramp-2)'
                }
                stroke={dim.band === 0 ? 'var(--color-ink-faint)' : 'none'}
                strokeDasharray={dim.band === 0 ? '2 2' : undefined}
                strokeWidth="1.5"
              />
              <text
                x={tx}
                y={ty}
                textAnchor={anchor}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 19,
                  fontWeight: isActive ? 700 : 600,
                  fill: isActive ? 'var(--color-accent-ink)' : 'var(--color-ink-soft)',
                }}
              >
                {dim.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Evidence card: the line a teacher actually logged */}
      <div
        className="kc-bloom relative -mt-3 sm:mx-8"
        style={{ '--d': '3900ms' }}
      >
        <div
          key={d.id}
          className="kc-fade rounded-[14px] border border-line bg-card/95 p-4 shadow-[var(--shadow-raised)] backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-ink">{d.label}</p>
            <span className="rounded-full bg-accent-tint px-2 py-0.5 text-2xs font-semibold text-accent-ink">
              {BANDS[d.band]}
            </span>
          </div>
          <p className="mt-1.5 font-display text-[1.05rem] leading-snug text-ink-soft">
            {d.band ? `“${d.note}”` : d.note}
          </p>
          <p className="mt-1.5 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
            {d.who}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   One small picture per audience
   ══════════════════════════════════════════════════════════════════ */

function SchoolVisual() {
  const rows = [
    ['Physical', 1],
    ['Socio-emotional', 2],
    ['Cognitive', 2],
    ['Language', 1],
    ['Aesthetic & cultural', 0],
  ]
  const levels = ['Stream', 'Mountain', 'Sky']
  return (
    <div className="rounded-[18px] border border-line bg-card p-5 shadow-[var(--shadow-raised)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="kc-eyebrow">Holistic Progress Card · Term 1</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">
            Meera S. · Class 3B
          </p>
        </div>
        <Mark size={30} />
      </div>
      <div className="mt-4 divide-y divide-line-soft">
        {rows.map(([label, lvl]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <span className="text-sm font-semibold text-ink-soft">{label}</span>
            <span className="flex gap-1">
              {levels.map((l, i) => (
                <span
                  key={l}
                  className={cx(
                    'rounded-full px-2 py-0.5 text-2xs font-semibold',
                    i === lvl
                      ? 'bg-accent text-white'
                      : 'bg-paper-2 text-ink-faint'
                  )}
                >
                  {l}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper px-3.5 py-3">
        <p className="text-xs text-ink-soft">
          <span className="font-bold text-ink">46 observations</span> by 3
          teachers, plus self and parent voice
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
          <Printer size={13} /> Print card
        </span>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-2xs font-semibold text-ink-faint">
          <span>Class 3B observed this month</span>
          <span className="kc-tnum">38 / 40</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-2">
          <div className="h-full w-[95%] rounded-full bg-moss" />
        </div>
      </div>
    </div>
  )
}

const SWEEP_NAMES = [
  'Aarav',
  'Meera',
  'Kabir',
  'Ananya',
  'Rohan',
  'Ishita',
  'Vihaan',
  'Sara',
  'Dev',
  'Nila',
  'Arjun',
  'Zoya',
]
const SWEEP_PICKS = [1, 4, 6, 10]

function TeacherVisual() {
  const [picked, setPicked] = useState(0)
  useEffect(() => {
    const t = setInterval(
      () => setPicked((p) => (p >= SWEEP_PICKS.length + 2 ? 0 : p + 1)),
      900
    )
    return () => clearInterval(t)
  }, [])
  const on = new Set(SWEEP_PICKS.slice(0, picked))
  return (
    <div className="rounded-[18px] border border-line bg-card p-5 shadow-[var(--shadow-raised)]">
      <div className="flex items-center justify-between">
        <p className="kc-eyebrow">Class sweep · prompt 3 of 7</p>
        <span className="inline-flex items-center gap-1 text-2xs font-semibold text-ink-faint">
          <Timer size={12} /> 0:41
        </span>
      </div>
      <p className="mt-2 font-display text-xl font-semibold leading-snug text-ink">
        Who asked a question that made the class think?
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {SWEEP_NAMES.map((n, i) => (
          <span
            key={n}
            className={cx(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-300',
              on.has(i)
                ? 'border-accent bg-accent text-white'
                : 'border-line bg-paper text-ink-soft'
            )}
          >
            {on.has(i) && <Check size={13} strokeWidth={3} />}
            {n}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
        <p className="text-xs text-ink-faint">
          <span className="font-bold text-ink">{on.size}</span> tapped · Kabir
          not seen in 4 weeks
        </p>
        <span className="text-xs font-bold text-accent">Next prompt →</span>
      </div>
    </div>
  )
}

function ParentVisual() {
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[38px] border-[10px] border-ink bg-ink shadow-[var(--shadow-pop)]">
      <div className="overflow-hidden rounded-[28px] bg-paper">
        <div className="bg-accent px-5 pb-5 pt-6 text-white">
          <p className="text-2xs font-bold uppercase tracking-[0.14em] text-white/70">
            Term 1 · Class 3B
          </p>
          <p className="mt-1 font-display text-2xl font-semibold leading-tight">
            Here&rsquo;s who Meera is this term.
          </p>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-xl bg-card p-3 shadow-[var(--shadow-card)]">
            <p className="kc-eyebrow">Who Meera is</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Meera tests ideas out loud. When something puzzles her, she asks
              the second question, and then she draws it.
            </p>
          </div>
          <div className="rounded-xl bg-card p-3 shadow-[var(--shadow-card)]">
            <p className="kc-eyebrow">What she does well</p>
            {[
              ['Curiosity', 4],
              ['Empathy', 3],
              ['Persistence', 2],
            ].map(([l, n]) => (
              <div key={l} className="mt-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-soft">{l}</span>
                <span className="flex gap-1">
                  {[1, 2, 3, 4].map((k) => (
                    <span
                      key={k}
                      className={cx(
                        'h-2 w-2 rounded-full',
                        k <= n ? 'bg-accent' : 'bg-paper-3'
                      )}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-moss-tint p-3">
            <p className="kc-eyebrow text-moss!">Try this month</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Ask her to explain her homework to you instead of checking it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChildVisual() {
  return (
    <div className="relative">
      <div className="rounded-[18px] border border-dashed border-line bg-paper-2/60 p-5">
        <p className="kc-eyebrow">What the report card says</p>
        <p className="mt-2 font-display text-4xl font-semibold text-ink-faint line-through decoration-2">
          Rank 27 of 40
        </p>
      </div>
      <div className="-mt-4 ml-6 space-y-2 rounded-[18px] border border-line bg-card p-5 shadow-[var(--shadow-raised)]">
        <p className="kc-eyebrow">What Kidchemy says</p>
        {[
          'Asks why, until it makes sense.',
          'Rebuilds it until it holds.',
          'Notices who has been left out.',
        ].map((t) => (
          <p
            key={t}
            className="flex items-start gap-2 font-display text-lg leading-snug text-ink"
          >
            <Sprout size={16} className="mt-1 shrink-0 text-moss" />
            {t}
          </p>
        ))}
      </div>
    </div>
  )
}

const VISUALS = {
  schools: SchoolVisual,
  teachers: TeacherVisual,
  parents: ParentVisual,
  children: ChildVisual,
}

/* ══════════════════════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════════════════════ */

export default function Landing() {
  useReveal()
  const [tab, setTab] = useState('schools')
  const expandRef = useRef(null)
  useScrollProgress(expandRef)
  const [photoOk, setPhotoOk] = useState(Boolean(FOUNDER.photo))

  const goTab = (id) => {
    setTab(id)
    document
      .getElementById('for-everyone')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const aud = AUDIENCES.find((a) => a.id === tab)
  const Visual = VISUALS[tab]

  return (
    <div className="min-h-dvh overflow-x-clip bg-paper">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-2" aria-label="Kidchemy home">
            <Mark size={30} tone="bare" />
            <span className="font-display text-xl font-semibold tracking-[-0.015em] text-ink">
              Kidchemy
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => goTab(a.id)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
              >
                For {a.tab.toLowerCase()}
              </button>
            ))}
            <a
              href="#about"
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
            >
              About
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button as={Link} to="/login" size="sm" variant="quiet">
              Sign in
            </Button>
            <Button as="a" href="#pilot" size="sm" variant="primary">
              Pilot with us
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-12 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-20 lg:pt-20">
        <div>
          <p
            className="kc-rise mb-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-accent-line bg-accent-tint px-3 py-1 text-2xs font-bold uppercase tracking-[0.14em] text-accent-ink"
            style={{ animationDelay: '100ms' }}
          >
            NEP 2020 · HPC-ready · KG to Class 8
          </p>
          <h1 className="font-display text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.02em] text-ink sm:text-6xl lg:text-[4.6rem]">
            <span className="kc-line">
              <span style={{ animationDelay: '150ms' }}>Every child is</span>
            </span>
            <span className="kc-line">
              <span style={{ animationDelay: '280ms' }}>more than the</span>
            </span>
            <span className="kc-line">
              <span style={{ animationDelay: '410ms' }} className="text-accent">
                number on their
              </span>
            </span>
            <span className="kc-line">
              <span style={{ animationDelay: '540ms' }} className="text-accent">
                report card.
              </span>
            </span>
          </h1>
          <p
            className="kc-rise mt-6 max-w-xl text-lg leading-relaxed text-ink-soft"
            style={{ animationDelay: '800ms' }}
          >
            Teachers notice extraordinary things every day and have nowhere to
            put them. Kidchemy turns a few taps a week into a living portrait of
            every child, for the parent, the school, and the Holistic Progress
            Card your school needs.
          </p>
          <div
            className="kc-rise mt-8 flex flex-wrap gap-3"
            style={{ animationDelay: '950ms' }}
          >
            <Button as="a" href="#pilot" variant="primary" size="lg" iconRight={ArrowRight}>
              Bring Kidchemy to your school
            </Button>
            <Button as="a" href="#sample" size="lg">
              See a sample profile
            </Button>
          </div>
          <div
            className="kc-rise mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-5"
            style={{ animationDelay: '1100ms' }}
          >
            {[
              ['2 min', 'a week, per class'],
              ['0', 'essays for teachers'],
              ['No app', 'for parents to install'],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-2xl font-semibold text-ink">{n}</p>
                <p className="mt-0.5 text-xs leading-snug text-ink-faint">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <GrowthTree />
        </div>
      </section>

      {/* ── Marquee of verbs ────────────────────────────────── */}
      <div
        className="overflow-hidden border-y border-line bg-card py-4"
        aria-hidden="true"
      >
        <div className="kc-marquee">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span
              key={i}
              className="flex items-center gap-6 whitespace-nowrap px-3 font-display text-xl italic text-ink-soft sm:text-2xl"
            >
              {m}
              <span className="text-accent not-italic">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── 01 The problem ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <Reveal>
          <Eyebrow n="01">The problem</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <p className="max-w-4xl font-display text-3xl font-semibold leading-[1.15] tracking-[-0.015em] text-ink sm:text-5xl">
            A child who scores 58% gets called weak. That same child might ask
            the best questions in the room.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line sm:grid-cols-3">
          {[
            {
              who: 'The teacher',
              icon: Feather,
              text: 'Sees forty children, deeply, every day. At the parent meeting, she has marks and memory, and a queue at the door.',
            },
            {
              who: 'The parent',
              icon: Heart,
              text: 'Gets a percentage twice a year. Chases marks, because marks are the only signal anyone gives them.',
            },
            {
              who: 'The child',
              icon: Sprout,
              text: 'Is ranked against classmates and slowly learns to believe the number is who they are.',
            },
          ].map((c, i) => (
            <Reveal key={c.who} delay={i * 120} className="bg-card p-6 sm:p-8">
              <c.icon size={20} className="text-accent" />
              <p className="mt-4 font-display text-xl font-semibold text-ink">
                {c.who}
              </p>
              <p className="mt-2 text-base leading-relaxed text-ink-soft">
                {c.text}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 02 For everyone ─────────────────────────────────── */}
      <section
        id="for-everyone"
        className="scroll-mt-16 border-y border-line bg-card py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <Eyebrow n="02">One set of taps, four people served</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[2.75rem]">
              Built for everyone who has a stake in a child.
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <div
              role="tablist"
              aria-label="Who is it for"
              className="kc-scroll mt-10 flex gap-2 overflow-x-auto pb-1"
            >
              {AUDIENCES.map((a, i) => (
                <button
                  key={a.id}
                  role="tab"
                  type="button"
                  aria-selected={tab === a.id}
                  onClick={() => setTab(a.id)}
                  className={cx(
                    'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-all',
                    tab === a.id
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-paper text-ink-soft hover:border-ink-faint/50 hover:text-ink'
                  )}
                >
                  <span className="kc-tnum text-2xs opacity-60">0{i + 1}</span>
                  <a.icon size={15} />
                  {a.tab}
                </button>
              ))}
            </div>
          </Reveal>

          <div
            key={aud.id}
            role="tabpanel"
            className="kc-tab-panel mt-10 grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14"
          >
            <div>
              <h3 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                {aud.headline}
              </h3>
              <p className="mt-4 max-w-xl border-l-2 border-accent-line pl-4 text-lg leading-relaxed text-ink-soft">
                {aud.pain}
              </p>
              <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {aud.gives.map((g) => (
                  <div key={g.title}>
                    <p className="flex items-center gap-2 text-base font-bold text-ink">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-tint text-accent">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {g.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                      {g.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:pt-2">
              <Visual />
            </div>
          </div>
        </div>
      </section>

      {/* ── 03 How it works ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <Reveal>
          <Eyebrow n="03">How it works</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[2.75rem]">
            Four steps. None of them adds an hour to a teacher&rsquo;s week.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 120} className="relative">
              <p className="font-display text-6xl font-semibold leading-none text-accent-line">
                0{i + 1}
              </p>
              <div className="mt-5 h-px w-full bg-line" />
              <s.icon size={18} className="mt-5 text-accent" />
              <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-ink">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 04 The expanding statement + HPC ────────────────── */}
      <section ref={expandRef} className="relative">
        <div className="kc-expand bg-accent text-white">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
            <Eyebrow n="04" light>
              NEP 2020 · Holistic Progress Card
            </Eyebrow>
            <p className="max-w-4xl font-display text-3xl font-semibold leading-[1.12] tracking-[-0.015em] sm:text-5xl">
              It sits beside the report card. It never replaces it. And it
              writes the card your school is being asked for.
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
              The PARAKH Holistic Progress Card asks for five domains, self,
              peer and parent voice, and a landscape of levels instead of
              marks. Kidchemy maps every tap to it, for the foundational,
              preparatory and middle stages.
            </p>
            <div className="mt-12 grid gap-3 sm:grid-cols-5">
              {HPC_DOMAINS_SHORT.map((d, i) => (
                <div
                  key={d}
                  className="rounded-[14px] border border-white/20 bg-white/[0.06] p-4"
                >
                  <p className="kc-tnum text-2xs font-bold text-white/60">
                    Domain {i + 1}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold leading-snug">
                    {d}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-white/80">
              <span className="mr-1 font-semibold text-white">Levels, not marks:</span>
              {['Stream', 'Mountain', 'Sky'].map((l, i) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold"
                >
                  {l}
                  {i < 2 && <ArrowRight size={12} className="opacity-60" />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 05 Sample profile ───────────────────────────────── */}
      <section id="sample" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow n="05">What a parent reads</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[2.75rem]">
                Not a dashboard. A letter about their child.
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                Written in plain language, readable in two minutes on any
                phone. Every line comes from something a teacher actually saw,
                and it says when it has not seen enough yet.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-ink-soft">
                {[
                  'Who your child is',
                  'What they do well, in bands, never scores',
                  'How they are growing, term by term',
                  'What to try at home this month',
                  'Questions to ask them tonight',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <article className="relative rounded-[22px] border border-line bg-card p-6 shadow-[var(--shadow-pop)] sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-moss-tint font-display text-lg font-semibold text-moss">
                    M
                  </span>
                  <div>
                    <p className="font-display text-xl font-semibold text-ink">
                      Meera, Class 3B
                    </p>
                    <p className="text-xs text-ink-faint">
                      Built from 46 observations by 3 teachers, June to
                      September
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-paper-2 px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.1em] text-ink-faint">
                  Sample
                </span>
              </div>

              <p className="kc-eyebrow mt-6">Who Meera is</p>
              <p className="mt-2 font-display text-xl leading-relaxed text-ink sm:text-2xl">
                Meera tests ideas out loud. When something puzzles her she asks
                the second question, the one most children skip, and then she
                draws it until it makes sense.
              </p>

              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="kc-eyebrow">At her best when</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    She can work with her hands first and explain after. Long
                    silent writing tasks hide what she knows.
                  </p>
                </div>
                <div>
                  <p className="kc-eyebrow">Next step for her</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    Turning a spoken explanation into three written lines. The
                    gap is expression, not understanding.
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-[14px] bg-moss-tint p-5">
                <p className="kc-eyebrow text-moss!">Try this at home</p>
                <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                  <li>· Ask her to teach you her homework, instead of checking it.</li>
                  <li>· Give her something broken to take apart and fix.</li>
                </ul>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-line p-5">
                <MessageCircle size={18} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="kc-eyebrow">Ask her tonight</p>
                  <p className="mt-1 font-display text-lg text-ink">
                    &ldquo;What&rsquo;s something you figured out by yourself
                    this week?&rdquo;
                  </p>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ── 06 Why you can believe it ───────────────────────── */}
      <section className="border-y border-line bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <Eyebrow n="06">Why you can believe it</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[2.75rem]">
              Most products like this become a horoscope. Four decisions keep
              this one honest.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROOFS.map((p, i) => (
              <Reveal
                key={p.title}
                delay={i * 100}
                className="rounded-[18px] border border-line bg-paper p-6"
              >
                <p.icon size={20} className="text-moss" />
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.body}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200} className="mt-14">
            <p className="kc-eyebrow mb-4">Built on a century of practice</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(FRAMEWORKS).map((f) => (
                <span
                  key={f.id}
                  title={f.oneLine}
                  className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-semibold text-ink-soft"
                >
                  {f.label}
                </span>
              ))}
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-faint">
              What we refused matters too. Learning styles are not supported by
              the evidence, so Kidchemy never calls a child a visual learner.
              And it names no careers below Class 9.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 07 About ────────────────────────────────────────── */}
      <section id="about" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-24">
            <figure>
              <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-[22px] bg-accent">
                {photoOk ? (
                  <img
                    src={FOUNDER.photo}
                    alt={`${FOUNDER.name}, founder of Kidchemy`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => setPhotoOk(false)}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-white">
                    <Mark size={96} tone="white" />
                    <span className="text-2xs font-bold uppercase tracking-[0.16em] text-white/60">
                      Photo coming soon
                    </span>
                  </div>
                )}
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-3">
                <span className="font-display text-lg font-semibold text-ink">
                  {FOUNDER.name}
                </span>
                <span className="text-xs text-ink-faint">
                  {[FOUNDER.role, FOUNDER.college].filter(Boolean).join(' · ')}
                </span>
              </figcaption>
            </figure>
          </Reveal>

          <div>
            <Reveal>
              <Eyebrow n="07">Why I&rsquo;m building this</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="font-display text-3xl font-semibold leading-[1.12] tracking-[-0.015em] text-ink sm:text-[2.9rem]">
                I&rsquo;m {FOUNDER.name}. I believe every child deserves to be
                described, not just measured.
              </h2>
            </Reveal>
            <Reveal delay={160} className="mt-7 space-y-5 text-lg leading-relaxed text-ink-soft">
              <p>
                {FOUNDER.college ? `I'm a student at ${FOUNDER.college}. ` : ''}
                Like most of us, I grew up in a system that folds a whole year
                of a child&rsquo;s life into one number on one sheet of paper.
                That number decides how a child is spoken about at school, at
                the dinner table, and eventually, in their own head.
              </p>
              <p>
                But teachers see so much more. The child who asks the question
                no one else thought of. The one who quietly helps a friend
                catch up. The one who rebuilds the model five times. None of
                it has anywhere to go, so it disappears.{' '}
                <span className="font-semibold text-ink">
                  Kidchemy gives it somewhere to go.
                </span>
              </p>
            </Reveal>

            <Reveal delay={220}>
              <div className="mt-10 rounded-[18px] bg-ink p-6 text-white sm:p-8">
                <p className="text-2xs font-bold uppercase tracking-[0.16em] text-white/60">
                  The vision
                </p>
                <p className="mt-3 font-display text-2xl leading-snug sm:text-[1.75rem]">
                  A country where every report card comes with a portrait.
                  Where a teacher&rsquo;s best observations outlive the week.
                  Where a parent&rsquo;s first question is &ldquo;what lights
                  her up?&rdquo; and not &ldquo;what did she get?&rdquo;
                </p>
              </div>
            </Reveal>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['Now', 'Two pilot schools this term, working side by side with their teachers.'],
                ['Next', 'Every Holistic Progress Card written from evidence, not from memory the night before.'],
                ['Always', 'Free for parents. No ads. Children’s data stays with their school.'],
              ].map(([k, v], i) => (
                <Reveal
                  key={k}
                  delay={260 + i * 90}
                  className="rounded-[14px] border border-line bg-card p-5"
                >
                  <p className="text-2xs font-bold uppercase tracking-[0.14em] text-accent">
                    {k}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{v}</p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={400}>
              <p className="mt-10 font-display text-2xl italic leading-snug text-ink">
                &ldquo;A child is not a number. Let&rsquo;s stop introducing
                them as one.&rdquo;
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button as="a" href={`mailto:${FOUNDER.email}`} icon={MessageCircle}>
                  Write to me
                </Button>
                {FOUNDER.linkedin && (
                  <Button
                    as="a"
                    href={FOUNDER.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    iconRight={ArrowUpRight}
                  >
                    LinkedIn
                  </Button>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 08 Pilot ────────────────────────────────────────── */}
      <section id="pilot" className="scroll-mt-16 border-t border-line bg-paper-2 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <Reveal>
                <Eyebrow n="08">Pilot with us</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-6xl">
                  One class. One term. Set up in person.
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
                  We are opening Kidchemy to a small number of founding
                  schools. We sit with your teachers for the first sweep, print
                  the first parent meeting sheets, and stand in the room when
                  parents scan their first report card.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    as="a"
                    href={PILOT_MAILTO}
                    variant="primary"
                    size="lg"
                    iconRight={ArrowRight}
                  >
                    Book a pilot conversation
                  </Button>
                  <Button as={Link} to="/login" size="lg">
                    I already have an account
                  </Button>
                </div>
                <p className="mt-4 text-xs text-ink-faint">
                  Teachers need a school code. Parents need the code on their
                  child&rsquo;s report card sticker.
                </p>
              </Reveal>
            </div>

            <Reveal delay={120}>
              <div className="rounded-[22px] border border-line bg-card p-6 shadow-[var(--shadow-raised)] sm:p-8">
                <p className="kc-eyebrow">Your school gets</p>
                <ul className="mt-3 space-y-3">
                  {[
                    'Roster import from what you already export',
                    'In-person setup and teacher onboarding',
                    'Printed PTM sheets and QR report card stickers',
                    'A term-end Holistic Progress Card for every child',
                    'A short impact report for your management',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-moss" />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="kc-eyebrow mt-7">We ask for</p>
                <ul className="mt-3 space-y-3">
                  {[
                    'One or two teachers willing to try it for a term',
                    'Fifteen minutes of feedback every two weeks',
                    'Permission to be present at one parent meeting',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <Users size={15} className="mt-0.5 shrink-0 text-accent" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5">
                <Mark size={34} tone="light" />
                <span className="font-display text-2xl font-semibold tracking-[-0.015em]">
                  Kidchemy
                </span>
              </div>
              <p className="mt-3 text-2xs font-bold uppercase tracking-[0.2em] text-white/50">
                A truer picture of every child
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => goTab(a.id)}
                  className="hover:text-white"
                >
                  For {a.tab.toLowerCase()}
                </button>
              ))}
              <a href="#about" className="hover:text-white">
                About
              </a>
              <Link to="/login" className="hover:text-white">
                Sign in
              </Link>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50">
            <p>
              Children&rsquo;s data stays with the school. No advertising, no
              third-party analytics on parent pages, ever.
            </p>
            <p>© {new Date().getFullYear()} Kidchemy</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
