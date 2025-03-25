(async () => {
  const getCurrentScheme = () => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("color-scheme")
      .trim();
  };
  const isDarkMode = getCurrentScheme() === "dark";

  // Function to create a pinned chat element
  function createPinnedChat(
    title: string,
    url: string,
    profileId: string
  ): HTMLLIElement {
    const li: HTMLLIElement = document.createElement("li");
    const a: HTMLAnchorElement = document.createElement("a");
    const span: HTMLSpanElement = document.createElement("span");
    const unpinChatBtn: HTMLButtonElement = document.createElement("button");

    // Define SVG icon for unpinning chat
    const svg =
      `
      <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill=` +
      (isDarkMode ? "#dedede80" : "#00000090") +
      `>
        <path d="M672-816v72h-48v307l-72-72v-235H408v91l-90-90-30-31v-42h384ZM480-48l-36-36v-228H240v-72l96-96v-42.46L90-768l51-51 678 679-51 51-222-223h-30v228l-36 36ZM342-384h132l-66-66-66 66Zm137-192Zm-71 126Z"/>
      </svg>
    `;
    unpinChatBtn.innerHTML = svg;
    unpinChatBtn.setAttribute("title", "Unpin chat");
    unpinChatBtn.style.backgroundColor = "transparent";
    unpinChatBtn.style.textDecoration = "none";
    unpinChatBtn.style.border = "none";
    unpinChatBtn.style.cursor = "pointer";
    unpinChatBtn.style.padding = "5px";
    unpinChatBtn.style.visibility = "hidden"; // Hidden by default
    unpinChatBtn.style.opacity = "0"; // Hidden by default
    unpinChatBtn.style.transition = "opacity 0.3s, visibility 0.3s";

    // Handle unpin chat button click
    async function handleUnpinChatBtnClick(event: MouseEvent) {
      li.remove(); // Remove the pinned chat element profileId
      const profile = await chrome.storage.sync.get([`${profileId}`]);
      const pinnedChats = profile[`${profileId}`] || [];

      const index = pinnedChats.indexOf(url);
      if (index !== -1) {
        pinnedChats.splice(index, 1); // Remove the URL from pinned chats
        await chrome.storage.sync.set({ [`${profileId}`]: pinnedChats });
      }
    }

    // Set up the anchor link for the pinned chat
    a.href = `https://chatgpt.com${url}`;
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
    span.style.textAlign = "left";
    span.style.fontSize = "0.9rem";
    span.title = title;
    span.textContent = title;

    // Append the elements to the list item
    li.appendChild(a);
    a.appendChild(span);
    li.appendChild(unpinChatBtn);

    // Add hover effect to the unpin button
    unpinChatBtn.addEventListener("mouseover", () => {
      const svg = unpinChatBtn.querySelector("svg");
      if (svg) {
        svg.style.fill = isDarkMode ? "#dedede" : "#000000";
      }
    });

    unpinChatBtn.addEventListener("mouseout", () => {
      const svg = unpinChatBtn.querySelector("svg");
      if (svg) {
        svg.style.fill = isDarkMode ? "#dedede70" : "#00000070";
      }
    });

    // Add the click handler for unpinning
    unpinChatBtn.addEventListener("click", handleUnpinChatBtnClick);

    // Style the list item and anchor
    li.style.listStyle = "none";
    li.style.width = "100%";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.borderRadius = "8px";
    li.style.transition = "background-color 0.3s";
    if (`https://chatgpt.com${url}` === window.location.href) {
      li.style.backgroundColor = isDarkMode ? "#2F2F2F" : "#e3e3e3";
    } else {
      li.style.backgroundColor = "transparent";
    }

    // Add hover effect for the list item
    li.addEventListener("mouseover", () => {
      li.style.backgroundColor = isDarkMode ? "#212121" : "#ececec";
      unpinChatBtn.style.visibility = "visible";
      unpinChatBtn.style.opacity = "1";
    });

    li.addEventListener("mouseout", () => {
      li.style.backgroundColor = "transparent";
      unpinChatBtn.style.visibility = "hidden";
      unpinChatBtn.style.opacity = "0";

      if (`https://chatgpt.com${url}` === window.location.href) {
        li.style.backgroundColor = isDarkMode ? "#2F2F2F" : "#e3e3e3";
      }
    });

    li.addEventListener("mousedown", (event) => {
      event.preventDefault();
      li.style.backgroundColor = isDarkMode ? "#202020" : "#f0f0f0";
    });

    return li;
  }

  // Get the user ID from the local storage
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

  const profileId = getUserId();

  function createDraggableDisplay(text: string) {
    const colorScheme = getCurrentScheme();
    const draggableDisplay = document.createElement("div");
    const draggableDisplayText = document.createElement("span");
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

  function createPinnedContainerElement() {
    // Create the container for pinned chats
    const pinnedContainer: HTMLDivElement = document.createElement("div");
    pinnedContainer.setAttribute("id", "pinnedContainer");
    pinnedContainer.style.marginTop = "20px";

    pinnedContainer.addEventListener("dragover", (event) => {
      event.preventDefault();

      const draggableDisplay = document.querySelector(
        "#draggableDisplay"
      ) as HTMLDivElement;
      if (draggableDisplay) {
        draggableDisplay.textContent = "Drop to pin";
      }
    });

    pinnedContainer.addEventListener("drop", async (event) => {
      const pinnedChats = document.querySelector(
        "#pinnedChats"
      ) as HTMLUListElement;
      event.preventDefault();

      pinnedContainer.style.backgroundColor = "transparent";
      pinnedContainer.style.transition = "all 0.3s";
      pinnedContainer.style.borderStyle = "none";

      const chatElId = event.dataTransfer?.getData("text/plain");
      // const chatLink = document.querySelector(`#${chatElId} a`)?.getAttribute("href");
      // const chatUrl = chatLink?.match(/href="([^"]+)"/)?.[1];
      // const titleRegex = /title="(.*?)"/;
      // const chatTitle = chatLink?.match(titleRegex)?.[1];

      const chatToPin = document.getElementById(chatElId!) as HTMLLIElement;
      pinnedChats.prepend(chatToPin);

      console.log("pinnedChats: ", pinnedChats);

      // if (chatUrl) await handlePinChat(chatUrl, chatTitle);
    });

    pinnedContainer.addEventListener("dragleave", () => {
      const draggableDisplay = document.querySelector(
        "#draggableDisplay"
      ) as HTMLDivElement;
      if (draggableDisplay) {
        draggableDisplay.textContent = "Drag here to pin";
      }
    });

    pinnedContainer.innerHTML = `
    <h3
      class="pinned-title"
      style="font-size: 0.8rem; font-weight: 500; margin-left: 8px"
    >
      Pinned Chats
    </h3>
    <ol
      id="pinnedChats"
      class="pinned-chats"
      style="
        padding: 0;
        margin: 0;
        list-style-type: none;
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        position: relative;
        max-height: 150px;
        overflow-y: auto;
        overflow-x: hidden;
      "
    ></ol>
  `;

    return pinnedContainer;
  }

  function createPinButton() {
    const pinButton = document.createElement("div");
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

  function createUnpinButton() {
    const unpinButton = document.createElement("div");
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

  const pinButton = createPinButton();
  const unpinButton = createUnpinButton();

  async function handlePinChat(
    chatUrl: string,
    chatTitle?: string,
    chatOptionsMenu?: HTMLDivElement
  ) {
    const profile = await chrome.storage.sync.get([`${profileId}`]);
    const pinnedChatsUrls: string[] = profile[`${profileId}`] || [];

    if (chatUrl) {
      if (!pinnedChatsUrls.includes(chatUrl)) {
        pinButton.remove();
        chatOptionsMenu?.prepend(unpinButton);

        const pinnedChats = document.querySelector(
          "#pinnedChats"
        ) as HTMLUListElement;
        const pinnedChat = createPinnedChat(
          chatTitle || "",
          chatUrl,
          profileId
        );
        pinnedChats.prepend(pinnedChat);

        pinnedChatsUrls.push(chatUrl);
        await chrome.storage.sync.set({
          [`${profileId}`]: pinnedChatsUrls,
        });
      }
    }
  }

  // Function to handle unpinning a chat when the big unpin button is clicked
  async function handleUnpinChat(chatUrl?: string) {
    const profile = await chrome.storage.sync.get([`${profileId}`]);
    const pinnedChatsUrls: string[] = profile[`${profileId}`] || [];

    if (chatUrl) {
      if (pinnedChatsUrls.includes(chatUrl)) {
        const pinnedChats = document.querySelector(
          "#pinnedChats"
        ) as HTMLUListElement;
        const pinnedChat = pinnedChats
          .querySelector(`a[href="https://chatgpt.com${chatUrl}"]`)
          ?.closest("li");
        if (pinnedChat) {
          pinnedChat.remove();
        }

        const index = pinnedChatsUrls.indexOf(chatUrl);
        pinnedChatsUrls.splice(index, 1);
        await chrome.storage.sync.set({
          [`${profileId}`]: pinnedChatsUrls,
        });
      }
    }
  }

  // Function to insert the pinned container into the sidebar
  function getSidebarElement(): Promise<HTMLElement> {
    return new Promise<HTMLElement>((resolve) => {
      const interval = setInterval(async () => {
        const sidebarElement = document.querySelector(".group\\/sidebar");
        if (sidebarElement) {
          clearInterval(interval);
          resolve(sidebarElement as HTMLElement);
        }
      }, 500);
    });
  }

  // Call the function to set the pinned container
  let sidebarElement = await getSidebarElement();
  const pinnedContainer = createPinnedContainerElement();

  async function initPinnedChats() {
    if (sidebarElement.children.length >= 3) {
      const thirdChild = sidebarElement.children[2] as HTMLElement;
      if (thirdChild instanceof HTMLDivElement) {
        sidebarElement.insertBefore(pinnedContainer, thirdChild);
        const pinnedChats = pinnedContainer.querySelector(
          "#pinnedChats"
        ) as HTMLUListElement;

        // Load pinned chats from storage
        const profile = await chrome.storage.sync.get([`${profileId}`]);
        const pinnedChatsUrls: string[] = profile[`${profileId}`] || [];

        pinnedChatsUrls.forEach((url) => {
          const chatLink = document.querySelector(`a[href="${url}"]`);
          const chatTitle = chatLink?.querySelector("div")?.textContent;

          if (chatLink && chatTitle) {
            const pinnedChat: HTMLLIElement = createPinnedChat(
              chatTitle,
              url,
              profileId
            );
            pinnedChats.prepend(pinnedChat);
          }
        });
      } else {
        console.warn("Third child is not a div element");
      }
    } else {
      console.warn("Sidebar does not have 3 children yet");
    }
  }

  await initPinnedChats();

  sidebarElement.addEventListener("dragstart", (event) => {
    const pinnedChats = document.querySelector(
      "#pinnedChats"
    ) as HTMLUListElement;

    const pinnedChatsHeight = pinnedChats.offsetHeight;
    if (pinnedChatsHeight < 70) {
      pinnedChats.style.height = "70px";
    }

    const draggableDisplay = createDraggableDisplay("Drag here to pin");
    pinnedChats.appendChild(draggableDisplay);
    pinnedChats.style.transition = "height 0.3s";
    pinnedChats.style.borderStyle = "dashed";

    const chatLink = event.target as HTMLAnchorElement;
    const chatLiElement = chatLink.closest("li") as HTMLLIElement;
    chatLiElement.setAttribute("id", chatLink.href.split("/")[4]);
    event.dataTransfer?.setData("text/plain", chatLiElement.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  });

  sidebarElement.addEventListener("dragend", () => {
    const pinnedChats = document.querySelector(
      "#pinnedChats"
    ) as HTMLUListElement;
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
  });

  sidebarElement.addEventListener("click", async (event) => {
    const target =
      event.target &&
      (event.target as HTMLElement).closest(
        '[data-testid^="history-item-"][data-testid$="-options"]'
      );

    const chatElement = target?.closest("li") as HTMLLIElement;
    const chatLink = chatElement?.querySelector("a") as HTMLAnchorElement;
    const chatUrl = chatLink?.getAttribute("href") as string;
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
                  ) as HTMLUListElement;
                  if (chatUrl) {
                    const pinnedChat = pinnedChats
                      .querySelector(`a[href="https://chatgpt.com${chatUrl}"]`)
                      ?.closest("li");
                    if (pinnedChat) {
                      pinnedChat.remove();
                    }

                    const profile = await chrome.storage.sync.get([
                      `${profileId}`,
                    ]);
                    const pinnedChatsUrls: string[] =
                      profile[`${profileId}`] || [];
                    const index = pinnedChatsUrls.indexOf(chatUrl);
                    if (index !== -1) {
                      pinnedChatsUrls.splice(index, 1);
                      await chrome.storage.sync.set({
                        [`${profileId}`]: pinnedChatsUrls,
                      });
                    }
                  }
                }
              );
            }
          });
        }

        // Get the list of pinned chats
        const profile = await chrome.storage.sync.get([`${profileId}`]);
        const pinnedChatsUrls: string[] = profile[`${profileId}`] || [];

        if (chatUrl) {
          if (pinnedChatsUrls.includes(chatUrl)) {
            chatOptionsMenu.prepend(unpinButton);
          } else {
            chatOptionsMenu.prepend(pinButton);
          }
        }

        // Handle pinning and unpinning chats
        if (chatUrl && chatTitle) {
          pinButton.addEventListener("click", async () => {
            await handlePinChat(chatUrl, chatTitle, chatOptionsMenu);
          });
        }
        unpinButton.addEventListener("click", async () => {
          await handleUnpinChat(chatUrl);
        });
      }
    }
  });
})();
