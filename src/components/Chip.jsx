export default function Chip({ selected, children, onClick, tone = 'moss' }) {
  const on =
    tone === 'clay'
      ? 'border-clay bg-clay text-white'
      : 'border-moss bg-moss text-white'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-[0.97] ${
        selected
          ? on
          : 'border-line bg-white text-ink-soft hover:border-ink-faint hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
