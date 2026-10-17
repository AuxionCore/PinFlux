// Handle unpinning a chat when the unpin button is clicked
import { removePinChatFromStorage } from "@/components/utils/storage";
import { closeNativeMenu } from "@/components/pinChats/helpers/sidebarTheme";

export default async function handleUnpinChat(
  profileId: string,
  urlId: string,
  unpinButton: HTMLDivElement
): Promise<void> {
  try {
    if (urlId) {
      const menu = unpinButton.closest('[role="menu"]');
      unpinButton.remove();
      closeNativeMenu(menu);
      // The board may be unmounted right now; storage must still be updated
      document
        .querySelector("#chatListContainer")
        ?.querySelector(`a[href="https://chatgpt.com/c/${urlId}"]`)
        ?.remove();
      await removePinChatFromStorage(profileId, urlId);
    }
  } catch (error) {
    console.error(error);
  }
}
