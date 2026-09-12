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
      signIn: apiSignIn,
      signUp: apiSignUp,
      linkChild: apiLinkChild,
      signOut: async () => {
        await apiSignOut()
        setProfile(null)
        setSession(null)
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
    return "We don't have a child with that code. Check the code printed on the report-card sticker."
  if (/NOT_AN_ADMIN/i.test(msg))
    return 'That action needs a superadmin account.'
  if (/NO_SUCH_USER/i.test(msg))
    return 'No account exists with that email address yet. Ask them to sign up first.'
  if (/NOT_A_PARENT/i.test(msg))
    return 'Child codes can only be added from a parent account.'
  if (/Invalid login credentials/i.test(msg))
    return 'That email and password combination did not match an account.'
  if (/already registered/i.test(msg))
    return 'An account already exists for that email. Try signing in instead.'
  if (/Password should be/i.test(msg))
    return 'Choose a password of at least 6 characters.'
  if (/Email not confirmed/i.test(msg))
    return 'Check your inbox and confirm your email address, then sign in.'
  if (/rate limit|too many/i.test(msg))
    return 'Too many attempts. Wait a minute and try again.'
  return msg || 'Something went wrong. Try again.'
}
