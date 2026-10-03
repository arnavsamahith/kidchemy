import { createClient } from '@supabase/supabase-js'

// Config comes from env vars when present (Vercel / .env.local) and falls
// back to the pilot project so `npm run dev` works with no setup. The
// publishable key is safe to ship: RLS is what protects the data.
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
   Row mapping
   The database is snake_case, the app is camelCase. One place for it.
   ══════════════════════════════════════════════════════════════════ */

function fromStudentRow(s) {
  return {
    ...s,
    className: s.class_name,
    accessCode: s.access_code,
    studentCode: s.student_code,
    rollNo: s.roll_no,
    grade: s.grade,
    section: s.section,
    archived: Boolean(s.archived),
  }
}

function toStudentRow(s) {
  return {
    id: s.id,
    name: s.name,
    student_code: s.studentCode || null,
    grade: Number.isFinite(Number(s.grade)) ? Number(s.grade) : null,
    section: s.section || null,
    roll_no: Number.isFinite(Number(s.rollNo)) ? Number(s.rollNo) : null,
    class_name: s.className || null,
    school: s.school || null,
    frequency: s.frequency || 'Weekly',
    access_code: s.accessCode || null,
    archived: Boolean(s.archived),
  }
}

function fromObsRow(o, insights = []) {
  return {
    ...o,
    studentId: o.student_id,
    tagNotes: o.tag_notes || {},
    story: o.story || {},
    dispositions: o.dispositions || [],
    concentrationMinutes: o.concentration_minutes,
    selfChosen: Boolean(o.self_chosen),
    artefactUrl: o.artefact_url || '',
    subjects: insights
      .filter((i) => i.observation_id === o.id)
      .map(({ id, observation_id, ...rest }) => rest),
  }
}

/* ══════════════════════════════════════════════════════════════════
   Reads
   RLS does the scoping: a teacher gets the class, a parent gets their own
   child's shared observations, and nobody gets anything signed out.
   ══════════════════════════════════════════════════════════════════ */

export async function loadStudents() {
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('*')
    .order('grade', { ascending: true })
    .order('section', { ascending: true })
    .order('roll_no', { ascending: true })
  if (sErr) throw sErr
  if (!students?.length) return []

  const ids = students.map((s) => s.id)

  const [obsRes, selfRes, parentRes] = await Promise.all([
    supabase.from('observations').select('*').in('student_id', ids).order('date'),
    supabase.from('self_assessments').select('*').in('student_id', ids),
    supabase.from('parent_notes').select('*').in('student_id', ids),
  ])
  if (obsRes.error) throw obsRes.error

  const observations = obsRes.data || []
  const obsIds = observations.map((o) => o.id)
  let insights = []
  if (obsIds.length) {
    const { data, error } = await supabase
      .from('subject_insights')
      .select('*')
      .in('observation_id', obsIds)
    if (error) throw error
    insights = data || []
  }

  const mapped = observations.map((o) => fromObsRow(o, insights))
  const selfRows = selfRes.error ? [] : selfRes.data || []
  const parentRows = parentRes.error ? [] : parentRes.data || []

  return students.map((s) => ({
    ...fromStudentRow(s),
    observations: mapped.filter((o) => o.student_id === s.id),
    selfAssessments: selfRows.filter((r) => r.student_id === s.id),
    parentNotes: parentRows.filter((r) => r.student_id === s.id),
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
    story = {},
    dispositions = [],
    concentrationMinutes,
    selfChosen,
    artefactUrl,
  } = observation

  // Only keep remarks whose tag is still selected and whose text is real.
  const cleanNotes = Object.fromEntries(
    Object.entries(tagNotes)
      .filter(([tagId, text]) => (tags || []).includes(tagId) && text?.trim())
      .map(([tagId, text]) => [tagId, text.trim()])
  )

  const cleanStory = Object.fromEntries(
    Object.entries(story || {})
      .filter(([, v]) => typeof v === 'string' && v.trim())
      .map(([k, v]) => [k, v.trim()])
  )

  return {
    id,
    student_id: studentId,
    period,
    date,
    teacher,
    tags,
    note: note || null,
    milestone: milestone || null,
    visibility,
    tag_notes: cleanNotes,
    story: cleanStory,
    dispositions,
    concentration_minutes: Number.isFinite(Number(concentrationMinutes))
      ? Number(concentrationMinutes)
      : null,
    self_chosen: Boolean(selfChosen),
    artefact_url: artefactUrl || null,
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
  const { error } = await supabase.from('students').upsert(toStudentRow(student))
  if (error) throw error
}

/** Roster import. Chunked so a 600-child school does not time out. */
export async function persistStudents(students = []) {
  const rows = students.map(toStudentRow)
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase
      .from('students')
      .upsert(rows.slice(i, i + 100), { onConflict: 'id' })
    if (error) throw error
  }
  return rows.length
}

export async function archiveStudent(studentId, archived = true) {
  const { error } = await supabase
    .from('students')
    .update({ archived })
    .eq('id', studentId)
  if (error) throw error
}

/* ── The multi-stakeholder half of the HPC ──────────────────────── */

export async function persistSelfAssessment(studentId, row) {
  const { error } = await supabase.from('self_assessments').upsert({
    id: row.id,
    student_id: studentId,
    period: row.period,
    date: row.date,
    enjoyed: row.enjoyed || null,
    hard: row.hard || null,
    want_next: row.wantNext || null,
    feeling: row.feeling || null,
  })
  if (error) throw error
}

export async function persistPeerAssessment(studentId, row) {
  const { error } = await supabase.from('peer_assessments').insert({
    student_id: studentId,
    period: row.period,
    author_id: row.authorId || null,
    appreciation: row.appreciation || null,
    tag: row.tag || null,
  })
  if (error) throw error
}

export async function loadPeerAssessments(studentIds = []) {
  if (!studentIds.length) return []
  const { data, error } = await supabase
    .from('peer_assessments')
    .select('*')
    .in('student_id', studentIds)
  if (error) return []
  return data || []
}

export async function persistParentNote(studentId, parentId, period, body) {
  const { error } = await supabase.from('parent_notes').insert({
    student_id: studentId,
    parent_id: parentId,
    period,
    body,
  })
  if (error) throw error
}

/* ══════════════════════════════════════════════════════════════════
   Admin
   ══════════════════════════════════════════════════════════════════ */

export async function loadSettings() {
  const { data, error } = await supabase.from('app_settings').select('*')
  if (error) return {}
  return Object.fromEntries((data || []).map((r) => [r.key, r.value]))
}

export async function saveSetting(key, value) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function loadProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function setUserRole(email, role) {
  const { data, error } = await supabase.rpc('kc_set_role', {
    target_email: email.trim(),
    new_role: role,
  })
  if (error) throw error
  return data
}

export async function loadTeacherCodes() {
  const { data, error } = await supabase.from('teacher_codes').select('*')
  if (error) throw error
  return data || []
}

export async function saveTeacherCode(row) {
  const { error } = await supabase.from('teacher_codes').upsert({
    code: row.code.trim().toUpperCase(),
    school: row.school || null,
    class_name: row.className || null,
    grade: Number.isFinite(Number(row.grade)) ? Number(row.grade) : null,
    section: row.section || null,
    uses_left: Number.isFinite(Number(row.usesLeft)) ? Number(row.usesLeft) : null,
    expires_at: row.expiresAt || null,
  })
  if (error) throw error
}

export async function deleteTeacherCode(code) {
  const { error } = await supabase.from('teacher_codes').delete().eq('code', code)
  if (error) throw error
}

export async function loadSchools() {
  const { data, error } = await supabase.from('schools').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function saveSchool(row) {
  const { error } = await supabase.from('schools').upsert({
    id: row.id,
    name: row.name,
    city: row.city || null,
    class_name: row.className || null,
    teacher: row.teacher || null,
  })
  if (error) throw error
}

export async function loadAuditLog(limit = 200) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function writeAudit(action, entity, entityId, detail = {}) {
  try {
    // actor_id and actor_role are stamped by the database (security.sql),
    // so a browser cannot write an entry in someone else's name.
    await supabase.from('audit_log').insert({
      action,
      entity,
      entity_id: entityId ? String(entityId) : null,
      detail,
    })
  } catch {
    // Audit is best effort. Never block the teacher's work on it.
  }
}

/** Staff opened or exported a child's record (DPDP Rules r.6 access log). */
export async function logAccess(studentId, what = 'profile') {
  try {
    await supabase.rpc('kc_log_access', { sid: studentId, what })
  } catch {
    /* best effort */
  }
}

/* ══════════════════════════════════════════════════════════════════
   Consent, guardians and rights requests (security.sql sections 5–7)
   ══════════════════════════════════════════════════════════════════ */

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw error
  return data
}

export const pendingLinks = () => rpc('kc_pending_links')
export const confirmLink = (sid, notice, purposes) =>
  rpc('kc_confirm_link', { sid, notice_version: notice, purposes })
export const withdrawConsent = (sid) => rpc('kc_withdraw_consent', { sid })
export const studentGuardians = (sid) => rpc('kc_student_guardians', { sid })
export const revokeGuardian = (sid, pid) => rpc('kc_revoke_guardian', { sid, pid })
export const rotateAccessCode = (sid) => rpc('kc_rotate_access_code', { sid })
export const eraseStudent = (sid, reason) => rpc('kc_erase_student', { sid, reason })
export const applyRetention = () => rpc('kc_apply_retention')

export async function loadConsents(studentId) {
  let q = supabase.from('consents').select('*').order('created_at', { ascending: false })
  if (studentId) q = q.eq('student_id', studentId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function fileDataRequest({ studentId, kind, body }) {
  const { error } = await supabase.from('data_requests').insert({
    student_id: studentId || null,
    kind,
    body: (body || '').slice(0, 4000),
  })
  if (error) throw error
  writeAudit(`request.${kind}`, 'student', studentId)
}

export async function loadDataRequests() {
  const { data, error } = await supabase
    .from('data_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateDataRequest(id, patch) {
  const { data: u } = await supabase.auth.getUser()
  const done = patch.status === 'done' || patch.status === 'rejected'
  const { error } = await supabase
    .from('data_requests')
    .update({
      ...patch,
      resolved_at: done ? new Date().toISOString() : null,
      resolved_by: done ? u?.user?.id || null : null,
    })
    .eq('id', id)
  if (error) throw error
  writeAudit('request.update', 'data_request', id, { status: patch.status })
}

/* ══════════════════════════════════════════════════════════════════
   Two-factor (TOTP) for admin accounts
   Once an admin has a verified factor, admin powers need it in the
   session: kc_is_admin() checks the JWT's aal claim.
   ══════════════════════════════════════════════════════════════════ */

export async function mfaStatus() {
  const [{ data: aal }, { data: factors }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ])
  return {
    current: aal?.currentLevel || 'aal1',
    next: aal?.nextLevel || 'aal1',
    totp: (factors?.totp || []).filter((f) => f.status === 'verified'),
  }
}

export async function mfaEnroll() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `Kidchemy ${new Date().toISOString().slice(0, 10)}`,
  })
  if (error) throw error
  return data // { id, totp: { qr_code, secret, uri } }
}

export async function mfaVerify(factorId, code) {
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: String(code).replace(/\s/g, ''),
  })
  if (error) throw error
}

export async function mfaUnenroll(factorId) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
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
        // Only teachers send a code at signup. Parents link a child after
        // signing in, with the child's first name and an explicit consent.
        code: role === 'teacher' ? code?.trim() || '' : '',
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

export async function linkChild({ code, firstName, notice, purposes, relationship }) {
  const { data, error } = await supabase.rpc('kc_link_child', {
    child_code: String(code || '').trim(),
    child_first: String(firstName || '').trim(),
    notice_version: notice,
    purposes,
    relationship: relationship || null,
  })
  if (error) throw error
  if (!data?.ok) {
    const err = new Error(data?.error || 'UNKNOWN_CODE')
    err.left = data?.left
    throw err
  }
  return data.student_id
}
