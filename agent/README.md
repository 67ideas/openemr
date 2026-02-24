# OpenEMR Clinical AI Agent

A clinical decision-support agent that combines OpenEMR patient data with public medical APIs (OpenFDA, RxNorm, NLM, PubMed) and an LLM to answer clinical queries. Can be used as an interactive CLI or as an HTTP server that powers the built-in AI chat panel in the OpenEMR UI.

## Prerequisites

- Node.js 18+
- Docker (for running OpenEMR locally)

## Setup

### 1. Start OpenEMR

The `docker/development-easy` directory contains a preconfigured Docker Compose setup for quickly running OpenEMR and its dependencies in a local development environment. This makes it easy to spin up the full OpenEMR stack with a single command.

From the repo root:

```bash
cd docker/development-easy
docker compose up --detach --wait
```

- **OpenEMR UI:** http://localhost:8300 (or https://localhost:9300 for SSL)
- **Login:** `admin` / `pass`
- **phpMyAdmin:** http://localhost:8310

### 2. Register an OAuth Client in OpenEMR

1. Go to **https://localhost:9300** (must use HTTPS — accept the self-signed cert warning)
2. Navigate to **Admin → System → API Clients**
3. Register a new **Confidential** client with:
   - **App Redirect URI:** `http://localhost`
   - **App Launch URI:** `http://localhost`
   - **App Logout URI:** _(leave blank)_
   - **JWKS:** _(leave blank)_
   - **Scopes:** `system/Patient.rs system/Condition.rs system/Practitioner.rs system/MedicationRequest.rs`
4. Save and copy the **Client ID** and **Client Secret**

### 3. Configure the Agent

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```env
AI_GATEWAY_API_KEY=        # Your LLM gateway API key
PUBMED_API_KEY=             # Free key from https://www.ncbi.nlm.nih.gov/account/
OPENEMR_BASE_URL=http://localhost:8300
OPENEMR_CLIENT_ID=          # From step 2
OPENEMR_CLIENT_SECRET=      # From step 2
```

### 4. Install dependencies

```bash
npm install
```

## Running the Agent

### HTTP server (for the OpenEMR UI chat panel)

```bash
npm run server
```

Starts an HTTP server on port 3001 (override with `AGENT_PORT` env var). The OpenEMR UI connects to it automatically via the AI Assistant panel in the navbar.

**Endpoint:** `POST http://localhost:3001/chat`

```json
// Request
{ "message": "What are the interactions between metformin and lisinopril?", "sessionId": "abc123" }

// Response
{ "text": "...", "escalated": false, "confidenceScore": 87 }
```

### Interactive CLI

```bash
npm start
```

Starts an interactive terminal session. Type a clinical query and press Enter.

```
OpenEMR Clinical AI Agent
Type your clinical query below. Type "exit" to quit, "clear" to reset history.

You: What are the drug interactions between metformin and lisinopril?
Agent: ...
```

- Type `clear` to reset conversation history
- Type `exit` or `quit` to stop

## Available Tools

| Tool                  | Data Source        | Description                            |
| --------------------- | ------------------ | -------------------------------------- |
| `drugInteractionTool` | OpenFDA / RxNorm   | Check interactions between two drugs   |
| `icd10LookupTool`     | NLM                | Look up ICD-10-CM codes by condition   |
| `medicationInfoTool`  | RxNorm             | Get drug class and dosage form info    |
| `symptomLookupTool`   | OpenEMR            | Search patient problem lists           |
| `providerSearchTool`  | OpenEMR            | Search providers by name/specialty/NPI |
| `pubmedSearchTool`    | PubMed E-utilities | Search biomedical literature           |

## Running Tests

```bash
npm test
```
