/**
 * CSS selector matching the page while ChatGPT shows its dark theme.
 * Oct 2026 app shell: <html data-theme="dark">; 2025: <html class="dark">.
 * Use it in injected CSS rather than `dark:` utilities, which the 2026
 * stylesheet does not honor.
 */
export const DARK_THEME_SELECTOR = ':is(html.dark, html[data-theme="dark"])'

/**
 * Whether ChatGPT is currently showing its dark theme. Read on every call —
 * the user can switch themes without a reload.
 */
export function isDarkMode(): boolean {
  const root = document.documentElement

  // Oct 2026 app shell
  const theme = root.dataset.theme
  if (theme === 'dark' || theme === 'light') return theme === 'dark'

  // 2025
  if (root.classList.contains('dark')) return true
  if (root.classList.contains('light')) return false

  const colorScheme = getComputedStyle(root)
    .getPropertyValue('color-scheme')
    .trim()
  if (colorScheme === 'dark' || colorScheme === 'light') {
    return colorScheme === 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
