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
  loadSettings,
  persistObservation,
  updateObservationRow,
  deleteObservationRow,
  persistFrequency,
  persistStudent,
  persistStudents,
  archiveStudent,
  persistSelfAssessment,
  persistPeerAssessment,
  persistParentNote,
  writeAudit,
} from './supabase.js'
import { useAuth } from './auth.jsx'

const StoreContext = createContext(null)

const newObsId = () =>
  `obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

const DEFAULT_SETTINGS = {
  branding: { productName: 'Kidchemy', tagline: 'A truer picture of every child' },
  terms: { periods: ['Term 1', 'Term 2', 'Term 3'], current: 'Term 1' },
  policy: {
    careerPathwaysMinGrade: 9,
    defaultVisibility: 'shared',
    watchTagsSchoolOnly: true,
    overdueDays: 21,
  },
  privacy: {
    noticeVersion: '2026-10',
    retentionMonthsAfterLeaving: 12,
    auditLogDays: 400,
    linkAttemptsPerHour: 5,
    maxGuardiansPerChild: 4,
    requestDueDays: 30,
    grievanceOfficer: { name: '', email: '', phone: '' },
  },
}

export function StoreProvider({ children }) {
  const { session, profile, ready, isAdmin } = useAuth()
  const [students, setStudents] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
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
      const [next, cfg] = await Promise.all([loadStudents(), loadSettings()])
      setStudents(next)
      if (cfg && Object.keys(cfg).length) {
        setSettings({ ...DEFAULT_SETTINGS, ...cfg })
      }
      setLastSync(new Date())
    } catch (err) {
      console.warn('Could not load from Supabase', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [session])

  // Load once we know who is signed in. Signing out clears everything so one
  // account's class never leaks into the next session on a shared laptop.
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
      grade: profile?.grade ?? students[0]?.grade ?? null,
      section: profile?.section ?? students[0]?.section ?? null,
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

    const normalise = (observation) => ({
      ...observation,
      id: observation.id ?? newObsId(),
      visibility: observation.visibility ?? settings.policy.defaultVisibility ?? 'shared',
      tagNotes: observation.tagNotes ?? {},
      story: observation.story ?? {},
      dispositions: observation.dispositions ?? [],
      selfChosen: Boolean(observation.selfChosen),
    })

    return {
      students,
      settings,
      school,
      loading,
      error,
      lastSync,
      refresh,
      isAdmin,

      getStudent: (id) => students.find((s) => s.id === id),

      addObservation: async (studentId, observation) => {
        const obs = normalise(observation)
        upsertLocal(studentId, obs)
        try {
          await persistObservation(studentId, obs)
          writeAudit('observation.create', 'observation', obs.id, {
            student_id: studentId,
            visibility: obs.visibility,
          })
        } catch (err) {
          console.warn('Failed to save observation', err)
          setError(err)
          throw err
        }
      },

      updateObservation: async (studentId, observation) => {
        const obs = normalise(observation)
        upsertLocal(studentId, obs)
        try {
          await updateObservationRow(studentId, obs)
          writeAudit('observation.update', 'observation', obs.id, {
            student_id: studentId,
          })
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
              ? {
                  ...s,
                  observations: s.observations.filter((o) => o.id !== observationId),
                }
              : s
          )
        )
        try {
          await deleteObservationRow(observationId)
          writeAudit('observation.delete', 'observation', observationId, {
            student_id: studentId,
          })
        } catch (err) {
          console.warn('Failed to delete observation', err)
          setError(err)
          throw err
        }
      },

      /** Class sweep: one prompt, many children, one round trip each. */
      addBatchObservations: async (entries) => {
        const dated = entries.map((e) => normalise({ ...e, id: newObsId() }))
        dated.forEach(({ studentId, ...obs }) => upsertLocal(studentId, obs))
        await Promise.all(
          dated.map(({ studentId, ...obs }) =>
            persistObservation(studentId, obs).catch((err) => {
              console.warn('Failed to save sweep observation', err)
              setError(err)
            })
          )
        )
        writeAudit('observation.sweep', 'class', school.className, {
          count: dated.length,
        })
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
        writeAudit('student.create', 'student', row.id, { name: row.name })
      },

      /** Roster import. Returns the number of rows written. */
      importRoster: async (rows) => {
        const n = await persistStudents(rows)
        writeAudit('roster.import', 'class', school.className, { count: n })
        await refresh()
        return n
      },

      archiveStudent: async (studentId, archived = true) => {
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, archived } : s))
        )
        await archiveStudent(studentId, archived)
        writeAudit(archived ? 'student.archive' : 'student.restore', 'student', studentId)
      },

      addSelfAssessment: async (studentId, row) => {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? { ...s, selfAssessments: [...(s.selfAssessments || []), row] }
              : s
          )
        )
        await persistSelfAssessment(studentId, row)
      },

      addPeerAssessment: async (studentId, row) => {
        await persistPeerAssessment(studentId, row)
      },

      addParentNote: async (studentId, period, body) => {
        const parentId = profile?.id
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? {
                  ...s,
                  parentNotes: [
                    ...(s.parentNotes || []),
                    { period, body, created_at: new Date().toISOString() },
                  ],
                }
              : s
          )
        )
        await persistParentNote(studentId, parentId, period, body)
      },

      setSettings: (next) => setSettings((prev) => ({ ...prev, ...next })),
    }
  }, [students, settings, school, loading, error, lastSync, refresh, isAdmin, profile?.id])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
