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

  const articles = await waitForArticles()
  if (!articles) return

  let bookmarkIds: string[] = await getConversationBookmarksIds(
    profileId,
    conversationId
  )

  for (const article of articles) {
    // Skip if already has a bookmark button
    if (article.querySelector('[data-bookmark-button]')) continue

    // Add a relative class for positioning the button absolutely and group class for hover effects
    article.classList.add('relative', 'group')

    const articleId = article.getAttribute('data-testid')
    if (!articleId) continue

    const isBookmarked = bookmarkIds.includes(articleId)
    const buttonHtml = isBookmarked
      ? removeBookmarkButtonHtml
      : addBookmarkButtonHtml
    article.insertAdjacentHTML('beforeend', buttonHtml)
  }

  if (!bookmarkClickListenerAdded) {
    document.body.addEventListener('click', handleBookmarkButtonClick)
    bookmarkClickListenerAdded = true
  }
}
