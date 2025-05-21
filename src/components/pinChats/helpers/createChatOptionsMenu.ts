import handleUnpinChatBottomClick from "../pinButton/handleUnpinChatBottomClick";
import handleSearchOriginalChatButtonClick from "./handleSearchOriginalChat";
import handleRenamePinChat from "./handleRenamePinChat";
import pinChatOptionsMenu from "./pinChatOptionsMenu.html?raw";

export default function createChatOptionsMenu(
  li: HTMLLIElement,
  sidebarElement: HTMLElement,
  isDarkMode: boolean,
  profileId: string,
  closeMenu: () => void = () => {}
): HTMLDivElement {
  const chatOptionsMenu = document.createElement("div");
  chatOptionsMenu.setAttribute("id", "chatOptionsMenu");
  chatOptionsMenu.style.position = "absolute";
  chatOptionsMenu.style.zIndex = "9999";

  chatOptionsMenu.className =
    "z-50 max-w-xs rounded-2xl popover bg-clip-padding bg-token-main-surface-primary shadow-lg will-change-[opacity,transform] radix-side-bottom:animate-slideUpAndFade radix-side-left:animate-slideRightAndFade radix-side-right:animate-slideLeftAndFade radix-side-top:animate-slideDownAndFade border hires:border-token-border-heavy py-1.5 border-thin max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto select-none";
  chatOptionsMenu.innerHTML = pinChatOptionsMenu;

  // Add event listeners to the menu items
  chatOptionsMenu.querySelectorAll("[role='menuitem']").forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.stopPropagation();

      const action = (e.currentTarget as HTMLElement).dataset.action;
      switch (action) {
        case "unpin":
          await handleUnpinChatBottomClick(li, profileId);
          break;
        case "rename":
          // Handle rename action here
          handleRenamePinChat(li, profileId);
          break;
        case "originalChat":
          await handleSearchOriginalChatButtonClick(
            sidebarElement,
            li.querySelector("a")?.getAttribute("id") || "",
            isDarkMode
          );
          break;
      }
      closeMenu();
    });
  });
  return chatOptionsMenu;
}
