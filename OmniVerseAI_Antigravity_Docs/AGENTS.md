# OmniVerse AI — Persistent Agent Instructions

These instructions are binding for all implementation work.

## Product identity and scope
OmniVerse AI is a unified AI analysis workspace with exactly three primary modes:
1. Screenshot Analysis
2. Circuit Analysis
3. Document Analysis

Do not rename the product to DevLens AI. Do not collapse the product into a screenshot-only debugging tool. Do not add unrelated modes without explicit approval.

## Required reading
Before changing files, read `README.md` and every document under `docs/`. Inspect the actual workspace and existing code before creating, replacing, or deleting anything.

## Anti-hallucination rules
- Never claim a command, build, test, API call, model integration, or UI flow succeeded unless it was actually run and the result observed.
- Never invent model IDs, SDK methods, environment variables, provider capabilities, or event rules.
- Verify the exact currently supported Gemma 4 Gemini API model identifier and image-input support from official Google AI documentation before implementation. Keep it configurable through `GEMINI_MODEL`.
- Do not silently switch to another model family, Gemini Flash, or LM Studio for the submission path.
- If a required detail is unknown, list it as unresolved and stop at the relevant gate instead of guessing.
- Never fabricate an analysis result when the provider is unavailable. Static sample output is permitted only when clearly labeled as demo/sample data, never as a live result.
- Separate visible evidence from inference. Explain uncertainty and limitations.
- Never claim code was executed, a circuit was electrically simulated, a component was measured, or a document fact was verified externally unless that operation actually occurred.

## Mode-specific grounding
### Screenshot Analysis
- Describe only what is visible in the screenshot as observed evidence.
- Likely causes and fixes must be labeled as hypotheses/recommendations.
- Do not claim to inspect local files or execute code.

### Circuit Analysis
- Identify visible components/connections only when legible.
- If component values, pin labels, polarity, wire junctions, or topology are unclear, explicitly say so.
- Do not claim electrical simulation, measurements, PCB validation, or safety certification.
- Present suggested tests as checks for a qualified user to perform; high-voltage or mains circuits require safety warnings.

### Document Analysis
- Ground summaries and answers in extracted document content.
- When feasible, cite page number or section for extracted facts.
- Distinguish document statements from model interpretation.
- If text extraction is incomplete, scanned, or unreadable, disclose that limitation. Do not invent missing content.

## Implementation discipline
- Work in small phases and summarize intended changes before each phase.
- Preserve existing working code; do not overwrite/delete without inspection and explanation.
- Keep provider logic, prompts, schemas, and routes modular.
- Validate uploads on the backend; never trust filename or MIME type alone.
- Keep secrets server-side. Never expose API keys to frontend, logs, Git, screenshots, or sample fixtures.
- Do not persist uploads in the MVP.
- Use explicit CORS origins, upload limits, timeouts, typed schemas, and safe errors.
- Keep dependencies minimal and test behavior with mocked provider calls.
- Do not execute code supplied in a screenshot or document.

## Required workflow
1. State files to change and expected behavior.
2. Implement only the requested phase.
3. Run relevant checks and report exact commands/results.
4. Clearly state what was not tested.
5. Stop for approval at external credential or unresolved product/provider decisions.

## Definition of done
Generated code is not proof of a working feature. A feature is done only when its acceptance criteria pass and limitations are honestly documented.
