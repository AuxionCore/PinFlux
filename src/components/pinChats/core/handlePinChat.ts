import getProfileId from "@/components/utils/getProfileId";
import createPinnedChat from "@/components/pinChats/core/createPinnedChat";
import getHistoryElement from "@/components/pinChats/core/getHistoryElement";

// Handle pinning a chat
export default async function handlePinChat(
  urlId: string,
  chatTitle: string,
  pinButton?: HTMLDivElement,
  chatOptionsMenu?: HTMLDivElement
): Promise<void> {
  const profileId = await getProfileId();
  if (!profileId) {
    console.error("Profile ID not found. Cannot pin chat.");
    return;
  }

  const historyElement = await getHistoryElement();
  if (!historyElement) {
    console.error("History element not found. Cannot pin chat.");
    return;
  }

  const storage = await browser.storage.sync.get([`${profileId}`]);
  const savedChats: { urlId: string; title: string }[] =
    storage[`${profileId}`] || [];

  // Check if the chat is already pinned
  if (urlId && !savedChats.some((chat) => chat.urlId === urlId)) {
    pinButton?.remove();
    chatOptionsMenu?.remove();

    const pinnedChatsList = document.querySelector(
      "#chatListContainer"
    ) as HTMLDivElement;
    const newPinnedChat = createPinnedChat(
      chatTitle || "",
      urlId,
      profileId,
      historyElement
    );
    pinnedChatsList.prepend(newPinnedChat);

    savedChats.push({ urlId: urlId, title: chatTitle || "" });
    await browser.storage.sync.set({ [`${profileId}`]: savedChats });
  }
}
