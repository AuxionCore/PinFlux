import ensureKeysStorageCapacity from '../utils/ensureKeysStorageCapacity'
import getCompactDateString from '../utils/getCompactDateString'

export default async function saveBookmark({
  articleId,
  profileId,
  conversationId,
  customName,
}: {
  articleId: string
  profileId: string
  conversationId: string
  customName?: string
}) {
  try {
    const dateStr = getCompactDateString()
    const key = `bm_${profileId}_${conversationId}_lastAccess_${dateStr}`
    const newBookmark = { 
      articleId: articleId,
      customName: customName || null,
      timestamp: Date.now()
    }
    const result = await browser.storage.sync.get(key)

    if (key in result) {
      const bookmarks: any[] = result[key] || []

      const alreadyExists = bookmarks.some(b => b['articleId'] === articleId)
      if (alreadyExists) {
        return
      }

      // Check if we have enough capacity QUOTA_BYTES_PER_ITEM
      const itemSize = new Blob([JSON.stringify(newBookmark)]).size
      const currentSize = new Blob([JSON.stringify(bookmarks)]).size

      if (currentSize + itemSize > browser.storage.sync.QUOTA_BYTES_PER_ITEM) {
        window.alert(
          'Not enough storage capacity to save the bookmark. Please remove some bookmarks first.'
        )

        console.warn('Not enough storage capacity to save the bookmark')
        return
      }

      const updatedBookmarks = [...bookmarks, newBookmark]
      await browser.storage.sync.set({ [key]: updatedBookmarks })
    } else {
      await ensureKeysStorageCapacity()
      await browser.storage.sync.set({ [key]: [newBookmark] })
    }
  } catch (error) {
    console.error('Failed to save bookmark:', error)
  }
}
