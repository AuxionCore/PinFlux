import getConversationBookmarksIds from './getConversationBookmarksIds'
import getCompactDateString from '../utils/getCompactDateString'

interface BookmarkData {
  sectionId: string
  displayName: string
  customName?: string
}

export default async function getBookmarksData(
  profileId: string,
  conversationId: string
): Promise<BookmarkData[]> {
  try {
    const dateStr = getCompactDateString()
    const key = `bm_${profileId}_${conversationId}_lastAccess_${dateStr}`
    const result = await browser.storage.sync.get(key)
    const bookmarks: any[] = result[key] || []

    const bookmarksData: BookmarkData[] = []

    for (const bookmark of bookmarks) {
      const sectionId = bookmark.articleId
      // Find the element in the page
      const sectionElement = document.getElementById(sectionId)
      
      let displayName = bookmark.customName
      
      if (!displayName && sectionElement) {
        // Take the first text from the section (up to 100 characters)
        const textContent = sectionElement.textContent?.trim() || ''
        displayName = textContent.length > 100 
          ? textContent.substring(0, 100) + '...'
          : textContent
      }

      if (!displayName) {
        displayName = `Section ${sectionId}`
      }

      bookmarksData.push({
        sectionId,
        displayName,
        customName: bookmark.customName
      })
    }

    return bookmarksData
  } catch (error) {
    console.error('Error getting bookmarks data:', error)
    return []
  }
}
