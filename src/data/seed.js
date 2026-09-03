// Reference data for the pilot classroom.
//
// Since v2 the database is the source of truth (supabase/schema.sql seeds
// it and RLS scopes it). This file stays for two reasons: the school
// header needs a sensible fallback before a profile has loaded, and the
// demo copy in the README refers to these two children by name.

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

export const TEACHER_CODE_HINT = 'VIDYA-6A'

export const SEED_STUDENTS = [
  {
    id: 'aryan-mehta',
    name: 'Aryan Mehta',
    className: 'Class 6A',
    school: SCHOOL.name,
    frequency: 'Weekly',
    accessCode: 'ARYAN-4821',
    observations: [
      {
        id: 'obs_seed_1',
        period: 'Term 1',
        date: '2026-07-18',
        teacher: 'Ms. Rekha Iyer',
        tags: ['hands-on', 'creative-solver', 'works-alone', 'patterns'],
        note: 'Built a working lever out of a ruler and eraser to explain moments before I had taught it.',
        milestone: 'creativity',
        visibility: 'shared',
        tagNotes: {
          'hands-on':
            'Reaches for objects before words. Gave him the ruler and he had it in 30 seconds.',
          'works-alone':
            'Not antisocial — he just wants to finish the thought before he shares it.',
        },
        subjects: [
          S('Mathematics', 'Developing', 'Medium'),
          S('Science', 'Strong', 'High', 'Grasps concepts through physical examples.'),
          S('Language', 'Developing', 'Low'),
        ],
      },
      {
        id: 'obs_seed_2',
        period: 'Term 2',
        date: '2026-10-09',
        teacher: 'Ms. Rekha Iyer',
        tags: ['deep-questions', 'hands-on', 'creative-solver', 'needs-time'],
        note: 'Asked why gears change force and not energy. Took the class somewhere I had not planned.',
        milestone: 'breakthrough',
        visibility: 'shared',
        tagNotes: {
          'deep-questions':
            'The question was two steps ahead of the syllabus. I had to look it up that evening.',
        },
        subjects: [
          S('Mathematics', 'Strong', 'High'),
          S('Science', 'Strong', 'High'),
          S('Social Studies', 'Developing', 'Medium'),
        ],
      },
      {
        id: 'obs_seed_3',
        period: 'Term 3',
        date: '2027-01-22',
        teacher: 'Mr. Anand Rao',
        tags: ['patterns', 'quick-grasp', 'creative-solver', 'persists'],
        note: 'Struggles to write down what he understands. The gap is expression, not comprehension.',
        milestone: 'improvement',
        visibility: 'school',
        tagNotes: {
          'quick-grasp':
            'Verbally he is ahead of the class. On paper he loses half of it.',
        },
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
    accessCode: 'PRIYA-7136',
    observations: [
      {
        id: 'obs_seed_4',
        period: 'Term 1',
        date: '2026-07-20',
        teacher: 'Ms. Rekha Iyer',
        tags: ['deep-questions', 'curious-sciences', 'shy-thoughtful'],
        note: 'Rarely raises her hand. When she does, the whole class goes quiet.',
        milestone: null,
        visibility: 'shared',
        tagNotes: {
          'shy-thoughtful':
            'Quiet is not the same as unsure. She is composing, not hiding.',
        },
        subjects: [
          S('Science', 'Strong', 'High'),
          S('Mathematics', 'Developing', 'Medium'),
        ],
      },
      {
        id: 'obs_seed_5',
        period: 'Term 2',
        date: '2026-10-14',
        teacher: 'Ms. Rekha Iyer',
        tags: ['deep-questions', 'confident-speaker', 'curious-sciences', 'persists'],
        note: 'Explained Newton’s third law with an example nobody in the room had thought of.',
        milestone: 'breakthrough',
        visibility: 'shared',
        tagNotes: {
          'confident-speaker':
            'First time she has volunteered without me asking. Worth marking.',
        },
        subjects: [
          S('Science', 'Strong', 'High'),
          S('Mathematics', 'Strong', 'High'),
          S('Language', 'Strong', 'Medium'),
        ],
      },
      {
        id: 'obs_seed_6',
        period: 'Term 3',
        date: '2027-01-30',
        teacher: 'Ms. Rekha Iyer',
        tags: ['confident-speaker', 'helps-peers', 'deep-questions', 'motivated'],
        note: 'Has started answering before being asked. Six months ago that was unthinkable.',
        milestone: 'improvement',
        visibility: 'shared',
        tagNotes: {
          'helps-peers':
            'Sat with Aryan through a whole problem set without being asked to.',
        },
        subjects: [
          S('Science', 'Strong', 'High'),
          S('Mathematics', 'Strong', 'High'),
          S('Social Studies', 'Developing', 'High'),
        ],
      },
    ],
  },
]

export function freshState() {
  return {
    version: 2,
    school: SCHOOL,
    students: JSON.parse(JSON.stringify(SEED_STUDENTS)),
  }
}
