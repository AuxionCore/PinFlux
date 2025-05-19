// Handle unpinning a chat when the unpin button is clicked
import { removePinChatFromStorage } from "@/components/utils/storage";

export default async function handleUnpinChat(
  profileId: string,
  urlId: string,
  unpinButton: HTMLDivElement
): Promise<void> {
  try {
    if (urlId) {
      unpinButton.remove();
      const pinnedChats = document.querySelector(
        "#pinnedChats"
      ) as HTMLOListElement;
      const pinnedChat = pinnedChats
        .querySelector(`a[href="https://chatgpt.com/c/${urlId}"]`)
        ?.closest("li");
      if (pinnedChat) {
        pinnedChat.remove();
      }
      await removePinChatFromStorage(profileId, urlId);
    }
  } catch (error) {
    console.error(error);
  }
}
