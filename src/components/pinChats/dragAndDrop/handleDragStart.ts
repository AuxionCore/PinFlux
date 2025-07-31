import createDraggableDisplay from './createDraggableDisplay'

/**
 * Handles the drag start event for chat items, setting up visual feedback for dragging to pin
 * @param event - The drag event containing information about the dragged element
 */
export default function handleDragStart(event: DragEvent): void {
  const target = event.target as HTMLAnchorElement
  const chatLink = target?.outerHTML || ''
  // Store the chat link data for transfer during drag operation
  event.dataTransfer?.setData('text/plain', chatLink)

  // Only show drag feedback for unpinned chats (those without an ID)
  if (!target.id) {
    const pinnedChats = document.querySelector(
      '#chatListContainer'
    ) as HTMLDivElement

    const scrollTop = pinnedChats.scrollTop
    const draggableDisplay = createDraggableDisplay('Drag here to pin')

    // Position the draggable display overlay
    draggableDisplay.style.position = 'absolute'
    draggableDisplay.style.top = `${scrollTop}px`
    draggableDisplay.style.left = '0'
    draggableDisplay.style.width = '100%'
    draggableDisplay.style.height = `${pinnedChats.clientHeight}px`
    draggableDisplay.style.pointerEvents = 'none' // Prevent interaction with the draggable display

    pinnedChats.appendChild(draggableDisplay)

    // Expand the pinned chats container if it's too small
    if (pinnedChats.offsetHeight < 70) {
      requestAnimationFrame(() => {
        pinnedChats.style.height = '70px'
        pinnedChats.style.transition = 'height 0.3s'
        pinnedChats.style.borderStyle = 'dashed'
      })
    }

    // Update draggable display position when user scrolls
    const updatePosition = () => {
      draggableDisplay.style.top = `${pinnedChats.scrollTop}px`
    }

    pinnedChats.addEventListener('scroll', updatePosition)

    // Clean up when drag operation ends
    const cleanup = () => {
      document.getElementById('draggableDisplay')?.remove()
      pinnedChats.removeEventListener('scroll', updatePosition)
      event.target?.removeEventListener('dragend', cleanup)
    }
    event.target?.addEventListener('dragend', cleanup)
  }
}
