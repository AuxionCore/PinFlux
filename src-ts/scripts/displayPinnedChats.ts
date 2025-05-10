function getCurrentScheme(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("color-scheme")
    .trim();
}

// Get the user ID from localStorage
async function getProfileId(): Promise<string> {
  try {
    return new Promise<string>((resolve) => {
      const interval = setInterval(() => {
        const prefix = "cache/user";
        const matchingKeys = Object.keys(localStorage).filter((key) =>
          key.startsWith(prefix)
        );

        for (const key of matchingKeys) {
          const regex = /cache\/user-([a-zA-Z0-9]+)/;
          const match = key.match(regex);
          if (match) {
            clearInterval(interval);
            resolve(match[1] as string);
          }
        }
      }, 100);
    });
  } catch (error) {
    console.error(error);
    return "";
  }
}

// Handle unpin chat button click
async function handleUnpinChatBtnClick(
  li: HTMLLIElement,
  profileId: string
): Promise<void> {
  const urlId = li.querySelector("a")?.getAttribute("id");
  li.remove(); // Remove the pinned chat element from the DOM
  const storage = await chrome.storage.sync.get([`${profileId}`]);
  const savedChats: { urlId: string; title: string }[] =
    storage[`${profileId}`] || [];

  const index = savedChats.findIndex((chat) => chat.urlId === urlId);
  if (index !== -1) {
    savedChats.splice(index, 1); // Remove the URL from pinned chats
    await chrome.storage.sync.set({ [`${profileId}`]: savedChats });
  }
}

function createChatOptionsMenu(
  li: HTMLLIElement,
  sidebarElement: HTMLElement,
  isDarkMode: boolean,
  profileId: string,
  closeMenu: () => void = () => {}
): HTMLDivElement {
  const chatOptionsMenu = document.createElement("div");
  chatOptionsMenu.setAttribute("id", "chatOptionsMenu");
  chatOptionsMenu.style.position = "absolute";
  chatOptionsMenu.style.zIndex = "9999";

  chatOptionsMenu.className =
    "z-50 max-w-xs rounded-2xl popover bg-token-main-surface-primary shadow-lg border overflow-hidden py-0";

  chatOptionsMenu.innerHTML = `
    <div class='max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto min-w-fit py-2'>
      <div
        role='menuitem'
        data-action="unpin"
        class='flex items-center m-1.5 p-2.5 text-sm cursor-pointer focus-visible:outline-0 radix-disabled:pointer-events-none radix-disabled:opacity-50 group relative hover:bg-[#f5f5f5] focus-visible:bg-[#f5f5f5] radix-state-open:bg-[#f5f5f5] dark:hover:bg-token-main-surface-secondary dark:focus-visible:bg-token-main-surface-secondary rounded-md my-0 px-3 mx-2 dark:radix-state-open:bg-token-main-surface-secondary gap-2.5 py-3'
        tabindex='-1'
      >
        <div class='flex items-center justify-center text-token-text-secondary h-5 w-5'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 -960 960 960'
            fill='none'
            class='h-5 w-5 shrink-0'
          >
            <path
              d='M672-816v72h-48v307l-72-72v-235H408v91l-90-90-30-31v-42h384ZM480-48l-36-36v-228H240v-72l96-96v-42.46L90-768l51-51 678 679-51 51-222-223h-30v228l-36 36ZM342-384h132l-66-66-66 66Zm137-192Zm-71 126Z'
              fill='currentColor'
              fill-rule='evenodd'
              clip-rule='evenodd'
            ></path>
          </svg>
        </div>
        Unpin
      </div>
      <div
        role='menuitem'
        data-action="rename"
        class='flex items-center m-1.5 p-2.5 text-sm cursor-pointer focus-visible:outline-0 radix-disabled:pointer-events-none radix-disabled:opacity-50 group relative hover:bg-[#f5f5f5] focus-visible:bg-[#f5f5f5] radix-state-open:bg-[#f5f5f5] dark:hover:bg-token-main-surface-secondary dark:focus-visible:bg-token-main-surface-secondary rounded-md my-0 px-3 mx-2 dark:radix-state-open:bg-token-main-surface-secondary gap-2.5 py-3'
      >
        <div class='flex items-center justify-center text-token-text-secondary h-5 w-5'>
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            class='h-5 w-5 shrink-0'
          >
            <path
              fill-rule='evenodd'
              clip-rule='evenodd'
              d='M13.2929 4.29291C15.0641 2.52167 17.9359 2.52167 19.7071 4.2929C21.4784 6.06414 21.4784 8.93588 19.7071 10.7071L18.7073 11.7069L11.6135 18.8007C10.8766 19.5376 9.92793 20.0258 8.89999 20.1971L4.16441 20.9864C3.84585 21.0395 3.52127 20.9355 3.29291 20.7071C3.06454 20.4788 2.96053 20.1542 3.01362 19.8356L3.80288 15.1C3.9742 14.0721 4.46243 13.1234 5.19932 12.3865L13.2929 4.29291ZM13 7.41422L6.61353 13.8007C6.1714 14.2428 5.87846 14.8121 5.77567 15.4288L5.21656 18.7835L8.57119 18.2244C9.18795 18.1216 9.75719 17.8286 10.1993 17.3865L16.5858 11L13 7.41422ZM18 9.5858L14.4142 6.00001L14.7071 5.70712C15.6973 4.71693 17.3027 4.71693 18.2929 5.70712C19.2831 6.69731 19.2831 8.30272 18.2929 9.29291L18 9.5858Z'
              fill='currentColor'
            ></path>
          </svg>
        </div>
        Rename
      </div>
      <div
        role='menuitem'
        data-action="originalChat"
        class='flex items-center m-1.5 p-2.5 text-sm cursor-pointer focus-visible:outline-0 radix-disabled:pointer-events-none radix-disabled:opacity-50 group relative hover:bg-[#f5f5f5] focus-visible:bg-[#f5f5f5] radix-state-open:bg-[#f5f5f5] dark:hover:bg-token-main-surface-secondary dark:focus-visible:bg-token-main-surface-secondary rounded-md my-0 px-3 mx-2 dark:radix-state-open:bg-token-main-surface-secondary gap-2.5 py-3'
      >
        <div class='flex items-center justify-center text-token-text-secondary h-5 w-5'>
          <svg
            width='24'
            height='24'
            viewBox='0 -960 960 960'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            class='h-5 w-5 shrink-0'
          >
            <path
              fill-rule='evenodd'
              clip-rule='evenodd'
              d='M200-800v241-1 400-640 200-200Zm0 720q-33 0-56.5-23.5T120-160v-640q0-33 23.5-56.5T200-880h320l240 240v100q-19-8-39-12.5t-41-6.5v-41H480v-200H200v640h241q16 24 36 44.5T521-80H200Zm460-120q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29ZM864-40 756-148q-21 14-45.5 21t-50.5 7q-75 0-127.5-52.5T480-300q0-75 52.5-127.5T660-480q75 0 127.5 52.5T840-300q0 26-7 50.5T812-204L920-96l-56 56Z'
              fill='currentColor'
            ></path>
          </svg>
        </div>
        Original Chat
      </div>
    </div>
  `;

  // Add event listeners to the menu items
  chatOptionsMenu.querySelectorAll("[role='menuitem']").forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.stopPropagation();

      const action = (e.currentTarget as HTMLElement).dataset.action;
      switch (action) {
        case "unpin":
          await handleUnpinChatBtnClick(li, profileId);
          break;
        case "rename":
          // Handle rename action here
          handleRenameChat(li, profileId);
          break;
        case "originalChat":
          await handleSearchOriginalChatBtnClick(
            sidebarElement,
            li.querySelector("a")?.getAttribute("id") || "",
            isDarkMode
          );
          break;
      }
      closeMenu();
    });
  });
  return chatOptionsMenu;
}

// Handle search original chat button click
async function handleSearchOriginalChatBtnClick(
  sidebarElement: HTMLElement,
  urlId: string,
  isDarkMode: boolean
): Promise<void> {
  const scrollContainer = sidebarElement.parentElement;
  if (!scrollContainer) return;

  const findChatUrl = () =>
    sidebarElement.querySelector(`a[href="/c/${urlId}"]`);

  while (!findChatUrl()) {
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: "smooth",
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  findChatUrl()?.scrollIntoView({ behavior: "smooth", block: "center" });

  // Style the chat link for a few seconds
  const chatLink = findChatUrl() as HTMLAnchorElement;
  const chatLinkParent = chatLink.parentElement as HTMLLIElement;
  chatLinkParent.style.transition = "border 0.3s ease-in-out";
  chatLinkParent.style.borderColor = isDarkMode ? "#dedede" : "#000000";
  chatLinkParent.style.borderWidth = "1px";
  chatLinkParent.style.borderStyle = "solid";
  setTimeout(() => {
    chatLinkParent.style.borderColor = "transparent";
    chatLinkParent.style.borderWidth = "0px";
    chatLinkParent.style.borderStyle = "none";
  }, 3000);
}

function createChatOptionsBtn(
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
//       const storage = await chrome.storage.sync.get([`${profileId}`]);
//       const savedChats: { urlId: string; title: string }[] =
//         storage[`${profileId}`] || [];
//       const chatIndex = savedChats.findIndex((chat) => chat.urlId === urlId);
//       if (chatIndex !== -1) {
//         savedChats[chatIndex].title = newValue;
//         chrome.storage.sync.set({ [`${profileId}`]: savedChats });
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

// Handle rename chat button click
function handleRenameChat(li: HTMLLIElement, profileId: string): void {
  const a = li.querySelector("a");
  if (!a) return;

  const titleDiv = a.querySelector("div");
  if (!titleDiv) return;

  const originalTitle = titleDiv.textContent?.trim() || "";
  const inputWrapper = document.createElement("div");
  inputWrapper.className =
    "bg-token-sidebar-surface-secondary absolute start-[7px] end-2 top-0 bottom-0 flex items-center z-10";

  const input = document.createElement("input");
  input.className =
    "border-token-border-default w-full border bg-transparent p-0 text-sm";
  input.type = "text";
  input.value = originalTitle;

  inputWrapper.appendChild(input);
  li.appendChild(inputWrapper);

  input.focus();

  const cleanup = () => {
    inputWrapper.remove();
  };

  const finishEditing = async () => {
    const newValue = input.value.trim();

    if (!newValue) {
      titleDiv.textContent = originalTitle;
    } else if (newValue !== originalTitle) {
      titleDiv.textContent = newValue;

      // Save the new title to storage
      const urlId = a?.getAttribute("id");
      const storage = await chrome.storage.sync.get([`${profileId}`]);
      const savedChats: { urlId: string; title: string }[] =
        storage[`${profileId}`] || [];
      const chatIndex = savedChats.findIndex((chat) => chat.urlId === urlId);
      if (chatIndex !== -1) {
        savedChats[chatIndex].title = newValue;
        chrome.storage.sync.set({ [`${profileId}`]: savedChats });
      }
    }

    cleanup();
  };

  const cancelEditing = () => {
    titleDiv.textContent = originalTitle;
    cleanup();
  };

  input.addEventListener("blur", finishEditing, { once: true });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  });
}

(async () => {
  // Check if the user is logged in
  const profileId = await getProfileId();
  const isDarkMode: boolean = getCurrentScheme() === "dark";

  // Function to create a pinned chat element
  function createPinnedChat(
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
    // anchorRaper.setAttribute(
    //   "style",
    //   "--item-background-color: var(--sidebar-surface-primary);"
    // );
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

    chatOptionsBtnRaper.className =
      "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 can-hover:not-group-hover:opacity-0 group-focus-within:opacity-100! group-hover:opacity-100! group-focus:opacity-100! focus-within:opacity-100! focus:opacity-100!";

    titleDiv.textContent = title;
    titleDiv.setAttribute("title", title);
    titleDiv.setAttribute("dir", "auto");
    titleDiv.setAttribute("aria-label", title);
    titleDiv.className = "relative grow overflow-hidden whitespace-nowrap";
    titleDiv.style.setProperty("mask-image", "var(--sidebar-mask)");

    const chatOptionsBtn = createChatOptionsBtn(
      li,
      chatOptionsBtnRaper,
      sidebarElement,
      isDarkMode,
      profileId
    );

    // Append the elements
    a.appendChild(titleDiv);
    chatOptionsBtnRaper.appendChild(chatOptionsBtn);
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

  function clearActiveChatStyles() {
    const allLis = document
      .querySelector("ol#pinnedChats")
      ?.querySelectorAll("li");
    for (const li of allLis || []) {
      const liInsideRaper = li.querySelector("div");
      if (!liInsideRaper) continue;
      liInsideRaper.className =
        "no-draggable group rounded-lg active:opacity-90 hover:bg-[var(--sidebar-surface-secondary)] group-hover:bg-[var(--sidebar-surface-secondary)] h-9 text-sm screen-arch:bg-transparent relative";

      const btn = li.querySelector("button") as HTMLButtonElement;
      const chatOptionsBtnRaper = btn.parentElement as HTMLDivElement;
      if (chatOptionsBtnRaper) {
        chatOptionsBtnRaper.className =
          "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 can-hover:not-group-hover:opacity-0 group-focus-within:opacity-100! group-hover:opacity-100! group-focus:opacity-100! focus-within:opacity-100! focus:opacity-100!";
      }
    }
  }

  function styleActiveChat(
    anchorRaper: HTMLDivElement,
    chatOptionsBtnRaper: HTMLDivElement
  ) {
    anchorRaper.className =
      "no-draggable group rounded-lg active:opacity-90 bg-[var(--sidebar-surface-tertiary)] h-9 text-sm screen-arch:bg-transparent relative";
    chatOptionsBtnRaper.className =
      "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 flex";
  }

  // Function to create a draggable display with text
  function createDraggableDisplay(text: string): HTMLDivElement {
    const colorScheme = getCurrentScheme();
    const draggableDisplay: HTMLDivElement = document.createElement("div");
    const draggableDisplayText: HTMLSpanElement =
      document.createElement("span");

    draggableDisplayText.textContent = text;
    draggableDisplay.appendChild(draggableDisplayText);

    draggableDisplay.setAttribute("id", "draggableDisplay");
    draggableDisplayText.style.fontWeight = "500";
    draggableDisplay.style.position = "absolute";
    draggableDisplay.style.border = "2px dashed #dedede";
    draggableDisplay.style.borderRadius = "8px";
    draggableDisplay.style.top = "0";
    draggableDisplay.style.left = "0";
    draggableDisplay.style.zIndex = "1000";
    draggableDisplay.style.backgroundColor =
      colorScheme === "dark"
        ? "rgba(40, 40, 40, 95)"
        : "rgba(230, 230, 230, 95)";
    draggableDisplay.style.color =
      colorScheme === "dark" ? "#dedede" : "#000000";
    draggableDisplay.style.width = "100%";
    draggableDisplay.style.height = "100%";
    draggableDisplay.style.display = "flex";
    draggableDisplay.style.flexDirection = "column";
    draggableDisplay.style.alignItems = "center";
    draggableDisplay.style.justifyContent = "center";

    return draggableDisplay;
  }

  // Function to create the container for pinned chats
  function createPinnedContainerElement(): HTMLDivElement {
    const pinnedContainer: HTMLDivElement = document.createElement("div");
    pinnedContainer.setAttribute("id", "pinnedContainer");
    pinnedContainer.className = "relative mt-5 first:mt-0 last:mb-5";

    const style = document.createElement("style");
    // Style the scrollbar for pinned chats: color, width, etc.
    style.textContent = `
          #pinnedChats {
          scrollbar-width: thin; /* Firefox */
          --scroll-thumb: #e0e0e0; 
          --scroll-thumb-hover: #c0c0c0; 
          --scroll-thumb-active: #a0a0a0; 
          scrollbar-color: var(--scroll-thumb) transparent;
        }

        ${
          isDarkMode &&
          `
          #pinnedChats {
            --scroll-thumb: #303030;
            --scroll-thumb-hover: #505050;
            --scroll-thumb-active: #707070;
            scrollbar-color: var(--scroll-thumb) transparent;
          }
        `
        }

        #pinnedChats::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        #pinnedChats::-webkit-scrollbar-thumb {
          background-color: var(--scroll-thumb);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
          transition: background-color 0.2s ease;
        }

        #pinnedChats:hover {
          --scroll-thumb: var(--scroll-thumb-hover);
        }

        #pinnedChats::-webkit-scrollbar-thumb:hover {
          background-color: var(--scroll-thumb-active);
        }

        #pinnedChats::-webkit-scrollbar-track,
        #pinnedChats::-webkit-scrollbar-corner,
        #pinnedChats::-webkit-scrollbar-button {
          background-color: transparent;
        }
      
    `;
    document.head.appendChild(style);

    function handleDragOver(event: DragEvent): void {
      event.preventDefault();
      const draggableDisplay = document.querySelector(
        "#draggableDisplay"
      ) as HTMLDivElement;
      if (draggableDisplay) {
        draggableDisplay.textContent = "Drop to pin";
      }
    }

    async function handleDrop(event: DragEvent): Promise<void> {
      event.preventDefault();

      pinnedContainer.style.backgroundColor = "transparent";
      pinnedContainer.style.transition = "all 0.3s";
      pinnedContainer.style.borderStyle = "none";

      const chatLinkData = event.dataTransfer?.getData("text/plain");
      const chatHref = chatLinkData?.match(/href="([^"]+)"/)?.[1];
      const urlId = chatHref?.split("/").slice(-1)[0];
      const titleRegex = /title="(.*?)"/;
      const chatTitle = chatLinkData?.match(titleRegex)?.[1];

      // Remove the draggable display element
      const draggableDisplay = document.querySelector(
        "#draggableDisplay"
      ) as HTMLDivElement;
      if (draggableDisplay) {
        draggableDisplay.remove();
      }

      pinnedContainer.style.height = "auto";
      pinnedContainer.style.transition = "height 0.3s";
      pinnedContainer.style.borderStyle = "none";
      pinnedContainer.style.backgroundColor = "transparent";

      if (urlId) await handlePinChat(urlId, chatTitle);
    }

    function handleDragLeave(): void {
      const draggableDisplay = document.querySelector(
        "#draggableDisplay"
      ) as HTMLDivElement;

      if (draggableDisplay) {
        draggableDisplay.textContent = "Drag here to pin";
      }
    }

    pinnedContainer.addEventListener("dragover", handleDragOver);
    pinnedContainer.addEventListener("drop", handleDrop);
    pinnedContainer.addEventListener("dragleave", handleDragLeave);

    pinnedContainer.innerHTML = `
    <div class="bg-token-sidebar-surface-primary sticky top-0 z-20">
      <span class="flex h-9 items-center">
      <h3
        class="px-2 text-xs font-semibold text-ellipsis overflow-hidden break-all pt-3 pb-2 text-token-text-primary"
      >
        PinFlux Board
      </h3>
      </span>
      </div>
      <div 
        id="chatListContainer"
          >
        <ol id="pinnedChats" class="pinned-chats" 
          style="max-height: 150px; overflow-y: auto; overflow-x: hidden;"
            
        ></ol>
      </div>
    `;

    return pinnedContainer;
  }

  // Function to create the pin button
  function createPinButton(): HTMLDivElement {
    const pinButton: HTMLDivElement = document.createElement("div");
    pinButton.innerHTML = `
      <div
        role="menuitem"
        class="flex items-center m-1.5 p-2.5 text-sm cursor-pointer focus-visible:outline-0 radix-disabled:pointer-events-none radix-disabled:opacity-50 group relative hover:bg-[#f5f5f5] focus-visible:bg-[#f5f5f5] radix-state-open:bg-[#f5f5f5] dark:hover:bg-token-main-surface-secondary dark:focus-visible:bg-token-main-surface-secondary rounded-md my-0 px-3 mx-2 dark:radix-state-open:bg-token-main-surface-secondary gap-2.5 py-3"
        tabindex="-1"
        data-orientation="vertical"
        data-radix-collection-item=""
      >
        <div
          class="flex items-center justify-center text-token-text-secondary h-5 w-5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 -960 960 960"
            fill="none"
            class="h-5 w-5 shrink-0"
          >
            <path
              d="m624-480 96 96v72H516v228l-36 36-36-36v-228H240v-72l96-96v-264h-48v-72h384v72h-48v264Zm-282 96h276l-66-66v-294H408v294l-66 66Zm138 0Z"
              fill="currentColor"
              fill-rule="evenodd"
              clip-rule="evenodd"
            ></path>
          </svg>
        </div>
        Pin
      </div>
    `;
    return pinButton;
  }

  // Function to create the unpin button
  function createUnpinButton(): HTMLDivElement {
    const unpinButton: HTMLDivElement = document.createElement("div");
    unpinButton.innerHTML = `
      <div
        role="menuitem"
        class="flex items-center m-1.5 p-2.5 text-sm cursor-pointer focus-visible:outline-0 radix-disabled:pointer-events-none radix-disabled:opacity-50 group relative hover:bg-[#f5f5f5] focus-visible:bg-[#f5f5f5] radix-state-open:bg-[#f5f5f5] dark:hover:bg-token-main-surface-secondary dark:focus-visible:bg-token-main-surface-secondary rounded-md my-0 px-3 mx-2 dark:radix-state-open:bg-token-main-surface-secondary gap-2.5 py-3"
        tabindex="-1"
        data-orientation="vertical"
        data-radix-collection-item=""
      >
        <div
          class="flex items-center justify-center text-token-text-secondary h-5 w-5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 -960 960 960"
            fill="none"
            class="h-5 w-5 shrink-0"
          >
            <path
              d="M672-816v72h-48v307l-72-72v-235H408v91l-90-90-30-31v-42h384ZM480-48l-36-36v-228H240v-72l96-96v-42.46L90-768l51-51 678 679-51 51-222-223h-30v228l-36 36ZM342-384h132l-66-66-66 66Zm137-192Zm-71 126Z"
              fill="currentColor"
              fill-rule="evenodd"
              clip-rule="evenodd"
            ></path>
          </svg>
        </div>
        Unpin
      </div>
    `;
    return unpinButton;
  }

  const pinButton: HTMLDivElement = createPinButton();
  const unpinButton: HTMLDivElement = createUnpinButton();

  // Handle pinning a chat
  async function handlePinChat(
    urlId: string,
    chatTitle?: string,
    chatOptionsMenu?: HTMLDivElement
  ): Promise<void> {
    const storage = await chrome.storage.sync.get([`${profileId}`]);
    const savedChats: { urlId: string; title: string }[] =
      storage[`${profileId}`] || [];

    // Check if the chat is already pinned
    if (urlId && !savedChats.some((chat) => chat.urlId === urlId)) {
      pinButton.remove();
      chatOptionsMenu?.prepend(unpinButton);

      const pinnedChatsList = document.querySelector(
        "#pinnedChats"
      ) as HTMLOListElement;
      const newPinnedChat = createPinnedChat(
        chatTitle || "",
        urlId,
        profileId,
        sidebarElement
      );
      pinnedChatsList.prepend(newPinnedChat);

      savedChats.push({ urlId: urlId, title: chatTitle || "" });
      await chrome.storage.sync.set({ [`${profileId}`]: savedChats });
    }
  }

  // Handle unpinning a chat when the unpin button is clicked
  async function handleUnpinChat(urlId?: string): Promise<void> {
    const storage = await chrome.storage.sync.get([`${profileId}`]);
    const savedChats: { urlId: string; title: string }[] =
      storage[`${profileId}`] || [];

    if (urlId && savedChats.some((chat) => chat.urlId === urlId)) {
      const pinnedChats = document.querySelector(
        "#pinnedChats"
      ) as HTMLOListElement;
      const pinnedChat = pinnedChats
        .querySelector(`a[href="https://chatgpt.com/c/${urlId}"]`)
        ?.closest("li");
      if (pinnedChat) {
        pinnedChat.remove();
      }
      const index = savedChats.findIndex((chat) => chat.urlId === urlId);
      if (index !== -1) {
        savedChats.splice(index, 1); // Remove the URL from pinned chats
        await chrome.storage.sync.set({ [`${profileId}`]: savedChats });
      }
    }
  }

  // Function to get the sidebar element
  function getSidebarElement(): Promise<HTMLElement> {
    return new Promise<HTMLElement>((resolve, reject) => {
      const maxRetries = 20;
      let attempts = 0;

      const interval = setInterval(() => {
        const sidebarElement = document.querySelector(
          ".group\\/sidebar"
        ) as HTMLElement | null;
        if (
          sidebarElement &&
          sidebarElement.children.length >= 3 &&
          sidebarElement.children[2] instanceof HTMLDivElement
        ) {
          clearInterval(interval);
          resolve(sidebarElement);
        }

        attempts++;
        if (attempts >= maxRetries) {
          clearInterval(interval);
          reject(new Error("Sidebar element not fully ready"));
        }
      }, 500);
    });
  }

  // Initialize the pinned chats container
  let sidebarElement = await getSidebarElement();
  const pinnedContainer = createPinnedContainerElement();

  async function getHistoryElement() {
    return new Promise<HTMLDivElement>((resolve) => {
      const interval = setInterval(() => {
        const historyElement = document.getElementById(
          "history"
        ) as HTMLDivElement;

        if (historyElement) {
          clearInterval(interval);
          resolve(historyElement);
        }
      }, 100);
    });
  }

  const historyElement = await getHistoryElement();

  async function initPinnedChats(): Promise<void> {
    if (historyElement) {
      const parentElement = historyElement.parentElement as HTMLDivElement;
      parentElement.insertBefore(pinnedContainer, historyElement);
      const pinnedChats = pinnedContainer.querySelector(
        "#pinnedChats"
      ) as HTMLOListElement;

      // Load pinned chats from storage
      if (!profileId) {
        console.error(
          "Profile ID not found. Pinned chats will not be displayed."
        );
        return;
      }
      const storage = await chrome.storage.sync.get([`${profileId}`]);
      const savedChats: { urlId: string; title: string }[] =
        storage[`${profileId}`] || [];
      savedChats.forEach((chat) => {
        const pinnedChat = createPinnedChat(
          chat.title,
          chat.urlId,
          profileId,
          sidebarElement
        );
        pinnedChats.prepend(pinnedChat);
      });
    } else {
      console.error(
        "History element not found. Pinned chats will not be displayed."
      );
    }
  }

  await initPinnedChats();

  function handleDragStart(event: DragEvent): void {
    const target = event.target as HTMLElement;

    if (!target.id) {
      const pinnedChats = document.querySelector(
        "#chatListContainer"
      ) as HTMLDivElement;
      const pinnedChatsHeight = pinnedChats.offsetHeight;
      requestAnimationFrame(() => {
        if (pinnedChatsHeight < 70) {
          pinnedChats.style.height = "70px";
        }
      });
      const draggableDisplay = createDraggableDisplay("Drag here to pin");
      pinnedChats.appendChild(draggableDisplay);
      pinnedChats.style.transition = "height 0.3s";
      pinnedChats.style.borderStyle = "dashed";

      const chatLink = (event.target as HTMLElement)?.outerHTML || "";
      event.dataTransfer?.setData("text/plain", chatLink);
    } else {
      const chatLink = target.outerHTML || "";
      event.dataTransfer?.setData("text/plain", chatLink);
    }
  }

  function handleDragEnd(): void {
    const pinnedChats = document.querySelector(
      "#chatListContainer"
    ) as HTMLDivElement;

    pinnedChats.style.height = "auto";
    pinnedChats.style.transition = "height 0.3s";
    pinnedChats.style.borderStyle = "none";
    pinnedChats.style.backgroundColor = "transparent";

    const draggableDisplay = document.querySelector(
      "#draggableDisplay"
    ) as HTMLDivElement;
    if (draggableDisplay) {
      draggableDisplay.remove();
    }
  }

  sidebarElement.addEventListener("dragstart", handleDragStart);
  sidebarElement.addEventListener("dragend", handleDragEnd);

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
      const chatOptionsMenu = document
        .querySelectorAll('[role="menu"], [role="dialog"]')[1]
        .querySelector("div.overflow-y-auto") as HTMLDivElement;

      if (chatOptionsMenu) {
        const deleteButton = chatOptionsMenu.querySelector(
          '[data-testid="delete-chat-menu-item"]'
        );
        if (deleteButton) {
          deleteButton.addEventListener("click", async () => {
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
                      .querySelector(`a[href="https://chatgpt.com/c/${urlId}"]`)
                      ?.closest("li");
                    if (pinnedChat) {
                      pinnedChat.remove();
                    }
                    const storage = await chrome.storage.sync.get([
                      `${profileId}`,
                    ]);
                    const savedChats: { urlId: string; title: string }[] =
                      storage[`${profileId}`] || [];
                    const index = savedChats.findIndex(
                      (chat) => chat.urlId === urlId
                    );
                    if (index !== -1) {
                      savedChats.splice(index, 1); // Remove the URL from pinned chats
                      await chrome.storage.sync.set({
                        [`${profileId}`]: savedChats,
                      });
                    }
                  }
                }
              );
            }
          });
        }

        // Check pinned status and display the appropriate button
        const storage = await chrome.storage.sync.get([`${profileId}`]);
        const savedChats: { urlId: string; title: string }[] =
          storage[`${profileId}`] || [];
        if (urlId) {
          if (savedChats.some((chat) => chat.urlId === urlId)) {
            chatOptionsMenu.prepend(unpinButton);
          } else {
            chatOptionsMenu.prepend(pinButton);
          }
        }

        // Handle pinning and unpinning
        if (urlId && chatTitle) {
          pinButton.addEventListener("click", async () => {
            await handlePinChat(urlId, chatTitle, chatOptionsMenu);
          });
        }
        unpinButton.addEventListener("click", async () => {
          await handleUnpinChat(urlId);
        });
      }
    }
  });
})();
