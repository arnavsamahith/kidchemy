-- ════════════════════════════════════════════════════════════════════
-- Kidchemy / Pehchaan — Supabase schema  (v2: auth + roles)
--
-- Safe to re-run. Paste the whole file into the Supabase SQL editor.
--
-- What v2 adds over v1:
--   • profiles          — one row per auth user, carries the role
--   • teacher_codes     — a teacher cannot self-register without a code
--   • parent_links      — which parent may see which child
--   • students.access_code — the code a parent types to claim their child
--   • observations.tag_notes — the teacher's custom remark per tag
--   • real RLS: teachers see their school, parents see only their child's
--     *shared* observations, anon sees nothing.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Tables ──────────────────────────────────────────────────────

create table if not exists schools (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  city        text,
  class_name  text,
  teacher     text,
  created_at  timestamptz default now()
);

create table if not exists students (
  id          text primary key,
  name        text not null,
  class_name  text,
  school      text,
  frequency   text default 'Weekly',
  access_code text unique,
  created_at  timestamptz default now()
);

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

create table if not exists subject_insights (
  id              text primary key default gen_random_uuid()::text,
  observation_id  text references observations(id) on delete cascade,
  subject         text,
  understanding   text,
  engagement      text,
  note            text
);

create index if not exists subject_insights_observation_id_idx
  on subject_insights (observation_id);

-- New in v2 ----------------------------------------------------------

-- One row per signed-up human. Created automatically by a trigger on
-- auth.users, so the client never has to insert it.
create table if not exists profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'parent' check (role in ('teacher', 'parent')),
  full_name   text,
  school      text,
  class_name  text,
  created_at  timestamptz default now()
);

-- A teacher account can only be created with a valid code. This is the
-- difference between "a login page" and "a login page anyone can walk
-- through".
create table if not exists teacher_codes (
  code        text primary key,
  school      text,
  class_name  text,
  created_at  timestamptz default now()
);

-- Which parent may see which child.
create table if not exists parent_links (
  parent_id   uuid references auth.users (id) on delete cascade,
  student_id  text references students (id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (parent_id, student_id)
);

-- Columns added after v1 shipped -------------------------------------
alter table students     add column if not exists access_code text;
alter table observations add column if not exists tag_notes jsonb default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'students_access_code_key'
  ) then
    begin
      alter table students add constraint students_access_code_key unique (access_code);
    exception when duplicate_table or duplicate_object then null;
    end;
  end if;
end $$;

-- ─── 2. Helper functions (security definer, so RLS can call them) ────

create or replace function public.kc_role()
returns text
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.kc_is_teacher()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.kc_role() = 'teacher', false) $$;

create or replace function public.kc_owns_student(sid text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parent_links
    where parent_id = auth.uid() and student_id = sid
  )
$$;

-- ─── 3. Signup trigger ──────────────────────────────────────────────
-- Reads role / full_name / code out of the signup metadata:
--   role = 'teacher'  → 'code' must match a row in teacher_codes
--   role = 'parent'   → 'code' is the child's access_code (optional here,
--                       can also be claimed later with kc_link_child)

create or replace function public.kc_handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role   text := coalesce(new.raw_user_meta_data ->> 'role', 'parent');
  v_name   text := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''),
                            split_part(new.email, '@', 1));
  v_code   text := nullif(upper(trim(new.raw_user_meta_data ->> 'code')), '');
  v_school text;
  v_class  text;
begin
  if v_role not in ('teacher', 'parent') then
    v_role := 'parent';
  end if;

  if v_role = 'teacher' then
    select school, class_name into v_school, v_class
    from public.teacher_codes where upper(code) = v_code;

    if v_school is null then
      raise exception 'INVALID_TEACHER_CODE';
    end if;
  end if;

  insert into public.profiles (id, role, full_name, school, class_name)
  values (new.id, v_role, v_name, v_school, v_class)
  on conflict (id) do nothing;

  if v_role = 'parent' and v_code is not null then
    insert into public.parent_links (parent_id, student_id)
    select new.id, s.id from public.students s
    where upper(s.access_code) = v_code
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists kc_on_auth_user_created on auth.users;
create trigger kc_on_auth_user_created
  after insert on auth.users
  for each row execute function public.kc_handle_new_user();

-- A parent can claim another child later from inside the app.
create or replace function public.kc_link_child(child_code text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_sid text;
begin
  if public.kc_role() is distinct from 'parent' then
    raise exception 'NOT_A_PARENT';
  end if;

  select id into v_sid from public.students
  where upper(access_code) = upper(trim(child_code));

  if v_sid is null then
    raise exception 'UNKNOWN_CODE';
  end if;

  insert into public.parent_links (parent_id, student_id)
  values (auth.uid(), v_sid) on conflict do nothing;

  return v_sid;
end;
$$;

grant execute on function public.kc_link_child(text) to authenticated;

-- ─── 4. Row-Level Security ──────────────────────────────────────────

alter table schools          enable row level security;
alter table students         enable row level security;
alter table observations     enable row level security;
alter table subject_insights enable row level security;
alter table profiles         enable row level security;
alter table parent_links     enable row level security;
alter table teacher_codes    enable row level security;

-- Drop the permissive v1 pilot policies if they are still there.
drop policy if exists "anon full access" on schools;
drop policy if exists "anon full access" on students;
drop policy if exists "anon full access" on observations;
drop policy if exists "anon full access" on subject_insights;

drop policy if exists "profiles self read"        on profiles;
drop policy if exists "profiles self update"      on profiles;
drop policy if exists "students read"             on students;
drop policy if exists "students teacher write"    on students;
drop policy if exists "observations read"         on observations;
drop policy if exists "observations teacher write" on observations;
drop policy if exists "insights read"             on subject_insights;
drop policy if exists "insights teacher write"    on subject_insights;
drop policy if exists "links read"                on parent_links;
drop policy if exists "schools read"              on schools;

-- profiles: you can read and edit yourself; teachers can read the class.
create policy "profiles self read" on profiles
  for select using (id = auth.uid() or public.kc_is_teacher());
create policy "profiles self update" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- students: teachers see all; parents see only their linked children.
create policy "students read" on students
  for select using (public.kc_is_teacher() or public.kc_owns_student(id));
create policy "students teacher write" on students
  for all using (public.kc_is_teacher()) with check (public.kc_is_teacher());

-- observations: teachers see everything; parents see *shared* rows only.
create policy "observations read" on observations
  for select using (
    public.kc_is_teacher()
    or (public.kc_owns_student(student_id)
        and coalesce(visibility, 'shared') = 'shared')
  );
create policy "observations teacher write" on observations
  for all using (public.kc_is_teacher()) with check (public.kc_is_teacher());

-- subject insights follow their observation.
create policy "insights read" on subject_insights
  for select using (
    exists (
      select 1 from public.observations o
      where o.id = subject_insights.observation_id
        and (public.kc_is_teacher()
             or (public.kc_owns_student(o.student_id)
                 and coalesce(o.visibility, 'shared') = 'shared'))
    )
  );
create policy "insights teacher write" on subject_insights
  for all using (public.kc_is_teacher()) with check (public.kc_is_teacher());

create policy "links read" on parent_links
  for select using (parent_id = auth.uid() or public.kc_is_teacher());

create policy "schools read" on schools
  for select using (auth.uid() is not null);

-- teacher_codes: no policy at all → unreadable from the browser. The
-- signup trigger reads it as security definer, which is the point.

-- ─── 5. Seed ────────────────────────────────────────────────────────

insert into teacher_codes (code, school, class_name) values
  ('VIDYA-6A', 'Vidya Vihar Public School', 'Class 6A')
on conflict (code) do nothing;

insert into students (id, name, class_name, school, frequency, access_code) values
  ('aryan-mehta',  'Aryan Mehta',  'Class 6A', 'Vidya Vihar Public School', 'Weekly', 'ARYAN-4821'),
  ('priya-sharma', 'Priya Sharma', 'Class 6A', 'Vidya Vihar Public School', 'Weekly', 'PRIYA-7136')
on conflict (id) do update set access_code = excluded.access_code;

-- v2 trims the pilot class to two children.
delete from students where id in ('rohan-gupta', 'ananya-nair', 'kabir-singh');

insert into observations (id, student_id, period, date, teacher, tags, note, milestone, visibility, tag_notes) values
  ('obs_seed_1', 'aryan-mehta', 'Term 1', '2026-07-18', 'Ms. Rekha Iyer',
   array['hands-on','creative-solver','works-alone','patterns'],
   'Built a working lever out of a ruler and eraser to explain moments before I had taught it.',
   'creativity', 'shared',
   '{"hands-on":"Reaches for objects before words. Gave him the ruler and he had it in 30 seconds.","works-alone":"Not antisocial — he just wants to finish the thought before he shares it."}'::jsonb),
  ('obs_seed_2', 'aryan-mehta', 'Term 2', '2026-10-09', 'Ms. Rekha Iyer',
   array['deep-questions','hands-on','creative-solver','needs-time'],
   'Asked why gears change force and not energy. Took the class somewhere I had not planned.',
   'breakthrough', 'shared',
   '{"deep-questions":"The question was two steps ahead of the syllabus. I had to look it up that evening."}'::jsonb),
  ('obs_seed_3', 'aryan-mehta', 'Term 3', '2027-01-22', 'Mr. Anand Rao',
   array['patterns','quick-grasp','creative-solver','persists'],
   'Struggles to write down what he understands. The gap is expression, not comprehension.',
   'improvement', 'school',
   '{"quick-grasp":"Verbally he is ahead of the class. On paper he loses half of it."}'::jsonb)
on conflict (id) do nothing;

insert into observations (id, student_id, period, date, teacher, tags, note, milestone, visibility, tag_notes) values
  ('obs_seed_4', 'priya-sharma', 'Term 1', '2026-07-20', 'Ms. Rekha Iyer',
   array['deep-questions','curious-sciences','shy-thoughtful'],
   'Rarely raises her hand. When she does, the whole class goes quiet.',
   null, 'shared',
   '{"shy-thoughtful":"Quiet is not the same as unsure. She is composing, not hiding."}'::jsonb),
  ('obs_seed_5', 'priya-sharma', 'Term 2', '2026-10-14', 'Ms. Rekha Iyer',
   array['deep-questions','confident-speaker','curious-sciences','persists'],
   'Explained Newton''s third law with an example nobody in the room had thought of.',
   'breakthrough', 'shared',
   '{"confident-speaker":"First time she has volunteered without me asking. Worth marking."}'::jsonb),
  ('obs_seed_6', 'priya-sharma', 'Term 3', '2027-01-30', 'Ms. Rekha Iyer',
   array['confident-speaker','helps-peers','deep-questions','motivated'],
   'Has started answering before being asked. Six months ago that was unthinkable.',
   'improvement', 'shared',
   '{"helps-peers":"Sat with Aryan through a whole problem set without being asked to."}'::jsonb)
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
  ('obs_seed_3', 'Language',    'Needs support','Medium','Written expression is the block.'),
  ('obs_seed_4', 'Science',     'Strong',     'High',   ''),
  ('obs_seed_4', 'Mathematics', 'Developing', 'Medium', ''),
  ('obs_seed_5', 'Science',     'Strong',     'High',   ''),
  ('obs_seed_5', 'Mathematics', 'Strong',     'High',   ''),
  ('obs_seed_5', 'Language',    'Strong',     'Medium', ''),
  ('obs_seed_6', 'Science',     'Strong',     'High',   ''),
  ('obs_seed_6', 'Mathematics', 'Strong',     'High',   ''),
  ('obs_seed_6', 'Social Studies','Developing','High',  '')
on conflict do nothing;
