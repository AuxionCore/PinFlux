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
  tooltip?: HTMLElement
  highlight?: HTMLElement
}

export class TutorialManager {
  private state: TutorialState
  private elements: TutorialElementRefs = {}
  private stepCompletionCallbacks: Map<string, () => void> = new Map()

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
        console.log('Auto-advancing tutorial from menu interaction')
        this.nextStep()
      }
    })
    
    // Listen for tooltip repositioning requests
    document.addEventListener('tutorialRepositionTooltip', (event: any) => {
      if (this.state.isActive && event.detail?.avoidElement) {
        this.updateTooltipPosition(event.detail.avoidElement)
      }
    })
  }

  /**
   * Start tutorial for a specific feature or the next available one
   */
  async startTutorial(featureId?: string, userInitiated = false): Promise<void> {
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
        console.log(`Restarting completed tutorial: ${featureId}`)
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
          console.log('All tutorials completed')
          return
        }
      } else {
        this.state.currentFeature = nextFeature
      }
    }

    this.state.isActive = true
    this.state.currentStepIndex = 0
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

    // Check prerequisites
    if (currentStep.prerequisite && !currentStep.prerequisite()) {
      console.log(`Step ${currentStep.id} prerequisite not met, skipping`)
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
      console.log(`Target element ${currentStep.targetSelector} not found, retry ${i + 1}/${maxRetries}`)
    }

    if (!targetElement && currentStep.targetSelector !== 'body') {
      console.warn(`Target element ${currentStep.targetSelector} not found after retries, skipping step`)
      await this.nextStep()
      return
    }

    await this.createStepElements(currentStep, targetElement)
    console.log('Step created successfully:', {
      stepId: currentStep.id,
      stepIndex: this.state.currentStepIndex,
      isFirstStep: this.state.currentStepIndex === 0,
      targetSelector: currentStep.targetSelector
    })
  }

  /**
   * Create the visual elements for a tutorial step
   */
  private async createStepElements(step: TutorialStep, targetElement: HTMLElement | null): Promise<void> {
    this.cleanup()

    // Create overlay
    this.elements.overlay = this.createOverlay()
    document.body.appendChild(this.elements.overlay)

    // Create highlight if needed
    if (step.highlightElement && targetElement) {
      this.elements.highlight = this.createHighlight(targetElement)
      document.body.appendChild(this.elements.highlight)
    }

    // Create tooltip
    this.elements.tooltip = await this.createTooltip(step, targetElement)
    document.body.appendChild(this.elements.tooltip)

    // Position tooltip
    this.positionTooltip(step, targetElement)

    // Re-setup events after adding to DOM
    this.setupTooltipEvents(this.elements.tooltip)

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
        console.log('Action completed for step:', step.id)
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
    const tooltip = document.createElement('div')
    tooltip.className = 'tutorial-tooltip'
    
    // Get localized text using browser.i18n API
    const title = await this.getLocalizedMessage(step.titleKey)
    const message = await this.getLocalizedMessage(step.messageKey)
    const nextText = await this.getLocalizedMessage('tutorialNextButton') || 'Next'
    const prevText = await this.getLocalizedMessage('tutorialPrevButton') || 'Previous'
    const skipText = await this.getLocalizedMessage('tutorialSkipButton') || 'Skip'
    const finishText = await this.getLocalizedMessage('tutorialFinishButton') || 'Finish'
    
    const isLastStep = this.state.currentStepIndex >= (this.state.currentFeature?.steps.length || 1) - 1
    const isFirstStep = this.state.currentStepIndex === 0
    const stepNumber = this.state.currentStepIndex + 1
    const totalSteps = this.state.currentFeature?.steps.length || 1

    console.log('Creating tooltip:', {
      currentStep: this.state.currentStepIndex,
      isFirstStep,
      isLastStep,
      stepNumber,
      totalSteps,
      prevText,
      nextText
    })

    tooltip.innerHTML = `
      <div class="tutorial-tooltip-content">
        <div class="tutorial-tooltip-header">
          <div class="tutorial-tooltip-brand">
            <div class="tutorial-tooltip-logo">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7ZM9 8V17H11V8H9ZM13 8V17H15V8H13Z" fill="#6366f1"/>
              </svg>
            </div>
            <span class="tutorial-tooltip-brand-text">PINFLUX TUTORIAL</span>
            <div class="tutorial-step-indicator">${stepNumber}/${totalSteps}</div>
          </div>
          <button class="tutorial-close-btn" aria-label="Close tutorial">×</button>
        </div>
        <div class="tutorial-tooltip-body">
          <h3 class="tutorial-tooltip-title">${title}</h3>
          <p class="tutorial-tooltip-message">${message}</p>
        </div>
        <div class="tutorial-tooltip-footer">
          <div class="tutorial-tooltip-buttons">
            ${!isFirstStep ? `<button class="tutorial-btn tutorial-btn-ghost tutorial-prev-btn">${prevText}</button>` : ''}
            <button class="tutorial-btn tutorial-btn-ghost tutorial-skip-btn">${skipText}</button>
            <button class="tutorial-btn tutorial-btn-primary tutorial-next-btn">
              ${isLastStep ? finishText : nextText}
            </button>
          </div>
        </div>
      </div>
    `

    this.addTooltipStyles(tooltip)
    // Events will be set up after adding to DOM
    
    return tooltip
  }

  /**
   * Add styles to tooltip
   */
  private addTooltipStyles(tooltip: HTMLElement): void {
    tooltip.style.cssText = `
      position: fixed;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 320px;
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      border: 1px solid rgba(0, 0, 0, 0.1);
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
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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
          color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
        }
        .tutorial-tooltip-logo svg {
          width: 14px;
          height: 14px;
        }
        .tutorial-tooltip-brand-text {
          font-size: 12px;
          font-weight: 700;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tutorial-step-indicator {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: auto;
        }
        .tutorial-close-btn {
          background: none;
          border: none;
          color: #9ca3af;
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
          background: rgba(107, 114, 128, 0.1);
          color: #374151;
        }
        .tutorial-tooltip-body {
          padding: 16px;
        }
        .tutorial-tooltip-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }
        .tutorial-tooltip-message {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #6b7280;
        }
        .tutorial-tooltip-footer {
          padding: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(249, 250, 251, 0.5);
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
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }
        .tutorial-btn-ghost:hover {
          background: #f3f4f6;
          color: #374151;
          border-color: #d1d5db;
        }
        .tutorial-skip-btn {
          font-size: 12px;
          opacity: 0.8;
        }
        @media (prefers-color-scheme: dark) {
          .tutorial-tooltip {
            background: #1f2937 !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          .tutorial-tooltip-header,
          .tutorial-tooltip-footer {
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          .tutorial-tooltip-footer {
            background: rgba(17, 24, 39, 0.5) !important;
          }
          .tutorial-tooltip-title {
            color: #f9fafb !important;
          }
          .tutorial-tooltip-message {
            color: #d1d5db !important;
          }
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

      console.log('Setting up tooltip events:', {
        closeBtn: !!closeBtn,
        nextBtn: !!nextBtn,
        prevBtn: !!prevBtn,
        skipBtn: !!skipBtn,
        currentStep: this.state.currentStepIndex,
        tooltipHTML: tooltip.innerHTML.substring(0, 200)
      })

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Close button clicked')
          this.stopTutorial()
        })
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Next button clicked')
          this.nextStep()
        })
      }
      
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Previous button clicked, current step:', this.state.currentStepIndex)
          this.prevStep()
        })
        console.log('Previous button event listener attached')
      } else {
        console.log('Previous button not found in DOM')
      }
      
      if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Skip button clicked')
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
        
        console.log('Updated tooltip position to avoid overlap')
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
      if (typeof browser !== 'undefined' && browser.i18n && browser.i18n.getMessage) {
        const message = (browser.i18n.getMessage as any)(key)
        console.log(`Translation for ${key}:`, message)
        return message || key
      }
      console.warn(`browser.i18n not available, using key: ${key}`)
      return key
    } catch (error) {
      console.warn(`Failed to get localized message for key: ${key}`, error)
      return key
    }
  }

  /**
   * Move to next step
   */
  async nextStep(): Promise<void> {
    console.log('nextStep called, current step:', this.state.currentStepIndex)
    if (!this.state.currentFeature) return
    
    this.state.currentStepIndex++
    await this.showCurrentStep()
  }

  /**
   * Move to previous step
   */
  async prevStep(): Promise<void> {
    console.log('prevStep called, current step:', this.state.currentStepIndex)
    
    if (this.state.currentStepIndex > 0) {
      this.state.currentStepIndex--
      console.log('Moving to previous step:', this.state.currentStepIndex)
      await this.showCurrentStep()
    } else {
      console.log('Already at first step, cannot go back')
    }
  }

  /**
   * Skip current feature
   */
  async skipFeature(): Promise<void> {
    await this.finishCurrentFeature()
  }

  /**
   * Stop tutorial completely
   */
  stopTutorial(): void {
    this.cleanup()
    this.state.isActive = false
    this.state.currentFeature = null
    this.state.currentStepIndex = 0
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

    // If user initiated, stop here
    if (this.state.userInitiated) {
      this.stopTutorial()
      return
    }

    // Otherwise, continue to next feature
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
    
    this.elements.overlay?.remove()
    this.elements.tooltip?.remove()
    this.elements.highlight?.remove()
    this.elements = {}
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
