import { DARK_THEME_SELECTOR } from './styleScheme'

const STYLE_ID = 'pinflux-theme-styles'

// Colors for PinFlux's own surfaces (dialogs, the bookmarks dropdown, inline
// inputs). In the Oct 2026 app shell they resolve to ChatGPT's theme tokens,
// which ChatGPT re-defines per theme — so we follow light/dark and custom
// accent themes for free. The literal fallbacks cover the 2025 UI, where those
// tokens don't exist and dark mode is <html class="dark">.
const CSS = `
:root {
  --pf-bg: var(--app-color-background-elevated-primary, #ffffff);
  --pf-surface: var(--app-color-background-elevated-secondary, #f9f9f9);
  --pf-surface-hover: var(--app-color-background-button-secondary-hover, #ececec);
  --pf-border: var(--app-color-border, #e3e3e3);
  --pf-text: var(--app-color-text-foreground, #0d0d0d);
  --pf-text-secondary: var(--app-color-text-foreground-secondary, #6e6e6e);
  --pf-accent: var(--app-color-background-button-primary, #0d0d0d);
  --pf-on-accent: var(--app-color-text-button-primary, #ffffff);
  --pf-accent-soft: var(--app-color-background-button-secondary, #ececec);
  --pf-ring: color-mix(in srgb, var(--pf-accent) 15%, transparent);
}
${DARK_THEME_SELECTOR} {
  --pf-bg: var(--app-color-background-elevated-primary, #212121);
  --pf-surface: var(--app-color-background-elevated-secondary, #2f2f2f);
  --pf-surface-hover: var(--app-color-background-button-secondary-hover, #3a3a3a);
  --pf-border: var(--app-color-border, #4d4d4d);
  --pf-text: var(--app-color-text-foreground, #ececec);
  --pf-text-secondary: var(--app-color-text-foreground-secondary, #b4b4b4);
  --pf-accent: var(--app-color-background-button-primary, #ffffff);
  --pf-on-accent: var(--app-color-text-button-primary, #0d0d0d);
  --pf-accent-soft: var(--app-color-background-button-secondary, #3a3a3a);
}

.pf-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}
.pf-overlay.hidden { display: none; }

.pf-dialog {
  width: 22rem;
  max-width: 90vw;
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid var(--pf-border);
  background: var(--pf-bg);
  color: var(--pf-text);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
}
.pf-dialog-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--pf-text);
}
.pf-dialog-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--pf-text-secondary);
}
.pf-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.pf-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--pf-border);
  border-radius: 0.625rem;
  background: var(--pf-surface);
  color: var(--pf-text);
  font-size: 0.875rem;
  outline: none;
}
.pf-input::placeholder { color: var(--pf-text-secondary); }
.pf-input:focus {
  border-color: var(--pf-accent);
  box-shadow: 0 0 0 3px var(--pf-ring);
}
.pf-inline-input {
  width: 100%;
  padding: 0 0.25rem;
  border: 1px solid var(--pf-accent);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--pf-text);
  font-size: 0.875rem;
  outline: none;
}

.pf-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--pf-border);
  border-radius: 9999px;
  background: transparent;
  color: var(--pf-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}
.pf-btn:hover { background: var(--pf-surface-hover); }
.pf-btn-primary {
  border-color: var(--pf-accent);
  background: var(--pf-accent);
  color: var(--pf-on-accent);
}
.pf-btn-primary:hover { background: var(--pf-accent); opacity: 0.85; }
`

/** Injects PinFlux's theme variables and shared surface classes, once. */
export default function ensureThemeStyles(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}
