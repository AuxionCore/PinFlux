import { renamePinChatInStorage } from "@/components/utils/storage";

// Handle rename chat button click
export default function handleRenamePinChat(
  anchor: HTMLAnchorElement,
  profileId: string
): void {
  const titleSpan = anchor.querySelector("span");
  if (!titleSpan) return;

  const wrapperDiv = titleSpan.closest(".truncate");
  if (!wrapperDiv) return;

  const buttonWrapper = anchor.querySelector("button")?.parentElement
    ?.parentElement as HTMLDivElement;
  if (!buttonWrapper) return;

  const originalTitle = titleSpan.textContent?.trim() || "";

  // Hide the original text
  (wrapperDiv as HTMLElement).style.display = "none";
  buttonWrapper.style.display = "none";

  const input = document.createElement("input");
  input.className =
    "w-full border border-blue-400 dark:border-blue-500 rounded-sm bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
  input.type = "text";
  input.value = originalTitle;
  // Match the height of other links
  input.style.height = "36px";
  input.style.lineHeight = "36px";

  const inputWrapper = document.createElement("div");
  inputWrapper.className = "flex min-w-0 grow items-center gap-2 px-3";
  inputWrapper.style.height = "36px";
  inputWrapper.appendChild(input);

  // Find the parent container and add input outside the anchor
  const parentContainer = anchor.parentElement;
  if (!parentContainer) return;

  // Insert the input wrapper right after the anchor
  parentContainer.insertBefore(inputWrapper, anchor.nextSibling);
  
  // Hide the entire anchor during editing
  anchor.style.display = "none";

  input.focus();

  const cleanup = () => {
    inputWrapper.remove();
    (wrapperDiv as HTMLElement).style.display = "";
    buttonWrapper.style.display = "";
    // Show the anchor again
    anchor.style.display = "";
  };

  const finishEditing = async () => {
    const newValue = input.value.trim();

    if (!newValue) {
      titleSpan.textContent = originalTitle;
    } else if (newValue !== originalTitle) {
      titleSpan.textContent = newValue;
      const urlId = anchor.getAttribute("id");
      if (!urlId) {
        throw new Error("URL ID not found, cannot rename chat.");
      }
      await renamePinChatInStorage(profileId, urlId, newValue);
    }

    cleanup();
  };

  const cancelEditing = () => {
    titleSpan.textContent = originalTitle;
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
