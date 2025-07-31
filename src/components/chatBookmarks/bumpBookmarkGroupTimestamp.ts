import getCompactDateString from '../utils/getCompactDateString'

export default async function bumpBookmarkGroupTimestamp(
  profileId: string,
  conversationId: string
) {
  try {
    const result = await browser.storage.sync.get(null)
    const allKeys = Object.keys(result)

    // Unique key for this conversation
    const matchingKey = `bm_${profileId}_${conversationId}`
    const relevantKey = allKeys.find(key => key.startsWith(matchingKey))

    if (!relevantKey) {
      console.log(
        `No bookmarks found for conversation ${conversationId}, skipping bump.`
      )
      return
    }

    const bookmarks = result[relevantKey]
    console.log(`bookmarks for ${conversationId}:`, bookmarks)

    const dateStr = getCompactDateString()

    if (relevantKey.endsWith(dateStr)) {
      console.log(
        `No need to update timestamp for ${conversationId}, already set to today.`
      )
      return
    }

    const newKey = `bm_${profileId}_${conversationId}_lastAccess_${dateStr}`

    try {
      await browser.storage.sync.set({ [newKey]: bookmarks })
      try {
        await browser.storage.sync.remove(relevantKey)
      } catch (removeErr) {
        console.error(
          `Failed to remove old bookmark key ${relevantKey}:`,
          removeErr
        )
      }
    } catch (setErr) {
      console.error(`Failed to update timestamp for ${conversationId}:`, setErr)
    }
  } catch (err) {
    console.error(
      `bumpBookmarkGroupTimestamp failed for conversation ${conversationId}:`,
      err
    )
  }
}
