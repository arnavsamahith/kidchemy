// Class-level analysis. Everything here is derived from the same taps the
// per-child profile uses. No separate scoring, so a teacher never sees two
// numbers that disagree.

import {
  DIMENSIONS,
  TAG_MAP,
  TAG_GROUPS,
  MILESTONE_MAP,
  PERIODS,
  SUBJECTS,
} from './taxonomy.js'
import {
  dimensionScores,
  growthSeries,
  profileDepth,
  hasStory,
} from './derive.js'

export const SERIES_COLORS = [
  'var(--color-series-1)',
  'var(--color-series-2)',
  'var(--color-series-3)',
  'var(--color-series-4)',
]

export const RAMP = [
  'var(--color-ramp-0)',
  'var(--color-ramp-1)',
  'var(--color-ramp-2)',
  'var(--color-ramp-3)',
  'var(--color-ramp-4)',
  'var(--color-ramp-5)',
]

/** Colour for one student, fixed by their position in the roster so a
 *  filter that hides a child never repaints the others. */
export function seriesColor(index) {
  return SERIES_COLORS[index % SERIES_COLORS.length]
}

/** Bucket a 0 to 100 score onto the sequential ramp. */
export function rampStep(score) {
  if (!score) return 0
  if (score < 20) return 1
  if (score < 40) return 2
  if (score < 60) return 3
  if (score < 78) return 4
  return 5
}

export function rampInk(step) {
  // Keep text legible inside the cell: ink on the pale steps, paper on dark.
  return step >= 4 ? 'var(--color-paper)' : 'var(--color-ink)'
}

/* ── Teacher-visible observation set ────────────────────────── */

export function allObservations(students) {
  return students.flatMap((s) =>
    s.observations.map((o) => ({ ...o, studentId: s.id, studentName: s.name }))
  )
}

/* ── Heatmap: every child by every dimension ─────────────────── */

export function dimensionMatrix(students) {
  return {
    dimensions: DIMENSIONS,
    rows: students.map((s) => ({
      id: s.id,
      name: s.name,
      cells: dimensionScores(s.observations).map((d) => ({
        id: d.id,
        label: d.label,
        score: d.score,
        band: d.band,
      })),
    })),
  }
}

/** Where the whole class is thin, the dimensions nobody has evidence for. */
export function classBlindSpots(students, threshold = 20) {
  if (!students.length) return []
  const perDim = DIMENSIONS.map((d) => {
    const scores = students.map(
      (s) => dimensionScores(s.observations).find((x) => x.id === d.id)?.score ?? 0
    )
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return {
      ...d,
      avg: Math.round(avg),
      seen: scores.filter((x) => x > 0).length,
      total: scores.length,
    }
  })
  return perDim.filter((d) => d.avg < threshold).sort((a, b) => a.avg - b.avg)
}

/* ── Growth over terms, per student ─────────────────────────── */

export function classGrowth(students) {
  const periods = PERIODS.filter((p) =>
    students.some((s) => s.observations.some((o) => o.period === p))
  )
  return {
    periods,
    series: students.map((s, i) => {
      const rows = growthSeries(s.observations)
      const byPeriod = Object.fromEntries(rows.map((r) => [r.period, r]))
      return {
        id: s.id,
        name: s.name,
        color: seriesColor(i),
        points: periods.map((p) => {
          const row = byPeriod[p]
          const dims = row?.dims || {}
          const vals = Object.values(dims)
          const value = vals.length
            ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
            : 0
          return { period: p, value, moved: row?.moved || [], count: row?.count ?? 0 }
        }),
      }
    }),
  }
}

/* ── Tag frequency across the class ─────────────────────────── */

export function tagFrequency(students, { limit = 12 } = {}) {
  const counts = {}
  allObservations(students).forEach((o) =>
    (o.tags || []).forEach((t) => {
      counts[t] = (counts[t] || 0) + 1
    })
  )
  const groupOf = Object.fromEntries(
    TAG_GROUPS.flatMap((g) => g.tags.map((t) => [t.id, g.label]))
  )
  return Object.entries(counts)
    .map(([id, count]) => ({
      id,
      count,
      label: TAG_MAP[id]?.label || id,
      group: groupOf[id] || '',
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
}

/** Tags nobody in the class has ever been given, usually says more about
 *  the teacher's habits than about the children. */
export function unusedTags(students) {
  const used = new Set(allObservations(students).flatMap((o) => o.tags || []))
  return TAG_GROUPS.flatMap((g) =>
    g.tags.filter((t) => !used.has(t.id)).map((t) => ({ ...t, group: g.label }))
  )
}

/* ── Coverage & cadence ─────────────────────────────────────── */

export function coverage(students, period) {
  const logged = students.filter((s) =>
    s.observations.some((o) => o.period === period)
  )
  const missing = students.filter(
    (s) => !s.observations.some((o) => o.period === period)
  )
  return {
    period,
    logged,
    missing,
    done: logged.length,
    total: students.length,
    pct: students.length
      ? Math.round((logged.length / students.length) * 100)
      : 0,
  }
}

export function daysSince(dateStr) {
  if (!dateStr) return null
  const then = new Date(dateStr)
  if (Number.isNaN(then.getTime())) return null
  return Math.round((Date.now() - then.getTime()) / 86400000)
}

export function lastObservation(student) {
  if (!student.observations.length) return null
  return [...student.observations].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  )[student.observations.length - 1]
}

/** Monthly observation counts across the class, the honest picture of how
 *  often this actually gets used. */
export function cadenceByMonth(students, months = 8) {
  const obs = allObservations(students)
  const buckets = new Map()
  obs.forEach((o) => {
    const key = String(o.date || '').slice(0, 7)
    if (!key) return
    buckets.set(key, (buckets.get(key) || 0) + 1)
  })
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-months)
    .map(([key, count]) => {
      const [y, m] = key.split('-')
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
        'en-IN',
        { month: 'short' }
      )
      return { key, label, year: y, count }
    })
}

/* ── Milestones, remarks, subjects ──────────────────────────── */

export function milestoneBreakdown(students) {
  const counts = {}
  allObservations(students).forEach((o) => {
    if (o.milestone) counts[o.milestone] = (counts[o.milestone] || 0) + 1
  })
  return Object.entries(counts)
    .map(([id, count]) => ({
      id,
      count,
      label: MILESTONE_MAP[id]?.label || id,
    }))
    .sort((a, b) => b.count - a.count)
}

/** Every per-tag remark a teacher has written, newest first. */
export function tagRemarks(observations = []) {
  return observations
    .flatMap((o) =>
      Object.entries(o.tagNotes || {}).map(([tagId, text]) => ({
        tagId,
        text,
        tagLabel: TAG_MAP[tagId]?.label || tagId,
        date: o.date,
        period: o.period,
        teacher: o.teacher,
        visibility: o.visibility || 'shared',
        observationId: o.id,
      }))
    )
    .filter((r) => r.text?.trim())
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

export function remarkCount(students) {
  return allObservations(students).reduce(
    (n, o) => n + Object.values(o.tagNotes || {}).filter((t) => t?.trim()).length,
    0
  )
}

const UNDERSTANDING_RANK = { 'Needs support': 1, Developing: 2, Strong: 3 }

/** Latest recorded understanding per subject, per student. */
export function subjectPicture(student) {
  const latest = {}
  ;[...student.observations]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .forEach((o) =>
      (o.subjects || []).forEach((s) => {
        if (!s.subject) return
        latest[s.subject] = { ...s, date: o.date, period: o.period }
      })
    )
  return SUBJECTS.map((subject) => ({
    subject,
    ...(latest[subject] || {}),
    rank: UNDERSTANDING_RANK[latest[subject]?.understanding] || 0,
  }))
}

/* ── Search & filter over the timeline ──────────────────────── */

export function filterObservations(observations, { query, period, tag, milestone, visibility }) {
  const q = (query || '').trim().toLowerCase()
  return observations.filter((o) => {
    if (period && o.period !== period) return false
    if (tag && !(o.tags || []).includes(tag)) return false
    if (milestone && o.milestone !== milestone) return false
    if (visibility && (o.visibility || 'shared') !== visibility) return false
    if (!q) return true
    const haystack = [
      o.note,
      o.story?.context,
      o.story?.saw,
      o.story?.meant,
      o.story?.next,
      o.teacher,
      o.period,
      ...(o.tags || []).map((t) => TAG_MAP[t]?.label || t),
      ...Object.values(o.tagNotes || {}),
      ...(o.subjects || []).map((s) => `${s.subject} ${s.note || ''}`),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

/* ══════════════════════════════════════════════════════════════════
   Equity and attention
   The single most important addition. A system that rewards visible
   behaviour will systematically under-describe quiet children, which is
   the same bias report cards have wearing nicer clothes. These functions
   exist so the bias is measured rather than assumed away.
   ══════════════════════════════════════════════════════════════════ */


/**
 * Who is being seen, and who is not. Sorted thinnest first on purpose,
 * because the top of this list is the work.
 */
export function attentionGap(students = []) {
  const rows = students.map((s) => {
    const obs = s.observations || []
    const depth = profileDepth(obs)
    const last = obs.length
      ? obs.map((o) => o.date).sort().slice(-1)[0]
      : null
    return {
      id: s.id,
      name: s.name,
      rollNo: s.rollNo,
      studentCode: s.studentCode,
      count: obs.length,
      stories: obs.filter(hasStory).length,
      depth: depth.score,
      depthLabel: depth.label,
      last,
      daysSince: last ? daysSince(last) : null,
      teachers: new Set(obs.map((o) => o.teacher).filter(Boolean)).size,
    }
  })

  const counts = rows.map((r) => r.count)
  const mean = counts.length
    ? counts.reduce((a, b) => a + b, 0) / counts.length
    : 0
  const max = Math.max(0, ...counts)
  const min = Math.min(0, ...counts)

  return {
    rows: rows.sort((a, b) => a.depth - b.depth || a.count - b.count),
    mean: Math.round(mean * 10) / 10,
    max,
    min,
    // Gini-ish: how unevenly attention is spread. 0 is perfectly even.
    spread: max > 0 ? Math.round(((max - min) / max) * 100) : 0,
    neglected: rows.filter((r) => r.count === 0 || (r.daysSince ?? 999) > 28),
  }
}

/**
 * Children nobody has looked at in a while. This is the nudge that keeps
 * the quiet third row from disappearing.
 */
export function overdue(students = [], days = 21) {
  return students
    .map((s) => {
      const last = (s.observations || []).map((o) => o.date).sort().slice(-1)[0]
      return { student: s, last, days: last ? daysSince(last) : null }
    })
    .filter((r) => r.days === null || r.days > days)
    .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999))
}

/**
 * How much of the record is being withheld from parents, per class. A
 * teacher who marks everything school-only has stopped believing the
 * product is safe, and that is worth knowing before the data dies.
 */
export function visibilitySplit(students = []) {
  const all = allObservations(students)
  const school = all.filter((o) => o.visibility === 'school').length
  const shared = all.length - school
  return {
    shared,
    school,
    total: all.length,
    schoolPct: all.length ? Math.round((school / all.length) * 100) : 0,
  }
}

/**
 * Does the record lean on growth edges rather than strengths for some
 * children and not others. Flags children whose record is mostly concerns.
 */
export function toneBalance(students = []) {
  return students
    .map((s) => {
      const obs = s.observations || []
      let strength = 0
      let edge = 0
      obs.forEach((o) =>
        (o.tags || []).forEach((t) => {
          const tag = TAG_MAP[t]
          if (!tag) return
          if (tag.isWatch) edge += 1
          else strength += 1
        })
      )
      const total = strength + edge
      return {
        id: s.id,
        name: s.name,
        strength,
        edge,
        edgePct: total ? Math.round((edge / total) * 100) : 0,
        total,
      }
    })
    .filter((r) => r.total >= 3 && r.edgePct >= 50)
    .sort((a, b) => b.edgePct - a.edgePct)
}

/** Roster grouped by grade and section, for the admin console. */
export function byClass(students = []) {
  const map = new Map()
  students.forEach((s) => {
    const key = `${s.grade ?? '?'}-${s.section ?? '?'}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        grade: s.grade,
        section: s.section,
        school: s.school,
        students: [],
      })
    }
    map.get(key).students.push(s)
  })
  return [...map.values()]
    .map((c) => ({
      ...c,
      count: c.students.length,
      observations: c.students.reduce(
        (n, s) => n + (s.observations?.length || 0),
        0
      ),
      coverage: c.students.filter((s) => (s.observations?.length || 0) > 0).length,
    }))
    .sort(
      (a, b) =>
        Number(a.grade) - Number(b.grade) ||
        String(a.section).localeCompare(String(b.section))
    )
}
