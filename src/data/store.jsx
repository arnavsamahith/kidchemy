import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { SCHOOL } from './seed.js'
import {
  loadStudents,
  persistObservation,
  updateObservationRow,
  deleteObservationRow,
  persistFrequency,
  persistStudent,
} from './supabase.js'
import { useAuth } from './auth.jsx'

const StoreContext = createContext(null)

const newObsId = () =>
  `obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

export function StoreProvider({ children }) {
  const { session, profile, ready } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastSync, setLastSync] = useState(null)

  const refresh = useCallback(async () => {
    if (!session) {
      setStudents([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const next = await loadStudents()
      setStudents(next)
      setLastSync(new Date())
    } catch (err) {
      console.warn('Could not load from Supabase', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [session])

  // Load once we know who is signed in. Signing out clears everything so
  // one account's class never leaks into the next session on a shared laptop.
  useEffect(() => {
    if (!ready) return
    if (!session) {
      setStudents([])
      setError(null)
      return
    }
    refresh()
  }, [ready, session, profile?.role, refresh])

  const school = useMemo(
    () => ({
      name: profile?.school || students[0]?.school || SCHOOL.name,
      city: SCHOOL.city,
      className: profile?.class_name || students[0]?.className || SCHOOL.className,
      teacher: profile?.full_name || SCHOOL.teacher,
    }),
    [profile, students]
  )

  const api = useMemo(() => {
    const upsertLocal = (studentId, obs) =>
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== studentId) return s
          const exists = s.observations.some((o) => o.id === obs.id)
          const observations = exists
            ? s.observations.map((o) => (o.id === obs.id ? obs : o))
            : [...s.observations, obs]
          observations.sort((a, b) => String(a.date).localeCompare(String(b.date)))
          return { ...s, observations }
        })
      )

    return {
      students,
      school,
      loading,
      error,
      lastSync,
      refresh,

      getStudent: (id) => students.find((s) => s.id === id),

      addObservation: async (studentId, observation) => {
        const obs = {
          ...observation,
          id: observation.id ?? newObsId(),
          visibility: observation.visibility ?? 'shared',
          tagNotes: observation.tagNotes ?? {},
        }
        upsertLocal(studentId, obs)
        try {
          await persistObservation(studentId, obs)
        } catch (err) {
          console.warn('Failed to save observation', err)
          setError(err)
          throw err
        }
      },

      updateObservation: async (studentId, observation) => {
        upsertLocal(studentId, observation)
        try {
          await updateObservationRow(studentId, observation)
        } catch (err) {
          console.warn('Failed to update observation', err)
          setError(err)
          throw err
        }
      },

      deleteObservation: async (studentId, observationId) => {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? { ...s, observations: s.observations.filter((o) => o.id !== observationId) }
              : s
          )
        )
        try {
          await deleteObservationRow(observationId)
        } catch (err) {
          console.warn('Failed to delete observation', err)
          setError(err)
          throw err
        }
      },

      /** Class sweep: one tag, many children, one round trip each. */
      addBatchObservations: async (entries) => {
        const dated = entries.map((e) => ({
          ...e,
          id: newObsId(),
          visibility: e.visibility ?? 'shared',
          tagNotes: e.tagNotes ?? {},
        }))
        dated.forEach(({ studentId, ...obs }) => upsertLocal(studentId, obs))
        await Promise.all(
          dated.map(({ studentId, ...obs }) =>
            persistObservation(studentId, obs).catch((err) => {
              console.warn('Failed to save sweep observation', err)
              setError(err)
            })
          )
        )
      },

      setFrequency: async (studentId, frequency) => {
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, frequency } : s))
        )
        persistFrequency(studentId, frequency).catch((err) =>
          console.warn('Failed to save frequency', err)
        )
      },

      addStudent: async (student) => {
        const row = {
          ...student,
          className: student.className || school.className,
          school: student.school || school.name,
          observations: [],
        }
        setStudents((prev) =>
          [...prev, row].sort((a, b) => a.name.localeCompare(b.name))
        )
        await persistStudent(row)
      },
    }
  }, [students, school, loading, error, lastSync, refresh])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
