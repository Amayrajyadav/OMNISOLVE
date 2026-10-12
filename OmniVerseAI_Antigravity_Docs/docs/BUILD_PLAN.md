# Build Plan
## OmniVerse AI — timeboxed prototype

The event's build window and rules take precedence. Prepare documentation and environment only as allowed before the event.

## Phase 0 — Inspect and verify prerequisites (0–10 min)
- Read all docs and inspect repository.
- Verify Python and Node runtimes.
- Verify Gemini API access.
- Verify exact Gemma 4 model ID and image input from official docs.
- Confirm which files already exist before creating anything.

**Gate:** environment/provider blockers are recorded.

## Phase 1 — Shared shell + backend contract (10–25 min)
- Build three-mode selector and shared input/results layout.
- Create FastAPI app and health route.
- Add mode enum, typed schemas, upload validation, safe error envelope.
- Add tests for health and validation.

**Gate:** three modes are visible; backend starts; tests pass.

## Phase 2 — Provider service and screenshot mode (25–45 min)
- Implement provider service with verified Gemma 4 configuration.
- Implement screenshot prompt/schema and actual image input.
- Run one real smoke test if credentials are ready.

**Gate:** screenshot mode is genuinely connected, or blocker documented.

## Phase 3 — Circuit mode (45–65 min)
- Add circuit-specific prompt/schema.
- Reuse image upload and provider service.
- Add uncertainty/safety language and tests.

**Gate:** circuit mode returns structured, appropriately qualified results.

## Phase 4 — Document mode (65–85 min)
- Add PDF/TXT extraction service.
- Add document prompt/schema and optional question.
- Add empty-text, size, truncation, and extraction warnings.
- Test with small fixtures.

**Gate:** supported text-based documents produce grounded results or a clear extraction limitation.

## Phase 5 — Integration and hardening (85–105 min)
- Connect frontend to mode-aware API.
- Test all UI states and each available mode.
- Check CORS, size limits, timeout, secret handling, and response validation.

**Gate:** each mode's status is honestly classified as working, partial, or unverified.

## Phase 6 — Demo and final checks (105–120 min)
- Prepare one safe sample asset per mode if permitted.
- Rehearse the three-mode story.
- Verify which paths use live Gemma 4.
- Label static fallback data explicitly.
- Check README and challenge submission requirements.

## Time-pressure rule
Keep the shared flow and at least one reliable live path working before polish. Do not fake provider results or silently substitute models. If three fully live modes are not achievable, preserve all three in the product shell and clearly disclose which modes are not yet live; prioritize the core challenge-compliant path with the team.
