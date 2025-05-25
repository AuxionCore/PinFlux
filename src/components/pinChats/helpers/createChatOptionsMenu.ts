import handleUnpinChatBottomClick from "../pinButton/handleUnpinChatBottomClick";
import handleSearchOriginalChatButtonClick from "./handleSearchOriginalChat";
import handleRenamePinChat from "./handleRenamePinChat";
import pinChatOptionsMenu from "./pinChatOptionsMenu.html?raw";

export default function createChatOptionsMenu(
  anchor: HTMLAnchorElement,
  historyElement: HTMLElement,
  isDarkMode: boolean,
  profileId: string,
  closeMenu: () => void = () => {}
): HTMLDivElement {
  const chatOptionsMenu = document.createElement("div");
  chatOptionsMenu.setAttribute("id", "chatOptionsMenu");
  chatOptionsMenu.setAttribute("dir", "ltr");
  chatOptionsMenu.style.cssText = `
    position: fixed;
    left: 0px;
    top: 0px;
    min-width: max-content;
    z-index: 50;
    `;

  chatOptionsMenu.innerHTML = pinChatOptionsMenu;

  // Add event listeners to the menu items
  chatOptionsMenu.querySelectorAll("[role='menuitem']").forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.stopPropagation();

      const action = (e.currentTarget as HTMLElement).dataset.action;
      switch (action) {
        case "unpin":
          await handleUnpinChatBottomClick(anchor, profileId);
          break;
        case "rename":
          // Handle rename action here
          handleRenamePinChat(anchor, profileId);
          break;
        // case "originalChat":
        //   await handleSearchOriginalChatButtonClick(
        //     historyElement,
        //     li.querySelector("a")?.getAttribute("id") || "",
        //     isDarkMode
        //   );
        //   break;
      }
      closeMenu();
    });
  });
  return chatOptionsMenu;
}
