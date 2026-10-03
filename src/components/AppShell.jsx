import React, { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  QrCode,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '../data/auth.jsx'
import { useStore } from '../data/store.jsx'
import { Avatar, Badge, cx } from './ui.jsx'
import { classLabel } from '../data/roster.js'

/* ══════════════════════════════════════════════════════════════════
   Navigation model
   The rail is the workspace switcher. The tabs under the page title are
   the sub-navigation, which is where most movement actually happens.
   ══════════════════════════════════════════════════════════════════ */

const TEACHER_RAIL = [
  { to: '/teacher', icon: Home, label: 'Today', end: true },
  { to: '/teacher/sweep', icon: Zap, label: 'Class sweep' },
  { to: '/teacher/roster', icon: Users, label: 'Roster' },
  { to: '/teacher/analytics', icon: TrendingUp, label: 'Patterns' },
  { to: '/teacher/ptm', icon: ClipboardList, label: 'Parent meetings' },
  { to: '/teacher/stickers', icon: QrCode, label: 'Report card codes' },
]

const PARENT_RAIL = [{ to: '/parent', icon: Home, label: 'Home', end: true }]

const ADMIN_RAIL = [
  { to: '/admin', icon: LayoutGrid, label: 'Console', end: true },
  { to: '/admin/roster', icon: Users, label: 'Students' },
  { to: '/admin/people', icon: Shield, label: 'Accounts' },
  { to: '/admin/config', icon: Settings, label: 'Configuration' },
  { to: '/admin/privacy', icon: ShieldCheck, label: 'Privacy' },
  { to: '/admin/audit', icon: BookOpen, label: 'Audit' },
]

function railFor(role) {
  if (role === 'admin') return ADMIN_RAIL
  if (role === 'teacher') return TEACHER_RAIL
  return PARENT_RAIL
}

/* ─── Brand ──────────────────────────────────────────────────── */

/**
 * The Kidchemy mark: a K whose upper arm is a leaf.
 * `tone` picks the lockup. "tile" is the app-icon form (teal block, white
 * mark) used in the rail and the header; "bare" is the ink-and-teal mark for
 * light surfaces; "light" is the reversed mark for dark ones; "white" is
 * the all-white mark for use over the brand teal.
 */
export function Mark({ size = 28, tone = 'tile' }) {
  const stroke =
    tone === 'tile' || tone === 'light' || tone === 'white'
      ? '#FFFFFF'
      : 'currentColor'
  const leaf =
    tone === 'tile' || tone === 'white' ? '#FFFFFF' : 'var(--color-accent)'
  const leafOpacity = tone === 'tile' || tone === 'white' ? 0.92 : 1

  const mark = (
    <svg
      viewBox="0 0 64 64"
      width={tone === 'tile' ? Math.round(size * 0.72) : size}
      height={tone === 'tile' ? Math.round(size * 0.72) : size}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M17 34 C23 21 34 13 47 11 C46 26 37 35 24 36 Z"
        fill={leaf}
        fillOpacity={leafOpacity}
      />
      <path
        d="M17 11 V53"
        stroke={stroke}
        strokeWidth="5.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M17 34 L39 53"
        stroke={stroke}
        strokeWidth="5.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )

  if (tone !== 'tile') {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center text-ink"
        style={{ width: size, height: size }}
      >
        {mark}
      </span>
    )
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[9px] bg-accent"
      style={{ width: size, height: size }}
    >
      {mark}
    </span>
  )
}

function Brand({ to = '/', compact = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg">
      <Mark />
      {!compact && (
        <span className="font-display text-lg font-semibold leading-none text-ink">
          Kidchemy
        </span>
      )}
    </Link>
  )
}

/* ─── Left icon rail ─────────────────────────────────────────── */

function Rail({ items }) {
  return (
    <nav
      className="hidden w-[68px] shrink-0 flex-col items-center gap-1 border-r border-line bg-card py-4 lg:flex print:hidden"
      aria-label="Sections"
    >
      <Link to="/" className="mb-3 rounded-lg" aria-label="Kidchemy home">
        <Mark size={32} />
      </Link>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cx(
              'group relative flex h-11 w-11 items-center justify-center rounded-[11px] transition-colors',
              isActive
                ? 'bg-accent-tint text-accent-ink'
                : 'text-ink-faint hover:bg-paper-2 hover:text-ink'
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={18} strokeWidth={isActive ? 2.3 : 1.9} />
              <span
                className={cx(
                  'pointer-events-none absolute left-full z-40 ml-2 hidden whitespace-nowrap rounded-lg',
                  'bg-ink px-2.5 py-1.5 text-xs font-semibold text-paper shadow-[var(--shadow-raised)]',
                  'group-hover:block'
                )}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/* ─── Mobile drawer ──────────────────────────────────────────── */

function Drawer({ open, onClose, items, footer }) {
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px] lg:hidden print:hidden"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside className="kc-sheet flex h-full w-[82%] max-w-xs flex-col border-r border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <Brand />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint hover:bg-paper-2"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 kc-scroll">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cx(
                  'mb-0.5 flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-accent-tint text-accent-ink'
                    : 'text-ink-soft hover:bg-paper-2 hover:text-ink'
                )
              }
            >
              <item.icon size={17} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        {footer && <div className="border-t border-line p-3">{footer}</div>}
      </aside>
    </div>
  )
}

/* ─── Account menu ───────────────────────────────────────────── */

function AccountMenu() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = () => setOpen(false)
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [open])

  const roleLabel =
    profile?.role === 'admin'
      ? 'Superadmin'
      : profile?.role === 'teacher'
        ? 'Teacher'
        : 'Parent'

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[10px] py-1 pl-1 pr-2 transition-colors hover:bg-paper-2"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={profile?.full_name || 'Kidchemy user'} size={30} />
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate text-xs font-bold leading-tight text-ink">
            {profile?.full_name || 'Signed in'}
          </span>
          <span className="block text-2xs leading-tight text-ink-faint">
            {roleLabel}
          </span>
        </span>
        <ChevronDown size={13} className="text-ink-faint" />
      </button>

      {open && (
        <div
          role="menu"
          className="kc-fade absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-[12px] border border-line bg-card shadow-[var(--shadow-pop)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-bold text-ink">
              {profile?.full_name || 'Signed in'}
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-faint">
              {profile?.school || 'No school set'}
            </p>
            <Badge tone={profile?.role === 'admin' ? 'accent' : 'moss'} className="mt-2">
              {roleLabel}
            </Badge>
          </div>
          {profile?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-paper-2 hover:text-ink"
            >
              <Shield size={15} /> Superadmin console
            </Link>
          )}
          <button
            onClick={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-ink-soft hover:bg-paper-2 hover:text-ink"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Global search ──────────────────────────────────────────── */

function GlobalSearch() {
  const { students } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (needle.length < 2) return []
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          String(s.studentCode || '').toLowerCase().includes(needle) ||
          String(s.rollNo || '') === needle
      )
      .slice(0, 6)
  }, [q, students])

  return (
    <div className="relative hidden flex-1 md:block md:max-w-sm">
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
      />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Find a student by name or roll number"
        className="h-9 w-full rounded-[10px] border border-line bg-paper-2/70 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint/80 transition-colors focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent/15"
      />
      {open && results.length > 0 && (
        <div className="kc-fade absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[12px] border border-line bg-card shadow-[var(--shadow-pop)]">
          {results.map((s) => (
            <button
              key={s.id}
              onMouseDown={() => {
                navigate(`/teacher/student/${s.id}`)
                setQ('')
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-paper-2"
            >
              <Avatar name={s.name} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {s.name}
                </span>
                <span className="block text-2xs text-ink-faint">
                  {classLabel(s)}
                  {s.rollNo ? ` - Roll ${s.rollNo}` : ''}
                </span>
              </span>
              <span className="kc-tnum text-2xs text-ink-faint">
                {s.observations?.length || 0} obs
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   The shell
   ══════════════════════════════════════════════════════════════════ */

export default function AppShell({
  title,
  subtitle,
  eyebrow,
  actions,
  tabs,
  children,
  wide = false,
  bare = false,
}) {
  const { profile } = useAuth()
  const { school, loading } = useStore()
  const location = useLocation()
  const [drawer, setDrawer] = useState(false)
  const rail = railFor(profile?.role)

  useEffect(() => setDrawer(false), [location.pathname])

  return (
    <div className="flex min-h-dvh bg-paper">
      <Rail items={rail} />
      <Drawer open={drawer} onClose={() => setDrawer(false)} items={rail} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-card/90 px-3 backdrop-blur-sm sm:px-5 print:hidden">
          <button
            onClick={() => setDrawer(true)}
            className="rounded-lg p-2 text-ink-soft hover:bg-paper-2 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>

          <div className="lg:hidden">
            <Brand compact />
          </div>

          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <span className="truncate text-sm font-bold text-ink">
              {school?.name || 'Kidchemy'}
            </span>
            {school?.className && (
              <Badge tone="outline">{school.className}</Badge>
            )}
          </div>

          <div className="flex-1" />
          <GlobalSearch />

          {loading && (
            <span className="hidden text-2xs font-semibold text-ink-faint sm:block">
              Syncing
            </span>
          )}
          <button
            className="hidden rounded-[10px] p-2 text-ink-faint hover:bg-paper-2 hover:text-ink sm:block"
            aria-label="Notifications"
          >
            <Bell size={17} />
          </button>
          <AccountMenu />
        </header>

        {/* Page header */}
        {!bare && (title || tabs) && (
          <div className="border-b border-line bg-card px-4 pt-5 sm:px-6 print:hidden">
            <div
              className={cx(
                'mx-auto w-full',
                wide ? 'max-w-[1500px]' : 'max-w-[1200px]'
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
                <div className="min-w-0">
                  {eyebrow && <p className="kc-eyebrow mb-1">{eyebrow}</p>}
                  {title && (
                    <h1 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex flex-wrap items-center gap-2">{actions}</div>
                )}
              </div>
              {tabs}
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <div
            className={cx(
              'mx-auto w-full',
              wide ? 'max-w-[1500px]' : 'max-w-[1200px]'
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export { Brand }
