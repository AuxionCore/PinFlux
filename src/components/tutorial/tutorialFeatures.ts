export interface TutorialStep {
  id: string
  titleKey: string
  messageKey: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlightElement?: boolean
  prerequisite?: () => boolean
  action?: () => Promise<void>
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
        targetSelector: 'nav a[href*="/c/"]:first-of-type, nav [data-testid^="history-item"]:first-child',
        position: 'right',
        highlightElement: true,
        action: async () => {
          // Set up intelligent tutorial positioning and menu detection
          const setupMenuDetection = () => {
            const chatElement = document.querySelector('nav a[href*="/c/"]:first-of-type, nav [data-testid^="history-item"]:first-child') as HTMLElement
            if (!chatElement) return

            // Monitor for options button visibility
            const checkForOptionsButton = () => {
              const optionsButton = chatElement.querySelector('[data-testid*="options"]') as HTMLElement
              if (optionsButton && optionsButton.offsetParent !== null) {
                // Options button is visible, add click listener
                const handleOptionsClick = async () => {
                  console.log('Options button clicked, waiting for menu to appear...')
                  
                  // Wait a bit for menu to appear, then reposition tooltip
                  setTimeout(() => {
                    const menu = document.querySelector('[role="menu"]')
                    if (menu) {
                      console.log('Menu detected, repositioning tutorial...')
                      // Dispatch event to update tooltip position
                      const repositionEvent = new CustomEvent('tutorialRepositionTooltip', {
                        detail: { avoidElement: menu }
                      })
                      document.dispatchEvent(repositionEvent)
                    }
                  }, 100)
                  
                  // Wait for Pin button to appear in menu
                  const waitForPinButton = setInterval(() => {
                    const pinButton = document.querySelector('[role="menu"] [data-pinflux-pin-button]')
                    if (pinButton) {
                      clearInterval(waitForPinButton)
                      console.log('Pin button detected in menu, advancing tutorial...')
                      // Get tutorial manager instance and advance
                      const tutorialEvent = new CustomEvent('tutorialAdvance')
                      document.dispatchEvent(tutorialEvent)
                    }
                  }, 100)
                  
                  // Cleanup after 10 seconds
                  setTimeout(() => clearInterval(waitForPinButton), 10000)
                }
                
                optionsButton.addEventListener('click', handleOptionsClick, { once: true })
                console.log('Options button click listener added')
              }
            }
            
            // Check periodically for options button
            const optionsObserver = setInterval(checkForOptionsButton, 500)
            
            // Cleanup after 30 seconds
            setTimeout(() => clearInterval(optionsObserver), 30000)
          }
          
          setupMenuDetection()
          console.log('Interactive step - menu detection and smart positioning active')
        }
      },
      {
        id: 'pin_step_2',
        titleKey: 'tutorialPinStep2Title',
        messageKey: 'tutorialPinStep2Message',
        targetSelector: '[data-pinflux-pin-button]',
        position: 'right',
        highlightElement: true
      },
      {
        id: 'pin_step_3',
        titleKey: 'tutorialPinStep3Title',
        messageKey: 'tutorialPinStep3Message',
        targetSelector: '#pinnedContainer',
        position: 'right',
        highlightElement: true
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
