# Design Specification
## OmniVerse AI

## 1. Design intent
A unified technical analysis workspace: clear, polished, focused, and trustworthy. The three modes should feel like parts of one product, not separate websites. Avoid a generic chat-only interface.

## 2. Workspace layout
### Header
- Wordmark: `OmniVerse AI`
- Descriptor: `One workspace. Three ways to understand.`

### Mode selector
Show three prominent selectable cards/tabs:
1. **Screenshot Analysis** — “Understand errors, terminal output, and software issues.”
2. **Circuit Analysis** — “Explore circuit diagrams, components, and possible issues.”
3. **Document Analysis** — “Summarize documents and ask questions grounded in their content.”

The active mode must be obvious through text, focus/selection styling, and accessible state—not color alone.

### Main workspace
Desktop: two-column layout.
- Left/input panel: mode-specific instructions, file picker/drop zone, filename/preview, optional context or question, Analyze button, privacy hint.
- Right/results panel: empty state, loading state, error state, or mode-specific structured result.
Mobile: stack input and result panels vertically without horizontal overflow.

## 3. Mode-specific UI
### Screenshot Analysis
Result sections: Issue summary; What is visible; Likely causes; Debugging steps; How to verify; Limitations.

### Circuit Analysis
Result sections: Circuit overview; Visible components; Connections/topology; Possible issues; Suggested checks; Safety notes; Limitations.
Never label output “simulation results.”

### Document Analysis
Result sections: Summary; Key points; Important terms/figures; Answer to your question (when a question was supplied); Extraction warnings; Limitations.
If text extraction is insufficient, show an explicit warning and do not render an invented summary.

## 4. Interaction states
- Mode selected, no file.
- Valid file selected.
- Invalid file or file too large.
- Analyzing (disable duplicate submission, retain input).
- Success.
- Provider/network failure (preserve input for retry).
- Unreadable image/document.
- Reset/Analyze another.

## 5. Visual guidance
- Dark-first neutral interface with accessible contrast.
- Use clear typography, spacing, and mode-specific icons only where they improve scanning.
- Keep one primary CTA per mode.
- Avoid excessive animation, fake terminal output, fake model status, and fabricated live activity.
- Do not spend the timebox on theme switching or decorative features before all three mode flows work.

## 6. Accessibility
- Visible labels and keyboard-accessible mode selector.
- Accessible file input and buttons.
- Announce loading/errors using `aria-live` where appropriate.
- Visible keyboard focus; do not rely on color alone.
- Responsive layout at narrow viewport sizes.

## 7. Demo readiness
- The landing view immediately communicates all three modes.
- Provide non-sensitive sample assets for screenshot, circuit, and document demonstrations if permitted.
- Any static fallback must be visibly labeled “Sample output — not a live model response.”
- Only display “Gemma 4” as active provider status when the configured real provider path is in use.
