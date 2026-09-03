// Seed data for the pilot demo: one classroom, five children, three terms.

let n = 0
const id = () => `obs_seed_${++n}`

const S = (subject, understanding, engagement, note = '') => ({
  subject,
  understanding,
  engagement,
  note,
})

export const SCHOOL = {
  name: 'Vidya Vihar Public School',
  city: 'Bengaluru',
  className: 'Class 6A',
  teacher: 'Ms. Rekha Iyer',
}

export const SEED_STUDENTS = [
  {
    id: 'aryan-mehta',
    name: 'Aryan Mehta',
    className: 'Class 6A',
    school: SCHOOL.name,
    frequency: 'Weekly',
    observations: [
      {
        id: id(),
        period: 'Term 1',
        date: '2026-07-18',
        teacher: 'Ms. Rekha Iyer',
        tags: ['hands-on', 'creative-solver', 'works-alone', 'patterns'],
        note: 'Built a working lever out of a ruler and eraser to explain moments before I had taught it.',
        milestone: 'creativity',
        subjects: [
          S('Mathematics', 'Developing', 'Medium'),
          S('Science', 'Strong', 'High', 'Grasps concepts through physical examples.'),
          S('Language', 'Developing', 'Low'),
        ],
      },
      {
        id: id(),
        period: 'Term 2',
        date: '2026-10-09',
        teacher: 'Ms. Rekha Iyer',
        tags: ['deep-questions', 'hands-on', 'creative-solver', 'needs-time'],
        note: 'Asked why gears change force and not energy. Took the class somewhere I had not planned.',
        milestone: 'breakthrough',
        subjects: [
          S('Mathematics', 'Strong', 'High'),
          S('Science', 'Strong', 'High'),
          S('Social Studies', 'Developing', 'Medium'),
        ],
      },
      {
        id: id(),
        period: 'Term 3',
        date: '2027-01-22',
        teacher: 'Mr. Anand Rao',
        tags: ['patterns', 'quick-grasp', 'creative-solver', 'persists'],
        note: 'Struggles to write down what he understands. The gap is expression, not comprehension.',
        milestone: 'improvement',
        subjects: [
          S('Mathematics', 'Strong', 'High'),
          S('Science', 'Strong', 'High'),
          S('Language', 'Needs support', 'Medium', 'Written expression is the block.'),
        ],
      },
    ],
  },
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    className: 'Class 6A',
    school: SCHOOL.name,
    frequency: 'Weekly',
    observations: [
      {
        id: id(),
        period: 'Term 1',
        date: '2026-07-20',
        teacher: 'Ms. Rekha Iyer',
        tags: ['deep-questions', 'curious-sciences', 'shy-thoughtful'],
        note: 'Rarely raises her hand. When she does, the whole class goes quiet.',
        milestone: null,
        subjects: [
          S('Science', 'Strong', 'High'),
          S('Mathematics', 'Developing', 'Medium'),
        ],
      },
      {
        id: id(),
        period: 'Term 2',
        date: '2026-10-14',
        teacher: 'Ms. Rekha Iyer',
        tags: ['deep-questions', 'confident-speaker', 'curious-sciences', 'persists'],
        note: 'Explained Newton’s third law with an example nobody in the room had thought of.',
        milestone: 'breakthrough',
        subjects: [
          S('Science', 'Strong', 'High'),
          S('Mathematics', 'Strong', 'High'),
          S('Language', 'Strong', 'Medium'),
        ],
      },
      {
        id: id(),
        period: 'Term 3',
        date: '2027-01-30',
        teacher: 'Ms. Rekha Iyer',
        tags: ['confident-speaker', 'helps-peers', 'deep-questions', 'motivated'],
        note: 'Has started answering before being asked. Six months ago that was unthinkable.',
        milestone: 'improvement',
        subjects: [
          S('Science', 'Strong', 'High'),
          S('Mathematics', 'Strong', 'High'),
          S('Social Studies', 'Developing', 'High'),
        ],
      },
    ],
  },
  {
    id: 'rohan-gupta',
    name: 'Rohan Gupta',
    className: 'Class 6A',
    school: SCHOOL.name,
    frequency: 'Monthly',
    observations: [
      {
        id: id(),
        period: 'Term 1',
        date: '2026-07-25',
        teacher: 'Ms. Rekha Iyer',
        tags: ['leader', 'teams', 'expressive'],
        note: 'Organised his group without being asked and gave everyone a job.',
        milestone: 'leadership',
        subjects: [
          S('Social Studies', 'Strong', 'High'),
          S('Mathematics', 'Developing', 'Medium'),
        ],
      },
      {
        id: id(),
        period: 'Term 2',
        date: '2026-11-02',
        teacher: 'Mr. Anand Rao',
        tags: ['leader', 'confident-speaker', 'helps-peers', 'recovers'],
        note: 'Lost a debate badly and came back the next week better prepared.',
        milestone: 'improvement',
        subjects: [
          S('Language', 'Strong', 'High'),
          S('Social Studies', 'Strong', 'High'),
          S('Science', 'Developing', 'Medium'),
        ],
      },
      {
        id: id(),
        period: 'Term 3',
        date: '2027-02-05',
        teacher: 'Ms. Rekha Iyer',
        tags: ['teams', 'empathetic', 'confident-speaker', 'motivated'],
        note: '',
        milestone: null,
        subjects: [
          S('Language', 'Strong', 'High'),
          S('Mathematics', 'Developing', 'Medium', 'Needs to slow down on multi-step problems.'),
        ],
      },
    ],
  },
  {
    id: 'ananya-nair',
    name: 'Ananya Nair',
    className: 'Class 6A',
    school: SCHOOL.name,
    frequency: 'Weekly',
    observations: [
      {
        id: id(),
        period: 'Term 1',
        date: '2026-07-19',
        teacher: 'Ms. Rekha Iyer',
        tags: ['creative-tasks', 'stories-language', 'empathetic', 'needs-encouragement'],
        note: 'Writes beautifully and hides it. Asked me not to read her poem to the class.',
        milestone: null,
        subjects: [
          S('Language', 'Strong', 'High'),
          S('Mathematics', 'Needs support', 'Low'),
        ],
      },
      {
        id: id(),
        period: 'Term 2',
        date: '2026-10-21',
        teacher: 'Ms. Rekha Iyer',
        tags: ['creative-tasks', 'helps-peers', 'stories-language', 'shy-thoughtful'],
        note: 'Noticed a new student sitting alone and moved her own seat.',
        milestone: 'attention',
        subjects: [
          S('Language', 'Strong', 'High'),
          S('Mathematics', 'Needs support', 'Low', 'Freezes on tests, fine in practice.'),
          S('Science', 'Developing', 'Medium'),
        ],
      },
      {
        id: id(),
        period: 'Term 3',
        date: '2027-02-11',
        teacher: 'Ms. Rekha Iyer',
        tags: ['creative-tasks', 'empathetic', 'expressive', 'recovers'],
        note: 'Read her own piece aloud at assembly. She would not have done that in June.',
        milestone: 'breakthrough',
        subjects: [
          S('Language', 'Strong', 'High'),
          S('Mathematics', 'Developing', 'Medium'),
        ],
      },
    ],
  },
  {
    id: 'kabir-singh',
    name: 'Kabir Singh',
    className: 'Class 6A',
    school: SCHOOL.name,
    frequency: 'Per Term',
    observations: [
      {
        id: id(),
        period: 'Term 2',
        date: '2026-11-11',
        teacher: 'Ms. Rekha Iyer',
        tags: ['persists', 'strong-recall', 'needs-time'],
        note: 'Slowest to start, last to give up.',
        milestone: null,
        subjects: [
          S('Mathematics', 'Developing', 'Medium'),
          S('Science', 'Developing', 'Medium'),
        ],
      },
    ],
  },
]

export function freshState() {
  return {
    version: 1,
    school: SCHOOL,
    students: JSON.parse(JSON.stringify(SEED_STUDENTS)),
  }
}
