import createChatOptionsMenu from "./createChatOptionsMenu";
import pinChatOptionsButton from "./pinChatOptionsButton.html?raw";

export default function createChatOptionsButton(
  anchor: HTMLAnchorElement,
  buttonWrapper: HTMLDivElement,
  historyElement: HTMLElement,
  isDarkMode: boolean,
  profileId: string
): HTMLButtonElement {
  let currentTargetButton: HTMLButtonElement | null = null;
  let currentOpenMenu: HTMLDivElement | null = null;

  const chatOptionsBtn: HTMLButtonElement = document.createElement("button");
  chatOptionsBtn.setAttribute("type", "button");
  chatOptionsBtn.setAttribute("tabindex", "0");
  chatOptionsBtn.setAttribute("data-trailing-button", "");
  chatOptionsBtn.setAttribute("aria-expanded", "false");
  chatOptionsBtn.setAttribute("data-state", "closed");
  chatOptionsBtn.setAttribute("aria-haspopup", "menu");
  chatOptionsBtn.setAttribute("aria-label", "Open pin conversation options");

  chatOptionsBtn.className = "__menu-item-trailing-btn";
  chatOptionsBtn.innerHTML = pinChatOptionsButton;

  const pinnedChatsList = document.querySelector(
    "#chatListContainer"
  ) as HTMLDivElement;

  function closeMenu() {
    if (currentOpenMenu) {
      currentOpenMenu.remove();
      chatOptionsBtn.setAttribute("aria-expanded", "false");
      chatOptionsBtn.setAttribute("data-state", "closed");

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
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("data-state", "open");

    // Check if the menu is already open for the current button
    if (currentTargetButton === button && currentOpenMenu) {
      closeMenu();
      return;
    }

    closeMenu(); // Close any existing menu before opening a new one

    currentTargetButton = button;

    const chatOptionsMenu = createChatOptionsMenu(
      anchor,
      historyElement,
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
