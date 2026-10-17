import getProfileId from '@/components/utils/getProfileId'
import getHistoryElement from '@/components/pinChats/core/getHistoryElement'
import initPinnedChats, {
  keepPinnedBoardMounted,
} from '@/components/pinChats/core/initPinnedChats'
import createPinButton from './pinButton/PinButton'
import createUnpinButton from './pinButton/UnpinButton'
import setupUnpinChatListener from '@/components/pinChats/core/setupUnpinChatListener'
import handleDragStart from '@/components/pinChats/dragAndDrop/handleDragStart'
import handleDragEnd from '@/components/pinChats/dragAndDrop/handleDragEnd'
import handlePinChat from '@/components/pinChats/core/handlePinChat'
import pinCurrentConversation from '@/components/pinChats/core/pinCurrentConversation'
import { showTooltipOnce } from '@/components/pinChats/helpers/showTooltipOnce'
import { showOneTimeNotification } from '@/components/utils/notifications'
import { matchNativeMenuItem } from '@/components/pinChats/helpers/sidebarTheme'
import { isPinningAvailable } from '@/components/utils/pinningAvailability'

import {
  getPinChatsFromStorage,
  removePinChatFromStorage,
} from '../utils/storage'

// Handle rename chat button click
// function handleRenameChat(li: HTMLLIElement, profileId: string): void {
//   const a = li.querySelector("a");
//   if (!a) return;

//   const titleDiv = li.querySelector("a")?.querySelector("div");
//   if (!titleDiv) return;

//   const originalTitle = titleDiv.textContent?.trim() || "";
//   const input = document.createElement("input");
//   input.className =
//     "border-token-border-default w-full border bg-transparent p-0 text-sm z-100";
//   input.type = "text";
//   input.value = originalTitle;

//   const chatOptionsBtnRaper = li.querySelector(".absolute") as HTMLDivElement;
//   const chatOptionsBtn = li.querySelector("button");
//   if (chatOptionsBtn) {
//     chatOptionsBtnRaper.className =
//       "bg-token-sidebar-surface-secondary absolute start-[7px] end-2 top-0 bottom-0 flex items-center z-10";
//     chatOptionsBtn.remove();
//     chatOptionsBtnRaper.appendChild(input);
//     chatOptionsBtnRaper.style.pointerEvents = "auto";
//   }

//   input.focus();

//   const cleanup = () => {
//     input.remove();
//     chatOptionsBtnRaper.className =
//       "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 flex";
//     chatOptionsBtnRaper.appendChild(chatOptionsBtn as HTMLButtonElement);
//   };

//   const finishEditing = async () => {
//     const newValue = input.value.trim();

//     if (!newValue) {
//       titleDiv.textContent = originalTitle;
//     } else if (newValue !== originalTitle) {
//       titleDiv.textContent = newValue;

//       // Save the new title to storage
//       const urlId = a?.getAttribute("id");
//       const storage = await browser.storage.sync.get([`${profileId}`]);
//       const savedChats: { urlId: string; title: string }[] =
//         storage[`${profileId}`] || [];
//       const chatIndex = savedChats.findIndex((chat) => chat.urlId === urlId);
//       if (chatIndex !== -1) {
//         savedChats[chatIndex].title = newValue;
//         browser.storage.sync.set({ [`${profileId}`]: savedChats });
//       }
//     }

//     cleanup();
//   };

//   const cancelEditing = () => {
//     titleDiv.textContent = originalTitle;
//     cleanup();
//   };

//   input.addEventListener("blur", finishEditing, { once: true });

//   input.addEventListener("keydown", (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       input.blur();
//     } else if (e.key === "Escape") {
//       e.preventDefault();
//       cancelEditing();
//     }
//   });
// }

let initialization: Promise<void> | null = null

/**
 * Sets up pinned chats once per page. content.ts calls this again on SPA
 * navigation whenever the board is missing; running the body twice stacked a
 * second set of global click listeners (duplicate Pin items in menus). The
 * board itself is restored by keepPinnedBoardMounted.
 */
export default function initContentScript(): Promise<void> {
  initialization ??= setUpPinnedChats()
  return initialization
}

async function setUpPinnedChats(): Promise<void> {
  let unpinChatHandler: ((event: MouseEvent) => Promise<void>) | null = null

  try {
    // Retired in favor of ChatGPT's native pinning (#23): new users never get
    // it, existing users keep it until PINNING_SUNSET. Data stays in storage.
    if (!(await isPinningAvailable())) return

    const profileId = await getProfileId()
    const historyElement = await getHistoryElement()

    // Create pin and unpin buttons
    const unpinButton: HTMLDivElement = createUnpinButton()

    await initPinnedChats({
      profileId,
      historyElement,
    })
    keepPinnedBoardMounted(profileId)

    // Show drag and drop notification for existing users who already have 2+ pinned chats
    setTimeout(async () => {
      try {
        const pinnedChats = await getPinChatsFromStorage(profileId)
        if (pinnedChats.length >= 2) {
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
    }, 1000)

    // Tutorial auto-start and the popup's start-tutorial message are handled
    // in content.ts, for every user. They used to be duplicated here, which
    // started the tutorial twice.

    browser.runtime.onMessage.addListener(async message => {
      if (message.action === 'pin-current-chat') {
        try {
          await pinCurrentConversation()
        } catch (error) {
          console.error('Failed to pin current conversation:', error)
        }
      }
    })
    // const notification = await browser.storage.sync.get(
    //   "notification"
    // );
    // if (notification.showShortcutsNotification) {
    //   showTooltipOnce();

    //   browser.storage.sync.set({
    //     showShortcutsNotification: false,
    //   });
    // }

    // TODO: Implement drag and drop functionality
    historyElement.addEventListener('dragstart', handleDragStart)
    historyElement.addEventListener('dragend', handleDragEnd)

    // Handle click events in the sidebar and projects section
    document.body.addEventListener('click', async (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest(
        // Oct 2026: the row's menu button; 2025: history-item options / trailing button
        '[data-sidebar-chatgpt-conversation-key] button[aria-haspopup="menu"], [data-testid^="history-item-"][data-testid$="-options"], [data-testid="undefined-options"], [data-trailing-button]'
      )
      
      // Only process if the target is a menu button (has data-trailing-button or is options button)
      if (!target) {
        return
      }
      
      // 2025 nested the button inside the link; Oct 2026 puts it beside it
      const chatLink = (target.closest('a') ??
        target
          .closest('[data-sidebar-chatgpt-conversation-key]')
          ?.querySelector('a[href*="/c/"]')) as HTMLAnchorElement | null
      const chatUrl = chatLink?.getAttribute('href') as string
      
      // Extract urlId from both regular chats (/c/{id}) and project chats (/g/g-p-{projectId}/c/{id})
      let urlId = ''
      if (chatUrl) {
        const urlSegments = chatUrl.split('/').filter(Boolean)
        const cIndex = urlSegments.indexOf('c')
        if (cIndex !== -1 && cIndex < urlSegments.length - 1) {
          urlId = urlSegments[cIndex + 1]
        }
      }
      
      const chatTitle = (
        chatLink?.querySelector('[data-thread-title]') ??
        chatLink?.querySelector('span')
      )?.textContent
      if (target) {
        // Small delay to ensure menu is rendered
        setTimeout(async () => {
          const chatOptionsMenu = document.querySelector(
            'div[data-radix-menu-content][role="menu"][aria-orientation="vertical"]'
          ) as HTMLDivElement

          if (chatOptionsMenu) {
            // Remove any existing PIN/UNPIN buttons first to prevent duplicates
            const existingPinButton = chatOptionsMenu.querySelector('[data-pinflux-pin-button]')
            const existingUnpinButton = chatOptionsMenu.querySelector('[data-pinflux-unpin-button]')
            
            if (existingPinButton) existingPinButton.remove()
            if (existingUnpinButton) existingUnpinButton.remove()
            
            if (urlId && chatTitle) {
              // Check pinned status and display the appropriate button
              const savedPinChats = await getPinChatsFromStorage(profileId)
              if (savedPinChats.some(chat => chat.urlId === urlId)) {
                const unpinBtn = createUnpinButton()
                matchNativeMenuItem(unpinBtn, chatOptionsMenu)
                chatOptionsMenu.prepend(unpinBtn)
                setupUnpinChatListener(profileId, urlId, unpinBtn, null)
              } else {
                const pinButton = createPinButton()
                matchNativeMenuItem(pinButton, chatOptionsMenu)
                chatOptionsMenu.prepend(pinButton)
                
                async function pinChatHandler(event: MouseEvent) {
                  event.stopPropagation()
                  await handlePinChat(urlId, chatTitle!, pinButton, chatOptionsMenu)
                }
                pinButton.addEventListener('click', pinChatHandler)
              }
            }

            const deleteButton = chatOptionsMenu.querySelector(
              '[data-testid="delete-chat-menu-item"]'
            )

            if (deleteButton) {
              deleteButton.addEventListener('click', async () => {
                setTimeout(() => {
                  const deleteConversationConfirmButton = document.querySelector(
                    '[data-testid="delete-conversation-confirm-button"]'
                  ) as HTMLButtonElement

                  if (deleteConversationConfirmButton) {
                    deleteConversationConfirmButton.addEventListener(
                      'click',
                      async () => {
                        const pinnedContainer = document.querySelector(
                          '#pinnedContainer'
                        ) as HTMLElement
                        if (urlId) {
                          const pinnedChat = pinnedContainer.querySelector(
                            `a[href="https://chatgpt.com/c/${urlId}"]`
                          )

                          if (pinnedChat) {
                            pinnedChat.remove()
                          }
                          await removePinChatFromStorage(profileId, urlId)
                        }
                      }
                    )
                  }
                }, 100)
              })
            }
          }
        }, 50) // Small delay to ensure menu is rendered
      }
    })

    // Use event delegation on document.body to catch conversation options button clicks
    // This works even when navigating between chats in SPA
    document.body.addEventListener('click', async (event: MouseEvent) => {
      const conversationOptionsButton = (event.target as HTMLElement)?.closest(
        // Oct 2026: the titlebar's menu button ("More"); 2025: options button
        '[data-app-shell-main-titlebar] button[aria-haspopup="menu"], [data-testid="conversation-options-button"]'
      ) as HTMLButtonElement
      
      if (!conversationOptionsButton) {
        return
      }
      
      // Wait a bit for the menu to render
      setTimeout(async () => {
        const chatOptionsMenu = document.querySelector(
          'div[data-radix-menu-content][role="menu"][aria-orientation="vertical"]'
        ) as HTMLDivElement

        if (chatOptionsMenu) {
          // Get current conversation URL and extract urlId
          const currentUrl = window.location.pathname
          const urlSegments = currentUrl.split('/').filter(Boolean)
          let urlId = ''
          
          // Support both regular chats (/c/{id}) and project chats (/g/g-p-{projectId}/c/{id})
          const cIndex = urlSegments.indexOf('c')
          if (cIndex !== -1 && cIndex < urlSegments.length - 1) {
            urlId = urlSegments[cIndex + 1]
          }

            // Get chat title - try to find in sidebar first for accuracy
            let chatTitle = 'Untitled'
            
            // First, try to find the link in the sidebar with matching urlId
            const currentLink = historyElement.querySelector(`a[href*="/c/${urlId}"]`)
            if (currentLink) {
              const linkTitle = currentLink.querySelector('span')?.textContent?.trim()
              if (linkTitle) {
                chatTitle = linkTitle
              }
            }
            
            // If not found in sidebar, try document.title as fallback
            if (!chatTitle || chatTitle === 'Untitled') {
              const documentTitle = document.querySelector('title')?.textContent || ''
              if (documentTitle) {
                // Remove " | ChatGPT" suffix and split by " - " to get just the chat name
                const titleParts = documentTitle.split('|')[0].trim().split(' - ')
                // Take the first part (chat name) without project name
                chatTitle = titleParts[0].trim() || 'Untitled'
              }
            }

            // Remove any existing PIN/UNPIN buttons first to prevent duplicates
            const existingPinButton = chatOptionsMenu.querySelector('[data-pinflux-pin-button]')
            const existingUnpinButton = chatOptionsMenu.querySelector('[data-pinflux-unpin-button]')
            
            if (existingPinButton) existingPinButton.remove()
            if (existingUnpinButton) existingUnpinButton.remove()
            
            if (urlId) {
              // Check pinned status and display the appropriate button
              const savedPinChats = await getPinChatsFromStorage(profileId)
              if (savedPinChats.some(chat => chat.urlId === urlId)) {
                const unpinBtn = createUnpinButton()
                matchNativeMenuItem(unpinBtn, chatOptionsMenu)
                chatOptionsMenu.prepend(unpinBtn)
                setupUnpinChatListener(profileId, urlId, unpinBtn, null)
              } else {
                const pinButton = createPinButton()
                matchNativeMenuItem(pinButton, chatOptionsMenu)
                chatOptionsMenu.prepend(pinButton)
                
                async function pinChatHandler(event: MouseEvent) {
                  event.stopPropagation()
                  await handlePinChat(urlId, chatTitle, pinButton, chatOptionsMenu)
                }
                pinButton.addEventListener('click', pinChatHandler)
              }
            }

            const deleteButton = chatOptionsMenu.querySelector(
              '[data-testid="delete-chat-menu-item"]'
            )
            if (deleteButton) {
              deleteButton.addEventListener('click', async () => {
                setTimeout(() => {
                  const deleteConversationConfirmButton = document.querySelector(
                    '[data-testid="delete-conversation-confirm-button"]'
                  ) as HTMLButtonElement

                  if (deleteConversationConfirmButton) {
                    deleteConversationConfirmButton.addEventListener(
                      'click',
                      async () => {
                        const pinnedContainer = document.querySelector(
                          '#pinnedContainer'
                        ) as HTMLElement
                        // Only the deleted conversation — this used to loop
                        // over every saved pin and remove them all
                        if (profileId && urlId) {
                          pinnedContainer
                            ?.querySelector(
                              `a[href="https://chatgpt.com/c/${urlId}"]`
                            )
                            ?.remove()
                          await removePinChatFromStorage(profileId, urlId)
                        }
                      }
                    )
                  }
                }, 100)
              })
            }
          }
        }, 50) // Small delay to ensure menu is rendered
    })
  } catch (error) {
    console.error(error)
  }
}
