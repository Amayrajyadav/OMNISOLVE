# OmniVerse AI — Antigravity Project Documentation

OmniVerse AI is a unified AI analysis workspace with three distinct modes:
1. **Screenshot Analysis** — analyze screenshots of code errors, terminal output, or software problems.
2. **Circuit Analysis** — analyze circuit diagrams/schematics and explain components, connections, likely faults, and debugging checks.
3. **Document Analysis** — summarize and explain uploaded documents, extract key points, answer questions grounded in the document, and flag uncertainty.

The product is **not DevLens AI** and must not be reduced to a code-debugging-only application.

## Read in order
1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/TRD.md`
4. `docs/DESIGN.md`
5. `docs/ARCHITECTURE.md`
6. `docs/API_CONTRACT.md`
7. `docs/TEST_PLAN.md`
8. `docs/BUILD_PLAN.md`
9. `docs/DECISIONS_AND_OPEN_QUESTIONS.md`
10. `docs/OFFICIAL_REFERENCES.md`

## Important challenge integration constraint
The Best Use of Gemma 4 challenge brief requires Gemma 4 through the Gemini API. Verify the exact supported model identifier and image-input capability in current official Google AI documentation before coding the provider integration. Do not guess the model ID. LM Studio may be used for local experimentation, but it is not the submission inference path unless organizers explicitly approve it.

## Status
These documents define the target product and acceptance criteria; they do not claim that code, API access, model calls, or tests already work.
