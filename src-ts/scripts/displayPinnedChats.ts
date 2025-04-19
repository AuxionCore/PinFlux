interface SvgOptions {
  id: string;
  height?: string;
  width?: string;
  viewBox?: string;
  fill?: string;
  role?: string;
  ariaLabel?: string;
  title?: string;
  // An array of path data (the value set for d)
  paths: string[];
}

function createSvg(options: SvgOptions): SVGElement {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  // Set attributes for the SVG element
  svg.setAttribute("id", options.id);
  svg.setAttribute("xmlns", svgNS);
  if (options.height) {
    svg.setAttribute("height", options.height);
  }
  if (options.width) {
    svg.setAttribute("width", options.width);
  }
  if (options.viewBox) {
    svg.setAttribute("viewBox", options.viewBox);
  }
  if (options.fill) {
    svg.setAttribute("fill", options.fill);
  }

  // Set role and aria-label attributes
  svg.setAttribute("role", options.role || "img");
  if (options.ariaLabel) {
    svg.setAttribute("aria-label", options.ariaLabel);
  }

  // Add title element if provided
  if (options.title) {
    const titleElem = document.createElementNS(svgNS, "title");
    titleElem.textContent = options.title;
    svg.appendChild(titleElem);
  }

  // Create and append path elements
  options.paths.forEach((pathData) => {
    const pathElem = document.createElementNS(svgNS, "path");
    pathElem.setAttribute("d", pathData);
    svg.appendChild(pathElem);
  });

  return svg;
}

function getCurrentScheme(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("color-scheme")
    .trim();
}

(async () => {
  const isDarkMode: boolean = getCurrentScheme() === "dark";

  // Function to create a pinned chat element
  function createPinnedChat(
    title: string,
    urlId: string,
    profileId: string,
    sidebarElement: HTMLElement
  ): HTMLLIElement {
    const li: HTMLLIElement = document.createElement("li");
    const a: HTMLAnchorElement = document.createElement("a");
    const btnsContainer: HTMLDivElement = document.createElement("div");
    const unpinChatBtn: HTMLButtonElement = document.createElement("button");
    const searchOriginalChatBtn: HTMLButtonElement =
      document.createElement("button");

    const keepSvg = createSvg({
      id: "keepSvg",
      height: "18px",
      width: "18px",
      viewBox: "0 -960 960 960",
      fill: isDarkMode ? "#dedede80" : "#00000090",
      ariaLabel: "Unpin chat",
      paths: [
        "M672-816v72h-48v307l-72-72v-235H408v91l-90-90-30-31v-42h384ZM480-48l-36-36v-228H240v-72l96-96v-42.46L90-768l51-51 678 679-51 51-222-223h-30v228l-36 36ZM342-384h132l-66-66-66 66Zm137-192Zm-71 126Z",
      ],
    });

    const docSearchSvg = createSvg({
      id: "docSearchSvg",
      height: "20px",
      width: "20px",
      viewBox: "0 -960 960 960",
      fill: isDarkMode ? "#dedede80" : "#00000090",
      ariaLabel: "Search original chat",
      paths: [
        "M200-800v241-1 400-640 200-200Zm0 720q-33 0-56.5-23.5T120-160v-640q0-33 23.5-56.5T200-880h320l240 240v100q-19-8-39-12.5t-41-6.5v-41H480v-200H200v640h241q16 24 36 44.5T521-80H200Zm460-120q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29ZM864-40 756-148q-21 14-45.5 21t-50.5 7q-75 0-127.5-52.5T480-300q0-75 52.5-127.5T660-480q75 0 127.5 52.5T840-300q0 26-7 50.5T812-204L920-96l-56 56Z",
      ],
    });

    btnsContainer.setAttribute(
      "style",
      "display: flex;  gap: 5px; align-items: center; justify-content: center;"
    );

    btnsContainer.setAttribute("draggable", "true");
    btnsContainer.style.padding = "5px";

    unpinChatBtn.setAttribute("title", "Unpin chat");
    unpinChatBtn.setAttribute("aria-label", "Unpin chat");
    unpinChatBtn.setAttribute("draggable", "true");
    unpinChatBtn.style.backgroundColor = "transparent";
    unpinChatBtn.style.textDecoration = "none";
    unpinChatBtn.style.border = "none";
    unpinChatBtn.style.cursor = "pointer";
    unpinChatBtn.style.visibility = "hidden"; // Hidden by default
    unpinChatBtn.style.opacity = "0"; // Hidden by default
    unpinChatBtn.style.transition = "opacity 0.3s, visibility 0.3s";

    searchOriginalChatBtn.setAttribute("title", "Search original chat");
    searchOriginalChatBtn.setAttribute("aria-label", "Search original chat");
    searchOriginalChatBtn.setAttribute("draggable", "true");
    searchOriginalChatBtn.style.backgroundColor = "transparent";
    searchOriginalChatBtn.style.textDecoration = "none";
    searchOriginalChatBtn.style.border = "none";
    searchOriginalChatBtn.style.cursor = "pointer";
    searchOriginalChatBtn.style.visibility = "hidden"; // Hidden by default
    searchOriginalChatBtn.style.opacity = "0"; // Hidden by default
    searchOriginalChatBtn.style.transition = "opacity 0.3s, visibility 0.3s";

    // Handle unpin chat button click
    async function handleUnpinChatBtnClick(event: MouseEvent): Promise<void> {
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

    // Handle search original chat button click
    async function handleSearchOriginalChatBtnClick(): Promise<void> {
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

    // Set up the anchor link for the pinned chat
    a.setAttribute("title", title);
    a.setAttribute("draggable", "true");
    a.setAttribute("id", urlId);
    a.href = `https://chatgpt.com/c/${urlId}`;
    a.style.display = "flex";
    a.style.flexWrap = "nowrap";
    a.style.overflow = "hidden";
    a.style.textOverflow = "ellipsis";
    a.style.whiteSpace = "nowrap";
    a.style.maskImage = isDarkMode
      ? "linear-gradient(to right, rgba(0, 0, 0, 1) 90%, rgba(0, 0, 0, 0) 100%)"
      : "linear-gradient(to right, rgba(255, 255, 255, 1) 90%, rgba(255, 255, 255, 0) 100%)";
    a.style.flex = "1";
    a.style.alignItems = "center";
    a.style.padding = "8px";

    // Set up the span for the chat title
    a.style.textAlign = "left";
    a.style.fontSize = "0.9rem";
    a.textContent = title;

    // Append the elements
    li.appendChild(a);
    btnsContainer.appendChild(unpinChatBtn);
    btnsContainer.appendChild(searchOriginalChatBtn);
    li.appendChild(btnsContainer);
    unpinChatBtn.appendChild(keepSvg);
    searchOriginalChatBtn.appendChild(docSearchSvg);

    // Add hover effect to the unpin button
    unpinChatBtn.addEventListener("mouseover", () => {
      const keepSvg = unpinChatBtn.querySelector("svg");
      if (keepSvg) {
        keepSvg.style.fill = isDarkMode ? "#dedede" : "#000000";
      }
    });
    unpinChatBtn.addEventListener("mouseout", () => {
      const keepSvg = unpinChatBtn.querySelector("svg");
      if (keepSvg) {
        keepSvg.style.fill = isDarkMode ? "#dedede70" : "#00000070";
      }
    });
    unpinChatBtn.addEventListener("click", handleUnpinChatBtnClick);

    // Add hover effect to the search original chat button
    searchOriginalChatBtn.addEventListener("mouseover", () => {
      const docSearchSvg = searchOriginalChatBtn.querySelector("svg");
      if (docSearchSvg) {
        docSearchSvg.style.fill = isDarkMode ? "#dedede" : "#000000";
      }
    });
    searchOriginalChatBtn.addEventListener("mouseout", () => {
      const docSearchSvg = searchOriginalChatBtn.querySelector("svg");
      if (docSearchSvg) {
        docSearchSvg.style.fill = isDarkMode ? "#dedede70" : "#00000070";
      }
    });
    searchOriginalChatBtn.addEventListener(
      "click",
      handleSearchOriginalChatBtnClick
    );

    // Style the list item and anchor
    li.style.listStyle = "none";
    li.style.width = "100%";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.borderRadius = "8px";
    li.style.transition = "background-color 0.3s";
    if (`https://chatgpt.com/c/${urlId}` === window.location.href) {
      li.style.backgroundColor = isDarkMode ? "#2F2F2F" : "#e3e3e3";
    } else {
      li.style.backgroundColor = "transparent";
    }
    li.setAttribute("draggable", "true");

    // Add hover effect for the list item
    li.addEventListener("mouseover", () => {
      li.style.backgroundColor = isDarkMode ? "#212121" : "#ececec";
      unpinChatBtn.style.visibility = "visible";
      unpinChatBtn.style.opacity = "1";
      searchOriginalChatBtn.style.visibility = "visible";
      searchOriginalChatBtn.style.opacity = "1";
    });
    li.addEventListener("mouseout", () => {
      li.style.backgroundColor = "transparent";
      unpinChatBtn.style.visibility = "hidden";
      unpinChatBtn.style.opacity = "0";
      searchOriginalChatBtn.style.visibility = "hidden";
      searchOriginalChatBtn.style.opacity = "0";
      if (`https://chatgpt.com/c/${urlId}` === window.location.href) {
        li.style.backgroundColor = isDarkMode ? "#2F2F2F" : "#e3e3e3";
      }
    });
    li.addEventListener("mousedown", (event) => {
      event.preventDefault();
      li.style.backgroundColor = isDarkMode ? "#202020" : "#f0f0f0";
    });

    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragend", handleDragEnd);

    return li;
  }

  // Function to get the user ID from localStorage
  function getUserId(): string {
    const prefix = "cache/user";
    const matchingKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(prefix)
    );
    for (const key of matchingKeys) {
      const regex = /cache\/user-([a-zA-Z0-9]+)/;
      const match = key.match(regex);
      if (match) {
        return match[1];
      }
    }
    return "";
  }

  const profileId: string = getUserId();

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
    pinnedContainer.style.marginTop = "20px";

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
      <h3
        class="pinned-title"
        style="font-size: 0.8rem; font-weight: 500; margin-left: 8px"
      >
        PinFlux board
      </h3>
      <div 
        id="chatListContainer"
          style="
          position: relative;
          border-radius: 8px;
        ">
        <ol id="pinnedChats" class="pinned-chats" style="
          position: relative;
          padding: 0;
          margin: 0;
          list-style-type: none;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          border-radius: 8px;
          max-height: 150px;
        "></ol>
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

  async function initPinnedChats(): Promise<void> {
    const historyElement = document.getElementById("history") as HTMLDivElement;
    if (historyElement) {
      sidebarElement.insertBefore(pinnedContainer, historyElement);
      const pinnedChats = pinnedContainer.querySelector(
        "#pinnedChats"
      ) as HTMLOListElement;

      // Load pinned chats from storage
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
