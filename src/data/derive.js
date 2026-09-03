// Synthesis layer: turns a pile of teacher taps into a portrait.
//
// Everything here is deterministic and rule-based on purpose. It is the
// scaffolding an LLM would later replace for *prose only* — the dimensions,
// evidence counts and pathway ranking should stay rule-based so a teacher can
// always be shown exactly why the profile says what it says.

import {
  DIMENSIONS,
  DIMENSION_MAP,
  TAG_MAP,
  MILESTONE_MAP,
  PERIODS,
} from './taxonomy.js'

const K = 6 // evidence needed before a dimension reads as fully established

export function aggregate(observations = []) {
  const weights = {}
  const tagCounts = {}
  const styleCounts = {}
  const milestoneCounts = {}
  DIMENSIONS.forEach((d) => (weights[d.id] = 0))

  observations.forEach((obs) => {
    ;(obs.tags || []).forEach((tagId) => {
      const tag = TAG_MAP[tagId]
      if (!tag) return
      tagCounts[tagId] = (tagCounts[tagId] || 0) + 1
      if (tag.style) styleCounts[tag.style] = (styleCounts[tag.style] || 0) + 1
      Object.entries(tag.dims || {}).forEach(([dim, w]) => {
        weights[dim] = (weights[dim] || 0) + w
      })
    })
    if (obs.milestone) {
      milestoneCounts[obs.milestone] = (milestoneCounts[obs.milestone] || 0) + 1
    }
  })

  return { weights, tagCounts, styleCounts, milestoneCounts }
}

// Diminishing returns: one tap is a hint, five taps is a pattern.
// Never reaches 100 — nothing about a child is ever finished.
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

/* ------------------------------------------------------------------ */
/* Phrase banks                                                        */
/* ------------------------------------------------------------------ */

const OPENERS = {
  curiosity: 'follows a question further than it was asked',
  logic: 'wants to know why something works, not only that it does',
  creativity: 'reaches for the second answer once the first one is found',
  communication: 'thinks out loud, and thinks better for it',
  collaboration: 'does their best thinking with other people in the room',
  persistence: 'stays with a hard thing long after it stops being fun',
  empathy: 'notices the person before the problem',
}

const SECOND = {
  curiosity: 'Curiosity is the engine here — interest arrives before effort does.',
  logic: 'Given a structure to hold on to, the reasoning comes fast and clean.',
  creativity: 'Open-ended work is where the real ability shows; a single-right-answer task hides it.',
  communication: 'Ideas land better out loud than on paper, and that is worth protecting.',
  collaboration: 'Being useful to the group is part of how the learning happens.',
  persistence: 'Difficulty is not a deterrent — it is often the point.',
  empathy: 'The social temperature of a room registers, and it shapes the work.',
}

const LEARNING_STYLE = {
  kinesthetic:
    'learns with their hands. Abstract explanation slides off; a physical example, a model, or a thing to take apart makes it stick.',
  reflective:
    'is a slow-burn processor — not slower to understand, slower to speak. The answer is usually already forming; it needs a beat of silence to arrive.',
  independent:
    'thinks best with room and quiet. Group work is fine, but the original idea usually shows up alone.',
  encouragement:
    'starts carefully. A first small win early in a task changes the whole shape of what follows.',
}

const DIM_STYLE = {
  curiosity:
    'learns by chasing something. Start from a question they already care about and the syllabus follows.',
  logic:
    'learns by seeing the structure. Show the shape of a problem before the details and it clicks.',
  creativity:
    'learns by making. Give the concept a form — a drawing, a build, a story — and it stays.',
  communication:
    'learns by explaining. If they can teach it back to you, they own it.',
  collaboration:
    'learns in company. Understanding gets built in conversation, not in silence.',
  persistence:
    'learns by repetition and grit. Hard problems are the teaching tool, not the test.',
  empathy:
    'learns through people and stories. Give a concept a human stake and it holds.',
}

const PARENT_ACTIONS = {
  curiosity: [
    'Answer one “why” question this week with “I don’t know — let’s find out” and actually go find out together.',
    'Let one question at dinner run for ten minutes without steering it back to studies.',
  ],
  logic: [
    'Play something with rules and no luck — chess, Set, a logic puzzle book. Fifteen minutes, twice a week.',
    'Ask them to explain how something at home works: the fridge, the fan regulator, the water bill.',
  ],
  creativity: [
    'Give them something broken and permission to open it. No requirement to fix it.',
    'Ask for a second solution after they give you the first one, even when the first one is right.',
  ],
  communication: [
    'Ask them to teach you their homework instead of checking whether it is correct.',
    'Give them one real thing to negotiate this month — the weekend plan, the grocery list.',
  ],
  collaboration: [
    'Give them a task where someone else depends on them finishing it.',
    'Invite one friend over for something that has to be built together, not watched together.',
  ],
  persistence: [
    'Let one hard thing stay unsolved overnight instead of rescuing it.',
    'Name the effort out loud, not the result — “you stayed with that” beats “you got it right”.',
  ],
  empathy: [
    'Ask what happened to someone else at school today, not what happened to them.',
    'Let them help with something that has no reward attached to it.',
  ],
}

const QUESTIONS = {
  curiosity: 'What did you wonder about today that nobody answered?',
  logic: 'What is something at school that doesn’t make sense to you yet?',
  creativity: 'What would you change about how something is done, if you could?',
  communication: 'Can you teach me the thing you learned today?',
  collaboration: 'Who did you help this week, and who helped you?',
  persistence: 'What was the hardest thing you kept trying at?',
  empathy: 'Was anyone having a bad day today? What did you do?',
}

const GENERIC_QUESTIONS = [
  'What’s something you figured out by yourself this week?',
  'Is there anything at school you wish was taught differently?',
  'What do you think you’re getting better at?',
]

const PATHWAYS = [
  {
    id: 'design-engineering',
    title: 'Making and designing things',
    dims: { creativity: 3, logic: 2, curiosity: 1 },
    body:
      'Children who build first and theorise second often find their footing in engineering, product design, architecture or industrial design.',
    next:
      'From Class 7: a robotics or tinkering club, an Atal Tinkering Lab if the school has one, and physical model-making over worksheets.',
  },
  {
    id: 'research-science',
    title: 'Asking questions for a living',
    dims: { curiosity: 3, logic: 3, persistence: 2 },
    body:
      'A child who keeps asking after the answer arrives is showing the core habit of research — in the sciences, in medicine, in economics.',
    next:
      'From Class 7: science fairs and olympiad-style problem sets — for the questions, not the ranks. One long project beats ten short ones.',
  },
  {
    id: 'communication-law',
    title: 'Working with words and people',
    dims: { communication: 3, empathy: 2, creativity: 1 },
    body:
      'Comfort in front of a room and care about how things are said points toward law, journalism, teaching, policy or the performing arts.',
    next:
      'From Class 7: debate, MUN, a school paper, or simply a weekly audience of one at the dinner table.',
  },
  {
    id: 'leadership-enterprise',
    title: 'Getting people moving',
    dims: { collaboration: 3, communication: 2, persistence: 2 },
    body:
      'Organising other people around an idea is a distinct talent. It shows up later in entrepreneurship, management, operations and public service.',
    next:
      'From Class 7: let them run something end-to-end — a class event, a small sale, a team — and let it go imperfectly.',
  },
  {
    id: 'care-people',
    title: 'Looking after people',
    dims: { empathy: 3, communication: 2, collaboration: 1 },
    body:
      'Reading a room before reading a page is a real skill, and an undervalued one — it leads to medicine, psychology, teaching and design research.',
    next:
      'From Class 7: any role with responsibility for someone younger — a reading buddy, a junior team, a neighbourhood class.',
  },
  {
    id: 'craft-mastery',
    title: 'Going deep on one thing',
    dims: { persistence: 3, creativity: 2, logic: 1 },
    body:
      'A child who stays with difficulty tends to do well anywhere mastery is rewarded — music, sport, mathematics, code, any craft.',
    next:
      'From Class 7: pick one thing and protect the practice hours. Depth in a single pursuit teaches more than breadth across five.',
  },
]

/* ------------------------------------------------------------------ */
/* Public derivations                                                  */
/* ------------------------------------------------------------------ */

export function buildNarrative(student, observations) {
  const first = student.name.split(' ')[0]
  if (!observations.length) {
    return `${first}'s profile is still empty. Once ${first}'s teacher records a few observations, this page will fill in.`
  }
  const top = topDimensions(observations, 3)
  const { styleCounts, milestoneCounts } = aggregate(observations)

  const lead = top[0]
  const parts = []
  parts.push(
    `${first} is a child who ${OPENERS[lead.id] || 'shows up with something of their own'}.`
  )
  if (top[1]) parts.push(SECOND[top[1].id])
  if (styleCounts.reflective) {
    parts.push(
      `Quiet in a discussion does not mean absent — ${first} tends to arrive at the answer a little after the room has moved on, and it is usually worth waiting for.`
    )
  }
  if (styleCounts.independent && !styleCounts.reflective) {
    parts.push(`${first} does the original thinking alone, then brings it back.`)
  }
  if (milestoneCounts.breakthrough) {
    parts.push(
      `There have been ${milestoneCounts.breakthrough === 1 ? 'a moment' : 'moments'} this year where something clicked visibly in class.`
    )
  }
  if (milestoneCounts.improvement) {
    parts.push(`The direction of travel this year has been clearly upward.`)
  }
  const notes = observations.filter((o) => o.note && o.note.trim()).slice(-1)
  if (notes.length) {
    parts.push(`In their teacher's words: “${notes[0].note.trim()}”`)
  }
  return parts.join(' ')
}

export function learningStyle(student, observations) {
  const first = student.name.split(' ')[0]
  if (!observations.length) return null
  const { styleCounts } = aggregate(observations)
  const top = topDimensions(observations, 1)[0]
  const styleKey = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const lines = []
  if (styleKey && LEARNING_STYLE[styleKey]) {
    lines.push(`${first} ${LEARNING_STYLE[styleKey]}`)
  }
  if (top && DIM_STYLE[top.id]) {
    lines.push(`${lines.length ? 'They also ' : `${first} `}${DIM_STYLE[top.id]}`)
  }
  return lines.join(' ')
}

export function pathwaysFor(observations, n = 2) {
  const scores = Object.fromEntries(
    dimensionScores(observations).map((d) => [d.id, d.score])
  )
  return PATHWAYS.map((p) => {
    const fit = Object.entries(p.dims).reduce(
      (sum, [dim, w]) => sum + w * (scores[dim] || 0),
      0
    )
    return { ...p, fit }
  })
    .filter((p) => p.fit > 0)
    .sort((a, b) => b.fit - a.fit)
    .slice(0, n)
}

export function parentActions(observations, n = 3) {
  const top = topDimensions(observations, n)
  const { styleCounts } = aggregate(observations)
  const out = top.map((d, i) => PARENT_ACTIONS[d.id][i % PARENT_ACTIONS[d.id].length])
  if (styleCounts.encouragement && out.length) {
    out[out.length - 1] =
      'Find one thing to praise before you find the thing to correct. Confidence is the bottleneck right now, not ability.'
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

// Cumulative dimension scores at the end of each period the child has data for,
// plus what actually moved that term — otherwise every row reads the same.
export function growthSeries(observations) {
  const periods = PERIODS.filter((p) => observations.some((o) => o.period === p))
  let prev = null
  return periods.map((period) => {
    const upto = observations.filter(
      (o) => PERIODS.indexOf(o.period) <= PERIODS.indexOf(period)
    )
    const dims = Object.fromEntries(
      dimensionScores(upto).map((d) => [d.id, d.score])
    )
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
  const periods = new Set(observations.map((o) => o.period))
  const teachers = new Set(observations.map((o) => o.teacher).filter(Boolean))
  if (!observations.length) return 'No observations recorded yet.'
  return `Built from ${observations.length} observation${
    observations.length === 1 ? '' : 's'
  } by ${teachers.size} teacher${teachers.size === 1 ? '' : 's'} across ${
    periods.size
  } term${periods.size === 1 ? '' : 's'}.`
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

export { DIMENSION_MAP }
