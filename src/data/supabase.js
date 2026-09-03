import { createClient } from '@supabase/supabase-js'

// Config comes from env vars when present (Vercel / Netlify / .env.local),
// and falls back to the pilot project so `npm run dev` works with no setup.
// The publishable key is safe to ship in the bundle — it is the browser key.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://zesfwfcpdpmxuhsvqvxu.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_JjAhjAeXHfq-ExY4Rh_eyw_quZkBxnC'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─────────────────────────────────────────────────────────────
// Helpers — read
// ─────────────────────────────────────────────────────────────

/**
 * Load all students for the pilot classroom, with their
 * observations and subject insights joined in.
 */
export async function loadStudents() {
  // Fetch students
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('*')
    .order('name')

  if (sErr) throw sErr

  // Fetch all observations
  const { data: observations, error: oErr } = await supabase
    .from('observations')
    .select('*')
    .order('date')

  if (oErr) throw oErr

  // Fetch all subject insights
  const { data: insights, error: iErr } = await supabase
    .from('subject_insights')
    .select('*')

  if (iErr) throw iErr

  // Attach subjects[] to each observation, then observations[] to each student
  const obsWithSubjects = observations.map((o) => ({
    ...o,
    subjects: insights
      .filter((i) => i.observation_id === o.id)
      .map(({ id, observation_id, ...rest }) => rest),
  }))

  return students.map((s) => ({
    ...s,
    className: s.class_name,
    observations: obsWithSubjects.filter((o) => o.student_id === s.id),
  }))
}

// ─────────────────────────────────────────────────────────────
// Helpers — write
// ─────────────────────────────────────────────────────────────

/**
 * Persist a single observation (and its subject insights) to Supabase.
 * Returns the inserted observation row.
 */
export async function persistObservation(studentId, observation) {
  const {
    id,
    period,
    date,
    teacher,
    tags,
    note,
    milestone,
    visibility = 'shared',
    subjects = [],
  } = observation

  const { data: obs, error: oErr } = await supabase
    .from('observations')
    .upsert({
      id,
      student_id: studentId,
      period,
      date,
      teacher,
      tags,
      note,
      milestone: milestone || null,
      visibility,
    })
    .select()
    .single()

  if (oErr) throw oErr

  if (subjects.length) {
    const rows = subjects
      .filter((s) => s.understanding || s.engagement || s.note)
      .map((s) => ({ observation_id: obs.id, ...s }))

    if (rows.length) {
      const { error: sErr } = await supabase
        .from('subject_insights')
        .insert(rows)
      if (sErr) throw sErr
    }
  }

  return obs
}

/**
 * Update a student's observation frequency preference.
 */
export async function persistFrequency(studentId, frequency) {
  const { error } = await supabase
    .from('students')
    .update({ frequency })
    .eq('id', studentId)

  if (error) throw error
}

/**
 * Seed students into Supabase if none exist yet.
 * Pass SEED_STUDENTS from seed.js.
 */
export async function seedIfEmpty(seedStudents) {
  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })

  if (count && count > 0) return // already seeded

  for (const s of seedStudents) {
    const { error: sErr } = await supabase
      .from('students')
      .upsert({
        id: s.id,
        name: s.name,
        class_name: s.className,
        school: s.school,
        frequency: s.frequency,
      })
    if (sErr) console.warn('seed student error', sErr)

    for (const o of s.observations) {
      const { subjects, ...obsFields } = o
      const { error: oErr } = await supabase
        .from('observations')
        .upsert({
          ...obsFields,
          student_id: s.id,
          milestone: o.milestone || null,
          visibility: o.visibility ?? 'shared',
        })
      if (oErr) console.warn('seed obs error', oErr)

      if (subjects?.length) {
        const rows = subjects
          .filter((sub) => sub.understanding || sub.engagement || sub.note)
          .map((sub) => ({ observation_id: o.id, ...sub }))
        if (rows.length) {
          const { error: iErr } = await supabase
            .from('subject_insights')
            .insert(rows)
          if (iErr) console.warn('seed insight error', iErr)
        }
      }
    }
  }
}
