// Botanical / geometric decoration. No stock children, as promised.

export function Sprig({ className = '', color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 120 160" fill="none" className={className} aria-hidden="true">
      <path
        d="M60 158V34"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path
            d={`M60 ${52 + i * 26}C42 ${44 + i * 26} 26 ${48 + i * 26} 18 ${62 + i * 26}C34 ${68 + i * 26} 52 ${64 + i * 26} 60 ${52 + i * 26}Z`}
            fill={color}
            opacity={0.16 + i * 0.06}
          />
          <path
            d={`M60 ${64 + i * 26}C78 ${56 + i * 26} 94 ${60 + i * 26} 102 ${74 + i * 26}C86 ${80 + i * 26} 68 ${76 + i * 26} 60 ${64 + i * 26}Z`}
            fill={color}
            opacity={0.12 + i * 0.06}
          />
        </g>
      ))}
      <circle cx="60" cy="28" r="8" fill={color} opacity="0.35" />
    </svg>
  )
}

export function Arc({ className = '', color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden="true">
      {[80, 60, 40].map((r, i) => (
        <circle
          key={r}
          cx="100"
          cy="100"
          r={r}
          stroke={color}
          strokeWidth="1.5"
          opacity={0.25 - i * 0.05}
        />
      ))}
      <path
        d="M20 100a80 80 0 0 1 160 0"
        stroke={color}
        strokeWidth="2"
        opacity="0.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Seed({ className = '', color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path
        d="M32 6c14 10 20 20 20 30a20 20 0 1 1-40 0c0-10 6-20 20-30Z"
        fill={color}
        opacity="0.18"
      />
      <path
        d="M32 20v28M32 30l8-6M32 38l-8-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}
