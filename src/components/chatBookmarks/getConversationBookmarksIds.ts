import getCompactDateString from '../utils/getCompactDateString'

export default async function getConversationBookmarksIds(
  profileId: string,
  conversationId: string
): Promise<string[]> {
  const keyPrefix = `bm_${profileId}_${conversationId}_lastAccess_`
  let allBookmarks: any[] = []
  try {
    const all = await browser.storage.sync.get(null)
    for (const key of Object.keys(all)) {
      if (key.startsWith(keyPrefix)) {
        const bookmarks: any[] = all[key] || []
        allBookmarks = allBookmarks.concat(bookmarks)
      }
    }
  } catch (error) {
    console.error('Failed to get conversation bookmarks:', error)
    return []
  }
  const bookmarkedIds = allBookmarks.map(bookmark => bookmark.articleId)
  return bookmarkedIds
}
