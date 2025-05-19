import handleUnpinChat from "@/components/pinChats/core/handleUnpinChat";

export default function setupUnpinChatListener(
  profileId: string,
  urlId: string,
  unpinButton: HTMLDivElement,
  unpinChatHandler: (() => void) | null = null
) {
  if (unpinChatHandler) {
    unpinButton.removeEventListener("click", unpinChatHandler);
  }

  unpinChatHandler = () => {
    handleUnpinChat(profileId, urlId, unpinButton);
  };

  unpinButton.addEventListener("click", unpinChatHandler);
}
