-- ════════════════════════════════════════════════════════════════════
-- Kidchemy / Pehchaan  Supabase schema  (v3)
--
-- Safe to re-run. Paste the whole file into the Supabase SQL editor.
--
-- What v3 adds over v2:
--   - students gains student_code / grade / section / roll_no, matching the
--     roster CSV the school actually exports.
--   - a third role: 'admin'. A superadmin can see every school, import
--     rosters, mint teacher codes and edit configuration.
--   - observations gains the Learning Story fields (context / saw / meant /
--     next), dispositions, concentration, and an artefact reference.
--   - self_assessments, peer_assessments and parent_notes, because the NEP
--     2020 Holistic Progress Card is explicitly multi-stakeholder.
--   - app_settings, for things a superadmin configures without a deploy.
--   - audit_log, because this is children's data and someone will ask.
--
-- CLEAN SLATE: the v2 demo students (Aryan, Priya) and their observations
-- are removed, and the Grade 7C roster from dump/ is imported in their place.
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
  id           text primary key,
  name         text not null,
  class_name   text,
  school       text,
  frequency    text default 'Weekly',
  access_code  text unique,
  created_at   timestamptz default now()
);

-- v3 roster columns. Added separately so an existing project migrates
-- rather than needing a rebuild.
alter table students add column if not exists student_code text;
alter table students add column if not exists grade        int;
alter table students add column if not exists section      text;
alter table students add column if not exists roll_no      int;
alter table students add column if not exists archived     boolean default false;

create unique index if not exists students_student_code_key
  on students (student_code) where student_code is not null;
create index if not exists students_grade_section_idx on students (grade, section);

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

-- v3 observation columns: the Learning Story structure, Carr's dispositions,
-- and Montessori's concentration signal.
alter table observations add column if not exists tag_notes  jsonb   default '{}'::jsonb;
alter table observations add column if not exists story      jsonb   default '{}'::jsonb;
alter table observations add column if not exists dispositions text[] default '{}';
alter table observations add column if not exists concentration_minutes int;
alter table observations add column if not exists self_chosen boolean default false;
alter table observations add column if not exists artefact_url text;
alter table observations add column if not exists author_id  uuid;

create index if not exists observations_student_id_idx on observations (student_id);
create index if not exists observations_date_idx on observations (date);

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

-- One row per signed-up human.
create table if not exists profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'parent',
  full_name   text,
  school      text,
  class_name  text,
  created_at  timestamptz default now()
);

-- v2 constrained role to teacher/parent. v3 adds admin.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('teacher', 'parent', 'admin'));
alter table profiles add column if not exists grade   int;
alter table profiles add column if not exists section text;
alter table profiles add column if not exists suspended boolean default false;

create table if not exists teacher_codes (
  code        text primary key,
  school      text,
  class_name  text,
  grade       int,
  section     text,
  created_at  timestamptz default now()
);
alter table teacher_codes add column if not exists grade   int;
alter table teacher_codes add column if not exists section text;
alter table teacher_codes add column if not exists uses_left int;
alter table teacher_codes add column if not exists expires_at timestamptz;

create table if not exists parent_links (
  parent_id   uuid references auth.users (id) on delete cascade,
  student_id  text references students (id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (parent_id, student_id)
);

-- ─── v3: the multi-stakeholder half of the Holistic Progress Card ────

-- The child's own voice. NEP 2020 requires it; it is also the single most
-- moving thing on the parent page.
create table if not exists self_assessments (
  id          text primary key default gen_random_uuid()::text,
  student_id  text references students(id) on delete cascade,
  period      text,
  date        text default to_char(now(), 'YYYY-MM-DD'),
  -- what did you enjoy / what was hard / what do you want to get better at
  enjoyed     text,
  hard        text,
  want_next   text,
  -- three faces, not a score
  feeling     text check (feeling in ('growing', 'steady', 'stuck')),
  created_at  timestamptz default now()
);
create index if not exists self_assessments_student_idx on self_assessments (student_id);

-- Peer assessment, deliberately restricted to appreciation only. Children
-- naming each other's weaknesses in a record their parents can read is not
-- something this product will do.
create table if not exists peer_assessments (
  id           text primary key default gen_random_uuid()::text,
  student_id   text references students(id) on delete cascade,
  period       text,
  -- who wrote it is stored for the teacher, never shown to the parent
  author_id    text references students(id) on delete set null,
  appreciation text,
  tag          text,
  created_at   timestamptz default now()
);
create index if not exists peer_assessments_student_idx on peer_assessments (student_id);

-- The family's response to a learning story, per Carr. Written by the parent.
create table if not exists parent_notes (
  id          text primary key default gen_random_uuid()::text,
  student_id  text references students(id) on delete cascade,
  parent_id   uuid references auth.users (id) on delete set null,
  period      text,
  body        text,
  created_at  timestamptz default now()
);
create index if not exists parent_notes_student_idx on parent_notes (student_id);

-- Configuration a superadmin changes without a deploy.
create table if not exists app_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now(),
  updated_by  uuid
);

-- Children's data. Someone will eventually ask who looked at what.
create table if not exists audit_log (
  id          bigserial primary key,
  actor_id    uuid,
  actor_role  text,
  action      text not null,
  entity      text,
  entity_id   text,
  detail      jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);
create index if not exists audit_log_created_idx on audit_log (created_at desc);

-- ─── 2. Helper functions (security definer, so RLS can call them) ────

create or replace function public.kc_role()
returns text
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.kc_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.kc_role() = 'admin', false) $$;

create or replace function public.kc_is_teacher()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.kc_role() in ('teacher', 'admin'), false) $$;

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
-- role = 'teacher'  -> 'code' must match a row in teacher_codes
-- role = 'parent'   -> 'code' is the child's access_code (optional here)
-- role = 'admin'    -> never self-service. Promote by hand, see section 7.

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
  v_grade  int;
  v_sec    text;
begin
  -- 'admin' can never be claimed at signup, whatever the client sends.
  if v_role not in ('teacher', 'parent') then
    v_role := 'parent';
  end if;

  if v_role = 'teacher' then
    select school, class_name, grade, section
      into v_school, v_class, v_grade, v_sec
    from public.teacher_codes
    where upper(code) = v_code
      and (expires_at is null or expires_at > now())
      and (uses_left is null or uses_left > 0);

    if v_school is null then
      raise exception 'INVALID_TEACHER_CODE';
    end if;

    update public.teacher_codes
       set uses_left = greatest(uses_left - 1, 0)
     where upper(code) = v_code and uses_left is not null;
  end if;

  insert into public.profiles (id, role, full_name, school, class_name, grade, section)
  values (new.id, v_role, v_name, v_school, v_class, v_grade, v_sec)
  on conflict (id) do nothing;

  if v_role = 'parent' and v_code is not null then
    insert into public.parent_links (parent_id, student_id)
    select new.id, s.id from public.students s
    where upper(s.access_code) = v_code
    on conflict do nothing;
  end if;

  insert into public.audit_log (actor_id, actor_role, action, entity, entity_id)
  values (new.id, v_role, 'signup', 'profile', new.id::text);

  return new;
end;
$$;

drop trigger if exists kc_on_auth_user_created on auth.users;
create trigger kc_on_auth_user_created
  after insert on auth.users
  for each row execute function public.kc_handle_new_user();

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
  where upper(access_code) = upper(trim(child_code)) and coalesce(archived, false) = false;

  if v_sid is null then
    raise exception 'UNKNOWN_CODE';
  end if;

  insert into public.parent_links (parent_id, student_id)
  values (auth.uid(), v_sid) on conflict do nothing;

  insert into public.audit_log (actor_id, actor_role, action, entity, entity_id)
  values (auth.uid(), 'parent', 'link_child', 'student', v_sid);

  return v_sid;
end;
$$;

grant execute on function public.kc_link_child(text) to authenticated;

-- Superadmin: promote a user to a role. Only an existing admin may call it,
-- which is why the first admin has to be made by hand (section 7).
create or replace function public.kc_set_role(target_email text, new_role text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not public.kc_is_admin() then
    raise exception 'NOT_AN_ADMIN';
  end if;
  if new_role not in ('teacher', 'parent', 'admin') then
    raise exception 'BAD_ROLE';
  end if;

  select id into v_id from auth.users where lower(email) = lower(trim(target_email));
  if v_id is null then
    raise exception 'NO_SUCH_USER';
  end if;

  update public.profiles set role = new_role where id = v_id;

  insert into public.audit_log (actor_id, actor_role, action, entity, entity_id, detail)
  values (auth.uid(), 'admin', 'set_role', 'profile', v_id::text,
          jsonb_build_object('email', target_email, 'role', new_role));

  return v_id::text;
end;
$$;

grant execute on function public.kc_set_role(text, text) to authenticated;

-- ─── 4. Row-Level Security ──────────────────────────────────────────

alter table schools          enable row level security;
alter table students         enable row level security;
alter table observations     enable row level security;
alter table subject_insights enable row level security;
alter table profiles         enable row level security;
alter table parent_links     enable row level security;
alter table teacher_codes    enable row level security;
alter table self_assessments enable row level security;
alter table peer_assessments enable row level security;
alter table parent_notes     enable row level security;
alter table app_settings     enable row level security;
alter table audit_log        enable row level security;

do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('schools','students','observations','subject_insights',
                        'profiles','parent_links','teacher_codes','self_assessments',
                        'peer_assessments','parent_notes','app_settings','audit_log')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- profiles
create policy "profiles self read" on profiles
  for select using (id = auth.uid() or public.kc_is_teacher());
create policy "profiles self update" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin write" on profiles
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

-- students: teachers and admins see all; parents see only their children.
create policy "students read" on students
  for select using (public.kc_is_teacher() or public.kc_owns_student(id));
create policy "students teacher write" on students
  for all using (public.kc_is_teacher()) with check (public.kc_is_teacher());

-- observations: teachers see everything; parents see shared rows only.
create policy "observations read" on observations
  for select using (
    public.kc_is_teacher()
    or (public.kc_owns_student(student_id)
        and coalesce(visibility, 'shared') = 'shared')
  );
create policy "observations teacher write" on observations
  for all using (public.kc_is_teacher()) with check (public.kc_is_teacher());

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
create policy "links admin write" on parent_links
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

create policy "schools read" on schools
  for select using (auth.uid() is not null);
create policy "schools admin write" on schools
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

-- self assessments: the child's teacher records them; parents may read.
create policy "self read" on self_assessments
  for select using (public.kc_is_teacher() or public.kc_owns_student(student_id));
create policy "self teacher write" on self_assessments
  for all using (public.kc_is_teacher()) with check (public.kc_is_teacher());

-- peer assessments: teachers only. The parent view renders the text without
-- the author, and that join happens server side in the teacher's session.
create policy "peer teacher only" on peer_assessments
  for all using (public.kc_is_teacher()) with check (public.kc_is_teacher());

-- parent notes: the parent writes their own; the teacher reads them.
create policy "parent notes read" on parent_notes
  for select using (public.kc_is_teacher() or parent_id = auth.uid());
create policy "parent notes write" on parent_notes
  for insert with check (parent_id = auth.uid() and public.kc_owns_student(student_id));
create policy "parent notes update own" on parent_notes
  for update using (parent_id = auth.uid()) with check (parent_id = auth.uid());

-- settings: everyone signed in can read, only an admin writes.
create policy "settings read" on app_settings
  for select using (auth.uid() is not null);
create policy "settings admin write" on app_settings
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

-- audit: admin reads. Writes go through security-definer functions.
create policy "audit admin read" on audit_log
  for select using (public.kc_is_admin());
create policy "audit insert" on audit_log
  for insert with check (auth.uid() is not null);

-- teacher_codes: unreadable from the browser except by an admin. The signup
-- trigger reads it as security definer, which is the point.
create policy "codes admin" on teacher_codes
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

-- ─── 5. Clean slate + Grade 7C roster ───────────────────────────────

delete from students where id in ('aryan-mehta', 'priya-sharma', 'rohan-gupta',
                                  'ananya-nair', 'kabir-singh');

insert into teacher_codes (code, school, class_name, grade, section) values
  ('VIDYA-7C', 'Vidya Vihar Public School', 'Grade 7C', 7, 'C')
on conflict (code) do update
  set grade = excluded.grade, section = excluded.section,
      class_name = excluded.class_name;

insert into schools (id, name, city, class_name, teacher) values
  ('vidya-vihar', 'Vidya Vihar Public School', 'Chennai', 'Grade 7C', 'Ms. Rekha Iyer')
on conflict (id) do nothing;

insert into students
  (id, name, student_code, grade, section, roll_no, class_name, school, frequency, access_code)
values
  ('s_2019m01', 'Aarav Sharma', '2019M01', 7, 'C', 1, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'C3QH-EAX4'),
  ('s_2019f02', 'Ananya Iyer', '2019F02', 7, 'C', 2, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'W3XT-DH4D'),
  ('s_2021m03', 'Devansh Patel', '2021M03', 7, 'C', 3, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'TRV4-WC3W'),
  ('s_2019f04', 'Diya Verma', '2019F04', 7, 'C', 4, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'DM4V-TCRU'),
  ('s_2019m05', 'Ishaan Gupta', '2019M05', 7, 'C', 5, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'ETRD-FJFW'),
  ('s_2019f06', 'Kavya Nair', '2019F06', 7, 'C', 6, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'EJJM-G7M7'),
  ('s_2022m07', 'Rohan Mehta', '2022M07', 7, 'C', 7, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'FEG4-JURE'),
  ('s_2019f08', 'Sanjana Rao', '2019F08', 7, 'C', 8, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'KMCC-M47J'),
  ('s_2019m09', 'Siddharth Reddi', '2019M09', 7, 'C', 9, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'QRDF-FG9W'),
  ('s_2019f10', 'Tanvi Joshi', '2019F10', 7, 'C', 10, 'Grade 7C', 'Vidya Vihar Public School', 'Weekly', 'DH3Q-QDDH')
on conflict (id) do update set
  name        = excluded.name,
  student_code= excluded.student_code,
  grade       = excluded.grade,
  section     = excluded.section,
  roll_no     = excluded.roll_no,
  class_name  = excluded.class_name,
  school      = excluded.school;

-- ─── 6. Default settings ────────────────────────────────────────────

insert into app_settings (key, value) values
  ('branding', '{"productName":"Kidchemy","tagline":"A truer picture of every child"}'::jsonb),
  ('terms',    '{"periods":["Term 1","Term 2","Term 3"],"current":"Term 1"}'::jsonb),
  ('policy',   '{"careerPathwaysMinGrade":9,"defaultVisibility":"shared","watchTagsSchoolOnly":true,"overdueDays":21}'::jsonb),
  ('subjects', '{"list":["Mathematics","Science","Language","Social Studies","Arts","Physical Education"]}'::jsonb)
on conflict (key) do nothing;

-- ─── 7. Making the first superadmin ─────────────────────────────────
--
-- kc_set_role() requires an existing admin, so the first one is made here,
-- by hand, in the SQL editor. Replace the email, run these two lines once,
-- and then do everything else from /admin in the app.
--
--   update public.profiles set role = 'admin'
--    where id = (select id from auth.users where lower(email) = lower('you@example.com'));
--
--   select role from public.profiles
--    where id = (select id from auth.users where lower(email) = lower('you@example.com'));
--
-- If no row updates, the account has not signed up yet. Sign up in the app
-- first (any role), then run the update.

-- ─── 8. Now run security.sql ────────────────────────────────────────
-- security.sql (v4) replaces the policies above with school-scoped ones,
-- locks role changes, adds consent, rights requests and retention.
-- Run it every time you run this file. See docs/SECURITY.md.
