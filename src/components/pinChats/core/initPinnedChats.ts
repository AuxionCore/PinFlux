import createPinnedContainerElement from '@/components/pinChats/helpers/createPinnedContainerElement'
import createPinnedChat from '@/components/pinChats/core/createPinnedChat'
import { getPinChatsFromStorage } from '@/components/utils/storage'
import setupPinnedChatsDragAndDrop from '@/components/pinChats/dragAndDrop/setupPinnedChatsDragAndDrop_SIMPLE'
import { findHistoryElement } from '@/components/pinChats/core/getHistoryElement'

/**
 * Oct 2026 app shell: the sidebar sections are siblings marked with
 * data-sidebar-project-container-id ("pinned", project ids, "chats"). Place the
 * board right after ChatGPT's own Pinned section — i.e. before Projects, where
 * it sat in the 2025 sidebar — or before Recents if there is no Pinned section.
 */
function insertIntoAppShell2026(section: HTMLElement): boolean {
  const nativePinned = document.querySelector(
    '[data-sidebar-project-container-id="pinned"]'
  );
  if (nativePinned) {
    nativePinned.after(section);
    return true;
  }

  const chats = document.querySelector(
    '[data-sidebar-project-container-id="chats"]'
  );
  const reference =
    chats?.closest('[data-chatgpt-project-conversation-drop-target]') ?? chats;
  if (reference) {
    reference.before(section);
    return true;
  }
  return false;
}

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

  if (!insertIntoAppShell2026(pinnedSectionWrapper)) {
    // 2025: Insert PinFlux Board BEFORE the Projects section
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

let boardObserver: MutationObserver | null = null

/**
 * The Oct 2026 sidebar is re-rendered by React often (navigation, collapsing
 * sections, ChatGPT's own pins changing), and each re-render can drop our
 * board. Put it back whenever it goes missing. Idempotent; one observer.
 */
export function keepPinnedBoardMounted(profileId: string): void {
  if (boardObserver) return

  let board = document.querySelector('[data-pinflux-section="true"]')
  let pending = false
  let lastAttempt = 0

  boardObserver = new MutationObserver(() => {
    // Cheap enough to run on every mutation batch, including while streaming
    if (board?.isConnected || pending) return
    board = document.querySelector('[data-pinflux-section="true"]')
    if (board) return

    pending = true
    setTimeout(async () => {
      pending = false
      if (document.querySelector('[data-pinflux-section="true"]')) return
      // Don't spin if the sidebar keeps rejecting the board
      if (Date.now() - lastAttempt < 1000) return
      // No sidebar right now (collapsed / mobile): wait for the next mutation
      const historyElement = findHistoryElement()
      if (!historyElement) return

      lastAttempt = Date.now()
      try {
        await initPinnedChats({ profileId, historyElement })
        board = document.querySelector('[data-pinflux-section="true"]')
      } catch (error) {
        console.error('[PinFlux] Failed to restore the pinned board:', error)
      }
    }, 200)
  })
  boardObserver.observe(document.body, { childList: true, subtree: true })
}
