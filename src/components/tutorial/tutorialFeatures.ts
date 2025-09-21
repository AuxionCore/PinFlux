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
  console.log('Cleaning up tutorial feature resources')
  
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
    console.log('🧹 Removed drag & drop visual guide')
  }
  
  const dragStyles = document.getElementById('drag-guide-styles')
  if (dragStyles) {
    dragStyles.remove()
    console.log('🧹 Removed drag guide styles')
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
  console.log('🎨 Adding drag & drop visual guide')
  
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
    console.log('❌ Pinned chats container not found, trying first pinned chat parent')
    const firstPinnedChat = document.querySelector('[data-pinflux-pinned-chat]')
    if (firstPinnedChat) {
      pinnedChatsContainer = firstPinnedChat.parentElement
    }
  }
  if (!pinnedChatsContainer) {
    console.log('❌ No suitable container found for drag guide')
    return
  }
  
  console.log('✅ Using container:', pinnedChatsContainer)
  
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
    console.log('🎯 Positioning drag guide elements. Found chats:', pinnedChats.length)
    
    if (pinnedChats.length >= 1) { // Changed from >= 2 to >= 1 for better testing
      const firstChat = pinnedChats[0] as HTMLElement
      const rect = firstChat.getBoundingClientRect()
      const containerRect = (pinnedChatsContainer as HTMLElement).getBoundingClientRect()
      
      console.log('📍 First chat rect:', rect)
      console.log('📍 Container rect:', containerRect)
      
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
        
        console.log('🎨 Drag guide elements positioned at:', { cursorTop, cursorLeft, arrowsTop, arrowsLeft })
      }
    }
  }, 500)
  
  console.log('✅ Drag & drop visual guide added')
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
        action: async () => {
          console.log('Step 1: Waiting for user to open options menu')
          
          // Clean up any previous tutorial resources first
          cleanupTutorialResources()
          
          // Add tutorial styles
          addTutorialStyles()
          
          // Set up menu detection that will advance to step 2 when menu opens
          const setupMenuDetection = () => {
            console.log('Setting up menu detection for tutorial step 1')
            let menuAdvanced = false
            
            const chatElement = document.querySelector('#history a[href*="/c/"]:first-of-type, #history [data-testid^="history-item"]:first-child') as HTMLElement
            if (!chatElement) {
              console.log('Chat element not found for menu detection')
              return
            }

            // Monitor for options button visibility and clicks
            let optionsListenerAdded = false
            const checkForOptionsButton = () => {
              if (optionsListenerAdded) return // Don't add multiple listeners
              
              const optionsButton = chatElement.querySelector('[data-testid*="options"]') as HTMLElement
              if (optionsButton && optionsButton.offsetParent !== null) {
                const handleOptionsClick = async () => {
                  console.log('Options button clicked, waiting for menu to appear...')
                  
                  addManagedTimeout(setTimeout(() => {
                    if (menuAdvanced) return
                    
                    const menu = document.querySelector('[role="menu"]')
                    if (menu) {
                      console.log('Menu detected, advancing to step 2')
                      menuAdvanced = true
                      const advanceEvent = new CustomEvent('tutorialAdvance')
                      document.dispatchEvent(advanceEvent)
                    }
                  }, 200))
                }
                
                addManagedEventListener(optionsButton, 'click', handleOptionsClick, { once: true })
                console.log('Options button click listener added')
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
                        const menu = document.querySelector('[role="menu"]')
                        if (menu) {
                          console.log('Menu detected via observer, advancing to step 2')
                          menuAdvanced = true
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
            
            // Cleanup after 30 seconds
            addManagedTimeout(setTimeout(() => {
              clearInterval(optionsObserver)
              menuObserver.disconnect()
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
        action: async () => {
          console.log('Step 2: Waiting for user to click Pin button')
          
          // Try to find Pin button in open menu first, then generally
          let pinButton = document.querySelector('[role="menu"] [data-pinflux-pin-button]') as HTMLElement
          if (!pinButton) {
            pinButton = document.querySelector('[data-pinflux-pin-button]') as HTMLElement
          }
          
          if (pinButton) {
            console.log('Pin button found, adding click listener')
            
            const handlePinClick = () => {
              console.log('Pin button clicked in step 2, advancing to step 3')
              // Wait for pinning to complete, then advance to step 3
              addManagedTimeout(setTimeout(() => {
                const advanceEvent = new CustomEvent('tutorialAdvance')
                document.dispatchEvent(advanceEvent)
              }, 1000))
            }
            
            addManagedEventListener(pinButton, 'click', handlePinClick, { once: true })
          } else {
            console.log('Pin button not found in step 2, waiting for it to appear...')
            
            // If Pin button not found, wait for it to appear
            const waitForPinButton = addManagedInterval(setInterval(() => {
              const foundPinButton = document.querySelector('[role="menu"] [data-pinflux-pin-button], [data-pinflux-pin-button]') as HTMLElement
              if (foundPinButton) {
                clearInterval(waitForPinButton)
                console.log('Pin button found after waiting, adding click listener')
                
                const handlePinClick = () => {
                  console.log('Pin button clicked in step 2 (after wait), advancing to step 3')
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
        action: async () => {
          // This step shows the success message after pinning
          console.log('Showing pinned chat location - step 3 active')
        }
      },
      {
        id: 'pin_alternative_method_step',
        titleKey: 'tutorialAlternativeMethodTitle',
        messageKey: 'tutorialAlternativeMethodMessage',
        targetSelector: '#pinnedContainer, #chatListContainer',
        position: 'right',
        highlightElement: false,
        action: async () => {
          console.log('Step 4: Explaining alternative drag-and-drop method')
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
        action: async () => {
          console.log('Step 5: Waiting for user to drag a chat to pin it')
          
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
            console.log('Found unpinned chat for drag demo, setting up drag listener')
            
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
              console.log('Chat drag started in tutorial step 5')
              if (pinnedContainer) {
                pinnedContainer.style.backgroundColor = "rgba(139, 92, 246, 0.2)"
                pinnedContainer.style.borderColor = "#a855f7"
              }
            }
            
            const handleDragEnd = (e: Event) => {
              console.log('Chat drag ended in tutorial step 5')
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
                      console.log('Drag-to-pin successful! Tutorial complete')
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
            
            console.log('Step 5: Drag demo setup complete, waiting for user to drag chat')
          } else {
            console.warn('Step 5: No unpinned chats found for drag demo')
            // If no unpinned chats available, skip this step automatically
            addManagedTimeout(setTimeout(() => {
              console.log('Skipping drag demo due to no available unpinned chats')
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
        action: async () => {
          console.log('Step 6: Explaining keyboard shortcut method')
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
        action: async () => {
          console.log('Step 7: Waiting for user to click chat and navigate')
          
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
            console.log('Found chat for navigation demo, setting up listeners')
            let targetChatUrl = ''
            
            // Get the target chat URL
            const chatLink = targetChat as HTMLAnchorElement
            if (chatLink.href) {
              targetChatUrl = chatLink.href
              console.log('Target chat URL:', targetChatUrl)
            }
            
            // Handle chat click to navigate
            const handleChatClick = (e: Event) => {
              console.log('Chat clicked for navigation demo')
            }
            
            addManagedEventListener(targetChat, 'click', handleChatClick)
            
            // Monitor for URL changes (chat navigation)
            const checkForNavigation = () => {
              const currentUrl = window.location.href
              
              // Check if we're on any chat page that can be pinned (not just the target chat)
              const isOnChatPage = /\/c\/[a-f0-9-]{8,}/.test(currentUrl)
              
              // Check if user navigated to the target chat specifically, or any different chat page
              if ((targetChatUrl && currentUrl === targetChatUrl)) {
                console.log('User navigated to target chat, moving to next step')
                
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
            
            console.log('Step 7: Navigation demo setup complete, waiting for user interaction')
          } else {
            console.warn('Step 7: No unpinned chats found for navigation demo')
            // Skip this step if no chats available
            addManagedTimeout(setTimeout(() => {
              console.log('Skipping navigation demo due to no available unpinned chats')
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
        action: async () => {
          console.log('🚀 Step 8: Setting up shortcut detection for current chat')
          
          // Check if we're on a chat page
          const currentUrl = window.location.href
          const isOnChatPage = /\/c\/[a-f0-9-]{8,}/.test(currentUrl)
          console.log('🔍 Current URL:', currentUrl)
          console.log('📍 Is on chat page:', isOnChatPage)
          
          // Test the regex directly
          const chatIdMatch = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)
          console.log('🧪 Chat ID match:', chatIdMatch)
          console.log('🧪 Extracted ID:', chatIdMatch?.[1])
          
          if (isOnChatPage) {
            console.log('✅ User is already on a chat page, setting up shortcut listener')
            
            // Set up keyboard shortcut listener
            const handleShortcut = (e: KeyboardEvent) => {
              console.log('⌨️ Key pressed:', {
                key: e.key,
                altKey: e.altKey,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                code: e.code
              })
              
              // Check for Alt+P (the configured shortcut)
              if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'p') {
                console.log('🔥 Keyboard shortcut Alt+P detected!')
                e.preventDefault()
                
                // Get current chat info for debugging
                const currentUrl = window.location.href
                const currentChatId = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)?.[1]
                console.log('📍 Current URL:', currentUrl)
                console.log('🔍 Extracted chat ID:', currentChatId)
                
                // Check if already pinned before setting up observer
                if (currentChatId) {
                  const existingPinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
                  console.log('📌 Found', existingPinnedChats.length, 'existing pinned chats')
                  
                  for (const pinnedChat of existingPinnedChats) {
                    const pinnedLink = pinnedChat.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                    if (pinnedLink) {
                      console.log('🔗 Checking pinned chat link:', pinnedLink.href)
                      if (pinnedLink.href.includes(currentChatId)) {
                        console.log('✅ Chat is already pinned! Moving to next step immediately')
                        addManagedTimeout(setTimeout(() => {
                          const advanceEvent = new CustomEvent('tutorialAdvance')
                          document.dispatchEvent(advanceEvent)
                        }, 500))
                        return
                      }
                    }
                  }
                  console.log('❌ Chat not found in existing pinned chats, setting up observer...')
                }
                
                // Set up observer to detect successful pin
                const shortcutPinObserver = new MutationObserver((mutations) => {
                  console.log('👀 MutationObserver triggered with', mutations.length, 'mutations')
                  
                  // Get current URL to check if this specific chat got pinned
                  const currentUrl = window.location.href
                  const currentChatId = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)?.[1]
                  console.log('🔍 Observer - Current chat ID:', currentChatId)
                  
                  // Check if the current chat is now pinned
                  if (currentChatId) {
                    const pinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
                    console.log('📌 Observer found', pinnedChats.length, 'pinned chats')
                    
                    for (const pinnedChat of pinnedChats) {
                      const pinnedLink = pinnedChat.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                      if (pinnedLink) {
                        console.log('🔗 Observer checking:', pinnedLink.href, 'contains', currentChatId)
                        if (pinnedLink.href.includes(currentChatId)) {
                          console.log('✅ Current chat successfully pinned! Moving to next step')
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
                    console.log(`🧬 Mutation ${index + 1}:`, mutation.type, mutation.target)
                    
                    // Check attribute changes
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-pinflux-pinned-chat') {
                      console.log('🏷️ Attribute change detected on:', mutation.target)
                      const element = mutation.target as Element
                      const link = element.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                      if (currentChatId && link && link.href.includes(currentChatId)) {
                        console.log('✅ Current chat pinned via attribute change! Moving to next step')
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
                      console.log('➕ Added nodes detected:', mutation.addedNodes.length)
                      mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                          const element = node as Element
                          if (element.hasAttribute && element.hasAttribute('data-pinflux-pinned-chat')) {
                            console.log('📌 New pinned chat element added:', element)
                            const link = element.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                            if (currentChatId && link && link.href.includes(currentChatId)) {
                              console.log('✅ Current chat pinned via new node! Moving to next step')
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
                            console.log('📌 Found nested pinned chat:', nestedPinned)
                            const link = nestedPinned.querySelector('a[href*="/c/"]') as HTMLAnchorElement
                            if (currentChatId && link && link.href.includes(currentChatId)) {
                              console.log('✅ Current chat pinned via nested node! Moving to next step')
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
                
                console.log('👂 Setting up MutationObserver for pin detection...')
                addManagedObserver(shortcutPinObserver)
                shortcutPinObserver.observe(document.body, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['data-pinflux-pinned-chat']
                })
                
                console.log('✅ Observer setup complete, waiting for pin...')
                
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
                        console.log('✅ Pin detected via periodic check! Moving to next step')
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
                        console.log('⏰ Pin check timeout - stopping periodic check')
                      }
                    }, 10000))
                  }
                }, 200))
                
                // Note: Observer will be cleaned up when tutorial advances or user leaves
              }
            }
            
            document.addEventListener('keydown', handleShortcut)
            tutorialCleanup.eventListeners.push({element: document as any, event: 'keydown', handler: handleShortcut as any})
            console.log('🎯 Keyboard event listener added successfully! Press Alt+P to pin this chat.')
            
            // Add a test listener to see if ANY keydown events are working
            const testHandler = (e: KeyboardEvent) => {
              if (e.key === 'F1') {
                console.log('🧪 TEST: F1 key detected - keyboard listeners are working!')
              }
            }
            document.addEventListener('keydown', testHandler)
            tutorialCleanup.eventListeners.push({element: document as any, event: 'keydown', handler: testHandler as any})
            console.log('🧪 TEST: Press F1 to test if keyboard listeners work')
            
            // Also listen for Chrome extension commands (the actual shortcut mechanism)
            const messageHandler = (message: any, sender: any, sendResponse: any) => {
              console.log('📨 Message received:', message)
              if (message.action === 'pin-current-chat') {
                console.log('🚀 Chrome extension pin command received!')
                
                // Trigger the same logic as keyboard shortcut
                const currentUrl = window.location.href
                const currentChatId = currentUrl.match(/\/c\/([a-f0-9-]{8,})/)?.[1]
                console.log('📍 Current URL:', currentUrl)
                console.log('🔍 Extracted chat ID:', currentChatId)
                
                // The actual pinning will be done by the extension, so just wait and check
                console.log('⏰ Waiting for pin to complete...')
                
                // Check if the chat gets pinned
                let checkCount = 0
                const checkForPin = () => {
                  checkCount++
                  console.log(`🔄 Pin check #${checkCount}`)
                  
                  if (currentChatId) {
                    const pinnedChats = document.querySelectorAll('[data-pinflux-pinned-chat]')
                    console.log('📌 Found', pinnedChats.length, 'pinned chats')
                    
                    for (let i = 0; i < pinnedChats.length; i++) {
                      const pinnedChat = pinnedChats[i]
                      console.log(`🔍 Pinned chat ${i + 1} element:`, pinnedChat)
                      console.log(`🔍 Pinned chat ${i + 1} innerHTML:`, pinnedChat.innerHTML)
                      
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
                        console.log(`🔗 Pinned chat ${i + 1} URL:`, pinnedLink.href)
                        console.log(`🔍 Current chat ID "${currentChatId}" vs Pinned URL "${pinnedLink.href}"`)
                        console.log(`✓ URL includes check:`, pinnedLink.href.includes(currentChatId))
                        
                        if (pinnedLink.href.includes(currentChatId)) {
                          console.log('✅ Pin detected! Moving to next step')
                          browser.runtime.onMessage.removeListener(messageHandler)
                          addManagedTimeout(setTimeout(() => {
                            const advanceEvent = new CustomEvent('tutorialAdvance')
                            document.dispatchEvent(advanceEvent)
                          }, 1000))
                          return true
                        }
                      } else {
                        console.log(`❌ Pinned chat ${i + 1} has no link`)
                        console.log(`🔍 Available selectors in chat ${i + 1}:`)
                        console.log('  - All <a> tags:', pinnedChat.querySelectorAll('a'))
                        console.log('  - All elements with href:', pinnedChat.querySelectorAll('[href]'))
                      }
                    }
                  }
                  
                  // Continue checking for up to 5 seconds
                  if (checkCount < 25) {
                    setTimeout(checkForPin, 200)
                  } else {
                    console.log('⏰ Pin check timeout')
                  }
                  return false
                }
                
                // Start checking after a small delay
                setTimeout(checkForPin, 300)
              }
            }
            
            browser.runtime.onMessage.addListener(messageHandler)
            console.log('📡 Chrome extension message listener added')
            
          } else {
            console.log('❌ Not on a chat page, guiding user to a chat first')
            
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
                console.log('Chat clicked, will set up shortcut listener after navigation')
              }
              
              addManagedEventListener(targetChat, 'click', handleChatClick)
              
              // Monitor for navigation to chat page
              const checkForNavigation = () => {
                const currentUrl = window.location.href
                const isOnChatPage = /\/c\/[a-f0-9-]{8,}/.test(currentUrl)
                
                if (isOnChatPage) {
                  console.log('User navigated to chat page, setting up shortcut listener')
                  
                  // Set up keyboard shortcut listener (same as above)
                  const handleShortcut = (e: KeyboardEvent) => {
                    if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'p') {
                      console.log('Keyboard shortcut detected!')
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
                              console.log('Current chat successfully pinned! Moving to next step')
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
                              console.log('Current chat pinned via attribute change! Moving to next step')
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
                                  console.log('Current chat pinned via new node! Moving to next step')
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
                              console.log('✅ Pin detected via periodic check (navigation)! Moving to next step')
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
          
          console.log('🏁 Step 8: Shortcut detection setup complete - Ready for Alt+P!')
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
          console.log('🔍 Reorder step prerequisite check: found', pinnedCount, 'pinned chats')
          return pinnedCount >= 1 // Changed from >= 2 to >= 1 to make testing easier
        },
        waitForUserAction: true,
        action: async () => {
          console.log('🎯 Step 10: Setting up drag-and-drop visual guide and detection')
          
          // Add visual drag & drop guide
          addDragDropGuide()
          
          let reorderObserver: MutationObserver | null = null
          const pinnedChatsContainer = document.querySelector('#chatListContainer')
          
          if (pinnedChatsContainer) {
            // Capture initial order of pinned chats
            const getChatsOrder = () => {
              // Get direct anchor children with data-pinflux-pinned-chat attribute
              const chats = pinnedChatsContainer.querySelectorAll('a[data-pinflux-pinned-chat][href*="/c/"]')
              console.log('🔍 Found chats:', chats.length)
              chats.forEach((chat, i) => {
                console.log(`🔍 Chat ${i+1}:`, (chat as HTMLAnchorElement).href)
              })
              return Array.from(chats).map(chat => (chat as HTMLAnchorElement).href)
            }
            
            let initialOrder = getChatsOrder()
            console.log('📊 Initial chats order:', initialOrder)
            
            // Add drag and drop event listeners for immediate detection
            const handleDragStart = () => {
              console.log('🎯 Drag started on pinned chat')
            }
            
            const handleDragEnd = () => {
              if (reorderDetected) return // Prevent duplicate detection
              
              console.log('🎯 Drag ended, checking for reorder...')
              addManagedTimeout(setTimeout(() => {
                const currentOrder = getChatsOrder()
                if (currentOrder.length === initialOrder.length && 
                    currentOrder.length > 0 &&
                    JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
                  reorderDetected = true // Set flag to prevent duplicate
                  console.log('✅ Chat reordering detected via drag end!')
                  console.log('📊 Order changed from:', initialOrder)
                  console.log('📊 Order changed to:', currentOrder)
                  
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
              console.log('🎯 Adding drag listeners to', pinnedChats.length, 'pinned chats')
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
            
            reorderObserver = new MutationObserver((mutations) => {
              if (reorderDetected) return // Prevent duplicate detection
              
              console.log('🔍 Mutation detected, checking for reorder...')
              
              // Check if the order has changed
              const currentOrder = getChatsOrder()
              console.log('📊 Current order:', currentOrder)
              console.log('📊 Initial order:', initialOrder)
              
              // Compare orders - if different, reordering happened
              if (currentOrder.length === initialOrder.length && 
                  currentOrder.length > 0 &&
                  JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
                reorderDetected = true // Set flag to prevent duplicate
                console.log('✅ Chat reordering detected via mutation observer!')
                console.log('📊 Order changed from:', initialOrder)
                console.log('📊 Order changed to:', currentOrder)
                
                // Clean up all observers and listeners
                reorderObserver?.disconnect()
                addListenersObserver?.disconnect()
                clearInterval(reorderCheckInterval)
                
                addManagedTimeout(setTimeout(() => {
                  const advanceEvent = new CustomEvent('tutorialAdvance')
                  document.dispatchEvent(advanceEvent)
                }, 500))
                return
              }
            })
            
            // Observe with more comprehensive options
            reorderObserver.observe(pinnedChatsContainer, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeOldValue: true
            })
            
            // Also add periodic check as fallback
            let reorderCheckInterval = addManagedInterval(setInterval(() => {
              if (reorderDetected) return // Prevent duplicate detection
              
              const currentOrder = getChatsOrder()
              if (currentOrder.length === initialOrder.length && 
                  currentOrder.length > 0 &&
                  JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
                reorderDetected = true // Set flag to prevent duplicate
                console.log('✅ Chat reordering detected via periodic check!')
                console.log('📊 Order changed from:', initialOrder)
                console.log('📊 Order changed to:', currentOrder)
                
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
            
            console.log('🏁 Step 9: Reorder detection setup complete - Drag and drop to reorder pinned chats!')
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
          console.log('🎯 Step 10: Setting up unpin detection for tutorial')
          
          // Set up tooltip repositioning when menu opens
          let menuObserver: MutationObserver | null = null
          const setupTooltipRepositioning = () => {
            menuObserver = new MutationObserver(() => {
              const openMenu = document.querySelector('#chatOptionsMenu')
              if (openMenu) {
                console.log('📍 Chat options menu opened, repositioning tooltip')
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
            console.log(`📊 Initial pinned chats count: ${initialPinnedCount}`)
            
            unpinObserver = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                  // Check for removed nodes
                  mutation.removedNodes.forEach((removedNode) => {
                    if (removedNode.nodeType === Node.ELEMENT_NODE) {
                      const removedElement = removedNode as Element
                      // Check if removed element is a pinned chat or contains one
                      if (removedElement.hasAttribute?.('data-pinflux-pinned-chat') ||
                          removedElement.querySelector?.('[data-pinflux-pinned-chat]')) {
                        console.log('✅ Pinned chat removal detected via mutation observer!')
                        unpinObserver?.disconnect()
                        
                        addManagedTimeout(setTimeout(() => {
                          const advanceEvent = new CustomEvent('tutorialAdvance')
                          document.dispatchEvent(advanceEvent)
                        }, 500))
                        return
                      }
                    }
                  })
                  
                  // Also check if total count decreased as fallback
                  const currentPinnedCount = pinnedChatsContainer.querySelectorAll('[data-pinflux-pinned-chat]').length
                  console.log(`📊 Current pinned chats count: ${currentPinnedCount}`)
                  
                  if (currentPinnedCount < initialPinnedCount) {
                    console.log('✅ Chat unpin detected via count comparison! Moving to next step')
                    unpinObserver?.disconnect()
                    
                    addManagedTimeout(setTimeout(() => {
                      const advanceEvent = new CustomEvent('tutorialAdvance')
                      document.dispatchEvent(advanceEvent)
                    }, 500))
                    return
                  }
                }
              }
            })
            
            unpinObserver.observe(pinnedChatsContainer, {
              childList: true,
              subtree: true
            })
            
            // Store observer for cleanup
            tutorialCleanup.observers.push(unpinObserver)
            
            console.log('🏁 Step 10: Unpin detection setup complete - Hover over pinned chat and click unpin!')
          } else {
            console.warn('⚠️ Pinned chats container not found for unpin detection')
          }
        }
      },
      {
        id: 'tutorial_complete_step',
        titleKey: 'tutorialCompleteTitle',
        messageKey: 'tutorialCompleteMessage',
        targetSelector: 'nav[aria-label="Chat history"]',
        position: 'right',
        highlightElement: false,
        waitForUserAction: false,
        action: async () => {
          console.log('🎉 Tutorial completed! Setting up auto-close timer')
          
          // Auto-close after 15 seconds
          addManagedTimeout(setTimeout(() => {
            console.log('⏰ Auto-closing tutorial after 15 seconds')
            const closeEvent = new CustomEvent('tutorialClose')
            document.dispatchEvent(closeEvent)
          }, 15000))
        }
      }
    ]
  },
  {
    id: 'drag_drop',
    version: '1.1.0',
    nameKey: 'tutorialDragDropName',
    descriptionKey: 'tutorialDragDropDesc',
    category: 'organization',
    order: 2,
    steps: [
      {
        id: 'drag_step_1',
        titleKey: 'tutorialDragStep1Title',
        messageKey: 'tutorialDragStep1Message',
        targetSelector: '[data-pinflux-pinned-chat]',
        position: 'right',
        highlightElement: true,
        prerequisite: () => (document.querySelectorAll('[data-pinflux-pinned-chat]')?.length || 0) >= 2
      }
    ]
  },
  {
    id: 'rename_chats',
    version: '2.0.0',
    nameKey: 'tutorialRenameName',
    descriptionKey: 'tutorialRenameDesc',
    category: 'management',
    order: 3,
    steps: [
      {
        id: 'rename_step_1',
        titleKey: 'tutorialRenameStep1Title',
        messageKey: 'tutorialRenameStep1Message',
        targetSelector: '[data-pinflux-pinned-chat] button',
        position: 'right',
        highlightElement: true,
        prerequisite: () => !!document.querySelector('[data-pinflux-pinned-chat]')
      },
      {
        id: 'rename_step_2',
        titleKey: 'tutorialRenameStep2Title',
        messageKey: 'tutorialRenameStep2Message',
        targetSelector: '[role="menuitem"]',
        position: 'right',
        highlightElement: true,
        prerequisite: () => !!document.querySelector('[role="menuitem"]')
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
