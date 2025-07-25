export default defineBackground({
  type: 'module',
  main() {
    browser.runtime.onInstalled.addListener(details => {
      if (details.reason === 'update' && details.previousVersion === '2.0.0') {
        browser.storage.sync.set({ showShortcutsNotification: true })
        browser.action.openPopup()
      }

      if (details.reason === 'update' && details.previousVersion === '2.0.1') {
        browser.storage.sync.set({ showFeatureSurveyNotification: true })
        browser.action.openPopup()
      }
    })

    browser.runtime.onMessage.addListener(message => {
      if (message.action === 'openTab') {
        return browser.tabs.create({ url: message.url })
      }
    })

    browser.commands.onCommand.addListener(async command => {
      if (command === 'pin-current-chat') {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        })

        if (!tab || !tab.id || !tab.url) return
        if (tab.url.includes('chatgpt.com/c')) {
          browser.tabs.sendMessage(tab.id, { action: 'pin-current-chat' })
        }
      }
    })
  },
})
