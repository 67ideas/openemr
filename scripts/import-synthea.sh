#!/usr/bin/env bash
# Generates 150 synthetic patients via Synthea (seed=42) and imports them into
# the OpenEMR Docker dev environment.  Safe to re-run — Synthea output is wiped
# before each generation so you always get the same reproducible cohort.
#
# Usage (run from repo root or docker/development-easy/):
#   ./scripts/import-synthea.sh
#
# Requirements: Docker must be running with the development-easy stack up.

set -euo pipefail

PATIENT_COUNT=150
SEED=42
COMPOSE_DIR="$(cd "$(dirname "$0")/../docker/development-easy" && pwd)"
CONTAINER="development-easy-openemr-1"

check_container() {
    docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null | grep -q "healthy"
}

if ! check_container; then
    echo "OpenEMR container is not healthy. Start it first:"
    echo "  cd docker/development-easy && docker compose up --detach --wait"
    exit 1
fi

echo "==> Setting up Java + Synthea inside container (once per container lifetime)..."
docker exec "$CONTAINER" sh -c '
    if [ ! -f /root/synthea/synthea-with-dependencies.jar ]; then
        echo "Installing Java..."
        apk update -q && apk add -q openjdk11-jre
        mkdir -p /root/synthea
        cd /root/synthea
        echo "Downloading Synthea..."
        wget -q https://github.com/synthetichealth/synthea/releases/download/master-branch-latest/synthea-with-dependencies.jar
    else
        echo "Synthea already present, skipping download."
    fi
'

echo "==> Generating ${PATIENT_COUNT} patients with seed ${SEED}..."
docker exec "$CONTAINER" sh -c "
    rm -rf /root/synthea/output
    cd /root/synthea
    java -jar synthea-with-dependencies.jar \
        --exporter.fhir.export true \
        --exporter.ccda.export true \
        --generate.only_alive_patients true \
        -s ${SEED} \
        -p ${PATIENT_COUNT}
    echo 'Synthea generation complete.'
    echo \"FHIR bundles: \$(ls /root/synthea/output/fhir/*.json 2>/dev/null | wc -l)\"
    echo \"CCDA files:   \$(ls /root/synthea/output/ccda/*.xml 2>/dev/null | wc -l)\"
"

echo "==> Importing patients into OpenEMR via CCDA..."
docker exec -e OPENEMR_ENABLE_CCDA_IMPORT=1 "$CONTAINER" sh -c '
    sed -i "s@exit;@//exit;@" /var/www/localhost/htdocs/openemr/contrib/util/ccda_import/import_ccda.php
    php /var/www/localhost/htdocs/openemr/contrib/util/ccda_import/import_ccda.php \
        --sourcePath=/root/synthea/output/ccda \
        --site=default \
        --openemrPath=/var/www/localhost/htdocs/openemr \
        --isDev=true
    sed -i "s@//exit;@exit;@" /var/www/localhost/htdocs/openemr/contrib/util/ccda_import/import_ccda.php
'

echo ""
echo "==> Done! Synthea FHIR R4 bundles are at /root/synthea/output/fhir/ inside the container."
echo "    Patients are now in OpenEMR and queryable at:"
echo "    https://localhost:9300/apis/default/fhir/Patient"
echo ""
echo "    To copy FHIR bundles to host:"
echo "    docker cp ${CONTAINER}:/root/synthea/output/fhir ./synthea-fhir-output"
