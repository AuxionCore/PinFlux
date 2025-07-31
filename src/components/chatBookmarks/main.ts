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

  // אתחול תפריט הסימניות - עכשיו זה יקרה בכל עמוד חדש
  await initBookmarksMenu()

  const bookmarkIds: string[] = await getConversationBookmarksIds(
    profileId,
    conversationId
  )

  /**
   * יצירת כפתורי סימניה לפי חלוקה למקטעים במאמר
   */
  const addButtonsToSections = (article: HTMLElement) => {
    try {
      // בדיקה נוספת שהמאמר עדיין קיים ב-DOM
      if (!document.contains(article)) {
        return
      }

      const markdown = article.querySelector<HTMLElement>('.markdown.prose')
      if (!markdown) return

      // אל תעבד פעמיים את אותו article
      if (markdown.dataset.bookmarkProcessed) {
        console.log('Article already processed, skipping')
        return
      }
      
      // בדיקה פשוטה שהמאמר לא במצב streaming
      const isStreaming = article.querySelector('.result-streaming')
      if (isStreaming) {
        console.log('Article still streaming, skipping')
        return // לא ננסה שוב
      }

      console.log('Processing article for bookmark buttons')
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
      children.forEach((child: Element) => {
        if (child.tagName.toLowerCase() === 'hr') {
          createSection(currentSection, sectionIndex++)
          currentSection = []
        } else {
          currentSection.push(child as HTMLElement)
        }
      })

      // המקטע האחרון
      createSection(currentSection, sectionIndex)
    } catch (error) {
      console.error('Error in addButtonsToSections:', error)
      return
    }
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

  // Observer חדש שמקשיב לכפתור האודיו שמופיע/נעלם
  observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' || mutation.type === 'childList') {
        // בדיקה אם כפתור האודיו מופיע (סימן שהתגובה הושלמה)
        const speechButton = document.querySelector('[data-testid="composer-speech-button"]')
        const speechButtonContainer = document.querySelector('[data-testid="composer-speech-button-container"]')
        
        if (speechButton && speechButtonContainer && !speechButton.hasAttribute('disabled')) {
          console.log('Speech button is active - response completed, adding bookmark buttons')
          
          // דיחוי קצר כדי להבטיח שהתוכן יציב
          setTimeout(() => {
            const allArticles = document.querySelectorAll<HTMLElement>('article')
            if (allArticles.length > 0) {
              console.log('Processing articles after response completion:', allArticles.length)
              addButtonsToArticles(allArticles)
            }
          }, 300)
        }
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'data-state', 'class'],
  })
}
