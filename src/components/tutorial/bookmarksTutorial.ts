import { tutorialManager } from '../tutorial/tutorialManager'

/**
 * Conditional tutorial for bookmarks feature
 * This tutorial is shown only when:
 * 1. User opens the bookmarks menu
 * 2. There is at least one bookmark in the conversation
 */

let hasShownBookmarksTutorial = false

interface BookmarksTutorialStep {
  id: string
  titleKey: string
  messageKey: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlightElement?: boolean
}

const BOOKMARKS_TUTORIAL_STEPS: BookmarksTutorialStep[] = [
  {
    id: 'bookmark_add_step',
    titleKey: 'tutorialBookmarkStep1Title',
    messageKey: 'tutorialBookmarkStep1Message',
    targetSelector: '[data-bookmark-button], [data-demo-bookmark]',
    position: 'top',
    highlightElement: true
  },
  {
    id: 'bookmark_menu_step',
    titleKey: 'tutorialBookmarkStep2Title',
    messageKey: 'tutorialBookmarkStep2Message',
    targetSelector: '[data-bookmarks-menu-button]',
    position: 'bottom',
    highlightElement: true
  },
  {
    id: 'bookmark_management_step',
    titleKey: 'tutorialBookmarkStep3Title',
    messageKey: 'tutorialBookmarkStep3Message',
    targetSelector: '#bookmarks-dropdown',
    position: 'left',
    highlightElement: true
  }
]

/**
 * Check if bookmarks tutorial should be shown
 */
export async function shouldShowBookmarksTutorial(): Promise<boolean> {
  console.log('shouldShowBookmarksTutorial called')
  
  // Don't show if already shown in this session
  if (hasShownBookmarksTutorial) {
    console.log('Tutorial already shown in this session')
    return false
  }

  // Check if user has already completed bookmarks tutorial
  try {
    const result = await browser.storage.local.get(['tutorialProgress'])
    const tutorialProgress = result.tutorialProgress || {}
    const completedFeatures = tutorialProgress.completedFeatures || []
    
    // If bookmarks tutorial was already completed, don't show
    if (completedFeatures.includes('bookmarks_contextual')) {
      console.log('Bookmarks tutorial already completed')
      return false
    }
  } catch (error) {
    console.warn('Failed to check tutorial progress:', error)
  }

  // Check if we're in a conversation page
  const path = window.location.pathname
  if (!path.includes('/c/')) {
    console.log('Not in conversation page, path:', path)
    return false
  }

  // Check if bookmarks dropdown is open and has content
  const dropdown = document.querySelector('#bookmarks-dropdown')
  if (!dropdown || dropdown.classList.contains('hidden')) {
    console.log('Bookmarks dropdown not open or not found')
    return false
  }

  // Check if there are any bookmarks in the list
  const bookmarksList = dropdown.querySelector('#bookmarks-list')
  const bookmarkItems = bookmarksList?.querySelectorAll('[data-bookmark-link]')
  
  const hasBookmarks = (bookmarkItems?.length || 0) > 0
  console.log('Bookmarks found:', hasBookmarks, 'count:', bookmarkItems?.length)
  
  return hasBookmarks
}

/**
 * Show bookmarks tutorial
 */
export async function showBookmarksTutorial(): Promise<void> {
  if (!(await shouldShowBookmarksTutorial())) {
    return
  }

  console.log('Starting contextual bookmarks tutorial')
  hasShownBookmarksTutorial = true

  // Create a mini tutorial manager for this specific case
  await showBookmarksSteps()
}

/**
 * Show bookmarks tutorial steps
 */
async function showBookmarksSteps(): Promise<void> {
  let currentStepIndex = 0
  let demoButton: HTMLElement | null = null

  console.log('showBookmarksSteps called, starting from step 0')

  const showStep = async (stepIndex: number) => {
    if (stepIndex >= BOOKMARKS_TUTORIAL_STEPS.length) {
      // Clean up demo button and complete tutorial
      if (demoButton) {
        demoButton.remove()
        demoButton = null
      }
      await markBookmarksTutorialCompleted()
      return
    }

    const step = BOOKMARKS_TUTORIAL_STEPS[stepIndex]
    let targetElement: HTMLElement | null = null

    console.log(`Starting step ${stepIndex}: ${step.id}`)

    // For the first step (bookmark add), create a demo button
    if (step.id === 'bookmark_add_step') {
      console.log('Creating demo bookmark button for first step')
      if (!demoButton) {
        demoButton = createDemoBookmarkButton()
        console.log('Demo button created:', demoButton)
      }
      targetElement = demoButton
    } else {
      // For other steps, try to find the real element first
      targetElement = document.querySelector(step.targetSelector) as HTMLElement
      console.log(`Looking for element with selector "${step.targetSelector}":`, targetElement)
    }

    if (!targetElement) {
      console.warn(`Target element not found for step ${step.id}:`, step.targetSelector)
      console.log('Available elements:', {
        bookmarkButtons: document.querySelectorAll('[data-bookmark-button]').length,
        demoButtons: document.querySelectorAll('[data-demo-bookmark]').length,
        menuButtons: document.querySelectorAll('[data-bookmarks-menu-button]').length,
        dropdowns: document.querySelectorAll('#bookmarks-dropdown').length
      })
      // Skip to next step
      await showStep(stepIndex + 1)
      return
    }

    // Create a simple tooltip for this step
    await createContextualTooltip(step, targetElement, stepIndex, BOOKMARKS_TUTORIAL_STEPS.length, showStep)
  }

  await showStep(0)
}

/**
 * Create a contextual tooltip for bookmarks tutorial
 */
async function createContextualTooltip(
  step: BookmarksTutorialStep,
  targetElement: HTMLElement,
  currentIndex: number,
  totalSteps: number,
  onNext: (nextIndex: number) => Promise<void>
): Promise<void> {
  
  // Get localized messages
  const title = await getLocalizedMessage(step.titleKey)
  const message = await getLocalizedMessage(step.messageKey)
  const nextText = await getLocalizedMessage('tutorialNextButton') || 'Next'
  const skipText = await getLocalizedMessage('tutorialSkipButton') || 'Skip'
  const finishText = await getLocalizedMessage('tutorialFinishButton') || 'Finish'

  const isLastStep = currentIndex >= totalSteps - 1
  const stepNumber = currentIndex + 1

  // Create overlay
  const overlay = document.createElement('div')
  overlay.className = 'bookmarks-tutorial-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: auto;
  `

  // Create highlight
  const rect = targetElement.getBoundingClientRect()
  const highlight = document.createElement('div')
  highlight.className = 'bookmarks-tutorial-highlight'
  const highlightPadding = 8
  highlight.style.cssText = `
    position: fixed;
    top: ${rect.top - highlightPadding}px;
    left: ${rect.left - highlightPadding}px;
    width: ${rect.width + highlightPadding * 2}px;
    height: ${rect.height + highlightPadding * 2}px;
    border: 2px solid #10b981;
    border-radius: 8px;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2), 
                0 0 20px rgba(16, 185, 129, 0.3);
    z-index: 9999;
    opacity: 0;
    transform: scale(0.95);
    transition: all 0.3s ease;
    pointer-events: none;
    animation: bookmarks-pulse 2s infinite;
  `

  // Add pulse animation
  if (!document.getElementById('bookmarks-tutorial-styles')) {
    const styles = document.createElement('style')
    styles.id = 'bookmarks-tutorial-styles'
    styles.textContent = `
      @keyframes bookmarks-pulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.3); }
        50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1), 0 0 30px rgba(16, 185, 129, 0.4); }
      }
      .bookmarks-tutorial-show { opacity: 1 !important; transform: scale(1) !important; }
    `
    document.head.appendChild(styles)
  }

  // Create tooltip
  const tooltip = document.createElement('div')
  tooltip.className = 'bookmarks-tutorial-tooltip'
  tooltip.style.cssText = `
    position: fixed;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 300px;
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    border: 1px solid rgba(0, 0, 0, 0.1);
    direction: rtl;
    text-align: right;
  `

  tooltip.innerHTML = `
    <div style="padding: 16px 16px 12px 16px; border-bottom: 1px solid rgba(0, 0, 0, 0.1);">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 12px; font-weight: bold;">📑</span>
          </div>
          <span style="font-size: 12px; font-weight: 700; color: #10b981; text-transform: uppercase;">סימניות</span>
          <span style="background: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px;">${stepNumber}/${totalSteps}</span>
        </div>
        <button class="bookmarks-tutorial-close" style="background: none; border: none; color: #9ca3af; font-size: 18px; cursor: pointer; padding: 0; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">×</button>
      </div>
    </div>
    <div style="padding: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">${title}</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">${message}</p>
    </div>
    <div style="padding: 16px; border-top: 1px solid rgba(0, 0, 0, 0.1); background: rgba(249, 250, 251, 0.5);">
      <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
        <button class="bookmarks-tutorial-skip" style="padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid #e5e7eb; background: transparent; color: #6b7280; transition: all 0.2s ease;">${skipText}</button>
        <button class="bookmarks-tutorial-next" style="padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3); transition: all 0.2s ease;">
          ${isLastStep ? finishText : nextText}
        </button>
      </div>
    </div>
  `

  // Position tooltip
  const tooltipRect = tooltip.getBoundingClientRect()
  let top: number, left: number

  switch (step.position) {
    case 'top':
      top = rect.top - 320 // tooltip height estimate
      left = rect.left + (rect.width - 300) / 2 // tooltip width
      break
    case 'bottom':
      top = rect.bottom + 12
      left = rect.left + (rect.width - 300) / 2
      break
    case 'left':
      top = rect.top + (rect.height - 200) / 2 // tooltip height estimate
      left = rect.left - 320
      break
    case 'right':
      top = rect.top + (rect.height - 200) / 2
      left = rect.right + 12
      break
    default:
      top = window.innerHeight / 2 - 100
      left = window.innerWidth / 2 - 150
  }

  // Keep within viewport
  const viewportPadding = 16
  if (left + 300 + viewportPadding > window.innerWidth) {
    left = window.innerWidth - 300 - viewportPadding
  }
  if (left < viewportPadding) {
    left = viewportPadding
  }
  if (top + 200 + viewportPadding > window.innerHeight) {
    top = window.innerHeight - 200 - viewportPadding
  }
  if (top < viewportPadding) {
    top = viewportPadding
  }

  tooltip.style.top = `${top}px`
  tooltip.style.left = `${left}px`

  // Add to DOM
  document.body.appendChild(overlay)
  document.body.appendChild(highlight)
  document.body.appendChild(tooltip)

  // Setup event listeners
  const closeBtn = tooltip.querySelector('.bookmarks-tutorial-close')
  const nextBtn = tooltip.querySelector('.bookmarks-tutorial-next')
  const skipBtn = tooltip.querySelector('.bookmarks-tutorial-skip')

  const cleanup = () => {
    overlay.remove()
    highlight.remove()
    tooltip.remove()
    // Clean up demo button if it exists
    const demoButton = document.querySelector('[data-demo-bookmark="true"]')
    if (demoButton) {
      demoButton.remove()
    }
    // Clean up demo styles
    const demoStyles = document.querySelector('#tutorial-bookmark-styles')
    if (demoStyles) {
      demoStyles.remove()
    }
  }

  closeBtn?.addEventListener('click', () => {
    cleanup()
    markBookmarksTutorialCompleted()
  })

  nextBtn?.addEventListener('click', () => {
    cleanup()
    if (isLastStep) {
      markBookmarksTutorialCompleted()
    } else {
      onNext(currentIndex + 1)
    }
  })

  skipBtn?.addEventListener('click', () => {
    cleanup()
    markBookmarksTutorialCompleted()
  })

  // Show with animation
  setTimeout(() => {
    overlay.classList.add('bookmarks-tutorial-show')
    highlight.classList.add('bookmarks-tutorial-show')
    tooltip.classList.add('bookmarks-tutorial-show')
  }, 50)
}

/**
 * Get localized message
 */
async function getLocalizedMessage(key: string): Promise<string> {
  try {
    if (typeof browser !== 'undefined' && browser.i18n && browser.i18n.getMessage) {
      const message = (browser.i18n.getMessage as any)(key)
      return message || key
    }
    return key
  } catch (error) {
    console.warn(`Failed to get localized message for key: ${key}`, error)
    return key
  }
}

/**
 * Mark bookmarks tutorial as completed
 */
async function markBookmarksTutorialCompleted(): Promise<void> {
  try {
    const result = await browser.storage.local.get(['tutorialProgress'])
    const tutorialProgress = result.tutorialProgress || {}
    const completedFeatures = tutorialProgress.completedFeatures || []
    
    if (!completedFeatures.includes('bookmarks_contextual')) {
      completedFeatures.push('bookmarks_contextual')
      
      await browser.storage.local.set({
        tutorialProgress: {
          ...tutorialProgress,
          completedFeatures,
          lastUpdate: Date.now()
        }
      })
    }
  } catch (error) {
    console.error('Failed to save bookmarks tutorial progress:', error)
  }
}

/**
 * Create a demo bookmark button for tutorial purposes
 */
function createDemoBookmarkButton(): HTMLElement {
  console.log('createDemoBookmarkButton called')
  
  // Find the most recent message container to place the demo button next to
  const messageSelectors = [
    '[data-message-author-role="assistant"]:last-of-type',
    '[data-message-author-role="user"]:last-of-type',
    '.group.w-full:last-of-type',
    'article:last-of-type'
  ]
  
  let messageContainer: Element | null = null
  for (const selector of messageSelectors) {
    messageContainer = document.querySelector(selector)
    console.log(`Checking selector "${selector}":`, messageContainer)
    if (messageContainer) break
  }
  
  if (!messageContainer) {
    console.log('No message container found, creating fallback')
    // Fallback - create a temporary container in a visible location
    const fallbackContainer = document.createElement('div')
    fallbackContainer.className = 'tutorial-demo-container'
    fallbackContainer.style.cssText = `
      position: fixed;
      top: 200px;
      right: 20px;
      z-index: 10000;
      background: white;
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `
    document.body.appendChild(fallbackContainer)
    
    const demoButton = createBookmarkButtonElement()
    fallbackContainer.appendChild(demoButton)
    console.log('Fallback demo button created and added to body')
    return demoButton
  }

  console.log('Message container found:', messageContainer)
  // Create demo button positioned relative to the message
  const demoButton = createBookmarkButtonElement()
  
  // Position the button in the top-right corner of the message
  demoButton.style.cssText += `
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10001;
    opacity: 1 !important;
  `
  
  // Ensure the message container can contain the absolutely positioned button
  const containerElement = messageContainer as HTMLElement
  const currentPosition = window.getComputedStyle(containerElement).position
  if (currentPosition === 'static') {
    containerElement.style.position = 'relative'
  }
  
  containerElement.appendChild(demoButton)
  
  console.log('Demo button added to message container')
  return demoButton
}

/**
 * Create the actual bookmark button element
 */
function createBookmarkButtonElement(): HTMLElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute('data-bookmark-button', '')
  button.setAttribute('data-demo-bookmark', 'true')
  button.setAttribute('aria-label', 'Bookmark this section (Demo)')
  button.title = 'Bookmark this section (Demo)'
  
  // Make it very visible for demo
  button.className = 'p-2 rounded-xl bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-lg flex-shrink-0 self-start mt-1'
  
  button.innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-bookmark-plus"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      <line x1="12" x2="12" y1="7" y2="13" />
      <line x1="9" x2="15" y1="10" y2="10" />
    </svg>
  `
  
  // Add a very obvious glow effect to make it stand out for tutorial
  button.style.cssText += `
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.8);
    animation: tutorial-pulse 2s infinite;
    position: relative;
    z-index: 10002 !important;
  `
  
  console.log('Demo button element created with enhanced visibility')
  
  // Add animation keyframes if not already present
  if (!document.querySelector('#tutorial-bookmark-styles')) {
    const style = document.createElement('style')
    style.id = 'tutorial-bookmark-styles'
    style.textContent = `
      @keyframes tutorial-pulse {
        0%, 100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.8); }
        50% { box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.5); }
      }
    `
    document.head.appendChild(style)
    console.log('Tutorial CSS styles added')
  }
  
  return button
}
