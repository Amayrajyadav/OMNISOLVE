# OmniSolve AI — Frontend Application

OmniSolve AI is an intelligent, multimodal technical assistant engineered to help students, developers, and electronics learners troubleshoot technical problems by analyzing uploaded files.

## Project Structure

```
omnisolve-ai/
├── PRD.md                    # Complete Product Requirements Document
├── TRD.md                    # Technical Requirements Document & Backend API Contract
├── design.md                 # UI/UX Specification & Design Tokens
├── .env.example              # Environment variables template
├── package.json              # Project dependencies and scripts
├── vite.config.ts            # Vite + React + Tailwind v4 build setup
└── src/
    ├── types/                # TypeScript interfaces (Analysis, Chat, Health)
    ├── config/               # Supported file formats and mode constraints
    ├── utils/                # Client-side file validation & formatting
    ├── services/             # API service layer (Fetch) & Mock fallback
    ├── hooks/                # useAnalysis, useChat, useBackendHealth hooks
    ├── components/
    │   ├── layout/           # AppHeader with connectivity status pill
    │   ├── dashboard/        # ModeSelectorCards, SamplePrompts
    │   ├── upload/           # FileUploadZone, FilePreviewCard, FileValidationError
    │   ├── analysis/         # AnalysisWorkspace, CodeResultView, CircuitResultView, DocumentResultView
    │   └── chat/             # ContextualChatPanel with pinned file session
    ├── App.tsx               # Root component & state orchestrator
    └── index.css             # Tailwind v4 theme tokens & styles
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 2. Installation
Navigate to the project root and install dependencies:

```bash
cd /Users/ajaykowkuntla/.gemini/antigravity-ide/scratch/omnisolve-ai
npm install
```

### 3. Environment Setup
Copy the example environment configuration:

```bash
cp .env.example .env
```

Ensure `VITE_API_BASE_URL` points to your backend instance:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Running the Development Server
Launch the Vite development server:

```bash
npm run dev
```

The application will be live at `http://127.0.0.1:5173/` or `http://localhost:5173/`.

### 5. Building for Production
To generate an optimized production bundle:

```bash
npm run build
```

---

## Features & Modes

1. **Code Debugger (`code_debugger`)**:
   - Ingests stack trace screenshots, terminal logs, and source files (`.py`, `.js`, `.ts`, `.cpp`, `.log`).
   - Produces root-cause explanations, formatted solution code with one-click copy, and verification steps.

2. **Circuit Analyzer (`circuit_analyzer`)**:
   - Ingests schematic captures, breadboard photos, and simulation exports.
   - Identifies component designations and pinouts, detects floating reset lines and missing passives, and highlights lab safety warnings.

3. **Document Explainer (`document_explainer`)**:
   - Ingests PDF lab manuals, datasheets, and lecture notes.
   - Extracts mathematical formulas, summaries, and high-yield viva voce examination questions.

4. **Contextual AI Chat**:
   - Automatically pinned to the analyzed file session.
   - Allows users to ask follow-up questions without re-uploading the file.
