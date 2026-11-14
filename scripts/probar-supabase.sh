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
filters_installed=$(docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -tAc "select to_regprocedure('bluehaven_privado.validar_cuenta_auth()') is not null")
if [ "$filters_installed" != t ]; then
  docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261113122304_filtros_cuentas.sql
fi
ranking_installed=$(docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -tAc "select to_regclass('bluehaven_privado.ranking_pesca') is not null")
if [ "$ranking_installed" != t ]; then
  docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261113125249_ranking_jugadores.sql
fi
ranking_policy_installed=$(docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -tAc "select exists(select 1 from pg_policies where schemaname='bluehaven_privado' and policyname='ranking_solo_funciones_internas')")
if [ "$ranking_policy_installed" != t ]; then
  docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261113132727_ranking_politica_privada.sql
fi
salas_installed=$(docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -tAc "select to_regclass('bluehaven_privado.salas') is not null")
if [ "$salas_installed" != t ]; then
  docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261113234229_salas_multijugador.sql
fi
docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261113235843_salas_orden_bloqueos.sql
chat_installed=$(docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -tAc "select to_regclass('bluehaven_privado.sala_mensajes') is not null")
if [ "$chat_installed" != t ]; then
 docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261114021514_chat_salas.sql
fi
docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -c "NOTIFY pgrst, 'reload schema'"
SUPABASE_TEST_URL=http://127.0.0.1:54321 SUPABASE_TEST_ANON_KEY="$(node tests/supabase/token.cjs)" npm run test:api

SUPABASE_TEST_URL=http://127.0.0.1:54321 SUPABASE_TEST_ANON_KEY="$(node tests/supabase/token.cjs)" node tests/salas-api.cjs

docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < tests/salas-lease.sql

SUPABASE_TEST_URL=http://127.0.0.1:54321 SUPABASE_TEST_ANON_KEY="$(node tests/supabase/token.cjs)" node tests/chat-api.cjs
docker compose -p "$project_name" -f "$compose_file" exec -T db psql -U postgres -v ON_ERROR_STOP=1 < tests/chat-retencion.sql
