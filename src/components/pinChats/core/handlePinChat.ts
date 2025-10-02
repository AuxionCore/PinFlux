import getProfileId from '@/components/utils/getProfileId'
import createPinnedChat from '@/components/pinChats/core/createPinnedChat'
import getHistoryElement from '@/components/pinChats/core/getHistoryElement'
import { showOneTimeNotification } from '@/components/utils/notifications'

// Function to check and show drag & drop notification when reaching 2 pinned chats
async function checkAndShowDragDropNotification(
  profileId: string
): Promise<void> {
  try {
    const storage = await browser.storage.sync.get([`${profileId}`])
    const savedChats: { urlId: string; title: string }[] =
      storage[`${profileId}`] || []

    if (savedChats.length >= 2) {
      showOneTimeNotification({
        id: 'drag_drop_feature_v2_1_1',
        title: '', // Will use localized text
        message: '', // Will use localized text
        version: '2.1.1',
        type: 'success',
        duration: 15000,
      })
    }
  } catch (error) {
    console.error('Failed to check pinned chats for notification:', error)
  }
}

// Handle pinning a chat
export default async function handlePinChat(
  urlId: string,
  chatTitle: string,
  pinButton?: HTMLDivElement,
  chatOptionsMenu?: HTMLDivElement
): Promise<void> {
  const profileId = await getProfileId()
  if (!profileId) {
    console.error('Profile ID not found. Cannot pin chat.')
    return
  }

  const historyElement = await getHistoryElement()
  if (!historyElement) {
    console.error('History element not found. Cannot pin chat.')
    return
  }

  const storage = await browser.storage.sync.get([`${profileId}`])
  const savedChats: { urlId: string; title: string }[] =
    storage[`${profileId}`] || []

  // Check if the chat is already pinned
  if (urlId && !savedChats.some(chat => chat.urlId === urlId)) {
    pinButton?.remove()
    chatOptionsMenu?.remove()

    const pinnedChatsList = document.querySelector(
      '#chatListContainer'
    ) as HTMLDivElement
    const newPinnedChat = createPinnedChat(
      chatTitle || '',
      urlId,
      profileId,
      historyElement
    )
    pinnedChatsList.prepend(newPinnedChat)

    // Add new chat at the beginning of the array (top of the list)
    savedChats.unshift({ urlId: urlId, title: chatTitle || '' })
    await browser.storage.sync.set({ [`${profileId}`]: savedChats })

    // Check if we should show the drag & drop notification (when reaching 2 pinned chats)
    await checkAndShowDragDropNotification(profileId)
  }
}
