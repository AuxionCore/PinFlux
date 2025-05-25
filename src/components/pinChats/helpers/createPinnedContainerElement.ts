import { isDarkMode } from "@/components/utils/styleScheme";
import handlePinChat from "@/components/pinChats/core/handlePinChat";

// Function to create the container for pinned chats
export default function createPinnedContainerElement(): HTMLElement {
  const pinnedContainer: HTMLElement = document.createElement("aside");
  const pinnedContainerTitle: HTMLHeadingElement = document.createElement("h2");
  const chatListContainer: HTMLDivElement = document.createElement("div");
  chatListContainer.setAttribute("id", "chatListContainer");
  pinnedContainerTitle.textContent = "PinFlux Board";
  pinnedContainerTitle.className = "__menu-label";
  chatListContainer.style.position = "relative";
  pinnedContainer.setAttribute("id", "pinnedContainer");
  pinnedContainer.className = "mx-[3px] last:mb-5 mt-5";

  pinnedContainer.appendChild(pinnedContainerTitle);
  pinnedContainer.appendChild(chatListContainer);

  const style = document.createElement("style");
  // Style the scrollbar for pinned chats: color, width, etc.
  style.textContent = `
          #chatListContainer {
          max-height: 150px;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin; /* Firefox */
          --scroll-thumb: #e0e0e0; 
          --scroll-thumb-hover: #c0c0c0; 
          --scroll-thumb-active: #a0a0a0; 
          scrollbar-color: var(--scroll-thumb) transparent;
        }

        ${
          isDarkMode &&
          `
          #chatListContainer {
            --scroll-thumb: #303030;
            --scroll-thumb-hover: #505050;
            --scroll-thumb-active: #707070;
            scrollbar-color: var(--scroll-thumb) transparent;
          }
        `
        }

        #chatListContainer::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        #chatListContainer::-webkit-scrollbar-thumb {
          background-color: var(--scroll-thumb);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
          transition: background-color 0.2s ease;
        }

        #chatListContainer:hover {
          --scroll-thumb: var(--scroll-thumb-hover);
        }

        #chatListContainer::-webkit-scrollbar-thumb:hover {
          background-color: var(--scroll-thumb-active);
        }

        #chatListContainer::-webkit-scrollbar-track,
        #chatListContainer::-webkit-scrollbar-corner,
        #chatListContainer::-webkit-scrollbar-button {
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
    const spanTextRegex = /<span[^>]*>(.*?)<\/span>/;
    const chatTitle = chatLinkData?.match(spanTextRegex)?.[1];

    // Remove the draggable display element
    const draggableDisplay = document.querySelector(
      "#draggableDisplay"
    ) as HTMLDivElement;
    if (draggableDisplay) {
      draggableDisplay.remove();
    }

    chatListContainer.style.height = "auto";
    chatListContainer.style.transition = "height 0.3s";
    chatListContainer.style.borderStyle = "none";
    chatListContainer.style.backgroundColor = "transparent";

    if (typeof urlId === "string" && chatTitle) {
      await handlePinChat(urlId, chatTitle);
    }
  }

  function handleDragLeave(): void {
    const draggableDisplay = document.querySelector(
      "#draggableDisplay"
    ) as HTMLDivElement;

    if (draggableDisplay) {
      draggableDisplay.textContent = "Drag here to pin";
    }
  }

  chatListContainer.addEventListener("dragover", handleDragOver);
  chatListContainer.addEventListener("drop", handleDrop);
  chatListContainer.addEventListener("dragleave", handleDragLeave);

  return pinnedContainer;
}
