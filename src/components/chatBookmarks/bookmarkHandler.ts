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

    // מציאת המקטע (section) במקום המאמר
    const section = button.closest('.bookmark-section')
    if (!section) return

    // קבלת המזהה של המקטע מהכפתור או מה-ID של המקטע
    const sectionId = button.getAttribute('data-section-id') || section.id
    if (!sectionId) return

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

    const isCurrentlyBookmarked = bookmarkIds.includes(sectionId)

    if (isCurrentlyBookmarked) {
      await deleteBookmark({ articleId: sectionId, profileId, conversationId })
      replaceBookmarkButton(section, addBookmarkButtonHtml)
    } else {
      await saveBookmark({ articleId: sectionId, profileId, conversationId })
      replaceBookmarkButton(section, removeBookmarkButtonHtml)
    }
  } catch (error) {
    console.error('Failed to handle bookmark button click:', error)
  }
}
