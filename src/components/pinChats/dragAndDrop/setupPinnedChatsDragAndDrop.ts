// מוסיף Drag & Drop לכל אלמנט עם draggable=true בתוך קונטיינר נתון
import { updatePinChatsOrder } from '@/components/utils/storage'

export default function setupPinnedChatsDragAndDrop(
  pinnedChats: HTMLElement,
  profileId: string
) {
  console.log('🐛 Setting up drag and drop for:', pinnedChats)
  console.log('🐛 Container children:', pinnedChats.children)
  
  let dragged: HTMLElement | null = null
  let dragInsertIndicator: HTMLElement | null = null

  // Add CSS for dragging state if not already added
  if (!document.querySelector('#pin-chat-drag-styles')) {
    console.log('🐛 Adding drag styles to page')
    const style = document.createElement('style')
    style.id = 'pin-chat-drag-styles'
    style.textContent = `
      .dragging {
        opacity: 0.3 !important;
        pointer-events: none !important;
        z-index: 1000 !important;
        position: relative !important;
        transform: scale(0.95) !important;
        transition: none !important;
        background-color: rgba(255, 0, 0, 0.1) !important;
        border: 2px solid red !important;
      }
      .drag-placeholder {
        height: 3px !important;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6) !important;
        border-radius: 2px !important;
        margin: 4px 8px !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.6) !important;
        animation: pulse-glow 1s ease-in-out infinite alternate !important;
      }
      @keyframes pulse-glow {
        from {
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.4) !important;
          opacity: 0.8 !important;
        }
        to {
          box-shadow: 0 0 16px rgba(59, 130, 246, 0.8) !important;
          opacity: 1 !important;
        }
      }
      .pinned-chat-draggable {
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }
      .pinned-chat-draggable:hover {
        background-color: rgba(0, 0, 0, 0.02) !important;
        transform: translateX(2px) !important;
      }
      .pinned-chat-draggable:active {
        cursor: grabbing !important;
        transform: scale(0.98) !important;
      }
      .pinned-chat-draggable.mouse-down {
        cursor: grabbing !important;
        transform: scale(0.98) !important;
      }
      .drag-ghost-space {
        background: rgba(59, 130, 246, 0.05) !important;
        border: 2px dashed rgba(59, 130, 246, 0.3) !important;
        border-radius: 6px !important;
        min-height: 44px !important;
        transition: all 0.3s ease !important;
        animation: ghost-pulse 2s ease-in-out infinite !important;
      }
      @keyframes ghost-pulse {
        0%, 100% {
          background: rgba(59, 130, 246, 0.05) !important;
        }
        50% {
          background: rgba(59, 130, 246, 0.1) !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  function createDragInsertIndicator(): HTMLElement {
    const indicator = document.createElement('div')
    indicator.className = 'drag-placeholder'
    return indicator
  }

  function showInsertIndicator(afterElement: HTMLElement | null) {
    removeInsertIndicator()
    dragInsertIndicator = createDragInsertIndicator()
    
    if (afterElement) {
      afterElement.parentNode?.insertBefore(dragInsertIndicator, afterElement)
    } else {
      pinnedChats.appendChild(dragInsertIndicator)
    }
  }

  function removeInsertIndicator() {
    if (dragInsertIndicator) {
      dragInsertIndicator.remove()
      dragInsertIndicator = null
    }
  }

  function onDragOver(e: DragEvent) {
    // Only handle our pin chat reorder operations
    if (!dragged || !e.dataTransfer?.types.includes('text/plain')) return

    e.preventDefault()
    
    // Show insertion indicator
    const afterElement = getDragAfterElement(pinnedChats, e.clientY)
    showInsertIndicator(afterElement)
  }

  function onDrop(e: DragEvent) {
    // Only handle our pin chat reorder operations
    const data = e.dataTransfer?.getData('text/plain')
    if (data !== 'pin-chat-reorder' || !dragged) return

    e.preventDefault()
    e.stopPropagation()
    
    removeInsertIndicator()

    const container = pinnedChats
    const afterElement = getDragAfterElement(container, e.clientY)
    if (!afterElement || afterElement === dragged) {
      container.appendChild(dragged)
    } else {
      container.insertBefore(dragged, afterElement)
    }
    
    // Remove dragging state and restore original appearance
    dragged.classList.remove('dragging')
    dragged = null
    console.log('drop completed')

    // Save new order to storage
    saveCurrentOrder()
  }

  async function saveCurrentOrder() {
    try {
      const elements = pinnedChats.querySelectorAll(
        '.__menu-item, .pinned-chat'
      )
      const orderedUrlIds: string[] = []
      elements.forEach(el => {
        const urlId = el.getAttribute('id')
        if (urlId) {
          orderedUrlIds.push(urlId)
        }
      })
      await updatePinChatsOrder(profileId, orderedUrlIds)
      console.log('Order saved to storage:', orderedUrlIds)
    } catch (error) {
      console.error('Failed to save order:', error)
    }
  }

  function onDragEnter(e: DragEvent) {
    // Only handle our pin chat reorder operations
    if (!dragged) return
    e.preventDefault()
  }

  function onDragLeave(e: DragEvent) {
    // Only handle our pin chat reorder operations
    if (!dragged) return
    
    // Remove indicator if leaving the container completely
    if (e.target === pinnedChats && !pinnedChats.contains(e.relatedTarget as Node)) {
      removeInsertIndicator()
    }
  }

  function getDragAfterElement(container: HTMLElement, y: number) {
    const draggableElements = [
      ...container.querySelectorAll(
        '.__menu-item:not(.dragging), .pinned-chat:not(.dragging)'
      ),
    ] as HTMLElement[]
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child }
        } else {
          return closest
        }
      },
      { offset: -Infinity, element: null as HTMLElement | null }
    ).element
  }

  function addDnDListenersTo(el: HTMLElement) {
    console.log('🐛 Adding D&D to element:', el, el.className)
    let dragStartTime = 0
    let isDragging = false

    // Make the entire element draggable
    el.setAttribute('draggable', 'true')
    el.classList.add('pinned-chat-draggable')
    console.log('🐛 Element setup:', {
      element: el,
      draggable: el.getAttribute('draggable'),
      classes: el.className,
      hasDraggableClass: el.classList.contains('pinned-chat-draggable')
    })

    // Handle drag events directly on the element
    el.addEventListener('dragstart', (e: DragEvent) => {
      console.log('🐛 Drag start event triggered!', e, el)
      e.stopPropagation()
      dragStartTime = Date.now()
      isDragging = true
      dragged = el
      console.log('🐛 Adding dragging class to:', el)
      dragged.classList.add('dragging')
      console.log('🐛 Element classes after adding dragging:', dragged.className)

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', 'pin-chat-reorder')

        // Create a semi-transparent drag image
        const rect = el.getBoundingClientRect()
        console.log('🐛 Setting drag image:', el, rect)
        e.dataTransfer.setDragImage(el, rect.width / 2, rect.height / 2)
      }
      console.log('🐛 dragstart completed', dragged, 'has dragging class:', dragged.classList.contains('dragging'))
    })

    el.addEventListener('dragend', (e: DragEvent) => {
      e.stopPropagation()
      isDragging = false
      if (dragged) {
        dragged.classList.remove('dragging')
        dragged = null
      }
      removeInsertIndicator()
    })

    // Prevent default link behavior when dragging
    el.addEventListener('click', (e: MouseEvent) => {
      // If a drag operation just finished, prevent the click
      if (isDragging || (Date.now() - dragStartTime < 200)) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }, true)

    // Add visual feedback on mousedown
    el.addEventListener('mousedown', () => {
      if (!isDragging) {
        el.style.transform = 'scale(0.98)'
      }
    })

    el.addEventListener('mouseup', () => {
      if (!isDragging) {
        el.style.transform = ''
      }
    })

    el.addEventListener('mouseleave', () => {
      if (!isDragging) {
        el.style.transform = ''
      }
    })
  }

  // Listener for new pinned chats added dynamically
  const observer = new MutationObserver(mutations => {
    console.log('🐛 Mutation observed:', mutations)
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node instanceof HTMLElement &&
          (node.classList.contains('__menu-item') ||
            node.classList.contains('pinned-chat'))
        ) {
          console.log('🐛 New D&D element added:', node)
          addDnDListenersTo(node)
        }
      }
    }
  })
  observer.observe(pinnedChats, { childList: true })

  // Init for existing children
  const existingElements = pinnedChats.querySelectorAll('.__menu-item, .pinned-chat')
  console.log('🐛 Found existing elements:', existingElements.length, existingElements)
  existingElements.forEach(el => {
    console.log('🐛 Processing existing element:', el)
    addDnDListenersTo(el as HTMLElement)
  })
  pinnedChats.addEventListener('dragover', onDragOver)
  pinnedChats.addEventListener('dragenter', onDragEnter)
  pinnedChats.addEventListener('dragleave', onDragLeave)
  pinnedChats.addEventListener('drop', onDrop)
}
