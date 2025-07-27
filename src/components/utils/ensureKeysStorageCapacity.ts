const KEYS_LIMIT = 512
// Change this value to control how many keys are deleted at once
let DELETE_BATCH_SIZE = 1

function getDateFromBookmarkKey(key: string): number | null {
  const match = key.match(/_lastAccess_(\d{8})$/)
  if (!match) return null
  return parseInt(match[1], 10)
}

async function getAllBookmarkKeysSortedByDate(): Promise<string[]> {
  const all = await browser.storage.sync.get(null)
  return Object.keys(all)
    .filter(key => key.startsWith('bm_') && key.includes('_lastAccess_'))
    .map(key => ({
      key,
      date: getDateFromBookmarkKey(key) ?? 0,
    }))
    .sort((a, b) => a.date - b.date)
    .map(obj => obj.key)
}

export default async function ensureKeysStorageCapacity() {
  const allKeys = await getAllBookmarkKeysSortedByDate()
  if (allKeys.length < KEYS_LIMIT) return

  // Remove the oldest keys to maintain capacity
  const numToRemove = Math.min(
    DELETE_BATCH_SIZE,
    allKeys.length - KEYS_LIMIT + 1
  )
  const keysToRemove = allKeys.slice(0, numToRemove)
  try {
    await browser.storage.sync.remove(keysToRemove)
  } catch (error) {
    console.error('Failed to remove old bookmark keys:', error)
  }
}
