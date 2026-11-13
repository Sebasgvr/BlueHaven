-- Compatibilidad del stack de prueba con los claims de PostgREST moderno.
-- Supabase alojado ya proporciona esta implementación; no ejecutar allí.
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
    nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
$$;
