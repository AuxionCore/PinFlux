import handleUnpinChat from "@/components/pinChats/core/handleUnpinChat";

export default function setupUnpinChatListener(
  profileId: string,
  urlId: string,
  unpinButton: HTMLDivElement,
  unpinChatHandler: ((event: MouseEvent) => Promise<void>) | null = null
) {
  if (unpinChatHandler) {
    unpinButton.removeEventListener("click", unpinChatHandler);
  }

  unpinChatHandler = async (event: MouseEvent) => {
    event.stopPropagation();
    await handleUnpinChat(profileId, urlId, unpinButton);
  };

  unpinButton.addEventListener("click", unpinChatHandler);
}
