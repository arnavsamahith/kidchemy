-- Mock of the bits of Supabase the policies use: roles, auth.uid(), auth.jwt(), auth.users, auth.mfa_factors.
-- Usage: createdb t; psql -d t -f mock_supabase.sql -f ../schema.sql -f ../security.sql -f security_test.sql
create role anon nologin; create role authenticated nologin;
create extension if not exists pgcrypto;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create table auth.mfa_factors (id uuid default gen_random_uuid(), user_id uuid, status text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
grant usage on schema auth to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;
grant select on auth.mfa_factors to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
