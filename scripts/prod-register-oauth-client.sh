#!/usr/bin/env bash
# Registers a confidential OAuth2 client on a live OpenEMR instance and prints
# the generated client_id and client_secret.
#
# Usage:
#   OPENEMR_BASE_URL=https://your-prod-domain.com ./scripts/prod-register-oauth-client.sh
#
# Output is written to stdout AND saved to .oauth-client-prod.json in the repo
# root so you can copy the values into Railway env vars.  Delete that file after
# you've copied the credentials.

set -euo pipefail

BASE_URL="${OPENEMR_BASE_URL:?OPENEMR_BASE_URL must be set}"
OUT_FILE="$(cd "$(dirname "$0")/.." && pwd)/.oauth-client-prod.json"

SCOPE="openid api:oemr api:fhir user/patient.read user/practitioner.read user/Patient.read user/Practitioner.read user/MedicationRequest.read user/Condition.read user/appointment.read user/insurance.crus"

echo "==> Registering confidential OAuth2 client at ${BASE_URL} ..."

RESPONSE=$(curl --fail --silent --show-error \
  -X POST "${BASE_URL}/oauth2/default/registration" \
  -H "Content-Type: application/json" \
  -d "{
    \"application_type\": \"private\",
    \"client_name\": \"OpenEMR AI Agent\",
    \"grant_types\": [\"password\", \"refresh_token\"],
    \"scope\": \"${SCOPE}\"
  }")

echo "$RESPONSE" | tee "$OUT_FILE"

CLIENT_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['client_id'])" 2>/dev/null || echo "")
CLIENT_SECRET=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['client_secret'])" 2>/dev/null || echo "")

echo ""
echo "==> Done.  Set these in the Railway agent service:"
echo "    OPENEMR_CLIENT_ID=${CLIENT_ID}"
echo "    OPENEMR_CLIENT_SECRET=${CLIENT_SECRET}"
echo ""
echo "    Raw response saved to: ${OUT_FILE}"
echo "    Delete that file after copying the credentials."
