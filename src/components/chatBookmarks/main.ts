import getCompactDateString from '../utils/getCompactDateString'
import addBookmarkButtonHtml from './add-bookmark-button.html?raw'
import handleBookmarkButtonClick from './bookmarkHandler'
import getConversationBookmarksIds from './getConversationBookmarksIds'
import removeBookmarkButtonHtml from './remove-bookmark-button.html?raw'

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
    console.warn(
      '[initBookmarks] Missing profileId or conversationId, aborting.'
    )
    return
  }

  console.log(`initBookmarks conversationId=${conversationId}`)

  let bookmarkIds: string[] = await getConversationBookmarksIds(
    profileId,
    conversationId
  )

  // פונקציה פנימית שמוסיפה כפתורי סימניה למאמרים
  const addButtonsToArticles = (articles: Iterable<HTMLElement>) => {
    for (const article of articles) {
      if (article.querySelector('[data-bookmark-button]')) continue
      article.classList.add('relative', 'group')

      const articleId = article.getAttribute('data-testid')
      if (!articleId) continue

      const isBookmarked = bookmarkIds.includes(articleId)
      const buttonHtml = isBookmarked
        ? removeBookmarkButtonHtml
        : addBookmarkButtonHtml
      article.insertAdjacentHTML('beforeend', buttonHtml)
    }
  }

  // עיבוד ראשוני לכל המאמרים הקיימים
  const initialArticles = await waitForArticles()
  if (initialArticles) {
    addButtonsToArticles(initialArticles)
  }

  // מאזין ללחיצות על הכפתורים פעם אחת בלבד
  if (!bookmarkClickListenerAdded) {
    document.body.addEventListener('click', handleBookmarkButtonClick)
    bookmarkClickListenerAdded = true
  }

  // אם יש Observer קיים, נבטל כדי למנוע כפילויות
  if (observer) observer.disconnect()

  // יצירת ה-Observer שיעקוב אחרי אלמנטים חדשים שנוספים לדף
  observer = new MutationObserver(mutations => {
    const newArticles: HTMLElement[] = []
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue

        // אם נוצר מאמר חדש
        if (node.tagName.toLowerCase() === 'article') {
          newArticles.push(node)
        }

        // אם נוספו צאצאים של מאמרים
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

  // מאזין על ה-body כולו (או container ייעודי אם יש)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}
