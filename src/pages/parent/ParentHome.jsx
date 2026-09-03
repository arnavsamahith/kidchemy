import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Loader2,
  LogOut,
  Plus,
  Sparkles,
} from 'lucide-react'
import { useAuth, readableAuthError } from '../../data/auth.jsx'
import { useStore } from '../../data/store.jsx'
import { topDimensions, evidenceSummary } from '../../data/derive.js'
import { Sprig, Arc } from '../../components/Ornament.jsx'

export default function ParentHome() {
  const { profile, signOut, linkChild } = useAuth()
  const { students, refresh, loading } = useStore()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)

  const claim = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await linkChild(code)
      setCode('')
      setAdding(false)
      await refresh()
    } catch (err) {
      setError(readableAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const firstName = (profile?.full_name || '').split(' ')[0]

  return (
    <div className="min-h-dvh bg-paper">
      <div className="border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link to="/" className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
            Kidchemy
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl px-5 pb-24 pt-10 sm:px-8">
        <header className="relative overflow-hidden rounded-3xl border border-line bg-card px-6 py-9 sm:px-10">
          <Arc className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 text-clay opacity-60" />
          <Sprig className="pointer-events-none absolute -bottom-8 right-6 h-44 w-28 text-moss opacity-50" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-clay">
            Parent
          </p>
          <h1 className="relative mt-3 font-display text-3xl leading-tight text-ink sm:text-[40px]">
            {firstName ? `Hello, ${firstName}.` : 'Hello.'}
          </h1>
          <p className="relative mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Everything here was written by a teacher who was in the room. No
            ranks, no percentiles, nothing generated.
          </p>
        </header>

        {loading && !students.length && (
          <p className="mt-8 flex items-center gap-2 text-sm text-ink-faint">
            <Loader2 size={15} className="animate-spin" /> Fetching profiles…
          </p>
        )}

        {students.length > 0 && (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {students.map((s) => {
              const shared = s.observations.filter(
                (o) => !o.visibility || o.visibility === 'shared'
              )
              const top = topDimensions(shared, 3)
              return (
                <li key={s.id}>
                  <Link
                    to={`/profile/${s.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-card p-6 transition hover:border-moss"
                  >
                    <h2 className="font-display text-2xl text-ink">{s.name}</h2>
                    <p className="mt-1 text-sm text-ink-faint">
                      {s.className} · {s.school}
                    </p>
                    {top.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {top.map((d) => (
                          <li
                            key={d.id}
                            className="rounded-full bg-moss-tint px-2.5 py-1 text-xs font-medium text-moss-dark"
                          >
                            {d.label}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-4 text-xs leading-relaxed text-ink-faint">
                      {evidenceSummary(shared)}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-moss">
                      Read the profile
                      <ArrowRight
                        size={15}
                        className="transition group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {!loading && !students.length && (
          <div className="mt-8 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
            <Sparkles size={22} className="mx-auto text-clay" />
            <p className="mt-3 text-[15px] text-ink-soft">
              No child is linked to this account yet. Add the code printed on
              your child's report-card sticker.
            </p>
          </div>
        )}

        {/* Claim another child */}
        <div className="mt-8 rounded-2xl border border-line bg-card p-6">
          {adding || !students.length ? (
            <form onSubmit={claim} className="flex flex-wrap items-end gap-3">
              <label className="min-w-[200px] flex-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Child access code
                </span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ARYAN-4821"
                  className="kc-tnum mt-2 w-full rounded-xl border border-line bg-paper px-4 py-2.5 tracking-wider outline-none focus:border-moss"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moss-dark disabled:bg-ink-faint/40"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Link this child
              </button>
              {error && (
                <p className="w-full text-sm text-alert">{error}</p>
              )}
              <p className="w-full text-xs text-ink-faint">
                The code is on the sticker your school glued to the report card.
              </p>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-moss"
            >
              <Plus size={15} /> Link another child
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
