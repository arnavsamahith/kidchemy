import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { freshState } from './seed.js'
import {
  loadStudents,
  persistObservation,
  persistFrequency,
  seedIfEmpty,
} from './supabase.js'
import { SEED_STUDENTS } from './seed.js'

const KEY = 'kidchemy.v1'
const StoreContext = createContext(null)

// ─── localStorage helpers (kept as offline fallback) ─────────
function lsLoad() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshState()
    const parsed = JSON.parse(raw)
    if (!parsed?.students?.length) return freshState()
    return parsed
  } catch {
    return freshState()
  }
}

function lsSave(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode / quota */
  }
}

// ─── Provider ────────────────────────────────────────────────
export function StoreProvider({ children }) {
  const [state, setState] = useState(lsLoad)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // On mount: seed Supabase if empty, then load from Supabase.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await seedIfEmpty(SEED_STUDENTS)
        const students = await loadStudents()
        if (!cancelled) {
          setState((prev) => ({ ...prev, students }))
        }
      } catch (err) {
        console.warn('Supabase unavailable — using localStorage', err)
        setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Keep localStorage in sync as a fallback.
  useEffect(() => {
    if (!loading) lsSave(state)
  }, [state, loading])

  const api = useMemo(
    () => ({
      ...state,
      loading,
      error,

      getStudent: (id) => state.students.find((s) => s.id === id),

      /**
       * Add one observation for a single student.
       * Optimistic local update → Supabase persist in background.
       */
      addObservation: (studentId, observation) => {
        const newObs = {
          ...observation,
          id: observation.id ?? `obs_${Date.now()}`,
          visibility: observation.visibility ?? 'shared',
        }

        // Optimistic update
        setState((prev) => ({
          ...prev,
          students: prev.students.map((s) =>
            s.id === studentId
              ? { ...s, observations: [...s.observations, newObs] }
              : s
          ),
        }))

        // Background persist
        persistObservation(studentId, newObs).catch((err) =>
          console.warn('Failed to persist observation', err)
        )
      },

      /**
       * Add observations for multiple students at once (class-sweep).
       * Each entry: { studentId, tags, period, date, teacher, note?, milestone?, visibility? }
       */
      addBatchObservations: (entries) => {
        const dated = entries.map((e) => ({
          ...e,
          id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          visibility: e.visibility ?? 'shared',
        }))

        setState((prev) => ({
          ...prev,
          students: prev.students.map((s) => {
            const mine = dated.filter((e) => e.studentId === s.id)
            if (!mine.length) return s
            const newObs = mine.map(({ studentId, ...obs }) => obs)
            return { ...s, observations: [...s.observations, ...newObs] }
          }),
        }))

        // Background persist (fire-and-forget per observation)
        dated.forEach(({ studentId, ...obs }) => {
          persistObservation(studentId, obs).catch((err) =>
            console.warn('Failed to persist sweep observation', err)
          )
        })
      },

      setFrequency: (studentId, frequency) => {
        setState((prev) => ({
          ...prev,
          students: prev.students.map((s) =>
            s.id === studentId ? { ...s, frequency } : s
          ),
        }))
        persistFrequency(studentId, frequency).catch((err) =>
          console.warn('Failed to persist frequency', err)
        )
      },

      reset: () => setState(freshState()),
    }),
    [state, loading, error]
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
