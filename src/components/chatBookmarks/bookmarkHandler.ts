import addBookmarkButtonHtml from './add-bookmark-button.html?raw'
import removeBookmarkButtonHtml from './remove-bookmark-button.html?raw'
import saveBookmark from './saveBookmark'
import deleteBookmark from './deleteBookmark'
import replaceBookmarkButton from './replaceBookmarkButton'
import getConversationBookmarksIds from './getConversationBookmarksIds'
import getProfileId from '../utils/getProfileId'

export default async function handleBookmarkButtonClick(event: MouseEvent) {
  try {
    const button = (event.target as HTMLElement).closest(
      '[data-bookmark-button]'
    )
    if (!button) return

    const article = button.closest('article')
    if (!article) return

    const articleId = article.getAttribute('data-testid')
    if (!articleId) return

    const profileId = await getProfileId()
    // Robust extraction of conversationId from pathname (e.g., /c/{conversationId})
    const path = window.location.pathname.replace(/\/+$/, '')
    let conversationId = ''
    const match = path.match(/\/c\/([\w-]+)/)
    if (match) {
      conversationId = match[1]
    }
    if (!conversationId) {
      console.warn(
        '[handleBookmarkButtonClick] Missing conversationId, aborting.'
      )
      return null
    }

    const bookmarkIds = await getConversationBookmarksIds(
      profileId,
      conversationId
    )

    const isCurrentlyBookmarked = bookmarkIds.includes(articleId)

    if (isCurrentlyBookmarked) {
      await deleteBookmark({ articleId, profileId, conversationId })
      replaceBookmarkButton(article, addBookmarkButtonHtml)
    } else {
      await saveBookmark({ articleId, profileId, conversationId })
      replaceBookmarkButton(article, removeBookmarkButtonHtml)
    }
  } catch (error) {
    console.error('Failed to handle bookmark button click:', error)
  }
}
