import { isDarkMode } from "@/components/utils/styleScheme";
import handlePinChat from "@/components/pinChats/core/handlePinChat";
import pinnedContainerElm from "./pinnedContainer.html?raw";

// Function to create the container for pinned chats
export default function createPinnedContainerElement(): HTMLDivElement {
  const pinnedContainer: HTMLDivElement = document.createElement("div");
  pinnedContainer.setAttribute("id", "pinnedContainer");
  pinnedContainer.className = "relative mt-5 first:mt-0 last:mb-5";

  const style = document.createElement("style");
  // Style the scrollbar for pinned chats: color, width, etc.
  style.textContent = `
          #pinnedChats {
          scrollbar-width: thin; /* Firefox */
          --scroll-thumb: #e0e0e0; 
          --scroll-thumb-hover: #c0c0c0; 
          --scroll-thumb-active: #a0a0a0; 
          scrollbar-color: var(--scroll-thumb) transparent;
        }

        ${
          isDarkMode &&
          `
          #pinnedChats {
            --scroll-thumb: #303030;
            --scroll-thumb-hover: #505050;
            --scroll-thumb-active: #707070;
            scrollbar-color: var(--scroll-thumb) transparent;
          }
        `
        }

        #pinnedChats::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        #pinnedChats::-webkit-scrollbar-thumb {
          background-color: var(--scroll-thumb);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
          transition: background-color 0.2s ease;
        }

        #pinnedChats:hover {
          --scroll-thumb: var(--scroll-thumb-hover);
        }

        #pinnedChats::-webkit-scrollbar-thumb:hover {
          background-color: var(--scroll-thumb-active);
        }

        #pinnedChats::-webkit-scrollbar-track,
        #pinnedChats::-webkit-scrollbar-corner,
        #pinnedChats::-webkit-scrollbar-button {
          background-color: transparent;
        }
      
    `;
  document.head.appendChild(style);

  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    const draggableDisplay = document.querySelector(
      "#draggableDisplay"
    ) as HTMLDivElement;
    if (draggableDisplay) {
      draggableDisplay.textContent = "Drop to pin";
    }
  }

  async function handleDrop(event: DragEvent): Promise<void> {
    event.preventDefault();

    pinnedContainer.style.backgroundColor = "transparent";
    pinnedContainer.style.transition = "all 0.3s";
    pinnedContainer.style.borderStyle = "none";

    const chatLinkData = event.dataTransfer?.getData("text/plain");
    const chatHref = chatLinkData?.match(/href="([^"]+)"/)?.[1];
    const urlId = chatHref?.split("/").slice(-1)[0];
    const titleRegex = /title="(.*?)"/;
    const chatTitle = chatLinkData?.match(titleRegex)?.[1];

    // Remove the draggable display element
    const draggableDisplay = document.querySelector(
      "#draggableDisplay"
    ) as HTMLDivElement;
    if (draggableDisplay) {
      draggableDisplay.remove();
    }

    pinnedContainer.style.height = "auto";
    pinnedContainer.style.transition = "height 0.3s";
    pinnedContainer.style.borderStyle = "none";
    pinnedContainer.style.backgroundColor = "transparent";

    if (typeof urlId === "string") await handlePinChat(urlId, chatTitle ?? "");
  }

  function handleDragLeave(): void {
    const draggableDisplay = document.querySelector(
      "#draggableDisplay"
    ) as HTMLDivElement;

    if (draggableDisplay) {
      draggableDisplay.textContent = "Drag here to pin";
    }
  }

  pinnedContainer.addEventListener("dragover", handleDragOver);
  pinnedContainer.addEventListener("drop", handleDrop);
  pinnedContainer.addEventListener("dragleave", handleDragLeave);

  pinnedContainer.innerHTML = pinnedContainerElm;

  return pinnedContainer;
}
