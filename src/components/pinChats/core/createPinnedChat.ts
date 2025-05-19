import createChatOptionsButton from "@/components/pinChats/helpers/createChatOptionsButton";
import clearActiveChatStyles from "@/components/pinChats/helpers/clearActiveChatStyles";
import styleActiveChat from "@/components/pinChats/helpers/styleActiveChat";
import { isDarkMode } from "@/components/utils/styleScheme";
import handleDragStart from "@/components/pinChats/dragAndDrop/handleDragStart";
import handleDragEnd from "@/components/pinChats/dragAndDrop/handleDragEnd";

// Function to create a pinned chat element
export default function createPinnedChat(
  title: string,
  urlId: string,
  profileId: string,
  sidebarElement: HTMLElement
): HTMLLIElement {
  const li: HTMLLIElement = document.createElement("li");
  const liInsideRaper: HTMLDivElement = document.createElement("div");
  const a: HTMLAnchorElement = document.createElement("a");
  const titleDiv: HTMLDivElement = document.createElement("div");
  const chatOptionsBtnRaper: HTMLDivElement = document.createElement("div");

  li.className = "relative";

  liInsideRaper.className =
    "no-draggable group rounded-lg active:opacity-90 hover:bg-[var(--sidebar-surface-secondary)] group-hover:bg-[var(--sidebar-surface-secondary)] h-9 text-sm screen-arch:bg-transparent relative";

  liInsideRaper.setAttribute("draggable", "false");

  // Set up the anchor link for the pinned chat
  a.setAttribute("id", urlId);
  a.href = `https://chatgpt.com/c/${urlId}`;
  a.className =
    "motion-safe:group-active:screen-arch:scale-[98%] motion-safe:group-active:screen-arch:transition-transform motion-safe:group-active:screen-arch:duration-100 flex items-center gap-2 p-2";

  a.addEventListener("click", (event) => {
    event.preventDefault();
    window.history.pushState(null, "", `https://chatgpt.com/c/${urlId}`);
    window.dispatchEvent(new Event("popstate"));
  });
  // Set up the span for the chat title
  a.style.textAlign = "left";
  a.style.fontSize = "0.9rem";
  a.style.unicodeBidi = "plaintext";

  chatOptionsBtnRaper.className =
    "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 can-hover:not-group-hover:opacity-0 group-focus-within:opacity-100! group-hover:opacity-100! group-focus:opacity-100! focus-within:opacity-100! focus:opacity-100!";

  titleDiv.textContent = title;
  titleDiv.setAttribute("title", title);
  titleDiv.setAttribute("dir", "auto");
  titleDiv.setAttribute("aria-label", title);
  titleDiv.className = "relative grow overflow-hidden whitespace-nowrap";
  titleDiv.style.setProperty("mask-image", "var(--sidebar-mask)");

  const chatOptionsButton = createChatOptionsButton(
    li,
    chatOptionsBtnRaper,
    sidebarElement,
    isDarkMode,
    profileId
  );

  // Append the elements
  a.appendChild(titleDiv);
  chatOptionsBtnRaper.appendChild(chatOptionsButton);
  liInsideRaper.appendChild(a);
  liInsideRaper.appendChild(chatOptionsBtnRaper);
  li.appendChild(liInsideRaper);

  if (`https://chatgpt.com/c/${urlId}` === window.location.href) {
    clearActiveChatStyles();
    styleActiveChat(liInsideRaper, chatOptionsBtnRaper);
  } else {
    chatOptionsBtnRaper.className =
      "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 can-hover:not-group-hover:opacity-0 group-focus-within:opacity-100! group-hover:opacity-100! group-focus:opacity-100! focus-within:opacity-100! focus:opacity-100!";
    liInsideRaper.className =
      "no-draggable group rounded-lg active:opacity-90 hover:bg-[var(--sidebar-surface-secondary)] group-hover:bg-[var(--sidebar-surface-secondary)] h-9 text-sm screen-arch:bg-transparent relative";
  }

  // Add hover effect for the list item
  li.addEventListener("mouseover", () => {
    if (`https://chatgpt.com/c/${urlId}` === window.location.href) {
      clearActiveChatStyles();
      styleActiveChat(liInsideRaper, chatOptionsBtnRaper);
    }
  });
  li.addEventListener("mouseout", () => {
    const chatOptionsMenu = document.querySelector(
      "#chatOptionsMenu"
    ) as HTMLDivElement;
    liInsideRaper.className =
      "no-draggable group rounded-lg active:opacity-90 hover:bg-[var(--sidebar-surface-secondary)] group-hover:bg-[var(--sidebar-surface-secondary)] h-9 text-sm screen-arch:bg-transparent relative";

    if (!chatOptionsMenu) {
      chatOptionsBtnRaper.className =
        "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 can-hover:not-group-hover:opacity-0 group-focus-within:opacity-100! group-hover:opacity-100! group-focus:opacity-100! focus-within:opacity-100! focus:opacity-100!";
    }
    if (`https://chatgpt.com/c/${urlId}` === window.location.href) {
      clearActiveChatStyles();
      styleActiveChat(liInsideRaper, chatOptionsBtnRaper);
    }
  });
  li.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  li.addEventListener("dragstart", handleDragStart);
  li.addEventListener("dragend", handleDragEnd);

  return li;
}
