// Main script for changelog page
document.addEventListener('DOMContentLoaded', () => {
  setupCloseButton()
  setupAnimations()
  setupVersionInfo()
})

function setupCloseButton() {
  const closeButton = document.getElementById('closeButton')
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      // Try to close the tab, fallback to going back
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.close()
      }
    })
  }
}

function setupAnimations() {
  // Animate version sections on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          element.style.opacity = '1'
          element.style.transform = 'translateY(0)'
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  )

  // Observe all version sections
  document.querySelectorAll('.version-section').forEach((section, index) => {
    const element = section as HTMLElement
    // Initial state for animation
    element.style.opacity = '0'
    element.style.transform = 'translateY(20px)'
    element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`
    
    observer.observe(section)
  })
}

function setupVersionInfo() {
  // Add click tracking for analytics (if needed)
  document.querySelectorAll('.link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href')
    })
  })

  // Add copy version number functionality
  document.querySelectorAll('.version-badge').forEach(badge => {
    badge.addEventListener('click', () => {
      const version = badge.textContent
      if (version) {
        navigator.clipboard?.writeText(version).then(() => {
          // Show temporary tooltip
          showTooltip(badge as HTMLElement, 'Copied!')
        }).catch(() => {
        })
      }
    })
    
    // Add cursor pointer to indicate clickable
    const element = badge as HTMLElement
    element.style.cursor = 'pointer'
    element.title = 'Click to copy version number'
  })
}

function showTooltip(element: HTMLElement, message: string) {
  const tooltip = document.createElement('div')
  tooltip.textContent = message
  tooltip.style.cssText = `
    position: absolute;
    background: #333;
    color: white;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `
  
  element.style.position = 'relative'
  element.appendChild(tooltip)
  
  // Animate in
  setTimeout(() => {
    tooltip.style.opacity = '1'
  }, 10)
  
  // Remove after delay
  setTimeout(() => {
    tooltip.style.opacity = '0'
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip)
      }
    }, 300)
  }, 2000)
}
