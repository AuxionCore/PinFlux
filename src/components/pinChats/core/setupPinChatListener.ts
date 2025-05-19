import handlePinChat from "@/components/pinChats/core/handlePinChat";

export default function setupPinChatListener(
  urlId: string,
  pinButton: HTMLDivElement,
  pinChatHandler: (() => void) | null,
  chatTitle: string,
  chatOptionsMenu: HTMLDivElement
) {
  if (pinChatHandler) {
    pinButton.removeEventListener("click", pinChatHandler);
  }

  pinChatHandler = () => {
    handlePinChat(urlId, chatTitle, chatOptionsMenu);
  };

  pinButton.addEventListener("click", pinChatHandler);
}
