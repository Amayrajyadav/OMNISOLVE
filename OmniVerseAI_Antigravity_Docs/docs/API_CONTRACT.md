# API Contract
## OmniVerse AI

## `GET /api/health`
Success `200`:
```json
{"status":"ok","service":"omnisolve-ai"}
```
This proves only that the backend process responds; it does not prove Gemini credentials/model access.

## `POST /api/analyze`
Content type: `multipart/form-data`.

Fields:
- `mode` (required): `screenshot`, `circuit`, or `document`
- `file` (required): image or document, depending on mode
- `context` (optional): short extra context for screenshot/circuit; maximum proposed 1,000 characters
- `question` (optional): question about the document; maximum proposed 1,000 characters

### Response envelope
All successful responses use:
```json
{
  "mode": "screenshot",
  "result": {},
  "warnings": []
}
```
The `result` object is mode-specific. Frontend must branch on `mode` and validate/render the documented fields, not parse a free-form paragraph.

### Screenshot result example (schema illustration only)
```json
{
  "mode": "screenshot",
  "result": {
    "issue_type": "ImportError",
    "summary": "The screenshot appears to show a Python import failure.",
    "observed_evidence": ["The visible traceback ends with an import-related error."],
    "likely_causes": [
      {"cause": "The package may be missing from the active environment.", "rationale": "The displayed error names an import failure.", "confidence": "medium"}
    ],
    "debugging_steps": ["Check the active interpreter and environment.", "Check package installation in that environment."],
    "verification_steps": ["Rerun the original command in the same environment."],
    "confidence": "medium",
    "limitations": ["The screenshot does not establish the active environment."]
  },
  "warnings": []
}
```

### Circuit result fields
- `overview`: string
- `visible_components`: array of `{name, visible_label, notes}`
- `connections`: array of strings
- `possible_issues`: array of `{issue, evidence, confidence}`
- `suggested_checks`: array of strings
- `safety_notes`: array of strings
- `limitations`: array of strings

If a component or connection cannot be read reliably, mark it as unclear rather than guessing.

### Document result fields
- `document_title`: string or null
- `summary`: string
- `key_points`: array of strings
- `important_terms`: array of `{term, explanation}`
- `answer`: string or null
- `source_notes`: array of strings (page/section references when extraction supports them)
- `warnings`: array of strings
- `limitations`: array of strings

### Error envelope
```json
{"detail":{"code":"UNSUPPORTED_FILE","message":"This file type is not supported for the selected mode."}}
```
Suggested codes: `INVALID_FILE`, `UNSUPPORTED_FILE`, `FILE_TOO_LARGE`, `CONTEXT_TOO_LONG`, `QUESTION_TOO_LONG`, `DOCUMENT_TEXT_EMPTY`, `MODEL_TIMEOUT`, `MODEL_UNAVAILABLE`, `MODEL_OUTPUT_INVALID`, `INTERNAL_ERROR`.

Never return stack traces, raw provider payloads, API keys, file contents, or extracted document text in error messages.

## Contract rules
- All fields must be typed and validated using Pydantic.
- Limit array sizes and string lengths where practical.
- Confidence values are qualitative: `low`, `medium`, `high`.
- Example values are illustrations, not guaranteed model output.
