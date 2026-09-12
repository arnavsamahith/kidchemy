// The philosophy layer.
//
// Everything here is a claim about children that we are willing to defend.
// See docs/PEDAGOGY.md for the reasoning and the sources. Nothing in this
// file talks to the database; it is pure vocabulary and pure rules, so it can
// be reviewed by a teacher who does not read code.

/* ══════════════════════════════════════════════════════════════════
   1. Frameworks we draw on, named in the product
   ══════════════════════════════════════════════════════════════════ */

export const FRAMEWORKS = {
  montessori: {
    id: 'montessori',
    label: 'Montessori',
    oneLine: 'Watch first. Separate what you saw from what you think it meant.',
    usedFor: 'The shape of an observation, and the concentration signal.',
  },
  reggio: {
    id: 'reggio',
    label: 'Reggio Emilia',
    oneLine: 'A child has a hundred languages. Count more than the verbal ones.',
    usedFor: 'The width of the tag vocabulary, and the family voice.',
  },
  learningStories: {
    id: 'learningStories',
    label: 'Learning Stories',
    oneLine: 'Notice, recognise, respond. Record what a child can do.',
    usedFor: 'The structure of the written note, and the dispositions.',
  },
  zpd: {
    id: 'zpd',
    label: 'Zone of proximal development',
    oneLine: 'The useful next step is just past what they manage alone.',
    usedFor: 'Every suggestion the product makes to a teacher or a parent.',
  },
  growthMindset: {
    id: 'growthMindset',
    label: 'Growth mindset',
    oneLine: 'Praise the strategy and what it changed, never the trait.',
    usedFor: 'The language guard, and the wording of every phrase bank.',
  },
  sdt: {
    id: 'sdt',
    label: 'Self-determination theory',
    oneLine: 'Autonomy, competence, relatedness. Pressure destroys all three.',
    usedFor: 'What we will and will not suggest to a parent.',
  },
  hpc: {
    id: 'hpc',
    label: 'Holistic Progress Card',
    oneLine: 'The five-domain, multi-stakeholder card NEP 2020 asks schools for.',
    usedFor: 'Domain mapping and the printable term view.',
  },
}

/* ══════════════════════════════════════════════════════════════════
   2. HPC domains (PARAKH / NCERT, NEP 2020)
   ══════════════════════════════════════════════════════════════════ */

export const HPC_DOMAINS = [
  {
    id: 'physical',
    label: 'Physical development',
    blurb: 'Body, coordination, health habits, use of space and materials.',
  },
  {
    id: 'socio-emotional',
    label: 'Socio-emotional development',
    blurb: 'Self-awareness, regulation, relationships, responsibility.',
  },
  {
    id: 'cognitive',
    label: 'Cognitive development',
    blurb: 'Reasoning, enquiry, problem solving, transfer of ideas.',
  },
  {
    id: 'language',
    label: 'Language and literacy',
    blurb: 'Expression, listening, reading, arguing a case.',
  },
  {
    id: 'aesthetic',
    label: 'Aesthetic and cultural',
    blurb: 'Making, imagining, performing, responding to what others make.',
  },
]

export const HPC_DOMAIN_MAP = Object.fromEntries(
  HPC_DOMAINS.map((d) => [d.id, d])
)

// The HPC rubric uses a landscape progression rather than marks. We keep the
// published names and attach our own plain-language gloss.
export const HPC_LEVELS = [
  {
    id: 'stream',
    label: 'Stream',
    gloss: 'Beginning to move. Needs the adult alongside.',
    order: 1,
  },
  {
    id: 'mountain',
    label: 'Mountain',
    gloss: 'Climbing. Manages with a prompt or a check-in.',
    order: 2,
  },
  {
    id: 'sky',
    label: 'Sky',
    gloss: 'Independent, and starting to help others get there.',
    order: 3,
  },
]

// Four stages from NEP 2020. Grade is the integer from the roster.
export const STAGES = [
  { id: 'foundational', label: 'Foundational', grades: [0, 1, 2], ages: '3 to 8' },
  { id: 'preparatory', label: 'Preparatory', grades: [3, 4, 5], ages: '8 to 11' },
  { id: 'middle', label: 'Middle', grades: [6, 7, 8], ages: '11 to 14' },
  { id: 'secondary', label: 'Secondary', grades: [9, 10, 11, 12], ages: '14 to 18' },
]

export function stageForGrade(grade) {
  // An unknown grade defaults to Middle, which is the most common case and the
  // one where withholding careers is the safe answer. Note that Number(null)
  // and Number('') are both 0, which would otherwise read as Foundational.
  if (grade === null || grade === undefined || grade === '') return STAGES[2]
  const g = Number(grade)
  if (!Number.isFinite(g)) return STAGES[2]
  return STAGES.find((s) => s.grades.includes(g)) || STAGES[3]
}

// Careers are withheld below Class 9 by default. A superadmin can move the
// threshold, or set it to 99 to switch careers off entirely.
// See docs/PEDAGOGY.md section 6 for why this gate exists.
export const DEFAULT_CAREER_MIN_GRADE = 9

export function showsCareerPathways(grade, minGrade = DEFAULT_CAREER_MIN_GRADE) {
  const g = Number(grade)
  if (!Number.isFinite(g)) return false
  return g >= Number(minGrade ?? DEFAULT_CAREER_MIN_GRADE)
}

/* ══════════════════════════════════════════════════════════════════
   3. Learning dispositions (Carr)
   How a child meets learning, as distinct from what they are good at.
   ══════════════════════════════════════════════════════════════════ */

export const DISPOSITIONS = [
  {
    id: 'interest',
    label: 'Taking an interest',
    blurb: 'Finds something here worth their attention, without being sold it.',
    hpc: 'cognitive',
    prompt: 'Chose to come back to something nobody made them come back to.',
  },
  {
    id: 'involvement',
    label: 'Being involved',
    blurb: 'Goes in deep enough that the room stops existing for a while.',
    hpc: 'socio-emotional',
    prompt: 'Lost track of time in a task. Did not notice the bell.',
  },
  {
    id: 'persisting',
    label: 'Persisting with difficulty',
    blurb: 'Stays with the part that does not work yet.',
    hpc: 'socio-emotional',
    prompt: 'Hit something hard and had another go rather than asking for the answer.',
  },
  {
    id: 'expressing',
    label: 'Expressing an idea',
    blurb: 'Gets what is inside their head into a form someone else can use.',
    hpc: 'language',
    prompt: 'Made their thinking visible: said it, drew it, built it, acted it out.',
  },
  {
    id: 'responsibility',
    label: 'Taking responsibility',
    blurb: 'Acts for the group, or for the room, without being told to.',
    hpc: 'socio-emotional',
    prompt: 'Took charge of something that was nobody in particular had been given.',
  },
]

export const DISPOSITION_MAP = Object.fromEntries(
  DISPOSITIONS.map((d) => [d.id, d])
)

/* ══════════════════════════════════════════════════════════════════
   4. The Learning Story structure
   This is the shape of the written note on an observation.
   ══════════════════════════════════════════════════════════════════ */

export const STORY_PARTS = [
  {
    id: 'context',
    label: 'What led to this',
    hint: 'One line. What was happening in the room.',
    required: false,
    placeholder: 'Group work on the water cycle, second period.',
    max: 140,
  },
  {
    id: 'saw',
    label: 'What I saw',
    hint: 'Only what happened. No verdict yet. This is the part that has to be true.',
    required: true,
    placeholder:
      'Took the diagram off the board and redrew it with the arrows reversed, then explained why.',
    max: 400,
    framework: 'montessori',
  },
  {
    id: 'meant',
    label: 'What I think it means',
    hint: 'Your reading of it. Marked as interpretation, and shown to parents as yours.',
    required: false,
    placeholder:
      'She is checking the model rather than copying it, which is new this term.',
    max: 300,
    framework: 'learningStories',
  },
  {
    id: 'next',
    label: 'What to offer next',
    hint: 'One step past what they manage alone, with the help named.',
    required: true,
    placeholder:
      'Give her a diagram with a deliberate error in it and see if she finds it unprompted.',
    max: 300,
    framework: 'zpd',
  },
]

/* ══════════════════════════════════════════════════════════════════
   5. The language guard
   Fixed-trait sentences are the thing this product exists to replace.
   Non-blocking: we nudge, we never refuse to save a teacher's words.
   ══════════════════════════════════════════════════════════════════ */

const FIXED_TRAIT_PATTERNS = [
  {
    re: /\b(is|isn'?t|is not|are|aren'?t)\s+(a\s+)?(bright|brilliant|gifted|talented|clever|smart|intelligent|dull|slow|weak|bad|poor|lazy|careless|average)\b/i,
    why: 'This labels the child rather than the work.',
    tryThis: 'Say what they did, and in what conditions.',
  },
  {
    re: /\b(a|an)\s+(maths|math|science|arts|sports|language)\s+(person|type|kid|child|student)\b/i,
    why: 'Sorting a child into a subject type tends to stick for years.',
    tryThis: 'Name the specific thing they did well in that subject instead.',
  },
  {
    re: /\bnot\s+(a\s+)?(creative|analytical|academic|detail)\b/i,
    why: 'A "not a ..." sentence closes a door that is not closed.',
    tryThis: 'Describe what is hard right now and what help changes it.',
  },
  {
    re: /\b(always|never)\s+(fails|forgets|struggles|disrupts|misbehaves)\b/i,
    why: 'Always and never are almost never true, and they read as a verdict.',
    tryThis: 'Give the count. "Three times this week, each time after lunch."',
  },
  {
    re: /\b(naturally|just)\s+(good|bad|gifted|talented)\b/i,
    why: 'Attributing it to nature removes the child from their own achievement in it.',
    tryThis: 'Name the strategy they used to get there.',
  },
  {
    re: /\b(weak|strong)\s+(student|child|in nature)\b/i,
    why: 'Ranks the child rather than describing the learning.',
    tryThis: 'Describe the specific skill and where it currently sits.',
  },
]

/**
 * Check a piece of teacher-written or generated text for fixed-trait
 * language. Returns an array of findings; empty means clean.
 */
export function checkLanguage(text) {
  if (!text || typeof text !== 'string') return []
  return FIXED_TRAIT_PATTERNS.filter((p) => p.re.test(text)).map((p) => ({
    match: (text.match(p.re) || [''])[0].trim(),
    why: p.why,
    tryThis: p.tryThis,
  }))
}

/* ══════════════════════════════════════════════════════════════════
   6. Process praise
   Effort alone is not the intervention. Effort + strategy + what changed.
   ══════════════════════════════════════════════════════════════════ */

export function processPraise({ what, strategy, changed }) {
  const parts = []
  if (what) parts.push(what.trim().replace(/\.$/, ''))
  if (strategy) parts.push(`by ${strategy.trim().replace(/^by\s+/i, '').replace(/\.$/, '')}`)
  if (changed) parts.push(`and it meant ${changed.trim().replace(/\.$/, '')}`)
  if (!parts.length) return ''
  const s = parts.join(', ')
  return s.charAt(0).toUpperCase() + s.slice(1) + '.'
}

/* ══════════════════════════════════════════════════════════════════
   7. The ZPD next-step engine
   Suggestions are ranked by how close they are to where the child currently
   observed band, not by how impressive they sound.
   ══════════════════════════════════════════════════════════════════ */

// Each rung names: what the adult does, and the signal that help can fade.
export const LADDERS = {
  curiosity: [
    {
      band: 0,
      move: 'Ask them one question this week that you do not know the answer to.',
      scaffold: 'You look it up together, out loud, without making it homework.',
      fade: 'They come back with a second question of their own.',
    },
    {
      band: 1,
      move: 'Let one of their questions set the direction of ten minutes of a lesson.',
      scaffold: 'You hold the structure; they choose the topic.',
      fade: 'They start asking before the topic is opened.',
    },
    {
      band: 2,
      move: 'Give them one question to carry for a fortnight and report back on.',
      scaffold: 'A check-in halfway, no marking.',
      fade: 'They keep a question going without the check-in.',
    },
  ],
  logic: [
    {
      band: 0,
      move: 'Show the shape of a problem before the numbers in it.',
      scaffold: 'You draw the structure; they fill one step.',
      fade: 'They sketch the structure themselves before starting.',
    },
    {
      band: 1,
      move: 'Ask them to find the step where a worked solution goes wrong.',
      scaffold: 'You tell them there is exactly one error.',
      fade: 'They find errors without being told there is one.',
    },
    {
      band: 2,
      move: 'Ask them to write the problem, not just solve it, for someone else.',
      scaffold: 'You test their problem and report back on what was unclear.',
      fade: 'Their problems work first time.',
    },
  ],
  creativity: [
    {
      band: 0,
      move: 'After the first right answer, ask for a second one.',
      scaffold: 'You accept a worse second answer without comment.',
      fade: 'They offer the second one unasked.',
    },
    {
      band: 1,
      move: 'Give a task with a constraint rather than an instruction.',
      scaffold: 'You name the constraint; the method is theirs.',
      fade: 'They set their own constraints to make it interesting.',
    },
    {
      band: 2,
      move: 'Let them make the thing that teaches the topic to the class.',
      scaffold: 'One rehearsal with you, one round of notes.',
      fade: 'They pitch the idea before you ask.',
    },
  ],
  communication: [
    {
      band: 0,
      move: 'Ask them to explain one thing back to you, to you alone.',
      scaffold: 'No audience, no correction until they finish.',
      fade: 'They volunteer an explanation in a small group.',
    },
    {
      band: 1,
      move: 'Give them one small group to explain something to.',
      scaffold: 'You pick the group and the topic; they pick the words.',
      fade: 'They speak up in the full class unprompted.',
    },
    {
      band: 2,
      move: 'Give them a position to argue that is not their own.',
      scaffold: 'Ten minutes of prep with you, then they are on their own.',
      fade: 'They hold a line under questioning.',
    },
  ],
  collaboration: [
    {
      band: 0,
      move: 'Pair them with one person on a task that needs both halves.',
      scaffold: 'You split the task so neither half works alone.',
      fade: 'They divide the work themselves.',
    },
    {
      band: 1,
      move: 'Make them responsible for one other person finishing.',
      scaffold: 'You check in with them, not with the other child.',
      fade: 'They notice who is stuck before you do.',
    },
    {
      band: 2,
      move: 'Give them a group with a real deadline and stay out of it.',
      scaffold: 'One debrief after, on process rather than product.',
      fade: 'The group runs without a debrief.',
    },
  ],
  persistence: [
    {
      band: 0,
      move: 'Let one thing stay unfinished overnight instead of rescuing it.',
      scaffold: 'You say out loud that unfinished is allowed.',
      fade: 'They return to it without being reminded.',
    },
    {
      band: 1,
      move: 'Give a problem you know takes three attempts.',
      scaffold: 'You name in advance that three attempts is normal.',
      fade: 'They keep going past the second failure without the warning.',
    },
    {
      band: 2,
      move: 'Give them one long thing: a build, a study, a piece, over weeks.',
      scaffold: 'A weekly five minute check, no grade attached.',
      fade: 'They set their own milestones.',
    },
  ],
  body: [
    {
      band: 0,
      move: 'Give them the tool rather than the worksheet about the tool.',
      scaffold: 'You set it up and demonstrate once, then step back.',
      fade: 'They set up their own materials before being told to.',
    },
    {
      band: 1,
      move: 'Give a task where the finished thing has to actually work.',
      scaffold: 'You supply the constraint and the materials, not the method.',
      fade: 'They test their own work before showing it to you.',
    },
    {
      band: 2,
      move: 'Let them teach the physical skill to someone who does not have it.',
      scaffold: 'You pick the learner, they pick how to explain it.',
      fade: 'The learner succeeds without you intervening.',
    },
  ],
  empathy: [
    {
      band: 0,
      move: 'Ask what happened to someone else today, not what happened to them.',
      scaffold: 'You go first and answer it about your own day.',
      fade: 'They report on someone else unprompted.',
    },
    {
      band: 1,
      move: 'Give them a job that helps a specific person who needs it.',
      scaffold: 'You name the person and the need; they choose the how.',
      fade: 'They spot the need themselves.',
    },
    {
      band: 2,
      move: 'Let them mediate something small and real between two people.',
      scaffold: 'You are in the room and silent.',
      fade: 'It gets handled before it reaches you.',
    },
  ],
}

/**
 * Pick the rung just above where the child currently sits.
 * score is the 0 to 100 dimension score; band 0/1/2 maps to the ladder.
 */
export function nextStepFor(dimensionId, score) {
  const ladder = LADDERS[dimensionId]
  if (!ladder) return null
  const band = score >= 62 ? 2 : score >= 30 ? 1 : 0
  const rung = ladder.find((r) => r.band === band) || ladder[0]
  return { ...rung, dimensionId, band }
}

/* ══════════════════════════════════════════════════════════════════
   8. Conditions we have seen work
   The honest replacement for "learning style". Situational, counted,
   revisable. Never stated as a trait.
   ══════════════════════════════════════════════════════════════════ */

export const CONDITIONS = {
  'with-materials': {
    id: 'with-materials',
    label: 'When there is something to handle',
    parent:
      'give the idea a physical form. A model, a broken thing to open, an actual measurement.',
    teacher: 'Lead with the object, then the words. Reverse the usual order.',
  },
  'after-thinking-time': {
    id: 'after-thinking-time',
    label: 'When there is a pause before answering',
    parent:
      'count to five in your head after asking something before filling the silence yourself.',
    teacher:
      'Ask the question, then name them ten seconds later. The answer is usually already forming.',
  },
  'working-alone-first': {
    id: 'working-alone-first',
    label: 'When they get the first go alone',
    parent:
      'let them attempt it by themselves before offering. The offer can come second.',
    teacher: 'Individual thinking time before the group phase, every time.',
  },
  'with-an-early-win': {
    id: 'with-an-early-win',
    label: 'When something goes right early on',
    parent:
      'start with the part you know they can do. Confidence is the bottleneck here, not ability.',
    teacher: 'Order the worksheet easiest first, even if it breaks the topic order.',
  },
  'explaining-to-someone': {
    id: 'explaining-to-someone',
    label: 'When they have to explain it to somebody',
    parent: 'ask them to teach you the homework rather than checking if it is right.',
    teacher: 'Make them the explainer. It is assessment and instruction at once.',
  },
  'with-a-real-stake': {
    id: 'with-a-real-stake',
    label: 'When it matters to someone real',
    parent:
      'give them one thing this month that a real person depends on them finishing.',
    teacher: 'Attach an audience to the work. Any audience beyond you.',
  },
  'with-room-to-choose': {
    id: 'with-room-to-choose',
    label: 'When they pick the direction',
    parent: 'offer two options rather than one instruction.',
    teacher: 'Fix the skill, let them choose the subject matter.',
  },
}

/* ══════════════════════════════════════════════════════════════════
   9. How to read this, for parents
   Shown on the parent profile. SDT section 7 of docs/PEDAGOGY.md.
   ══════════════════════════════════════════════════════════════════ */

export const PARENT_GUARDRAILS = [
  {
    do: 'Read it once, slowly, and then put it away.',
    dont: 'Do not read it out to your child as a list of things to fix.',
  },
  {
    do: 'Pick one suggestion. One is enough for a term.',
    dont: 'Do not treat the suggestions as homework, or add them to a routine.',
  },
  {
    do: 'Notice what is missing and ask the teacher about it.',
    dont: 'Do not read a blank section as a weakness. It means we have not seen it yet.',
  },
  {
    do: 'Compare this page to the same page last term.',
    dont: 'Do not compare it to another page. It is not built to rank.',
  },
]
