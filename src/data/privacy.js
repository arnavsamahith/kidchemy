/* ══════════════════════════════════════════════════════════════════
   Privacy notice, in one place.

   Bump NOTICE_VERSION whenever the notice below changes in substance.
   Every consent a parent gives is recorded against the version they saw
   (supabase/security.sql, table `consents`), so an old consent is never
   silently stretched to cover a new purpose.

   Under the DPDP Act 2023 the school is the Data Fiduciary and Kidchemy
   is its Data Processor. The grievance contact below is the school's
   first, Kidchemy's second. Fill in SCHOOL_CONTACT per pilot school.
   ══════════════════════════════════════════════════════════════════ */

export const NOTICE_VERSION = '2026-10'

export const KIDCHEMY_CONTACT = {
  name: 'Arnav, Kidchemy',
  email: 'arnavsamahith@gmail.com',
}

// The school's grievance officer. Shown on the notice once filled in.
export const SCHOOL_CONTACT = {
  name: '',
  email: '',
  phone: '',
}

// What a parent consents to, item by item. Ids are stored in the ledger.
export const PURPOSES = [
  {
    id: 'profile',
    label: 'A profile of my child, written from teacher observations',
    detail:
      'Teachers record short notes about what they see in class. Kidchemy turns the ones they choose to share into a page I can read.',
    required: true,
  },
  {
    id: 'hpc',
    label: 'The Holistic Progress Card',
    detail:
      'The school uses the same observations to fill in the NEP 2020 progress card it already has to produce.',
    required: true,
  },
  {
    id: 'ptm',
    label: 'Parent–teacher meeting sheets',
    detail:
      'A printed one-page summary the teacher brings to our meeting, kept by the school.',
    required: true,
  },
]

// What we collect, kept deliberately short. Anything not on this list is
// not collected; if a field is added to the app, it is added here first.
export const DATA_WE_HOLD = [
  ['About your child', 'Name, class, section, roll number, school ID, and the code on the report card sticker.'],
  ['What teachers notice', 'Short observations, written stories, the child’s own words, and appreciation from classmates (names of classmates are never shown to you).'],
  ['About you', 'Your name, email address, and that you are linked to your child.'],
  ['Records of use', 'When you consented, and when staff opened or exported your child’s record.'],
]

export const WE_NEVER = [
  'Show ads, or let anyone use your child’s data for advertising.',
  'Sell, rent or share data with anyone outside your school.',
  'Run trackers or third-party analytics on any page.',
  'Rank your child against classmates, anywhere.',
  'Predict careers or label a child before Class 9.',
  'Collect health, caste, religion, income or biometric information.',
  'Let children sign in, message anyone, or be contacted through Kidchemy.',
]

export const RIGHTS = [
  ['See it', 'Download everything Kidchemy shows you about your child, at any time, from your home page.'],
  ['Correct it', 'Ask for anything wrong or unfair to be changed. The teacher who wrote it is asked first.'],
  ['Erase it', 'Ask for your child’s record to be deleted. The school confirms, then it is gone, including backups as they roll over.'],
  ['Withdraw', 'Stop your access and consent with one tap. It is as easy as giving it.'],
  ['Complain', 'Raise a grievance with the school, then with Kidchemy. If you are not satisfied, you can go to the Data Protection Board of India.'],
  ['Nominate', 'Name someone to act for you if you cannot.'],
]

export const RETENTION_TEXT =
  'A child’s record is kept while they are at the school. When they leave, it is erased automatically after twelve months unless the school must keep it longer by law. Records of who accessed what are kept for at least a year, as the DPDP Rules require.'

export const BREACH_TEXT =
  'If personal data is ever exposed, we tell the school at once, the school and we tell affected families without delay in plain language, and we report it to the Data Protection Board within 72 hours.'
