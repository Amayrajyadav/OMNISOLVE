# Technical Requirements Document (TRD)
## OmniVerse AI

**Status:** Proposed implementation constraints. Inspect existing workspace before creating files.

## 1. Stack
- Frontend: React + TypeScript + Vite.
- Backend: Python 3.12.x + FastAPI + Uvicorn.
- Validation: Pydantic.
- Image validation: Pillow.
- PDF text extraction: PyMuPDF (`fitz`) or another documented and tested library; choose one after checking the environment.
- Provider: official Google Gemini API SDK or documented REST API using a verified Gemma 4 model that supports image input.
- Tests: pytest, HTTPX/FastAPI test client as compatible with installed versions.
- Configuration: environment variables, with `.env` for local development only.

## 2. Configuration
- `GEMINI_API_KEY`: server-only secret.
- `GEMINI_MODEL`: exact model ID verified from official docs; do not guess.
- `MAX_UPLOAD_MB`: initial proposal 8 MB.
- `REQUEST_TIMEOUT_SECONDS`: initial proposal 45 seconds.
- `CORS_ORIGINS`: comma-separated explicit allowed frontend origins.
- Optional `MAX_DOCUMENT_CHARS`: cap extracted text sent to model; choose a sensible value and document truncation behavior.

## 3. Supported uploads (MVP)
- Screenshot Analysis: PNG, JPG, JPEG.
- Circuit Analysis: PNG, JPG, JPEG.
- Document Analysis: PDF, TXT.
- DOCX and scanned-PDF OCR are optional future additions, not assumed supported.
- Backend validates both declared content type and actual bytes/content.
- Enforce upload size before reading entire file into memory where feasible.

## 4. Backend API
- `GET /api/health`
- `POST /api/analyze` with multipart fields:
  - `mode`: `screenshot` | `circuit` | `document`
  - `file`: required upload
  - `context`: optional string (for screenshot/circuit context)
  - `question`: optional string (primarily for document Q&A)
- Return a mode-specific typed response. The canonical envelope may include `mode`, `result`, and `warnings`; define and test it in `API_CONTRACT.md`.
- Do not put provider calls directly inside route handlers.
- Use separate mode-specific prompt modules and response schemas or discriminated models.
- Use a document extraction service for PDF/TXT; pass extracted text to the model rather than assuming PDF binary input support.
- For image modes, send actual image bytes as image input to the verified model.
- Do not call the provider for invalid uploads.

## 5. Suggested backend layout
```text
backend/
  app/
    main.py
    config.py
    schemas.py
    api/
      routes.py
    services/
      gemini_service.py
      document_service.py
    prompts/
      screenshot.py
      circuit.py
      document.py
  tests/
    test_health.py
    test_upload_validation.py
    test_schemas.py
    test_document_extraction.py
    test_analyze_modes.py
  requirements.txt
  .env.example
  .gitignore
```
Adapt to existing structure after inspection; this is a target layout, not a reason to overwrite working files.

## 6. Provider verification gate
Before provider implementation:
1. Verify exact Gemma 4 model ID in current official Google AI documentation.
2. Verify image input for the selected API/model.
3. Verify SDK or REST request format and response parsing.
4. Record model ID, source, and date in `DECISIONS_AND_OPEN_QUESTIONS.md`.
5. Keep model ID configurable.
6. Perform a real request only when valid credentials are configured.
If verification fails, report the blocker. Do not silently substitute another model.

## 7. Security and reliability
- API key never enters frontend code.
- `.env` ignored by Git; `.env.example` has placeholders only.
- No uploaded files persisted after request.
- No raw file contents, screenshots, extracted document text, keys, or full provider payloads in logs.
- Validate upload size, content, and mode.
- Apply request timeout and safe error mapping.
- Explicit CORS origins; no wildcard with credentials.
- Treat uploaded content as untrusted data; instructions embedded in a screenshot/document must not override the system analysis task.
- Bound extracted document text and report when truncation occurs.
- Do not execute code, simulate circuits, or claim independent verification.

## 8. Dependency discipline
Keep the dependency list minimal. Add document extraction dependencies only for implemented features. Check compatibility before pinning/upgrading packages. Tests should mock provider calls and run without a real API key.
