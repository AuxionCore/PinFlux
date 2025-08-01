const KEYS_LIMIT = 512
// Change this value to control how many keys are deleted at once
let DELETE_BATCH_SIZE = 5

function getDateFromBookmarkKey(key: string): number | null {
  const match = key.match(/_lastAccess_(\d{8})$/)
  if (!match) return null
  return parseInt(match[1], 10)
}

/**
 * Extracts the conversation ID from a bookmark storage key
 * @param key - The bookmark key in format: bm_${profileId}_${conversationId}_lastAccess_${dateStr}
 * @returns The conversation ID or null if the key format is invalid
 */
function extractConversationIdFromBookmarkKey(key: string): string | null {
  // Format: bm_${profileId}_${conversationId}_lastAccess_${dateStr}
  const match = key.match(/^bm_(.+?)_(.+?)_lastAccess_(\d{8})$/)
  if (!match) return null
  return match[2] // conversationId is the second capture group
}

/**
 * Extracts the profile ID from a bookmark storage key
 * @param key - The bookmark key in format: bm_${profileId}_${conversationId}_lastAccess_${dateStr}
 * @returns The profile ID or null if the key format is invalid
 */
function extractProfileIdFromBookmarkKey(key: string): string | null {
  // Format: bm_${profileId}_${conversationId}_lastAccess_${dateStr}
  const match = key.match(/^bm_(.+?)_(.+?)_lastAccess_(\d{8})$/)
  if (!match) return null
  return match[1] // profileId is the first capture group
}

/**
 * Checks if a conversation is currently pinned for a specific user profile
 * @param profileId - The user's profile identifier
 * @param conversationId - The conversation ID to check
 * @returns Promise that resolves to true if the conversation is pinned, false otherwise
 */
async function isConversationPinned(profileId: string, conversationId: string): Promise<boolean> {
  try {
    const storage = await browser.storage.sync.get([profileId])
    const savedPinChats: { urlId: string; title: string }[] = storage[profileId] || []
    return savedPinChats.some(chat => chat.urlId === conversationId)
  } catch (error) {
    console.error('Error checking if conversation is pinned:', error)
    return false
  }
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

/**
 * Ensures storage capacity by removing old bookmark keys while preserving bookmarks from pinned conversations.
 * 
 * This function implements a smart cleanup strategy:
 * 1. It first sorts all bookmark keys by date (oldest first)
 * 2. For each old bookmark, it checks if the conversation is pinned
 * 3. Only removes bookmarks from unpinned conversations
 * 4. If a conversation is pinned, it skips that bookmark and moves to the next older one
 * 
 * This ensures that important bookmarks from pinned conversations are preserved
 * even when storage capacity is reached.
 */
export default async function ensureKeysStorageCapacity() {
  const allKeys = await getAllBookmarkKeysSortedByDate()
  if (allKeys.length < KEYS_LIMIT) return

  // Calculate how many keys we need to remove
  const numToRemove = Math.min(
    DELETE_BATCH_SIZE,
    allKeys.length - KEYS_LIMIT + 1
  )
  
  const keysToRemove: string[] = []
  let checkedKeys = 0
  const maxKeysToCheck = Math.min(allKeys.length, numToRemove * 10) // Check up to 10x more keys if needed
  
  for (const key of allKeys) {
    if (keysToRemove.length >= numToRemove) break
    if (checkedKeys >= maxKeysToCheck) break
    
    checkedKeys++
    
    const profileId = extractProfileIdFromBookmarkKey(key)
    const conversationId = extractConversationIdFromBookmarkKey(key)
    
    if (!profileId || !conversationId) {
      // If we can't extract the IDs, remove the key (malformed)
      keysToRemove.push(key)
      continue
    }
    
    const isPinned = await isConversationPinned(profileId, conversationId)
    
    if (!isPinned) {
      // Only remove bookmarks from unpinned conversations
      keysToRemove.push(key)
    }
    // If the conversation is pinned, skip this bookmark and continue to the next one
  }
  
  if (keysToRemove.length === 0) {
    console.warn('All checked oldest bookmarks are from pinned conversations. Cannot remove any bookmarks to free up space.')
    return
  }
  
  try {
    await browser.storage.sync.remove(keysToRemove)
    console.log(`Removed ${keysToRemove.length} bookmark keys to maintain storage capacity (checked ${checkedKeys} keys total)`)
  } catch (error) {
    console.error('Failed to remove old bookmark keys:', error)
  }
}
