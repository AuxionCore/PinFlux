/**
 * Retrieves storage data for a specific user profile
 * @param profileId - The user's profile identifier
 * @returns Promise containing saved pin chats and bookmarks for the profile
 */
async function getStorageData(profileId: string): Promise<{
  savedPinChats: { urlId: string; title: string }[]
  // savedBookmarks: { urlId: string; title: string }[];
}> {
  try {
    if (!profileId) {
      throw new Error('Profile ID not found, cannot retrieve storage data.')
    }

    const storage = await browser.storage.sync.get([`${profileId}`])
    const savedPinChats: { urlId: string; title: string }[] =
      storage[`${profileId}`] || []
    // const savedBookmarks: { urlId: string; title: string }[] =
    //   storage[`${profileId}`] || [];
    return {
      savedPinChats,
      // savedBookmarks,
    }
  } catch (error) {
    console.error(error)
    return {
      savedPinChats: [],
      // savedBookmarks: [],
    }
  }
}

/**
 * Retrieves all pinned chats for a specific user profile from storage
 * @param profileId - The user's profile identifier
 * @returns Promise that resolves to an array of pinned chat objects
 */
export async function getPinChatsFromStorage(
  profileId: string
): Promise<{ urlId: string; title: string }[]> {
  try {
    const storageData = await getStorageData(profileId)
    return storageData.savedPinChats || []
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * Saves a new pinned chat to storage for a specific user profile
 * @param profileId - The user's profile identifier
 * @param urlId - The unique identifier for the chat URL
 * @param chatTitle - The title/name of the chat to be pinned
 */
export async function savePinChatToStorage(
  profileId: string,
  urlId: string,
  chatTitle: string
): Promise<void> {
  try {
    const storageData = await getStorageData(profileId)

    const savedPinChats: { urlId: string; title: string }[] =
      storageData.savedPinChats || []

    // Check if the chat is already saved to avoid duplicates
    if (urlId && !savedPinChats.some(chat => chat.urlId === urlId)) {
      savedPinChats.push({ urlId, title: chatTitle || '' })
      await browser.storage.sync.set({ [`${profileId}`]: savedPinChats })
    }
  } catch (error) {
    console.error(error)
  }
}

/**
 * Removes a pinned chat from storage for a specific user profile
 * @param profileId - The user's profile identifier
 * @param urlId - The unique identifier for the chat URL to be removed
 */
export async function removePinChatFromStorage(
  profileId: string,
  urlId: string
): Promise<void> {
  try {
    const storageData = await getStorageData(profileId)

    const savedPinChats: { urlId: string; title: string }[] =
      storageData.savedPinChats || []

    // Remove the chat from saved chats
    const index = savedPinChats.findIndex(chat => chat.urlId === urlId)
    if (index !== -1) {
      savedPinChats.splice(index, 1)
      await browser.storage.sync.set({ [`${profileId}`]: savedPinChats })
    }
  } catch (error) {
    console.error(error)
  }
}

/**
 * Updates the title of a pinned chat in storage
 * @param profileId - The user's profile identifier
 * @param urlId - The unique identifier for the chat URL
 * @param newTitle - The new title to assign to the pinned chat
 */
export async function renamePinChatInStorage(
  profileId: string,
  urlId: string,
  newTitle: string
): Promise<void> {
  try {
    const storageData = await getStorageData(profileId)

    const savedPinChats: { urlId: string; title: string }[] =
      storageData.savedPinChats || []

    // Find the chat and update its title
    const chatIndex = savedPinChats.findIndex(chat => chat.urlId === urlId)
    if (chatIndex !== -1) {
      savedPinChats[chatIndex].title = newTitle
      browser.storage.sync.set({ [`${profileId}`]: savedPinChats })
    }
  } catch (error) {
    console.error(error)
  }
}

/**
 * Updates the order of pinned chats in storage based on current DOM order
 * @param profileId - The user's profile identifier
 * @param orderedUrlIds - Array of urlIds in the desired order
 */
export async function updatePinChatsOrder(
  profileId: string,
  orderedUrlIds: string[]
): Promise<void> {
  try {
    const storageData = await getStorageData(profileId)
    const savedPinChats: { urlId: string; title: string }[] =
      storageData.savedPinChats || []

    // Reorder the savedPinChats array according to orderedUrlIds
    const reorderedChats: { urlId: string; title: string }[] = []

    orderedUrlIds.forEach(urlId => {
      const chat = savedPinChats.find(chat => chat.urlId === urlId)
      if (chat) {
        reorderedChats.push(chat)
      }
    })

    // Add any chats that weren't in the orderedUrlIds (safety fallback)
    savedPinChats.forEach(chat => {
      if (!orderedUrlIds.includes(chat.urlId)) {
        reorderedChats.push(chat)
      }
    })

    await browser.storage.sync.set({ [`${profileId}`]: reorderedChats })
  } catch (error) {
    console.error(error)
  }
}
