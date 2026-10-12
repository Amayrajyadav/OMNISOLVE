# OmniSolve AI — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Product:** OmniSolve AI  
**Author / Frontend Lead:** Frontend Team  
**Backend & AI Lead:** Amay Raj  

---

## 1. Product Summary

### 1.1 Overview
**OmniSolve AI** is an intelligent, multimodal technical workspace engineered to assist engineering students, software developers, and electronics learners in diagnosing, analyzing, and resolving technical problems. Rather than functioning as a standard conversational chatbot, OmniSolve AI is structured around real-world technical artifacts: error screenshots, source code files, circuit schematics, simulation captures, and engineering documentation/PDFs.

### 1.2 Core Problem Solved
Technical problem solving in engineering and development disciplines is fundamentally multimodal:
- Developers deal with stack traces, compiler outputs, terminal logs, and IDE screenshots.
- Electronics engineers work with schematic diagrams, breadboard photos, component pinouts, and waveforms.
- Students digest dense lab manuals, component datasheets, and specification documents.

Standard generic LLM chat windows lack the dedicated workspace UX required for these workflows. Users are forced to paste fragments of code or text, losing visual and structural context, or juggle multiple single-purpose tools. OmniSolve AI brings these three disciplines into one cohesive, purpose-built technical assistant.

### 1.3 Key Differentiators vs. Basic Chatbots
1. **Artifact-First Workflow:** The interaction begins with technical input (schematic, error capture, log, manual) rather than an empty query box.
2. **Specialized Diagnostic Analysis Modes:** Specific structured diagnostics (Root Cause, Component Topology, Diagnostic Steps, Uncertainties) tailored to the technical discipline.
3. **Explicit Uncertainty & Limitation Disclosures:** The system strictly flags unverified assumptions, ambiguous traces, and unmeasured component ratings, preventing dangerous overconfidence in physical circuits and production code.
4. **Context-Locked Follow-up Workspace:** Retains the uploaded file and analytical findings alongside a contextual technical chat, enabling deep dive inquiries without re-uploading or losing state.

---

## 2. Problem Statement

### 2.1 Developer & Programming Difficulties
- Compiler errors and runtime exceptions often produce cryptic logs that overwhelm beginners.
- Visual bugs, IDE notifications, and terminal outputs often require manual transcription unless screenshot analysis is supported.
- Generic AI chatbots frequently hallucinate fixes without explaining the underlying mechanism or providing progressive verification steps.

### 2.2 Electronics & ECE Difficulties
- Reading circuit schematics requires component recognition, polarity tracking, and functional block understanding.
- Breadboard wiring errors, incorrect pull-up/pull-down resistor values, floating pins, and power rail mistakes cause silent hardware failures.
- Learners lack instant feedback when verifying circuit simulations or schematics prior to applying power in the lab.

### 2.3 Technical Document & Lab Manual Difficulties
- Academic lab manuals, standard datasheets, and technical manuals are lengthy, dense, and full of mathematical formulas.
- Students preparing for lab examinations (viva voce) or debugging lab equipment spend excessive time hunting for core definitions and procedural steps.

### 2.4 Unified Solution
OmniSolve AI unifies these disparate workflows through a streamlined process:
$$\text{UPLOAD} \longrightarrow \text{ANALYZE} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{ASK QUESTIONS} \longrightarrow \text{EXPLORE SOLUTIONS}$$

---

## 3. Target Users

1. **Computer Science & Programming Students:** Seeking clear explanations of runtime crashes, compiler errors, algorithm bugs, and syntax issues with step-by-step resolution guidance.
2. **Software Engineers & Developers:** Requiring rapid triage of stack traces, log dumps, and code snippets during development and testing.
3. **Electronics & Communication Engineering (ECE/EEE) Students:** Needing component identification, functional verification, and safety checks on circuit schematics and lab setups.
4. **Hardware Makers & IoT Prototypers:** Verifying sensor hookups, pin configurations, and power rails on microcontroller schematics.
5. **Technical Learners & Researchers:** Reviewing technical whitepapers, textbook chapters, and lab manuals to extract formulas, summaries, and viva questions.

---

## 4. Product Goals

### 4.1 Measurable Product Objectives
- **Zero-Friction File Ingestion:** Users can drag and drop or browse supported files in under 3 seconds.
- **Accurate Mode Validation:** Automated file type and extension checks prevent incompatible file submissions prior to network transfer.
- **Structured Diagnostic Delivery:** Structured presentation separating Summary, Findings, Root Cause / Function, Solution, Steps, and Uncertainties.
- **Persistent Contextual Chat:** Users can ask unlimited follow-up questions linked to the current uploaded artifact session.
- **Transparent AI Boundaries:** Every analysis item clearly marks caveats and unverified assumptions.
- **Responsive Workspace:** Consistent performance and readability across desktop (min 1280px), tablet (768px - 1024px), and mobile devices (<768px).

---

## 5. Core Features

### 5.1 Main Dashboard
- High-level overview of OmniSolve capabilities.
- Analysis mode cards with clear badges, accepted formats, and feature highlights.
- Unified drop zone accepting files for immediate processing or staged configuration.
- Quick-start sample prompts to demonstrate domain capabilities.

### 5.2 Analysis Mode Selection
- **Code Debugger (`code_debugger`):** Optimized for stack traces, error screenshots, source files (`.py`, `.js`, `.ts`, `.cpp`, etc.), and log dumps.
- **Circuit Analyzer (`circuit_analyzer`):** Optimized for schematics, EDA exports, breadboard photos, and simulation captures.
- **Document Explainer (`document_explainer`):** Optimized for PDF manuals, lecture notes, datasheets, and technical text files.

### 5.3 Drag-and-Drop File Upload & Validation
- Interactive drop zone with visual drag states.
- Client-side MIME type and extension validation against active mode constraints.
- Configurable maximum file size enforcement (default 15MB).
- Instant, non-blocking warning banners on invalid files with remedial instructions.

### 5.4 File Previews & Metadata Inspection
- High-fidelity image preview with zoom/pan indicators for schematics and screenshots.
- Clean document/code card display with file size, extension badge, line counts (text files), and name.
- Safe cleanup of browser `URL.createObjectURL` references upon file removal or workspace reset.

### 5.5 Structured Analysis Display
- **Code Mode:** Error Summary, Likely Cause, Suggested Fix (with syntax-highlighted code block), Debugging Steps, Uncertainties.
- **Circuit Mode:** Identified Components, Apparent Circuit Function, Potential Issues, Verification Checklist, Uncertainties.
- **Document Mode:** Executive Summary, Key Concepts, Formulas/Definitions, Key Questions & Answers, Uncertainties.
- One-click copy for explanations, code snippets, and structured reports.

### 5.6 Contextual AI Chat Panel
- Dedicated chat stream docked alongside the analysis workspace.
- Preserves context of the analyzed file and preliminary findings.
- Suggested prompt pills based on the active mode (e.g., "Explain line 14", "What if Vcc is 3.3V?", "Generate viva questions").
- Multi-line autosizing textarea with `Enter` to submit and `Shift+Enter` for linebreaks.
- Assistant typing indicators and clear user message bubbles.

### 5.7 Resilience, Loading & Error States
- Multi-phase loading indicator (Uploading $\rightarrow$ Parsing $\rightarrow$ Model Inference).
- Comprehensive error boundary handling network disconnects, model timeout, unsupported payloads, and server errors.
- Retry trigger preserving uploaded state without forcing re-upload.

---

## 6. User Stories

- **US-01 (Code Debugging):** As a student debugging a Python script, I want to upload a screenshot of my terminal traceback so that I can immediately see the likely cause, the fixed code snippet, and why the error occurred.
- **US-02 (Circuit Inspection):** As an ECE student, I want to upload a schematic diagram of an op-amp amplifier so that I can verify pin connections, identify component values, and check for missing feedback resistors.
- **US-03 (Document Understanding):** As an engineering student, I want to upload a 5-page lab experiment manual so that I can extract the primary formulas and prepare for oral viva questions.
- **US-04 (Contextual Deep Dive):** As a user reviewing an analysis, I want to ask follow-up questions in a side panel without re-uploading the file or losing my view of the analysis results.
- **US-05 (Safety & Limitation Awareness):** As an electronics hobbyist, I want the AI to explicitly state when a component value or pin label is unreadable so that I do not short-circuit my physical board.

---

## 7. Functional Requirements

| Req ID | Title | Description | MVP Priority |
| :--- | :--- | :--- | :--- |
| **FR-001** | Mode Switching | User can select between Code Debugger, Circuit Analyzer, and Document Explainer. Changing mode updates accepted file types. | **Must Have** |
| **FR-002** | File Drop & Browse | User can drag-and-drop or use the system file dialog to select a file. | **Must Have** |
| **FR-003** | Format & Size Validation | Client-side validation against allowed extensions and size limit (15MB). Show descriptive error if invalid. | **Must Have** |
| **FR-004** | File Preview | Render high-resolution image preview for images and metadata badge for documents/code. | **Must Have** |
| **FR-005** | Analysis Submission | Submit `multipart/form-data` payload containing file, mode, and optional user question to backend. | **Must Have** |
| **FR-006** | Structured Results | Render response in specialized cards (Summary, Findings, Solution, Steps, Uncertainties). | **Must Have** |
| **FR-007** | Copy to Clipboard | One-click copy button for solution code snippets and full analysis reports. | **Must Have** |
| **FR-008** | Contextual Chat | Interactive chat window linked to the uploaded artifact session. Allows follow-up queries. | **Must Have** |
| **FR-009** | Suggested Follow-ups | Provide contextual starter prompts in chat when conversation is initialized. | **Must Have** |
| **FR-010** | Analysis Reset | "New Analysis" action clears state, releases object URLs, and returns to pristine dashboard. | **Must Have** |
| **FR-011** | Backend Health Check | Poll/check backend health (`/api/health`) and indicate online/offline status in the header. | **Must Have** |
| **FR-012** | Mock Fallback Mode | When backend is unreachable during frontend development, offer a test mode with mock fixtures. | **Must Have** |

---

## 8. Non-Functional Requirements

- **NFR-01 (Performance):** Client-side validation and file preview must render in $< 100\text{ms}$. Smooth UI transitions at 60fps.
- **NFR-02 (Accessibility - A11y):** Keyboard navigable buttons, visible focus outlines, high contrast dark theme ratios ($\ge 4.5:1$ for normal text), ARIA attributes on modals and alert regions.
- **NFR-03 (Privacy & Security):** Files are held strictly in memory in the client and transmitted over HTTPS/HTTP API directly. No client-side telemetry or local storage leakage of sensitive code/documents.
- **NFR-04 (Error Handling & Robustness):** Graceful recovery from network timeouts, 500 server errors, and aborted requests. Actionable error messages displayed to the user.
- **NFR-05 (Responsiveness):** Seamlessly scale from mobile phone viewports (375px) up to ultra-wide desktop monitors (2560px).
- **NFR-06 (Clarity of AI Limitations):** Prominent visual disclaimers stating that all code fixes and circuit evaluations are AI-generated suggestions requiring human verification.

---

## 9. MVP Scope vs. Future Roadmap

### MVP Scope (In-Scope for Current Release)
- Full React 18 + Vite + TypeScript web application with Tailwind CSS.
- Complete 3-mode selection and validation system.
- Drag-and-drop upload with image preview and file removal.
- Structured presentation for Code, Circuit, and Document modes.
- Contextual chat interface associated with current file and analysis.
- Copy functionality, sample prompt pre-filling, and workspace reset.
- API service integration with `/api/analyze`, `/api/chat`, and `/api/health`.
- Isolated development mock adapter when backend server is offline.

### Post-MVP Roadmap (Out-of-Scope)
- User authentication, multi-tenant accounts, and team workspaces.
- Cloud database storage of past analyses and chat transcripts.
- Multi-file batch uploads.
- Real-time hardware in-the-loop simulation or live code execution sandbox.
- Automated fine-tuning or custom model weight downloads.

---

## 10. Acceptance Criteria

1. **Dashboard & Navigation:** User sees OmniSolve AI branding, health status indicator, mode selector, and active upload zone.
2. **File Ingestion:** Dragging an invalid file (e.g. `.exe`) displays a clear error badge. Uploading an allowed file shows the preview and activates the "Analyze" button.
3. **Analysis Processing:** Clicking "Analyze" transitions into loading state, sends the request to the API, and renders the structured cards upon completion.
4. **Result Inspection:** Result displays summary, findings, solution/function, actionable steps, and uncertainties. Code blocks are copyable.
5. **Contextual Chat:** Sending a question appends user message, triggers assistant loading indicator, and renders assistant response tied to the file.
6. **Workspace Reset:** Clicking "New Analysis" resets state and returns to dashboard cleanly.
7. **Responsive Layout:** On mobile, chat and analysis stack cleanly without horizontal scrollbars.
