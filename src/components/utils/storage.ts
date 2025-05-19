async function getStorageData(profileId: string): Promise<{
  savedPinChats: { urlId: string; title: string }[];
  // savedBookmarks: { urlId: string; title: string }[];
}> {
  try {
    if (!profileId) {
      throw new Error("Profile ID not found, cannot retrieve storage data.");
    }

    const storage = await browser.storage.sync.get([`${profileId}`]);
    const savedPinChats: { urlId: string; title: string }[] =
      storage[`${profileId}`] || [];
    // const savedBookmarks: { urlId: string; title: string }[] =
    //   storage[`${profileId}`] || [];
    return {
      savedPinChats,
      // savedBookmarks,
    };
  } catch (error) {
    console.error(error);
    return {
      savedPinChats: [],
      // savedBookmarks: [],
    };
  }
}

export async function getPinChatsFromStorage(
  profileId: string
): Promise<{ urlId: string; title: string }[]> {
  try {
    const storageData = await getStorageData(profileId);
    return storageData.savedPinChats || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function savePinChatToStorage(
  profileId: string,
  urlId: string,
  chatTitle: string
): Promise<void> {
  try {
    const storageData = await getStorageData(profileId);

    const savedPinChats: { urlId: string; title: string }[] =
      storageData.savedPinChats || [];

    // Check if the chat is already saved
    if (urlId && !savedPinChats.some((chat) => chat.urlId === urlId)) {
      savedPinChats.push({ urlId, title: chatTitle || "" });
      await browser.storage.sync.set({ [`${profileId}`]: savedPinChats });
    }
  } catch (error) {
    console.error(error);
  }
}

export async function removePinChatFromStorage(
  profileId: string,
  urlId: string
): Promise<void> {
  try {
    const storageData = await getStorageData(profileId);

    const savedPinChats: { urlId: string; title: string }[] =
      storageData.savedPinChats || [];

    // Remove the chat from saved chats
    const index = savedPinChats.findIndex((chat) => chat.urlId === urlId);
    if (index !== -1) {
      savedPinChats.splice(index, 1);
      await browser.storage.sync.set({ [`${profileId}`]: savedPinChats });
    }
  } catch (error) {
    console.error(error);
  }
}

export async function renamePinChatInStorage(
  profileId: string,
  urlId: string,
  newTitle: string
): Promise<void> {
  try {
    const storageData = await getStorageData(profileId);

    const savedPinChats: { urlId: string; title: string }[] =
      storageData.savedPinChats || [];

    // Find the chat and update its title
    const chatIndex = savedPinChats.findIndex((chat) => chat.urlId === urlId);
    if (chatIndex !== -1) {
      savedPinChats[chatIndex].title = newTitle;
      browser.storage.sync.set({ [`${profileId}`]: savedPinChats });
    }
  } catch (error) {
    console.error(error);
  }
}
