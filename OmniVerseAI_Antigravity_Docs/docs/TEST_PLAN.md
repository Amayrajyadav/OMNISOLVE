# Test Plan
## OmniVerse AI

## 1. General rules
Unit tests should run without a real Gemini API key by mocking provider calls. Real-provider tests must be separately identified and only reported as passed if run.

## 2. Shared validation
- Missing file rejected.
- Invalid mode rejected.
- Oversized file rejected before provider call.
- Unsupported file type rejected for selected mode.
- Invalid/corrupt image rejected.
- Overlong context/question rejected.
- Provider is not called for invalid inputs.
- API key/model configuration never appears in public health response or errors.

## 3. Screenshot mode
- Valid PNG and JPEG accepted.
- Provider receives actual image bytes and screenshot prompt.
- Valid structured response passes schema validation.
- Provider timeout/error mapped safely.
- Invalid model output does not produce fabricated success.
- Output distinguishes observed evidence from likely causes.

## 4. Circuit mode
- Valid circuit image accepted.
- Provider receives actual image bytes and circuit-specific prompt.
- Schema requires visible components, connections, possible issues, checks, safety notes, limitations.
- Unclear labels/connections can be reported as unclear.
- Output does not claim simulation or measurement.

## 5. Document mode
- TXT extraction returns expected text.
- PDF text extraction returns expected text for a text-based PDF fixture.
- Empty/scanned/unreadable PDF produces an explicit extraction warning or safe error.
- Extracted text cap is enforced and truncation disclosed.
- Optional question is passed with extracted content.
- Output includes summary/key points and source notes where supported.
- Document instructions are treated as untrusted content, not system instructions.

## 6. Frontend manual checks
- All three modes are visible/selectable.
- Mode change updates instructions and accepted types.
- Upload preview/filename behaves correctly.
- Loading, success, errors, retry, and reset work.
- Each mode renders the appropriate schema fields.
- Static sample output is visibly labeled.
- Responsive layout, keyboard navigation, and labels work.

## 7. End-to-end verification
For each mode claimed as working:
1. Start backend with valid credentials and verified model configuration.
2. Upload a non-sensitive test asset.
3. Confirm correct mode and content reach the backend.
4. Confirm real provider request uses the verified Gemma 4 model.
5. Confirm output schema validation.
6. Confirm frontend rendering.
7. Record latency and limitations.
If a mode was not tested end-to-end, label it partial/unverified.
