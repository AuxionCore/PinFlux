import getCompactDateString from '../utils/getCompactDateString'
import addBookmarkButtonHtml from './add-bookmark-button.html?raw'
import handleBookmarkButtonClick from './bookmarkHandler'
import getConversationBookmarksIds from './getConversationBookmarksIds'
import removeBookmarkButtonHtml from './remove-bookmark-button.html?raw'
import initBookmarksMenu from './bookmarksMenu'

async function waitForArticles(
  maxRetries = 10,
  delayMs = 500
): Promise<NodeListOf<HTMLElement> | null> {
  for (let i = 0; i < maxRetries; i++) {
    const articles = document.querySelectorAll<HTMLElement>('article')
    if (articles.length > 0) return articles
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  console.warn('waitForArticles: Reached max retries, no articles found.')
  return null
}

let bookmarkClickListenerAdded = false
let observer: MutationObserver | null = null
let isProcessingArticles = false
let lastProcessedArticleCount = 0
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
   * Creating bookmark buttons by dividing into sections within an article
   */
  const addButtonsToSections = (article: HTMLElement) => {
    try {
      // Additional check that the article still exists in the DOM
      if (!document.contains(article)) {
        return
      }

      const markdown = article.querySelector<HTMLElement>('.markdown.prose')
      if (!markdown) return

      // Don't process the same article twice
      if (markdown.dataset.bookmarkProcessed) {
        return
      }
      
      // Simple check that the article is not in streaming mode
      const isStreaming = article.querySelector('.result-streaming')
      if (isStreaming) {
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

        // Unique section identifier with prefix
        const articleId = article.dataset.testid || ''
        const sectionId = `${articleId}-${index}`
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
   * Handle all articles
   */
  const addButtonsToArticles = (articles: Iterable<HTMLElement>) => {
    for (const article of articles) {
      addButtonsToSections(article)
    }
  }

  // Handle existing articles
  const initialArticles = await waitForArticles()
  if (initialArticles) {
    addButtonsToArticles(initialArticles)
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
      // Check if audio button appears (sign that response is completed)
      const speechButton = document.querySelector('[data-testid="composer-speech-button"]')
      const speechButtonContainer = document.querySelector('[data-testid="composer-speech-button-container"]')
      
      if (speechButton && speechButtonContainer && !speechButton.hasAttribute('disabled')) {
        const currentArticleCount = document.querySelectorAll('article').length
        
        // Only process if we have new articles or haven't processed this conversation yet
        if (currentArticleCount > lastProcessedArticleCount) {
          
          // Set flag to prevent recursive calls
          isProcessingArticles = true
          lastProcessedArticleCount = currentArticleCount
          
          // Short delay to ensure content is stable
          setTimeout(() => {
            const allArticles = document.querySelectorAll<HTMLElement>('article')
            if (allArticles.length > 0) {
              addButtonsToArticles(allArticles)
            }
            // Reset flag after processing
            isProcessingArticles = false
          }, 300)
        }
      }
    }, 500)
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'data-state', 'class'],
  })
}
