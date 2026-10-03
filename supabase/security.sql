-- ════════════════════════════════════════════════════════════════════
-- Kidchemy  Security, privacy and child-safety layer  (v4)
--
-- Run this AFTER schema.sql, every time schema.sql is run. Safe to re-run.
-- It replaces every RLS policy that schema.sql creates with stricter ones.
--
-- Why each block exists (gaps found in the v3 audit, Oct 2026):
--
--   A. Any signed-in user could update their own profiles row, including
--      `role`. A parent could make themselves 'admin' from the browser
--      console. Now blocked by a trigger.
--   B. Teachers could read and write every child in every school. Now a
--      teacher sees only children of the school on their teacher code.
--   C. Any teacher could edit or delete any other teacher's observation.
--      Now only the author (or an admin) can.
--   D. Parents were linked to a child by code alone, with no consent record
--      and no limit on guessing. Now: code + child's first name, five failed
--      tries an hour, at most four guardians per child, and a consent ledger
--      (DPDP Act 2023 s.9, DPDP Rules 2025 r.10).
--   E. Anyone signed in could write any audit row, under any actor. Now the
--      server stamps who and what role, and the log is append-only
--      (DPDP Rules 2025 r.6: access logs kept at least one year).
--   F. Suspended accounts kept full access. Now a suspended account has no
--      role, so every policy fails closed.
--   G. Archived children stayed visible to parents. Now they do not.
--   H. No way for a family to ask for access, correction or erasure, or to
--      raise a grievance (DPDP Act ss.11–13). Now there is a request queue
--      with a due date.
--   I. No retention rule. Now children who have left are erased after a
--      configurable period, and logs are kept for at least 365 days.
--   J. Admin accounts were protected by a password only. If an admin has
--      enrolled an authenticator app, admin powers now require a verified
--      second factor in the session (aal2).
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. New columns and tables ──────────────────────────────────────

-- Who wrote an observation is stamped by the database, never by the client.
alter table observations alter column author_id set default auth.uid();

-- A guardian link is only live once a consent has been recorded for it.
alter table parent_links add column if not exists consented_at    timestamptz;
alter table parent_links add column if not exists consent_version text;
alter table parent_links add column if not exists relationship    text;
alter table parent_links add column if not exists revoked_at      timestamptz;
alter table parent_links add column if not exists revoked_by      uuid;

-- When a child leaves (archived), the clock for erasure starts.
alter table students add column if not exists archived_at timestamptz;

-- Append-only consent ledger. One row per give / withdraw, never edited.
create table if not exists consents (
  id              bigserial primary key,
  parent_id       uuid references auth.users (id) on delete set null,
  student_id      text references students (id) on delete cascade,
  notice_version  text not null,
  purposes        text[] not null default '{}',
  action          text not null check (action in ('given', 'withdrawn')),
  created_at      timestamptz default now()
);
create index if not exists consents_student_idx on consents (student_id);

-- Failed and successful attempts to link a child, for rate limiting.
create table if not exists link_attempts (
  id          bigserial primary key,
  user_id     uuid,
  ok          boolean not null,
  created_at  timestamptz default now()
);
create index if not exists link_attempts_user_idx on link_attempts (user_id, created_at desc);

-- Rights requests and grievances (DPDP Act ss.11, 12, 13).
create table if not exists data_requests (
  id            bigserial primary key,
  requester_id  uuid default auth.uid() references auth.users (id) on delete set null,
  student_id    text references students (id) on delete set null,
  kind          text not null check (kind in
                  ('access', 'correction', 'erasure', 'withdraw', 'grievance', 'nominee')),
  body          text check (char_length(body) <= 4000),
  status        text not null default 'open'
                  check (status in ('open', 'in_progress', 'done', 'rejected')),
  response      text,
  due_at        timestamptz default now() + interval '30 days',
  created_at    timestamptz default now(),
  resolved_at   timestamptz,
  resolved_by   uuid
);
create index if not exists data_requests_status_idx on data_requests (status, due_at);

-- Defaults a superadmin can change without a deploy.
insert into app_settings (key, value) values
  ('privacy', jsonb_build_object(
     'noticeVersion',            '2026-10',
     'retentionMonthsAfterLeaving', 12,
     'auditLogDays',             400,
     'linkAttemptsPerHour',      5,
     'maxGuardiansPerChild',     4,
     'staffIdleMinutes',         30,
     'parentIdleMinutes',        720,
     'requestDueDays',           30,
     'grievanceOfficer',         jsonb_build_object('name', '', 'email', '', 'phone', '')
  ))
on conflict (key) do nothing;

-- ─── 2. Helper functions ────────────────────────────────────────────

-- True when the call came through the Supabase API (anon or signed in),
-- false in the SQL editor or a pg_cron job. Lets maintenance run by hand
-- without ever letting the anonymous key through.
create or replace function public.kc_is_api()
returns boolean
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''),
                  nullif(current_setting('request.jwt.claim.role', true), '')) is not null
$$;

-- A suspended account has no role at all, so every policy fails closed.
create or replace function public.kc_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles
  where id = auth.uid() and coalesce(suspended, false) = false
$$;

-- Admin powers need a second factor in the session once one is enrolled.
create or replace function public.kc_is_admin()
returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select coalesce(public.kc_role() = 'admin', false)
     and (
       not exists (
         select 1 from auth.mfa_factors f
         where f.user_id = auth.uid() and f.status = 'verified'
       )
       or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
     )
$$;

create or replace function public.kc_is_teacher()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.kc_role() = 'teacher', false) or public.kc_is_admin() $$;

create or replace function public.kc_my_school()
returns text
language sql stable security definer set search_path = public
as $$ select school from public.profiles where id = auth.uid() $$;

-- May the current staff member see this child? Admin: any. Teacher: same school.
create or replace function public.kc_staff_can(sid text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.kc_is_admin()
      or (
        coalesce(public.kc_role() = 'teacher', false)
        and exists (
          select 1 from public.students s
          where s.id = sid
            and s.school is not null
            and s.school = public.kc_my_school()
        )
      )
$$;

-- A parent sees a child only through a live, consented, unrevoked link,
-- and never once the child has left the school.
create or replace function public.kc_owns_student(sid text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.kc_role() = 'parent', false)
     and exists (
       select 1
       from public.parent_links l
       join public.students s on s.id = l.student_id
       where l.parent_id = auth.uid()
         and l.student_id = sid
         and l.consented_at is not null
         and l.revoked_at is null
         and coalesce(s.archived, false) = false
     )
$$;

create or replace function public.kc_setting(k text, path text, fallback text)
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce((select value ->> path from public.app_settings where key = k), fallback)
$$;

-- Is this parent account linked to a child in the caller's school?
create or replace function public.kc_parent_in_my_school(pid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.parent_links l
                 join public.students s on s.id = l.student_id
                 where l.parent_id = pid and s.school = public.kc_my_school())
$$;

-- ─── 3. Guard rails (triggers) ──────────────────────────────────────

-- A. Nobody but an admin (or the SQL editor) changes role, school or status.
create or replace function public.kc_guard_profile()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.kc_is_api() or public.kc_is_admin() then
    return new;
  end if;
  if new.role       is distinct from old.role
  or new.suspended  is distinct from old.suspended
  or new.school     is distinct from old.school
  or new.class_name is distinct from old.class_name
  or new.grade      is distinct from old.grade
  or new.section    is distinct from old.section
  or new.id         is distinct from old.id then
    raise exception 'PROTECTED_FIELD';
  end if;
  return new;
end;
$$;

drop trigger if exists kc_guard_profile on profiles;
create trigger kc_guard_profile
  before update on profiles
  for each row execute function public.kc_guard_profile();

-- B/C. A teacher writes only inside their own school, and an observation
-- keeps its author for life.
create or replace function public.kc_guard_observation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.kc_is_api() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
  else
    new.author_id := old.author_id;
    if new.student_id is distinct from old.student_id and not public.kc_is_admin() then
      raise exception 'CANNOT_MOVE_OBSERVATION';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists kc_guard_observation on observations;
create trigger kc_guard_observation
  before insert or update on observations
  for each row execute function public.kc_guard_observation();

-- Teachers may not move a child to another school, or into one.
create or replace function public.kc_guard_student()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.kc_is_api() or public.kc_is_admin() then
    if tg_op = 'UPDATE' and new.archived and not coalesce(old.archived, false) then
      new.archived_at := coalesce(new.archived_at, now());
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.school := public.kc_my_school();
  elsif new.school is distinct from old.school then
    raise exception 'CANNOT_MOVE_STUDENT';
  end if;
  if new.archived and (tg_op = 'INSERT' or not coalesce(old.archived, false)) then
    new.archived_at := now();
  elsif not coalesce(new.archived, false) then
    new.archived_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists kc_guard_student on students;
create trigger kc_guard_student
  before insert or update on students
  for each row execute function public.kc_guard_student();

-- E. The server, not the browser, says who did it.
create or replace function public.kc_stamp_audit()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.actor_id   := auth.uid();
    new.actor_role := public.kc_role();
  end if;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists kc_stamp_audit on audit_log;
create trigger kc_stamp_audit
  before insert on audit_log
  for each row execute function public.kc_stamp_audit();

-- Append-only: nobody updates or deletes audit or consent history from the app.
revoke update, delete, truncate on audit_log from anon, authenticated;
revoke update, delete, truncate on consents  from anon, authenticated;

-- ─── 4. Signup: parents are no longer linked by code at signup ──────
-- Linking happens after sign-in, with the child's first name and an
-- explicit consent (section 5). Teacher codes work as before.

create or replace function public.kc_handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role   text := coalesce(new.raw_user_meta_data ->> 'role', 'parent');
  v_name   text := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
                                 split_part(new.email, '@', 1)), 120);
  v_code   text := nullif(upper(trim(new.raw_user_meta_data ->> 'code')), '');
  v_school text;
  v_class  text;
  v_grade  int;
  v_sec    text;
begin
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

  insert into public.audit_log (actor_id, actor_role, action, entity, entity_id)
  values (new.id, v_role, 'signup', 'profile', new.id::text);

  return new;
end;
$$;

-- ─── 5. Guardian linking, consent and withdrawal ────────────────────

-- D. Code + first name + consent, rate limited, capped. Returns jsonb so a
-- failed attempt is still recorded (an exception would roll it back).
drop function if exists public.kc_link_child(text);
create or replace function public.kc_link_child(
  child_code     text,
  child_first    text,
  notice_version text,
  purposes       text[] default array['profile', 'hpc', 'ptm'],
  relationship   text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_sid    text;
  v_name   text;
  v_fails  int;
  v_limit  int := public.kc_setting('privacy', 'linkAttemptsPerHour', '5')::int;
  v_max    int := public.kc_setting('privacy', 'maxGuardiansPerChild', '4')::int;
  v_count  int;
begin
  if public.kc_role() is distinct from 'parent' then
    return jsonb_build_object('ok', false, 'error', 'NOT_A_PARENT');
  end if;
  if coalesce(trim(notice_version), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'CONSENT_REQUIRED');
  end if;

  select count(*) into v_fails from public.link_attempts
  where user_id = auth.uid() and not ok and created_at > now() - interval '1 hour';
  if v_fails >= v_limit then
    return jsonb_build_object('ok', false, 'error', 'TOO_MANY_ATTEMPTS');
  end if;

  select id, name into v_sid, v_name from public.students
  where upper(access_code) = upper(trim(child_code))
    and coalesce(archived, false) = false;

  if v_sid is null
     or lower(split_part(trim(v_name), ' ', 1)) <> lower(split_part(trim(coalesce(child_first, '')), ' ', 1))
  then
    insert into public.link_attempts (user_id, ok) values (auth.uid(), false);
    -- Same answer for a wrong code and a wrong name: no hint about which.
    return jsonb_build_object('ok', false, 'error', 'UNKNOWN_CODE',
                              'left', greatest(v_limit - v_fails - 1, 0));
  end if;

  select count(*) into v_count from public.parent_links
  where student_id = v_sid and revoked_at is null and consented_at is not null
    and parent_id <> auth.uid();
  if v_count >= v_max then
    insert into public.link_attempts (user_id, ok) values (auth.uid(), false);
    return jsonb_build_object('ok', false, 'error', 'GUARDIAN_LIMIT');
  end if;

  insert into public.parent_links (parent_id, student_id, consented_at, consent_version, relationship)
  values (auth.uid(), v_sid, now(), notice_version, left(relationship, 40))
  on conflict (parent_id, student_id) do update
    set consented_at = now(), consent_version = excluded.consent_version,
        relationship = coalesce(excluded.relationship, parent_links.relationship),
        revoked_at = null, revoked_by = null;

  insert into public.consents (parent_id, student_id, notice_version, purposes, action)
  values (auth.uid(), v_sid, notice_version, coalesce(purposes, '{}'), 'given');

  insert into public.link_attempts (user_id, ok) values (auth.uid(), true);

  insert into public.audit_log (action, entity, entity_id, detail)
  values ('consent.given', 'student', v_sid, jsonb_build_object('notice', notice_version));

  return jsonb_build_object('ok', true, 'student_id', v_sid);
end;
$$;
grant execute on function public.kc_link_child(text, text, text, text[], text) to authenticated;

-- Links made before v4 have no consent. The parent confirms them here.
create or replace function public.kc_pending_links()
returns table (student_id text, first_name text, school text)
language sql stable security definer set search_path = public
as $$
  select s.id, split_part(s.name, ' ', 1), s.school
  from public.parent_links l join public.students s on s.id = l.student_id
  where l.parent_id = auth.uid()
    and l.consented_at is null and l.revoked_at is null
    and coalesce(s.archived, false) = false
    and coalesce(public.kc_role() = 'parent', false)
$$;
grant execute on function public.kc_pending_links() to authenticated;

create or replace function public.kc_confirm_link(sid text, notice_version text,
                                                  purposes text[] default array['profile', 'hpc', 'ptm'])
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if coalesce(trim(notice_version), '') = '' then
    raise exception 'CONSENT_REQUIRED';
  end if;
  update public.parent_links
     set consented_at = now(), consent_version = notice_version
   where parent_id = auth.uid() and student_id = sid
     and revoked_at is null and consented_at is null;
  if not found then
    return false;
  end if;
  insert into public.consents (parent_id, student_id, notice_version, purposes, action)
  values (auth.uid(), sid, notice_version, coalesce(purposes, '{}'), 'given');
  insert into public.audit_log (action, entity, entity_id, detail)
  values ('consent.given', 'student', sid, jsonb_build_object('notice', notice_version));
  return true;
end;
$$;
grant execute on function public.kc_confirm_link(text, text, text[]) to authenticated;

-- Withdrawing is as easy as giving (DPDP Act s.6(4)). Access stops at once.
create or replace function public.kc_withdraw_consent(sid text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_version text;
begin
  update public.parent_links
     set revoked_at = now(), revoked_by = auth.uid()
   where parent_id = auth.uid() and student_id = sid and revoked_at is null
  returning consent_version into v_version;
  if not found then
    return false;
  end if;
  insert into public.consents (parent_id, student_id, notice_version, action)
  values (auth.uid(), sid, coalesce(v_version, 'unknown'), 'withdrawn');
  insert into public.audit_log (action, entity, entity_id)
  values ('consent.withdrawn', 'student', sid);
  return true;
end;
$$;
grant execute on function public.kc_withdraw_consent(text) to authenticated;

-- Staff see who can read a child's profile, and can cut off a guardian
-- (lost sticker, custody order, wrong person).
create or replace function public.kc_student_guardians(sid text)
returns table (parent_id uuid, full_name text, relationship text,
               consented_at timestamptz, revoked_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select l.parent_id, p.full_name, l.relationship, l.consented_at, l.revoked_at
  from public.parent_links l left join public.profiles p on p.id = l.parent_id
  where l.student_id = sid and public.kc_staff_can(sid)
  order by l.created_at
$$;
grant execute on function public.kc_student_guardians(text) to authenticated;

create or replace function public.kc_revoke_guardian(sid text, pid uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if not public.kc_staff_can(sid) then
    raise exception 'NOT_ALLOWED';
  end if;
  update public.parent_links set revoked_at = now(), revoked_by = auth.uid()
   where student_id = sid and parent_id = pid and revoked_at is null;
  if not found then
    return false;
  end if;
  insert into public.audit_log (action, entity, entity_id, detail)
  values ('guardian.revoke', 'student', sid, jsonb_build_object('parent_id', pid));
  return true;
end;
$$;
grant execute on function public.kc_revoke_guardian(text, uuid) to authenticated;

-- Fresh, random parent code (lost or photographed sticker). Old code dies.
create or replace function public.kc_rotate_access_code(sid text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_alpha text := 'ACDEFGHJKLMNPQRTUVWXY3479';
  v_code  text;
  i int;
begin
  if not public.kc_staff_can(sid) then
    raise exception 'NOT_ALLOWED';
  end if;
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alpha, 1 + floor(random() * length(v_alpha))::int, 1);
      if i = 4 then v_code := v_code || '-'; end if;
    end loop;
    exit when not exists (select 1 from public.students where access_code = v_code);
  end loop;
  update public.students set access_code = v_code where id = sid;
  insert into public.audit_log (action, entity, entity_id)
  values ('access_code.rotate', 'student', sid);
  return v_code;
end;
$$;
grant execute on function public.kc_rotate_access_code(text) to authenticated;

-- ─── 6. Access logging (DPDP Rules r.6: visibility of who accessed what) ─

create or replace function public.kc_log_access(sid text, what text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not (public.kc_staff_can(sid) or public.kc_owns_student(sid)) then
    return;
  end if;
  insert into public.audit_log (action, entity, entity_id)
  values ('read.' || left(regexp_replace(coalesce(what, 'profile'), '[^a-z_.]', '', 'g'), 40),
          'student', sid);
end;
$$;
grant execute on function public.kc_log_access(text, text) to authenticated;

-- ─── 7. Erasure and retention ───────────────────────────────────────

-- Erase one child completely. Observations, stories, self and peer voice,
-- parent notes, links and consents go with them (on delete cascade).
-- The audit log keeps the bare fact of the erasure, with no content.
create or replace function public.kc_erase_student(sid text, reason text default null)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if public.kc_is_api() and not public.kc_is_admin() then
    raise exception 'NOT_AN_ADMIN';
  end if;
  delete from public.students where id = sid;
  if not found then
    return false;
  end if;
  insert into public.audit_log (action, entity, entity_id, detail)
  values ('student.erase', 'student', sid, jsonb_build_object('reason', left(reason, 200)));
  return true;
end;
$$;
grant execute on function public.kc_erase_student(text, text) to authenticated;

-- I. Run nightly (pg_cron, see docs/SECURITY.md) or from /admin/privacy.
create or replace function public.kc_apply_retention()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_months int := greatest(public.kc_setting('privacy', 'retentionMonthsAfterLeaving', '12')::int, 1);
  v_days   int := greatest(public.kc_setting('privacy', 'auditLogDays', '400')::int, 365);
  v_kids   int;
  v_logs   int;
  v_tries  int;
begin
  if public.kc_is_api() and not public.kc_is_admin() then
    raise exception 'NOT_AN_ADMIN';
  end if;

  with gone as (
    delete from public.students
    where coalesce(archived, false)
      and archived_at is not null
      and archived_at < now() - make_interval(months => v_months)
    returning id
  )
  select count(*) into v_kids from gone;

  -- Audit rows are removed only through this function, and never younger
  -- than a year.
  with old as (
    delete from public.audit_log where created_at < now() - make_interval(days => v_days)
    returning 1
  )
  select count(*) into v_logs from old;

  delete from public.link_attempts where created_at < now() - interval '30 days';
  get diagnostics v_tries = row_count;

  insert into public.audit_log (action, entity, detail)
  values ('retention.run', 'system',
          jsonb_build_object('children_erased', v_kids, 'log_rows_removed', v_logs));

  return jsonb_build_object('children_erased', v_kids, 'log_rows_removed', v_logs,
                            'attempts_removed', v_tries);
end;
$$;
grant execute on function public.kc_apply_retention() to authenticated;

-- The anonymous key can call none of the functions that change anything.
do $$
declare f text;
begin
  foreach f in array array[
    'kc_link_child(text, text, text, text[], text)',
    'kc_pending_links()',
    'kc_confirm_link(text, text, text[])',
    'kc_withdraw_consent(text)',
    'kc_student_guardians(text)',
    'kc_revoke_guardian(text, uuid)',
    'kc_rotate_access_code(text)',
    'kc_log_access(text, text)',
    'kc_erase_student(text, text)',
    'kc_apply_retention()',
    'kc_set_role(text, text)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ─── 8. Row-Level Security, rebuilt ─────────────────────────────────

alter table consents      enable row level security;
alter table link_attempts enable row level security;
alter table data_requests enable row level security;

do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('schools','students','observations','subject_insights',
                        'profiles','parent_links','teacher_codes','self_assessments',
                        'peer_assessments','parent_notes','app_settings','audit_log',
                        'consents','link_attempts','data_requests')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- profiles: yourself; staff see people in their own school; admin all.
create policy "profiles read" on profiles
  for select using (
    id = auth.uid()
    or public.kc_is_admin()
    or (coalesce(public.kc_role() = 'teacher', false) and (
          (school is not null and school = public.kc_my_school())
          or public.kc_parent_in_my_school(profiles.id)
       ))
  );
create policy "profiles self update" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin write" on profiles
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

-- students
create policy "students read" on students
  for select using (public.kc_staff_can(id) or public.kc_owns_student(id));
create policy "students staff insert" on students
  for insert with check (
    public.kc_is_admin()
    or (coalesce(public.kc_role() = 'teacher', false) and school = public.kc_my_school())
  );
create policy "students staff update" on students
  for update using (public.kc_staff_can(id)) with check (public.kc_staff_can(id));
create policy "students admin delete" on students
  for delete using (public.kc_is_admin());

-- observations
create policy "observations read" on observations
  for select using (
    public.kc_staff_can(student_id)
    or (public.kc_owns_student(student_id) and coalesce(visibility, 'shared') = 'shared')
  );
create policy "observations insert" on observations
  for insert with check (public.kc_staff_can(student_id));
create policy "observations update own" on observations
  for update using (
    public.kc_staff_can(student_id)
    and (author_id = auth.uid() or author_id is null or public.kc_is_admin())
  ) with check (public.kc_staff_can(student_id));
create policy "observations delete own" on observations
  for delete using (
    public.kc_staff_can(student_id)
    and (author_id = auth.uid() or author_id is null or public.kc_is_admin())
  );

-- subject insights follow their observation
create policy "insights read" on subject_insights
  for select using (
    exists (
      select 1 from public.observations o
      where o.id = subject_insights.observation_id
        and (public.kc_staff_can(o.student_id)
             or (public.kc_owns_student(o.student_id)
                 and coalesce(o.visibility, 'shared') = 'shared'))
    )
  );
create policy "insights author write" on subject_insights
  for all using (
    exists (select 1 from public.observations o
            where o.id = subject_insights.observation_id
              and public.kc_staff_can(o.student_id)
              and (o.author_id = auth.uid() or o.author_id is null or public.kc_is_admin()))
  ) with check (
    exists (select 1 from public.observations o
            where o.id = subject_insights.observation_id
              and public.kc_staff_can(o.student_id)
              and (o.author_id = auth.uid() or o.author_id is null or public.kc_is_admin()))
  );

-- guardian links: the parent sees their own; staff see their school's.
-- All changes go through the functions above, or an admin.
create policy "links read" on parent_links
  for select using (parent_id = auth.uid() or public.kc_staff_can(student_id));
create policy "links admin write" on parent_links
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

create policy "schools read" on schools
  for select using (public.kc_is_admin() or name = public.kc_my_school()
                    or exists (select 1 from public.parent_links l
                               join public.students s on s.id = l.student_id
                               where l.parent_id = auth.uid() and s.school = schools.name
                                 and l.revoked_at is null));
create policy "schools admin write" on schools
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

create policy "self read" on self_assessments
  for select using (public.kc_staff_can(student_id) or public.kc_owns_student(student_id));
create policy "self staff write" on self_assessments
  for all using (public.kc_staff_can(student_id)) with check (public.kc_staff_can(student_id));

-- Peer voice: staff only, appreciation only, author never leaves the school.
create policy "peer staff only" on peer_assessments
  for all using (public.kc_staff_can(student_id)) with check (public.kc_staff_can(student_id));

create policy "parent notes read" on parent_notes
  for select using (public.kc_staff_can(student_id)
                    or (parent_id = auth.uid() and public.kc_owns_student(student_id)));
create policy "parent notes write" on parent_notes
  for insert with check (parent_id = auth.uid() and public.kc_owns_student(student_id)
                         and char_length(coalesce(body, '')) <= 4000);
create policy "parent notes update own" on parent_notes
  for update using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy "parent notes delete own" on parent_notes
  for delete using (parent_id = auth.uid() or public.kc_is_admin());

create policy "settings read" on app_settings
  for select using (auth.uid() is not null);
create policy "settings admin write" on app_settings
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

-- audit: admin reads; anyone signed in may append (the trigger stamps who).
create policy "audit admin read" on audit_log
  for select using (public.kc_is_admin());
create policy "audit append" on audit_log
  for insert with check (auth.uid() is not null);

create policy "codes admin" on teacher_codes
  for all using (public.kc_is_admin()) with check (public.kc_is_admin());

-- consent ledger: the parent reads their own; staff read their school's;
-- rows are only ever written by the functions above.
create policy "consents read" on consents
  for select using (parent_id = auth.uid() or public.kc_staff_can(student_id));

-- link attempts: nobody reads them from the browser.

-- rights requests: a family files and reads their own; admin works the queue.
create policy "requests read" on data_requests
  for select using (requester_id = auth.uid() or public.kc_is_admin());
create policy "requests file" on data_requests
  for insert with check (
    requester_id = auth.uid()
    and status = 'open'
    and (student_id is null
         or exists (select 1 from public.parent_links l
                    where l.parent_id = auth.uid() and l.student_id = data_requests.student_id))
  );
create policy "requests admin" on data_requests
  for update using (public.kc_is_admin()) with check (public.kc_is_admin());

-- ─── 9. Rotate the codes that were published in this repo ───────────
-- schema.sql seeds the pilot roster with fixed access codes, and that file is
-- in git. Uncomment and run once, then reprint the stickers from the app.
--
--   select public.kc_rotate_access_code(id) from public.students;
--
-- Likewise, VIDYA-7C was printed on the public sign-in page until v4.
-- Replace it with a code that expires:
--
--   update public.teacher_codes
--      set code = 'VIDYA-7C-' || upper(substr(md5(random()::text), 1, 6)),
--          uses_left = 3, expires_at = now() + interval '14 days'
--    where code = 'VIDYA-7C';
