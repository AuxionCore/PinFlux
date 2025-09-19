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
            const checkForOptionsButton = () => {
              const optionsButton = chatElement.querySelector('[data-testid*="options"]') as HTMLElement
              if (optionsButton && optionsButton.offsetParent !== null) {
                const handleOptionsClick = async () => {
                  console.log('Options button clicked, waiting for menu to appear...')
                  
                  setTimeout(() => {
                    if (menuAdvanced) return
                    
                    const menu = document.querySelector('[role="menu"]')
                    if (menu) {
                      console.log('Menu detected, advancing to step 2')
                      menuAdvanced = true
                      const advanceEvent = new CustomEvent('tutorialAdvance')
                      document.dispatchEvent(advanceEvent)
                    }
                  }, 200)
                }
                
                optionsButton.addEventListener('click', handleOptionsClick, { once: true })
                console.log('Options button click listener added')
              }
            }
            
            // Check periodically for options button
            const optionsObserver = setInterval(checkForOptionsButton, 500)
            
            // Also observe for menu opening directly
            const menuObserver = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as HTMLElement
                    if (element.getAttribute('role') === 'menu' || element.querySelector('[role="menu"]')) {
                      setTimeout(() => {
                        if (menuAdvanced) return
                        const menu = document.querySelector('[role="menu"]')
                        if (menu) {
                          console.log('Menu detected via observer, advancing to step 2')
                          menuAdvanced = true
                          const advanceEvent = new CustomEvent('tutorialAdvance')
                          document.dispatchEvent(advanceEvent)
                        }
                      }, 50)
                    }
                  }
                })
              })
            })
            
            menuObserver.observe(document.body, { childList: true, subtree: true })
            
            // Cleanup after 30 seconds
            setTimeout(() => {
              clearInterval(optionsObserver)
              menuObserver.disconnect()
            }, 30000)
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
              setTimeout(() => {
                const advanceEvent = new CustomEvent('tutorialAdvance')
                document.dispatchEvent(advanceEvent)
              }, 1000)
            }
            
            pinButton.addEventListener('click', handlePinClick, { once: true })
          } else {
            console.log('Pin button not found in step 2, waiting for it to appear...')
            
            // If Pin button not found, wait for it to appear
            const waitForPinButton = setInterval(() => {
              const foundPinButton = document.querySelector('[role="menu"] [data-pinflux-pin-button], [data-pinflux-pin-button]') as HTMLElement
              if (foundPinButton) {
                clearInterval(waitForPinButton)
                console.log('Pin button found after waiting, adding click listener')
                
                const handlePinClick = () => {
                  console.log('Pin button clicked in step 2 (after wait), advancing to step 3')
                  setTimeout(() => {
                    const advanceEvent = new CustomEvent('tutorialAdvance')
                    document.dispatchEvent(advanceEvent)
                  }, 1000)
                }
                
                foundPinButton.addEventListener('click', handlePinClick, { once: true })
              }
            }, 100)
            
            // Stop waiting after 10 seconds
            setTimeout(() => clearInterval(waitForPinButton), 10000)
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
        id: 'pin_shortcut_step',
        titleKey: 'tutorialShortcutStep1Title',
        messageKey: 'tutorialShortcutStep1Message',
        targetSelector: 'nav[aria-label="Chat history"]',
        position: 'right',
        highlightElement: false
      },
      {
        id: 'pin_customize_step',
        titleKey: 'tutorialShortcutStep2Title',
        messageKey: 'tutorialShortcutStep2Message',
        targetSelector: 'nav[aria-label="Chat history"]',
        position: 'right',
        highlightElement: false
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
