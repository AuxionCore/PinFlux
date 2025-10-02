import { isDarkMode } from "@/components/utils/styleScheme";
import handlePinChat from "@/components/pinChats/core/handlePinChat";

// Function to create the container for pinned chats
export default function createPinnedContainerElement(): HTMLElement {
  // Load saved expanded state (default: true)
  let isExpanded = true;
  try {
    const savedState = localStorage.getItem('pinflux-board-expanded');
    if (savedState !== null) {
      isExpanded = savedState === 'true';
    }
  } catch (e) {
    console.warn('Failed to load PinFlux Board state:', e);
  }

  // Create the main wrapper with the expandable section structure
  const sectionWrapper: HTMLDivElement = document.createElement("div");
  sectionWrapper.className = isExpanded 
    ? "group/sidebar-expando-section mb-[var(--sidebar-expanded-section-margin-bottom)]" 
    : "group/sidebar-expando-section mb-[var(--sidebar-collapsed-section-margin-bottom)]";
  sectionWrapper.setAttribute("data-pinflux-section", "true"); // Marker for re-init detection
  
  // Create the header with title (similar to "Chats" section)
  const headerButton: HTMLDivElement = document.createElement("div");
  headerButton.setAttribute("tabindex", "0");
  headerButton.setAttribute("data-fill", "");
  headerButton.className = "group __menu-item hoverable";
  headerButton.setAttribute("aria-expanded", isExpanded.toString());
  headerButton.setAttribute("aria-label", isExpanded ? "Collapse PinFlux Board section" : "Expand PinFlux Board section");
  headerButton.setAttribute("data-no-hover-bg", "true");
  headerButton.setAttribute("data-no-contents-gap", "true");
  
  const headerContent: HTMLDivElement = document.createElement("div");
  headerContent.className = "text-token-text-tertiary flex w-full items-center justify-start gap-0.5";
  
  const pinnedContainerTitle: HTMLHeadingElement = document.createElement("h2");
  pinnedContainerTitle.textContent = "PinFlux Board";
  pinnedContainerTitle.className = "__menu-label";
  pinnedContainerTitle.setAttribute("data-no-spacing", "true");
  
  // Create the SVG arrow
  const arrowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arrowSvg.setAttribute("width", "16");
  arrowSvg.setAttribute("height", "16");
  arrowSvg.setAttribute("viewBox", "0 0 16 16");
  arrowSvg.setAttribute("fill", "currentColor");
  arrowSvg.setAttribute("data-rtl-flip", "");
  arrowSvg.setAttribute("class", "h-3 w-3");
  arrowSvg.style.transition = "transform 0.2s ease, opacity 0.2s ease";
  arrowSvg.style.transform = isExpanded ? "rotate(90deg)" : "rotate(0deg)";
  arrowSvg.style.opacity = isExpanded ? "0" : "1"; // Always visible when collapsed, hidden when expanded
  
  const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  arrowPath.setAttribute("d", "M6.02925 3.02929C6.25652 2.80202 6.60803 2.77382 6.86616 2.94433L6.97065 3.02929L11.4707 7.52929C11.7304 7.78899 11.7304 8.211 11.4707 8.4707L6.97065 12.9707C6.71095 13.2304 6.28895 13.2304 6.02925 12.9707C5.76955 12.711 5.76955 12.289 6.02925 12.0293L10.0585 7.99999L6.02925 3.9707L5.94429 3.8662C5.77378 3.60807 5.80198 3.25656 6.02925 3.02929Z");
  arrowSvg.appendChild(arrowPath);
  
  headerContent.appendChild(pinnedContainerTitle);
  headerContent.appendChild(arrowSvg);
  headerButton.appendChild(headerContent);
  
  // Create the content container (aside with pinned chats)
  const pinnedContainer: HTMLElement = document.createElement("aside");
  pinnedContainer.setAttribute("id", "pinnedContainer");
  pinnedContainer.className = "";
  pinnedContainer.style.display = isExpanded ? "block" : "none";
  
  const chatListContainer: HTMLDivElement = document.createElement("div");
  chatListContainer.setAttribute("id", "chatListContainer");
  chatListContainer.style.position = "relative";
  
  pinnedContainer.appendChild(chatListContainer);
  
  // Toggle function for expand/collapse
  const toggleExpanded = () => {
    isExpanded = !isExpanded;
    headerButton.setAttribute("aria-expanded", isExpanded.toString());
    headerButton.setAttribute("aria-label", isExpanded ? "Collapse PinFlux Board section" : "Expand PinFlux Board section");
    pinnedContainer.style.display = isExpanded ? "block" : "none";
    arrowSvg.style.transform = isExpanded ? "rotate(90deg)" : "rotate(0deg)";
    
    // Update arrow opacity based on expanded state
    // When collapsed: always visible (1), when expanded: hidden by default (0)
    arrowSvg.style.opacity = isExpanded ? "0" : "1";
    
    // Update section wrapper class
    sectionWrapper.className = isExpanded 
      ? "group/sidebar-expando-section mb-[var(--sidebar-expanded-section-margin-bottom)]" 
      : "group/sidebar-expando-section mb-[var(--sidebar-collapsed-section-margin-bottom)]";
    
    // Save state to localStorage
    try {
      localStorage.setItem('pinflux-board-expanded', isExpanded.toString());
    } catch (e) {
      console.warn('Failed to save PinFlux Board state:', e);
    }
  };
  
  // Add click event listener
  headerButton.addEventListener('click', toggleExpanded);
  
  // Add keyboard support (Enter/Space)
  headerButton.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpanded();
    }
  });
  
  // Show/hide arrow on hover - only when expanded
  headerButton.addEventListener('mouseenter', () => {
    if (isExpanded) {
      arrowSvg.style.opacity = "1";
    }
  });
  
  headerButton.addEventListener('mouseleave', () => {
    if (isExpanded) {
      arrowSvg.style.opacity = "0";
    }
  });
  
  // Assemble the structure
  sectionWrapper.appendChild(headerButton);
  sectionWrapper.appendChild(pinnedContainer);

  const style = document.createElement("style");
  // Style the scrollbar for pinned chats: color, width, etc.
  style.textContent = `
          #chatListContainer {
          max-height: 150px;
          overflow: hidden; /* Start with hidden */
          --scroll-thumb: #e0e0e0; 
          --scroll-thumb-hover: #c0c0c0; 
          --scroll-thumb-active: #a0a0a0; 
        }

        /* Scrollable state - only when needed */
        #chatListContainer.scrollable {
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        #chatListContainer.scrollable::-webkit-scrollbar {
          display: none;
        }

        ${
          isDarkMode &&
          `
          #chatListContainer {
            --scroll-thumb: #303030;
            --scroll-thumb-hover: #505050;
            --scroll-thumb-active: #707070;
          }
        `
        }

        /* Show scrollbar on hover only when scrollable */
        #chatListContainer.scrollable:hover {
          scrollbar-width: thin;
          scrollbar-color: var(--scroll-thumb-hover) transparent;
        }

        #chatListContainer.scrollable:hover::-webkit-scrollbar {
          display: block;
          width: 6px;
          height: 6px;
        }

        #chatListContainer.scrollable:hover::-webkit-scrollbar-thumb {
          background-color: var(--scroll-thumb);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
          transition: background-color 0.2s ease;
        }

        #chatListContainer.scrollable:hover::-webkit-scrollbar-thumb:hover {
          background-color: var(--scroll-thumb-active);
        }

        #chatListContainer.scrollable:hover::-webkit-scrollbar-track,
        #chatListContainer.scrollable:hover::-webkit-scrollbar-corner,
        #chatListContainer.scrollable:hover::-webkit-scrollbar-button {
          background-color: transparent;
        }
      
    `;
  document.head.appendChild(style);

  // Function to check if scrolling is needed
  function checkScrollNeed(): void {
    // Measure content without changing overflow first
    const currentHeight = chatListContainer.clientHeight;
    const contentHeight = chatListContainer.scrollHeight;
    
    const needsScroll = contentHeight > currentHeight;
    
    if (needsScroll) {
      chatListContainer.classList.add('scrollable');
    } else {
      chatListContainer.classList.remove('scrollable');
      // Remove any inline overflow styles
      chatListContainer.style.removeProperty('overflow');
      chatListContainer.style.removeProperty('overflow-y');
      chatListContainer.style.removeProperty('overflow-x');
    }
  }

  // Observer to watch for content changes
  const observer = new MutationObserver(() => {
    requestAnimationFrame(checkScrollNeed);
  });

  observer.observe(chatListContainer, {
    childList: true,
    subtree: true,
    attributes: true
  });

  // Initial check
  setTimeout(checkScrollNeed, 100);

  // Function to ensure draggableDisplay exists when dragging starts
  function ensureDraggableDisplay(): HTMLDivElement {
    let draggableDisplay = document.querySelector(
      "#draggableDisplay"
    ) as HTMLDivElement;
    
    if (!draggableDisplay) {
      draggableDisplay = document.createElement('div');
      const draggableDisplayText = document.createElement('span');
      
      draggableDisplayText.textContent = 'Drag here to pin';
      draggableDisplay.appendChild(draggableDisplayText);
      
      draggableDisplay.setAttribute('id', 'draggableDisplay');
      draggableDisplayText.style.fontWeight = '500';
      draggableDisplay.style.border = '2px dashed #dedede';
      draggableDisplay.style.borderRadius = '8px';
      draggableDisplay.style.zIndex = '1000';
      draggableDisplay.style.backgroundColor = isDarkMode
        ? 'rgba(40, 40, 40, 95)'
        : 'rgba(230, 230, 230, 95)';
      draggableDisplay.style.color = isDarkMode ? '#dedede' : '#000000';
      draggableDisplay.style.display = 'flex';
      draggableDisplay.style.flexDirection = 'column';
      draggableDisplay.style.alignItems = 'center';
      draggableDisplay.style.justifyContent = 'center';
      draggableDisplay.style.position = 'absolute';
      draggableDisplay.style.top = `${chatListContainer.scrollTop}px`;
      draggableDisplay.style.left = '0';
      draggableDisplay.style.width = '100%';
      draggableDisplay.style.height = `${chatListContainer.clientHeight}px`;
      draggableDisplay.style.pointerEvents = 'none';
      
      chatListContainer.appendChild(draggableDisplay);
      
      // Expand the container if needed
      if (chatListContainer.offsetHeight < 70) {
        requestAnimationFrame(() => {
          chatListContainer.style.height = '70px';
          draggableDisplay.style.height = '70px';
          chatListContainer.style.transition = 'height 0.3s';
          chatListContainer.style.borderStyle = 'dashed';
        });
      }
    }
    
    return draggableDisplay;
  }

  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    
    // Ensure draggableDisplay exists (create if needed)
    const draggableDisplay = ensureDraggableDisplay();
    
    // Update text when hovering over the drop zone
    const textSpan = draggableDisplay.querySelector('span');
    if (textSpan) {
      textSpan.textContent = "Drop to pin";
    }
  }

  async function handleDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation(); // Prevent duplicate calls from nested elements

    pinnedContainer.style.backgroundColor = "transparent";
    pinnedContainer.style.transition = "all 0.3s";
    pinnedContainer.style.borderStyle = "none";

    // Try multiple data formats
    const textPlain = event.dataTransfer?.getData("text/plain");
    const textHtml = event.dataTransfer?.getData("text/html");
    
    const chatLinkData = textHtml || textPlain;
    
    const chatHref = chatLinkData?.match(/href="([^"]+)"/)?.[1];
    
    // Extract urlId from both regular chats (/c/{id}) and project chats (/g/g-p-{projectId}/c/{id})
    let urlId = '';
    if (chatHref) {
      const urlSegments = chatHref.split('/').filter(Boolean);
      const cIndex = urlSegments.indexOf('c');
      if (cIndex !== -1 && cIndex < urlSegments.length - 1) {
        urlId = urlSegments[cIndex + 1];
      }
    }
    
    // Parse HTML to extract chat title more reliably
    let chatTitle = '';
    if (chatLinkData) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(chatLinkData, 'text/html');
      const linkElement = doc.querySelector('a');
      if (linkElement) {
        // Get text content, removing extra whitespace
        chatTitle = linkElement.textContent?.trim() || '';
      }
    }

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

  function handleDragLeave(event: DragEvent): void {
    // Check if we're leaving the entire pinned container area
    const rect = pinnedContainer.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    // If mouse is outside the container bounds
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      const draggableDisplay = document.querySelector(
        "#draggableDisplay"
      ) as HTMLDivElement;

      if (draggableDisplay) {
        // Don't remove it! Just change the text back to "Drag here to pin"
        const textSpan = draggableDisplay.querySelector('span');
        if (textSpan) {
          textSpan.textContent = "Drag here to pin";
        }
      }
      
      // Reset container styles but keep the draggableDisplay visible
      pinnedContainer.style.backgroundColor = "transparent";
      pinnedContainer.style.borderStyle = "none";
    }
  }

  // Global cleanup function for drag operations
  function cleanupDragDisplay(): void {
    const draggableDisplay = document.querySelector(
      "#draggableDisplay"
    ) as HTMLDivElement;

    if (draggableDisplay) {
      draggableDisplay.remove();
    }
    
    // Reset container styles
    chatListContainer.style.borderStyle = "none";
    chatListContainer.style.height = "auto";
    pinnedContainer.style.backgroundColor = "transparent";
    pinnedContainer.style.borderStyle = "none";
  }

  // Detect when dragging something in the sidebar area
  function handleSidebarDragEnter(event: DragEvent): void {
    const target = event.target as HTMLElement;
    // Check if we're dragging a chat link from sidebar (but not from pinned board itself)
    if (target.closest('[data-discover="true"]') && !target.closest('#chatListContainer')) {
      ensureDraggableDisplay();
    }
  }

  chatListContainer.addEventListener("dragover", handleDragOver);
  chatListContainer.addEventListener("drop", handleDrop);
  chatListContainer.addEventListener("dragleave", handleDragLeave);
  
  // Also add listeners to pinnedContainer to catch external drags
  pinnedContainer.addEventListener("dragover", handleDragOver);
  pinnedContainer.addEventListener("drop", handleDrop);
  pinnedContainer.addEventListener("dragleave", handleDragLeave);
  
  // Add global dragend listener to clean up if drag ends anywhere
  document.addEventListener("dragend", cleanupDragDisplay);
  
  // Add dragenter listener on document to detect external drags early
  document.addEventListener("dragenter", handleSidebarDragEnter);

  return sectionWrapper;
}
