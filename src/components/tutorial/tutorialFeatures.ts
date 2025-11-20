// Add CSS for tutorial animations
const addTutorialStyles = () => {
  if (!document.getElementById('tutorial-pin-styles')) {
    const css = `
      <style id="tutorial-pin-styles">
        @keyframes tutorial-pulse {
          0% { 
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2), 
                        0 0 20px rgba(99, 102, 241, 0.3);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.4), 
                        0 0 30px rgba(99, 102, 241, 0.5);
          }
          100% { 
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2), 
                        0 0 20px rgba(99, 102, 241, 0.3);
          }
        }
      </style>
    `
    document.head.insertAdjacentHTML('beforeend', css)
  }
}

// Global cleanup management for tutorial actions
interface TutorialCleanupManager {
  observers: MutationObserver[]
  intervals: NodeJS.Timeout[]
  timeouts: NodeJS.Timeout[]
  eventListeners: Array<{element: Element, event: string, handler: EventListener}>
}

let tutorialCleanup: TutorialCleanupManager = {
  observers: [],
  intervals: [],
  timeouts: [],
  eventListeners: []
}

// Helper functions for managed cleanup
const addManagedObserver = (observer: MutationObserver) => {
  tutorialCleanup.observers.push(observer)
  return observer
}

const addManagedInterval = (interval: NodeJS.Timeout) => {
  tutorialCleanup.intervals.push(interval)
  return interval
}

const addManagedTimeout = (timeout: NodeJS.Timeout) => {
  tutorialCleanup.timeouts.push(timeout)
  return timeout
}

const addManagedEventListener = (element: Element, event: string, handler: EventListener, options?: AddEventListenerOptions) => {
  element.addEventListener(event, handler, options)
  tutorialCleanup.eventListeners.push({element, event, handler})
}

// Clean up all managed resources
const cleanupTutorialResources = () => {
  
  tutorialCleanup.observers.forEach(observer => observer.disconnect())
  tutorialCleanup.intervals.forEach(interval => clearInterval(interval))
  tutorialCleanup.timeouts.forEach(timeout => clearTimeout(timeout))
  tutorialCleanup.eventListeners.forEach(({element, event, handler}) => {
    element.removeEventListener(event, handler)
  })
  
  // Clean up drag & drop visual guide
  const dragGuide = document.getElementById('tutorial-drag-guide')
  if (dragGuide) {
    dragGuide.remove()
  }
  
  const dragStyles = document.getElementById('drag-guide-styles')
  if (dragStyles) {
    dragStyles.remove()
  }
  
  tutorialCleanup = {
    observers: [],
    intervals: [],
    timeouts: [],
    eventListeners: []
  }
}

// Listen for tutorial cleanup events
document.addEventListener('tutorialCleanup', cleanupTutorialResources)

// Visual guide for drag and drop tutorial
const addDragDropGuide = () => {
  
  // Remove any existing guide
  const existingGuide = document.getElementById('tutorial-drag-guide')
  if (existingGuide) {
    existingGuide.remove()
  }
  
  // Try to find the pinned chats container - use multiple selectors as fallback
  let pinnedChatsContainer = document.querySelector('#chatListContainer')
  if (!pinnedChatsContainer) {
    pinnedChatsContainer = document.querySelector('nav[aria-label="Chat history"]')
  }
  if (!pinnedChatsContainer) {
    const firstPinnedChat = document.querySelector('[data-pinflux-pinned-chat]')
    if (firstPinnedChat) {
      pinnedChatsContainer = firstPinnedChat.parentElement
    }
  }
  if (!pinnedChatsContainer) {
    return
  }
  
  
  // Create animated guide overlay
  const guideOverlay = document.createElement('div')
  guideOverlay.id = 'tutorial-drag-guide'
  guideOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `
  
  // Create animated cursor and drag visualization
  const dragDemo = document.createElement('div')
  dragDemo.className = 'drag-demo-container'
  dragDemo.innerHTML = `
    <div class="drag-cursor" style="
      position: absolute;
      width: 20px;
      height: 20px;
      background: #10a37f;
      border-radius: 50%;
      pointer-events: none;
      z-index: 10001;
      box-shadow: 0 2px 8px rgba(16, 163, 127, 0.4);
      opacity: 0;
    ">
      <div style="
        position: absolute;
        top: -2px;
        left: -2px;
        width: 24px;
        height: 24px;
        border: 2px solid #10a37f;
        border-radius: 50%;
        animation: pulse-cursor 2s infinite;
      "></div>
    </div>
    <div class="drag-arrows" style="
      position: absolute;
      font-size: 18px;
      color: #10a37f;
      opacity: 0;
      z-index: 10001;
      animation: float-arrows 3s ease-in-out infinite;
    ">⇅</div>
  `
  
  guideOverlay.appendChild(dragDemo)
  ;(pinnedChatsContainer as HTMLElement).style.position = 'relative'
  pinnedChatsContainer.appendChild(guideOverlay)
  
  // Add CSS animations
  if (!document.getElementById('drag-guide-styles')) {
    const style = document.createElement('style')
    style.id = 'drag-guide-styles'
    style.textContent = `
      @keyframes pulse-cursor {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 1; }
      }
      
      @keyframes float-arrows {
        0%, 100% { transform: translateY(0px); opacity: 0.8; }
        50% { transform: translateY(-10px); opacity: 1; }
      }
      
      @keyframes drag-demo {
        0% { 
          transform: translateY(0px);
          opacity: 0;
        }
        15% {
          opacity: 1;
        }
        40% { 
          transform: translateY(-50px);
          opacity: 1;
        }
        60% { 
          transform: translateY(-50px);
          opacity: 0.8;
        }
        85% { 
          transform: translateY(0px);
          opacity: 1;
        }
        100% { 
          transform: translateY(0px);
          opacity: 0;
        }
      }
      
      .drag-demo-container {
        animation: drag-demo 4s ease-in-out infinite 1s;
      }
    `
    document.head.appendChild(style)
  }
  
  // Position the demo elements on the first two chats
  setTimeout(() => {
    const pinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
    
    if (pinnedChats.length >= 1) { // Changed from >= 2 to >= 1 for better testing
      const firstChat = pinnedChats[0] as HTMLElement
      const rect = firstChat.getBoundingClientRect()
      const containerRect = (pinnedChatsContainer as HTMLElement).getBoundingClientRect()
      
      
      const cursor = guideOverlay.querySelector('.drag-cursor') as HTMLElement
      const arrows = guideOverlay.querySelector('.drag-arrows') as HTMLElement
      
      if (cursor && arrows) {
        // Position cursor at the first chat
        const cursorTop = Math.max(0, rect.top - containerRect.top + 10)
        const cursorLeft = Math.max(0, rect.left - containerRect.left + 10)
        cursor.style.top = `${cursorTop}px`
        cursor.style.left = `${cursorLeft}px`
        cursor.style.opacity = '1'
        
        // Position arrows between first and second chat
        const arrowsTop = Math.max(0, rect.top - containerRect.top + rect.height + 10)
        const arrowsLeft = Math.max(0, rect.left - containerRect.left + rect.width/2)
        arrows.style.top = `${arrowsTop}px`
        arrows.style.left = `${arrowsLeft}px`
        arrows.style.opacity = '1'
        
      }
    }
  }, 500)
  
}

// Listen for tutorial cleanup events
document.addEventListener('tutorialCleanup', cleanupTutorialResources)

export interface TutorialStep {
  id: string
  titleKey: string
  messageKey: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlightElement?: boolean
  prerequisite?: () => boolean
  action?: () => Promise<void>
  waitForUserAction?: boolean // If true, no Next button - waits for user interaction
  subFeature?: string // Optional: identifies which sub-feature this step belongs to
  subFeatureNameKey?: string // Optional: i18n key for the sub-feature display name
}

export interface TutorialFeature {
  id: string
  version: string
  nameKey: string
  descriptionKey: string
  steps: TutorialStep[]
  category: 'core' | 'organization' | 'management' | 'shortcuts'
  order: number
}

/**
 * Central registry of all PinFlux features for tutorial system
 * Features are organized by categories and include step-by-step guidance
 */
export const TUTORIAL_FEATURES: TutorialFeature[] = [
  {
    id: 'pin_chats',
    version: '1.0.0',
    nameKey: 'tutorialPinChatsName',
    descriptionKey: 'tutorialPinChatsDesc',
    category: 'core',
    order: 1,
    steps: [
      {
        id: 'pin_step_1',
        titleKey: 'tutorialPinStep1Title',
        messageKey: 'tutorialPinStep1Message',
        targetSelector: '#history a[href*="/c/"]:first-of-type, #history [data-testid^="history-item"]:first-child',
        position: 'right',
        highlightElement: true,
        waitForUserAction: true, // Wait for user to click menu - no Next button
        subFeature: 'sidebar_menu',
        subFeatureNameKey: 'tutorialPinMethodSidebar',
        action: async () => {
          
          // Clean up any previous tutorial resources first
          cleanupTutorialResources()
          
          // Add tutorial styles
          addTutorialStyles()
          
          // Set up menu detection that will advance to step 2 when menu opens
          const setupMenuDetection = () => {
            let menuAdvanced = false
            
            const chatElement = document.querySelector('#history a[href*="/c/"]:first-of-type, #history [data-testid^="history-item"]:first-child') as HTMLElement
            if (!chatElement) {
              return
            }

            // Monitor for options button visibility and clicks
            let optionsListenerAdded = false
            const checkForOptionsButton = () => {
              if (optionsListenerAdded) return // Don't add multiple listeners
              
              const optionsButton = chatElement.querySelector('[data-testid*="options"]') as HTMLElement
              if (optionsButton && optionsButton.offsetParent !== null) {
                const handleOptionsClick = async () => {
                  
                  addManagedTimeout(setTimeout(() => {
                    if (menuAdvanced) return
                    
                    const menu = document.querySelector('[role="menu"]')
                    if (menu) {
                      menuAdvanced = true
                      
                      // Clean up observers immediately after advancing
                      clearInterval(optionsObserver)
                      menuObserver.disconnect()
                      
                      const advanceEvent = new CustomEvent('tutorialAdvance')
                      document.dispatchEvent(advanceEvent)
                    }
                  }, 200))
                }
                
                addManagedEventListener(optionsButton, 'click', handleOptionsClick, { once: true })
                optionsListenerAdded = true // Mark as added to prevent duplicates
              }
            }
            
            // Check periodically for options button, but stop after listener is added
            const optionsObserver = addManagedInterval(setInterval(() => {
              checkForOptionsButton()
              if (optionsListenerAdded) {
                clearInterval(optionsObserver) // Stop the interval once listener is added
              }
            }, 500))
            
            // Also observe for menu opening directly
            const menuObserver = addManagedObserver(new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as HTMLElement
                    if (element.getAttribute('role') === 'menu' || element.querySelector('[role="menu"]')) {
                      addManagedTimeout(setTimeout(() => {
                        if (menuAdvanced) return
                        
                        // Double-check we're still on step 1 by checking the data attribute
                        const tutorialTooltip = document.querySelector('.tutorial-tooltip')
                        if (!tutorialTooltip) {
                          return
                        }
                        
                        const currentStepId = tutorialTooltip.getAttribute('data-tutorial-step-id')
                        
                        // Only advance if we're specifically on pin_step_1
                        if (currentStepId !== 'pin_step_1') {
                          return
                        }
                        
                        const menu = document.querySelector('[role="menu"]')
                        if (menu) {
                          menuAdvanced = true
                          
                          // Clean up observers immediately after advancing
                          clearInterval(optionsObserver)
                          menuObserver.disconnect()
                          
                          // Remove from managed observers to prevent reactivation
                          const observerIndex = tutorialCleanup.observers.indexOf(menuObserver)
                          if (observerIndex > -1) {
                            tutorialCleanup.observers.splice(observerIndex, 1)
                          }
                          
                          const advanceEvent = new CustomEvent('tutorialAdvance')
                          document.dispatchEvent(advanceEvent)
                        }
                      }, 50))
                    }
                  }
                })
              })
            }))
            
            menuObserver.observe(document.body, { childList: true, subtree: true })
            
            // Fallback cleanup after 30 seconds in case menu never opens
            addManagedTimeout(setTimeout(() => {
              if (!menuAdvanced) {
                clearInterval(optionsObserver)
                menuObserver.disconnect()
              }
            }, 30000))
          }
          
          setupMenuDetection()
        }
      },
      {
        id: 'pin_step_2',
        titleKey: 'tutorialPinStep2Title',
        messageKey: 'tutorialPinStep2Message',
        targetSelector: '[role="menu"] [data-pinflux-pin-button], [data-pinflux-pin-button]',
        position: 'right',
        highlightElement: true,
        waitForUserAction: true, // Wait for user to click Pin - no Next button
        subFeature: 'sidebar_menu',
        subFeatureNameKey: 'tutorialPinMethodSidebar',
        action: async () => {
          
          // Try to find Pin button in open menu first, then generally
          let pinButton = document.querySelector('[role="menu"] [data-pinflux-pin-button]') as HTMLElement
          if (!pinButton) {
            pinButton = document.querySelector('[data-pinflux-pin-button]') as HTMLElement
          }
          
          if (pinButton) {
            
            const handlePinClick = () => {
              // Wait for pinning to complete, then advance to step 3
              addManagedTimeout(setTimeout(() => {
                const advanceEvent = new CustomEvent('tutorialAdvance')
                document.dispatchEvent(advanceEvent)
              }, 1000))
            }
            
            addManagedEventListener(pinButton, 'click', handlePinClick, { once: true })
          } else {
            
            // If Pin button not found, wait for it to appear
            const waitForPinButton = addManagedInterval(setInterval(() => {
              const foundPinButton = document.querySelector('[role="menu"] [data-pinflux-pin-button], [data-pinflux-pin-button]') as HTMLElement
              if (foundPinButton) {
                clearInterval(waitForPinButton)
                
                const handlePinClick = () => {
                  addManagedTimeout(setTimeout(() => {
                    const advanceEvent = new CustomEvent('tutorialAdvance')
                    document.dispatchEvent(advanceEvent)
                  }, 1000))
                }
                
                addManagedEventListener(foundPinButton, 'click', handlePinClick, { once: true })
              }
            }, 100))
            
            // Stop waiting after 10 seconds
            addManagedTimeout(setTimeout(() => clearInterval(waitForPinButton), 10000))
          }
        }
      },
      {
        id: 'pin_step_3',
        titleKey: 'tutorialPinnedLocationTitle',
        messageKey: 'tutorialPinnedLocationMessage',
        targetSelector: '#pinnedContainer',
        position: 'right',
        highlightElement: true,
        subFeature: 'sidebar_menu',
        subFeatureNameKey: 'tutorialPinMethodSidebar',
        action: async () => {
          // This step shows the success message after pinning
        }
      },
      {
        id: 'pin_alternative_method_step',
        titleKey: 'tutorialAlternativeMethodTitle',
        messageKey: 'tutorialAlternativeMethodMessage',
        targetSelector: '#pinnedContainer, #chatListContainer',
        position: 'right',
        highlightElement: false,
        subFeature: 'drag_drop',
        subFeatureNameKey: 'tutorialPinMethodDrag',
        action: async () => {
        }
      },
      {
        id: 'pin_drag_demo_step',
        titleKey: 'tutorialDragToPinTitle',
        messageKey: 'tutorialDragToPinMessage',
        targetSelector: '#history a[href*="/c/"]:nth-of-type(2), #history [data-testid^="history-item"]:nth-child(2)',
        position: 'right',
        highlightElement: true,
        waitForUserAction: true, // Wait for user to drag - no Next button
        subFeature: 'drag_drop',
        subFeatureNameKey: 'tutorialPinMethodDrag',
        action: async () => {
          
          // Find the second unpinned chat in history (skip the first one since it might have been used in the PIN tutorial)
          const historyChats = document.querySelectorAll('#history a[href*="/c/"]')
          let targetChat: HTMLElement | null = null
          let unpinnedCount = 0
          
          // Find the second unpinned chat (skip the first unpinned one)
          for (const chat of historyChats) {
            if (!chat.hasAttribute('data-pinflux-pinned-chat')) {
              unpinnedCount++
              if (unpinnedCount === 2) {
                targetChat = chat as HTMLElement
                break
              }
            }
          }
          
          // If we don't have a second unpinned chat, use the first unpinned one
          if (!targetChat) {
            for (const chat of historyChats) {
              if (!chat.hasAttribute('data-pinflux-pinned-chat')) {
                targetChat = chat as HTMLElement
                break
              }
            }
          }
          
          if (targetChat) {
            
            // Highlight the pinned area as drop target
            const pinnedContainer = document.querySelector('#pinnedContainer, #chatListContainer') as HTMLElement
            if (pinnedContainer) {
              pinnedContainer.style.border = "2px dashed #8b5cf6"
              pinnedContainer.style.borderRadius = "8px"
              pinnedContainer.style.backgroundColor = "rgba(139, 92, 246, 0.1)"
              pinnedContainer.style.transition = "all 0.3s ease"
              
              // Add tutorial-specific style for drag feedback
              if (!document.getElementById('tutorial-drag-style')) {
                const style = document.createElement('style')
                style.id = 'tutorial-drag-style'
                style.innerHTML = `
                  .tutorial-drag-target {
                    animation: drag-pulse 2s infinite !important;
                  }
                  @keyframes drag-pulse {
                    0% { 
                      border-color: #8b5cf6;
                      background-color: rgba(139, 92, 246, 0.1);
                    }
                    50% { 
                      border-color: #a855f7;
                      background-color: rgba(168, 85, 247, 0.15);
                    }
                    100% { 
                      border-color: #8b5cf6;
                      background-color: rgba(139, 92, 246, 0.1);
                    }
                  }
                `
                document.head.appendChild(style)
              }
              
              pinnedContainer.classList.add('tutorial-drag-target')
            }
            
            // Set up drag event listeners for the target chat
            const handleDragStart = (e: Event) => {
              if (pinnedContainer) {
                pinnedContainer.style.backgroundColor = "rgba(139, 92, 246, 0.2)"
                pinnedContainer.style.borderColor = "#a855f7"
              }
            }
            
            const handleDragEnd = (e: Event) => {
              // Clean up visual feedback
              if (pinnedContainer) {
                pinnedContainer.style.border = ""
                pinnedContainer.style.borderRadius = ""
                pinnedContainer.style.backgroundColor = ""
                pinnedContainer.style.transition = ""
                pinnedContainer.classList.remove('tutorial-drag-target')
              }
              
              const tutorialDragStyle = document.getElementById('tutorial-drag-style')
              if (tutorialDragStyle) {
                tutorialDragStyle.remove()
              }
            }
            
            // Set up observer to detect successful pin
            const pinObserver = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element
                    // Check if a new pinned chat was added
                    if (element.hasAttribute('data-pinflux-pinned-chat') || 
                        element.querySelector('[data-pinflux-pinned-chat]')) {
                      pinObserver.disconnect()
                      
                      // Advance to tutorial completion
                      addManagedTimeout(setTimeout(() => {
                        const advanceEvent = new CustomEvent('tutorialAdvance')
                        document.dispatchEvent(advanceEvent)
                      }, 500))
                    }
                  }
                })
              })
            })
            
            addManagedObserver(pinObserver)
            pinObserver.observe(document.body, {
              childList: true,
              subtree: true
            })
            
            // Add drag event listeners to the target chat
            addManagedEventListener(targetChat, 'dragstart', handleDragStart)
            addManagedEventListener(targetChat, 'dragend', handleDragEnd)
            
            // Make sure the chat is draggable
            targetChat.setAttribute('draggable', 'true')
            
            // Set up cleanup timeout (30 seconds)
            addManagedTimeout(setTimeout(() => {
              pinObserver.disconnect()
              if (pinnedContainer) {
                pinnedContainer.style.border = ""
                pinnedContainer.style.borderRadius = ""
                pinnedContainer.style.backgroundColor = ""
                pinnedContainer.style.transition = ""
                pinnedContainer.classList.remove('tutorial-drag-target')
              }
              const tutorialDragStyle = document.getElementById('tutorial-drag-style')
              if (tutorialDragStyle) {
                tutorialDragStyle.remove()
              }
            }, 30000))
            
          } else {
            console.warn('Step 5: No unpinned chats found for drag demo')
            // If no unpinned chats available, skip this step automatically
            addManagedTimeout(setTimeout(() => {
              const advanceEvent = new CustomEvent('tutorialAdvance')
              document.dispatchEvent(advanceEvent)
            }, 1000))
          }
        }
      },
      {
        id: 'pin_shortcut_method_step',
        titleKey: 'tutorialShortcutMethodTitle',
        messageKey: 'tutorialShortcutMethodMessage',
        targetSelector: '#pinnedContainer, #chatListContainer',
        position: 'right',
        highlightElement: false,
        subFeature: 'keyboard_shortcut',
        subFeatureNameKey: 'tutorialPinMethodShortcut',
        action: async () => {
        }
      },
      {
        id: 'pin_shortcut_demo_step',
        titleKey: 'tutorialShortcutDemoTitle',
        messageKey: 'tutorialShortcutDemoMessage',
        targetSelector: '#history a[href*="/c/"]:nth-of-type(3), #history [data-testid^="history-item"]:nth-child(3)',
        position: 'right',
        highlightElement: true,
        waitForUserAction: true, // Wait for user to click chat
        subFeature: 'keyboard_shortcut',
        subFeatureNameKey: 'tutorialPinMethodShortcut',
        action: async () => {
          
          // Find the third unpinned chat in history
          const historyChats = document.querySelectorAll('#history a[href*="/c/"]')
          let targetChat: HTMLElement | null = null
          let unpinnedCount = 0
          
          // Find the third unpinned chat
          for (const chat of historyChats) {
            if (!chat.hasAttribute('data-pinflux-pinned-chat')) {
              unpinnedCount++
              if (unpinnedCount === 3) {
                targetChat = chat as HTMLElement
                break
              }
            }
          }
          
          // If we don't have a third unpinned chat, use any available unpinned one
          if (!targetChat) {
            for (const chat of historyChats) {
              if (!chat.hasAttribute('data-pinflux-pinned-chat')) {
                targetChat = chat as HTMLElement
                break
              }
            }
          }
          
          if (targetChat) {
            let targetChatUrl = ''
            
            // Get the target chat URL
            const chatLink = targetChat as HTMLAnchorElement
            if (chatLink.href) {
              targetChatUrl = chatLink.href
            }
            
            // Handle chat click to navigate
            const handleChatClick = (e: Event) => {
            }
            
            addManagedEventListener(targetChat, 'click', handleChatClick)
            
            // Monitor for URL changes (chat navigation)
            const checkForNavigation = () => {
              const currentUrl = window.location.href
              
              // Check if we're on any chat page that can be pinned (not just the target chat)
              const isOnChatPage = /\/c\/[a-f0-9-]{8,}/.test(currentUrl)
              
              // Check if user navigated to the target chat specifically, or any different chat page
              if ((targetChatUrl && currentUrl === targetChatUrl)) {
                
                // Move to next step (shortcut step)
                addManagedTimeout(setTimeout(() => {
                  const advanceEvent = new CustomEvent('tutorialAdvance')
                  document.dispatchEvent(advanceEvent)
                }, 500))
                
                return true // Signal that we've found the target
              }
              return false // Signal that we haven't reached the target yet
            }
            
            // Don't check immediately - wait for user to actually navigate
            const navigationChecker = addManagedInterval(setInterval(() => {
              if (checkForNavigation()) {
                clearInterval(navigationChecker)
              }
            }, 200))
            
          } else {
            console.warn('Step 7: No unpinned chats found for navigation demo')
            // Skip this step if no chats available
            addManagedTimeout(setTimeout(() => {
              const advanceEvent = new CustomEvent('tutorialAdvance')
              document.dispatchEvent(advanceEvent)
            }, 1000))
          }
        }
      },
      {
        id: 'pin_shortcut_step',
        titleKey: 'tutorialShortcutStep1Title',
        messageKey: 'tutorialShortcutStep1Message',
        targetSelector: 'nav[aria-label="Chat history"]',
        position: 'right',
        highlightElement: false,
        waitForUserAction: true,
        subFeature: 'keyboard_shortcut',
        subFeatureNameKey: 'tutorialPinMethodShortcut',
        action: async () => {
          
          // Check if we're on a chat page
          const currentUrl = window.location.href
          const isOnChatPage = /\/c\/[a-f0-9-]{8,}/.test(currentUrl)
          
          // Test the regex directly
          const chatIdMatch = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)
          
          if (isOnChatPage) {
            
            // Set up keyboard shortcut listener
            const handleShortcut = (e: KeyboardEvent) => {
              
              // Check for Alt+P (the configured shortcut)
              if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault()
                
                // Get current chat info for debugging
                const currentUrl = window.location.href
                const currentChatId = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)?.[1]
                
                // Check if already pinned before setting up observer
                if (currentChatId) {
                  const existingPinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
                  
                  for (const pinnedChat of existingPinnedChats) {
                    const pinnedLink = pinnedChat.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                    if (pinnedLink) {
                      if (pinnedLink.href.includes(currentChatId)) {
                        addManagedTimeout(setTimeout(() => {
                          const advanceEvent = new CustomEvent('tutorialAdvance')
                          document.dispatchEvent(advanceEvent)
                        }, 500))
                        return
                      }
                    }
                  }
                }
                
                // Set up observer to detect successful pin
                const shortcutPinObserver = new MutationObserver((mutations) => {
                  
                  // Get current URL to check if this specific chat got pinned
                  const currentUrl = window.location.href
                  const currentChatId = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)?.[1]
                  
                  // Check if the current chat is now pinned
                  if (currentChatId) {
                    const pinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
                    
                    for (const pinnedChat of pinnedChats) {
                      const pinnedLink = pinnedChat.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                      if (pinnedLink) {
                        if (pinnedLink.href.includes(currentChatId)) {
                          shortcutPinObserver.disconnect()
                          document.removeEventListener('keydown', handleShortcut)
                          
                          // Advance to next step
                          addManagedTimeout(setTimeout(() => {
                            const advanceEvent = new CustomEvent('tutorialAdvance')
                            document.dispatchEvent(advanceEvent)
                          }, 1000))
                          return
                        }
                      }
                    }
                  }
                  
                  // Also check for changes in mutations
                  mutations.forEach((mutation, index) => {
                    
                    // Check attribute changes
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-pinflux-pinned-chat') {
                      const element = mutation.target as Element
                      const link = element.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                      if (currentChatId && link && link.href.includes(currentChatId)) {
                        shortcutPinObserver.disconnect()
                        document.removeEventListener('keydown', handleShortcut)
                        
                        addManagedTimeout(setTimeout(() => {
                          const advanceEvent = new CustomEvent('tutorialAdvance')
                          document.dispatchEvent(advanceEvent)
                        }, 1000))
                        return
                      }
                    }
                    
                    // Check added nodes
                    if (mutation.addedNodes.length > 0) {
                      mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                          const element = node as Element
                          if (element.hasAttribute && element.hasAttribute('data-pinflux-pinned-chat')) {
                            const link = element.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                            if (currentChatId && link && link.href.includes(currentChatId)) {
                              shortcutPinObserver.disconnect()
                              document.removeEventListener('keydown', handleShortcut)
                              
                              addManagedTimeout(setTimeout(() => {
                                const advanceEvent = new CustomEvent('tutorialAdvance')
                                document.dispatchEvent(advanceEvent)
                              }, 1000))
                            }
                          }
                          
                          // Also check for nested pinned chats
                          const nestedPinned = element.querySelector && element.querySelector('[data-pinflux-pinned-chat]')
                          if (nestedPinned) {
                            const link = nestedPinned.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                            if (currentChatId && link && link.href.includes(currentChatId)) {
                              shortcutPinObserver.disconnect()
                              document.removeEventListener('keydown', handleShortcut)
                              
                              addManagedTimeout(setTimeout(() => {
                                const advanceEvent = new CustomEvent('tutorialAdvance')
                                document.dispatchEvent(advanceEvent)
                              }, 1000))
                            }
                          }
                        }
                      })
                    }
                  })
                })
                
                addManagedObserver(shortcutPinObserver)
                shortcutPinObserver.observe(document.body, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['data-pinflux-pinned-chat']
                })
                
                
                // Also set up a periodic check as fallback (in case observer fails due to DOM changes)
                let pinCheckInterval: NodeJS.Timeout | null = null
                const checkForPin = () => {
                  const currentUrl = window.location.href
                  const currentChatId = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)?.[1]
                  
                  if (currentChatId) {
                    const pinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
                    for (const pinnedChat of pinnedChats) {
                      const pinnedLink = pinnedChat.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                      if (pinnedLink && pinnedLink.href.includes(currentChatId)) {
                        shortcutPinObserver.disconnect()
                        document.removeEventListener('keydown', handleShortcut)
                        if (pinCheckInterval) clearInterval(pinCheckInterval)
                        
                        addManagedTimeout(setTimeout(() => {
                          const advanceEvent = new CustomEvent('tutorialAdvance')
                          document.dispatchEvent(advanceEvent)
                        }, 500))
                        return true
                      }
                    }
                  }
                  return false
                }
                
                // Check immediately after a short delay (to let the pinning complete)
                addManagedTimeout(setTimeout(() => {
                  if (!checkForPin()) {
                    // If not found immediately, set up periodic checking
                    pinCheckInterval = addManagedInterval(setInterval(() => {
                      if (checkForPin() && pinCheckInterval) {
                        clearInterval(pinCheckInterval)
                        pinCheckInterval = null
                      }
                    }, 300)) // Check every 300ms
                    
                    // Stop checking after 10 seconds
                    addManagedTimeout(setTimeout(() => {
                      if (pinCheckInterval) {
                        clearInterval(pinCheckInterval)
                        pinCheckInterval = null
                      }
                    }, 10000))
                  }
                }, 200))
                
                // Note: Observer will be cleaned up when tutorial advances or user leaves
              }
            }
            
            document.addEventListener('keydown', handleShortcut)
            tutorialCleanup.eventListeners.push({element: document as any, event: 'keydown', handler: handleShortcut as any})
            
            // Add a test listener to see if ANY keydown events are working
            const testHandler = (e: KeyboardEvent) => {
              if (e.key === 'F1') {
              }
            }
            document.addEventListener('keydown', testHandler)
            tutorialCleanup.eventListeners.push({element: document as any, event: 'keydown', handler: testHandler as any})
            
            // Also listen for Chrome extension commands (the actual shortcut mechanism)
            const messageHandler = (message: any, sender: any, sendResponse: any) => {
              if (message.action === 'pin-current-chat') {
                
                // Trigger the same logic as keyboard shortcut
                const currentUrl = window.location.href
                const currentChatId = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)?.[1]
                
                // The actual pinning will be done by the extension, so just wait and check
                
                // Check if the chat gets pinned
                let checkCount = 0
                const checkForPin = () => {
                  checkCount++
                  
                  if (currentChatId) {
                    const pinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
                    
                    for (let i = 0; i < pinnedChats.length; i++) {
                      const pinnedChat = pinnedChats[i]
                      
                      // Try multiple selectors to find the link
                      let pinnedLink: HTMLAnchorElement | null = null
                      
                      // Try different selectors
                      pinnedLink = pinnedChat.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                      if (!pinnedLink) {
                        pinnedLink = pinnedChat.querySelector('a') as HTMLAnchorElement
                      }
                      if (!pinnedLink && pinnedChat.tagName.toLowerCase() === 'a') {
                        pinnedLink = pinnedChat as HTMLAnchorElement
                      }
                      
                      if (pinnedLink) {
                        if (pinnedLink.href.includes(currentChatId)) {
                          browser.runtime.onMessage.removeListener(messageHandler)
                          addManagedTimeout(setTimeout(() => {
                            const advanceEvent = new CustomEvent('tutorialAdvance')
                            document.dispatchEvent(advanceEvent)
                          }, 1000))
                          return true
                        }
                      }
                    }
                  }
                  
                  // Continue checking for up to 5 seconds
                  if (checkCount < 25) {
                    setTimeout(checkForPin, 200)
                  } else {
                  }
                  return false
                }
                
                // Start checking after a small delay
                setTimeout(checkForPin, 300)
              }
            }
            
            browser.runtime.onMessage.addListener(messageHandler)
            
          } else {
            
            // Find an unpinned chat to suggest
            const historyChats = document.querySelectorAll('#history a[href*="/c/"]')
            let targetChat: HTMLElement | null = null
            
            for (const chat of historyChats) {
              if (!chat.hasAttribute('data-pinflux-pinned-chat')) {
                targetChat = chat as HTMLElement
                break
              }
            }
            
            if (targetChat) {
              // Handle chat click to navigate
              const handleChatClick = (e: Event) => {
              }
              
              addManagedEventListener(targetChat, 'click', handleChatClick)
              
              // Monitor for navigation to chat page
              const checkForNavigation = () => {
                const currentUrl = window.location.href
                const isOnChatPage = /\/c\/[a-f0-9-]{8,}/.test(currentUrl)
                
                if (isOnChatPage) {
                  
                  // Set up keyboard shortcut listener (same as above)
                  const handleShortcut = (e: KeyboardEvent) => {
                    if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'p') {
                      e.preventDefault()
                      
                      const shortcutPinObserver = new MutationObserver((mutations) => {
                        // Get current URL to check if this specific chat got pinned
                        const currentUrl = window.location.href
                        const currentChatId = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)?.[1]
                        
                        // Check if the current chat is now pinned
                        if (currentChatId) {
                          const pinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
                          for (const pinnedChat of pinnedChats) {
                            const pinnedLink = pinnedChat.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                            if (pinnedLink && pinnedLink.href.includes(currentChatId)) {
                              shortcutPinObserver.disconnect()
                              document.removeEventListener('keydown', handleShortcut)
                              
                              addManagedTimeout(setTimeout(() => {
                                const advanceEvent = new CustomEvent('tutorialAdvance')
                                document.dispatchEvent(advanceEvent)
                              }, 1000))
                              return
                            }
                          }
                        }
                        
                        // Also check for changes
                        mutations.forEach((mutation) => {
                          // Check attribute changes
                          if (mutation.type === 'attributes' && mutation.attributeName === 'data-pinflux-pinned-chat') {
                            const element = mutation.target as Element
                            const link = element.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                            if (currentChatId && link && link.href.includes(currentChatId)) {
                              shortcutPinObserver.disconnect()
                              document.removeEventListener('keydown', handleShortcut)
                              
                              addManagedTimeout(setTimeout(() => {
                                const advanceEvent = new CustomEvent('tutorialAdvance')
                                document.dispatchEvent(advanceEvent)
                              }, 1000))
                              return
                            }
                          }
                          
                          // Check added nodes
                          mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                              const element = node as Element
                              if (element.hasAttribute('data-pinflux-pinned-chat') || 
                                  element.querySelector('[data-pinflux-pinned-chat]')) {
                                const link = element.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                                if (currentChatId && link && link.href.includes(currentChatId)) {
                                  shortcutPinObserver.disconnect()
                                  document.removeEventListener('keydown', handleShortcut)
                                  
                                  addManagedTimeout(setTimeout(() => {
                                    const advanceEvent = new CustomEvent('tutorialAdvance')
                                    document.dispatchEvent(advanceEvent)
                                  }, 1000))
                                }
                              }
                            }
                          })
                        })
                      })
                      
                      addManagedObserver(shortcutPinObserver)
                      shortcutPinObserver.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['data-pinflux-pinned-chat']
                      })
                      
                      // Also set up periodic check as fallback
                      let pinCheckInterval: NodeJS.Timeout | null = null
                      const checkForPin = () => {
                        const currentUrl = window.location.href
                        const currentChatId = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)?.[1]
                        
                        if (currentChatId) {
                          const pinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
                          for (const pinnedChat of pinnedChats) {
                            const pinnedLink = pinnedChat.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                            if (pinnedLink && pinnedLink.href.includes(currentChatId)) {
                              shortcutPinObserver.disconnect()
                              document.removeEventListener('keydown', handleShortcut)
                              if (pinCheckInterval) clearInterval(pinCheckInterval)
                              
                              addManagedTimeout(setTimeout(() => {
                                const advanceEvent = new CustomEvent('tutorialAdvance')
                                document.dispatchEvent(advanceEvent)
                              }, 500))
                              return true
                            }
                          }
                        }
                        return false
                      }
                      
                      // Check after a short delay
                      addManagedTimeout(setTimeout(() => {
                        if (!checkForPin()) {
                          pinCheckInterval = addManagedInterval(setInterval(() => {
                            if (checkForPin() && pinCheckInterval) {
                              clearInterval(pinCheckInterval)
                              pinCheckInterval = null
                            }
                          }, 300))
                          
                          addManagedTimeout(setTimeout(() => {
                            if (pinCheckInterval) {
                              clearInterval(pinCheckInterval)
                              pinCheckInterval = null
                            }
                          }, 10000))
                        }
                      }, 200))
                      
                      // Note: Observer will be cleaned up when tutorial advances or user leaves
                    }
                  }
                  
                  document.addEventListener('keydown', handleShortcut)
                  tutorialCleanup.eventListeners.push({element: document as any, event: 'keydown', handler: handleShortcut as any})
                  
                  return true
                }
                return false
              }
              
              // Check immediately and then periodically
              if (!checkForNavigation()) {
                const navigationChecker = addManagedInterval(setInterval(() => {
                  if (checkForNavigation()) {
                    clearInterval(navigationChecker)
                  }
                }, 200))
              }
            }
          }
          
        }
      },
      {
        id: 'pin_customize_step',
        titleKey: 'tutorialShortcutStep2Title',
        messageKey: 'tutorialShortcutStep2Message',
        targetSelector: 'nav[aria-label="Chat history"]',
        position: 'right',
        highlightElement: false
      },
      {
        id: 'reorder_step',
        titleKey: 'tutorialReorderStepTitle', 
        messageKey: 'tutorialReorderStepMessage',
        targetSelector: 'nav[aria-label="Chat history"]', // Use chat history nav as fallback
        position: 'right',
        highlightElement: false, // Don't highlight specific element
        prerequisite: () => {
          const pinnedCount = document.querySelectorAll('[data-pinflux-pinned-chat]')?.length || 0
          return pinnedCount >= 2 // Require at least 2 pinned chats to reorder
        },
        waitForUserAction: true,
        action: async () => {
          
          // Add visual drag & drop guide
          addDragDropGuide()
          
          let reorderObserver: MutationObserver | null = null
          const pinnedChatsContainer = document.querySelector('#chatListContainer')
          
          if (pinnedChatsContainer) {
            // Capture initial order of pinned chats
            const getChatsOrder = () => {
              // Get direct anchor children with data-pinflux-pinned-chat attribute
              const chats = pinnedChatsContainer.querySelectorAll('a[data-pinflux-pinned-chat][href*="/c/"]')
              return Array.from(chats).map(chat => (chat as HTMLAnchorElement).href)
            }
            
            let initialOrder = getChatsOrder()
            
            // Add drag and drop event listeners for immediate detection
            const handleDragStart = () => {
            }
            
            const handleDragEnd = () => {
              if (reorderDetected) return // Prevent duplicate detection
              
              addManagedTimeout(setTimeout(() => {
                const currentOrder = getChatsOrder()
                if (currentOrder.length === initialOrder.length && 
                    currentOrder.length > 0 &&
                    JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
                  reorderDetected = true // Set flag to prevent duplicate
                  
                  // Clean up all observers and listeners first
                  reorderObserver?.disconnect()
                  addListenersObserver?.disconnect()
                  clearInterval(reorderCheckInterval)
                  
                  // Remove drag listeners to prevent duplicate events
                  const pinnedChats = pinnedChatsContainer.querySelectorAll('a[data-pinflux-pinned-chat]')
                  pinnedChats.forEach(chat => {
                    chat.removeEventListener('dragstart', handleDragStart)
                    chat.removeEventListener('dragend', handleDragEnd)
                  })
                  
                  addManagedTimeout(setTimeout(() => {
                    const advanceEvent = new CustomEvent('tutorialAdvance')
                    document.dispatchEvent(advanceEvent)
                  }, 500))
                }
              }, 100))
            }
            
            // Add event listeners to all pinned chats
            const addDragListeners = () => {
              const pinnedChats = pinnedChatsContainer.querySelectorAll('a[data-pinflux-pinned-chat]')
              pinnedChats.forEach(chat => {
                chat.addEventListener('dragstart', handleDragStart, { once: false })
                chat.addEventListener('dragend', handleDragEnd, { once: false })
              })
            }
            
            addDragListeners()
            
            // Re-add listeners when new chats are added
            const addListenersObserver = new MutationObserver(() => {
              addDragListeners()
            })
            addListenersObserver.observe(pinnedChatsContainer, {
              childList: true
            })
            tutorialCleanup.observers.push(addListenersObserver)
            
            let reorderDetected = false // Flag to prevent duplicate detection
            let mutationDebounce: NodeJS.Timeout | null = null
            
            reorderObserver = new MutationObserver((mutations) => {
              if (reorderDetected) return // Prevent duplicate detection
              
              // Check if any mutation is actually a childList change (not just attributes)
              const hasChildListChange = mutations.some(m => m.type === 'childList' && m.addedNodes.length === 0 && m.removedNodes.length === 0)
              if (!hasChildListChange) {
                // Only react to actual reordering (childList changes without additions/removals)
                return
              }
              
              // Debounce to avoid checking too frequently
              if (mutationDebounce) clearTimeout(mutationDebounce)
              
              mutationDebounce = setTimeout(() => {
                if (reorderDetected) return
                
                
                // Check if the order has changed
                const currentOrder = getChatsOrder()
                
                // Compare orders - if different, reordering happened
                if (currentOrder.length === initialOrder.length && 
                    currentOrder.length > 0 &&
                    JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
                  reorderDetected = true // Set flag to prevent duplicate
                  
                  // Clean up all observers and listeners
                  reorderObserver?.disconnect()
                  addListenersObserver?.disconnect()
                  clearInterval(reorderCheckInterval)
                  if (mutationDebounce) clearTimeout(mutationDebounce)
                  
                  addManagedTimeout(setTimeout(() => {
                    const advanceEvent = new CustomEvent('tutorialAdvance')
                    document.dispatchEvent(advanceEvent)
                  }, 500))
                  return
                }
              }, 100) // Wait 100ms before checking
            })
            
            // Observe with more comprehensive options
            reorderObserver.observe(pinnedChatsContainer, {
              childList: true,
              subtree: false // Don't watch deep changes
            })
            
            // Also add periodic check as fallback
            let reorderCheckInterval = addManagedInterval(setInterval(() => {
              if (reorderDetected) return // Prevent duplicate detection
              
              const currentOrder = getChatsOrder()
              if (currentOrder.length === initialOrder.length && 
                  currentOrder.length > 0 &&
                  JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
                reorderDetected = true // Set flag to prevent duplicate
                
                // Clean up all observers and listeners
                reorderObserver?.disconnect()
                addListenersObserver?.disconnect()
                clearInterval(reorderCheckInterval)
                
                addManagedTimeout(setTimeout(() => {
                  const advanceEvent = new CustomEvent('tutorialAdvance')
                  document.dispatchEvent(advanceEvent)
                }, 500))
              }
            }, 500))
            
            // Store observer for cleanup
            tutorialCleanup.observers.push(reorderObserver)
            
          } else {
            console.warn('⚠️ Pinned chats container not found for reorder detection')
          }
        }
      },
      {
        id: 'unpin_step',
        titleKey: 'tutorialUnpinStepTitle',
        messageKey: 'tutorialUnpinStepMessage',
        targetSelector: '[data-pinflux-pinned-chat]',
        position: 'right',
        highlightElement: true,
        prerequisite: () => !!document.querySelector('[data-pinflux-pinned-chat]'),
        waitForUserAction: true,
        action: async () => {
          
          // Clean up drag guide from previous step
          const dragGuide = document.getElementById('tutorial-drag-guide')
          if (dragGuide) {
            dragGuide.remove()
          }
          
          const dragStyles = document.getElementById('drag-guide-styles')
          if (dragStyles) {
            dragStyles.remove()
          }
          
          // Set up tooltip repositioning when menu opens
          let menuObserver: MutationObserver | null = null
          const setupTooltipRepositioning = () => {
            menuObserver = new MutationObserver(() => {
              const openMenu = document.querySelector('#chatOptionsMenu')
              if (openMenu) {
                // Request tooltip repositioning to avoid overlapping with menu
                const repositionEvent = new CustomEvent('tutorialRepositionTooltip', {
                  detail: { avoidElement: openMenu }
                })
                document.dispatchEvent(repositionEvent)
              }
            })
            
            menuObserver.observe(document.body, {
              childList: true,
              subtree: true
            })
            
            // Store for cleanup
            tutorialCleanup.observers.push(menuObserver)
          }
          
          setupTooltipRepositioning()
          
          let unpinObserver: MutationObserver | null = null
          const pinnedChatsContainer = document.querySelector('#chatListContainer')
          
          if (pinnedChatsContainer) {
            // Count current pinned chats
            const initialPinnedCount = pinnedChatsContainer.querySelectorAll('[data-pinflux-pinned-chat]').length
            
            let hasAdvanced = false
            
            unpinObserver = new MutationObserver((mutations) => {
              if (hasAdvanced) return // Already advanced, ignore further mutations
              
              // Only check if actual nodes were removed from the pinned chats container
              for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                  // Check if any removed node was a pinned chat
                  let pinnedChatRemoved = false
                  mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      const element = node as Element
                      if (element.hasAttribute('data-pinflux-pinned-chat') ||
                          element.querySelector('[data-pinflux-pinned-chat]')) {
                        pinnedChatRemoved = true
                      }
                    }
                  })
                  
                  if (pinnedChatRemoved) {
                    // Verify the count actually decreased
                    const currentPinnedCount = pinnedChatsContainer.querySelectorAll('[data-pinflux-pinned-chat]').length
                    
                    if (currentPinnedCount < initialPinnedCount) {
                      hasAdvanced = true
                      unpinObserver?.disconnect()
                      menuObserver?.disconnect()
                      
                      addManagedTimeout(setTimeout(() => {
                        const advanceEvent = new CustomEvent('tutorialAdvance')
                        document.dispatchEvent(advanceEvent)
                      }, 500))
                      return
                    }
                  }
                }
              }
            })
            
            // Only watch for direct children changes, not deep subtree
            unpinObserver.observe(pinnedChatsContainer, {
              childList: true,
              subtree: false
            })
            
            // Store observer for cleanup
            tutorialCleanup.observers.push(unpinObserver)
            
          } else {
            console.warn('⚠️ Pinned chats container not found for unpin detection')
          }
        }
      }
    ]
  },
  {
    id: 'chat_bookmarks',
    version: '1.0.0',
    nameKey: 'tutorialBookmarksName',
    descriptionKey: 'tutorialBookmarksDesc',
    category: 'organization',
    order: 2,
    steps: [
      {
        id: 'bookmark_intro_step',
        titleKey: 'tutorialBookmarkStep1Title',
        messageKey: 'tutorialBookmarkStep1Message',
        targetSelector: '[data-bookmark-button]',
        position: 'left',
        highlightElement: true,
        prerequisite: () => {
          // Check if we're on a chat page with messages that can be bookmarked
          const isOnChatPage = /\/c\/[a-f0-9-]{8,}/.test(window.location.href)
          const hasBookmarkButtons = !!document.querySelector('[data-bookmark-button]')
          return isOnChatPage && hasBookmarkButtons
        }
      },
      {
        id: 'bookmark_menu_step',
        titleKey: 'tutorialBookmarkStep2Title',
        messageKey: 'tutorialBookmarkStep2Message',
        targetSelector: '[data-bookmarks-menu-button]',
        position: 'bottom',
        highlightElement: true,
        prerequisite: () => {
          const hasMenuButton = !!document.querySelector('[data-bookmarks-menu-button]')
          return hasMenuButton
        }
      },
      {
        id: 'bookmark_management_step',
        titleKey: 'tutorialBookmarkStep3Title',
        messageKey: 'tutorialBookmarkStep3Message',
        targetSelector: '[data-bookmarks-menu-button]',
        position: 'bottom',
        highlightElement: false,
        prerequisite: () => !!document.querySelector('[data-bookmarks-menu-button]')
      }
    ]
  },
  {
    id: 'tutorial_completion',
    version: '1.0.0',
    nameKey: 'tutorialCompleteTitle',
    descriptionKey: 'tutorialCompleteMessage',
    category: 'core',
    order: 999, // Last feature to show
    steps: [
      {
        id: 'tutorial_complete_step',
        titleKey: 'tutorialCompleteTitle',
        messageKey: 'tutorialCompleteMessage',
        targetSelector: 'body',
        position: 'center',
        highlightElement: false,
        waitForUserAction: false,
        action: async () => {
          
          // Auto-close after 15 seconds
          addManagedTimeout(setTimeout(() => {
            const closeEvent = new CustomEvent('tutorialClose')
            document.dispatchEvent(closeEvent)
          }, 15000))
        }
      }
    ]
  }
]

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: string): TutorialFeature[] {
  return TUTORIAL_FEATURES.filter(feature => feature.category === category)
}

/**
 * Get feature by ID
 */
export function getFeatureById(id: string): TutorialFeature | undefined {
  return TUTORIAL_FEATURES.find(feature => feature.id === id)
}

/**
 * Get all available tutorial steps for current page state
 */
export function getAvailableSteps(): TutorialStep[] {
  const availableSteps: TutorialStep[] = []
  
  for (const feature of TUTORIAL_FEATURES) {
    for (const step of feature.steps) {
      // Check if prerequisite is met (or no prerequisite exists)
      if (!step.prerequisite || step.prerequisite()) {
        // Check if target element exists
        if (document.querySelector(step.targetSelector)) {
          availableSteps.push(step)
        }
      }
    }
  }
  
  return availableSteps
}

/**
 * Get next available feature tutorial
 */
export function getNextFeatureTutorial(completedFeatures: string[]): TutorialFeature | undefined {
  return TUTORIAL_FEATURES
    .sort((a, b) => a.order - b.order)
    .find(feature => !completedFeatures.includes(feature.id))
}
