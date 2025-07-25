function createShortcutSettingsLink() {
  const container = document.createElement('div')
  container.style.marginTop = '1rem'

  const paragraph = document.createElement('p')
  paragraph.textContent = browser.i18n.getMessage(
    'shortcutSettingsParagraphText'
  )

  const shortcutsLink = document.createElement('button')
  shortcutsLink.className = 'button-link'
  shortcutsLink.textContent = browser.i18n.getMessage(
    'shortcutSettingsLinkText'
  )

  shortcutsLink.addEventListener(
    'click',
    async () => await openTab('chrome://extensions/shortcuts')
  )

  paragraph.appendChild(shortcutsLink)
  paragraph.appendChild(document.createTextNode('.'))

  container.appendChild(paragraph)

  return container
}

const optionsTitle = document.getElementById('optionsTitle')
const optionsDescription = document.getElementById('optionsDescription')
const container = document.getElementById('shortcut-link-container')
if (container) {
  container.appendChild(createShortcutSettingsLink())
}

if (optionsTitle) {
  optionsTitle.textContent = browser.i18n.getMessage('optionsTitle')
}

if (optionsDescription) {
  optionsDescription.textContent = browser.i18n.getMessage('optionsDescription')
}

async function openTab(url: string): Promise<void> {
  await browser.tabs.create({ url })
}
