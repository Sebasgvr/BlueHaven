#!/bin/sh
set -eu
compose_file=tests/supabase/compose.yaml
project_name=bluehaven-supabase-test
docker compose -p "$project_name" -f "$compose_file" up -d
attempt=0
until curl -fsS http://127.0.0.1:54321/auth/v1/health >/dev/null; do
  attempt=$((attempt+1))
  if [ "$attempt" -ge 60 ]; then docker compose -p "$project_name" -f "$compose_file" logs; exit 1; fi
  sleep 1
done
docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < tests/supabase/claims.sql
installed=$(docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -tAc "select to_regclass('public.perfiles') is not null")
if [ "$installed" != t ]; then
  docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/instalar.sql
fi
shop_installed=$(docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -tAc "select to_regclass('public.productos_pesca') is not null")
if [ "$shop_installed" != t ]; then
  docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261111234025_tienda_equipamiento.sql
fi
docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -c "NOTIFY pgrst, 'reload schema'"
SUPABASE_TEST_URL=http://127.0.0.1:54321 SUPABASE_TEST_ANON_KEY="$(node tests/supabase/token.cjs)" npm run test:api
