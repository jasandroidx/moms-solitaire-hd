## 2025-09-30 - Modal Dialog Accessibility in Custom Overlays
**Learning:** In custom overlay popups implemented via `div` display toggles rather than native `<dialog>`, `role="dialog"`, `aria-modal="true"`, and `Escape` key handlers must be explicitly added to ensure screen reader and keyboard accessibility.
**Action:** When adding or auditing popups in `index.html`, verify ARIA attributes and document-level keydown listeners for Escape dismissal.
