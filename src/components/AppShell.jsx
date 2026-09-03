import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  TrendingUp,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  RefreshCw,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '../data/auth.jsx'
import { useStore } from '../data/store.jsx'

const NAV = [
  { to: '/teacher', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/teacher/roster', label: 'Children', icon: Users },
  { to: '/teacher/analytics', label: 'Class insights', icon: TrendingUp },
  { to: '/teacher/sweep', label: 'Class sweep', icon: Zap },
  { to: '/teacher/stickers', label: 'QR stickers', icon: QrCode },
]

function Brand() {
  return (
    <Link to="/teacher" className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-moss text-[13px] font-bold text-white"
      >
        K
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] text-ink">Kidchemy</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Teacher
        </span>
      </span>
    </Link>
  )
}

function NavList({ onNavigate }) {
  return (
    <nav className="grid gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-moss-tint text-moss-dark'
                : 'text-ink-soft hover:bg-paper-2 hover:text-ink',
            ].join(' ')
          }
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function AccountMenu() {
  const { profile, user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const name = profile?.full_name || user?.email || 'Signed in'
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2.5 text-left transition hover:border-ink-faint"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-tint text-[11px] font-bold text-clay-dark"
        >
          {initials || 'K'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{name}</span>
          <span className="block truncate text-[11px] text-ink-faint">
            {user?.email}
          </span>
        </span>
        <ChevronDown size={15} className="shrink-0 text-ink-faint" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-full overflow-hidden rounded-xl border border-line bg-card shadow-[0_10px_36px_rgba(28,28,28,0.12)]">
          <Link
            to="/"
            className="block px-4 py-2.5 text-sm text-ink-soft transition hover:bg-paper-2"
            onClick={() => setOpen(false)}
          >
            About Kidchemy
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-sm text-ink-soft transition hover:bg-paper-2"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppShell({ title, subtitle, actions, children, wide = false }) {
  const { school, loading, refresh, lastSync } = useStore()
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()

  useEffect(() => setDrawer(false), [location.pathname])

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* ── Sidebar (desktop) ─────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-paper-2/60 px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-7 flex-1">
          <NavList />
        </div>
        <div className="mt-4 rounded-xl bg-card/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Class
          </p>
          <p className="mt-1 text-sm font-medium text-ink">{school.className}</p>
          <p className="text-xs text-ink-faint">{school.name}</p>
        </div>
        <div className="mt-3">
          <AccountMenu />
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open menu"
          className="rounded-lg border border-line p-2 text-ink-soft"
        >
          <Menu size={18} />
        </button>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/25"
            onClick={() => setDrawer(false)}
          />
          <div className="kc-fade absolute inset-y-0 left-0 flex w-[280px] flex-col bg-paper px-4 py-5">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-ink-soft"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-7 flex-1">
              <NavList onNavigate={() => setDrawer(false)} />
            </div>
            <AccountMenu />
          </div>
        </div>
      )}

      {/* ── Main column ───────────────────────────────────────── */}
      <div className="flex min-w-0 flex-col">
        <header className="border-b border-line bg-paper/80 px-5 py-6 backdrop-blur sm:px-8 lg:sticky lg:top-0 lg:z-20">
          <div
            className={`mx-auto flex w-full flex-wrap items-end justify-between gap-4 ${
              wide ? '' : 'max-w-6xl'
            }`}
          >
            <div className="min-w-0">
              <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[32px]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={refresh}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-2 text-xs font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink"
                title={
                  lastSync
                    ? `Last synced ${lastSync.toLocaleTimeString()}`
                    : 'Reload from the server'
                }
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Syncing' : 'Refresh'}
              </button>
              {actions}
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 pb-20 pt-7 sm:px-8">
          <div className={`mx-auto w-full ${wide ? '' : 'max-w-6xl'}`}>{children}</div>
        </main>
      </div>
    </div>
  )
}
