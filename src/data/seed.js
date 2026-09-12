// Reference data for the pilot classroom.
//
// The database is the source of truth (supabase/schema.sql seeds it and RLS
// scopes it). This file stays so the school header has a sensible fallback
// before a profile has loaded.

export const SCHOOL = {
  name: 'Vidya Vihar Public School',
  city: 'Chennai',
  className: 'Grade 7C',
  grade: 7,
  section: 'C',
  teacher: 'Ms. Rekha Iyer',
}

export const TEACHER_CODE_HINT = 'VIDYA-7C'
