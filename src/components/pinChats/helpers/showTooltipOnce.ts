export function showTooltipOnce() {
  const tooltip = document.createElement('div')
  const tooltipTitle = document.createElement('strong')
  const tooltipBody = document.createElement('p')
  tooltipTitle.textContent = browser.i18n.getMessage(
    'pinShortcutNotificationTitle'
  )
  tooltipBody.textContent = browser.i18n.getMessage(
    'pinShortcutNotificationMessage',
    ['Alt+Shift+P']
  )

  Object.assign(tooltip.style, {
    backgroundColor: '#333',
    padding: '10px 15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    zIndex: '9999',
    maxWidth: '300px',
    lineHeight: '1.5',
  })

  Object.assign(tooltipTitle.style, {
    color: '#fff',
    fontSize: '16px',
    marginBottom: '5px',
  })

  Object.assign(tooltipBody.style, {
    color: '#ccc',
    fontSize: '14px',
    margin: '0',
  })

  tooltip.appendChild(tooltipTitle)
  tooltip.appendChild(tooltipBody)
  document.body.appendChild(tooltip)

  setTimeout(() => {
    tooltip.style.transition = 'opacity 0.5s'
    tooltip.style.opacity = '0'
    setTimeout(() => tooltip.remove(), 500)
  }, 10000)
}

export function showPinShortcutTooltip() {
  const tooltip = document.createElement('div')
  const tooltipTitle = document.createElement('strong')
  const tooltipBody = document.createElement('p')
  tooltipTitle.textContent = browser.i18n.getMessage(
    'pinShortcutNotificationTitle'
  )
  tooltipBody.textContent = browser.i18n.getMessage(
    'pinShortcutNotificationMessage',
    ['Alt+Shift+P']
  )

  Object.assign(tooltip.style, {
    backgroundColor: '#333',
    margin: '10px auto',
    padding: '10px 15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    zIndex: '9999',
    maxWidth: '300px',
    lineHeight: '1.5',
  })

  Object.assign(tooltipTitle.style, {
    color: '#fff',
    fontSize: '16px',
    marginBottom: '5px',
  })

  Object.assign(tooltipBody.style, {
    color: '#ccc',
    fontSize: '14px',
    margin: '0',
  })

  tooltip.appendChild(tooltipTitle)
  tooltip.appendChild(tooltipBody)
  const toastContainer = document.getElementById('toastContainer')

  toastContainer?.appendChild(tooltip)

  // setTimeout(() => {
  //   tooltip.style.transition = "opacity 0.5s";
  //   tooltip.style.opacity = "0";
  //   setTimeout(() => tooltip.remove(), 500);
  // }, 10000);
}

async function openTab(url: string) {
  await browser.runtime.sendMessage({
    action: 'openTab',
    url: url,
  })
}

export async function showFeatureSurveyNotification() {
  const notification = document.createElement('div')
  const notificationTitle = document.createElement('strong')
  const notificationBody = document.createElement('p')
  const notificationLink = document.createElement('a')

  notificationTitle.textContent = browser.i18n.getMessage(
    'featureSurveyNotificationTitle'
  )
  notificationBody.textContent = browser.i18n.getMessage(
    'featureSurveyNotificationMessage'
  )
  notificationLink.textContent = browser.i18n.getMessage(
    'featureSurveyNotificationLinkText'
  )

  Object.assign(notification.style, {
    backgroundColor: '#262727ff',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    maxWidth: '300px',
    color: '#fff',
    fontSize: '14px',
    lineHeight: '1.5',
  })

  Object.assign(notificationTitle.style, {
    display: 'block',
    marginBottom: '5px',
  })

  Object.assign(notificationBody.style, {
    marginBottom: '10px',
  })

  Object.assign(notificationLink.style, {
    width: 'fit-content',
    color: '#171818ff',
    textDecoration: 'none',
    cursor: 'pointer',
    border: '1px solid #FFF',
    backgroundColor: '#f0f0f0',
    padding: '5px 10px',
    borderRadius: '6px',
    transition: 'background-color 0.3s',
  })

  notification.appendChild(notificationTitle)
  notification.appendChild(notificationBody)
  notification.appendChild(notificationLink)

  const toastContainer = document.getElementById('toastContainer')
  toastContainer?.appendChild(notification)

  notificationLink.addEventListener('click', async event => {
    event.preventDefault()
    const surveyUrl = 'https://forms.gle/qarzsbTLbyeBUQFv8'
    await openTab(surveyUrl)
  })

  // setTimeout(() => {
  //   notification.style.transition = 'opacity 0.5s'
  //   notification.style.opacity = '0'
  //   setTimeout(() => notification.remove(), 500)
  // }, 10000)
}
