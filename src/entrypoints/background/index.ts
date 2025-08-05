/**
 * Background script for the PinFlux extension
 * Handles extension installation/update events, message passing, and keyboard commands
 */
export default defineBackground({
  type: 'module',
  main() {
    // Handle extension installation and updates
    browser.runtime.onInstalled.addListener(async details => {
      // Show shortcuts notification after updating from version 2.0.0
      if (details.reason === 'update' && details.previousVersion === '2.0.0') {
        browser.storage.sync.set({ showShortcutsNotification: true })
        browser.action.openPopup()
      }

      // Show feature survey notification after updating from version 2.0.1
      if (details.reason === 'update') {
        const showFeatureSurveyNotification = await browser.storage.sync.get(
          'showFeatureSurveyNotification'
        )
        if (!showFeatureSurveyNotification) {
          browser.action.openPopup()
        }

        browser.storage.sync.set({ showFeatureSurveyNotification: true })
      }
    })

    // Handle messages from content scripts and popup
    browser.runtime.onMessage.addListener(message => {
      if (message.action === 'openTab') {
        return browser.tabs.create({ url: message.url })
      }
    })

    // Handle keyboard shortcuts
    browser.commands.onCommand.addListener(async command => {
      if (command === 'pin-current-chat') {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        })

        // Only pin if we're on a ChatGPT conversation page
        if (!tab || !tab.id || !tab.url) return
        if (tab.url.includes('chatgpt.com/c')) {
          browser.tabs.sendMessage(tab.id, { action: 'pin-current-chat' })
        }
      }
    })
  },
})
