# OmniSolve AI — UI/UX Design Specification (design.md)

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Product:** OmniSolve AI  
**Visual Style:** Premium Technical Workspace (Clean, Minimalist Dark Theme)  

---

## 1. Visual Direction & Aesthetic Philosophy

OmniSolve AI is designed as a **precision technical instrument** for engineers, developers, and researchers.

### 1.1 Core Principles
- **Restrained Dark Palette:** Deep slate/zinc backgrounds (`#090D16`, `#0F172A`) providing maximum legibility for dense code, schematics, and equations.
- **Purposeful Color Coding:**
  - **Indigo/Cyan (`#6366F1` / `#06B6D4`):** System highlights, primary actions, and Code Debugger accents.
  - **Amber/Orange (`#F59E0B` / `#F97316`):** Circuit Analyzer accents, warning states, and component flags.
  - **Emerald/Teal (`#10B981` / `#14B8A6`):** Document Explainer accents, success states, and verified findings.
  - **Rose/Red (`#EF4444`):** Error banners, short-circuits, and critical code exceptions.
- **Anti-Fatigue Typography:** Monospace accents (`JetBrains Mono` / `Fira Code` / `ui-monospace`) for code tokens, file types, and pin designators; crisp sans-serif (`Inter`, system UI) for analysis narrative.
- **Subtle Depth:** Single-pixel borders (`border-slate-800`), refined inner glows, and minimal glassmorphism (`backdrop-blur-md`). No garish neon glow rings or oversized marketing gradients.

---

## 2. Design Tokens

### 2.1 Color Palette
```css
:root {
  /* Surfaces */
  --bg-canvas: #090D16;        /* Deepest canvas background */
  --bg-surface: #0F172A;       /* Primary panel / card surface */
  --bg-surface-elevated: #1E293B; /* Hover / elevated popover surface */
  --bg-input: #0B1120;         /* Inputs and textareas */

  /* Borders */
  --border-subtle: #1E293B;
  --border-default: #334155;
  --border-highlight: #475569;

  /* Typography */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-accent: #38BDF8;

  /* Domain Accents */
  --accent-code: #6366F1;       /* Indigo */
  --accent-circuit: #F59E0B;    /* Amber */
  --accent-doc: #10B981;        /* Emerald */

  /* Feedback */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
}
```

### 2.2 Typography Scale
- **Display 1 (App Title / Hero):** 28px (1.75rem), SemiBold, Tracking -0.02em
- **Section Heading (H2):** 20px (1.25rem), SemiBold, Tracking -0.01em
- **Card Heading (H3):** 16px (1rem), Medium, Tracking normal
- **Body Regular:** 14px (0.875rem), Regular, Leading 1.5
- **Body Small / Captions:** 12px (0.75rem), Regular, Leading 1.4
- **Code / Monospace:** 13px (0.8125rem), `JetBrains Mono, ui-monospace, SFMono-Regular, monospace`

### 2.3 Spacing & Layout Tokens
- **Border Radii:**
  - Cards / Panels: `12px` (`rounded-xl`)
  - Badges / Small Buttons: `6px` (`rounded-md`)
  - Input Fields / Buttons: `8px` (`rounded-lg`)
- **Interactive Heights:**
  - Default Button: `40px`
  - Compact Button: `32px`
  - Input / Search: `40px`
- **Breakpoints:**
  - Desktop Split Workspace: $\ge 1200\text{px}$
  - Tablet Stack: $768\text{px} - 1199\text{px}$
  - Mobile Single Column: $< 768\text{px}$

---

## 3. Screen 1: Main Dashboard Layout

```
+-----------------------------------------------------------------------------------------+
| [O] OmniSolve AI    [Code Debugger] [Circuit Analyzer] [Doc Explainer]   (o) Backend Online|
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  Multimodal Technical Intelligence                                                      |
|  Troubleshoot code, inspect circuit schematics, and decode complex documentation.       |
|                                                                                         |
|  +--------------------+  +--------------------+  +--------------------+                 |
|  | </> Code Debugger  |  | [⚡] Circuit Anal. |  | [📄] Doc Explainer |                 |
|  | Stack traces, IDE  |  | Schematics, EDA,   |  | Lab manuals, specs |                 |
|  | logs & source code |  | waveforms & photos |  | formulas & vivas   |                 |
|  +--------------------+  +--------------------+  +--------------------+                 |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  |                                                                                   |  |
|  |               [ Cloud Arrow Icon ]                                                |  |
|  |               Drag & drop your file here, or browse files                         |  |
|  |               Accepted: .png, .jpg, .py, .ts, .log (Max 15MB)                     |  |
|  |                                                                                   |  |
|  |               [ Browse File Button ]                                              |  |
|  |                                                                                   |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  Explore Sample Use Cases:                                                              |
|  [ ⚡ Debug NullPointer ]  [ 💡 Check 555 Timer Pinout ]  [ 📖 Summarize Lab Experiment ]|
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

### Components on Dashboard:
1. **Header:** OmniSolve Logo, active mode badge indicator, backend connectivity status pill with live ping indicator, mock mode toggle.
2. **Hero Intro:** Clean headline and subtitle defining the multimodal diagnostic assistant.
3. **Mode Selector Cards:** 3 interactive cards displaying active selection border, iconography, supported extension badges, and mode description.
4. **Drag & Drop Upload Zone:**
   - Active hover / dragover glow border (`border-indigo-500` / `bg-indigo-950/20`).
   - Clear listing of accepted formats tailored to the currently selected mode.
   - Immediate validation error banner if an unsupported file is dropped.
5. **Sample Prompts / Use Cases:** Clickable pills that allow quick discovery and testing.

---

## 4. Screen 2: Analysis & Contextual Chat Workspace

When a file is loaded and analysis begins, the interface smoothly transitions to the **Analysis Workspace**.

```
+--------------------------------------------------------------------------------------------------+
| [O] OmniSolve AI   |   File: schematic_555.png (1.2 MB)   |   Circuit Analyzer   |  [+ New Analysis] |
+--------------------------------------------------------------------------------------------------+
|                                                      |                                           |
|  LEFT PANEL: FILE & STRUCTURED FINDINGS (60%)        |  RIGHT PANEL: CONTEXTUAL CHAT (40%)       |
|                                                      |                                           |
|  +------------------------------------------------+  |  Contextual Assistant                     |
|  | File Preview & Metadata                        |  |  Session linked to: schematic_555.png     |
|  | [ High-Res Image with Zoom / Fit Toggle ]      |  |                                           |
|  +------------------------------------------------+  |  [Assistant]                              |
|                                                      |  "I have analyzed your schematic. You can |
|  [⚡] Executive Summary                              |  ask specific questions about any pins or |
|  "Astable multivibrator circuit built with 555 IC"   |  potential timing errors."                |
|                                                      |                                           |
|  [✓] Identified Components (5)                       |  [User]                                   |
|  - U1: NE555 Timer IC (DIP-8)                        |  "Why is the LED output not toggling?"    |
|  - R1: 10kΩ 1/4W Resistor                            |                                           |
|  - C1: 10µF Electrolytic Capacitor                   |  [Assistant]                              |
|                                                      |  "Based on the schematic, Pin 4 (RESET)   |
|  [!] Potential Issues & Anomalies                    |  is left disconnected. In standard 555    |
|  - Pin 4 (RESET) appears floating; should tie to VCC.|  operation, RESET must be pulled HIGH."   |
|                                                      |                                           |
|  [→] Recommended Diagnostic Steps                    |  Suggested Follow-up Prompts:             |
|  1. Tie Pin 4 to +5V rail.                           |  [ How to calculate frequency? ]          |
|  2. Measure voltage at Pin 2 with oscilloscope.      |  [ What capacitor value for 1Hz? ]        |
|                                                      |                                           |
|  [⚠️] Uncertainties & Caveats                         |  +-------------------------------------+  |
|  "Resistor R2 color bands are partially blurred;     |  | Ask a question about this file...    |  |
|   value assumed as 4.7kΩ based on standard design."  |  |                                [Send]|  |
|                                                      |  +-------------------------------------+  |
|                                                      |  Enter to send • Shift+Enter for newline  |
+--------------------------------------------------------------------------------------------------+
```

### Critical Workspace Features:
1. **Context Preservation:** The analyzed file remains visible at all times in a responsive preview container (collapsible or expandable).
2. **Structured Visual Hierarchy:**
   - **Summary Card:** Direct, unambiguous executive takeaway.
   - **Findings / Components Card:** Tokenized breakdown.
   - **Root Cause / Apparent Function:** Clear explanation without technical jargon.
   - **Solution / Steps:** Actionable steps with copy buttons for code blocks.
   - **Uncertainties Banner:** Distinct yellow/amber alert box detailing what the AI could not verify.
3. **Contextual Chat Panel:**
   - Docked on the right side on desktop screens ($\ge 1200\text{px}$).
   - Conversation is strictly pinned to the current file context.
   - Empty state presents 3 intelligent starter pills based on the active mode.
   - Smooth auto-scroll to the latest message.
   - Error bubble with retry button if `/api/chat` fails.

---

## 5. Screen 3: States & Micro-Interactions

### 5.1 Multi-Stage Loading State
When the user clicks **"Analyze File"**, the button and workspace transition into a staged loading visualization:
- Stage 1: `Reading & verifying file payload...`
- Stage 2: `Processing multimodal features with Gemma AI...`
- Stage 3: `Synthesizing structured diagnostics...`
*Note:* Clear pulsating progress indicator without fabricated percentage counters.

### 5.2 Error & Recovery States
- **Invalid File Type:** File input card displays a red border (`border-rose-500/50`) with an explicit remediation message (e.g., *"PNG, JPG or WEBP required for Circuit Analyzer. Switch to Code Debugger to upload .py or .ts files."*).
- **Backend Disconnected:** Alert banner in header with direct toggle: `[Switch to Mock UI Mode for Preview]`.
- **Inference Timeout / Failure:** Error card in the workspace with a clear `[Retry Analysis]` action that preserves the selected file.

---

## 6. Responsive Behavior Specification

### Desktop ($\ge 1200\text{px}$):
- Split 60/40 workspace layout.
- Left side scrolls structured results; right side maintains a sticky contextual chat window.

### Tablet ($768\text{px} - 1199\text{px}$):
- Single column layout with sticky segmented tab navigation:
  - Tab 1: `Analysis & Results`
  - Tab 2: `Contextual Chat (Badge with count)`
- Allows switching between findings and chat without losing state.

### Mobile ($< 768\text{px}$):
- Full width cards.
- Bottom floating chat drawer or full-width tab switch.
- Touch target sizes minimum $44 \times 44\text{px}$.
- Chat input stays pinned above mobile virtual keyboard.

---

## 7. Accessibility (A11y) & Usability

1. **Keyboard Navigation:** Tab-order traverses header $\rightarrow$ mode selection $\rightarrow$ upload controls $\rightarrow$ action buttons $\rightarrow$ chat input.
2. **Contrast Standards:** All text on dark surfaces exceeds WCAG AA standard ($4.5:1$ contrast ratio). Text colors use `#F8FAFC` and `#94A3B8`.
3. **Screen Reader Optimization:** ARIA landmarks (`role="region"`, `aria-label="Analysis Results"`, `aria-live="polite"` for chat messages).
4. **Copy Feedback:** Instant toast notification or "Copied!" checkmark icon when copying code or findings to clipboard.
