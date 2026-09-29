#!/usr/bin/env bash
# Backend container entrypoint: wait for Postgres, migrate, collect static,
# then hand off to the CMD (gunicorn). Idempotent — safe to re-run.
set -euo pipefail

# --- wait for the database ---------------------------------------------------
# DATABASE_URL is postgres://user:pass@host:port/db — pull host:port out of it.
if [[ -n "${DATABASE_URL:-}" ]]; then
  host_port="${DATABASE_URL#*@}"      # user:pass@host:port/db -> host:port/db
  host="${host_port%%:*}"
  rest="${host_port#*:}"
  port="${rest%%/*}"
  echo "Waiting for Postgres at ${host}:${port}..."
  until python -c "import socket,sys; s=socket.socket(); s.settimeout(2); \
      s.connect(('${host}', int('${port}'))); s.close()" 2>/dev/null; do
    sleep 1
  done
  echo "Postgres is up."
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Optional demo seed on first boot: set SEED_DEMO=1 in the environment.
if [[ "${SEED_DEMO:-0}" == "1" ]]; then
  echo "Seeding demo data..."
  python manage.py seed_demo || echo "seed_demo skipped/failed (non-fatal)"
fi

exec "$@"
