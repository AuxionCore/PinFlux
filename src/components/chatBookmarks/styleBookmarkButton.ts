import { isAppShell2026 } from '../pinChats/helpers/sidebarTheme'

// The button markup carries 2025 classes (bg-white + dark:bg-gray-800). The
// Oct 2026 shell switches themes without the `dark:` variant, so that renders
// as a white box in dark mode. Use classes from ChatGPT's own 2026 markup
// instead: transparent, ghost hover, tertiary text that follows the theme.
const BOOKMARK_BUTTON_2026 =
  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 has-[[data-state=open]]:opacity-100 shrink-0 self-start rounded-lg ps-1 pe-1 py-0.5 text-tertiary hover:bg-primary-ghost-hover cursor-interaction'

export default function styleBookmarkButton(button: Element | null): void {
  if (!button || !isAppShell2026()) return

  button.setAttribute('class', BOOKMARK_BUTTON_2026)
  // Let the icon inherit text-tertiary instead of the 2025 gray shades
  button.querySelector('svg')?.removeAttribute('class')
}
