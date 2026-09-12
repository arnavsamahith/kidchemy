import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react'

/* ══════════════════════════════════════════════════════════════════
   The shared kit. Every page draws from here so the product looks like
   one thing rather than nine.
   ══════════════════════════════════════════════════════════════════ */

export const cx = (...parts) => parts.filter(Boolean).join(' ')

/* ─── Button ─────────────────────────────────────────────────── */

const BUTTON_VARIANTS = {
  primary:
    'bg-accent text-white hover:bg-accent-hover border border-transparent shadow-[0_1px_2px_rgba(22,19,13,0.12)]',
  secondary:
    'bg-card text-ink border border-line hover:bg-paper-2 hover:border-ink-faint/40',
  quiet:
    'bg-transparent text-ink-soft border border-transparent hover:bg-paper-2 hover:text-ink',
  moss: 'bg-moss text-white hover:bg-moss-hover border border-transparent',
  danger:
    'bg-card text-alert border border-alert/30 hover:bg-alert/5 hover:border-alert/50',
}

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-[10px]',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
  icon: 'h-9 w-9 justify-center rounded-[10px]',
}

export function Button({
  as: Tag = 'button',
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cx(
        'inline-flex items-center font-semibold transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-45',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2.1} />
      )}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 13 : 15} strokeWidth={2.1} />}
    </Tag>
  )
}

/* ─── Card ───────────────────────────────────────────────────── */

export function Card({ className, children, flush = false, ...rest }) {
  return (
    <section
      className={cx(
        'rounded-[14px] border border-line bg-card shadow-[var(--shadow-card)]',
        !flush && 'p-5',
        className
      )}
      {...rest}
    >
      {children}
    </section>
  )
}

export function CardHead({ eyebrow, title, subtitle, actions, className }) {
  return (
    <header
      className={cx(
        'flex flex-wrap items-start justify-between gap-3 mb-4',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="kc-eyebrow mb-1.5">{eyebrow}</p>}
        {title && (
          <h2 className="font-display text-xl font-semibold text-ink leading-tight">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-ink-soft max-w-prose">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

/* ─── Stat tile ──────────────────────────────────────────────── */

const STAT_TONES = {
  ink: 'text-ink',
  accent: 'text-accent-ink',
  good: 'text-good',
  warn: 'text-warn',
  alert: 'text-alert',
  faint: 'text-ink-faint',
}

export function Stat({ label, value, hint, tone = 'ink', icon: Icon, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'rounded-[14px] border border-line bg-card p-4 text-left shadow-[var(--shadow-card)]',
        onClick && 'transition-colors hover:border-ink-faint/40 hover:bg-paper-2/50'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="kc-eyebrow">{label}</p>
        {Icon && <Icon size={14} className="text-ink-faint shrink-0" />}
      </div>
      <p
        className={cx(
          'mt-2 font-display text-3xl font-semibold leading-none kc-tnum',
          STAT_TONES[tone]
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-ink-faint leading-snug">{hint}</p>}
    </Tag>
  )
}

/* ─── Badge ──────────────────────────────────────────────────── */

const BADGE_TONES = {
  neutral: 'bg-paper-2 text-ink-soft border-line',
  accent: 'bg-accent-tint text-accent-ink border-accent-line',
  moss: 'bg-moss-tint text-moss border-moss-line',
  good: 'bg-good-tint text-good border-good/20',
  warn: 'bg-warn-tint text-warn border-warn/20',
  alert: 'bg-alert-tint text-alert border-alert/20',
  info: 'bg-info-tint text-info border-info/20',
  outline: 'bg-transparent text-ink-faint border-line',
}

export function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'text-2xs font-semibold whitespace-nowrap',
        BADGE_TONES[tone],
        className
      )}
    >
      {Icon && <Icon size={11} strokeWidth={2.3} />}
      {children}
    </span>
  )
}

/* ─── Form fields ────────────────────────────────────────────── */

export function Field({ label, hint, error, required, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-baseline gap-1.5">
          <span className="text-xs font-semibold text-ink">{label}</span>
          {required && <span className="text-2xs text-accent">required</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-alert">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      )}
    </label>
  )
}

const CONTROL =
  'w-full rounded-[10px] border border-line bg-card px-3 text-sm text-ink ' +
  'placeholder:text-ink-faint/70 transition-colors ' +
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 ' +
  'disabled:bg-paper-2 disabled:text-ink-faint'

export function Input({ className, ...rest }) {
  return <input className={cx(CONTROL, 'h-10', className)} {...rest} />
}

export function Textarea({ className, rows = 3, ...rest }) {
  return (
    <textarea
      rows={rows}
      className={cx(CONTROL, 'py-2.5 leading-relaxed resize-y', className)}
      {...rest}
    />
  )
}

export function Select({ className, children, ...rest }) {
  return (
    <div className="relative">
      <select
        className={cx(CONTROL, 'h-10 appearance-none pr-8', className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
      />
    </div>
  )
}

export function SearchInput({ className, value, onChange, placeholder = 'Search', ...rest }) {
  return (
    <div className={cx('relative', className)}>
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
      />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cx(CONTROL, 'h-9 pr-8')}
        style={{ paddingLeft: '2.125rem' }}
        {...rest}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange({ target: { value: '' } })}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint hover:text-ink"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  )
}

/* ─── Toggle chips: the main input device in this product ────── */

export function Chip({
  active = false,
  tone = 'accent',
  icon: Icon,
  count,
  className,
  children,
  ...rest
}) {
  const activeClass =
    tone === 'moss'
      ? 'border-moss bg-moss text-white'
      : tone === 'warn'
        ? 'border-warn bg-warn text-white'
        : 'border-accent bg-accent text-white'

  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
        'text-xs font-semibold transition-all duration-150 text-left',
        active
          ? activeClass
          : 'border-line bg-card text-ink-soft hover:border-ink-faint/50 hover:text-ink',
        className
      )}
      aria-pressed={active}
      {...rest}
    >
      {active ? (
        <Check size={12} strokeWidth={3} />
      ) : (
        Icon && <Icon size={12} strokeWidth={2.2} />
      )}
      <span>{children}</span>
      {count > 0 && (
        <span
          className={cx(
            'kc-tnum rounded-full px-1.5 text-2xs font-bold',
            active ? 'bg-white/25' : 'bg-paper-2 text-ink-faint'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/* ─── Segmented control ──────────────────────────────────────── */

export function Segmented({ options, value, onChange, size = 'md', className }) {
  return (
    <div
      className={cx(
        'inline-flex rounded-[10px] border border-line bg-paper-2 p-0.5',
        className
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const v = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        const active = v === value
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={cx(
              'rounded-lg font-semibold transition-all duration-150 whitespace-nowrap',
              size === 'sm' ? 'px-2.5 py-1 text-2xs' : 'px-3 py-1.5 text-xs',
              active
                ? 'bg-card text-ink shadow-[0_1px_2px_rgba(22,19,13,0.08)]'
                : 'text-ink-faint hover:text-ink-soft'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Tabs (the sub-nav under a page title) ──────────────────── */

export function Tabs({ items, value, onChange, className }) {
  return (
    <div
      className={cx(
        'flex gap-1 overflow-x-auto border-b border-line kc-scroll',
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cx(
              'relative shrink-0 px-3 pb-2.5 pt-1 text-sm font-semibold transition-colors',
              active ? 'text-ink' : 'text-ink-faint hover:text-ink-soft'
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.icon && <item.icon size={14} strokeWidth={2.1} />}
              {item.label}
              {item.count != null && (
                <span className="kc-tnum rounded-full bg-paper-2 px-1.5 text-2xs font-bold text-ink-faint">
                  {item.count}
                </span>
              )}
            </span>
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Table ──────────────────────────────────────────────────── */

export function Table({ children, className }) {
  return (
    <div className={cx('overflow-x-auto kc-scroll', className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        {children}
      </table>
    </div>
  )
}

export function Th({ children, className, align = 'left', ...rest }) {
  return (
    <th
      className={cx(
        'kc-eyebrow border-b border-line px-3 py-2.5 font-bold',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...rest}
    >
      {children}
    </th>
  )
}

export function Td({ children, className, align = 'left', ...rest }) {
  return (
    <td
      className={cx(
        'border-b border-line-soft px-3 py-2.5 align-middle text-ink-soft',
        align === 'right' && 'text-right kc-tnum',
        align === 'center' && 'text-center',
        className
      )}
      {...rest}
    >
      {children}
    </td>
  )
}

/* ─── Meter ──────────────────────────────────────────────────── */

const METER_TONES = {
  good: 'bg-good',
  accent: 'bg-accent',
  moss: 'bg-moss',
  warn: 'bg-warn',
  alert: 'bg-alert',
  faint: 'bg-ink-faint/40',
}

export function Meter({ pct = 0, tone = 'good', className, label }) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0))
  return (
    <div
      className={cx('h-1.5 w-full overflow-hidden rounded-full bg-paper-3', className)}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cx('h-full rounded-full transition-all duration-500', METER_TONES[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

/* ─── Avatar ─────────────────────────────────────────────────── */

const AVATAR_TINTS = [
  'bg-accent-tint text-accent-ink',
  'bg-moss-tint text-moss',
  'bg-info-tint text-info',
  'bg-warn-tint text-warn',
  'bg-paper-3 text-ink-soft',
]

export function Avatar({ name = '', size = 36, className }) {
  const initials = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  let hash = 0
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        AVATAR_TINTS[hash % AVATAR_TINTS.length],
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {initials || '?'}
    </span>
  )
}

/* ─── Empty state ────────────────────────────────────────────── */

export function EmptyState({ icon: Icon, title, body, action, className }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center gap-3 rounded-[14px]',
        'border border-dashed border-line bg-paper-2/40 px-6 py-12 text-center',
        className
      )}
    >
      {Icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink-faint border border-line">
          <Icon size={19} strokeWidth={1.8} />
        </span>
      )}
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        {body && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-faint">{body}</p>
        )}
      </div>
      {action}
    </div>
  )
}

/* ─── Callout ────────────────────────────────────────────────── */

const CALLOUT_TONES = {
  neutral: 'border-line bg-paper-2/60',
  accent: 'border-accent-line bg-accent-tint',
  moss: 'border-moss-line bg-moss-tint',
  warn: 'border-warn/25 bg-warn-tint',
  alert: 'border-alert/25 bg-alert-tint',
  info: 'border-info/20 bg-info-tint',
}

export function Callout({ tone = 'neutral', icon: Icon, title, children, className }) {
  return (
    <div className={cx('rounded-[12px] border p-4', CALLOUT_TONES[tone], className)}>
      <div className="flex gap-3">
        {Icon && <Icon size={16} className="mt-0.5 shrink-0 text-ink-soft" />}
        <div className="min-w-0 flex-1">
          {title && (
            <p className="text-sm font-bold text-ink leading-snug">{title}</p>
          )}
          {children && (
            <div className={cx('text-sm text-ink-soft', title && 'mt-1')}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Modal / sheet ──────────────────────────────────────────── */

export function Modal({ open, onClose, title, subtitle, children, footer, wide = false }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'kc-sheet flex max-h-[92dvh] w-full flex-col overflow-hidden bg-card',
          'rounded-t-[18px] border border-line shadow-[var(--shadow-pop)] sm:rounded-[16px]',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-faint">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-paper-2 hover:text-ink"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 kc-scroll">
          {children}
        </div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-line bg-paper-2/50 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

/* ─── Toast ──────────────────────────────────────────────────── */

export function useToast() {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), toast.ms || 3200)
    return () => clearTimeout(t)
  }, [toast])
  return [toast, setToast]
}

export function Toast({ toast }) {
  if (!toast) return null
  const tone =
    toast.tone === 'alert'
      ? 'border-alert/30 bg-alert-tint text-alert'
      : toast.tone === 'warn'
        ? 'border-warn/30 bg-warn-tint text-warn'
        : 'border-moss-line bg-moss-tint text-moss'
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 print:hidden">
      <div
        role="status"
        className={cx(
          'kc-rise pointer-events-auto max-w-md rounded-full border px-4 py-2.5',
          'text-sm font-semibold shadow-[var(--shadow-raised)]',
          tone
        )}
      >
        {toast.message}
      </div>
    </div>
  )
}

/* ─── Section heading used inside long reading pages ─────────── */

export function SectionTitle({ eyebrow, children, className }) {
  return (
    <div className={cx('mb-3', className)}>
      {eyebrow && <p className="kc-eyebrow mb-1">{eyebrow}</p>}
      <h2 className="font-display text-2xl font-semibold text-ink leading-tight">
        {children}
      </h2>
    </div>
  )
}

/* ─── A thin divider with a label ────────────────────────────── */

export function Divider({ label, className }) {
  if (!label) return <hr className={cx('border-line', className)} />
  return (
    <div className={cx('flex items-center gap-3', className)}>
      <hr className="flex-1 border-line" />
      <span className="kc-eyebrow">{label}</span>
      <hr className="flex-1 border-line" />
    </div>
  )
}
