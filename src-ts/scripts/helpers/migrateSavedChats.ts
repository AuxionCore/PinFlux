// Function to get the sidebar element
function getSidebarElement(): Promise<HTMLElement> {
  return new Promise<HTMLElement>((resolve) => {
    const interval = setInterval(() => {
      const sidebarElement = document.querySelector(".group\\/sidebar");
      if (sidebarElement) {
        clearInterval(interval);
        resolve(sidebarElement as HTMLElement);
      }
    }, 500);
  });
}

async function getChatTitle(urlId: string): Promise<string> {
  const sidebarElement = await getSidebarElement();
  const scrollContainer = sidebarElement?.parentElement;

  if (!sidebarElement || !scrollContainer) {
    throw new Error("Sidebar or scroll container not found");
  }

  const findChatUrl = (): HTMLAnchorElement | null =>
    sidebarElement.querySelector(`a[href="/c/${urlId}"]`);

  while (!findChatUrl()) {
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: "smooth",
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const chatLink = findChatUrl();
  chatLink?.scrollIntoView({ behavior: "smooth", block: "center" });

  const title = chatLink?.textContent?.trim() || "Untitled Chat";
  return title;
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

(async function migrateSavedChats() {
  try {
    const profileId: string = getUserId();
    const storage = await chrome.storage.sync.get([`${profileId}`]);
    const savedChatUrls: string[] = storage[`${profileId}`] || [];

    const migratedChats: { urlId: string; title: string }[] = [];

    for (const chatUrl of savedChatUrls) {
      const match = chatUrl.match(/^\/c\/(.+)$/);
      if (!match) continue;

      const urlId = match[1];
      try {
        const title = await getChatTitle(urlId);
        migratedChats.push({ urlId, title });
      } catch (error) {
        console.warn(`Failed to get title for ${urlId}:`, error);
      }
    }

    // Save in the new format
    await chrome.storage.sync.set({ [profileId]: migratedChats });
  } catch (error) {
    console.error(error);
  }
})();
