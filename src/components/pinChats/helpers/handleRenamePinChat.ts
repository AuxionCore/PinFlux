import { renamePinChatInStorage } from "@/components/utils/storage";

// Handle rename chat button click
export default function handleRenamePinChat(
  li: HTMLLIElement,
  profileId: string
): void {
  const a = li.querySelector("a");
  if (!a) return;

  const titleDiv = a.querySelector("div");
  if (!titleDiv) return;

  const originalTitle = titleDiv.textContent?.trim() || "";
  const inputWrapper = document.createElement("div");
  inputWrapper.className =
    "bg-token-sidebar-surface-secondary absolute start-[7px] end-2 top-0 bottom-0 flex items-center z-10";

  const input = document.createElement("input");
  input.className =
    "border-token-border-default w-full border bg-transparent p-0 text-sm";
  input.type = "text";
  input.value = originalTitle;

  inputWrapper.appendChild(input);
  li.appendChild(inputWrapper);

  input.focus();

  const cleanup = () => {
    inputWrapper.remove();
  };

  const finishEditing = async () => {
    const newValue = input.value.trim();

    if (!newValue) {
      titleDiv.textContent = originalTitle;
    } else if (newValue !== originalTitle) {
      titleDiv.textContent = newValue;

      // Save the new title to storage
      const urlId = a?.getAttribute("id");
      if (!urlId) {
        throw new Error("URL ID not found, cannot rename chat.");
      }
      await renamePinChatInStorage(profileId, urlId, newValue);
    }

    cleanup();
  };

  const cancelEditing = () => {
    titleDiv.textContent = originalTitle;
    cleanup();
  };

  input.addEventListener("blur", finishEditing, { once: true });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  });
}
