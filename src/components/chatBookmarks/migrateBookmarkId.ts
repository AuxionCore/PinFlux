import getCompactDateString from '../utils/getCompactDateString'

/**
 * Re-keys one bookmark from its pre-Oct-2026 ID (conversation-turn-N-i) to the
 * message-UUID form (msg-<id>-i). The old ID is kept as `legacyId`, so a wrong
 * turn mapping can be detected and undone later instead of losing the bookmark.
 */
export default async function migrateBookmarkId({
  fromId,
  toId,
  profileId,
  conversationId,
}: {
  fromId: string
  toId: string
  profileId: string
  conversationId: string
}): Promise<boolean> {
  try {
    const dateStr = getCompactDateString()
    const key = `bm_${profileId}_${conversationId}_lastAccess_${dateStr}`
    const result = await browser.storage.sync.get(key)
    const bookmarks: any[] = result[key] || []

    const bookmark = bookmarks.find(b => b.articleId === fromId)
    if (!bookmark || bookmarks.some(b => b.articleId === toId)) return false

    bookmark.legacyId = fromId
    bookmark.articleId = toId
    await browser.storage.sync.set({ [key]: bookmarks })
    return true
  } catch (error) {
    console.error('Error migrating bookmark ID:', error)
    return false
  }
}
