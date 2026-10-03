import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  supabase,
  fetchProfile,
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  linkChild as apiLinkChild,
} from './supabase.js'

const AuthContext = createContext(null)

/* ─── Idle sign-out ────────────────────────────────────────────────
   Teachers use shared staff-room laptops and borrowed phones. A record of
   forty children should not stay open on a machine someone walked away
   from. Staff are signed out after 30 idle minutes, parents after 12 hours.
   The timestamp lives in localStorage so it also applies after a reload,
   or when a laptop lid is opened the next morning. */
const IDLE_MINUTES = { admin: 30, teacher: 30, parent: 720 }
const LAST_ACTIVE_KEY = 'kc_last_active'

function readLastActive() {
  try {
    return Number(localStorage.getItem(LAST_ACTIVE_KEY)) || 0
  } catch {
    return 0
  }
}
function markActive() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()))
  } catch {
    /* private mode */
  }
}

function useIdleSignOut(role, onIdle) {
  useEffect(() => {
    if (!role) return
    const limit = (IDLE_MINUTES[role] || 30) * 60 * 1000
    const last = readLastActive()
    if (last && Date.now() - last > limit) {
      onIdle()
      return
    }
    markActive()
    let throttle = 0
    const bump = () => {
      const now = Date.now()
      if (now - throttle > 15000) {
        throttle = now
        markActive()
      }
    }
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    const check = setInterval(() => {
      if (Date.now() - readLastActive() > limit) onIdle()
    }, 30000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump))
      clearInterval(check)
    }
  }, [role, onIdle])
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  // ready = we know for certain whether someone is signed in and who they are.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return
        setSession(data?.session ?? null)
        if (!data?.session) setReady(true)
      })
      .catch(() => mounted && setReady(true))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
      if (!next) {
        setProfile(null)
        setReady(true)
      }
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  // Whenever we have a user, resolve their profile row (which carries role).
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const p = await fetchProfile(userId)
        if (!cancelled) setProfile(p)
      } catch {
        if (!cancelled) setProfile(null)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return null
    const p = await fetchProfile(session.user.id)
    setProfile(p)
    return p
  }, [session?.user?.id])

  const idleSignOut = useCallback(async () => {
    await apiSignOut().catch(() => {})
    setProfile(null)
    setSession(null)
    try {
      localStorage.removeItem(LAST_ACTIVE_KEY)
      sessionStorage.clear()
    } catch {
      /* ignore */
    }
    if (window.location.pathname !== '/login') {
      window.location.assign('/login?state=idle')
    }
  }, [])

  useIdleSignOut(session ? profile?.role : null, idleSignOut)

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      isTeacher: profile?.role === 'teacher' || profile?.role === 'admin',
      isParent: profile?.role === 'parent',
      isAdmin: profile?.role === 'admin',
      ready,
      refreshProfile,
      signIn: async (email, password) => {
        markActive()
        return apiSignIn(email, password)
      },
      signUp: async (args) => {
        markActive()
        return apiSignUp(args)
      },
      markActive,
      linkChild: apiLinkChild,
      signOut: async () => {
        await apiSignOut()
        setProfile(null)
        setSession(null)
        try {
          localStorage.removeItem(LAST_ACTIVE_KEY)
          sessionStorage.clear()
        } catch {
          /* ignore */
        }
      },
    }),
    [session, profile, ready, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// Turns Supabase's terse errors into something a teacher can act on.
export function readableAuthError(err) {
  const msg = String(err?.message || err || '')
  if (/INVALID_TEACHER_CODE/i.test(msg))
    return 'That school code is not recognised. Ask your coordinator for the code for your class.'
  // GoTrue often flattens a trigger exception into this generic message, and
  // the only thing the trigger rejects is a bad teacher code.
  if (/Database error saving new user/i.test(msg))
    return 'That school code is not recognised, so the account was not created. Check the code and try again.'
  if (/UNKNOWN_CODE/i.test(msg))
    return `That code and first name do not match a child. Check both against the report card sticker.${
      Number.isFinite(err?.left) ? ` ${err.left} tries left this hour.` : ''
    }`
  if (/NOT_AN_ADMIN/i.test(msg))
    return 'That action needs a superadmin account.'
  if (/NO_SUCH_USER/i.test(msg))
    return 'No account exists with that email address yet. Ask them to sign up first.'
  if (/NOT_A_PARENT/i.test(msg))
    return 'Child codes can only be added from a parent account.'
  if (/TOO_MANY_ATTEMPTS/i.test(msg))
    return 'Too many codes that did not match. For your child’s safety, linking is paused for an hour. The school can reprint the sticker.'
  if (/GUARDIAN_LIMIT/i.test(msg))
    return 'This child already has the maximum number of linked guardians. Ask the class teacher to check who is linked.'
  if (/CONSENT_REQUIRED/i.test(msg))
    return 'Please read the notice and tick your consent before linking.'
  if (/PROTECTED_FIELD/i.test(msg))
    return 'Only a school admin can change role, school or class.'
  if (/NOT_ALLOWED|row-level security|permission denied/i.test(msg))
    return 'Your account is not allowed to do that for this child.'
  if (/CANNOT_MOVE/i.test(msg))
    return 'A child or note cannot be moved to another school or child.'
  if (/Invalid TOTP|invalid.*code|mfa/i.test(msg))
    return 'That six-digit code did not match. Check the time on your phone and try again.'
  if (/Invalid login credentials/i.test(msg))
    return 'That email and password combination did not match an account.'
  if (/already registered/i.test(msg))
    return 'An account already exists for that email. Try signing in instead.'
  if (/Password should be/i.test(msg))
    return 'Choose a password of at least 8 characters.'
  if (/Email not confirmed/i.test(msg))
    return 'Check your inbox and confirm your email address, then sign in.'
  if (/rate limit|too many/i.test(msg))
    return 'Too many attempts. Wait a minute and try again.'
  return msg || 'Something went wrong. Try again.'
}
