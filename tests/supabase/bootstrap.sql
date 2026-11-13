-- Solo para pruebas locales. En Supabase estos roles y funciones ya existen.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator noinherit login password 'bluehaven_test';
create role supabase_auth_admin login password 'bluehaven_test';
grant anon, authenticated, service_role to authenticator;
create schema auth authorization supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth,public;
create extension if not exists pgcrypto;
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
    nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
$$;
grant usage on schema public, auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
alter function auth.uid() owner to supabase_auth_admin;
