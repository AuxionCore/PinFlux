import handlePinChat from "@/components/pinChats/core/handlePinChat";

export default function setupPinChatListener(
  urlId: string,
  pinButton: HTMLDivElement,
  pinChatHandler: ((event: MouseEvent) => Promise<void>) | null,
  chatTitle: string
) {
  if (pinChatHandler) {
    pinButton.removeEventListener("click", pinChatHandler);
  }

  pinChatHandler = async (event: MouseEvent) => {
    event.stopPropagation();
    await handlePinChat(urlId, chatTitle, pinButton);
  };

  pinButton.addEventListener("click", pinChatHandler);
}
