import getCompactDateString from '../utils/getCompactDateString'

interface Bookmark {
  articleId: string
  [key: string]: any // Add more properties as needed
}

export default async function deleteBookmark({
  articleId,
  profileId,
  conversationId,
}: {
  articleId: string
  profileId: string
  conversationId: string
}) {
  const dateStr = getCompactDateString()
  const key = `bm_${profileId}_${conversationId}_lastAccess_${dateStr}`

  try {
    const result = await browser.storage.sync.get(key)
    const existing: Bookmark[] = result[key] || []

    const updated = existing.filter(b => b.articleId !== articleId)

    // If no bookmarks left, remove the key
    if (updated.length === 0) {
      await browser.storage.sync.remove(key)

      return
    }

    await browser.storage.sync.set({ [key]: updated })
  } catch (error) {
    console.error(`Failed to remove bookmark for ${articleId}:`, error)
    throw error
  }
}
