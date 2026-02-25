#!/usr/bin/env bash
# Smoke-tests the deployed agent service.
#
# Usage:
#   AGENT_URL=https://your-agent.railway.app \
#   PATIENT_ID=1 \
#   ./scripts/prod-smoke-test.sh

set -euo pipefail

AGENT_URL="${AGENT_URL:?AGENT_URL must be set (e.g. https://your-agent.railway.app)}"
PATIENT_ID="${PATIENT_ID:-1}"

echo "==> 1/2  GET ${AGENT_URL}/health"
HEALTH=$(curl --fail --silent --show-error "${AGENT_URL}/health")
echo "    $HEALTH"

echo ""
echo "==> 2/2  POST ${AGENT_URL}/chat  (patient ${PATIENT_ID})"
CHAT=$(curl --fail --silent --show-error \
  -X POST "${AGENT_URL}/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What appointments does patient ${PATIENT_ID} have this week?\",
    \"sessionId\": \"smoke-test\",
    \"patientContext\": { \"patientId\": \"${PATIENT_ID}\" }
  }")
echo "$CHAT"

echo ""
echo "==> Smoke test passed."
