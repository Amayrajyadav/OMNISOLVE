# OmniSolve Frontend Integration Guide
**For Frontend Owner: Ajay**

This guide provides the complete integration specification for connecting the React + Vite frontend to the OmniSolve FastAPI backend.

---

## 1. Backend Service Configuration
- **Local Development URL:** `http://127.0.0.1:8000` (or `http://localhost:8000`)
- **Interactive OpenAPI Documentation:** `http://127.0.0.1:8000/docs`
- **Health Verification Endpoint:** `GET http://127.0.0.1:8000/api/health`

### Health Check Response
```http
GET /api/health HTTP/1.1
Host: 127.0.0.1:8000
```
```json
{
  "status": "ok",
  "service": "omnisolve-ai"
}
```

---

## 2. Primary Analysis Endpoint
- **URL:** `http://127.0.0.1:8000/api/analyze`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data` *(Important: Let the browser set this automatically with the boundary! Do NOT manually set `Content-Type: multipart/form-data` in your headers.)*

### Form Data Fields

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `mode` | `string` | **Yes** | Analysis mode: `"screenshot"`, `"circuit"`, or `"document"`. |
| `file` | `File / Blob` | **Yes** | Uploaded file binary. Max upload size is **8 MB**. |
| `context` | `string` | No | Supplementary context (environment, operating voltage, etc.). Max **1,000 chars**. |
| `question` | `string` | No | Specific question (especially for document Q&A or circuit queries). Max **1,000 chars**. |

### Supported File Formats by Mode

| Mode | Allowed File Formats | File Extensions | Rejected Types |
| :--- | :--- | :--- | :--- |
| **`screenshot`** | PNG, JPEG | `.png`, `.jpg`, `.jpeg` | PDF, TXT, WEBP, GIF, etc. (returns 415) |
| **`circuit`** | PNG, JPEG | `.png`, `.jpg`, `.jpeg` | PDF, TXT, WEBP, GIF, etc. (returns 415) |
| **`document`** | PDF, Plain Text | `.pdf`, `.txt` | Images, DOCX, ZIP, etc. (returns 415) |

---

## 3. Response Structure

All successful responses (HTTP 200) wrap the result in a standard envelope:
```typescript
interface AnalysisEnvelope<T> {
  mode: "screenshot" | "circuit" | "document";
  result: T;
  warnings: string[];
}
```

### A. Screenshot Analysis Schema (`mode === "screenshot"`)
```typescript
interface LikelyCause {
  cause: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
}

interface ScreenshotResult {
  issue_type: string;            // e.g., "ImportError", "SyntaxError", "HTTP 500"
  summary: string;               // High-level description of what occurred
  observed_evidence: string[];   // Visible lines, tracebacks, UI elements
  likely_causes: LikelyCause[];  // Hypothesized root causes with rationale
  debugging_steps: string[];     // Ordered actionable troubleshooting steps
  verification_steps: string[];  // How to verify whether the fix succeeded
  confidence: "low" | "medium" | "high";
  limitations: string[];         // Missing context, obscured code lines
}
```

#### Example Screenshot Response:
```json
{
  "mode": "screenshot",
  "result": {
    "issue_type": "ModuleNotFoundError",
    "summary": "Python runtime failed to locate the 'requests' module during script execution.",
    "observed_evidence": [
      "Traceback (most recent call last):",
      "ModuleNotFoundError: No module named 'requests'"
    ],
    "likely_causes": [
      {
        "cause": "The 'requests' package is not installed in the active environment.",
        "rationale": "Python raised a ModuleNotFoundError upon import requests.",
        "confidence": "high"
      }
    ],
    "debugging_steps": [
      "Check the active Python interpreter path using 'where python' or 'which python'.",
      "Install the missing dependency via 'pip install requests'."
    ],
    "verification_steps": [
      "Run 'python -c \"import requests\"' to verify resolution."
    ],
    "confidence": "high",
    "limitations": [
      "Active virtual environment name is not visible in the screenshot."
    ]
  },
  "warnings": []
}
```

---

### B. Circuit Analysis Schema (`mode === "circuit"`)
```typescript
interface VisibleComponent {
  name: string;          // e.g., "Integrated Circuit", "Resistor", "Capacitor"
  visible_label: string; // e.g., "NE555P", "R1 10k", "unclear/unmarked"
  notes: string;         // Observations, package type, visible pin connections
}

interface PossibleIssue {
  issue: string;         // Potential wiring or component fault
  evidence: string;      // Visible visual evidence pointing to this issue
  confidence: "low" | "medium" | "high";
}

interface CircuitResult {
  overview: string;                         // High-level circuit description
  visible_components: VisibleComponent[];   // Identified components
  connections: string[];                    // Node connections, power rails
  possible_issues: PossibleIssue[];         // Potential faults or reverse polarity
  suggested_checks: string[];               // Safe diagnostic multimeter tests
  safety_notes: string[];                   // Power disconnection and hazard warnings
  limitations: string[];                    // Unclear traces, obscured values
}
```

#### Example Circuit Response:
```json
{
  "mode": "circuit",
  "result": {
    "overview": "555 Timer in astable multivibrator configuration for square-wave generation.",
    "visible_components": [
      {
        "name": "Integrated Circuit",
        "visible_label": "NE555P",
        "notes": "8-pin DIP package installed in breadboard center."
      },
      {
        "name": "Resistor",
        "visible_label": "R1 10k",
        "notes": "Connected between VCC rail and pin 7."
      }
    ],
    "connections": [
      "Pin 1 tied to breadboard ground rail.",
      "Pin 8 tied to breadboard +5V VCC rail."
    ],
    "possible_issues": [
      {
        "issue": "Potential reversed polarity on electrolytic capacitor C1.",
        "evidence": "Negative stripe orientation appears reversed relative to ground.",
        "confidence": "medium"
      }
    ],
    "suggested_checks": [
      "Disconnect power and check capacitor polarity markings.",
      "Measure resistance across R1 with circuit de-energized."
    ],
    "safety_notes": [
      "Always disconnect power before rewiring or touching components.",
      "Never measure resistance on an active energized circuit."
    ],
    "limitations": [
      "Capacitor C1 capacitance value is obscured by component angle."
    ]
  },
  "warnings": []
}
```

---

### C. Document Analysis Schema (`mode === "document"`)
```typescript
interface ImportantTerm {
  term: string;        // Technical term, parameter, acronym
  explanation: string; // Document-grounded definition
}

interface DocumentResult {
  document_title: string | null;     // Extracted title or null
  summary: string;                   // Executive summary grounded in text
  key_points: string[];              // Key takeaways from document
  important_terms: ImportantTerm[];  // Key terminology defined
  answer: string | null;             // Answer to user question or null
  source_notes: string[];            // Page/section citations e.g. "--- Page 1 ---"
  warnings: string[];                // Extraction notices, OCR caveats
  limitations: string[];             // Text bounds, unreviewed sections
}
```

#### Example Document Response:
```json
{
  "mode": "document",
  "result": {
    "document_title": "OmniSolve Technical Specification",
    "summary": "This document specifies the unified technical analysis architecture for OmniSolve.",
    "key_points": [
      "OmniSolve supports Screenshot, Circuit, and Document analysis modes.",
      "Text extraction is performed server-side using PyMuPDF and text decoders."
    ],
    "important_terms": [
      {
        "term": "Gemma 4",
        "explanation": "Open-weight multimodal AI model used for analysis inference."
      }
    ],
    "answer": "The maximum upload limit is 8 MB.",
    "source_notes": [
      "--- Page 1 ---, Section 2.1 Storage"
    ],
    "warnings": [],
    "limitations": [
      "Scanned diagrams and figures were not OCR-processed."
    ]
  },
  "warnings": [
    "Document text exceeded limit of 30000 characters and was truncated."
  ]
}
```

---

## 4. Standardized Error Handling

All error responses from the backend use the consistent JSON error contract:
```typescript
interface ErrorEnvelope {
  detail: {
    code: string;
    message: string;
  };
}
```

### HTTP Status Codes & Error Codes

| HTTP Status | Error Code | Meaning / User Guidance |
| :--- | :--- | :--- |
| `400` | `INVALID_FILE` | The uploaded image or document is corrupt or empty. Prompt user to upload a valid file. |
| `400` | `DOCUMENT_TEXT_EMPTY` | The uploaded document has no extractable text (e.g. blank document or scanned PDF). Warn user that scanned OCR is not supported. |
| `400` | `CONTEXT_TOO_LONG` | Context exceeds 1,000 characters. Prompt user to shorten context. |
| `400` | `QUESTION_TOO_LONG` | Question exceeds 1,000 characters. Prompt user to shorten question. |
| `413` | `FILE_TOO_LARGE` | File exceeds maximum upload limit (8 MB). Prompt user to upload a smaller file. |
| `415` | `UNSUPPORTED_FILE` | File extension/MIME not supported for selected mode. Display allowed types. |
| `422` | `INVALID_MODE` / `INVALID_REQUEST` | Missing required parameters or invalid mode. |
| `502` | `MODEL_UNAVAILABLE` | AI provider error, rate limit, or model access failure. Prompt user to retry shortly. |
| `502` | `MODEL_OUTPUT_INVALID` | Model response did not conform to schema. Prompt user to retry. |
| `503` | `MODEL_UNAVAILABLE` | Server-side `GEMINI_API_KEY` is not yet configured on the backend. |
| `504` | `MODEL_TIMEOUT` | Request timed out (exceeded 45 seconds). Prompt user to retry. |

---

## 5. UI/UX Recommendations for the Frontend

1. **Handling Warnings (`envelope.warnings`):**
   - Always check `data.warnings`. If non-empty, display them in an **Amber / Warning Banner** at the top of the results card. (For example: *"Notice: Document exceeded 30,000 characters and was truncated."* or *"Notice: Pages [2] contained no machine-readable text."*).
2. **Handling Qualitative Confidence:**
   - Render a visual confidence badge using `confidence`:
     - `"high"`: Green / Success badge
     - `"medium"`: Blue / Neutral badge
     - `"low"`: Amber / Caution badge
3. **Handling Limitations:**
   - Display `result.limitations` in a designated "Known Boundaries & Assumptions" section.
4. **Safety Warnings (Circuit Mode):**
   - Always display `result.safety_notes` prominently with a High Voltage / Warning icon before technical suggestions.
5. **Loading States:**
   - AI model calls take 3–15 seconds. Disable file inputs and submit buttons while analyzing, and display an animated spinner or pulse loader.

---

## 6. Complete TypeScript Client Example

Here is a ready-to-use TypeScript API client module for the frontend:

```typescript
// api/omnisolve.ts

export type AnalysisMode = "screenshot" | "circuit" | "document";

export interface AnalysisResponse<T = any> {
  mode: AnalysisMode;
  result: T;
  warnings: string[];
}

export interface ApiError {
  code: string;
  message: string;
}

const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function analyzeContent<T = any>(
  mode: AnalysisMode,
  file: File,
  context?: string,
  question?: string
): Promise<AnalysisResponse<T>> {
  const formData = new FormData();
  formData.append("mode", mode);
  formData.append("file", file);

  if (context && context.trim()) {
    formData.append("context", context.trim());
  }

  if (question && question.trim()) {
    formData.append("question", question.trim());
  }

  // NOTE: Do NOT set "Content-Type" header. The browser will automatically
  // set it along with the appropriate multipart boundary.
  const response = await fetch(`${BACKEND_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorDetail: ApiError = {
      code: "UNKNOWN_ERROR",
      message: `Request failed with HTTP status ${response.status}`,
    };

    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Fallback if response is non-JSON
    }

    throw new Error(`[${errorDetail.code}] ${errorDetail.message}`);
  }

  return response.json();
}
```

---

## 7. Security Rules
- **Never put API keys in the frontend:** All Gemini API keys remain strictly on the backend. The frontend only communicates with `http://127.0.0.1:8000/api/analyze`.
- **CORS Configuration:** If running Vite on a port other than `5173` (e.g. `3000`), update `CORS_ORIGINS` in the backend `.env`:
  ```ini
  CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
  ```
