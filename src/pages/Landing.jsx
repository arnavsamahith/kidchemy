import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Lock,
  MessageCircle,
  Printer,
  RotateCcw,
  Timer,
  Unlock,
} from 'lucide-react'
import { cx } from '../components/ui.jsx'
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

/* ══════════════════════════════════════════════════════════════════
   Shared bits
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

function useInView(ref, margin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: margin,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return inView
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function Reveal({ as: Tag = 'div', delay = 0, className, children, ...rest }) {
  return (
    <Tag className={cx('kc-reveal', className)} style={{ '--d': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}

function Label({ children, light = false, className }) {
  return (
    <p
      className={cx(
        'kl-label',
        light ? 'text-white/60' : 'text-ink-faint',
        className
      )}
    >
      {children}
    </p>
  )
}

function PilotButton({ size = 'md', light = false, className }) {
  return (
    <a
      href={PILOT_MAILTO}
      className={cx(
        'kl-btn',
        light ? 'kl-btn-light' : 'kl-btn-dark',
        size === 'lg' ? 'px-6 py-3.5 text-base' : 'px-4 py-2 text-sm',
        className
      )}
    >
      Pilot with us
      <ArrowRight size={size === 'lg' ? 18 : 15} className="kl-btn-arrow" />
    </a>
  )
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const span = (a, b, p) => ease(clamp01((p - a) / (b - a)))
const lerp = (a, b, t) => a + (b - a) * t

/* ══════════════════════════════════════════════════════════════════
   HERO. A child's tree that grows only when a teacher taps.
   Branches are not a ladder: nothing is above or below anything else.
   ══════════════════════════════════════════════════════════════════ */

const TREE = [
  { id: 'empathy', label: 'Empathy', x: 98, y: 330, lp: 'above', fork: 430, band: 1 },
  { id: 'creativity', label: 'Creativity', x: 128, y: 196, fork: 395, band: 1 },
  { id: 'curiosity', label: 'Curiosity', x: 206, y: 112, fork: 385, band: 2 },
  { id: 'communication', label: 'Communication', x: 300, y: 72, lp: 'above', fork: 385, band: 1 },
  { id: 'logic', label: 'Logic', x: 394, y: 112, fork: 385, band: 2 },
  { id: 'persistence', label: 'Persistence', x: 462, y: 196, fork: 395, band: 1 },
  { id: 'collaboration', label: 'Collaboration', x: 502, y: 330, lp: 'above', fork: 430, band: 0 },
]
const BAND_R = [5, 7.5, 10, 13]
const BANDS = ['not yet seen', 'starting to show', 'often seen', 'a signature strength']

const HERO_PROMPTS = [
  { dim: 'persistence', q: 'Who kept going after it went wrong?' },
  { dim: 'collaboration', q: 'Who helped their group finish?' },
  { dim: 'curiosity', q: 'Who asked a question that made the class think?' },
  { dim: 'empathy', q: 'Who noticed someone was left out?' },
]
const HERO_NAMES = ['Meera', 'Kabir', 'Zoya', 'Dev', 'Ishita', 'Arjun']

const LEAF = 'M0 0 C6 -13 17 -21 30 -23 C29 -8 20 1 7 2 Z'

function branchCtrl(d) {
  const sx = 300
  const sy = d.fork
  const dx = d.x - sx
  return [
    [sx, sy],
    [sx + dx * 0.08, sy - 70],
    [d.x - dx * 0.35, d.y + 70],
    [d.x, d.y + 5],
  ]
}
function branchPath(d) {
  const [p0, p1, p2, p3] = branchCtrl(d)
  return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`
}
function bez(d, t) {
  const [p0, p1, p2, p3] = branchCtrl(d)
  const u = 1 - t
  const f = (i) =>
    u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]
  return [f(0), f(1)]
}
const LEAF_T = [0.42, 0.6, 0.76]

function HeroTree() {
  const wrap = useRef(null)
  const inView = useInView(wrap)
  const [bands, setBands] = useState(() => Object.fromEntries(TREE.map((d) => [d.id, d.band])))
  const [step, setStep] = useState(0)
  const [tapped, setTapped] = useState([])
  const [pulse, setPulse] = useState(null)
  const [auto, setAuto] = useState(true)
  const [hover, setHover] = useState(null)
  const prompt = HERO_PROMPTS[step % HERO_PROMPTS.length]

  const lock = useRef(false)
  const tap = useCallback(
    (name, byUser = true) => {
      if (byUser) setAuto(false)
      setTapped((t) => (t.includes(name) ? t : [...t, name]))
      if (name !== 'Meera' || lock.current) return
      lock.current = true
      setBands((b) => ({ ...b, [prompt.dim]: Math.min(3, b[prompt.dim] + 1) }))
      setPulse({ id: prompt.dim, k: Date.now() })
      setTimeout(() => {
        setStep((s) => s + 1)
        setTapped([])
        lock.current = false
      }, 900)
    },
    [prompt.dim]
  )

  const reset = () => {
    setBands(Object.fromEntries(TREE.map((d) => [d.id, d.band])))
    setStep(0)
    setTapped([])
  }

  // Plays itself until someone touches it.
  useEffect(() => {
    if (!auto || !inView || prefersReducedMotion()) return
    if (step >= HERO_PROMPTS.length) {
      const t = setTimeout(reset, 2600)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => tap('Meera', false), step === 0 ? 3800 : 2600)
    return () => clearTimeout(t)
  }, [auto, inView, step, tap])

  const done = step >= HERO_PROMPTS.length
  const active = hover || pulse?.id

  return (
    <div ref={wrap} className="relative">
      <svg
        viewBox="0 0 600 560"
        className="kl-hero-tree mx-auto h-auto w-full"
        role="img"
        aria-label="Meera's growth tree. Each branch is a strength. It grows when a teacher records seeing it."
      >
        <path
          d="M150 548 C 230 541, 370 541, 450 548"
          pathLength="1"
          className="kc-draw"
          style={{ '--d': '200ms' }}
          stroke="var(--color-line)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M300 546 C 297 500, 304 450, 300 380"
          pathLength="1"
          className="kc-draw"
          style={{ '--d': '400ms' }}
          stroke="var(--color-ink)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        {TREE.map((d, i) => (
          <path
            key={d.id}
            d={branchPath(d)}
            pathLength="1"
            className="kc-draw"
            style={{ '--d': `${900 + i * 110}ms`, transition: 'stroke 400ms ease, stroke-width 400ms ease' }}
            stroke={bands[d.id] ? 'var(--color-ink)' : 'var(--color-ink-faint)'}
            strokeOpacity={bands[d.id] ? 0.85 : 0.45}
            strokeWidth={1.6 + bands[d.id] * 0.55}
            strokeDasharray={bands[d.id] ? undefined : '0.02 0.02'}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {/* Leaves: one per band, so growth is something you can count */}
        {TREE.flatMap((d) =>
          LEAF_T.slice(0, bands[d.id]).map((t, j) => {
            const [lx, ly] = bez(d, t)
            const flip = (j % 2 ? -1 : 1) * (d.x < 300 ? -1 : 1)
            const fresh = pulse?.id === d.id && j === bands[d.id] - 1
            return (
              <g key={`${d.id}-${j}-${fresh ? pulse.k : 0}`} transform={`translate(${lx} ${ly}) scale(${0.5 * flip} 0.5)`}>
                <path
                  d={LEAF}
                  className="kc-bloom"
                  style={{ '--d': fresh ? '0ms' : `${1900 + j * 120}ms` }}
                  fill={j % 2 ? 'var(--color-moss)' : 'var(--color-accent)'}
                />
              </g>
            )
          })
        )}
        {TREE.map((d, i) => {
          const b = bands[d.id]
          const r = BAND_R[b]
          const left = !d.lp && d.x < 300
          const right = !d.lp && d.x > 300
          const tx = left ? d.x - r - 10 : right ? d.x + r + 10 : d.x
          const ty = left || right ? d.y + 6 : d.y - r - 12
          const isOn = active === d.id
          return (
            <g
              key={d.id}
              className="kc-bloom cursor-default"
              style={{ '--d': `${1700 + i * 110}ms` }}
              onMouseEnter={() => setHover(d.id)}
              onMouseLeave={() => setHover(null)}
            >
              {pulse?.id === d.id && (
                <circle key={pulse.k} cx={d.x} cy={d.y} r={r + 4} className="kl-ring" fill="none" stroke="var(--color-accent)" strokeWidth="2" />
              )}
              <circle
                cx={d.x}
                cy={d.y}
                r={r}
                style={{ transition: 'r 500ms cubic-bezier(.34,1.56,.64,1), fill 400ms ease' }}
                fill={
                  b === 0
                    ? 'var(--color-paper)'
                    : b === 3
                      ? 'var(--color-accent)'
                      : b === 2
                        ? 'var(--color-ramp-4)'
                        : 'var(--color-ramp-2)'
                }
                stroke={b === 0 ? 'var(--color-ink-faint)' : 'none'}
                strokeDasharray={b === 0 ? '2 2' : undefined}
                strokeWidth="1.5"
              />
              <text
                x={tx}
                y={ty}
                textAnchor={left ? 'end' : right ? 'start' : 'middle'}
                style={{
                  fontFamily: 'var(--font-satoshi)',
                  fontSize: 18,
                  fontWeight: isOn ? 700 : 500,
                  fill: isOn ? 'var(--color-accent-ink)' : 'var(--color-ink-soft)',
                  transition: 'fill 200ms ease',
                }}
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* The UI that makes it grow. Overlaps the tree on purpose. */}
      <div className="kc-rise relative z-10 mt-2 lg:absolute lg:-left-4 lg:bottom-2 lg:mt-0 lg:w-[310px] xl:-left-14" style={{ animationDelay: '1200ms' }}>
        <div className="kl-panel p-4 lg:-rotate-[1.5deg]">
          <div className="flex items-center justify-between">
            <p className="kl-label text-ink-faint">Class sweep</p>
            <p className="kc-tnum text-2xs text-ink-faint">
              {done ? 'done' : `prompt ${step + 1} of ${HERO_PROMPTS.length}`}
            </p>
          </div>
          {done ? (
            <div className="mt-2">
              <p className="font-editorial text-[1.45rem] leading-tight text-ink">
                Four taps. Meera&rsquo;s tree just grew.
              </p>
              <button type="button" onClick={reset} className="kl-link mt-3 inline-flex items-center gap-1.5 text-sm">
                <RotateCcw size={13} /> Run it again
              </button>
            </div>
          ) : (
            <>
              <p key={step} className="kc-fade mt-1.5 font-editorial text-[1.45rem] leading-[1.15] text-ink">
                {prompt.q}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {HERO_NAMES.map((n) => {
                  const on = tapped.includes(n)
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => tap(n)}
                      className={cx('kl-chip', on && 'is-on', n === 'Meera' && !on && auto && 'kl-chip-hint')}
                    >
                      {on && <Check size={12} strokeWidth={3} />}
                      {n}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-ink-faint">Tap Meera, and watch her tree.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STORY. One year of moments becomes one number. Then we undo it.
   Scroll-driven: every moment is a DOM node moved by transform.
   ══════════════════════════════════════════════════════════════════ */

const GROUPS = ['Curiosity', 'Empathy', 'Persistence', 'Creativity', 'Communication', 'Leadership']
const MOMENTS = [
  ['asked why the moon follows the car', 0], ['comforted Kabir after the race', 1], ['rebuilt the bridge four times', 2],
  ['turned chart paper into a board game', 3], ['explained fractions with a roti', 4], ['organised the clean-up', 5],
  ['drew three ways to test it', 0], ['pulled the new girl into the game', 1], ['finished the long run', 2],
  ['wrote a poem about the monsoon', 3], ['read aloud to Class 1', 4], ['ran the class library', 5],
  ['asked the second question', 0], ['shared her crayons without asking', 1], ['tried the hard puzzle again', 2],
  ['invented a rule for sorting books', 3], ['retold the story in her words', 4], ['spoke up for a friend', 5],
  ['wondered where the rain goes', 0], ['noticed Dev eating alone', 1], ['practised the knot until it held', 2],
  ['made a puppet from a sock', 3], ['argued kindly, and listened', 4], ['set up the science table', 5],
  ['took the clock apart', 0], ['apologised first', 1], ['kept going when it failed', 2],
  ['painted the sky green, on purpose', 3], ['asked the visitor a real question', 4], ['showed Zoya the shortcut', 5],
  ['tested which ball bounces highest', 0], ['waited for the slow walker', 1], ['fixed her own mistake', 2],
  ['composed a clapping rhythm', 3], ['explained the rules to the group', 4], ['led the morning prayer', 5],
  ['counted the ants on the wall', 0], ['helped tie Arjun’s shoe', 1], ['learnt the times table, slowly', 2],
  ['designed a better pencil box', 3], ['wrote a letter to the principal', 4], ['calmed the class down', 5],
]
const DATES = ['12 Jun', '19 Jun', '3 Jul', '11 Jul', '24 Jul', '2 Aug', '9 Aug', '14 Aug', '22 Aug', '2 Sep', '9 Sep', '18 Sep']

function seeded(i) {
  const x = Math.sin(i * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function OneNumberStory() {
  const section = useRef(null)
  const field = useRef(null)
  const chipRefs = useRef([])
  const numRef = useRef(null)
  const headRefs = useRef([])
  const capRefs = useRef([])
  const [mobile, setMobile] = useState(false)
  const reduced = useMemo(prefersReducedMotion, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setMobile(mq.matches)
    on()
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])

  const perGroup = mobile ? 3 : 5
  const chips = useMemo(() => {
    const out = []
    GROUPS.forEach((_, g) => {
      MOMENTS.filter((m) => m[1] === g)
        .slice(0, perGroup)
        .forEach((m, k) => out.push({ text: m[0], g, k, date: DATES[(g * 3 + k) % DATES.length] }))
    })
    return out
  }, [perGroup])

  useEffect(() => {
    const sec = section.current
    const fld = field.current
    if (!sec || !fld) return
    let raf = 0
    let geo = null

    // Random-looking, never overlapping: chips are dealt across rows like
    // cards, each with a random gap and a little vertical drift that stays
    // inside the gap between rows.
    const measure = () => {
      const w = fld.clientWidth
      const h = fld.clientHeight
      const cols = mobile ? 2 : 3
      const rows = mobile ? 3 : 2
      const cw = w / cols
      const rh = h / rows
      fld.style.setProperty('--cw', `${cw}px`)

      chipRefs.current.forEach((el) => el?.classList.remove('is-ordered'))
      const sizes = chips.map((_, i) => {
        const el = chipRefs.current[i]
        return { w: el?.offsetWidth || 200, h: el?.offsetHeight || 28 }
      })
      const chipH = Math.max(...sizes.map((z) => z.h))
      const gapY = mobile ? 10 : 16
      const rowH = chipH + gapY
      const nRows = Math.max(1, Math.floor((h + gapY) / rowH))
      const lanes = Array.from({ length: nRows }, (_, r) => ({ x: seeded(r + 300) * 70, used: false }))
      const deal = chips.map((_, i) => i).sort((a, b) => seeded(a + 7) - seeded(b + 7))
      const spot = new Array(chips.length).fill(null)
      let lane = 0
      for (const i of deal) {
        for (let t = 0; t < nRows; t++) {
          const r = (lane + t) % nRows
          const L = lanes[r]
          const x = L.used ? L.x + 18 + seeded(i * 3 + 1) * (mobile ? 30 : 64) : L.x
          if (x + sizes[i].w <= w) {
            spot[i] = { x, y: r * rowH + seeded(i * 5 + 2) * gapY * 0.6 }
            L.x = x + sizes[i].w
            L.used = true
            lane = (r + 1) % nRows
            break
          }
        }
      }

      geo = {
        w,
        h,
        cw,
        pos: chips.map((c, i) => {
          const col = c.g % cols
          const row = Math.floor(c.g / cols)
          return {
            sx: spot[i] ? spot[i].x : w / 2 - 40,
            sy: spot[i] ? spot[i].y : h / 2 - 12,
            hidden: !spot[i],
            ox: col * cw + 6,
            oy: row * rh + 30 + c.k * (mobile ? 25 : 27),
          }
        }),
        heads: GROUPS.map((_, g) => ({
          x: (g % cols) * cw + 6,
          y: Math.floor(g / cols) * rh,
        })),
      }
      headRefs.current.forEach((el, g) => {
        if (el) el.style.transform = `translate(${geo.heads[g].x}px, ${geo.heads[g].y}px)`
      })
    }

    const paint = () => {
      raf = 0
      if (!geo) measure()
      const r = sec.getBoundingClientRect()
      const total = sec.offsetHeight - window.innerHeight
      const vh = window.innerHeight || 800
      const p = reduced ? 1 : clamp01(-r.top / Math.max(total, 1))
      // Moments start arriving as the section scrolls in, before it pins.
      const appear = reduced ? 1 : clamp01((vh * 0.9 - r.top) / (vh * 1.1))
      const collapse = span(0.26, 0.44, p)
      const order = span(0.68, 0.88, p)
      const cx = geo.w / 2 - 40
      const cy = geo.h / 2 - 12
      const n = chips.length
      chips.forEach((c, i) => {
        const el = chipRefs.current[i]
        if (!el) return
        const g = geo.pos[i]
        const shown = g.hidden ? order : clamp01(appear * (n + 6) - i)
        let x = lerp(g.sx, cx, collapse)
        let y = lerp(g.sy, cy, collapse)
        x = lerp(x, g.ox, order)
        y = lerp(y, g.oy, order)
        const s = lerp(lerp(1, 0.15, collapse), 1, order)
        const o = shown * lerp(lerp(1, 0, collapse), 1, order)
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`
        el.style.opacity = o.toFixed(3)
        el.classList.toggle('is-ordered', order > 0.6)
      })
      if (numRef.current) {
        const show = span(0.36, 0.46, p) * (1 - span(0.6, 0.7, p))
        const gone = span(0.6, 0.7, p)
        numRef.current.style.opacity = show.toFixed(3)
        numRef.current.style.filter = `blur(${(gone * 14).toFixed(1)}px)`
        numRef.current.style.transform = `translate(-50%, -50%) scale(${(0.86 + 0.14 * span(0.36, 0.46, p) + gone * 0.25).toFixed(3)})`
      }
      headRefs.current.forEach((el) => {
        if (el) el.style.opacity = order.toFixed(3)
      })
      const idx = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.67 ? 2 : 3
      capRefs.current.forEach((el, i) => el?.classList.toggle('is-on', i === idx))
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const onResize = () => {
      geo = null
      onScroll()
    }
    measure()
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [chips, mobile, reduced])

  const captions = [
    ['Every day, a teacher sees moments like these.', 'Forty children. Hundreds of moments.'],
    ['At the end of term, all of them become this.', 'One number. One sheet of paper.'],
    ['Everything else disappears.', 'And the child keeps the number.'],
    ['Kidchemy keeps every moment.', 'Sorted into who the child is.'],
  ]

  return (
    <section ref={section} id="story" className={cx('relative', reduced ? '' : 'h-[340vh]')} aria-label="How a year becomes a number">
      <div className={cx(reduced ? '' : 'sticky top-0 h-dvh', 'overflow-hidden')}>
        <div className="mx-auto grid h-full max-w-[88rem] grid-rows-[auto_1fr] gap-6 px-5 py-20 md:grid-cols-[0.8fr_1.4fr] md:grid-rows-1 md:items-center md:gap-10 md:px-10">
          <div className="relative min-h-[9.5rem] md:min-h-[16rem]">
            {captions.map(([h, s], i) => (
              <div key={h} ref={(el) => (capRefs.current[i] = el)} className={cx('kl-cap', (i === 0 || reduced) && 'is-on', reduced && 'kl-cap-static')}>
                <p className="font-editorial text-[2.3rem] leading-[1.02] tracking-[-0.015em] text-ink sm:text-5xl lg:text-[4.1rem]">
                  {i === 3 ? (
                    <>
                      Kidchemy keeps <em className="text-accent">every</em> moment.
                    </>
                  ) : (
                    h
                  )}
                </p>
                <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-soft sm:text-lg">{s}</p>
              </div>
            ))}
          </div>
          <div ref={field} className="relative h-full min-h-[22rem] md:h-[34rem]">
            {GROUPS.map((g, i) => (
              <p key={g} ref={(el) => (headRefs.current[i] = el)} className="kl-label absolute left-0 top-0 text-accent" style={{ opacity: reduced ? 1 : 0 }}>
                {g}
              </p>
            ))}
            {chips.map((c, i) => (
              <span key={`${c.g}-${c.k}`} ref={(el) => (chipRefs.current[i] = el)} className="kl-moment" style={{ opacity: 0 }}>
                <span className="kl-moment-date">{c.date}</span>
                {c.text}
              </span>
            ))}
            <div ref={numRef} className="pointer-events-none absolute left-1/2 top-1/2 select-none" style={{ opacity: 0, transform: 'translate(-50%,-50%)' }}>
              <p className="font-editorial text-[9rem] leading-none text-ink sm:text-[13rem] lg:text-[17rem]">58%</p>
              <p className="-mt-2 text-center text-sm text-ink-faint">Term 1 · Overall</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   AUDIENCES. One set of taps, four people served.
   ══════════════════════════════════════════════════════════════════ */

const AUDIENCES = [
  {
    id: 'schools',
    tab: 'School leaders',
    headline: 'The progress card, without the extra hour of writing.',
    pain: 'NEP asks for it. No tool exists for it.',
    gives: [
      ['HPC-ready from day one', 'Every tap mapped to PARAKH'],
      ['Parent meetings that land', 'One sheet per child'],
      ['A school parents choose', 'Portraits, not mark sheets'],
      ['Your data stays yours', 'DPDP-aligned, no ads'],
    ],
  },
  {
    id: 'teachers',
    tab: 'Teachers',
    headline: 'Two minutes a week. For the whole class.',
    pain: 'You see so much. Marks capture none of it.',
    gives: [
      ['Taps, not essays', 'One prompt, tap the names'],
      ['Your PTM, prepared', 'A sheet per child, printed'],
      ['See who you haven’t seen', 'A nudge for the quiet child'],
      ['Concerns stay with you', 'School-only, always'],
    ],
  },
  {
    id: 'parents',
    tab: 'Parents',
    headline: 'The first time someone describes your child instead of scoring them.',
    pain: 'A percentage says where. Never who.',
    gives: [
      ['A portrait, not a scorecard', 'Two minutes, any phone'],
      ['Scan the report card', 'No app to install'],
      ['What to try this month', 'Three things for home'],
      ['Yours to control', 'Download, correct, erase'],
    ],
  },
  {
    id: 'children',
    tab: 'Children',
    headline: 'To be seen, not sorted.',
    pain: 'A child who scores 58% starts to believe it.',
    gives: [
      ['Strengths as actions', '“Rebuilt it until it held”'],
      ['No ranks, anywhere', 'No child against another'],
      ['Their own voice', 'In their own words'],
      ['No labels too early', 'No careers before Class 9'],
    ],
  },
]

function SchoolVisual() {
  const rows = [
    ['Physical', 1],
    ['Socio-emotional', 2],
    ['Cognitive', 2],
    ['Language', 1],
    ['Aesthetic & cultural', 0],
  ]
  return (
    <div className="kl-panel p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="kl-label text-ink-faint">Holistic Progress Card · Term 1</p>
          <p className="mt-1 font-editorial text-2xl text-ink">Meera S. · Class 3B</p>
        </div>
        <Mark size={30} />
      </div>
      <div className="mt-4 divide-y divide-neutral-200/70">
        {rows.map(([label, lvl], i) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-sm text-ink-soft">{label}</span>
            <span className="flex gap-1">
              {['Stream', 'Mountain', 'Sky'].map((l, k) => (
                <span
                  key={l}
                  className={cx('kl-level', k === lvl && 'is-on')}
                  style={{ transitionDelay: `${i * 90 + k * 40}ms` }}
                >
                  {l}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200/70 pt-3 text-xs text-ink-soft">
        <span>
          <b className="font-semibold text-ink">46 observations</b> · 3 teachers · self and parent voice
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-accent">
          <Printer size={13} /> Print
        </span>
      </div>
    </div>
  )
}

function TeacherVisual() {
  const names = ['Aarav', 'Meera', 'Kabir', 'Ananya', 'Rohan', 'Ishita', 'Vihaan', 'Sara', 'Dev', 'Nila', 'Arjun', 'Zoya']
  const picks = [1, 4, 6, 10]
  const [picked, setPicked] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPicked((p) => (p >= picks.length + 2 ? 0 : p + 1)), 900)
    return () => clearInterval(t)
  }, [])
  const on = new Set(picks.slice(0, picked))
  return (
    <div className="kl-panel p-6">
      <div className="flex items-center justify-between">
        <p className="kl-label text-ink-faint">Class sweep · prompt 3 of 7</p>
        <span className="inline-flex items-center gap-1 text-2xs text-ink-faint">
          <Timer size={12} /> 0:41
        </span>
      </div>
      <p className="mt-2 font-editorial text-2xl leading-snug text-ink">Who asked a question that made the class think?</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {names.map((n, i) => (
          <span key={n} className={cx('kl-chip', on.has(i) && 'is-on')}>
            {on.has(i) && <Check size={12} strokeWidth={3} />}
            {n}
          </span>
        ))}
      </div>
      <p className="mt-4 border-t border-neutral-200/70 pt-3 text-xs text-ink-faint">
        <b className="font-semibold text-ink">{on.size}</b> tapped · Kabir not seen in 4 weeks
      </p>
    </div>
  )
}

function ParentVisual() {
  return (
    <div className="mx-auto w-full max-w-[290px] rounded-[40px] border-[9px] border-ink bg-ink shadow-[var(--shadow-pop)]">
      <div className="overflow-hidden rounded-[31px] bg-paper">
        <div className="bg-accent px-5 pb-5 pt-7 text-white">
          <p className="kl-label text-white/65">Term 1 · Class 3B</p>
          <p className="mt-1 font-editorial text-[1.7rem] leading-[1.05]">Here&rsquo;s who Meera is this term.</p>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-xs leading-relaxed text-ink-soft">
            Meera tests ideas out loud. When something puzzles her, she asks the second question, and then she draws it.
          </p>
          <div className="border-t border-neutral-200/70 pt-3">
            {[
              ['Curiosity', 4],
              ['Empathy', 3],
              ['Persistence', 2],
            ].map(([l, n]) => (
              <div key={l} className="mt-1.5 flex items-center justify-between">
                <span className="text-xs text-ink-soft">{l}</span>
                <span className="flex gap-1">
                  {[1, 2, 3, 4].map((k) => (
                    <span key={k} className={cx('h-2 w-2 rounded-full', k <= n ? 'bg-accent' : 'bg-paper-3')} />
                  ))}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-moss-tint p-3">
            <p className="kl-label text-moss">Try this month</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">Ask her to explain her homework to you, instead of checking it.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChildVisual() {
  return (
    <div className="relative pt-4">
      <p className="font-editorial text-6xl text-ink-faint/70 line-through decoration-1 sm:text-7xl">Rank 27 of 40</p>
      <div className="kl-panel -mt-3 ml-8 space-y-2 p-6">
        <p className="kl-label text-ink-faint">What Kidchemy says</p>
        {['Asks why, until it makes sense.', 'Rebuilds it until it holds.', 'Notices who has been left out.'].map((t, i) => (
          <p key={t} className="kc-rise font-editorial text-2xl leading-snug text-ink" style={{ animationDelay: `${200 + i * 160}ms` }}>
            {t}
          </p>
        ))}
      </div>
    </div>
  )
}

const VISUALS = { schools: SchoolVisual, teachers: TeacherVisual, parents: ParentVisual, children: ChildVisual }

function Audiences({ tab, setTab }) {
  const aud = AUDIENCES.find((a) => a.id === tab)
  const Visual = VISUALS[tab]
  return (
    <section id="for-everyone" className="scroll-mt-16 border-y border-neutral-200/70 bg-card">
      <div className="mx-auto grid max-w-[88rem] gap-12 px-5 py-32 md:px-10 lg:grid-cols-[0.75fr_1.6fr] lg:gap-20">
        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <Label>One set of taps</Label>
            <h2 className="mt-4 font-editorial text-5xl leading-[0.98] tracking-[-0.015em] text-ink sm:text-6xl">
              Four people <em>served.</em>
            </h2>
          </Reveal>
          <div role="tablist" aria-label="Who it is for" className="mt-10 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible">
            {AUDIENCES.map((a, i) => (
              <button
                key={a.id}
                role="tab"
                type="button"
                aria-selected={tab === a.id}
                onClick={() => setTab(a.id)}
                className={cx('kl-tab', tab === a.id && 'is-on')}
              >
                <span className="kc-tnum text-xs text-ink-faint">0{i + 1}</span>
                <span>{a.tab}</span>
                <ArrowRight size={16} className="kl-tab-arrow ml-auto hidden lg:block" />
              </button>
            ))}
          </div>
        </div>

        <div key={aud.id} role="tabpanel" className="kc-tab-panel grid min-w-0 items-start gap-12 xl:grid-cols-[1.15fr_1fr]">
          <div>
            <h3 className="font-editorial text-[2.4rem] leading-[1.04] tracking-[-0.01em] text-ink sm:text-[3.2rem]">{aud.headline}</h3>
            <p className="mt-5 max-w-xl font-editorial text-2xl italic leading-snug text-ink-soft">{aud.pain}</p>
            <ol className="mt-10 border-t border-neutral-200/70">
              {aud.gives.map(([t, b], i) => (
                <li key={t} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-neutral-200/70 py-4">
                  <span className="kc-tnum pt-0.5 text-xs text-ink-faint">0{i + 1}</span>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <p className="font-semibold text-ink">{t}</p>
                    <p className="text-sm text-ink-faint">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="xl:-mr-6 xl:mt-24">
            <Visual />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   TRY IT. The visitor runs a real sweep, and sees what it builds.
   ══════════════════════════════════════════════════════════════════ */

const CLASS = ['Aarav', 'Meera', 'Kabir', 'Ananya', 'Rohan', 'Ishita', 'Vihaan', 'Sara', 'Dev', 'Nila', 'Arjun', 'Zoya']
const TRY_PROMPTS = [
  { q: 'Who asked a question that made the class think?', dim: 'Curiosity', domain: 'Cognitive', line: (n) => `${n} asks the question that makes the class think.` },
  { q: 'Who noticed someone was left out, and did something?', dim: 'Empathy', domain: 'Socio-emotional', line: (n) => `${n} notices who has been left out, and does something about it.` },
  { q: 'Who kept going after it went wrong?', dim: 'Persistence', domain: 'Socio-emotional', line: (n) => `${n} keeps going after it goes wrong.` },
]
const fmt = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function TrySweep() {
  const [step, setStep] = useState(0)
  const [taps, setTaps] = useState(() => TRY_PROMPTS.map(() => []))
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const [now, setNow] = useState(0)
  const [pick, setPick] = useState(null)
  const done = step >= TRY_PROMPTS.length

  useEffect(() => {
    if (!start || end) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [start, end])

  const toggle = (n) => {
    if (done) return
    if (!start) {
      setStart(Date.now())
      setNow(Date.now())
    }
    setTaps((all) =>
      all.map((list, i) => (i === step ? (list.includes(n) ? list.filter((x) => x !== n) : [...list, n]) : list))
    )
  }
  const next = () => {
    if (!start) setStart(Date.now())
    if (step === TRY_PROMPTS.length - 1) {
      setEnd(Date.now())
      const counts = CLASS.map((n) => [n, taps.flat().filter((x) => x === n).length])
      counts.sort((a, b) => b[1] - a[1])
      setPick(counts[0][1] ? counts[0][0] : 'Meera')
    }
    setStep((s) => s + 1)
  }
  const reset = () => {
    setStep(0)
    setTaps(TRY_PROMPTS.map(() => []))
    setStart(null)
    setEnd(null)
    setPick(null)
  }

  const seen = new Set(taps.flat())
  const unseen = CLASS.filter((n) => !seen.has(n))
  const elapsed = start ? (end || now) - start : 0
  const total = taps.flat().length
  const childLines = pick ? TRY_PROMPTS.filter((p, i) => taps[i].includes(pick)) : []

  return (
    <section id="try" className="scroll-mt-16 mx-auto max-w-[88rem] px-5 py-32 md:px-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
        <Reveal>
          <Label>Try it</Label>
          <h2 className="mt-4 font-editorial text-5xl leading-[0.98] tracking-[-0.015em] text-ink sm:text-[4.5rem]">
            Be the teacher <br className="hidden sm:block" />
            for thirty <em>seconds.</em>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="max-w-md text-lg leading-[1.75] text-ink-soft lg:ml-auto">
            Three prompts. Your taps. A parent’s page.
          </p>
        </Reveal>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-0">
        {/* The teacher's screen */}
        <div className="kl-panel relative z-10 p-6 sm:p-8 lg:mr-[-3rem] lg:mt-10 lg:self-start">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {TRY_PROMPTS.map((_, i) => (
                <span key={i} className={cx('h-1 w-10 rounded-full transition-colors duration-300', i < step ? 'bg-accent' : i === step ? 'bg-ink' : 'bg-neutral-200')} />
              ))}
            </div>
            <span className="kc-tnum inline-flex items-center gap-1.5 text-sm text-ink-faint">
              <Timer size={14} /> {fmt(elapsed)}
            </span>
          </div>

          {done ? (
            <div className="kc-fade py-6">
              <p className="font-editorial text-[2.2rem] leading-[1.05] text-ink sm:text-5xl">
                That took you {fmt(elapsed)}.
              </p>
              <p className="mt-4 max-w-md text-base text-ink-soft">
                <b className="font-semibold text-ink">{total} observations</b>, dated and mapped to the HPC.
              </p>
              {unseen.length > 0 && (
                <p className="mt-2 max-w-md text-base text-ink-soft">
                  Not seen: {unseen.slice(0, 3).join(', ')}
                  {unseen.length > 3 ? ` +${unseen.length - 3}` : ''}. Kidchemy flags them.
                </p>
              )}
              <button type="button" onClick={reset} className="kl-link mt-6 inline-flex items-center gap-1.5 text-sm">
                <RotateCcw size={14} /> Start again
              </button>
            </div>
          ) : (
            <>
              <p className="kl-label mt-6 text-ink-faint">Class 3B · prompt {step + 1} of {TRY_PROMPTS.length}</p>
              <p key={step} className="kc-fade mt-2 font-editorial text-[2rem] leading-[1.08] text-ink sm:text-[2.6rem]">
                {TRY_PROMPTS[step].q}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {CLASS.map((n) => {
                  const on = taps[step].includes(n)
                  return (
                    <button key={n} type="button" onClick={() => toggle(n)} className={cx('kl-chip kl-chip-lg', on && 'is-on')} aria-pressed={on}>
                      {on && <Check size={14} strokeWidth={3} />}
                      {n}
                    </button>
                  )
                })}
              </div>
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-neutral-200/70 pt-5">
                <p className="text-sm text-ink-faint">
                  {taps[step].length ? `${taps[step].length} tapped. No one marked down.` : 'Tap everyone it fits.'}
                </p>
                <button type="button" onClick={next} className="kl-btn kl-btn-dark px-5 py-2.5 text-sm">
                  {step === TRY_PROMPTS.length - 1 ? 'Finish' : 'Next prompt'}
                  <ArrowRight size={15} className="kl-btn-arrow" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* What it builds */}
        <div className="rounded-[28px] bg-ink p-6 text-white sm:p-10 lg:pl-20">
          {!done ? (
            <>
              <p className="kl-label text-white/50">Your class, as you see it</p>
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {CLASS.map((n) => {
                  const c = taps.flat().filter((x) => x === n).length
                  return (
                    <div key={n} className={cx('kl-seat', c > 0 && 'is-seen')}>
                      <span className="kl-seat-dot" style={{ '--n': Math.min(c, 3) }} />
                      <span className="text-xs">{n}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
                <div>
                  <p className="font-editorial text-5xl">{seen.size}<span className="text-white/40">/12</span></p>
                  <p className="mt-1 text-xs text-white/55">children seen this sweep</p>
                </div>
                <div>
                  <p className="font-editorial text-5xl">{total}</p>
                  <p className="mt-1 text-xs text-white/55">observations, mapped to the HPC</p>
                </div>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-white/60">
                {start ? (unseen.length ? `Not seen yet: ${unseen.slice(0, 4).join(', ')}${unseen.length > 4 ? '…' : ''}` : 'Every child seen.') : 'Start tapping.'}
              </p>
            </>
          ) : (
            <div className="kc-fade">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="kl-label mr-2 text-white/50">What the parent reads</span>
                {CLASS.filter((n) => seen.has(n)).slice(0, 6).map((n) => (
                  <button key={n} type="button" onClick={() => setPick(n)} className={cx('rounded-full border px-2.5 py-1 text-xs transition-colors duration-200', pick === n ? 'border-white bg-white text-ink' : 'border-white/20 text-white/70 hover:border-white/50')}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-[22px] bg-paper p-6 text-ink">
                <p className="kl-label text-ink-faint">Term 1 · Class 3B</p>
                <p className="mt-1 font-editorial text-[2rem] leading-[1.05]">Here&rsquo;s who {pick} is this term.</p>
                {childLines.length ? (
                  <ul className="mt-4 space-y-2">
                    {childLines.map((p) => (
                      <li key={p.dim} className="kc-rise border-t border-neutral-200/70 pt-2">
                        <p className="font-editorial text-xl leading-snug">{p.line(pick)}</p>
                        <p className="mt-0.5 text-2xs uppercase tracking-[0.12em] text-ink-faint">{p.dim} · {p.domain} · today, by you</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                    Not enough seen yet. No guessing.
                  </p>
                )}
              </div>
              <p className="mt-5 text-sm text-white/60">Every line traces to a tap.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   HPC + PROOF. Click the wheel; see the evidence under every claim.
   ══════════════════════════════════════════════════════════════════ */

const LEVELS = ['Stream', 'Mountain', 'Sky']
const HPC = [
  {
    id: 'physical',
    label: 'Physical',
    items: [
      { label: 'Movement', level: 1, ev: [['Mr. Iyer', '4 Jul', 'Ran the relay without dropping the baton, then showed Dev the hand-off.']] },
      { label: 'Self-care', level: 1, ev: [['Ms. Rao', '18 Jul', 'Packed up her own station without a reminder, all week.']] },
    ],
  },
  {
    id: 'socio',
    label: 'Socio-emotional',
    lines: ['Socio-', 'emotional'],
    items: [
      { label: 'Empathy', level: 2, ev: [['Ms. Rao', '14 Aug', 'Noticed Kabir eating alone and pulled him into the lunch game.'], ['Mr. Iyer', '2 Sep', 'Waited at the gate for the slowest walker.']] },
      { label: 'Persistence', level: 1, ev: [['Mr. Iyer', '5 Sep', 'Rebuilt the paper bridge four times until it held a textbook.']] },
    ],
  },
  {
    id: 'cognitive',
    label: 'Cognitive',
    items: [
      { label: 'Curiosity', level: 2, ev: [['Ms. Rao', '2 Sep', 'Asked why the moon follows the car, then drew three ways to test it.'], ['Ms. D’Souza', '11 Sep', 'Took the class clock apart, with permission, to see what ticks.']] },
      { label: 'Logic', level: 2, ev: [['Ms. D’Souza', '18 Aug', 'Sorted the class library by a rule she invented, and explained the rule.']] },
    ],
  },
  {
    id: 'language',
    label: 'Language',
    items: [
      { label: 'Speaking', level: 2, ev: [['Ms. Rao', '9 Sep', 'Explained her fraction method to the class using a roti.']] },
      { label: 'Writing', level: 0, ev: [['Ms. Rao', '16 Sep', 'Knows the idea, struggles to put it in three lines. The gap is expression, not understanding.']] },
    ],
  },
  {
    id: 'aesthetic',
    label: 'Aesthetic & cultural',
    lines: ['Aesthetic &', 'cultural'],
    items: [
      { label: 'Creativity', level: 1, ev: [['Mr. Iyer', '22 Aug', 'Turned leftover chart paper into a board game for her table.']] },
      { label: 'Expression', level: 0, ev: [] },
    ],
  },
]

const R = 230
function polar(a, r) {
  const t = ((a - 90) * Math.PI) / 180
  return [R + r * Math.cos(t), R + r * Math.sin(t)]
}
function arc(a0, a1, r0, r1) {
  const g = 0.9
  const [x0, y0] = polar(a0 + g, r1)
  const [x1, y1] = polar(a1 - g, r1)
  const [x2, y2] = polar(a1 - g, r0)
  const [x3, y3] = polar(a0 + g, r0)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M${x0} ${y0} A${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`
}

function HpcWheel() {
  const [sel, setSel] = useState({ d: 2, i: 0 })
  const dom = HPC[sel.d]
  const item = dom.items[sel.i]
  const seg = 360 / HPC.length
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
      <div className="relative mx-auto w-full max-w-[620px]">
        <svg viewBox="-60 0 580 460" className="h-auto w-full overflow-visible" role="group" aria-label="The five Holistic Progress Card domains. Choose a competency to see the evidence.">
          {HPC.map((d, di) => {
            const a0 = di * seg
            const a1 = a0 + seg
            const [lx, ly] = polar(a0 + seg / 2, 92)
            return (
              <g key={d.id}>
                <path d={arc(a0, a1, 58, 128)} className={cx('kl-arc-in', sel.d === di && 'is-on')} onClick={() => setSel({ d: di, i: 0 })} />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="kl-arc-text" style={{ fontSize: 12 }}>
                  {(d.lines || [d.label]).map((w, k, arr) => (
                    <tspan key={w} x={lx} dy={k === 0 ? (arr.length > 1 ? -7 : 0) : 14}>
                      {w}
                    </tspan>
                  ))}
                </text>
                {d.items.map((it, ii) => {
                  const b0 = a0 + (seg / 2) * ii
                  const b1 = b0 + seg / 2
                  const on = sel.d === di && sel.i === ii
                  const [tx, ty] = polar(b0 + seg / 4, 214)
                  const r1 = 150 + it.level * 22
                  return (
                    <g key={it.label} className="cursor-pointer" onClick={() => setSel({ d: di, i: ii })} role="button" tabIndex={0} aria-label={`${d.label}: ${it.label}`} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel({ d: di, i: ii })}>
                      <path d={arc(b0, b1, 134, 200)} className="kl-arc-track" />
                      <path d={arc(b0, b1, 134, r1)} className={cx('kl-arc-out', on && 'is-on')} style={{ '--lvl': it.level }} />
                      <text x={tx} y={ty} textAnchor={tx < R - 10 ? 'end' : tx > R + 10 ? 'start' : 'middle'} dominantBaseline="middle" className={cx('kl-arc-label', on && 'is-on')}>
                        {it.label}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
          <circle cx={R} cy={R} r="52" fill="none" stroke="rgba(255,255,255,.18)" />
          <text x={R} y={R - 6} textAnchor="middle" className="kl-arc-center">Meera</text>
          <text x={R} y={R + 12} textAnchor="middle" className="kl-arc-center-sub">Term 1</text>
        </svg>
        <div className="mt-2 flex justify-center gap-5 text-2xs uppercase tracking-[0.14em] text-white/55">
          {LEVELS.map((l, i) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="inline-block h-2 rounded-full bg-white" style={{ width: 8 + i * 8, opacity: 0.4 + i * 0.3 }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <div key={`${sel.d}-${sel.i}`} className="kc-fade">
        <p className="kl-label text-white/55">{dom.label}</p>
        <p className="mt-2 font-editorial text-5xl leading-none sm:text-6xl">{item.label}</p>
        <div className="mt-5 flex items-center gap-2">
          {LEVELS.map((l, i) => (
            <span key={l} className={cx('rounded-full border px-3 py-1 text-xs transition-colors duration-200', i === item.level && item.ev.length ? 'border-white bg-white text-accent-ink' : 'border-white/20 text-white/50')}>
              {l}
            </span>
          ))}
        </div>
        <div className="mt-8 border-t border-white/15">
          {item.ev.length ? (
            item.ev.map(([who, when, what]) => (
              <figure key={what} className="border-b border-white/15 py-4">
                <blockquote className="font-editorial text-[1.45rem] leading-snug">&ldquo;{what}&rdquo;</blockquote>
                <figcaption className="mt-2 text-2xs uppercase tracking-[0.14em] text-white/55">
                  {who} · {when}
                </figcaption>
              </figure>
            ))
          ) : (
            <p className="border-b border-white/15 py-4 font-editorial text-[1.45rem] leading-snug text-white/70">
              Not observed yet. No guessing.
            </p>
          )}
        </div>
        <p className="mt-5 text-sm text-white/60">Click the wheel. See the proof.</p>
      </div>
    </div>
  )
}

const PROOFS = [
  ['Nothing is invented.', 'Every line has a date and a teacher.'],
  ['It measures its own bias.', 'Quiet children get flagged, not forgotten.'],
  ['Teachers can withhold.', 'Concerns stay with staff.'],
  ['Thin means thin.', 'Little seen, little said.'],
]

function useScrollVar(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 800
      el.style.setProperty('--p', Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75))).toFixed(3))
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
}

function HpcAndProof() {
  const ref = useRef(null)
  useScrollVar(ref)
  return (
    <section ref={ref} id="hpc" className="scroll-mt-16">
      <div className="kc-expand bg-accent text-white">
        <div className="mx-auto max-w-[88rem] px-5 py-32 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <h2 className="font-editorial text-5xl leading-[0.98] tracking-[-0.015em] sm:text-[4.6rem]">
              Built for the progress card. <em className="text-white/70">Built to be believed.</em>
            </h2>
            <p className="max-w-md text-lg leading-[1.75] text-white/75 lg:ml-auto">
              Five domains. Levels, not marks. KG to Class 8.
            </p>
          </div>

          <div className="mt-20">
            <HpcWheel />
          </div>

          <div className="mt-28 grid gap-12 border-t border-white/15 pt-14 lg:grid-cols-[0.8fr_1.6fr]">
            <p className="font-editorial text-4xl leading-[1.05]">
              Four rules that keep it honest.
            </p>
            <ol className="grid gap-x-12 sm:grid-cols-2">
              {PROOFS.map(([t, b], i) => (
                <Reveal as="li" key={t} delay={i * 90} className={cx('border-t border-white/15 py-6', i % 2 === 1 && 'sm:mt-14')}>
                  <p className="kc-tnum text-xs text-white/45">0{i + 1}</p>
                  <p className="mt-2 font-editorial text-[1.7rem] leading-tight">{t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{b}</p>
                </Reveal>
              ))}
            </ol>
          </div>

          <div className="mt-16 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {Object.values(FRAMEWORKS).map((f) => (
                <span key={f.id} title={f.oneLine} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/75 transition-colors duration-200 hover:border-white/60 hover:text-white">
                  {f.label}
                </span>
              ))}
            </div>
            <p className="max-w-md text-sm text-white/60">No learning-style labels. No careers before Class 9.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   THE LETTER. Flip on the evidence; every line shows its source.
   ══════════════════════════════════════════════════════════════════ */

function Evidence({ on, note, children }) {
  return (
    <span className={cx('kl-ev', on && 'is-on')}>
      {children}
      <span className="kl-ev-note" aria-hidden={!on}>
        {note}
      </span>
    </span>
  )
}

function Letter() {
  const ref = useRef(null)
  const inView = useInView(ref, '-30% 0px -30% 0px')
  const [on, setOn] = useState(false)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (inView && !touched) {
      const t = setTimeout(() => setOn(true), 1400)
      return () => clearTimeout(t)
    }
  }, [inView, touched])

  return (
    <section id="sample" className="scroll-mt-16 mx-auto max-w-[88rem] px-5 py-32 md:px-10">
      <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div className="lg:pt-16">
          <Reveal>
            <Label>What a parent reads</Label>
            <h2 className="mt-4 font-editorial text-5xl leading-[0.98] tracking-[-0.015em] text-ink sm:text-6xl">
              Not a dashboard. <em>A letter.</em>
            </h2>
            <p className="mt-6 max-w-sm text-lg text-ink-soft">Plain words. Every line sourced.</p>
          </Reveal>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => {
              setTouched(true)
              setOn((v) => !v)
            }}
            className="kl-switch mt-8"
          >
            <span className={cx('kl-switch-track', on && 'is-on')}>
              <span className="kl-switch-thumb" />
            </span>
            <span className="text-sm font-medium text-ink">Show the evidence</span>
          </button>
        </div>

        <article ref={ref} className="kl-panel relative p-7 sm:p-12 lg:mr-[-2rem]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/70 pb-5">
            <div>
              <p className="font-editorial text-3xl text-ink">Meera, Class 3B</p>
              <p className="mt-1 text-xs text-ink-faint">From 46 observations by 3 teachers, June to September</p>
            </div>
            <span className="kl-label rounded-full border border-neutral-200 px-2.5 py-1 text-ink-faint">Sample</span>
          </div>

          <Label className="mt-8">Who Meera is</Label>
          <p className="mt-3 font-editorial text-[1.75rem] leading-[1.3] text-ink sm:text-[2.1rem]">
            <Evidence on={on} note="Curiosity · 9 observations · Ms. Rao, Ms. D’Souza">
              Meera tests ideas out loud.
            </Evidence>{' '}
            <Evidence on={on} note="“Asked why the moon follows the car” · 2 Sep">
              When something puzzles her she asks the second question,
            </Evidence>{' '}
            <Evidence on={on} note="Drew it 6 of 9 times · Mr. Iyer">
              and then she draws it until it makes sense.
            </Evidence>
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <Label>At her best when</Label>
              <p className="mt-2 text-base leading-[1.75] text-ink-soft">
                <Evidence on={on} note="Concentration 25+ min in 4 hands-on tasks">
                  She can work with her hands first and explain after.
                </Evidence>{' '}
                Long silent writing tasks hide what she knows.
              </p>
            </div>
            <div>
              <Label>Next step for her</Label>
              <p className="mt-2 text-base leading-[1.75] text-ink-soft">
                <Evidence on={on} note="Writing · Stream · Ms. Rao, 16 Sep">
                  Turning a spoken explanation into three written lines.
                </Evidence>{' '}
                The gap is expression, not understanding.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 border-t border-neutral-200/70 pt-8 sm:grid-cols-[1fr_1fr]">
            <div>
              <Label className="text-moss">Try this at home</Label>
              <ul className="mt-2 space-y-1.5 text-base text-ink-soft">
                <li>Ask her to teach you her homework, instead of checking it.</li>
                <li>Give her something broken to take apart and fix.</li>
              </ul>
            </div>
            <div>
              <Label>Ask her tonight</Label>
              <p className="mt-2 font-editorial text-2xl leading-snug text-ink">
                &ldquo;What&rsquo;s something you figured out by yourself this week?&rdquo;
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SAFETY. Pick a person; see exactly what they can open.
   ══════════════════════════════════════════════════════════════════ */

const DATA_ITEMS = [
  'Observations the teacher shared',
  'Notes the teacher kept school-only',
  'Which classmate wrote an appreciation',
  'The Holistic Progress Card',
  'Who opened the record, and when',
]
const VIEWERS = [
  { id: 'parent', label: 'Meera’s parent', sees: [0, 3], why: 'Sticker code, first name, and consent.' },
  { id: 'teacher', label: 'Meera’s teacher', sees: [0, 1, 2, 3], why: 'Own school only. Own notes only.' },
  { id: 'other', label: 'A teacher at another school', sees: [], why: 'Refused by the database.' },
  { id: 'admin', label: 'The school’s admin', sees: [0, 1, 2, 3, 4], why: 'Two-step sign-in. Every view logged.' },
  { id: 'stranger', label: 'Another parent', sees: [], why: 'Five wrong tries, then locked.' },
  { id: 'ads', label: 'Advertisers, anyone else', sees: [], why: 'Never.' },
]

const PROMISES = [
  ['Consent first.', 'Item by item. Withdraw in one tap.'],
  ['The school decides.', 'DPDP Act: school owns, we process.'],
  ['See it, fix it, erase it.', 'From the parent’s home page.'],
  ['Locked at the database.', 'Encrypted. Row-level rules. Two-step admin.'],
  ['Guard rails for teachers.', 'Sensitive notes flagged before sharing.'],
  ['A plan for bad days.', 'Families told fast. Board within 72 hours.'],
]

function Safety() {
  const [v, setV] = useState('parent')
  const viewer = VIEWERS.find((x) => x.id === v)
  return (
    <section id="safety" className="scroll-mt-16 border-y border-neutral-200/70 bg-card">
      <div className="mx-auto max-w-[88rem] px-5 py-32 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <Reveal>
            <Label>Safety and privacy</Label>
            <h2 className="mt-4 font-editorial text-5xl leading-[0.98] tracking-[-0.015em] text-ink sm:text-[4.5rem]">
              A child&rsquo;s record, <em>locked like it matters.</em>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="max-w-md text-lg leading-[1.75] text-ink-soft lg:ml-auto">
              Pick a person. See what they can open.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:gap-16">
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
            {VIEWERS.map((x) => (
              <button key={x.id} type="button" onClick={() => setV(x.id)} className={cx('kl-tab kl-tab-sm', v === x.id && 'is-on')}>
                <span>{x.label}</span>
                <span className="ml-auto hidden font-satoshi text-xs text-ink-faint lg:inline">{x.sees.length ? `${x.sees.length} of 5` : 'nothing'}</span>
              </button>
            ))}
          </div>
          <div>
            <ul className="border-t border-neutral-200/70">
              {DATA_ITEMS.map((d, i) => {
                const open = viewer.sees.includes(i)
                return (
                  <li key={d} className={cx('kl-perm', open && 'is-open')} style={{ transitionDelay: `${i * 45}ms` }}>
                    <span className="kl-perm-icon">{open ? <Unlock size={15} /> : <Lock size={15} />}</span>
                    <span className="flex-1">{d}</span>
                    <span className="text-xs">{open ? 'can see' : 'locked'}</span>
                  </li>
                )
              })}
            </ul>
            <p key={v} className="kc-fade mt-6 max-w-xl font-editorial text-2xl leading-snug text-ink">
              {viewer.why}
            </p>
          </div>
        </div>

        <div className="mt-28 grid gap-x-16 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
          {PROMISES.map(([t, b], i) => (
            <Reveal key={t} delay={(i % 3) * 90} className={cx('border-t border-neutral-200/70 py-7', i % 3 === 1 && 'lg:mt-10', i % 3 === 2 && 'lg:mt-20')}>
              <p className="font-editorial text-[1.7rem] leading-tight text-ink">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12">
          <Link to="/privacy" className="kl-link inline-flex items-center gap-1.5 text-base">
            Read the full privacy notice <ArrowUpRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   ABOUT
   ══════════════════════════════════════════════════════════════════ */

function About() {
  const [photoOk, setPhotoOk] = useState(Boolean(FOUNDER.photo))
  return (
    <section id="about" className="scroll-mt-16 mx-auto max-w-[88rem] px-5 py-32 md:px-10">
      <div className="grid items-start gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
        <Reveal className="lg:sticky lg:top-28">
          <figure>
            <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[28px] bg-accent">
              {photoOk ? (
                <img src={FOUNDER.photo} alt={`${FOUNDER.name}, founder of Kidchemy`} className="h-full w-full object-cover" loading="lazy" onError={() => setPhotoOk(false)} />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-white">
                  <Mark size={96} tone="white" />
                  <span className="kl-label text-white/60">Photo coming soon</span>
                </div>
              )}
            </div>
            <figcaption className="mt-4 flex max-w-sm items-baseline justify-between gap-3 border-t border-neutral-200/70 pt-3">
              <span className="font-editorial text-xl text-ink">{FOUNDER.name}</span>
              <span className="text-xs text-ink-faint">{[FOUNDER.role, FOUNDER.college].filter(Boolean).join(' · ')}</span>
            </figcaption>
          </figure>
        </Reveal>

        <div>
          <Reveal>
            <Label>Why I&rsquo;m building this</Label>
            <h2 className="mt-4 font-editorial text-5xl leading-[1] tracking-[-0.015em] text-ink sm:text-[4rem]">
              Every child deserves to be <em>described,</em> not just measured.
            </h2>
          </Reveal>
          <Reveal delay={80} className="mt-10 max-w-2xl space-y-3 text-xl leading-snug text-ink-soft">
            <p>A whole year of a child, folded into one number.</p>
            <p>Teachers see far more. It has nowhere to go.</p>
            <p className="text-ink">Kidchemy gives it somewhere to go.</p>
          </Reveal>

          <Reveal delay={140}>
            <blockquote className="mt-14 border-l border-accent pl-6 font-editorial text-[2rem] leading-[1.2] text-ink sm:text-[2.4rem]">
              A country where every report card comes with a portrait. Where a parent&rsquo;s first question is &ldquo;what lights her up?&rdquo; and not &ldquo;what did she get?&rdquo;
            </blockquote>
          </Reveal>

          <ol className="mt-14 max-w-2xl">
            {[
              ['Now', 'Two pilot schools, side by side with teachers'],
              ['Next', 'Every progress card written from evidence'],
              ['Always', 'Free for parents. No ads.'],
            ].map(([k, v], i) => (
              <Reveal as="li" key={k} delay={180 + i * 80} className="relative grid grid-cols-[5.5rem_1fr] gap-4 border-t border-neutral-200/70 py-4">
                <span className="kl-label pt-1 text-accent">{k}</span>
                <span className="text-base leading-relaxed text-ink-soft">{v}</span>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={300} className="mt-12 flex flex-wrap gap-3">
            <a href={`mailto:${FOUNDER.email}`} className="kl-btn kl-btn-ghost px-5 py-2.5 text-sm">
              <MessageCircle size={15} /> Write to me
            </a>
            {FOUNDER.linkedin && (
              <a href={FOUNDER.linkedin} target="_blank" rel="noreferrer" className="kl-btn kl-btn-ghost px-5 py-2.5 text-sm">
                LinkedIn <ArrowUpRight size={15} />
              </a>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════════════════════ */

const NAV = [
  ['Schools', 'schools'],
  ['Teachers', 'teachers'],
  ['Parents', 'parents'],
]

const FLOW = [
  ['Teachers observe', 'a few taps a week'],
  ['Kidchemy builds profile', 'every tap, dated'],
  ['Parents see the child', 'HPC and a parent page'],
]

export default function Landing() {
  useReveal()
  const [tab, setTab] = useState('schools')

  const goTab = (id) => {
    setTab(id)
    document.getElementById('for-everyone')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="kl min-h-dvh overflow-x-clip bg-paper font-satoshi text-ink">
      {/* ── Nav: the logo's teal ─────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-accent text-white">
        <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-4 px-5 md:px-10">
          <Link to="/" className="flex items-center gap-2" aria-label="Kidchemy home">
            <Mark size={28} tone="white" />
            <span className="text-xl font-bold tracking-[-0.03em]">Kidchemy</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/75 lg:flex">
            {NAV.map(([l, id]) => (
              <button key={id} type="button" onClick={() => goTab(id)} className="kl-nav">
                {l}
              </button>
            ))}
            <a href="#safety" className="kl-nav">Safety</a>
            <a href="#about" className="kl-nav">About</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="kl-nav text-sm text-white/75">
              Sign in
            </Link>
            <PilotButton light />
          </div>
        </div>
      </header>

      {/* ── Hero: fits one screen ──────────────────────────────── */}
      <section className="kl-hero mx-auto grid max-w-[88rem] gap-10 px-5 pb-20 pt-10 md:px-10 lg:grid-cols-12 lg:items-center lg:gap-0 lg:py-0">
        <div className="relative z-10 lg:col-start-1 lg:col-end-8 lg:row-start-1">
          <h1 className="kl-hero-h font-satoshi font-bold text-ink">
            <span className="kc-line">
              <span style={{ animationDelay: '120ms' }}>Marks say</span>
            </span>
            <span className="kc-line">
              <span style={{ animationDelay: '220ms' }}>how much.</span>
            </span>
            <span className="kc-line">
              <span style={{ animationDelay: '360ms' }}>
                We show <span className="text-accent">who.</span>
              </span>
            </span>
          </h1>
          <p className="kc-rise mt-6 max-w-[27rem] text-xl leading-snug text-ink-soft sm:text-2xl" style={{ animationDelay: '600ms' }}>
            Everyday teacher observations, turned into a living profile of every child.
          </p>
          <div className="kc-rise mt-8 flex flex-wrap items-center gap-6" style={{ animationDelay: '750ms' }}>
            <PilotButton size="lg" />
            <a href="#try" className="kl-link text-base">
              Try being the teacher
            </a>
          </div>
          <ol className="kc-rise mt-10 grid max-w-[34rem] grid-cols-3 border-t border-neutral-200/70 pt-4" style={{ animationDelay: '900ms' }} aria-label="How it works">
            {FLOW.map(([t, sub], i) => (
              <li key={t} className="relative pr-4">
                <span className="kc-tnum text-xs text-accent">0{i + 1}</span>
                <p className="mt-1 text-sm font-semibold leading-snug text-ink">{t}</p>
                <p className="text-xs text-ink-faint">{sub}</p>

              </li>
            ))}
          </ol>
        </div>
        <div className="relative lg:col-start-7 lg:col-end-13 lg:row-start-1 xl:-mr-8">
          <HeroTree />
        </div>
      </section>

      <OneNumberStory />
      <Audiences tab={tab} setTab={setTab} />
      <TrySweep />
      <HpcAndProof />
      <Letter />
      <Safety />
      <About />

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-ink text-white">
        <div className="mx-auto max-w-[88rem] px-5 pb-12 pt-28 md:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <p className="font-editorial text-5xl leading-[0.98] tracking-[-0.015em] sm:text-[5rem]">
              A truer picture of <em className="text-white/60">every</em> child.
            </p>
            <div className="lg:justify-self-end">
              <PilotButton size="lg" light />
            </div>
          </div>
          <div className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2.5">
              <Mark size={28} tone="light" />
              <span className="text-lg font-bold tracking-[-0.03em]">Kidchemy</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
              {NAV.map(([l, id]) => (
                <button key={id} type="button" onClick={() => goTab(id)} className="transition-colors duration-200 hover:text-white">
                  For {l.toLowerCase()}
                </button>
              ))}
              <a href="#safety" className="transition-colors duration-200 hover:text-white">Safety</a>
              <Link to="/privacy" className="transition-colors duration-200 hover:text-white">Privacy</Link>
              <a href="#about" className="transition-colors duration-200 hover:text-white">About</a>
              <Link to="/login" className="transition-colors duration-200 hover:text-white">Sign in</Link>
            </div>
          </div>
          <p className="mt-6 text-xs text-white/45">No advertising, no trackers, ever.</p>
        </div>
      </footer>
    </div>
  )
}
