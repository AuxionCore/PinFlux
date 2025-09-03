interface NotificationConfig {
  id: string
  title: string
  message: string
  version: string
  type: 'info' | 'success' | 'warning'
  duration?: number
}

/**
 * Shows a one-time notification for users who updated from a specific version
 */
export async function showOneTimeNotification(
  config: NotificationConfig
): Promise<void> {
  const storageKey = `notification_shown_${config.id}`

  try {
    const result = await browser.storage.local.get([storageKey])
    if (result[storageKey]) {
      return
    }

    createNotificationElement(config)
    await browser.storage.local.set({ [storageKey]: true })
  } catch (error) {
    console.error('Failed to show one-time notification:', error)
  }
}

function createNotificationElement(config: NotificationConfig): void {
  const notification = document.createElement('div')
  notification.className = 'pinflux-notification'

  // Get localized text
  const title = browser.i18n.getMessage('dragDropFeatureTitle')
  const message = browser.i18n.getMessage('dragDropFeatureMessage')
  const closeLabel = browser.i18n.getMessage('notificationCloseLabel')

  notification.innerHTML = `
    <div class="pinflux-notification-content">
      <div class="pinflux-notification-brand">
        <div class="pinflux-notification-logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L19 7L15.74 12L19 17L13.09 15.74L12 22L10.91 15.74L5 17L8.26 12L5 7L10.91 8.26L12 2Z"/>
          </svg>
        </div>
        <span class="pinflux-notification-brand-text">PinFlux</span>
      </div>
      <div class="pinflux-notification-header">
        <div class="pinflux-notification-icon ${config.type}">
          ${getIconSvg(config.type)}
        </div>
        <h3 class="pinflux-notification-title">${title}</h3>
        <button class="pinflux-notification-close" aria-label="${closeLabel}">×</button>
      </div>
      <p class="pinflux-notification-message">${message}</p>
    </div>
  `

  addNotificationStyles()
  positionNotification(notification)
  setupNotificationEvents(notification, config.duration || 8000)

  setTimeout(() => notification.classList.add('show'), 100)
}

function positionNotification(notification: HTMLElement): void {
  document.body.appendChild(notification)

  setTimeout(() => {
    const pinnedContainer =
      document.querySelector('#pinnedContainer') ||
      document.querySelector('#chatListContainer')

    if (pinnedContainer) {
      const rect = pinnedContainer.getBoundingClientRect()
      notification.style.position = 'fixed'
      notification.style.top = `${Math.max(10, rect.bottom + 15)}px`
      notification.style.left = `${Math.max(10, rect.left)}px`
      notification.style.maxWidth = `${Math.max(300, rect.width)}px`
      notification.style.zIndex = '10000'
    } else {
      const sidebar = document.querySelector('nav[aria-label="Chat history"]')

      if (sidebar) {
        const rect = sidebar.getBoundingClientRect()
        notification.style.position = 'fixed'
        notification.style.top = '120px'
        notification.style.left = `${rect.left + 10}px`
        notification.style.maxWidth = `${Math.max(300, rect.width - 20)}px`
        notification.style.zIndex = '10000'
      } else {
        notification.style.position = 'fixed'
        notification.style.top = '120px'
        notification.style.left = '20px'
        notification.style.maxWidth = '320px'
        notification.style.zIndex = '10000'
      }
    }
  }, 800)
}

function setupNotificationEvents(
  notification: HTMLElement,
  duration: number
): void {
  const closeBtn = notification.querySelector(
    '.pinflux-notification-close'
  ) as HTMLElement

  const closeNotification = () => {
    notification.classList.add('hide')
    setTimeout(() => notification.remove(), 300)
  }

  closeBtn?.addEventListener('click', closeNotification)

  // Auto-close with mouse hover pause
  if (duration > 0) {
    let timeoutId: NodeJS.Timeout | null = null
    let remainingTime = duration
    let startTime = Date.now()

    const startTimer = () => {
      startTime = Date.now()
      timeoutId = setTimeout(closeNotification, remainingTime)
    }

    const pauseTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        remainingTime -= Date.now() - startTime
        timeoutId = null
      }
    }

    notification.addEventListener('mouseenter', pauseTimer)
    notification.addEventListener('mouseleave', startTimer)

    // Start initial timer
    startTimer()
  }

  // Close on outside click (but not when hovering over notification)
  document.addEventListener(
    'click',
    e => {
      if (!notification.contains(e.target as Node)) {
        closeNotification()
      }
    },
    { once: true }
  )
}

function getIconSvg(type: string): string {
  switch (type) {
    case 'success':
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
    case 'warning':
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`
    case 'info':
    default:
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
  }
}

function addNotificationStyles(): void {
  if (document.getElementById('pinflux-notification-styles')) {
    return
  }

  const styles = document.createElement('style')
  styles.id = 'pinflux-notification-styles'
  styles.textContent = `
    .pinflux-notification {
      max-width: 320px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      color: #374151;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    
    .pinflux-notification.show {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    
    .pinflux-notification.hide {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    
    .pinflux-notification-content {
      padding: 0;
      position: relative;
    }
    
    .pinflux-notification-content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(135deg, #10b981, #3b82f6);
      border-radius: 0 2px 2px 0;
    }
    
    .pinflux-notification-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 8px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.04), rgba(139, 92, 246, 0.02));
    }
    
    .pinflux-notification-logo {
      width: 18px;
      height: 18px;
      color: #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 4px;
      padding: 2px;
    }
    
    .pinflux-notification-logo svg {
      width: 12px;
      height: 12px;
    }
    
    .pinflux-notification-brand-text {
      font-size: 12px;
      font-weight: 700;
      color: #6366f1;

      letter-spacing: 1px;
      text-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
    }
    
    .pinflux-notification-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px 8px 20px;
    }
    
    .pinflux-notification-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .pinflux-notification-icon svg {
      width: 14px;
      height: 14px;
    }
    
    .pinflux-notification-icon.success {
      background: linear-gradient(135deg, #34d399, #10b981);
      color: white;
    }
    
    .pinflux-notification-title {
      flex: 1;
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
    
    .pinflux-notification-close {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .pinflux-notification-close:hover {
      background: rgba(107, 114, 128, 0.1);
      color: #374151;
    }
    
    .pinflux-notification-message {
      margin: 0;
      font-size: 13px;
      line-height: 1.4;
      color: #6b7280;
      padding: 0 16px 16px 20px;
    }
    
    @media (prefers-color-scheme: dark) {
      .pinflux-notification {
        background: rgba(31, 41, 55, 0.95);
        color: #f9fafb;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .pinflux-notification-brand {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.04));
      }
      
      .pinflux-notification-brand-text {
        color: #a78bfa;
        text-shadow: 0 0 10px rgba(167, 139, 250, 0.3);
      }
      
      .pinflux-notification-logo {
        color: #a78bfa;
        background: rgba(167, 139, 250, 0.15);
      }
      
      .pinflux-notification-title {
        color: #f9fafb;
      }
      
      .pinflux-notification-message {
        color: #d1d5db;
      }
      
      .pinflux-notification-close {
        color: #9ca3af;
      }
      
      .pinflux-notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f9fafb;
      }
    }
  `

  document.head.appendChild(styles)
}
