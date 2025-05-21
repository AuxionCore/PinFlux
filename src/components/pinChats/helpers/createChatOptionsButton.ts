import createChatOptionsMenu from "./createChatOptionsMenu";
import pinChatOptionsButton from "./pinChatOptionsButton.html?raw";

export default function createChatOptionsButton(
  li: HTMLLIElement,
  buttonWrapper: HTMLDivElement,
  sidebarElement: HTMLElement,
  isDarkMode: boolean,
  profileId: string
): HTMLButtonElement {
  let currentTargetButton: HTMLButtonElement | null = null;
  let currentOpenMenu: HTMLDivElement | null = null;

  const chatOptionsBtn: HTMLButtonElement = document.createElement("button");
  chatOptionsBtn.setAttribute("type", "button");
  chatOptionsBtn.setAttribute("aria-expanded", "false");
  chatOptionsBtn.setAttribute("aria-haspopup", "menu");
  chatOptionsBtn.setAttribute("aria-label", "Open pin conversation options");

  chatOptionsBtn.className =
    "text-token-text-secondary hover:text-token-text-primary radix-state-open:text-token-text-secondary flex items-center justify-center transition";
  chatOptionsBtn.innerHTML = pinChatOptionsButton;

  const pinnedChatsList = document.querySelector(
    "#pinnedChats"
  ) as HTMLOListElement;

  function closeMenu() {
    if (currentOpenMenu) {
      currentOpenMenu.remove();
      buttonWrapper.className =
        "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 can-hover:not-group-hover:opacity-0 group-focus-within:opacity-100! group-hover:opacity-100! group-focus:opacity-100! focus-within:opacity-100! focus:opacity-100!";

      currentOpenMenu = null;
      currentTargetButton = null;
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("scroll", onScrollCapture, true);
      pinnedChatsList.removeEventListener("scroll", onPinnedChatsScroll, true);
    }
  }

  function onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (
      currentOpenMenu &&
      !currentOpenMenu.contains(target) &&
      !currentTargetButton?.contains(target)
    ) {
      closeMenu();
    }
  }

  function onScrollCapture(event: Event) {
    const scrolledElement = event.target as HTMLElement;

    // Check if the scrolled element is the pinned chats list
    if (!pinnedChatsList.contains(scrolledElement)) {
      closeMenu();
    }
  }

  function onPinnedChatsScroll() {
    positionMenu();
  }

  function positionMenu() {
    if (!currentOpenMenu || !currentTargetButton) return;

    const rect = currentTargetButton.getBoundingClientRect();

    currentOpenMenu.style.top = `${rect.bottom + window.scrollY}px`;
    currentOpenMenu.style.left = `${rect.left + window.scrollX}px`;
  }

  chatOptionsBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLButtonElement;

    // Check if the menu is already open for the current button
    if (currentTargetButton === button && currentOpenMenu) {
      closeMenu();
      return;
    }

    buttonWrapper.className =
      "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 flex";

    closeMenu(); // Close any existing menu before opening a new one

    currentTargetButton = button;

    const chatOptionsMenu = createChatOptionsMenu(
      li,
      sidebarElement,
      isDarkMode,
      profileId,
      closeMenu
    );

    document.body.appendChild(chatOptionsMenu);
    currentOpenMenu = chatOptionsMenu;

    // Position the menu
    positionMenu();

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("scroll", onScrollCapture, true);
    pinnedChatsList.addEventListener("scroll", onPinnedChatsScroll, true);
  });

  return chatOptionsBtn;
}
