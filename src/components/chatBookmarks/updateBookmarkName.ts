import getCompactDateString from '../utils/getCompactDateString'

export default async function updateBookmarkName({
  articleId,
  profileId,
  conversationId,
  customName,
}: {
  articleId: string
  profileId: string
  conversationId: string
  customName: string
}) {
  try {
    const dateStr = getCompactDateString()
    const key = `bm_${profileId}_${conversationId}_lastAccess_${dateStr}`
    const result = await browser.storage.sync.get(key)
    const bookmarks: any[] = result[key] || []

    // Find the bookmark and update the name
    const bookmarkIndex = bookmarks.findIndex(b => b.articleId === articleId)
    if (bookmarkIndex !== -1) {
      bookmarks[bookmarkIndex].customName = customName || null
      await browser.storage.sync.set({ [key]: bookmarks })
      console.log('Bookmark name updated successfully')
    } else {
      console.warn('Bookmark not found for update')
    }
  } catch (error) {
    console.error('Error updating bookmark name:', error)
    throw error
  }
}
