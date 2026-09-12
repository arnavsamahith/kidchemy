// Synthesis layer: turns a pile of teacher taps into a portrait.
//
// Deterministic and rule-based on purpose. It is the scaffolding an LLM would
// later replace for prose only. Dimensions, evidence counts and rankings stay
// rule-based so a teacher can always be shown exactly why the profile says
// what it says.
//
// Every phrase in here obeys the language guard in pedagogy.js: verbs and
// conditions, never fixed traits. See docs/PEDAGOGY.md.

import {
  DIMENSIONS,
  DIMENSION_MAP,
  TAG_MAP,
  MILESTONE_MAP,
  WATCH_RESPONSES,
  PERIODS,
} from './taxonomy.js'

import {
  CONDITIONS,
  DISPOSITIONS,
  DISPOSITION_MAP,
  HPC_DOMAINS,
  HPC_LEVELS,
  nextStepFor,
  showsCareerPathways,
} from './pedagogy.js'

const K = 6 // evidence needed before a dimension reads as fully established

/* ══════════════════════════════════════════════════════════════════
   Aggregation
   ══════════════════════════════════════════════════════════════════ */

export function aggregate(observations = []) {
  const weights = {}
  const tagCounts = {}
  const conditionCounts = {}
  const watchCounts = {}
  const milestoneCounts = {}
  const dispositionCounts = {}
  DIMENSIONS.forEach((d) => (weights[d.id] = 0))

  observations.forEach((obs) => {
    ;(obs.tags || []).forEach((tagId) => {
      const tag = TAG_MAP[tagId]
      if (!tag) return
      tagCounts[tagId] = (tagCounts[tagId] || 0) + 1
      if (tag.condition)
        conditionCounts[tag.condition] = (conditionCounts[tag.condition] || 0) + 1
      if (tag.watch) watchCounts[tag.watch] = (watchCounts[tag.watch] || 0) + 1
      Object.entries(tag.dims || {}).forEach(([dim, w]) => {
        weights[dim] = (weights[dim] || 0) + w
      })
    })
    ;(obs.dispositions || []).forEach((d) => {
      dispositionCounts[d] = (dispositionCounts[d] || 0) + 1
    })
    if (obs.milestone) {
      milestoneCounts[obs.milestone] = (milestoneCounts[obs.milestone] || 0) + 1
    }
    // A recorded stretch of self-chosen concentration is Montessori's key
    // signal, and counts toward involvement.
    if (Number(obs.concentrationMinutes) >= 10 && obs.selfChosen) {
      dispositionCounts.involvement = (dispositionCounts.involvement || 0) + 1
    }
  })

  return {
    weights,
    tagCounts,
    conditionCounts,
    watchCounts,
    milestoneCounts,
    dispositionCounts,
  }
}

// Diminishing returns: one tap is a hint, five taps is a pattern.
// Never reaches 100, because nothing about a child is ever finished.
function toScore(weight) {
  if (!weight) return 0
  return Math.round(100 * (1 - Math.exp(-weight / K)))
}

export function bandFor(score) {
  if (score === 0) return 'Not yet observed'
  if (score < 30) return 'Starting to show'
  if (score < 62) return 'Often seen'
  return 'A signature strength'
}

export function dimensionScores(observations = []) {
  const { weights, tagCounts } = aggregate(observations)
  return DIMENSIONS.map((d) => {
    const score = toScore(weights[d.id])
    const evidence = Object.entries(tagCounts)
      .filter(([tagId]) => (TAG_MAP[tagId]?.dims || {})[d.id])
      .sort((a, b) => b[1] - a[1])
      .map(([tagId, count]) => ({ label: TAG_MAP[tagId].label, count }))
    return { ...d, score, band: bandFor(score), evidence }
  })
}

export function topDimensions(observations, n = 3) {
  return dimensionScores(observations)
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}

/* ══════════════════════════════════════════════════════════════════
   Dispositions (Carr). How a child meets learning.
   ══════════════════════════════════════════════════════════════════ */

export function dispositionScores(observations = []) {
  const { dispositionCounts } = aggregate(observations)
  const total = observations.length || 1
  return DISPOSITIONS.map((d) => {
    const count = dispositionCounts[d.id] || 0
    return {
      ...d,
      count,
      share: Math.round((count / total) * 100),
      band: count === 0 ? 'Not yet noted' : count < 3 ? 'Noticed' : 'Reliably there',
    }
  })
}

/* ══════════════════════════════════════════════════════════════════
   HPC rollup. Five NEP 2020 domains, from the same taps.
   ══════════════════════════════════════════════════════════════════ */

export function hpcDomains(observations = []) {
  const dims = dimensionScores(observations)
  const disp = dispositionScores(observations)

  return HPC_DOMAINS.map((domain) => {
    const contributing = dims.filter((d) => d.hpc === domain.id)
    const dispContributing = disp.filter((d) => d.hpc === domain.id)
    const observed = contributing.filter((d) => d.score > 0)
    const score = observed.length
      ? Math.round(observed.reduce((s, d) => s + d.score, 0) / observed.length)
      : 0
    const evidenceCount =
      contributing.reduce((s, d) => s + d.evidence.reduce((t, e) => t + e.count, 0), 0) +
      dispContributing.reduce((s, d) => s + d.count, 0)

    const level =
      score === 0 ? null : score >= 62 ? HPC_LEVELS[2] : score >= 30 ? HPC_LEVELS[1] : HPC_LEVELS[0]

    return {
      ...domain,
      score,
      level,
      evidenceCount,
      dimensions: contributing,
      dispositions: dispContributing,
    }
  })
}

/* ══════════════════════════════════════════════════════════════════
   Phrase banks
   Verbs and conditions. No fixed-trait constructions anywhere.
   ══════════════════════════════════════════════════════════════════ */

const OPENERS = {
  curiosity: 'follows a question further than it was asked',
  logic: 'wants to know why something works, not only that it does',
  creativity: 'reaches for a second answer once the first one is found',
  communication: 'thinks out loud, and thinks better for it',
  collaboration: 'does their best thinking with other people in the room',
  persistence: 'stays with a hard thing long after it stops being fun',
  empathy: 'notices the person before the problem',
  body: 'works out what something is by handling it',
}

const SECOND = {
  curiosity: 'Interest tends to arrive before effort does, and it carries the effort with it.',
  logic: 'Given a structure to hold on to, the reasoning comes fast and clean.',
  creativity: 'Open-ended work is where the real ability shows. A single-right-answer task hides it.',
  communication: 'Ideas land better out loud than on paper, and that is worth protecting.',
  collaboration: 'Being useful to the group is part of how the learning happens here.',
  persistence: 'Difficulty is not a deterrent. It is often the point.',
  empathy: 'The social temperature of a room registers, and it shapes the work.',
  body: 'Space, tools and materials get handled with a confidence that is easy to miss on paper.',
}

const QUESTIONS = {
  curiosity: 'What did you wonder about today that nobody answered?',
  logic: 'What is something at school that does not make sense to you yet?',
  creativity: 'What would you change about how something is done, if you could?',
  communication: 'Can you teach me the thing you learned today?',
  collaboration: 'Who did you help this week, and who helped you?',
  persistence: 'What was the hardest thing you kept trying at?',
  empathy: 'Was anyone having a bad day today? What did you do?',
  body: 'What did you make or fix this week?',
}

const GENERIC_QUESTIONS = [
  'What is something you figured out by yourself this week?',
  'Is there anything at school you wish was taught differently?',
  'What do you think you are getting better at?',
]

/* ══════════════════════════════════════════════════════════════════
   What to feed next. Used below Class 9 in place of careers.
   ══════════════════════════════════════════════════════════════════ */

const FEED_NEXT = [
  {
    id: 'build',
    title: 'Things to build',
    dims: { creativity: 3, body: 2, logic: 1 },
    body: 'Kits, repairs, models, anything with a physical result and a chance of failing.',
    tryThis:
      'A tinkering or robotics club if the school has one, an Atal Tinkering Lab if the district does, and one broken appliance at home with permission to open it.',
  },
  {
    id: 'investigate',
    title: 'Questions to chase',
    dims: { curiosity: 3, logic: 3, persistence: 2 },
    body: 'One long investigation teaches more than ten short worksheets.',
    tryThis:
      'A science fair entry chosen for the question rather than the prize, a nature log kept for a term, or one household measurement tracked over weeks.',
  },
  {
    id: 'say-it',
    title: 'Audiences to talk to',
    dims: { communication: 3, empathy: 2, creativity: 1 },
    body: 'Expression improves fastest when somebody is actually listening.',
    tryThis:
      'Debate or MUN if it exists, a class newsletter if it does not, or reading aloud to a younger sibling twice a week.',
  },
  {
    id: 'run-it',
    title: 'Things to run',
    dims: { collaboration: 3, communication: 2, persistence: 2 },
    body: 'Responsibility for other people is a skill, and it needs reps.',
    tryThis:
      'One event, stall or team run end to end, allowed to go imperfectly, with the adults staying out of it.',
  },
  {
    id: 'look-after',
    title: 'Someone or something to look after',
    dims: { empathy: 3, communication: 2, body: 1 },
    body: 'Care is learned by being depended on, not by being told about.',
    tryThis:
      'A reading buddy in a lower class, a plant or animal that is genuinely theirs, or a weekly job the household actually needs done.',
  },
  {
    id: 'go-deep',
    title: 'One thing to go deep on',
    dims: { persistence: 3, creativity: 2, body: 2 },
    body: 'Depth in one pursuit teaches more than breadth across five.',
    tryThis:
      'Pick one thing, music, sport, code, a craft, and protect the practice hours from everything else.',
  },
]

/* ══════════════════════════════════════════════════════════════════
   Career pathways. Class 9 and above only, and never fewer than two.
   ══════════════════════════════════════════════════════════════════ */

const PATHWAYS = [
  {
    id: 'design-engineering',
    title: 'Making and designing things',
    dims: { creativity: 3, logic: 2, body: 2, curiosity: 1 },
    body: 'Building first and theorising second is the working habit of engineering, product design, architecture and industrial design.',
    next: 'Stream-wise this points at PCM with a design or computing elective, and portfolio work alongside it.',
  },
  {
    id: 'research-science',
    title: 'Asking questions for a living',
    dims: { curiosity: 3, logic: 3, persistence: 2 },
    body: 'Continuing to ask after the answer arrives is the core habit of research, in the sciences, in medicine, in economics.',
    next: 'PCM or PCB depending on where the questions point, with one long project rather than many short ones.',
  },
  {
    id: 'communication-law',
    title: 'Working with words and people',
    dims: { communication: 3, empathy: 2, creativity: 1 },
    body: 'Comfort in front of a room and care about how things are said points toward law, journalism, teaching, policy and the performing arts.',
    next: 'Humanities with a language or legal studies elective, and a debating record that is actually kept.',
  },
  {
    id: 'leadership-enterprise',
    title: 'Getting people moving',
    dims: { collaboration: 3, communication: 2, persistence: 2 },
    body: 'Organising other people around an idea is a distinct talent. It shows up in entrepreneurship, management, operations and public service.',
    next: 'Commerce or humanities, and something run end to end outside school that can be pointed at later.',
  },
  {
    id: 'care-people',
    title: 'Looking after people',
    dims: { empathy: 3, communication: 2, collaboration: 1 },
    body: 'Reading a room before reading a page leads to medicine, psychology, teaching and design research.',
    next: 'PCB or humanities with psychology, and sustained volunteering rather than a single camp.',
  },
  {
    id: 'craft-mastery',
    title: 'Going deep on one thing',
    dims: { persistence: 3, creativity: 2, body: 2, logic: 1 },
    body: 'Staying with difficulty pays anywhere mastery is rewarded: music, sport, mathematics, code, any craft.',
    next: 'Whichever stream leaves the practice hours intact. The stream matters less than the hours here.',
  },
]

/* ══════════════════════════════════════════════════════════════════
   Public derivations
   ══════════════════════════════════════════════════════════════════ */

export function buildNarrative(student, observations) {
  const first = String(student?.name || 'This child').split(' ')[0]
  if (!observations.length) {
    return `We are still getting to know ${first}. Once a few observations are recorded, this page fills in. A thin page here means we have not seen enough yet, not that there is little to see.`
  }
  const top = topDimensions(observations, 3)
  const { conditionCounts, milestoneCounts } = aggregate(observations)

  const lead = top[0]
  const parts = []
  if (lead) {
    parts.push(`${first} ${OPENERS[lead.id] || 'shows up with something of their own'}.`)
  }
  if (top[1] && SECOND[top[1].id]) parts.push(SECOND[top[1].id])

  if (conditionCounts['after-thinking-time']) {
    parts.push(
      `Quiet in a discussion does not mean absent. ${first} tends to arrive at the answer a little after the room has moved on, and it is usually worth waiting for.`
    )
  }
  if (conditionCounts['working-alone-first'] && !conditionCounts['after-thinking-time']) {
    parts.push(`The original thinking happens alone, and then gets brought back.`)
  }
  if (milestoneCounts.breakthrough) {
    parts.push(
      milestoneCounts.breakthrough === 1
        ? 'There has been a moment this year where something clicked visibly in class.'
        : 'There have been several moments this year where something clicked visibly in class.'
    )
  }
  if (milestoneCounts.improvement) {
    parts.push('The direction of travel this year has been clearly upward.')
  }

  const shared = observations.filter((o) => (o.visibility || 'shared') === 'shared')
  const lastStory = [...shared].reverse().find((o) => storyText(o, 'saw'))
  if (lastStory) {
    parts.push(`Most recently: "${storyText(lastStory, 'saw')}"`)
  }
  return parts.join(' ')
}

// Observations may carry either the old freeform `note` or the new
// Learning Story object. Read both.
export function storyText(obs, part) {
  if (!obs) return ''
  if (obs.story && obs.story[part]) return String(obs.story[part]).trim()
  if (part === 'saw' && obs.note) return String(obs.note).trim()
  return ''
}

export function hasStory(obs) {
  return Boolean(
    storyText(obs, 'saw') || storyText(obs, 'meant') || storyText(obs, 'next')
  )
}

/**
 * The honest replacement for "learning style". Situational, counted,
 * revisable. Returns an array so the UI can show the evidence count.
 */
export function conditionsThatWork(student, observations, audience = 'parent') {
  const first = String(student?.name || 'they').split(' ')[0]
  const { conditionCounts } = aggregate(observations)
  return Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const c = CONDITIONS[id]
      if (!c) return null
      return {
        id,
        label: c.label,
        count,
        advice: audience === 'teacher' ? c.teacher : `At home, ${c.parent}`,
        subject: first,
      }
    })
    .filter(Boolean)
}

/**
 * ZPD next steps. One rung above where the child currently sits, on each of
 * their strongest dimensions, with the scaffold and the fade named.
 */
export function nextSteps(observations, n = 3) {
  return topDimensions(observations, n)
    .map((d) => {
      const step = nextStepFor(d.id, d.score)
      if (!step) return null
      return { ...step, label: d.label, score: d.score, band: d.band }
    })
    .filter(Boolean)
}

/**
 * Growth edges. School-only unless the teacher shared the observation.
 */
export function growthEdges(observations, { includeSchoolOnly = false } = {}) {
  const source = includeSchoolOnly
    ? observations
    : observations.filter((o) => (o.visibility || 'shared') === 'shared')
  const { watchCounts } = aggregate(source)
  return Object.entries(watchCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const r = WATCH_RESPONSES[id]
      if (!r) return null
      return { id, count, ...r }
    })
    .filter(Boolean)
}

export function feedNext(observations, n = 2) {
  const scores = Object.fromEntries(
    dimensionScores(observations).map((d) => [d.id, d.score])
  )
  return FEED_NEXT.map((p) => ({
    ...p,
    fit: Object.entries(p.dims).reduce((s, [dim, w]) => s + w * (scores[dim] || 0), 0),
  }))
    .filter((p) => p.fit > 0)
    .sort((a, b) => b.fit - a.fit)
    .slice(0, n)
}

/**
 * Careers, gated by grade. Below Class 9 this returns an empty array and the
 * UI shows feedNext() instead. Never returns fewer than two when it returns
 * anything, so it reads as a space rather than a verdict.
 */
export function pathwaysFor(observations, grade, n = 2, minGrade) {
  if (!showsCareerPathways(grade, minGrade)) return []
  const scores = Object.fromEntries(
    dimensionScores(observations).map((d) => [d.id, d.score])
  )
  const ranked = PATHWAYS.map((p) => ({
    ...p,
    fit: Object.entries(p.dims).reduce((s, [dim, w]) => s + w * (scores[dim] || 0), 0),
  }))
    .filter((p) => p.fit > 0)
    .sort((a, b) => b.fit - a.fit)
  if (ranked.length < 2) return []
  return ranked.slice(0, Math.max(2, n))
}

/**
 * What a parent can do. Every item is an assisted-performance move from the
 * ZPD ladder, so it names what the adult does rather than what the child
 * should already manage.
 */
export function parentActions(observations, n = 3) {
  const steps = nextSteps(observations, n)
  const conditions = conditionsThatWork({ name: 'they' }, observations, 'parent')
  const out = steps.map((s) => ({
    move: s.move,
    scaffold: s.scaffold,
    fade: s.fade,
    from: s.label,
  }))
  if (conditions[0] && out.length) {
    out[out.length - 1] = {
      move: conditions[0].advice,
      scaffold: `We have seen this help ${conditions[0].count} time${
        conditions[0].count === 1 ? '' : 's'
      }.`,
      fade: 'Stop once they set it up that way themselves.',
      from: conditions[0].label,
    }
  }
  return out
}

export function conversationStarters(observations, n = 3) {
  const top = topDimensions(observations, n)
  const out = top.map((d) => QUESTIONS[d.id]).filter(Boolean)
  GENERIC_QUESTIONS.forEach((q) => {
    if (out.length < n) out.push(q)
  })
  return out.slice(0, n)
}

// Cumulative dimension scores at the end of each period the child has data
// for, plus what actually moved that term, otherwise every row reads the same.
export function growthSeries(observations) {
  const periods = PERIODS.filter((p) => observations.some((o) => o.period === p))
  let prev = null
  return periods.map((period) => {
    const upto = observations.filter(
      (o) => PERIODS.indexOf(o.period) <= PERIODS.indexOf(period)
    )
    const dims = Object.fromEntries(dimensionScores(upto).map((d) => [d.id, d.score]))
    const moved = prev
      ? DIMENSIONS.map((d) => ({
          label: d.label,
          delta: (dims[d.id] || 0) - (prev[d.id] || 0),
        }))
          .filter((d) => d.delta >= 6)
          .sort((a, b) => b.delta - a.delta)
          .slice(0, 2)
          .map((d) => d.label)
      : []
    const standing = Object.entries(dims)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => DIMENSION_MAP[id].label)

    const row = {
      period,
      dims,
      moved,
      standing,
      count: upto.length,
      inPeriod: observations.filter((o) => o.period === period).length,
    }
    prev = dims
    return row
  })
}

// One honest sentence about how much the profile is actually built on.
export function evidenceSummary(observations) {
  if (!observations.length) return 'No observations recorded yet.'
  const periods = new Set(observations.map((o) => o.period))
  const teachers = new Set(observations.map((o) => o.teacher).filter(Boolean))
  return `Built from ${observations.length} observation${
    observations.length === 1 ? '' : 's'
  } by ${teachers.size || 1} teacher${teachers.size === 1 ? '' : 's'} across ${
    periods.size
  } term${periods.size === 1 ? '' : 's'}.`
}

// How complete is this picture, honestly. Drives the thin-profile warning
// and the roster equity view.
export function profileDepth(observations) {
  const count = observations.length
  const dims = dimensionScores(observations).filter((d) => d.score > 0).length
  const terms = new Set(observations.map((o) => o.period)).size
  const stories = observations.filter(hasStory).length
  const score = Math.min(
    100,
    Math.round(count * 8 + dims * 5 + terms * 8 + stories * 6)
  )
  let label = 'Barely started'
  if (score >= 75) label = 'Well evidenced'
  else if (score >= 45) label = 'Taking shape'
  else if (score >= 20) label = 'Thin'
  return { score, label, count, dims, terms, stories }
}

export function growthHighlights(observations) {
  const series = growthSeries(observations)
  if (series.length < 2) return []
  const first = series[0].dims
  const last = series[series.length - 1].dims
  return DIMENSIONS.map((d) => ({
    ...d,
    delta: (last[d.id] || 0) - (first[d.id] || 0),
    to: last[d.id] || 0,
  }))
    .filter((d) => d.delta >= 10)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 2)
}

export function milestonesOf(observations) {
  return observations
    .filter((o) => o.milestone)
    .map((o) => ({
      ...o,
      milestoneLabel: MILESTONE_MAP[o.milestone]?.label || o.milestone,
    }))
    .reverse()
}

/**
 * The PTM prep sheet. Three things to praise, one to raise, two to ask.
 * This is the teacher's payback, and it is generated from taps they have
 * already made.
 */
export function ptmSheet(student, observations) {
  const top = topDimensions(observations, 3)
  const edges = growthEdges(observations, { includeSchoolOnly: true })
  const steps = nextSteps(observations, 1)
  const stories = observations.filter(hasStory).slice(-3).reverse()

  const praise = top.map((d) => {
    const best = d.evidence[0]
    return {
      title: d.label,
      line: best
        ? `${best.label}, seen ${best.count} time${best.count === 1 ? '' : 's'} this year.`
        : `${d.band} across the year.`,
      evidence: d.evidence.slice(0, 2),
    }
  })

  const raise = edges[0]
    ? { title: edges[0].title, line: edges[0].teacher, horizon: edges[0].horizon }
    : steps[0]
      ? {
          title: `Where to push next: ${steps[0].label}`,
          line: steps[0].move,
          horizon: steps[0].fade,
        }
      : null

  return {
    student,
    praise,
    raise,
    ask: [
      'What does this look like at home? Is it the same child or a different one?',
      'What is one thing you would like us to watch for next term?',
    ],
    stories: stories.map((o) => ({
      period: o.period,
      date: o.date,
      saw: storyText(o, 'saw'),
      meant: storyText(o, 'meant'),
    })),
    depth: profileDepth(observations),
  }
}

export { DIMENSION_MAP, DISPOSITION_MAP }
