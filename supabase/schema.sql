-- Kidchemy / Pehchaan — Supabase schema
-- Run this once in the Supabase SQL editor for your project.
-- URL: https://zesfwfcpdpmxuhsvqvxu.supabase.co

-- ────────────────────────────────────────────────────────────
-- schools (one row per pilot school)
-- ────────────────────────────────────────────────────────────
create table if not exists schools (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  city        text,
  class_name  text,
  teacher     text,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- students
-- ────────────────────────────────────────────────────────────
create table if not exists students (
  id          text primary key,
  name        text not null,
  class_name  text,
  school      text,
  frequency   text default 'Weekly',
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- observations
--
-- visibility: 'shared'  → visible to parents (default for strengths)
--             'school'  → teacher/admin only (default for concerns)
-- ────────────────────────────────────────────────────────────
create table if not exists observations (
  id          text primary key,
  student_id  text references students(id) on delete cascade,
  period      text,
  date        text,
  teacher     text,
  tags        text[],
  note        text,
  milestone   text,
  visibility  text default 'shared' check (visibility in ('shared', 'school')),
  created_at  timestamptz default now()
);

create index if not exists observations_student_id_idx on observations (student_id);

-- ────────────────────────────────────────────────────────────
-- subject_insights  (linked to one observation)
-- ────────────────────────────────────────────────────────────
create table if not exists subject_insights (
  id              text primary key default gen_random_uuid()::text,
  observation_id  text references observations(id) on delete cascade,
  subject         text,
  understanding   text,
  engagement      text,
  note            text
);

create index if not exists subject_insights_observation_id_idx on subject_insights (observation_id);

-- ────────────────────────────────────────────────────────────
-- Row-Level Security
-- Enable RLS and set a permissive anon policy for the pilot.
-- Tighten this when you add auth.
-- ────────────────────────────────────────────────────────────
alter table schools         enable row level security;
alter table students        enable row level security;
alter table observations    enable row level security;
alter table subject_insights enable row level security;

-- Pilot policy: anon can read + write everything.
-- Replace with proper user-scoped policies before school #2.
create policy "anon full access" on schools
  for all using (true) with check (true);

create policy "anon full access" on students
  for all using (true) with check (true);

create policy "anon full access" on observations
  for all using (true) with check (true);

create policy "anon full access" on subject_insights
  for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- Seed — Vidya Vihar demo classroom
-- Safe to run multiple times (on conflict do nothing).
-- ────────────────────────────────────────────────────────────

insert into students (id, name, class_name, school, frequency) values
  ('aryan-mehta',  'Aryan Mehta',  'Class 6A', 'Vidya Vihar Public School', 'Weekly'),
  ('priya-sharma', 'Priya Sharma', 'Class 6A', 'Vidya Vihar Public School', 'Weekly'),
  ('rohan-gupta',  'Rohan Gupta',  'Class 6A', 'Vidya Vihar Public School', 'Monthly'),
  ('ananya-nair',  'Ananya Nair',  'Class 6A', 'Vidya Vihar Public School', 'Weekly'),
  ('kabir-singh',  'Kabir Singh',  'Class 6A', 'Vidya Vihar Public School', 'Per Term')
on conflict (id) do nothing;

-- Aryan — 3 observations
insert into observations (id, student_id, period, date, teacher, tags, note, milestone, visibility) values
  ('obs_seed_1', 'aryan-mehta', 'Term 1', '2026-07-18', 'Ms. Rekha Iyer',
   array['hands-on','creative-solver','works-alone','patterns'],
   'Built a working lever out of a ruler and eraser to explain moments before I had taught it.',
   'creativity', 'shared'),
  ('obs_seed_2', 'aryan-mehta', 'Term 2', '2026-10-09', 'Ms. Rekha Iyer',
   array['deep-questions','hands-on','creative-solver','needs-time'],
   'Asked why gears change force and not energy. Took the class somewhere I had not planned.',
   'breakthrough', 'shared'),
  ('obs_seed_3', 'aryan-mehta', 'Term 3', '2027-01-22', 'Mr. Anand Rao',
   array['patterns','quick-grasp','creative-solver','persists'],
   'Struggles to write down what he understands. The gap is expression, not comprehension.',
   'improvement', 'school')
on conflict (id) do nothing;

insert into subject_insights (observation_id, subject, understanding, engagement, note) values
  ('obs_seed_1', 'Mathematics', 'Developing', 'Medium', ''),
  ('obs_seed_1', 'Science',     'Strong',     'High',   'Grasps concepts through physical examples.'),
  ('obs_seed_1', 'Language',    'Developing', 'Low',    ''),
  ('obs_seed_2', 'Mathematics', 'Strong',     'High',   ''),
  ('obs_seed_2', 'Science',     'Strong',     'High',   ''),
  ('obs_seed_2', 'Social Studies','Developing','Medium', ''),
  ('obs_seed_3', 'Mathematics', 'Strong',     'High',   ''),
  ('obs_seed_3', 'Science',     'Strong',     'High',   ''),
  ('obs_seed_3', 'Language',    'Needs support','Medium','Written expression is the block.')
on conflict do nothing;

-- Priya — 3 observations
insert into observations (id, student_id, period, date, teacher, tags, note, milestone, visibility) values
  ('obs_seed_4', 'priya-sharma', 'Term 1', '2026-07-20', 'Ms. Rekha Iyer',
   array['deep-questions','curious-sciences','shy-thoughtful'],
   'Rarely raises her hand. When she does, the whole class goes quiet.',
   null, 'shared'),
  ('obs_seed_5', 'priya-sharma', 'Term 2', '2026-10-14', 'Ms. Rekha Iyer',
   array['deep-questions','confident-speaker','curious-sciences','persists'],
   'Explained Newton''s third law with an example nobody in the room had thought of.',
   'breakthrough', 'shared'),
  ('obs_seed_6', 'priya-sharma', 'Term 3', '2027-01-30', 'Ms. Rekha Iyer',
   array['confident-speaker','helps-peers','deep-questions','motivated'],
   'Has started answering before being asked. Six months ago that was unthinkable.',
   'improvement', 'shared')
on conflict (id) do nothing;

-- Rohan — 3 observations
insert into observations (id, student_id, period, date, teacher, tags, note, milestone, visibility) values
  ('obs_seed_7', 'rohan-gupta', 'Term 1', '2026-07-25', 'Ms. Rekha Iyer',
   array['leader','teams','expressive'],
   'Organised his group without being asked and gave everyone a job.',
   'leadership', 'shared'),
  ('obs_seed_8', 'rohan-gupta', 'Term 2', '2026-11-02', 'Mr. Anand Rao',
   array['leader','confident-speaker','helps-peers','recovers'],
   'Lost a debate badly and came back the next week better prepared.',
   'improvement', 'shared'),
  ('obs_seed_9', 'rohan-gupta', 'Term 3', '2027-02-05', 'Ms. Rekha Iyer',
   array['teams','empathetic','confident-speaker','motivated'],
   '', null, 'shared')
on conflict (id) do nothing;

-- Ananya — 3 observations
insert into observations (id, student_id, period, date, teacher, tags, note, milestone, visibility) values
  ('obs_seed_10', 'ananya-nair', 'Term 1', '2026-07-19', 'Ms. Rekha Iyer',
   array['creative-tasks','stories-language','empathetic','needs-encouragement'],
   'Writes beautifully and hides it. Asked me not to read her poem to the class.',
   null, 'shared'),
  ('obs_seed_11', 'ananya-nair', 'Term 2', '2026-10-21', 'Ms. Rekha Iyer',
   array['creative-tasks','helps-peers','stories-language','shy-thoughtful'],
   'Noticed a new student sitting alone and moved her own seat.',
   'attention', 'school'),
  ('obs_seed_12', 'ananya-nair', 'Term 3', '2027-02-11', 'Ms. Rekha Iyer',
   array['creative-tasks','empathetic','expressive','recovers'],
   'Read her own piece aloud at assembly. She would not have done that in June.',
   'breakthrough', 'shared')
on conflict (id) do nothing;

-- Kabir — 1 observation (thin profile on purpose)
insert into observations (id, student_id, period, date, teacher, tags, note, milestone, visibility) values
  ('obs_seed_13', 'kabir-singh', 'Term 2', '2026-11-11', 'Ms. Rekha Iyer',
   array['persists','strong-recall','needs-time'],
   'Slowest to start, last to give up.',
   null, 'shared')
on conflict (id) do nothing;
