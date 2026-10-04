-- Every line marked (expect ...) should fail or return the shown count.
\set ON_ERROR_STOP 0
-- fixtures as superuser
insert into teacher_codes(code, school, class_name) values ('OTHER-1','Other School','Grade 3A'), ('TEST-7C','Test School','Grade 7C') on conflict do nothing;
insert into students(id,name,school,access_code) values ('t1','Aarav Test','Test School','AAAA-0001'), ('t2','Ananya Test','Test School','AAAA-0002') on conflict do nothing;
insert into students(id,name,school,access_code) values ('x1','Zara Khan','Other School','ZZZZ-ZZZZ') on conflict do nothing;
insert into auth.users(id,email,raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','t@a','{"role":"teacher","code":"test-7c","full_name":"Teach A"}'),
 ('22222222-2222-2222-2222-222222222222','t@b','{"role":"teacher","code":"OTHER-1"}'),
 ('33333333-3333-3333-3333-333333333333','p@a','{"role":"parent","code":"AAAA-0001"}'),
 ('44444444-4444-4444-4444-444444444444','admin@a','{"role":"admin"}');
update profiles set role='admin' where id='44444444-4444-4444-4444-444444444444';
select 'roles', role, school from profiles order by id;
select 'parent auto-linked at signup (expect 0)', count(*) from parent_links;

create or replace function pg_temp.become(u text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u, false), set_config('request.jwt.claims', json_build_object('sub',u,'role','authenticated','aal','aal1')::text, false); $$;

-- ===== Parent =====
select pg_temp.become('33333333-3333-3333-3333-333333333333');
set role authenticated;
\echo --- parent escalation attempt (expect PROTECTED_FIELD)
update profiles set role='admin' where id=auth.uid();
select 'parent sees students before link (0)', count(*) from students;
select 'wrong name', kc_link_child('AAAA-0001','Rahul','2026-10');
select 'right', kc_link_child('aaaa-0001','aarav','2026-10');
select 'parent sees students (1)', count(*) from students;
select 'parent sees other school (0)', count(*) from students where id='x1';
\echo --- parent forging audit actor
insert into audit_log(actor_id, actor_role, action) values ('44444444-4444-4444-4444-444444444444','admin','fake');
\echo --- parent delete audit (expect permission denied)
delete from audit_log;
\echo --- parent erase (expect NOT_AN_ADMIN)
select kc_erase_student('t1');
insert into data_requests(student_id, kind, body) values ('t1','access','please send');
insert into data_requests(student_id, kind, body) values ('x1','erasure','not mine');
select 'parent own requests (1)', count(*) from data_requests;
reset role;
select 'audit stamped', actor_id, actor_role, action from audit_log where action='fake';

-- rate limit
select pg_temp.become('33333333-3333-3333-3333-333333333333'); set role authenticated;
select kc_link_child('AAAA-AAAA','x','2026-10')->>'error', kc_link_child('AAAA-AAAA','x','2026-10')->>'error',kc_link_child('AAAA-AAAA','x','2026-10')->>'error',kc_link_child('AAAA-AAAA','x','2026-10')->>'error';
select 'after 5 fails', kc_link_child('AAAA-0002','Ananya','2026-10')->>'error';
select 'withdraw', kc_withdraw_consent('t1');
select 'after withdraw sees (0)', count(*) from students;
reset role;

-- ===== Teacher A (Vidya) =====
select pg_temp.become('11111111-1111-1111-1111-111111111111'); set role authenticated;
select 'teacher A students (2, no x1)', count(*), bool_or(id='x1') from students;
insert into observations(id, student_id, tags, note) values ('o1','t1','{curiosity}','asked why');
\echo --- teacher A writes other school (expect RLS error)
insert into observations(id, student_id, tags) values ('o2','x1','{x}');
\echo --- teacher A moves student to other school (expect CANNOT_MOVE)
update students set school='Other School' where id='t1';
\echo --- teacher A inserts student claiming other school (should be forced to own)
insert into students(id,name,school) values ('n1','New Kid','Other School');
select 'n1 school', school from students where id='n1';
select 'guardians', count(*) from kc_student_guardians('t1');
select 'rotate', length(kc_rotate_access_code('t1'));
select 'rotate other (expect error)';
select kc_rotate_access_code('x1');
reset role;
-- ===== Teacher B (Other) =====
select pg_temp.become('22222222-2222-2222-2222-222222222222'); set role authenticated;
select 'teacher B students (1)', count(*) from students;
select 'teacher B sees o1 (0)', count(*) from observations;
update observations set note='hacked' where id='o1';
reset role;
select 'o1 note', note, author_id from observations where id='o1';
-- ===== Admin with MFA enrolled but aal1 =====
insert into auth.mfa_factors(user_id,status) values ('44444444-4444-4444-4444-444444444444','verified');
select pg_temp.become('44444444-4444-4444-4444-444444444444'); set role authenticated;
select 'admin aal1 sees audit (0)', count(*) from audit_log;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","aal":"aal2"}', false);
select 'admin aal2 sees audit (>0)', count(*)>0 from audit_log;
select 'admin erase', kc_erase_student('n1','test');
select 'retention', kc_apply_retention();
reset role;
-- ===== anon =====
select set_config('request.jwt.claim.sub','',false), set_config('request.jwt.claims','{"role":"anon"}',false);
set role anon;
select 'anon students (0)', count(*) from students;
\echo --- anon erase (expect permission denied)
select kc_erase_student('t1');
reset role;
select 'final students', count(*) from students;
