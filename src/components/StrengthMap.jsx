import { useState } from 'react'

const W = 420
const H = 330
const CX = W / 2
const CY = H / 2
const R = 108

function pointAt(i, total, radius) {
  const angle = (Math.PI * 2 * i) / total - Math.PI / 2
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)]
}

export default function StrengthMap({ dims }) {
  const [active, setActive] = useState(null)
  const total = dims.length
  const poly = dims
    .map((d, i) => pointAt(i, total, (Math.max(d.score, 4) / 100) * R).join(','))
    .join(' ')

  return (
    <div className="grid gap-8 md:grid-cols-[360px_1fr] md:items-start">
      <div className="mx-auto w-full max-w-[380px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
          aria-label="Observed strengths across seven dimensions">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon
              key={f}
              points={dims
                .map((_, i) => pointAt(i, total, R * f).join(','))
                .join(' ')}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
          ))}
          {dims.map((_, i) => {
            const [x, y] = pointAt(i, total, R)
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke="var(--color-line)"
                strokeWidth="1"
              />
            )
          })}
          <polygon
            points={poly}
            fill="var(--color-moss)"
            fillOpacity="0.18"
            stroke="var(--color-moss)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {dims.map((d, i) => {
            const [x, y] = pointAt(i, total, (Math.max(d.score, 4) / 100) * R)
            return (
              <circle
                key={d.id}
                cx={x}
                cy={y}
                r={active === d.id ? 6 : 4}
                fill={active === d.id ? 'var(--color-clay)' : 'var(--color-moss)'}
              />
            )
          })}
          {dims.map((d, i) => {
            const [x, y] = pointAt(i, total, R + 22)
            return (
              <text
                key={d.id}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight="600"
                fill={active === d.id ? 'var(--color-clay)' : 'var(--color-ink-soft)'}
              >
                {d.label}
              </text>
            )
          })}
        </svg>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
        {dims.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onMouseEnter={() => setActive(d.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(d.id)}
              onBlur={() => setActive(null)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                active === d.id
                  ? 'border-clay bg-clay-tint'
                  : 'border-line bg-white/60'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="font-semibold text-ink">{d.label}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  {d.band}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-paper-2">
                <div
                  className="h-1.5 rounded-full bg-moss transition-all"
                  style={{ width: `${Math.max(d.score, 2)}%` }}
                />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.blurb}</p>
              {d.evidence.length > 0 && (
                <p className="mt-2 text-xs text-ink-faint">
                  Seen as: {d.evidence.slice(0, 2).map((e) => e.label.toLowerCase()).join(', ')}
                </p>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
