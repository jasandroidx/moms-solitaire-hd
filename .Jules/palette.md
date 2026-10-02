## 2025-09-30 - Modal Dialog Accessibility in Custom Overlays
**Learning:** In custom overlay popups implemented via `div` display toggles rather than native `<dialog>`, `role="dialog"`, `aria-modal="true"`, and `Escape` key handlers must be explicitly added to ensure screen reader and keyboard accessibility.
**Action:** When adding or auditing popups in `index.html`, verify ARIA attributes and document-level keydown listeners for Escape dismissal.

## 2025-10-02 - PWA ChromeOS & Double-Tap Support
**Learning:** For Chromebook users, defining full Progressive Web App manifest.json standards and binding double-tap/double-click event listeners for auto-foundation moves provides a smooth native app experience.
**Action:** Keep manifest properties synced with index.html link headers and ensure double-tap handlers preserve top-card foundation constraints.
