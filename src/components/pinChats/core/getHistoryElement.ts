// The scrollable chat list in the sidebar, newest ChatGPT first
const HISTORY_SELECTORS = [
  // Oct 2026 app shell
  '[data-app-action-sidebar-scroll]',
  // 2025
  '#history',
]

const WARN_AFTER_MS = 10000

export default async function getHistoryElement() {
  return new Promise<HTMLDivElement>(resolve => {
    const startedAt = Date.now()
    let warned = false

    // Poll the DOM every 100ms until the history element is found
    const interval = setInterval(() => {
      for (const selector of HISTORY_SELECTORS) {
        const historyElement = document.querySelector<HTMLDivElement>(selector)
        if (historyElement) {
          clearInterval(interval)
          resolve(historyElement)
          return
        }
      }

      if (!warned && Date.now() - startedAt >= WARN_AFTER_MS) {
        warned = true
        console.warn(
          `[PinFlux] Sidebar chat list not found (tried ${HISTORY_SELECTORS.join(', ')}). ` +
            'Pinned chats will not load until it appears.'
        )
      }
    }, 100)
  })
}
