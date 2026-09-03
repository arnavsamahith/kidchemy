import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../data/auth.jsx'

export function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper text-ink-faint">
      <Loader2 size={22} className="animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

/**
 * Gate a route on being signed in, and optionally on a role.
 * Sends people who are signed in but on the wrong side of the app to
 * their own home rather than to a dead end.
 */
export default function RequireRole({ role, children }) {
  const { ready, session, profile } = useAuth()
  const location = useLocation()

  if (!ready) return <FullPageSpinner label="Checking your sign-in…" />

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  // Signed in, but the profile row has not arrived (or the trigger did not
  // run). Send them somewhere they can fix it rather than a blank screen.
  if (!profile) {
    return <Navigate to="/login?state=no-profile" replace />
  }

  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'teacher' ? '/teacher' : '/parent'} replace />
  }

  return children
}
