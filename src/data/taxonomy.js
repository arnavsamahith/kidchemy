// The vocabulary of Kidchemy.
// Every tag a teacher can tap carries weights into one or more dimensions.
// This is the single place to edit if a pilot teacher says "this tag is wrong".

export const DIMENSIONS = [
  {
    id: 'curiosity',
    label: 'Curiosity',
    blurb: 'Asks, wonders, follows an idea past where the lesson stopped.',
  },
  {
    id: 'logic',
    label: 'Logic',
    blurb: 'Reasons in steps, spots structure, holds an argument together.',
  },
  {
    id: 'creativity',
    label: 'Creativity',
    blurb: 'Finds the second answer. Makes unexpected connections.',
  },
  {
    id: 'communication',
    label: 'Communication',
    blurb: 'Puts thoughts into words others can use.',
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    blurb: 'Works with, not just alongside. Shares the thinking.',
  },
  {
    id: 'persistence',
    label: 'Persistence',
    blurb: 'Stays with a hard thing after the first attempt fails.',
  },
  {
    id: 'empathy',
    label: 'Empathy',
    blurb: 'Notices how others feel and acts on it.',
  },
]

export const DIMENSION_MAP = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d]))

// style: signals that shape "how they learn best" rather than a dimension score.
export const TAG_GROUPS = [
  {
    id: 'cognitive',
    label: 'How they think',
    hint: 'Cognitive',
    accent: 'moss',
    tags: [
      { id: 'logical', label: 'Strong logical thinking', dims: { logic: 3 } },
      {
        id: 'creative-solver',
        label: 'Creative problem-solver',
        dims: { creativity: 3, logic: 1 },
      },
      {
        id: 'deep-questions',
        label: 'Asks deep questions',
        dims: { curiosity: 3, logic: 1 },
      },
      {
        id: 'quick-grasp',
        label: 'Understands concepts quickly',
        dims: { logic: 2, curiosity: 1 },
      },
      {
        id: 'patterns',
        label: 'Thinks in patterns',
        dims: { logic: 2, creativity: 2 },
      },
      {
        id: 'strong-recall',
        label: 'Great at memorisation',
        dims: { logic: 1 },
      },
      {
        id: 'needs-time',
        label: 'Needs more time to process',
        dims: {},
        style: 'reflective',
      },
    ],
  },
  {
    id: 'social',
    label: 'How they are with others',
    hint: 'Social',
    accent: 'clay',
    tags: [
      {
        id: 'leader',
        label: 'Natural leader',
        dims: { communication: 2, collaboration: 2 },
      },
      { id: 'teams', label: 'Works well in teams', dims: { collaboration: 3 } },
      {
        id: 'helps-peers',
        label: 'Helps peers unprompted',
        dims: { empathy: 2, collaboration: 1 },
      },
      {
        id: 'confident-speaker',
        label: 'Communicates confidently',
        dims: { communication: 3 },
      },
      {
        id: 'works-alone',
        label: 'Prefers working alone',
        dims: {},
        style: 'independent',
      },
      {
        id: 'shy-thoughtful',
        label: 'Shy but thoughtful',
        dims: { empathy: 1 },
        style: 'reflective',
      },
    ],
  },
  {
    id: 'emotional',
    label: 'How they meet difficulty',
    hint: 'Emotional',
    accent: 'moss',
    tags: [
      {
        id: 'persists',
        label: 'Persists through difficulty',
        dims: { persistence: 3 },
      },
      {
        id: 'recovers',
        label: 'Gets frustrated but recovers',
        dims: { persistence: 2 },
      },
      {
        id: 'motivated',
        label: 'Highly motivated',
        dims: { persistence: 2, curiosity: 1 },
      },
      { id: 'empathetic', label: 'Shows empathy', dims: { empathy: 3 } },
      {
        id: 'expressive',
        label: 'Emotionally expressive',
        dims: { communication: 2, empathy: 1 },
      },
      {
        id: 'needs-encouragement',
        label: 'Needs encouragement',
        dims: {},
        style: 'encouragement',
      },
    ],
  },
  {
    id: 'interests',
    label: 'What lights them up',
    hint: 'Interests',
    accent: 'clay',
    tags: [
      {
        id: 'curious-sciences',
        label: 'Curious in Sciences',
        dims: { curiosity: 2, logic: 1 },
      },
      {
        id: 'creative-tasks',
        label: 'Lights up during creative tasks',
        dims: { creativity: 3 },
      },
      {
        id: 'hands-on',
        label: 'Engaged in hands-on activities',
        dims: { curiosity: 2, creativity: 1 },
        style: 'kinesthetic',
      },
      {
        id: 'stories-language',
        label: 'Shows interest in stories & language',
        dims: { communication: 2, creativity: 1 },
      },
    ],
  },
]

export const ALL_TAGS = TAG_GROUPS.flatMap((g) =>
  g.tags.map((t) => ({ ...t, group: g.id, groupLabel: g.label }))
)
export const TAG_MAP = Object.fromEntries(ALL_TAGS.map((t) => [t.id, t]))

export const MILESTONES = [
  { id: 'breakthrough', label: 'Breakthrough moment', emojiless: 'Sparkles' },
  { id: 'improvement', label: 'Significant improvement', emojiless: 'TrendingUp' },
  { id: 'attention', label: 'Needs attention', emojiless: 'Flag' },
  { id: 'leadership', label: 'Showed leadership', emojiless: 'Users' },
  { id: 'creativity', label: 'Unusual creativity', emojiless: 'Palette' },
]
export const MILESTONE_MAP = Object.fromEntries(MILESTONES.map((m) => [m.id, m]))

export const SUBJECTS = ['Mathematics', 'Science', 'Language', 'Social Studies']

export const UNDERSTANDING = ['Strong', 'Developing', 'Needs support']
export const ENGAGEMENT = ['High', 'Medium', 'Low']

export const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Per Term']

export const PERIODS = ['Term 1', 'Term 2', 'Term 3']
