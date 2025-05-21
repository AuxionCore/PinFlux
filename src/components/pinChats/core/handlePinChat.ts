import getProfileId from "@/components/utils/getProfileId";
import createPinnedChat from "@/components/pinChats/core/createPinnedChat";
import getSidebarElement from "@/components/pinChats/core/getSidebarElement";

// Handle pinning a chat
export default async function handlePinChat(
  urlId: string,
  chatTitle: string,
  pinButton: HTMLDivElement,
  chatOptionsMenu?: HTMLDivElement
): Promise<void> {
  const profileId = await getProfileId();
  if (!profileId) {
    console.error("Profile ID not found. Cannot pin chat.");
    return;
  }

  const sidebarElement = await getSidebarElement();
  if (!sidebarElement) {
    console.error("Sidebar element not found. Cannot pin chat.");
    return;
  }

  const storage = await browser.storage.sync.get([`${profileId}`]);
  const savedChats: { urlId: string; title: string }[] =
    storage[`${profileId}`] || [];

  // Check if the chat is already pinned
  if (urlId && !savedChats.some((chat) => chat.urlId === urlId)) {
    pinButton.remove();

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
    await browser.storage.sync.set({ [`${profileId}`]: savedChats });
  }
}
