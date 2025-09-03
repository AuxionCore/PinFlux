// פונקציה פשוטה לגרירה של שיחות מוצמדות
import { updatePinChatsOrder } from '@/components/utils/storage'

export default function setupPinnedChatsDragAndDrop(
  pinnedChats: HTMLElement,
  profileId: string
) {
  console.log('🔥 Starting SIMPLE drag and drop setup')
  
  // Prevent multiple instances
  if (pinnedChats.hasAttribute('data-drag-setup')) {
    console.log('🔥 Drag and drop already setup for this container')
    return
  }
  pinnedChats.setAttribute('data-drag-setup', 'true')
  
  let draggedElement: HTMLElement | null = null
  let dropIndicator: HTMLElement | null = null

  // הוספת CSS פשוט - רק אם עדיין לא קיים
  if (!document.querySelector('#simple-drag-css')) {
    const style = document.createElement('style')
    style.id = 'simple-drag-css'
  style.textContent = `
    .being-dragged {
      opacity: 0.4 !important;
      transform: scale(0.95) !important;
      transition: none !important;
    }
    .drop-indicator {
      height: 2px !important;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6) !important;
      border-radius: 1px !important;
      margin: 3px 12px !important;
      box-shadow: 0 0 6px rgba(59, 130, 246, 0.5) !important;
      animation: pulse-indicator 1.2s ease-in-out infinite alternate !important;
    }
    @keyframes pulse-indicator {
      from {
        opacity: 0.7;
        box-shadow: 0 0 4px rgba(59, 130, 246, 0.4);
      }
      to {
        opacity: 1;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
      }
    }
    `
    document.head.appendChild(style)
    console.log('🔥 Added simple CSS')
  } else {
    console.log('🔥 CSS already exists, skipping')
  }  function closeAllOptionsMenus() {
    // חפש ותסגור כל תפריטי אפשרויות פתוחים
    const openMenus = document.querySelectorAll('[data-testid="conversation-turn-action-menu"], .options-menu, #chatOptionsMenu')
    openMenus.forEach(menu => {
      if (menu instanceof HTMLElement) {
        menu.remove()
      }
    })
    
    // גם הסר כל overlay או backdrop שעלול להיות פתוח
    const overlays = document.querySelectorAll('.overlay, .backdrop, [role="menu"]')
    overlays.forEach(overlay => {
      if (overlay instanceof HTMLElement && overlay.style.display !== 'none') {
        overlay.style.display = 'none'
      }
    })
    
    console.log('🔥 Closed all options menus')
  }

  // הוסף מאזין גלובלי למקש ESC לסגירת תפריטים
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllOptionsMenus()
    }
  })

  function createDropIndicator(): HTMLElement {
    const indicator = document.createElement('div')
    indicator.className = 'drop-indicator'
    return indicator
  }

  function showDropIndicator(beforeElement: HTMLElement | null) {
    removeDropIndicator()
    dropIndicator = createDropIndicator()
    
    if (beforeElement) {
      beforeElement.parentNode?.insertBefore(dropIndicator, beforeElement)
    } else {
      pinnedChats.appendChild(dropIndicator)
    }
  }

  function removeDropIndicator() {
    if (dropIndicator) {
      dropIndicator.remove()
      dropIndicator = null
    }
  }

  function setupElement(element: HTMLElement) {
    console.log('🔥 Setting up element:', element.textContent?.trim())
    
    // הפוך לניתן לגרירה
    element.draggable = true
    
    element.addEventListener('dragstart', (e) => {
      console.log('🔥 DRAG START!', element.textContent?.trim())
      
      // סגור כל תפריטי אפשרויות פתוחים
      closeAllOptionsMenus()
      
      draggedElement = element
      element.classList.add('being-dragged')
      
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', 'reorder')
      }
    })
    
    element.addEventListener('dragend', () => {
      console.log('🔥 DRAG END!')
      if (draggedElement) {
        draggedElement.classList.remove('being-dragged')
        draggedElement = null
      }
      removeDropIndicator()
    })
  }

  // הגדרת הקונטיינר
  pinnedChats.addEventListener('dragover', (e) => {
    e.preventDefault()
    
    if (draggedElement) {
      const afterElement = getDropTarget(pinnedChats, e.clientY)
      showDropIndicator(afterElement)
    }
  })

  pinnedChats.addEventListener('drop', (e) => {
    e.preventDefault()
    console.log('🔥 DROP!')
    
    removeDropIndicator()
    
    if (!draggedElement) return

    // מצא איפה להכניס
    const afterElement = getDropTarget(pinnedChats, e.clientY)
    
    if (afterElement) {
      pinnedChats.insertBefore(draggedElement, afterElement)
    } else {
      pinnedChats.appendChild(draggedElement)
    }
    
    console.log('🔥 Moved element!')
    saveOrder()
  })

  pinnedChats.addEventListener('dragleave', (e) => {
    // הסר את הקו רק אם יוצאים מהקונטיינר לגמרי
    if (e.target === pinnedChats && !pinnedChats.contains(e.relatedTarget as Node)) {
      removeDropIndicator()
    }
  })

  function getDropTarget(container: HTMLElement, y: number): HTMLElement | null {
    const draggableElements = [...container.children].filter(
      child => child !== draggedElement && 
               child.tagName === 'A' && 
               !child.classList.contains('drop-indicator')
    ) as HTMLElement[]

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect()
      const offset = y - box.top - box.height / 2

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child }
      } else {
        return closest
      }
    }, { offset: Number.NEGATIVE_INFINITY, element: null as HTMLElement | null }).element
  }

  async function saveOrder() {
    try {
      const elements = [...pinnedChats.children].filter(el => el.tagName === 'A') as HTMLElement[]
      const order = elements.map(el => el.id).filter(id => id)
      console.log('🔥 Saving order:', order)
      await updatePinChatsOrder(profileId, order)
    } catch (error) {
      console.error('🔥 Save error:', error)
    }
  }

  // הגדרת כל האלמנטים הקיימים
  function initElements() {
    const links = pinnedChats.querySelectorAll('a[href*="/c/"]')
    console.log('🔥 Found', links.length, 'links to setup')
    links.forEach(link => setupElement(link as HTMLElement))
  }

  // צפייה באלמנטים חדשים
  const observer = new MutationObserver(() => {
    console.log('🔥 New elements detected, re-initializing')
    initElements()
  })
  
  observer.observe(pinnedChats, { childList: true })

  // התחלה
  initElements()
  console.log('🔥 Simple drag and drop setup complete!')
}
