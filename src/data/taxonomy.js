// The vocabulary of Kidchemy.
//
// Every tag a teacher can tap carries weights into one or more dimensions,
// and every dimension maps to one of the five NEP 2020 Holistic Progress Card
// domains. This is the single place to edit when a pilot teacher says
// "this tag is wrong".
//
// Reggio's hundred languages is the reason this list is wider than the
// original four groups: a child whose fluency is in building, movement or
// care should be able to accumulate a real profile here, not a thin one.

import { HPC_DOMAINS } from './pedagogy.js'

export { HPC_DOMAINS }

export const DIMENSIONS = [
  {
    id: 'curiosity',
    label: 'Curiosity',
    blurb: 'Asks, wonders, follows an idea past where the lesson stopped.',
    hpc: 'cognitive',
  },
  {
    id: 'logic',
    label: 'Reasoning',
    blurb: 'Reasons in steps, spots structure, holds an argument together.',
    hpc: 'cognitive',
  },
  {
    id: 'creativity',
    label: 'Making and imagining',
    blurb: 'Finds the second answer. Gives an idea a form other people can see.',
    hpc: 'aesthetic',
  },
  {
    id: 'communication',
    label: 'Expression',
    blurb: 'Puts thoughts into words, pictures or gestures others can use.',
    hpc: 'language',
  },
  {
    id: 'collaboration',
    label: 'Working with others',
    blurb: 'Works with, not just alongside. Shares the thinking.',
    hpc: 'socio-emotional',
  },
  {
    id: 'persistence',
    label: 'Persistence',
    blurb: 'Stays with a hard thing after the first attempt fails.',
    hpc: 'socio-emotional',
  },
  {
    id: 'empathy',
    label: 'Care for others',
    blurb: 'Notices how others feel and acts on it.',
    hpc: 'socio-emotional',
  },
  {
    id: 'body',
    label: 'Body and craft',
    blurb: 'Handles tools, space and materials with control and confidence.',
    hpc: 'physical',
  },
]

export const DIMENSION_MAP = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d]))

/* ══════════════════════════════════════════════════════════════════
   Tags
   dims:      weight into a dimension score
   condition: a situational signal ("we have seen them do well when ...")
              rather than a score. Never presented as a fixed trait.
   watch:     a growth edge. Defaults to school-only visibility.
   ══════════════════════════════════════════════════════════════════ */

export const TAG_GROUPS = [
  {
    id: 'cognitive',
    label: 'How they think',
    hint: 'Reasoning and enquiry',
    accent: 'moss',
    hpc: 'cognitive',
    tags: [
      { id: 'logical', label: 'Reasons in clear steps', dims: { logic: 3 } },
      {
        id: 'creative-solver',
        label: 'Finds another way through',
        dims: { creativity: 3, logic: 1 },
      },
      {
        id: 'deep-questions',
        label: 'Asks a question past the lesson',
        dims: { curiosity: 3, logic: 1 },
      },
      {
        id: 'quick-grasp',
        label: 'Picks up a new idea fast',
        dims: { logic: 2, curiosity: 1 },
      },
      {
        id: 'patterns',
        label: 'Spots the pattern',
        dims: { logic: 2, creativity: 2 },
      },
      {
        id: 'transfers',
        label: 'Uses an idea somewhere new',
        dims: { logic: 2, curiosity: 2 },
      },
      { id: 'strong-recall', label: 'Holds detail reliably', dims: { logic: 1 } },
      {
        id: 'needs-time',
        label: 'Answers after a pause',
        dims: {},
        condition: 'after-thinking-time',
      },
    ],
  },
  {
    id: 'social',
    label: 'How they are with others',
    hint: 'Relationships and responsibility',
    accent: 'clay',
    hpc: 'socio-emotional',
    tags: [
      {
        id: 'leader',
        label: 'Gets a group moving',
        dims: { communication: 2, collaboration: 2 },
      },
      { id: 'teams', label: 'Works well in a team', dims: { collaboration: 3 } },
      {
        id: 'helps-peers',
        label: 'Helps someone without being asked',
        dims: { empathy: 2, collaboration: 1 },
      },
      {
        id: 'confident-speaker',
        label: 'Says it clearly in front of others',
        dims: { communication: 3 },
      },
      {
        id: 'listens',
        label: 'Changes their mind after listening',
        dims: { empathy: 2, collaboration: 2 },
      },
      {
        id: 'takes-charge',
        label: 'Takes on a job nobody assigned',
        dims: { collaboration: 2, persistence: 1 },
      },
      {
        id: 'works-alone',
        label: 'Does the first thinking alone',
        dims: {},
        condition: 'working-alone-first',
      },
      {
        id: 'shy-thoughtful',
        label: 'Quiet, and worth waiting for',
        dims: { empathy: 1 },
        condition: 'after-thinking-time',
      },
    ],
  },
  {
    id: 'emotional',
    label: 'How they meet difficulty',
    hint: 'Regulation and resolve',
    accent: 'moss',
    hpc: 'socio-emotional',
    tags: [
      {
        id: 'persists',
        label: 'Stays with the hard part',
        dims: { persistence: 3 },
      },
      {
        id: 'recovers',
        label: 'Gets frustrated, then comes back',
        dims: { persistence: 2 },
      },
      {
        id: 'motivated',
        label: 'Starts without being pushed',
        dims: { persistence: 2, curiosity: 1 },
      },
      { id: 'empathetic', label: 'Notices how someone else feels', dims: { empathy: 3 } },
      {
        id: 'expressive',
        label: 'Says what they are feeling',
        dims: { communication: 2, empathy: 1 },
      },
      {
        id: 'asks-for-help',
        label: 'Asks for help at the right moment',
        dims: { persistence: 1, communication: 1 },
      },
      {
        id: 'needs-encouragement',
        label: 'Starts better after one early win',
        dims: {},
        condition: 'with-an-early-win',
      },
    ],
  },
  {
    id: 'making',
    label: 'What they make',
    hint: 'Hands, tools and materials',
    accent: 'clay',
    hpc: 'aesthetic',
    tags: [
      {
        id: 'hands-on',
        label: 'Reaches for the materials first',
        dims: { curiosity: 2, creativity: 1, body: 2 },
        condition: 'with-materials',
      },
      {
        id: 'builds-to-explain',
        label: 'Builds or draws it to explain it',
        dims: { creativity: 3, communication: 2, body: 1 },
      },
      {
        id: 'careful-craft',
        label: 'Cares how the finished thing looks',
        dims: { body: 3, persistence: 1 },
      },
      {
        id: 'improvises',
        label: 'Makes do with what is there',
        dims: { creativity: 2, body: 2 },
      },
      {
        id: 'performs',
        label: 'Acts, sings or performs an idea',
        dims: { creativity: 2, communication: 2, body: 1 },
      },
    ],
  },
  {
    id: 'body',
    label: 'Body and space',
    hint: 'Physical development',
    accent: 'moss',
    hpc: 'physical',
    tags: [
      {
        id: 'coordinated',
        label: 'Moves with control and confidence',
        dims: { body: 3 },
      },
      {
        id: 'energy-outdoors',
        label: 'Different child outdoors',
        dims: { body: 2, curiosity: 1 },
      },
      {
        id: 'cares-for-space',
        label: 'Leaves the space better than they found it',
        dims: { body: 1, empathy: 1, collaboration: 1 },
      },
      {
        id: 'stamina',
        label: 'Keeps going physically when others stop',
        dims: { body: 2, persistence: 2 },
      },
    ],
  },
  {
    id: 'interests',
    label: 'What lights them up',
    hint: 'Interests and enquiry',
    accent: 'clay',
    hpc: 'cognitive',
    tags: [
      {
        id: 'curious-sciences',
        label: 'Curious about how things work',
        dims: { curiosity: 2, logic: 1 },
      },
      {
        id: 'creative-tasks',
        label: 'Comes alive in open-ended work',
        dims: { creativity: 3 },
        condition: 'with-room-to-choose',
      },
      {
        id: 'stories-language',
        label: 'Drawn to stories and words',
        dims: { communication: 2, creativity: 1 },
      },
      {
        id: 'numbers-puzzles',
        label: 'Drawn to numbers and puzzles',
        dims: { logic: 3 },
      },
      {
        id: 'living-things',
        label: 'Drawn to animals, plants, growing things',
        dims: { curiosity: 2, empathy: 1 },
      },
      {
        id: 'teaching-others',
        label: 'Lights up when explaining to someone',
        dims: { communication: 2, empathy: 1 },
        condition: 'explaining-to-someone',
      },
      {
        id: 'real-audience',
        label: 'Lifts when the work has a real audience',
        dims: { persistence: 1, communication: 1 },
        condition: 'with-a-real-stake',
      },
    ],
  },
  {
    id: 'watch',
    label: 'Growth edges',
    hint: 'School-only by default',
    accent: 'warn',
    hpc: 'socio-emotional',
    watchGroup: true,
    tags: [
      {
        id: 'gap-expression',
        label: 'Understands more than they can write down',
        dims: {},
        watch: 'expression',
      },
      {
        id: 'gap-starting',
        label: 'Slow to start, fine once started',
        dims: {},
        watch: 'initiation',
      },
      {
        id: 'gap-finishing',
        label: 'Starts well, does not finish',
        dims: {},
        watch: 'completion',
      },
      {
        id: 'gap-attention',
        label: 'Attention drifts in long tasks',
        dims: {},
        watch: 'attention',
      },
      {
        id: 'gap-group',
        label: 'Withdraws in group work',
        dims: {},
        watch: 'group',
      },
      {
        id: 'gap-setback',
        label: 'A setback ends the session',
        dims: {},
        watch: 'setback',
      },
    ],
  },
]

export const ALL_TAGS = TAG_GROUPS.flatMap((g) =>
  g.tags.map((t) => ({
    ...t,
    group: g.id,
    groupLabel: g.label,
    hpc: t.hpc || g.hpc,
    isWatch: Boolean(g.watchGroup || t.watch),
  }))
)
export const TAG_MAP = Object.fromEntries(ALL_TAGS.map((t) => [t.id, t]))

export const WATCH_TAGS = ALL_TAGS.filter((t) => t.isWatch)

// What to do about each growth edge. Paired with the tag, shown to the
// teacher immediately and to the parent only if the teacher shares it.
export const WATCH_RESPONSES = {
  expression: {
    title: 'The gap is getting it out, not getting it',
    teacher:
      'Let them answer out loud first and write second. Scribe one answer for them to show the ceiling is higher than the page suggests.',
    parent:
      'Ask them to tell you the answer before they write it. The thinking is usually already there.',
    horizon:
      'Worth working on now. This one starts costing marks around Class 8 if nothing changes.',
  },
  initiation: {
    title: 'The first two minutes are the whole problem',
    teacher:
      'Give the first step already done. Starting is the barrier, not the task.',
    parent:
      'Sit with them for the first two minutes of homework, then leave. Do not stay.',
    horizon: 'Usually shifts within a term once the start is scaffolded.',
  },
  completion: {
    title: 'Enthusiasm at the start, nothing at the end',
    teacher:
      'Shorten the unit of work. Three small finished things beat one large unfinished one right now.',
    parent:
      'Let them choose something small and see it all the way to done. Anything. The habit is the point.',
    horizon: 'Worth naming to the child directly. They usually know already.',
  },
  attention: {
    title: 'Attention goes at a predictable point',
    teacher:
      'Note when it goes, not that it goes. If it is always after twenty minutes, the task is too long, not the child too restless.',
    parent:
      'Break work into blocks shorter than the drift point, with a real break between.',
    horizon:
      'Record the pattern for a fortnight before drawing any conclusion from it.',
  },
  group: {
    title: 'Goes quiet when the group forms',
    teacher:
      'Give them a defined role in the group rather than a share of the task. Withdrawal is often about not knowing where to put themselves.',
    parent:
      'Ask what their job was in the group, not whether they enjoyed it.',
    horizon: 'Often a pairing problem before it is a child problem.',
  },
  setback: {
    title: 'One thing goes wrong and the session is over',
    teacher:
      'Name in advance that the task takes several attempts. Prediction does most of the work here.',
    parent:
      'Let one thing stay unfinished without rescuing it, and say out loud that unfinished is allowed.',
    horizon: 'Slow to shift. Measure in terms, not weeks.',
  },
}

export const MILESTONES = [
  { id: 'breakthrough', label: 'Something clicked', icon: 'Sparkles' },
  { id: 'improvement', label: 'Clear improvement', icon: 'TrendingUp' },
  { id: 'leadership', label: 'Took responsibility', icon: 'Users' },
  { id: 'creativity', label: 'Made something unexpected', icon: 'Palette' },
  { id: 'attention', label: 'Needs a conversation', icon: 'Flag', schoolOnly: true },
]
export const MILESTONE_MAP = Object.fromEntries(MILESTONES.map((m) => [m.id, m]))

export const SUBJECTS = [
  'Mathematics',
  'Science',
  'Language',
  'Social Studies',
  'Arts',
  'Physical Education',
]

export const UNDERSTANDING = ['Strong', 'Developing', 'Needs support']
export const ENGAGEMENT = ['High', 'Medium', 'Low']

export const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Per Term']

export const PERIODS = ['Term 1', 'Term 2', 'Term 3']

export const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']
export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
