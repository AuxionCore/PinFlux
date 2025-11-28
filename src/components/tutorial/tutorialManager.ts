import { TutorialStep, TutorialFeature, TUTORIAL_FEATURES, getAvailableSteps } from './tutorialFeatures'

interface TutorialState {
  isActive: boolean
  currentStepIndex: number
  currentFeature: TutorialFeature | null
  completedFeatures: string[]
  userInitiated: boolean
}

interface TutorialElementRefs {
  overlay?: HTMLElement
  tooltip?: HTMLElement | null
  highlight?: HTMLElement
}

export class TutorialManager {
  private state: TutorialState
  private elements: TutorialElementRefs = {}
  private stepCompletionCallbacks: Map<string, () => void> = new Map()
  private isCreatingTooltip = false
  private activeObservers: MutationObserver[] = []
  private activeIntervals: NodeJS.Timeout[] = []
  private activeTimeouts: NodeJS.Timeout[] = []
  private activeEventListeners: Array<{element: Element, event: string, handler: EventListener}> = []

  constructor() {
    this.state = {
      isActive: false,
      currentStepIndex: 0,
      currentFeature: null,
      completedFeatures: [],
      userInitiated: false
    }
    this.loadProgress()
    
    // Listen for automatic tutorial advancement
    document.addEventListener('tutorialAdvance', () => {
      if (this.state.isActive) {
        this.nextStep()
      }
    })
    
    // Listen for tooltip repositioning requests
    document.addEventListener('tutorialRepositionTooltip', (event: any) => {
      if (this.state.isActive && event.detail?.avoidElement) {
        this.updateTooltipPosition(event.detail.avoidElement)
      }
    })
    
    // Listen for tutorial close requests
    document.addEventListener('tutorialClose', () => {
      if (this.state.isActive) {
        this.stopTutorial()
      }
    })
  }

  /**
   * Calculate current step number and total steps across all features
   */
  private getGlobalStepNumbers(): { currentGlobalStep: number; totalGlobalSteps: number } {
    if (!this.state.currentFeature) {
      return { currentGlobalStep: 1, totalGlobalSteps: 1 }
    }

    // Get all features in order
    const sortedFeatures = TUTORIAL_FEATURES.sort((a, b) => a.order - b.order)
    
    // Calculate total steps across all features
    let totalGlobalSteps = 0
    for (const feature of sortedFeatures) {
      totalGlobalSteps += feature.steps.length
    }

    // Calculate current global step
    let currentGlobalStep = 0
    for (const feature of sortedFeatures) {
      if (feature.id === this.state.currentFeature.id) {
        // Add steps from current feature up to current index
        currentGlobalStep += this.state.currentStepIndex + 1
        break
      } else {
        // Add all steps from completed features
        currentGlobalStep += feature.steps.length
      }
    }

    return { currentGlobalStep, totalGlobalSteps }
  }

  /**
   * Start tutorial for a specific feature or the next available one
   */
  async startTutorial(featureId?: string, userInitiated = false): Promise<void> {
    // Clean up any previous tutorial state
    this.cleanup()
    
    // Notify tutorial features to clean up their resources too
    document.dispatchEvent(new CustomEvent('tutorialCleanup'))
    
    this.state.userInitiated = userInitiated
    
    if (featureId) {
      const feature = TUTORIAL_FEATURES.find(f => f.id === featureId)
      if (!feature) {
        console.error(`Tutorial feature ${featureId} not found`)
        return
      }
      this.state.currentFeature = feature
      
      // If user manually started a specific tutorial, allow re-running even if completed
      if (userInitiated && this.state.completedFeatures.includes(featureId)) {
      }
    } else {
      // Find next available feature (ignore completed status if user initiated)
      const nextFeature = TUTORIAL_FEATURES
        .sort((a, b) => a.order - b.order)
        .find(f => userInitiated || !this.state.completedFeatures.includes(f.id))
      
      if (!nextFeature) {
        // If user initiated and no uncompleted features, start with first feature
        if (userInitiated && TUTORIAL_FEATURES.length > 0) {
          this.state.currentFeature = TUTORIAL_FEATURES[0]
        } else {
          return
        }
      } else {
        this.state.currentFeature = nextFeature
      }
    }

    this.state.isActive = true
    this.state.currentStepIndex = 0
    
    // Mark tutorial as active in sessionStorage to prevent other notifications
    sessionStorage.setItem('pinflux_tutorial_active', 'true')
    
    await this.showCurrentStep()
  }

  /**
   * Show the current tutorial step
   */
  private async showCurrentStep(): Promise<void> {
    if (!this.state.currentFeature || !this.state.isActive) return

    const currentStep = this.state.currentFeature.steps[this.state.currentStepIndex]
    if (!currentStep) {
      await this.finishCurrentFeature()
      return
    }

    // Check prerequisites - if failed, try to skip to next valid step
    if (currentStep.prerequisite && !currentStep.prerequisite()) {
      // Try to find next step with met prerequisite in current feature
      let foundValidStep = false
      for (let i = this.state.currentStepIndex + 1; i < this.state.currentFeature.steps.length; i++) {
        const nextStep = this.state.currentFeature.steps[i]
        if (!nextStep.prerequisite || nextStep.prerequisite()) {
          this.state.currentStepIndex = i - 1 // Will be incremented by nextStep()
          foundValidStep = true
          break
        }
      }
      
      if (!foundValidStep) {
        await this.finishCurrentFeature()
        return
      }
      
      await this.nextStep()
      return
    }

    // Find target element with retries
    let targetElement: HTMLElement | null = null
    const maxRetries = 3
    
    for (let i = 0; i < maxRetries; i++) {
      targetElement = document.querySelector(currentStep.targetSelector) as HTMLElement
      if (targetElement || currentStep.targetSelector === 'body') {
        break
      }
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    if (!targetElement && currentStep.targetSelector !== 'body') {
      console.warn(`Target element ${currentStep.targetSelector} not found after retries, skipping step`)
      await this.nextStep()
      return
    }

    await this.createStepElements(currentStep, targetElement)
  }

  /**
   * Create the visual elements for a tutorial step
   */
  private async createStepElements(step: TutorialStep, targetElement: HTMLElement | null): Promise<void> {
    this.cleanup()
    
    // Also clean up tutorial features resources (observers, intervals, etc.)
    document.dispatchEvent(new CustomEvent('tutorialCleanup'))

    // Create overlay
    this.elements.overlay = this.createOverlay()
    document.body.appendChild(this.elements.overlay)

    // Create highlight if needed
    if (step.highlightElement && targetElement) {
      this.elements.highlight = this.createHighlight(targetElement)
      if (this.elements.highlight) {
        document.body.appendChild(this.elements.highlight)
      }
    }

    // Create tooltip
    // Prevent concurrent tooltip creation
    if (this.isCreatingTooltip) {
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.isCreatingTooltip) {
            clearInterval(checkInterval)
            resolve(undefined)
          }
        }, 50)
      })
    }
    
    this.isCreatingTooltip = true
    
    // Add a small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 10))
    
    let tooltipCreated = false
    let attempts = 0
    const maxAttempts = 3
    
    while (!tooltipCreated && attempts < maxAttempts) {
      attempts++
      try {
        this.elements.tooltip = await this.createTooltip(step, targetElement)
        
        if (this.elements.tooltip && this.elements.tooltip instanceof HTMLElement) {
          document.body.appendChild(this.elements.tooltip)
          tooltipCreated = true
        } else {
          console.error(`Attempt ${attempts}: createTooltip returned:`, this.elements.tooltip)
          this.elements.tooltip = null
          
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      } catch (creationError) {
        console.error(`Attempt ${attempts}: Error during tooltip creation:`, creationError)
        this.elements.tooltip = null
      }
    }
    
    this.isCreatingTooltip = false
    
    if (!tooltipCreated) {
      console.error('Failed to create tooltip after all attempts, step:', step.id)
      
      // Try to create a simple fallback tooltip
      try {
        const fallbackTooltip = document.createElement('div')
        fallbackTooltip.className = 'tutorial-tooltip'
        fallbackTooltip.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10000;
          background: #6366f1;
          color: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 300px;
          font-family: system-ui, sans-serif;
        `
        fallbackTooltip.innerHTML = `
          <h3 style="margin: 0 0 10px 0;">Tutorial Step ${this.state.currentStepIndex + 1}</h3>
          <p style="margin: 0 0 15px 0;">Find the Options Menu - Hover over the highlighted chat and click the three dots (⋯) menu that appears</p>
          <div style="text-align: right;">
            <button onclick="this.closest('.tutorial-tooltip').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Skip</button>
            <button onclick="this.closest('.tutorial-tooltip').remove()" style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Next</button>
          </div>
        `
        this.elements.tooltip = fallbackTooltip
        document.body.appendChild(this.elements.tooltip)
      } catch (fallbackError) {
        console.error('Even simple fallback tooltip creation failed:', fallbackError)
        return
      }
    }

    // Position tooltip
    this.positionTooltip(step, targetElement)

    // Re-setup events after adding to DOM
    if (this.elements.tooltip) {
      this.setupTooltipEvents(this.elements.tooltip)
    }

    // Show with animation
    setTimeout(() => {
      this.elements.overlay?.classList.add('tutorial-show')
      this.elements.highlight?.classList.add('tutorial-show')
      this.elements.tooltip?.classList.add('tutorial-show')
    }, 50)

    // Handle action if present
    if (step.action) {
      try {
        // Execute action but don't automatically proceed to next step
        // Let user control navigation with Next button
        await step.action()
      } catch (error) {
        console.warn('Action failed, continuing tutorial:', error)
      }
    }
  }

  /**
   * Create the overlay element
   */
  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div')
    overlay.className = 'tutorial-overlay'
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
      pointer-events: none;
    `
    return overlay
  }

  /**
   * Create highlight element around target
   */
  private createHighlight(targetElement: HTMLElement): HTMLElement {
    const rect = targetElement.getBoundingClientRect()
    const highlight = document.createElement('div')
    highlight.className = 'tutorial-highlight'
    
    const padding = 8
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top - padding}px;
      left: ${rect.left - padding}px;
      width: ${rect.width + padding * 2}px;
      height: ${rect.height + padding * 2}px;
      border: 2px solid #6366f1;
      border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2), 
                  0 0 20px rgba(99, 102, 241, 0.3);
      z-index: 9999;
      opacity: 0;
      transform: scale(0.95);
      transition: all 0.3s ease;
      pointer-events: none;
      animation: tutorial-pulse 2s infinite;
    `
    
    // Add pulse animation
    if (!document.getElementById('tutorial-styles')) {
      const styles = document.createElement('style')
      styles.id = 'tutorial-styles'
      styles.textContent = `
        @keyframes tutorial-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2), 0 0 20px rgba(99, 102, 241, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.1), 0 0 30px rgba(99, 102, 241, 0.4); }
        }
        .tutorial-show { opacity: 1 !important; transform: scale(1) !important; }
      `
      document.head.appendChild(styles)
    }
    
    return highlight
  }

  /**
   * Create tooltip with step content
   */
  private async createTooltip(step: TutorialStep, targetElement: HTMLElement | null): Promise<HTMLElement> {
    // Create base tooltip element
    const tooltip = document.createElement('div')
    tooltip.className = 'tutorial-tooltip'
    tooltip.setAttribute('data-tutorial-step-id', step.id) // Add step ID for identification
    
    // Get step information
    const currentStep = this.state.currentFeature?.steps[this.state.currentStepIndex]
    const isLastStep = this.state.currentStepIndex >= (this.state.currentFeature?.steps.length || 1) - 1
    const isFirstStep = this.state.currentStepIndex === 0
    
    // Calculate global step numbers across all features
    const { currentGlobalStep, totalGlobalSteps } = this.getGlobalStepNumbers()
    const stepNumber = currentGlobalStep
    const totalSteps = totalGlobalSteps
    
    const waitForUserAction = currentStep?.waitForUserAction || false
    
    // Use simple fallback text if i18n fails
    let title = 'Find the Options Menu'
    let message = 'Hover over the highlighted chat and click the three dots (⋯) menu that appears'
    let nextText = 'Next'
    let prevText = 'Previous'
    let skipText = 'Skip'
    let finishText = 'Finish'
    
    // Try to get localized text
    try {
      const localizedTitle = await this.getLocalizedMessage(step.titleKey)
      const localizedMessage = await this.getLocalizedMessage(step.messageKey)
      const localizedNext = await this.getLocalizedMessage('tutorialNextButton')
      const localizedPrev = await this.getLocalizedMessage('tutorialPrevButton')
      const localizedSkip = await this.getLocalizedMessage('tutorialSkipButton')
      const localizedFinish = await this.getLocalizedMessage('tutorialFinishButton')
      
      if (localizedTitle && localizedTitle !== step.titleKey) title = localizedTitle
      if (localizedMessage && localizedMessage !== step.messageKey) message = localizedMessage
      if (localizedNext && localizedNext !== 'tutorialNextButton') nextText = localizedNext
      if (localizedPrev && localizedPrev !== 'tutorialPrevButton') prevText = localizedPrev
      if (localizedSkip && localizedSkip !== 'tutorialSkipButton') skipText = localizedSkip
      if (localizedFinish && localizedFinish !== 'tutorialFinishButton') finishText = localizedFinish
    } catch (i18nError) {
    }

    // Add sub-feature name to title if available
    let displayTitle = title
    if (step.subFeatureNameKey) {
      // Try to get localized sub-feature name
      let subFeatureName = 'Sub-feature' // fallback
      try {
        const localizedSubFeature = await this.getLocalizedMessage(step.subFeatureNameKey)
        if (localizedSubFeature && localizedSubFeature !== step.subFeatureNameKey) {
          subFeatureName = localizedSubFeature
        }
      } catch (error) {
      }
      displayTitle = `<span class="tutorial-sub-feature">${subFeatureName}</span><br/>${title}`
    }

    // Set the HTML content
    tooltip.innerHTML = `
      <div class="tutorial-tooltip-content">
        <div class="tutorial-tooltip-header">
          <div class="tutorial-tooltip-brand">
            <div class="tutorial-tooltip-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <span class="tutorial-tooltip-brand-text">PINFLUX TUTORIAL</span>
            <div class="tutorial-step-indicator">${stepNumber}/${totalSteps}</div>
          </div>
          <button class="tutorial-close-btn" aria-label="Close tutorial">×</button>
        </div>
        <div class="tutorial-tooltip-body">
          <h3 class="tutorial-tooltip-title">${displayTitle}</h3>
          <p class="tutorial-tooltip-message">${message}</p>
        </div>
        <div class="tutorial-tooltip-footer">
          <div class="tutorial-tooltip-buttons">
            ${!isFirstStep ? `<button class="tutorial-btn tutorial-btn-ghost tutorial-prev-btn">${prevText}</button>` : ''}
            <button class="tutorial-btn tutorial-btn-ghost tutorial-skip-btn">${skipText}</button>
            ${!waitForUserAction ? `<button class="tutorial-btn tutorial-btn-primary tutorial-next-btn">
              ${isLastStep ? finishText : nextText}
            </button>` : ''}
          </div>
        </div>
      </div>
    `

    // Add styles
    this.addTooltipStyles(tooltip)
    
    return tooltip
  }

  /**
   * Add styles to tooltip
   */
  private addTooltipStyles(tooltip: HTMLElement): void {
    tooltip.style.cssText = `
      position: fixed;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
      z-index: 10000;
      max-width: 320px;
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      color: white;
    `

    // Add internal styles
    const style = document.createElement('style')
    if (!document.getElementById('tutorial-tooltip-styles')) {
      style.id = 'tutorial-tooltip-styles'
      style.textContent = `
        .tutorial-tooltip-content {
          padding: 0;
        }
        .tutorial-tooltip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .tutorial-tooltip-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .tutorial-tooltip-logo {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #ffffff;
        }
        .tutorial-tooltip-logo svg {
          width: 18px;
          height: 18px;
        }
        .tutorial-tooltip-brand-text {
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tutorial-step-indicator {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: auto;
        }
        .tutorial-close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .tutorial-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        .tutorial-tooltip-body {
          padding: 16px;
        }
        .tutorial-tooltip-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }
        .tutorial-sub-feature {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.25);
          padding: 3px 10px;
          border-radius: 6px;
          margin-bottom: 8px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .tutorial-tooltip-message {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.95);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .tutorial-tooltip-footer {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
        }
        .tutorial-tooltip-buttons {
          display: flex;
          gap: 6px;
          justify-content: flex-end;
          align-items: center;
        }
        .tutorial-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          pointer-events: auto;
          user-select: none;
        }
        .tutorial-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
        }
        .tutorial-btn-primary:hover {
          background: linear-gradient(135deg, #5856eb 0%, #7c3aed 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(99, 102, 241, 0.4);
        }
        .tutorial-btn-ghost {
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .tutorial-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.5);
        }
        .tutorial-skip-btn {
          font-size: 12px;
          opacity: 0.8;
        }
      `
      document.head.appendChild(style)
    }
  }

  /**
   * Setup event listeners for tooltip buttons
   */
  private setupTooltipEvents(tooltip: HTMLElement): void {
    // Use a slight delay to ensure DOM is ready
    setTimeout(() => {
      const closeBtn = tooltip.querySelector('.tutorial-close-btn')
      const nextBtn = tooltip.querySelector('.tutorial-next-btn')
      const prevBtn = tooltip.querySelector('.tutorial-prev-btn')
      const skipBtn = tooltip.querySelector('.tutorial-skip-btn')

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          this.stopTutorial()
        })
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          this.nextStep()
        })
      }
      
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          this.prevStep()
        })
      }
      
      if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          this.skipFeature()
        })
      }

      // Close on outside click (only if user initiated)
      if (this.state.userInitiated) {
        this.elements.overlay?.addEventListener('click', (e) => {
          if (e.target === this.elements.overlay) {
            this.stopTutorial()
          }
        })
      }

      // Add keyboard support
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.stopTutorial()
        } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
          if (nextBtn) {
            (nextBtn as HTMLButtonElement).click()
          }
        } else if (e.key === 'ArrowLeft') {
          if (prevBtn) {
            (prevBtn as HTMLButtonElement).click()
          }
        }
      }

      document.addEventListener('keydown', keyHandler)
      
      // Store the handler to remove it later
      if (!this.elements.tooltip) {
        this.elements.tooltip = tooltip
      }
      ;(this.elements.tooltip as any).keyHandler = keyHandler
    }, 10)
  }

  /**
   * Position tooltip relative to target element
   */
  private positionTooltip(step: TutorialStep, targetElement: HTMLElement | null): void {
    if (!this.elements.tooltip) return

    const tooltip = this.elements.tooltip
    const tooltipRect = tooltip.getBoundingClientRect()
    
    if (!targetElement || step.position === 'center') {
      // Center on screen
      tooltip.style.position = 'fixed'
      tooltip.style.top = '50%'
      tooltip.style.left = '50%'
      tooltip.style.transform = 'translate(-50%, -50%)'
      return
    }

    const targetRect = targetElement.getBoundingClientRect()
    const spacing = 12
    const padding = 16
    
    let top: number, left: number

    switch (step.position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - spacing
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = targetRect.bottom + spacing
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
        left = targetRect.left - tooltipRect.width - spacing
        break
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
        left = targetRect.right + spacing
        break
      default:
        top = targetRect.bottom + spacing
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
    }

    // Keep tooltip within viewport with better boundaries
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Horizontal positioning with proper padding
    if (left + tooltipRect.width + padding > viewportWidth) {
      left = viewportWidth - tooltipRect.width - padding
    }
    if (left < padding) {
      left = padding
    }
    
    // Vertical positioning with fallback
    if (top + tooltipRect.height + padding > viewportHeight) {
      // Try positioning above target instead
      const newTop = targetRect.top - tooltipRect.height - spacing
      if (newTop >= padding) {
        top = newTop
      } else {
        top = viewportHeight - tooltipRect.height - padding
      }
    }
    if (top < padding) {
      top = padding
    }

    tooltip.style.position = 'fixed'
    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
    tooltip.style.transform = 'none'
  }

  /**
   * Update tooltip position dynamically to avoid overlapping with menus
   */
  updateTooltipPosition(avoidElement?: HTMLElement): void {
    if (!this.elements.tooltip) return
    
    const tooltip = this.elements.tooltip
    const currentStep = this.state.currentFeature?.steps[this.state.currentStepIndex]
    if (!currentStep) return
    
    const targetElement = document.querySelector(currentStep.targetSelector) as HTMLElement
    if (!targetElement && currentStep.targetSelector !== 'body') return
    
    if (avoidElement) {
      const tooltipRect = tooltip.getBoundingClientRect()
      const avoidRect = avoidElement.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Check if tooltip and avoid element overlap
      const overlap = !(tooltipRect.right < avoidRect.left || 
                       tooltipRect.left > avoidRect.right || 
                       tooltipRect.bottom < avoidRect.top || 
                       tooltipRect.top > avoidRect.bottom)
      
      if (overlap) {
        // Reposition tooltip to avoid overlap
        let newTop = avoidRect.bottom + 20
        let newLeft = Math.max(20, avoidRect.left - 150)
        
        // If that would go off screen, try other positions
        if (newTop + tooltipRect.height > viewportHeight - 20) {
          newTop = avoidRect.top - tooltipRect.height - 20
        }
        if (newLeft + tooltipRect.width > viewportWidth - 20) {
          newLeft = viewportWidth - tooltipRect.width - 20
        }
        
        tooltip.style.top = `${Math.max(20, newTop)}px`
        tooltip.style.left = `${Math.max(20, newLeft)}px`
        tooltip.style.transform = 'none'
      }
    } else {
      // Regular repositioning
      this.positionTooltip(currentStep, targetElement)
    }
  }

  /**
   * Get localized message using browser.i18n API
   */
  private async getLocalizedMessage(key: string): Promise<string> {
    try {
      // Try browser.i18n first
      if (typeof browser !== 'undefined' && browser.i18n && browser.i18n.getMessage) {
        const message = (browser.i18n.getMessage as any)(key)
        return message || key
      }
      
      // Fallback to chrome.i18n if browser is not available
      if (typeof (globalThis as any).chrome !== 'undefined' && 
          (globalThis as any).chrome.i18n && 
          (globalThis as any).chrome.i18n.getMessage) {
        const message = (globalThis as any).chrome.i18n.getMessage(key)
        return message || key
      }
      
      // Fallback to English text
      const fallbacks: Record<string, string> = {
        'tutorialPinStep1Title': 'Find the Options Menu',
        'tutorialPinStep1Message': 'Hover over the highlighted chat and click the three dots (⋯) menu that appears',
        'tutorialPinMenuOpenTitle': 'Find the Pin Option',
        'tutorialPinMenuOpenMessage': 'Look for the Pin option in the menu and click it',
        'tutorialPinnedLocationTitle': 'Chat Successfully Pinned!',
        'tutorialPinnedLocationMessage': 'Your chat is now pinned to the top of your sidebar for easy access. You can unpin it anytime using the same menu.',
        'tutorialNextButton': 'Next',
        'tutorialPrevButton': 'Previous',
        'tutorialSkipButton': 'Skip',
        'tutorialFinishButton': 'Finish'
      }
      
      console.warn(`i18n API not available, using fallback for key: ${key}`)
      return fallbacks[key] || key
    } catch (error) {
      console.error(`Failed to get localized message for key: ${key}`, error)
      return key
    }
  }

  /**
   * Move to next step
   */
  async nextStep(): Promise<void> {
    if (!this.state.currentFeature) return
    
    this.state.currentStepIndex++
    await this.showCurrentStep()
  }

  /**
   * Move to previous step
   */
  async prevStep(): Promise<void> {
    if (this.state.currentStepIndex > 0) {
      this.state.currentStepIndex--
      await this.showCurrentStep()
    }
  }

  /**
   * Skip current sub-feature and move to next sub-feature (or next main feature if no more sub-features)
   */
  async skipFeature(): Promise<void> {
    if (!this.state.currentFeature) return

    const currentStep = this.state.currentFeature.steps[this.state.currentStepIndex]
    const currentSubFeature = currentStep?.subFeature

    // If current step has a sub-feature, find the next step with a different sub-feature
    if (currentSubFeature) {
      // Find the next step that belongs to a different sub-feature
      let nextStepIndex = this.state.currentStepIndex + 1
      while (nextStepIndex < this.state.currentFeature.steps.length) {
        const nextStep = this.state.currentFeature.steps[nextStepIndex]
        if (nextStep.subFeature !== currentSubFeature) {
          // Found a different sub-feature - move to it
          this.cleanup()
          this.state.currentStepIndex = nextStepIndex
          await this.showCurrentStep()
          return
        }
        nextStepIndex++
      }
    }

    // If we didn't find another sub-feature, we've reached the end of this feature
    // Mark feature as completed and move to next main feature
    if (!this.state.completedFeatures.includes(this.state.currentFeature.id)) {
      this.state.completedFeatures.push(this.state.currentFeature.id)
      await this.saveProgress()
    }

    this.cleanup()

    // Find next feature
    const nextFeature = TUTORIAL_FEATURES
      .sort((a, b) => a.order - b.order)
      .find(f => !this.state.completedFeatures.includes(f.id))

    if (nextFeature) {
      // Move to next feature
      this.state.currentFeature = nextFeature
      this.state.currentStepIndex = 0
      await this.showCurrentStep()
    } else {
      // No more features - end tutorial
      this.stopTutorial()
    }
  }

  /**
   * Stop tutorial completely
   */
  stopTutorial(): void {
    this.cleanup()
    this.state.isActive = false
    this.state.currentFeature = null
    this.state.currentStepIndex = 0
    
    // Remove tutorial active flag from sessionStorage
    sessionStorage.removeItem('pinflux_tutorial_active')
  }

  /**
   * Check if tutorial is currently active
   */
  isActive(): boolean {
    return this.state.isActive
  }

  /**
   * Finish current feature and move to next
   */
  private async finishCurrentFeature(): Promise<void> {
    if (!this.state.currentFeature) return

    // Mark feature as completed
    if (!this.state.completedFeatures.includes(this.state.currentFeature.id)) {
      this.state.completedFeatures.push(this.state.currentFeature.id)
      await this.saveProgress()
    }

    this.cleanup()

    // Continue to next feature (regardless of how tutorial was started)
    const nextFeature = TUTORIAL_FEATURES
      .sort((a, b) => a.order - b.order)
      .find(f => !this.state.completedFeatures.includes(f.id))

    if (nextFeature) {
      this.state.currentFeature = nextFeature
      this.state.currentStepIndex = 0
      await this.showCurrentStep()
    } else {
      this.stopTutorial()
    }
  }

  /**
   * Clean up tutorial elements
   */
  private cleanup(): void {
    // Remove keyboard handler if exists
    if (this.elements.tooltip && (this.elements.tooltip as any).keyHandler) {
      document.removeEventListener('keydown', (this.elements.tooltip as any).keyHandler)
    }
    
    // Clean up DOM elements
    this.elements.overlay?.remove()
    this.elements.tooltip?.remove()
    this.elements.highlight?.remove()
    
    // Clean up tutorial-specific elements
    document.querySelectorAll('.tutorial-highlight, .tutorial-pin-highlight').forEach(el => el.remove())
    
    // Clean up observers
    this.activeObservers.forEach(observer => {
      try {
        observer.disconnect()
      } catch (error) {
        console.warn('Error disconnecting observer:', error)
      }
    })
    this.activeObservers = []
    
    // Clean up intervals
    this.activeIntervals.forEach(interval => {
      try {
        clearInterval(interval)
      } catch (error) {
        console.warn('Error clearing interval:', error)
      }
    })
    this.activeIntervals = []
    
    // Clean up timeouts
    this.activeTimeouts.forEach(timeout => {
      try {
        clearTimeout(timeout)
      } catch (error) {
        console.warn('Error clearing timeout:', error)
      }
    })
    this.activeTimeouts = []
    
    // Clean up event listeners
    this.activeEventListeners.forEach(({element, event, handler}) => {
      try {
        element.removeEventListener(event, handler)
      } catch (error) {
        console.warn('Error removing event listener:', error)
      }
    })
    this.activeEventListeners = []
    
    // Reset elements
    this.elements = {}
  }

  /**
   * Helper methods for managing cleanup
   */
  private addManagedObserver(observer: MutationObserver): MutationObserver {
    this.activeObservers.push(observer)
    return observer
  }

  private addManagedInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    this.activeIntervals.push(interval)
    return interval
  }

  private addManagedTimeout(timeout: NodeJS.Timeout): NodeJS.Timeout {
    this.activeTimeouts.push(timeout)
    return timeout
  }

  private addManagedEventListener(element: Element, event: string, handler: EventListener, options?: AddEventListenerOptions): void {
    element.addEventListener(event, handler, options)
    this.activeEventListeners.push({element, event, handler})
  }

  /**
   * Save tutorial progress to storage
   */
  private async saveProgress(): Promise<void> {
    try {
      await browser.storage.local.set({
        tutorialProgress: {
          completedFeatures: this.state.completedFeatures,
          lastUpdate: Date.now()
        }
      })
    } catch (error) {
      console.error('Failed to save tutorial progress:', error)
    }
  }

  /**
   * Load tutorial progress from storage
   */
  private async loadProgress(): Promise<void> {
    try {
      const result = await browser.storage.local.get(['tutorialProgress'])
      if (result.tutorialProgress) {
        this.state.completedFeatures = result.tutorialProgress.completedFeatures || []
      }
    } catch (error) {
      console.error('Failed to load tutorial progress:', error)
    }
  }

  /**
   * Reset tutorial progress
   */
  async resetProgress(): Promise<void> {
    this.state.completedFeatures = []
    await this.saveProgress()
  }

  /**
   * Check if tutorial should auto-start for new users
   */
  async shouldAutoStart(): Promise<boolean> {
    // Disabled auto-start - tutorials only start via manual user interaction
    return false
  }

  /**
   * Get available features for manual tutorial selection
   */
  getAvailableFeatures(): TutorialFeature[] {
    return TUTORIAL_FEATURES.filter(feature => {
      return feature.steps.some(step => {
        if (step.prerequisite && !step.prerequisite()) return false
        if (step.targetSelector === 'body') return true
        return !!document.querySelector(step.targetSelector)
      })
    })
  }

  /**
   * Get tutorial status for debugging
   */
  getTutorialStatus() {
    const tooltip = this.elements.tooltip
    let buttonsStatus = {}
    
    if (tooltip) {
      buttonsStatus = {
        prevBtn: !!tooltip.querySelector('.tutorial-prev-btn'),
        nextBtn: !!tooltip.querySelector('.tutorial-next-btn'),
        skipBtn: !!tooltip.querySelector('.tutorial-skip-btn'),
        closeBtn: !!tooltip.querySelector('.tutorial-close-btn')
      }
    }
    
    return {
      isActive: this.state.isActive,
      currentFeature: this.state.currentFeature?.id,
      currentStep: this.state.currentStepIndex,
      completedFeatures: this.state.completedFeatures,
      availableFeatures: this.getAvailableFeatures().map(f => f.id),
      buttons: buttonsStatus,
      isFirstStep: this.state.currentStepIndex === 0,
      tooltipExists: !!this.elements.tooltip
    }
  }
}

// Export singleton instance
export const tutorialManager = new TutorialManager()
