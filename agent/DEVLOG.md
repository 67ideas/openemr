# Monday (2026-02-23)

- Built AI agent MVP: CLI + 3 tools (drug interaction, ICD-10 lookup, medication info) — [plans/001-ai-agent-mvp.md](plans/001-ai-agent-mvp.md)
- Integrated agent tools with live OpenEMR REST API (OAuth2 auth, symptom lookup, provider search) — [plans/002-ai-tool-openemr-integration.md](plans/002-ai-tool-openemr-integration.md)

# Thursday (2026-02-26)

- Fixed "unsupported AI SDK model": replaced `gateway()` with `@ai-sdk/anthropic` provider string so Braintrust's `wrapAISDKModel` works correctly
- Added `AGENT_API_KEY` bearer token auth middleware to agent server; `/chat` and `/feedback` endpoints now return 401 without a valid token
- Updated chat UI to read `?token=` query param, send `Authorization` header, show auth overlay on 401
- Replaced in-memory conversation store with Redis (`ioredis`) using `REDIS_URL` env var and 24h TTL per session
- Expanded eval suite from 10 → 52 test cases: edge cases, hallucination probes, adversarial/prompt injection, and robustness scenarios
- Added thumbs up/down feedback row after each agent response; feedback is logged to Braintrust via `logger.logFeedback()`; `spanId` returned in every `AgentResponse`
- Added `createOpenEMRTask` HITL action: when a drug interaction escalation fires with patient context, automatically POSTs a high-urgency task to OpenEMR's patient messaging API
- Wrote `agent/ARCHITECTURE.md`: single-page document covering agent architecture, verification strategy, eval results, observability, and contribution

# Friday (2026-02-27)

- Added dashboard AI quick-explain interactions for allergies, medical problems, medications, and prescriptions: hovering shows an AI tooltip and clicking opens the AI panel and auto-sends `in the context of this patient, explain in more detail: <item>`

# Saturday (2026-02-28)

- Added `riskFactorsTool` to the clinical agent: fetches patient demographics, medications, and problems from OpenEMR, then makes a secondary LLM call to generate a ranked, personalized risk factor assessment (factor, rationale, severity, category) specific to that patient
- Filled eval framework gaps: added `toolsInvoked`, `toolErrors`, and `latencyMs` fields to `AgentResponse`; added `toolSelectionCorrect`, `noToolErrors`, and `latencyOk` scorers to Braintrust eval harness; added `expectedTools` and `expectNoToolErrors` fields to `TestCase`; added 2 parameter-correctness test cases (tc-53, tc-54); added true consistency tests (2 repeated-call pairs) and latency assertion to Vitest suite
- Added `agent/AI-COST-ANALYSIS.md` with monthly cost projections for 100/1k/10k/100k clinicians using 5,200 tokens/request, 5 req/hour, 10-hour workdays, a 20-day month assumption, Claude Haiku 4.5 pricing with an 80/20 output-heavy token mix, and Braintrust Free/Pro/Enterprise tier mapping from the pricing screenshot
