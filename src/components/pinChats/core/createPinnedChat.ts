import createChatOptionsButton from "@/components/pinChats/helpers/createChatOptionsButton";
import clearActiveChatStyles from "@/components/pinChats/helpers/clearActiveChatStyles";
import styleActiveChat from "@/components/pinChats/helpers/styleActiveChat";
import { isDarkMode } from "@/components/utils/styleScheme";

// Function to create a pinned chat element
export default function createPinnedChat(
  title: string,
  urlId: string,
  profileId: string,
  historyElement: HTMLElement
): HTMLAnchorElement {
  const anchor: HTMLAnchorElement = document.createElement("a");
  const titleDiv1: HTMLDivElement = document.createElement("div");
  const titleDiv2: HTMLDivElement = document.createElement("div");
  const titleSpan: HTMLSpanElement = document.createElement("span");
  const chatOptionsBtnRaper1: HTMLDivElement = document.createElement("div");
  const chatOptionsBtnRaper2: HTMLDivElement = document.createElement("div");

  // Set up the anchor link for the pinned chat
  anchor.setAttribute("id", urlId);
  anchor.setAttribute("tabindex", "0");
  anchor.setAttribute("data-fill", "");
  anchor.setAttribute("data-discovery", "true");
  anchor.setAttribute("data-pinflux-pinned-chat", "true"); // Add tutorial identifier
  // Note: draggable attribute is handled by setupPinnedChatsDragAndDrop
  anchor.href = `https://chatgpt.com/c/${urlId}`;
  anchor.className = "group __menu-item hoverable";

  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.history.pushState(null, "", `https://chatgpt.com/c/${urlId}`);
    window.dispatchEvent(new Event("popstate"));
  });

  chatOptionsBtnRaper1.className =
    "text-token-text-tertiary flex items-center self-stretch";
  chatOptionsBtnRaper2.className = "trailing highlight";

  titleSpan.textContent = title;
  titleSpan.setAttribute("dir", "auto");
  titleDiv1.className = "flex min-w-0 grow items-center gap-2.5";
  titleDiv2.className = "truncate";

  const chatOptionsButton = createChatOptionsButton(
    anchor,
    chatOptionsBtnRaper2,
    historyElement,
    isDarkMode,
    profileId
  );

  // Append the elements
  titleDiv2.appendChild(titleSpan);
  titleDiv1.appendChild(titleDiv2);
  chatOptionsBtnRaper1.appendChild(chatOptionsBtnRaper2);
  chatOptionsBtnRaper2.appendChild(chatOptionsButton);
  anchor.appendChild(titleDiv1);
  anchor.appendChild(chatOptionsBtnRaper1);

  if (`https://chatgpt.com/c/${urlId}` === window.location.href) {
    clearActiveChatStyles();
    anchor.setAttribute("data-active", "");
  } else {
    anchor.removeAttribute("data-active");
  }

  // Add hover effect for the list item
  anchor.addEventListener("mouseover", () => {
    if (`https://chatgpt.com/c/${urlId}` === window.location.href) {
      clearActiveChatStyles();
      anchor.setAttribute("data-active", "");
    }
  });
  anchor.addEventListener("mouseout", () => {
    // const chatOptionsMenu = document.querySelector(
    //   "#chatOptionsMenu"
    // ) as HTMLDivElement;
    // liInsideRaper.className =
    //   "no-draggable group rounded-lg active:opacity-90 hover:bg-[var(--sidebar-surface-secondary)] group-hover:bg-[var(--sidebar-surface-secondary)] h-9 text-sm screen-arch:bg-transparent relative";

    // if (!chatOptionsMenu) {
    //   chatOptionsBtnRaper.className =
    //     "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 can-hover:not-group-hover:opacity-0 group-focus-within:opacity-100! group-hover:opacity-100! group-focus:opacity-100! focus-within:opacity-100! focus:opacity-100!";
    // }
    if (`https://chatgpt.com/c/${urlId}` === window.location.href) {
      clearActiveChatStyles();
      anchor.setAttribute("data-active", "");
    }
  });

  // Note: drag listeners are now handled by setupPinnedChatsDragAndDrop

  return anchor;
}
