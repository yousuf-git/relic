#!/usr/bin/env bash
# Applies db/migrations/*.sql in order to the checked-out Neon branch (DATABASE_URL_UNPOOLED in .env).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
DB="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

psql "$DB" -v ON_ERROR_STOP=1 -qc "create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now());
alter table public.schema_migrations enable row level security;
revoke all on public.schema_migrations from anonymous, authenticated;"

for f in db/migrations/*.sql; do
  name="$(basename "$f")"
  if [ "$(psql "$DB" -Atc "select 1 from public.schema_migrations where name = '$name'")" = "1" ]; then
    continue
  fi
  echo "applying $name"
  psql "$DB" -v ON_ERROR_STOP=1 -q -1 -f "$f" -c "insert into public.schema_migrations (name) values ('$name')"
done
neon data-api refresh-schema >/dev/null
echo "migrations up to date on branch ${NEON_BRANCH:-?} (Data API schema cache refreshed)"
