import getCompactDateString from '../utils/getCompactDateString'
import addBookmarkButtonHtml from './add-bookmark-button.html?raw'
import handleBookmarkButtonClick from './bookmarkHandler'
import getConversationBookmarksIds from './getConversationBookmarksIds'
import removeBookmarkButtonHtml from './remove-bookmark-button.html?raw'
import initBookmarksMenu from './bookmarksMenu'

/**
 * ChatGPT redesigned its conversation DOM. Responses are no longer wrapped in
 * <article> elements - each turn is now a
 * <section data-testid="conversation-turn-..."> containing a
 * [data-message-author-role="assistant"] block with the `.markdown.prose`
 * content inside. We keep <article> as a fallback for older versions.
 */
const TURN_CONTAINER_SELECTOR =
  'section[data-testid^="conversation-turn-"], article'

function getTurnContainers(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(TURN_CONTAINER_SELECTOR)
  ).filter(el => el.querySelector('.markdown.prose'))
}

function isTurnStreaming(turn: HTMLElement): boolean {
  return !!turn.querySelector('.result-streaming, .result-thinking')
}

function isAnyTurnStreaming(): boolean {
  return !!document.querySelector(
    'button[data-testid="stop-response-button"], button[aria-label="Stop streaming"], [data-testid="composer-stop-button"]'
  )
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
  console.warn('waitForTurnContainers: Reached max retries, no turn containers found.')
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


  // Initialize bookmarks menu - this will happen on every new page
  await initBookmarksMenu()

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

      const markdown = turnContainer.querySelector<HTMLElement>('.markdown.prose')
      if (!markdown) return

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
        wrapper.classList.add('bookmark-section', 'flex-1')

        elements[0].before(container)
        for (const el of elements) wrapper.appendChild(el)
        container.appendChild(wrapper)

        // Unique section identifier: prefer the closest conversation turn
        const turnTestId =
          markdown.closest<HTMLElement>('[data-testid^="conversation-turn-"]')
            ?.dataset.testid || turnContainer.dataset.testid || ''
        const sectionId = `${turnTestId}-${index}`
        wrapper.id = sectionId

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
      console.error('Error in addButtonsToSections:', error)
      return
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
      // Don't process while a response is still streaming
      if (isAnyTurnStreaming()) return

      // Check if the "Read aloud" button is ready (only appears once a
      // response has finished generating)
      const speechButton = document.querySelector('[data-testid="composer-speech-button"]')
      const speechButtonContainer = document.querySelector('[data-testid="composer-speech-button-container"]')
      const speechReady = !!speechButton && !!speechButtonContainer && !speechButton.hasAttribute('disabled')
      if ((speechButton || speechButtonContainer) && !speechReady) return

      // Only process when there are new, unprocessed turns
      const hasUnprocessed = getTurnContainers().some(turn => {
        const md = turn.querySelector<HTMLElement>('.markdown.prose')
        return !!md && !md.dataset.bookmarkProcessed
      })
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
    attributeFilter: ['disabled', 'data-state', 'class'],
  })
}
