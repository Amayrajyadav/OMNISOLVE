# Architecture
## OmniVerse AI

## 1. System overview
```text
React + TypeScript + Vite
  ├── Mode selector: screenshot | circuit | document
  ├── Shared upload/context/question controls
  ├── Mode-aware loading/error/result states
  └── Structured report renderer
                 |
                 | multipart/form-data
                 v
FastAPI
  ├── Request/mode validation
  ├── Upload validation and limits
  ├── Screenshot image handling
  ├── Circuit image handling
  ├── PDF/TXT extraction
  ├── Mode-specific prompt + response schema
  └── Provider service
                 |
                 v
Verified Gemma 4 through Gemini API
```

## 2. Shared architecture
- Frontend handles input collection and rendering only.
- FastAPI owns validation, mode routing, file processing, provider calls, and safe error mapping.
- A provider service owns the Gemini API request and response extraction.
- Separate prompts and schemas keep each mode's behavior distinct.
- Document extraction occurs server-side before model analysis.
- No database or persistent file storage in the MVP.

## 3. Request flow
1. User selects one of three modes.
2. User uploads an image or document and optionally enters context/question.
3. Backend validates mode, content, file size, and file bytes.
4. For screenshot/circuit, backend supplies the actual image as image input to the verified model.
5. For document mode, backend extracts text from PDF/TXT, enforces a character limit, and supplies the extracted text with the document-analysis prompt.
6. Provider output is parsed and validated against the mode-specific schema.
7. Backend returns a typed envelope.
8. Frontend renders mode-specific sections and warnings.

## 4. Mode boundaries
- `screenshot`: software/debugging guidance; no execution.
- `circuit`: diagram interpretation and suggested checks; no simulation or measurement.
- `document`: extraction-grounded summary/Q&A; no external fact-checking.

## 5. Error boundaries
- `400`: invalid image/document or malformed request.
- `413`: file too large.
- `415`: unsupported media type.
- `422`: invalid mode or field validation.
- `502`: provider failure or invalid provider output.
- `504`: provider timeout.
- `500`: unexpected error with generic public message.

## 6. Data lifecycle
Uploaded files and extracted text exist only for request processing. Do not write them to disk unless a future requirement explicitly approves it. Avoid logging file contents or provider payloads. Dispose of in-memory references after the response where practical.

## 7. Limitations
Image understanding can miss small labels and ambiguous wire junctions. PDF text extraction may not capture scanned pages, figures, tables, or layout faithfully. Every mode must communicate these limitations in the result.
