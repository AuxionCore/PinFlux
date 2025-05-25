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

  // הסתרת הטקסט המקורי
  (wrapperDiv as HTMLElement).style.display = "none";
  buttonWrapper.style.display = "none";

  const input = document.createElement("input");
  input.className =
    "w-full border-none bg-transparent p-0 text-sm focus:ring-0";
  input.type = "text";
  input.value = originalTitle;

  const inputWrapper = document.createElement("div");
  inputWrapper.className = "flex min-w-0 grow items-center gap-2";
  inputWrapper.appendChild(input);

  // הוספת input לעריכה
  anchor.querySelector(".flex.min-w-0")?.appendChild(inputWrapper);

  input.focus();

  // השבתת פעולת הקישור
  const preventClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  anchor.addEventListener("click", preventClick, true); // useCapture true כדי לתפוס מוקדם

  const cleanup = () => {
    inputWrapper.remove();
    (wrapperDiv as HTMLElement).style.display = "";
    buttonWrapper.style.display = "";
    anchor.removeEventListener("click", preventClick, true);
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
