import { randomFrom } from './safety.js'
// Roster import.
//
// A teacher will not type forty names. This parses the format the school
// already has: the CSV exported from the school ERP, or pasted straight out
// of a spreadsheet. It is deliberately forgiving about header spelling,
// because every ERP calls these columns something slightly different.
//
// Canonical shape (dump/kidchemy - Student data.csv):
//   Student Name, Student ID, Current Grade, Current Section, Current Roll Number

const HEADER_ALIASES = {
  name: [
    'student name',
    'name',
    'studentname',
    'full name',
    'pupil name',
    "student's name",
  ],
  studentCode: [
    'student id',
    'studentid',
    'id',
    'admission no',
    'admission number',
    'adm no',
    'enrolment no',
    'enrollment no',
    'reg no',
    'registration number',
    'uid',
  ],
  grade: [
    'current grade',
    'grade',
    'class',
    'standard',
    'std',
    'current class',
  ],
  section: [
    'current section',
    'section',
    'sec',
    'division',
    'div',
  ],
  rollNo: [
    'current roll number',
    'roll number',
    'roll no',
    'rollno',
    'roll',
    'sr no',
    'serial',
  ],
}

const norm = (s) =>
  String(s || '')
    .replace(/^﻿/, '')
    .trim()
    .toLowerCase()
    .replace(/[_.]+/g, ' ')
    .replace(/\s+/g, ' ')

function matchHeader(cell) {
  const n = norm(cell)
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(n)) return field
  }
  return null
}

/** Split one CSV line, honouring quoted fields containing commas. */
function splitLine(line, delimiter) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i += 1
        } else quoted = false
      } else cur += ch
    } else if (ch === '"') {
      quoted = true
    } else if (ch === delimiter) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

function detectDelimiter(sample) {
  const counts = { ',': 0, '\t': 0, ';': 0, '|': 0 }
  for (const ch of sample) if (ch in counts) counts[ch] += 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ','
}

/** Slug a name into a stable, non-guessable-adjacent id fragment. */
function slug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

/**
 * Parent-facing access code. Short, readable over a phone, and not derived
 * from the child's name, so a report card sticker does not leak who it is
 * for if it is photographed.
 */
export function makeAccessCode() {
  // crypto.getRandomValues, not Math.random: these codes open a child's page.
  const raw = randomFrom('ACDEFGHJKLMNPQRTUVWXY3479', 8)
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

/**
 * Parse pasted CSV or TSV into student rows.
 * Returns { rows, errors, headerMap, skipped }.
 */
export function parseRoster(text, { defaultSchool = '', defaultGrade = '', defaultSection = '' } = {}) {
  const errors = []
  const rows = []
  if (!text || !text.trim()) {
    return { rows, errors: ['Nothing pasted yet.'], headerMap: {}, skipped: 0 }
  }

  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length)

  if (!lines.length) {
    return { rows, errors: ['Nothing readable in that.'], headerMap: {}, skipped: 0 }
  }

  const delimiter = detectDelimiter(lines[0])
  const headerCells = splitLine(lines[0], delimiter)
  const headerMap = {}
  headerCells.forEach((cell, i) => {
    const field = matchHeader(cell)
    if (field && headerMap[field] === undefined) headerMap[field] = i
  })

  let start = 1
  // No recognisable header: assume the canonical column order.
  if (headerMap.name === undefined) {
    errors.push(
      'No header row recognised, so columns were read in the order: name, student id, grade, section, roll number.'
    )
    headerMap.name = 0
    headerMap.studentCode = 1
    headerMap.grade = 2
    headerMap.section = 3
    headerMap.rollNo = 4
    start = 0
  }

  const seenCodes = new Set()
  let skipped = 0

  for (let i = start; i < lines.length; i += 1) {
    const cells = splitLine(lines[i], delimiter)
    const get = (field) =>
      headerMap[field] === undefined ? '' : (cells[headerMap[field]] || '').trim()

    const name = get('name')
    if (!name) {
      skipped += 1
      continue
    }

    const studentCode = get('studentCode') || ''
    const gradeRaw = get('grade') || defaultGrade
    const grade = parseInt(String(gradeRaw).replace(/\D+/g, ''), 10)
    const section = (get('section') || defaultSection || '').toUpperCase().slice(0, 4)
    const rollRaw = get('rollNo')
    const rollNo = rollRaw ? parseInt(String(rollRaw).replace(/\D+/g, ''), 10) : null

    if (studentCode && seenCodes.has(studentCode.toLowerCase())) {
      errors.push(`Row ${i + 1}: duplicate student id ${studentCode}, skipped.`)
      skipped += 1
      continue
    }
    if (studentCode) seenCodes.add(studentCode.toLowerCase())

    if (!Number.isFinite(grade)) {
      errors.push(`Row ${i + 1}: could not read a grade for ${name}.`)
    }

    rows.push({
      id: studentCode ? `s_${slug(studentCode)}` : `s_${slug(name)}_${i}`,
      name,
      studentCode: studentCode || null,
      grade: Number.isFinite(grade) ? grade : null,
      section: section || null,
      rollNo: Number.isFinite(rollNo) ? rollNo : null,
      className:
        Number.isFinite(grade) && section
          ? `Grade ${grade}${section}`
          : Number.isFinite(grade)
            ? `Grade ${grade}`
            : '',
      school: defaultSchool,
      frequency: 'Weekly',
      accessCode: makeAccessCode(),
      observations: [],
    })
  }

  if (!rows.length) errors.push('No student rows found.')
  return { rows, errors, headerMap, skipped }
}

/** Display name for a class, used everywhere a class is labelled. */
export function classLabel(student) {
  if (!student) return ''
  if (student.grade && student.section) return `Grade ${student.grade}${student.section}`
  if (student.grade) return `Grade ${student.grade}`
  return student.className || ''
}

/** Sort a roster the way a register is sorted: by roll number, then name. */
export function byRoll(a, b) {
  const ar = Number.isFinite(Number(a.rollNo)) ? Number(a.rollNo) : 9999
  const br = Number.isFinite(Number(b.rollNo)) ? Number(b.rollNo) : 9999
  return ar - br || String(a.name).localeCompare(String(b.name))
}

export const SAMPLE_CSV = `Student Name,Student ID,Current Grade,Current Section,Current Roll Number
Aarav Sharma,2019M01,7,C,1
Ananya Iyer,2019F02,7,C,2`
