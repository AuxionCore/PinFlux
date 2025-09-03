import createPinnedContainerElement from '@/components/pinChats/helpers/createPinnedContainerElement'
import createPinnedChat from '@/components/pinChats/core/createPinnedChat'
import { getPinChatsFromStorage } from '@/components/utils/storage'
import setupPinnedChatsDragAndDrop from '@/components/pinChats/dragAndDrop/setupPinnedChatsDragAndDrop_SIMPLE'

export default async function initPinnedChats({
  profileId,
  historyElement,
}: {
  profileId: string
  historyElement: HTMLElement
}): Promise<void> {
  const pinnedContainer = createPinnedContainerElement()

  const parentElement = historyElement.parentElement as HTMLDivElement
  parentElement.insertBefore(pinnedContainer, historyElement)
  const pinnedChats = pinnedContainer.querySelector(
    '#chatListContainer'
  ) as HTMLDivElement

  // Load pinned chats from storage
  if (!profileId) {
    console.error('Profile ID not found. Pinned chats will not be displayed.')
    return
  }
  const savedPinChats = await getPinChatsFromStorage(profileId)
  savedPinChats.forEach(chat => {
    const pinnedChat = createPinnedChat(
      chat.title,
      chat.urlId,
      profileId,
      historyElement
    )
    pinnedChats.appendChild(pinnedChat) // Use appendChild to maintain order
  })

  // Enable drag & drop for pinned chats (after all elements are in DOM)
  if (pinnedChats) {
    setupPinnedChatsDragAndDrop(pinnedChats, profileId)
  }
}
