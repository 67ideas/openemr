#!/usr/bin/env bash
# Runs docker/development-easy/seed.sql against a remote MySQL/MariaDB database.
# The script is idempotent — safe to run multiple times.
#
# Usage (direct DB access):
#   OPENEMR_DB_HOST=your-db-host \
#   OPENEMR_DB_PORT=3306 \
#   OPENEMR_DB_USER=openemr \
#   OPENEMR_DB_PASSWORD=secret \
#   OPENEMR_DB_NAME=openemr \
#   ./scripts/prod-run-seed.sh
#
# Usage (via Railway exec, from inside the running OpenEMR container):
#   railway run --service openemr -- \
#     mariadb -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DATABASE" \
#     < docker/development-easy/seed.sql

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEED_FILE="${REPO_ROOT}/docker/development-easy/seed.sql"

DB_HOST="${OPENEMR_DB_HOST:?OPENEMR_DB_HOST must be set}"
DB_PORT="${OPENEMR_DB_PORT:-3306}"
DB_USER="${OPENEMR_DB_USER:?OPENEMR_DB_USER must be set}"
DB_PASSWORD="${OPENEMR_DB_PASSWORD:?OPENEMR_DB_PASSWORD must be set}"
DB_NAME="${OPENEMR_DB_NAME:-openemr}"

echo "==> Running seed.sql against ${DB_HOST}:${DB_PORT}/${DB_NAME} ..."

mysql \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  "-p${DB_PASSWORD}" \
  "$DB_NAME" \
  < "$SEED_FILE"

echo "==> Seed complete."
