import getCompactDateString from '../utils/getCompactDateString'
import addBookmarkButtonHtml from './add-bookmark-button.html?raw'
import handleBookmarkButtonClick from './bookmarkHandler'
import getConversationBookmarksIds from './getConversationBookmarksIds'
import removeBookmarkButtonHtml from './remove-bookmark-button.html?raw'
import initBookmarksMenu, { waitForBookmarksMenu } from './bookmarksMenu'
import migrateBookmarkId from './migrateBookmarkId'
import styleBookmarkButton from './styleBookmarkButton'

/**
 * Turn containers, newest ChatGPT first:
 * - Oct 2026 app shell: <div data-turn-key="…">, assistant content in
 *   [data-markdown-text-style="assistant-message"]
 * - 2025: <section data-testid="conversation-turn-…"> with
 *   [data-message-author-role="assistant"] .markdown.prose inside
 * - older: <article>
 */
const TURN_CONTAINER_SELECTOR =
  '[data-turn-key], section[data-testid^="conversation-turn-"], article'
// Oct 2026: one turn can hold several assistant blocks, each its own message
const ASSISTANT_MARKDOWN_SELECTOR_2026 =
  '[data-markdown-text-style="assistant-message"]'
// 2025
const ASSISTANT_MARKDOWN_SELECTOR =
  '[data-message-author-role="assistant"] .markdown.prose'
const MESSAGE_ID_SELECTOR = '[data-chatgpt-selection-message-id]'

function getAssistantMarkdowns(turn: HTMLElement): HTMLElement[] {
  const blocks = turn.querySelectorAll<HTMLElement>(
    ASSISTANT_MARKDOWN_SELECTOR_2026
  )
  if (blocks.length) return Array.from(blocks)

  // Prefer the assistant-scoped match so we don't wrap user turns. Fall back to
  // the bare selector: ChatGPT renames these attributes, and losing bookmarks
  // entirely is worse than an occasional extra wrapper.
  const legacy =
    turn.querySelector<HTMLElement>(ASSISTANT_MARKDOWN_SELECTOR) ??
    turn.querySelector<HTMLElement>('.markdown.prose')
  return legacy ? [legacy] : []
}

function getTurnContainers(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(TURN_CONTAINER_SELECTOR)
  ).filter(el => getAssistantMarkdowns(el).length)
}

function isTurnStreaming(turn: HTMLElement): boolean {
  return (
    // Oct 2026: the state sits on an element inside the turn
    !!turn.querySelector('[data-talvt-turn-state="in_progress"]') ||
    !!turn.querySelector('.result-streaming, .result-thinking')
  )
}

function isAnyTurnStreaming(): boolean {
  return !!document.querySelector(
    '[data-talvt-turn-state="in_progress"], button[data-testid="stop-response-button"], button[aria-label="Stop streaming"], [data-testid="composer-stop-button"]'
  )
}

/**
 * Stable ID prefix for the sections of one assistant block. Oct 2026 exposes
 * the server-side message UUID, which survives re-renders and redesigns; older
 * DOMs only had the turn's position, so they keep the conversation-turn-N form
 * existing bookmarks were saved under.
 */
function getSectionIdPrefix(
  markdown: HTMLElement,
  turnContainer: HTMLElement
): string {
  const messageId = markdown.closest<HTMLElement>(MESSAGE_ID_SELECTOR)?.dataset
    .chatgptSelectionMessageId
  if (messageId) return `msg-${messageId}`

  return (
    markdown.closest<HTMLElement>('[data-testid^="conversation-turn-"]')
      ?.dataset.testid ||
    turnContainer.dataset.testid ||
    ''
  )
}

/**
 * The `conversation-turn-N` a 2026 turn would have had in the 2025 DOM, so
 * bookmarks saved under that ID can be found and migrated.
 *
 * 2025 numbered every message from 1, so replies were the even turns (first
 * reply = conversation-turn-2). The 2026 shell numbers question+reply pairs
 * from 0 as `fallback-turn-N` on [data-content-search-turn-key]. Verified
 * against real saved bookmarks (all even N) and a live turn listing (#22).
 * Anything that isn't exactly `fallback-turn-<n>` is left alone.
 */
function getLegacyTurnTestId(turnContainer: HTMLElement): string | null {
  const key = turnContainer.querySelector<HTMLElement>(
    '[data-content-search-turn-key]'
  )?.dataset.contentSearchTurnKey
  const pairIndex = key?.match(/^fallback-turn-(\d+)$/)?.[1]
  if (pairIndex === undefined) return null
  return `conversation-turn-${2 * Number(pairIndex) + 2}`
}

async function waitForTurnContainers(
  maxRetries = 10,
  delayMs = 500
): Promise<HTMLElement[] | null> {
  for (let i = 0; i < maxRetries; i++) {
    const turns = getTurnContainers()
    if (turns.length > 0) return turns
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  console.warn(
    '[PinFlux] No conversation turns yet; bookmarks will be added as they render.'
  )
  return null
}

let bookmarkClickListenerAdded = false
let observer: MutationObserver | null = null
let isProcessingArticles = false
let observerTimeout: NodeJS.Timeout | null = null

export default async function initBookmarks({
  profileId,
  conversationId,
}: {
  profileId: string
  conversationId: string
}) {
  if (!profileId || !conversationId) {
    console.warn('[initBookmarks] Missing profileId or conversationId.')
    return
  }


  // The header may not be rendered yet; don't hold up the section buttons
  waitForBookmarksMenu()

  const bookmarkIds: string[] = await getConversationBookmarksIds(
    profileId,
    conversationId
  )

  /**
   * Creating bookmark buttons by dividing into sections within a turn
   */
  const addButtonsToSections = (turnContainer: HTMLElement) => {
    try {
      // Additional check that the turn still exists in the DOM
      if (!document.contains(turnContainer)) {
        return
      }

      for (const markdown of getAssistantMarkdowns(turnContainer)) {
        addButtonsToMarkdown(markdown, turnContainer)
      }
    } catch (error) {
      console.error('Error in addButtonsToSections:', error)
    }
  }

  const addButtonsToMarkdown = (
    markdown: HTMLElement,
    turnContainer: HTMLElement
  ) => {
    try {
      // Don't process the same turn twice. Also handles ChatGPT's virtualized
      // list, which can re-create DOM nodes when scrolling.
      if (
        markdown.dataset.bookmarkProcessed ||
        markdown.querySelector('.bookmark-section, [data-bookmark-button]')
      ) {
        return
      }
      
      // Skip turns that are still streaming
      if (isTurnStreaming(turnContainer)) {
        return // Don't try again
      }

      markdown.dataset.bookmarkProcessed = 'true'
      
      const children = Array.from(markdown.children)
      let currentSection: HTMLElement[] = []
      let sectionIndex = 0

      const createSection = (elements: HTMLElement[], index: number) => {
        if (!elements.length) return

        // Create outer container
        const container = document.createElement('div')
        container.classList.add('relative', 'group', 'flex', 'items-start', 'gap-2', 'mb-4')

        // Create content wrapper
        const wrapper = document.createElement('div')
        wrapper.classList.add('bookmark-section', 'flex-1', 'min-w-0')

        elements[0]!.before(container)
        for (const el of elements) wrapper.appendChild(el)
        container.appendChild(wrapper)

        const sectionId = `${getSectionIdPrefix(markdown, turnContainer)}-${index}`
        wrapper.id = sectionId

        // A bookmark saved before Oct 2026 is keyed by the turn's old position.
        // Show it as bookmarked now and re-key it in the background.
        // 2025 turns held a single reply block, so only the first one maps
        const legacyTurnId =
          sectionId.startsWith('msg-') &&
          getAssistantMarkdowns(turnContainer)[0] === markdown
            ? getLegacyTurnTestId(turnContainer)
            : null
        const legacyId = legacyTurnId && `${legacyTurnId}-${index}`
        if (
          legacyId &&
          !bookmarkIds.includes(sectionId) &&
          bookmarkIds.includes(legacyId)
        ) {
          bookmarkIds[bookmarkIds.indexOf(legacyId)] = sectionId
          migrateBookmarkId({
            fromId: legacyId,
            toId: sectionId,
            profileId,
            conversationId,
          })
        }

        const isBookmarked = bookmarkIds.includes(sectionId)
        const buttonHtml = isBookmarked
          ? removeBookmarkButtonHtml
          : addBookmarkButtonHtml

        // Add the button to container (not to wrapper)
        container.insertAdjacentHTML('beforeend', buttonHtml)

        const button = container.querySelector(
          '[data-bookmark-button]'
        ) as HTMLElement
        if (button) {
          button.dataset.sectionId = sectionId
          button.dataset.sectionIndex = String(index)
          styleBookmarkButton(button)
        }
      }

      // Split by HR tags
      children.forEach((child: Element) => {
        if (child.tagName.toLowerCase() === 'hr') {
          createSection(currentSection, sectionIndex++)
          currentSection = []
        } else {
          currentSection.push(child as HTMLElement)
        }
      })

      // The last section
      createSection(currentSection, sectionIndex)
    } catch (error) {
      console.error('Error in addButtonsToMarkdown:', error)
    }
  }

  /**
   * Handle all turns
   */
  const addButtonsToArticles = (turns: Iterable<HTMLElement>) => {
    for (const turn of turns) {
      addButtonsToSections(turn)
    }
  }

  // Handle existing turns
  const initialTurns = await waitForTurnContainers()
  if (initialTurns) {
    addButtonsToArticles(initialTurns)
  }

  // Add click listener only once
  if (!bookmarkClickListenerAdded) {
    document.body.addEventListener('click', handleBookmarkButtonClick)
    bookmarkClickListenerAdded = true
  }

  // Disconnect previous observer
  if (observer) {
    observer.disconnect()
    if (observerTimeout) {
      clearTimeout(observerTimeout)
      observerTimeout = null
    }
  }

  // New observer that listens for audio button appearing/disappearing
  observer = new MutationObserver(mutations => {
    // Prevent infinite loop
    if (isProcessingArticles) return
    
    // Throttle the observer - only check every 500ms
    if (observerTimeout) clearTimeout(observerTimeout)
    observerTimeout = setTimeout(() => {
      // ChatGPT re-renders the header (and drops our button) on its own
      // schedule; put it back. No-op while it's there or the header isn't.
      initBookmarksMenu()

      // Don't process while a response is still streaming
      if (isAnyTurnStreaming()) return

      // Check if the "Read aloud" button is ready (only appears once a
      // response has finished generating)
      const speechButton = document.querySelector('[data-testid="composer-speech-button"]')
      const speechButtonContainer = document.querySelector('[data-testid="composer-speech-button-container"]')
      const speechReady = !!speechButton && !!speechButtonContainer && !speechButton.hasAttribute('disabled')
      if ((speechButton || speechButtonContainer) && !speechReady) return

      // Only process when there are new, unprocessed turns
      const hasUnprocessed = getTurnContainers().some(turn =>
        getAssistantMarkdowns(turn).some(md => !md.dataset.bookmarkProcessed)
      )
      if (!hasUnprocessed) return

      // Set flag to prevent recursive calls
      isProcessingArticles = true
      
      // Short delay to ensure content is stable
      setTimeout(() => {
        const allTurns = getTurnContainers()
        if (allTurns.length > 0) {
          addButtonsToArticles(allTurns)
        }
        // Reset flag after processing
        isProcessingArticles = false
      }, 300)
    }, 500)
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'data-state', 'class', 'data-talvt-turn-state'],
  })
}
