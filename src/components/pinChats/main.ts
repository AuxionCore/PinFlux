import getProfileId from '@/components/utils/getProfileId'
import getHistoryElement from '@/components/pinChats/core/getHistoryElement'
import initPinnedChats from '@/components/pinChats/core/initPinnedChats'
import createPinButton from './pinButton/PinButton'
import createUnpinButton from './pinButton/UnpinButton'
import setupUnpinChatListener from '@/components/pinChats/core/setupUnpinChatListener'
import handleDragStart from '@/components/pinChats/dragAndDrop/handleDragStart'
import handleDragEnd from '@/components/pinChats/dragAndDrop/handleDragEnd'
import handlePinChat from '@/components/pinChats/core/handlePinChat'
import pinCurrentConversation from '@/components/pinChats/core/pinCurrentConversation'
import { showTooltipOnce } from '@/components/pinChats/helpers/showTooltipOnce'
import { showOneTimeNotification } from '@/components/utils/notifications'
import { tutorialManager } from '@/components/tutorial/tutorialManager'

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

export default async function initContentScript(): Promise<void> {
  let unpinChatHandler: ((event: MouseEvent) => Promise<void>) | null = null

  try {
    const profileId = await getProfileId()
    const historyElement = await getHistoryElement()

    // Create pin and unpin buttons
    const unpinButton: HTMLDivElement = createUnpinButton()

    await initPinnedChats({
      profileId,
      historyElement,
    })

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

    // Check if tutorial should auto-start for new users
    setTimeout(async () => {
      try {
        if (await tutorialManager.shouldAutoStart()) {
          // Wait a bit more for the UI to fully load
          setTimeout(() => {
            tutorialManager.startTutorial()
          }, 2000)
        }
      } catch (error) {
        console.error('Failed to check tutorial auto-start:', error)
      }
    }, 1500)

    browser.runtime.onMessage.addListener(async message => {
      if (message.action === 'pin-current-chat') {
        try {
          await pinCurrentConversation()
        } catch (error) {
          console.error('Failed to pin current conversation:', error)
        }
      } else if (message.action === 'start-tutorial') {
        // Handle tutorial start request from popup
        try {
          await tutorialManager.startTutorial(message.featureId, true)
        } catch (error) {
          console.error('Failed to start tutorial:', error)
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

    // Handle click events in the sidebar
    historyElement.addEventListener('click', async (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest(
        '[data-testid^="history-item-"][data-testid$="-options"]'
      )
      const chatLink = target?.closest('a') as HTMLAnchorElement | null
      const chatUrl = chatLink?.getAttribute('href') as string
      const urlId = chatUrl?.split('/').slice(-1)[0]
      const chatTitle = chatLink?.querySelector('span')?.textContent
      if (target) {
        const chatOptionsMenu = document.querySelector(
          'div[data-radix-menu-content][role="menu"][aria-orientation="vertical"]'
        ) as HTMLDivElement

        if (chatOptionsMenu) {
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

          // Check pinned status and display the appropriate button
          const savedPinChats = await getPinChatsFromStorage(profileId)
          if (urlId && savedPinChats.some(chat => chat.urlId === urlId)) {
            chatOptionsMenu.prepend(unpinButton)
          } else {
            const pinButton: HTMLDivElement = createPinButton()
            chatOptionsMenu.prepend(pinButton)
            if (urlId && chatTitle) {
              async function pinChatHandler(event: MouseEvent) {
                event.stopPropagation()
                await handlePinChat(
                  urlId,
                  chatTitle!,
                  pinButton,
                  chatOptionsMenu
                )
              }
              pinButton.addEventListener('click', pinChatHandler)
              // setupPinChatListener(urlId, pinButton, pinChatHandler, chatTitle);
            }
          }

          // Handle pinning and unpinning

          setupUnpinChatListener(
            profileId,
            urlId,
            unpinButton,
            unpinChatHandler
          )
        }
      }
    })

    const conversationOptionsButton = document.querySelector(
      '[data-testid="conversation-options-button"]'
    ) as HTMLButtonElement
    if (conversationOptionsButton) {
      conversationOptionsButton.addEventListener('click', async () => {
        const chatOptionsMenu = document.querySelector(
          'div[data-radix-menu-content][role="menu"][aria-orientation="vertical"]'
        ) as HTMLDivElement

        if (chatOptionsMenu) {
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
                      if (profileId) {
                        const savedPinChats = await getPinChatsFromStorage(
                          profileId
                        )
                        savedPinChats.forEach(async chat => {
                          const pinnedChat = pinnedContainer.querySelector(
                            `a[href="https://chatgpt.com/c/${chat.urlId}"]`
                          )

                          if (pinnedChat) {
                            pinnedChat.remove()
                          }
                          await removePinChatFromStorage(profileId, chat.urlId)
                        })
                      }
                    }
                  )
                }
              }, 100)
            })
          }
        }
      })
    }
  } catch (error) {
    console.error(error)
  }
}
