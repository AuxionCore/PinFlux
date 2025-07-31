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

  console.log(`initBookmarks conversationId=${conversationId}`)

  // אתחול תפריט הסימניות
  await initBookmarksMenu()

  const bookmarkIds: string[] = await getConversationBookmarksIds(
    profileId,
    conversationId
  )

  /**
   * יצירת כפתורי סימניה לפי חלוקה למקטעים במאמר
   */
  const addButtonsToSections = (article: HTMLElement) => {
    const markdown = article.querySelector<HTMLElement>('.markdown.prose')
    if (!markdown) return

    // אל תעבד פעמיים את אותו article
    if (markdown.dataset.bookmarkProcessed) return
    markdown.dataset.bookmarkProcessed = 'true'

    const children = Array.from(markdown.children)
    let currentSection: HTMLElement[] = []
    let sectionIndex = 0

    const createSection = (elements: HTMLElement[], index: number) => {
      if (!elements.length) return

      // יצירת container חיצוני
      const container = document.createElement('div')
      container.classList.add('relative', 'group', 'flex', 'items-start', 'gap-2', 'mb-4')

      // יצירת wrapper לתוכן
      const wrapper = document.createElement('div')
      wrapper.classList.add('bookmark-section', 'flex-1')

      elements[0].before(container)
      for (const el of elements) wrapper.appendChild(el)
      container.appendChild(wrapper)

      // מזהה ייחודי של המקטע, עם prefix
      const articleId = article.dataset.testid || ''
      const sectionId = `${articleId}-${index}`
      wrapper.id = sectionId

      const isBookmarked = bookmarkIds.includes(sectionId)
      const buttonHtml = isBookmarked
        ? removeBookmarkButtonHtml
        : addBookmarkButtonHtml

      // הוספת הכפתור לcontainer (לא לwrapper)
      container.insertAdjacentHTML('beforeend', buttonHtml)

      const button = container.querySelector(
        '[data-bookmark-button]'
      ) as HTMLElement
      if (button) {
        button.dataset.sectionId = sectionId
        button.dataset.sectionIndex = String(index)
      }
    }

    // חלוקה לפי HR
    children.forEach(child => {
      if (child.tagName.toLowerCase() === 'hr') {
        createSection(currentSection, sectionIndex++)
        currentSection = []
      } else {
        currentSection.push(child as HTMLElement)
      }
    })

    // המקטע האחרון
    createSection(currentSection, sectionIndex)
  }

  /**
   * טיפול בכל המאמרים
   */
  const addButtonsToArticles = (articles: Iterable<HTMLElement>) => {
    for (const article of articles) {
      addButtonsToSections(article)
    }
  }

  // טיפול במאמרים קיימים
  const initialArticles = await waitForArticles()
  if (initialArticles) {
    addButtonsToArticles(initialArticles)
  }

  // מאזין ללחיצות פעם אחת בלבד
  if (!bookmarkClickListenerAdded) {
    document.body.addEventListener('click', handleBookmarkButtonClick)
    bookmarkClickListenerAdded = true
  }

  // נבטל Observer קודם
  if (observer) observer.disconnect()

  // Observer שמזהה מאמרים חדשים
  observer = new MutationObserver(mutations => {
    const newArticles: HTMLElement[] = []
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue

        if (node.tagName.toLowerCase() === 'article') {
          newArticles.push(node)
        }

        const innerArticles = node.querySelectorAll?.('article')
        if (innerArticles && innerArticles.length) {
          newArticles.push(...(innerArticles as any))
        }
      }
    }

    if (newArticles.length > 0) {
      addButtonsToArticles(newArticles)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}
