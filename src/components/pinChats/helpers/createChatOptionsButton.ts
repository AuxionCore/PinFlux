import createChatOptionsMenu from "./createChatOptionsMenu";
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

  chatOptionsBtn.innerHTML = `
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="icon-md"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12Z"
        fill="currentColor"
      ></path>
    </svg>
  `;

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