import { createClient } from '@supabase/supabase-js'

// Config comes from env vars when present (Vercel / .env.local) and falls
// back to the pilot project so `npm run dev` works with no setup. The
// publishable key is safe to ship — RLS is what protects the data.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://zesfwfcpdpmxuhsvqvxu.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_JjAhjAeXHfq-ExY4Rh_eyw_quZkBxnC'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/* ══════════════════════════════════════════════════════════════════
   Reads
   RLS does the scoping: a teacher gets the class, a parent gets their
   own child's shared observations, and nobody gets anything signed out.
   ══════════════════════════════════════════════════════════════════ */

export async function loadStudents() {
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('*')
    .order('name')
  if (sErr) throw sErr
  if (!students?.length) return []

  const ids = students.map((s) => s.id)

  const { data: observations, error: oErr } = await supabase
    .from('observations')
    .select('*')
    .in('student_id', ids)
    .order('date')
  if (oErr) throw oErr

  const obsIds = (observations || []).map((o) => o.id)
  let insights = []
  if (obsIds.length) {
    const { data, error: iErr } = await supabase
      .from('subject_insights')
      .select('*')
      .in('observation_id', obsIds)
    if (iErr) throw iErr
    insights = data || []
  }

  const obsWithSubjects = (observations || []).map((o) => ({
    ...o,
    tagNotes: o.tag_notes || {},
    subjects: insights
      .filter((i) => i.observation_id === o.id)
      .map(({ id, observation_id, ...rest }) => rest),
  }))

  return students.map((s) => ({
    ...s,
    className: s.class_name,
    accessCode: s.access_code,
    observations: obsWithSubjects.filter((o) => o.student_id === s.id),
  }))
}

/* ══════════════════════════════════════════════════════════════════
   Writes
   ══════════════════════════════════════════════════════════════════ */

function obsRow(studentId, observation) {
  const {
    id,
    period,
    date,
    teacher,
    tags,
    note,
    milestone,
    visibility = 'shared',
    tagNotes = {},
  } = observation

  // Only keep remarks whose tag is still selected and whose text is real.
  const cleanNotes = Object.fromEntries(
    Object.entries(tagNotes)
      .filter(([tagId, text]) => (tags || []).includes(tagId) && text?.trim())
      .map(([tagId, text]) => [tagId, text.trim()])
  )

  return {
    id,
    student_id: studentId,
    period,
    date,
    teacher,
    tags,
    note,
    milestone: milestone || null,
    visibility,
    tag_notes: cleanNotes,
  }
}

async function writeSubjects(observationId, subjects = []) {
  await supabase.from('subject_insights').delete().eq('observation_id', observationId)
  const rows = subjects
    .filter((s) => s.understanding || s.engagement || s.note)
    .map((s) => ({
      observation_id: observationId,
      subject: s.subject,
      understanding: s.understanding || null,
      engagement: s.engagement || null,
      note: s.note || null,
    }))
  if (!rows.length) return
  const { error } = await supabase.from('subject_insights').insert(rows)
  if (error) throw error
}

export async function persistObservation(studentId, observation) {
  const { data: obs, error } = await supabase
    .from('observations')
    .upsert(obsRow(studentId, observation))
    .select()
    .single()
  if (error) throw error
  await writeSubjects(obs.id, observation.subjects)
  return obs
}

export async function updateObservationRow(studentId, observation) {
  return persistObservation(studentId, observation)
}

export async function deleteObservationRow(observationId) {
  const { error } = await supabase.from('observations').delete().eq('id', observationId)
  if (error) throw error
}

export async function persistFrequency(studentId, frequency) {
  const { error } = await supabase
    .from('students')
    .update({ frequency })
    .eq('id', studentId)
  if (error) throw error
}

export async function persistStudent(student) {
  const { error } = await supabase.from('students').upsert({
    id: student.id,
    name: student.name,
    class_name: student.className,
    school: student.school,
    frequency: student.frequency || 'Weekly',
    access_code: student.accessCode || null,
  })
  if (error) throw error
}

/* ══════════════════════════════════════════════════════════════════
   Auth
   ══════════════════════════════════════════════════════════════════ */

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
  return data
}

export async function signUp({ email, password, role, fullName, code }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        role,
        full_name: fullName?.trim() || '',
        code: code?.trim() || '',
      },
    },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function linkChild(code) {
  const { data, error } = await supabase.rpc('kc_link_child', {
    child_code: code.trim(),
  })
  if (error) throw error
  return data
}
