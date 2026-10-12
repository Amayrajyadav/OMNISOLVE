# Decisions and Open Questions
## OmniVerse AI

## Confirmed product decisions
- Product name: OmniVerse AI.
- Product shape: one workspace with three modes — Screenshot Analysis, Circuit Analysis, Document Analysis.
- This is not DevLens AI and must not be scoped to screenshot debugging alone.
- Frontend: React + TypeScript + Vite.
- Backend: FastAPI + Python.
- Backend owner: user; frontend owner: Ajay.
- Submission inference path for the Gemma challenge: Gemma 4 through Gemini API, unless organizers explicitly clarify otherwise.
- No database, account system, upload persistence, code execution, circuit simulation, or independent document fact-checking in MVP.
- Screenshot/circuit use image input; document mode extracts PDF/TXT text before analysis.

## Mandatory open questions
### Q1 — Exact Gemma 4 API model identifier and image support
Resolved: Verified from official Google AI documentation (https://ai.google.dev/gemma/docs and https://ai.google.dev/gemini-api/docs/models).
- Verified primary model identifier: `gemma-4-31b-it` (31B parameter dense multimodal model with native image understanding and agentic reasoning).
- Verified alternative model identifier: `gemma-4-26b-a4b-it` (26B MoE with 3.8B active parameters for low-latency inference).
- Image input supported: Yes, natively multimodal for text and image inputs.
- Python SDK: `google-genai` using `types.Part.from_bytes(data=image_bytes, mime_type=mime_type)`.

### Q2 — Gemini API key and quota
Status: Credentials not yet populated in local `.env` or system environment. Unit tests use mocked provider responses. Real provider requests require a valid `GEMINI_API_KEY`.

### Q3 — Python runtime
Resolved: Python 3.14.3 is installed and invoked via the Windows Python Launcher (`py`). All backend dependencies (FastAPI, Uvicorn, Pydantic, Pillow, PyMuPDF, google-genai, pytest, httpx) are verified installed and functional.

### Q4 — Document handling
Resolved: Document extraction implemented via `DocumentService` utilizing PyMuPDF (v1.28.2) for PDFs and safe UTF-8/Latin-1 decoding for TXT. Memory-safe page-by-page extraction is capped at MAX_DOCUMENT_CHARS (30,000 chars) with deterministic truncation disclosures. Blank/image-only PDFs and unextractable text are rejected with 400 DOCUMENT_TEXT_EMPTY; scanned PDF OCR is not supported in MVP.

### Q5 — Build-window rules
Confirm which preparation/build activities are allowed before the official hackathon window.

## Verified provider record
- Date checked: 2026-10-12
- Official documentation title/reference: Google AI for Developers — Gemma Models Overview (https://ai.google.dev/gemma/docs) & Gemini API Models (https://ai.google.dev/gemini-api/docs/models) & Image Understanding (https://ai.google.dev/gemini-api/docs/image-understanding)
- Verified model ID: `gemma-4-31b-it` (fallback: `gemma-4-26b-a4b-it`)
- Image input supported: Yes (PNG, JPEG via `types.Part.from_bytes`)
- SDK or REST interface: `google-genai` Python SDK (`client.models.generate_content`)
- Real smoke test performed: Blocked pending user configuration of `GEMINI_API_KEY` (automated tests fully covered via unit mocks)
- Observed result: Verified model specification and SDK parameters in local environment

## Status tracking
- Screenshot Analysis: Complete (Phase 2 backend implementation, prompt rules, schema parsing, and mocked tests)
- Circuit Analysis: Complete (Phase 3 backend implementation, safety guidelines, and dedicated tests)
- Document Analysis: Complete (Phase 4 backend implementation, PyMuPDF extraction, truncation disclosures, and grounding prompt)
- Integration & End-to-End Hardening: Complete (Phase 5 cross-mode verification, E2E regression suite with 104 passing tests, CORS preflight/origin handling, and frontend contract handoff in docs/FRONTEND_INTEGRATION.md)
- Live Model Call: Unverified pending real `GEMINI_API_KEY` configuration (all mock-based E2E & unit tests pass deterministically)

## Phase 5 Integration & Hardening Decisions
- Cross-Mode Validation: Unified `POST /api/analyze` dispatches deterministically across `screenshot`, `circuit`, and `document` modes without cross-contamination.
- Frontend Contract: Delivered complete frontend integration guide in `docs/FRONTEND_INTEGRATION.md` for Ajay with TypeScript client code, FormData handling, error code definitions, and zero API key leakage.
- CORS Configuration: Explicitly bounded to `CORS_ORIGINS` (default `http://localhost:5173`, `http://127.0.0.1:5173`). No open wildcard `*` allowed in production mode.
- Regression Coverage: 104 tests passing across 7 test suites covering schema validation, upload restrictions, mode dispatch, health checks, error isolation, and CORS preflights.
