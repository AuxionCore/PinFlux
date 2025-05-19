import createPinnedContainerElement from "@/components/pinChats/helpers/createPinnedContainerElement";
import createPinnedChat from "@/components/pinChats/core/createPinnedChat";
import { getPinChatsFromStorage } from "@/components/utils/storage";
export default async function initPinnedChats({
  profileId,
  sidebarElement,
  historyElement,
}: {
  profileId: string;
  sidebarElement: HTMLElement;
  historyElement: HTMLElement;
}): Promise<void> {
  const pinnedContainer = createPinnedContainerElement();

  const parentElement = historyElement.parentElement as HTMLDivElement;
  parentElement.insertBefore(pinnedContainer, historyElement);
  const pinnedChats = pinnedContainer.querySelector(
    "#pinnedChats"
  ) as HTMLOListElement;

  // Load pinned chats from storage
  if (!profileId) {
    console.error("Profile ID not found. Pinned chats will not be displayed.");
    return;
  }
  const savedPinChats = await getPinChatsFromStorage(profileId);
  savedPinChats.forEach((chat) => {
    const pinnedChat = createPinnedChat(
      chat.title,
      chat.urlId,
      profileId,
      sidebarElement
    );
    pinnedChats.prepend(pinnedChat);
  });
}
