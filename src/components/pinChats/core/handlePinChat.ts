import initPinnedChats from '@/components/pinChats/core/initPinnedChats'
import { closeNativeMenu } from '@/components/pinChats/helpers/sidebarTheme'
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
      (storage[`${profileId}`] as { urlId: string; title: string }[]) ?? []

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
    (storage[`${profileId}`] as { urlId: string; title: string }[]) ?? []

  // Check if the chat is already pinned
  if (urlId && !savedChats.some(chat => chat.urlId === urlId)) {
    pinButton?.remove()
    closeNativeMenu(chatOptionsMenu)

    let pinnedChatsList = document.querySelector<HTMLDivElement>(
      '#chatListContainer'
    )
    if (!pinnedChatsList) {
      // ChatGPT re-rendered the sidebar and took the board with it
      await initPinnedChats({ profileId, historyElement })
      pinnedChatsList = document.querySelector('#chatListContainer')
    }
    // Saved either way: the board shows it whenever it is mounted again
    pinnedChatsList?.prepend(
      createPinnedChat(chatTitle || '', urlId, profileId, historyElement)
    )

    // Add new chat at the beginning of the array (top of the list)
    savedChats.unshift({ urlId: urlId, title: chatTitle || '' })
    await browser.storage.sync.set({ [`${profileId}`]: savedChats })

    // Check if we should show the drag & drop notification (when reaching 2 pinned chats)
    await checkAndShowDragDropNotification(profileId)
  }
}
