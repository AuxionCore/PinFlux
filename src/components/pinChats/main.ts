import getProfileId from "@/components/utils/getProfileId";
import getSidebarElement from "@/components/pinChats/core/getSidebarElement";
import getHistoryElement from "@/components/pinChats/core/getHistoryElement";
import initPinnedChats from "@/components/pinChats/core/initPinnedChats";
import createPinButton from "./pinButton/PinButton";
import createUnpinButton from "./pinButton/UnpinButton";
import setupUnpinChatListener from "@/components/pinChats/core/setupUnpinChatListener";
import handleDragStart from "@/components/pinChats/dragAndDrop/handleDragStart";
import handleDragEnd from "@/components/pinChats/dragAndDrop/handleDragEnd";
import setupPinChatListener from "./core/setupPinChatListener";
import {
  getPinChatsFromStorage,
  removePinChatFromStorage,
} from "../utils/storage";

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
  let pinChatHandler: (() => void) | null = null;
  let unpinChatHandler: (() => void) | null = null;

  const profileId = await getProfileId();
  const sidebarElement = await getSidebarElement();
  const historyElement = await getHistoryElement();

  await initPinnedChats({ profileId, sidebarElement, historyElement });

  sidebarElement.addEventListener("dragstart", handleDragStart);
  sidebarElement.addEventListener("dragend", handleDragEnd);

  // Create pin and unpin buttons
  const pinButton: HTMLDivElement = createPinButton();
  const unpinButton: HTMLDivElement = createUnpinButton();

  // Handle click events in the sidebar
  sidebarElement.addEventListener("click", async (event: MouseEvent) => {
    event.stopPropagation();
    const target = (event.target as HTMLElement)?.closest(
      '[data-testid^="history-item-"][data-testid$="-options"]'
    );
    const chatElement = target?.closest("li") as HTMLLIElement;
    const chatLink = chatElement?.querySelector("a") as HTMLAnchorElement;
    const chatUrl = chatLink?.getAttribute("href") as string;
    const urlId = chatUrl?.split("/").slice(-1)[0];
    const chatTitle = chatLink?.querySelector("div")?.textContent;
    if (target) {
      const chatOptionsMenu = document.querySelector(
        'div[data-radix-menu-content][role="menu"][aria-orientation="vertical"]'
      ) as HTMLDivElement;

      if (chatOptionsMenu) {
        const deleteButton = chatOptionsMenu.querySelector(
          '[data-testid="delete-chat-menu-item"]'
        );
        if (deleteButton) {
          deleteButton.addEventListener("click", async () => {
            setTimeout(() => {
              const deleteConversationConfirmButton = document.querySelector(
                '[data-testid="delete-conversation-confirm-button"]'
              ) as HTMLButtonElement;

              if (deleteConversationConfirmButton) {
                deleteConversationConfirmButton.addEventListener(
                  "click",
                  async () => {
                    const pinnedChats = document.querySelector(
                      "#pinnedChats"
                    ) as HTMLOListElement;
                    if (urlId) {
                      const pinnedChat = pinnedChats
                        .querySelector(
                          `a[href="https://chatgpt.com/c/${urlId}"]`
                        )
                        ?.closest("li");
                      if (pinnedChat) {
                        pinnedChat.remove();
                      }
                      await removePinChatFromStorage(profileId, urlId);
                    }
                  }
                );
              }
            }, 100);
          });
        }

        // Check pinned status and display the appropriate button
        const savedPinChats = await getPinChatsFromStorage(profileId);
        if (savedPinChats.length > 0) {
          if (urlId && savedPinChats.some((chat) => chat.urlId === urlId)) {
            chatOptionsMenu.prepend(unpinButton);
          } else {
            chatOptionsMenu.prepend(pinButton);
          }
        } else {
          chatOptionsMenu.prepend(pinButton);
        }

        // Handle pinning and unpinning
        if (urlId && chatTitle) {
          setupPinChatListener(
            urlId,
            pinButton,
            pinChatHandler,
            chatTitle,
            chatOptionsMenu
          );
        }
        setupUnpinChatListener(profileId, urlId, unpinButton, unpinChatHandler);
      }
    }
  });

  const conversationOptionsButton = document.querySelector(
    '[data-testid="conversation-options-button"]'
  ) as HTMLButtonElement;
  if (conversationOptionsButton) {
    conversationOptionsButton.addEventListener("click", async () => {
      const chatOptionsMenu = document.querySelector(
        'div[data-radix-menu-content][role="menu"][aria-orientation="vertical"]'
      ) as HTMLDivElement;

      if (chatOptionsMenu) {
        const deleteButton = chatOptionsMenu.querySelector(
          '[data-testid="delete-chat-menu-item"]'
        );
        if (deleteButton) {
          deleteButton.addEventListener("click", async () => {
            setTimeout(() => {
              const deleteConversationConfirmButton = document.querySelector(
                '[data-testid="delete-conversation-confirm-button"]'
              ) as HTMLButtonElement;

              if (deleteConversationConfirmButton) {
                deleteConversationConfirmButton.addEventListener(
                  "click",
                  async () => {
                    const pinnedChats = document.querySelector(
                      "#pinnedChats"
                    ) as HTMLOListElement;
                    if (profileId) {
                      const savedPinChats = await getPinChatsFromStorage(
                        profileId
                      );
                      savedPinChats.forEach(async (chat) => {
                        const pinnedChat = pinnedChats
                          .querySelector(
                            `a[href="https://chatgpt.com/c/${chat.urlId}"]`
                          )
                          ?.closest("li");
                        if (pinnedChat) {
                          pinnedChat.remove();
                        }
                        await removePinChatFromStorage(profileId, chat.urlId);
                      });
                    }
                  }
                );
              }
            }, 100);
          });
        }
      }
    });
  }
}
