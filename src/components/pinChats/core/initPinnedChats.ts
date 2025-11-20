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

  // Strategy: Insert PinFlux Board BEFORE the Projects section
  // Projects section has a heading with text "Projects"
  let projectsSection: Element | null = null;
  
  // Find the Projects section by looking for its heading
  const allSections = document.querySelectorAll('.group\\/sidebar-expando-section');
  for (const section of allSections) {
    const heading = section.querySelector('h2');
    if (heading?.textContent?.includes('Projects')) {
      projectsSection = section;
      break;
    }
  }
  
  // If Projects section found, insert before it
  if (projectsSection && projectsSection.parentElement) {
    projectsSection.parentElement.insertBefore(pinnedSectionWrapper, projectsSection);
  } else {
    // Fallback: Insert before Chats section (original behavior)
    let targetParent = historyElement.parentElement;
    
    while (targetParent && !targetParent.classList.contains('group/sidebar-expando-section')) {
      targetParent = targetParent.parentElement;
    }
    
    const insertionParent = targetParent ? targetParent.parentElement : historyElement.parentElement;
    const referenceNode = targetParent || historyElement;
    
    if (insertionParent) {
      insertionParent.insertBefore(pinnedSectionWrapper, referenceNode);
    }
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
