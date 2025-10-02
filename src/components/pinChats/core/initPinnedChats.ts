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
  // Check if PinFlux section already exists to prevent duplicates
  const existingSection = document.querySelector('[data-pinflux-section="true"]');
  if (existingSection) {
    console.log('PinFlux Board already exists, skipping initialization');
    
    // Just update the pinned chats content if needed
    const pinnedChats = existingSection.querySelector('#chatListContainer') as HTMLDivElement;
    if (pinnedChats) {
      // Clear existing chats
      pinnedChats.innerHTML = '';
      
      // Reload pinned chats from storage
      if (!profileId) {
        console.error('Profile ID not found. Pinned chats will not be displayed.');
        return;
      }
      const savedPinChats = await getPinChatsFromStorage(profileId);
      savedPinChats.forEach(chat => {
        const pinnedChat = createPinnedChat(
          chat.title,
          chat.urlId,
          profileId,
          historyElement
        );
        pinnedChats.appendChild(pinnedChat);
      });
      
      // Re-enable drag & drop
      setupPinnedChatsDragAndDrop(pinnedChats, profileId);
    }
    return;
  }

  const pinnedSectionWrapper = createPinnedContainerElement()

  // Find the parent section wrapper that contains the history element
  // This is the "Chats" section with class "group/sidebar-expando-section"
  let targetParent = historyElement.parentElement;
  
  // Navigate up to find the section wrapper (if it exists)
  while (targetParent && !targetParent.classList.contains('group/sidebar-expando-section')) {
    targetParent = targetParent.parentElement;
  }
  
  // If we found the section wrapper, insert before it; otherwise use the direct parent
  const insertionParent = targetParent ? targetParent.parentElement : historyElement.parentElement;
  const referenceNode = targetParent || historyElement;
  
  if (insertionParent) {
    insertionParent.insertBefore(pinnedSectionWrapper, referenceNode);
  }
  
  const pinnedChats = pinnedSectionWrapper.querySelector(
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
