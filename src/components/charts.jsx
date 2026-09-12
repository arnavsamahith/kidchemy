import { useId, useState } from 'react'
import { RAMP, rampInk, rampStep } from '../data/analytics.js'

/* ══════════════════════════════════════════════════════════════════
   Shared bits
   ══════════════════════════════════════════════════════════════════ */

export function ChartFrame({ title, subtitle, legend, actions, children, footer }) {
  return (
    <figure className="m-0 rounded-[14px] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
      <figcaption className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight text-ink">{title}</h3>
          {subtitle && (
            <p className="mt-1 max-w-prose text-sm text-ink-faint">{subtitle}</p>
          )}
        </div>
        {actions}
      </figcaption>
      {legend}
      {children}
      {footer && <p className="mt-4 text-xs text-ink-faint">{footer}</p>}
    </figure>
  )
}

export function Legend({ items }) {
  if (!items || items.length < 2) return null
  return (
    <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-sm text-ink-soft">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  )
}

function Tooltip({ x, y, children }) {
  return (
    <div
      className="pointer-events-none absolute z-20 max-w-[240px] rounded-[12px] border border-line bg-card px-3 py-2 text-xs leading-relaxed text-ink shadow-[0_8px_28px_rgba(28,28,28,0.10)]"
      style={{ left: x, top: y, transform: 'translate(-50%, calc(-100% - 12px))' }}
    >
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Stat tile: when the answer is a number, not a chart
   ══════════════════════════════════════════════════════════════════ */

export function StatTile({ label, value, hint, tone = 'ink', icon: Icon }) {
  const toneClass =
    tone === 'warn'
      ? 'text-warn'
      : tone === 'good'
        ? 'text-good'
        : 'text-ink'
  return (
    <div className="rounded-[14px] border border-line bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        {Icon && <Icon size={15} />}
        {label}
      </div>
      <p className={`mt-2 text-[32px] font-semibold leading-none ${toneClass}`}>
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-relaxed text-ink-faint">{hint}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Heatmap: every child against every dimension
   Sequential: one hue, light → dark. Value also printed in the cell,
   so the reading never depends on colour alone.
   ══════════════════════════════════════════════════════════════════ */

export function DimensionHeatmap({ matrix, onSelectStudent }) {
  const [hover, setHover] = useState(null)

  if (!matrix.rows.length) {
    return <p className="text-sm text-ink-faint">No children in this class yet.</p>
  }

  return (
    <div className="relative">
      <div className="kc-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="w-40 pb-2 pr-3 text-left align-bottom text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Child
              </th>
              {matrix.dimensions.map((d) => (
                <th
                  key={d.id}
                  scope="col"
                  className="pb-2 text-center align-bottom text-[11px] font-semibold leading-tight text-ink-soft"
                >
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="pr-3 text-left text-sm font-medium text-ink"
                >
                  {onSelectStudent ? (
                    <button
                      type="button"
                      onClick={() => onSelectStudent(row.id)}
                      className="text-left underline-offset-4 hover:underline"
                    >
                      {row.name}
                    </button>
                  ) : (
                    row.name
                  )}
                </th>
                {row.cells.map((c) => {
                  const step = rampStep(c.score)
                  return (
                    <td key={c.id} className="p-0">
                      <div
                        role="img"
                        aria-label={`${row.name}, ${c.label}: ${c.score} out of 100, ${c.band}`}
                        tabIndex={0}
                        onMouseEnter={(e) =>
                          setHover({
                            x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2,
                            y: e.currentTarget.offsetTop,
                            row,
                            cell: c,
                          })
                        }
                        onMouseLeave={() => setHover(null)}
                        onFocus={(e) =>
                          setHover({
                            x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2,
                            y: e.currentTarget.offsetTop,
                            row,
                            cell: c,
                          })
                        }
                        onBlur={() => setHover(null)}
                        className="kc-tnum flex h-11 items-center justify-center rounded-lg text-[13px] font-semibold transition"
                        style={{ background: RAMP[step], color: rampInk(step) }}
                      >
                        {c.score || '-'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hover && (
        <Tooltip x={hover.x} y={hover.y}>
          <strong className="font-semibold">{hover.row.name}</strong>
          <br />
          {hover.cell.label}: {hover.cell.score}/100
          <br />
          <span className="text-ink-faint">{hover.cell.band}</span>
        </Tooltip>
      )}

      <div className="mt-4 flex items-center gap-3 text-xs text-ink-faint">
        <span>Not yet observed</span>
        <span className="flex gap-[2px]">
          {RAMP.map((c, i) => (
            <span
              key={i}
              className="h-3 w-7 rounded-[3px]"
              style={{ background: c }}
              aria-hidden="true"
            />
          ))}
        </span>
        <span>A signature strength</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Growth over terms: one line per child
   ══════════════════════════════════════════════════════════════════ */

const G = { w: 720, h: 260, l: 40, r: 104, t: 18, b: 34 }
const LABEL_GAP = 15

/** Keep end-labels from stacking on top of each other when lines converge. */
function placeLabels(series, y) {
  const items = series
    .map((s) => {
      const last = s.points[s.points.length - 1]
      return {
        id: s.id,
        lineY: y(last.value),
        labelY: y(last.value),
        text: `${s.name.split(' ')[0]} · ${last.value}`,
      }
    })
    .sort((a, b) => a.lineY - b.lineY)

  for (let i = 1; i < items.length; i += 1) {
    const gap = items[i].labelY - items[i - 1].labelY
    if (gap < LABEL_GAP) items[i].labelY = items[i - 1].labelY + LABEL_GAP
  }
  return items
}

export function GrowthLines({ growth }) {
  const clipId = useId()
  const [hoverIdx, setHoverIdx] = useState(null)
  const { periods, series } = growth

  if (periods.length < 2) {
    return (
      <p className="text-sm text-ink-faint">
        Growth needs at least two terms of observations. Keep logging and this
        chart fills itself in.
      </p>
    )
  }

  const plotW = G.w - G.l - G.r
  const plotH = G.h - G.t - G.b
  const x = (i) => G.l + (plotW * i) / (periods.length - 1)
  const y = (v) => G.t + plotH - (plotH * v) / 100
  const ticks = [0, 25, 50, 75, 100]

  return (
    <div className="relative">
      <Legend items={series.map((s) => ({ label: s.name, color: s.color }))} />

      <svg
        viewBox={`0 0 ${G.w} ${G.h}`}
        className="w-full"
        role="img"
        aria-label="Average observed strength for each child at the end of each term"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={G.l} y={G.t} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={G.l}
              x2={G.l + plotW}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <text
              x={G.l - 10}
              y={y(t) + 4}
              textAnchor="end"
              className="kc-tnum"
              fontSize="11"
              fill="var(--color-ink-faint)"
            >
              {t}
            </text>
          </g>
        ))}

        {periods.map((p, i) => (
          <text
            key={p}
            x={x(i)}
            y={G.h - 10}
            textAnchor="middle"
            fontSize="12"
            fill="var(--color-ink-soft)"
          >
            {p}
          </text>
        ))}

        {hoverIdx !== null && (
          <line
            x1={x(hoverIdx)}
            x2={x(hoverIdx)}
            y1={G.t}
            y2={G.t + plotH}
            stroke="var(--color-ink-faint)"
            strokeWidth="1"
          />
        )}

        <g clipPath={`url(#${clipId})`}>
          {series.map((s) => (
            <polyline
              key={s.id}
              points={s.points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>

        {series.map((s) =>
          s.points.map((p, i) => (
            <circle
              key={`${s.id}-${i}`}
              cx={x(i)}
              cy={y(p.value)}
              r="4.5"
              fill={s.color}
              stroke="var(--color-card)"
              strokeWidth="2"
            />
          ))
        )}

        {/* Direct end-labels. When lines converge the labels are nudged
            apart and a leader line keeps each one attached to its own. */}
        {placeLabels(series, y).map((l) => (
          <g key={`lbl-${l.id}`}>
            {Math.abs(l.labelY - l.lineY) > 1 && (
              <polyline
                points={`${G.l + plotW + 4},${l.lineY} ${G.l + plotW + 9},${l.labelY} ${G.l + plotW + 13},${l.labelY}`}
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="1"
              />
            )}
            <text
              x={G.l + plotW + 16}
              y={l.labelY + 4}
              fontSize="12"
              fill="var(--color-ink-soft)"
            >
              {l.text}
            </text>
          </g>
        ))}

        {periods.map((p, i) => (
          <rect
            key={`hit-${p}`}
            x={x(i) - plotW / (periods.length * 2)}
            y={G.t}
            width={plotW / periods.length}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
          />
        ))}
      </svg>

      {hoverIdx !== null && (
        <div className="mt-3 rounded-[12px] border border-line bg-paper-2 px-4 py-3 text-sm">
          <p className="font-semibold text-ink">{periods[hoverIdx]}</p>
          <ul className="mt-1.5 grid gap-1">
            {series.map((s) => {
              const p = s.points[hoverIdx]
              return (
                <li key={s.id} className="flex items-center gap-2 text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="font-medium text-ink">{s.name}</span>
                  <span className="kc-tnum">{p.value}/100</span>
                  {p.moved.length > 0 && (
                    <span className="text-ink-faint">· moved: {p.moved.join(', ')}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Tag frequency: one series, horizontal bars
   ══════════════════════════════════════════════════════════════════ */

export function TagBars({ data, onSelectTag, activeTag }) {
  if (!data.length) {
    return <p className="text-sm text-ink-faint">No tags recorded yet.</p>
  }
  const max = Math.max(...data.map((d) => d.count))
  return (
    <ul className="grid gap-2.5">
      {data.map((d) => {
        const pct = (d.count / max) * 100
        const active = activeTag === d.id
        return (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onSelectTag?.(active ? null : d.id)}
              className={`grid w-full grid-cols-[minmax(0,1fr)_28px] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition ${
                active ? 'bg-paper-2' : 'hover:bg-paper-2'
              }`}
              title={`${d.count} observation${d.count === 1 ? '' : 's'} · ${d.group}`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">{d.label}</span>
                <span className="mt-1 block h-2.5 w-full rounded-full bg-paper-3">
                  <span
                    className="block h-2.5 rounded-r-[4px]"
                    style={{
                      width: `${Math.max(pct, 4)}%`,
                      background: 'var(--color-series-1)',
                    }}
                  />
                </span>
              </span>
              <span className="kc-tnum text-right text-sm font-semibold text-ink-soft">
                {d.count}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Cadence: how often this actually gets used
   ══════════════════════════════════════════════════════════════════ */

export function CadenceColumns({ data }) {
  if (!data.length) {
    return <p className="text-sm text-ink-faint">Nothing logged yet.</p>
  }
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-[6px]" style={{ height: 132 }}>
      {data.map((d) => (
        <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className="kc-tnum text-xs font-semibold text-ink-soft">
            {d.count}
          </span>
          <div
            className="w-full max-w-[24px] rounded-t-[4px]"
            style={{
              // A zero month gets a hairline, not a stub. A stub would read
              // as "one or two" and quietly overstate the record.
              height: d.count ? `${Math.max((d.count / max) * 86, 5)}px` : '2px',
              background: d.count
                ? 'var(--color-series-1)'
                : 'var(--color-paper-3)',
            }}
            role="img"
            aria-label={`${d.label} ${d.year}: ${d.count} observation${d.count === 1 ? '' : 's'}`}
          />
          <span className="truncate text-[11px] text-ink-faint">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Meter: a single proportion (coverage this term)
   ══════════════════════════════════════════════════════════════════ */

export function Meter({ pct, tone = 'good' }) {
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-ramp-1"
      role="img"
      aria-label={`${pct}% of the class logged`}
    >
      <div
        className={`h-2.5 rounded-r-[4px] ${tone === 'warn' ? 'bg-warn' : 'bg-good'}`}
        style={{ width: `${Math.max(pct, 2)}%` }}
      />
    </div>
  )
}
