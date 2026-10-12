# Product Requirements Document (PRD)
## OmniVerse AI — Unified Analysis Workspace

**Status:** Target specification; implementation not yet verified  
**Primary challenge target:** Best Use of Gemma 4  
**Prototype timebox:** 120 minutes

## 1. Product summary
OmniVerse AI gives a user one interface with three analysis modes: screenshot analysis, circuit analysis, and document analysis. The user chooses a mode, provides the relevant image or document, and receives a structured, mode-specific report from an AI-assisted workflow.

The product should feel like one coherent workspace, not three unrelated apps. The mode selector, upload interaction, progress state, result layout, error handling, and visual design should be shared where sensible, while each mode has its own prompt, validation, and output sections.

## 2. Primary user stories
- **Screenshot Analysis:** As a developer, I want to upload a screenshot of an error or software issue and receive a grounded explanation and next debugging steps.
- **Circuit Analysis:** As an electronics student or engineer, I want to upload a circuit diagram and receive an explanation of visible components and connections, possible issues, and checks to perform.
- **Document Analysis:** As a student or professional, I want to upload a document and receive a concise summary, key points, explanations, and answers to questions grounded in that document.

## 3. Problem
Useful technical context is often trapped in different formats: screenshots, circuit diagrams, and long documents. Users must switch tools or manually interpret each format. OmniVerse AI brings these common analysis tasks into one simple interface while clearly communicating uncertainty and source limitations.

## 4. Product goals
- Provide three visible and selectable analysis modes.
- Make the purpose of each mode understandable immediately.
- Use Gemma 4 meaningfully in the analysis workflow through the Gemini API, subject to official challenge requirements.
- Deliver one coherent end-to-end flow for each mode where feasible within the timebox.
- Return structured results rather than a single unformatted paragraph.
- Never pretend that analysis is simulation, execution, measurement, or independent fact verification.

## 5. Functional requirements
### FR-1: Mode selection
The landing/workspace screen must show three modes:
- Screenshot Analysis
- Circuit Analysis
- Document Analysis

Each mode has a short description and its own upload instructions. Selecting a mode updates accepted file types, helper text, and result sections.

### FR-2: Screenshot Analysis
Accept PNG/JPEG screenshots of code, terminal output, error dialogs, or software issues. Return:
- issue/error category
- concise summary
- visible evidence
- likely causes with rationale and qualitative confidence
- ordered debugging steps
- verification steps
- limitations

### FR-3: Circuit Analysis
Accept PNG/JPEG circuit diagrams or schematics. Return:
- high-level circuit description
- visible components and labels
- visible connections/topology, with ambiguity called out
- possible issues or suspicious areas, only when evidence supports them
- suggested checks or next steps
- safety notes and limitations

The model must not claim to have simulated the circuit or verified electrical behavior. If the image is illegible or incomplete, request a clearer image or additional context.

### FR-4: Document Analysis
Accept PDF and TXT for the MVP; DOCX may be added only if it fits the timebox and is tested. Extract text server-side from supported documents before analysis. Return:
- document title/type if detectable
- executive summary
- key points
- important terms/entities or figures, when supported
- limitations or extraction warnings
- optional answer to a user-provided question, grounded in extracted text

For MVP, do not promise full OCR for scanned PDFs. If extraction yields insufficient text, explain the limitation rather than inventing a summary.

### FR-5: Shared workflow
- Show selected mode and accepted formats.
- Allow upload and optional context/question.
- Show filename/preview where applicable.
- Show loading, success, validation error, provider error, and reset states.
- Display mode-specific structured output.

### FR-6: Privacy and trust
- Warn users not to upload secrets, credentials, personal data, or confidential material.
- Do not persist uploaded files in the MVP.
- Do not log uploaded content or API keys.
- Clearly distinguish live AI results from any static sample data.

## 6. Non-goals
- Code execution or automatic patching.
- Circuit simulation, electrical measurements, or safety certification.
- Guaranteed OCR of every scanned document.
- Accounts, saved history, database, team collaboration, IDE/EDA plugins, billing, or autonomous agents.
- Broad web research or external fact-checking of document claims.
- Multiple model providers in the submission path.

## 7. Success criteria
- Three modes are visible and selectable.
- Each mode has a documented request and response schema.
- Invalid files are rejected with useful errors.
- Model output is validated before being shown.
- At least one end-to-end live model flow is verified; all other modes must be accurately described as working, partial, or not yet verified.
- A prepared demo demonstrates the product's three-mode concept quickly.
- The README reports exact implementation/test status without exaggeration.

## 8. Priorities
**P0:** shared app shell, three-mode selector, backend health, mode-aware API contract, upload validation, provider abstraction, typed results, safe errors.  
**P1:** working screenshot analysis and circuit image analysis; text extraction and document analysis; responsive UI and demo samples.  
**P2:** DOCX, OCR for scanned PDFs, history, simulation, code execution, integrations — not part of the baseline MVP.
