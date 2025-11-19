import {
  showFeatureSurveyNotification,
  showPinShortcutTooltip,
} from '@/components/pinChats/helpers/showTooltipOnce'

const elements = {
  closePopup: 'closePopup',
  errorToast: 'errorToast',
  errorToastTitle: 'errorToastTitle',
  errorToastMessage: 'errorToastMessage',
  closeErrorToastButton: 'closeErrorToastButton',
  newReleaseToast: 'newReleaseToast',
  newReleaseToastTitle: 'newReleaseToastTitle',
  newReleaseToastMessage: 'newReleaseToastMessage',
  newReleaseToastLink: 'newReleaseToastLink',
  closeNewReleaseToastButton: 'closeNewReleaseToastButton',
  authorLink: 'authorLink',
  buyMeACoffee: 'buyMeACoffee',
  versionLink: 'versionLink',
  feedbackLink: 'feedbackLink',
  rateUsLink: 'rateUsLink',
  rateUsLinkText: 'rateUsLinkText',
  startTutorialBtn: 'startTutorialBtn',
}

async function popupScript() {
  try {
    const newReleaseTitle = browser.i18n.getMessage('newReleaseTitle')
    const versionNumber = browser.runtime.getManifest().version
    const extensionWasUpdated = browser.i18n.getMessage('extensionWasUpdated', [
      versionNumber,
      `🎉`,
    ])
    const storageData = await browser.storage.sync.get([
      'showWhatsNewToast',
      'showErrorToast',
    ])
    const showWhatsNewToast = storageData?.showWhatsNewToast
    const showErrorToast = storageData?.showErrorToast

    async function setupPopup() {
      setClosePopupButton()
      setGeneralEventListeners()
      setupTutorialButton()
      if (import.meta.env.CHROME) {
        setBrowserSpecificEventListeners()
        setFeedbackLink()
        setRateUsLinkText()
      }
      setVersion()
      if (showErrorToast) await setErrorToast()
      if (showWhatsNewToast) await setWhatsNewToast()
      
      // Don't show "New Feature" notification during tutorial
      await checkAndHideNewFeatureNotification()
    }
    
    async function checkAndHideNewFeatureNotification() {
      try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
        if (!tab?.id) return
        
        const response = await browser.tabs.sendMessage(tab.id, { action: 'is-tutorial-active' })
        if (response?.isActive) {
          // Hide the "New Feature" notification if tutorial is active
          const newFeatureToast = document.querySelector('[data-new-feature-toast]')
          if (newFeatureToast) {
            (newFeatureToast as HTMLElement).style.display = 'none'
          }
        }
      } catch (error) {
        // Ignore errors (e.g., if tab is not a ChatGPT page)
      }
    }

    const shortcutsNotification = await browser.storage.sync.get(
      'showShortcutsNotification'
    )
    const featureSurveyNotification = await browser.storage.sync.get(
      'showFeatureSurveyNotification'
    )

    if (shortcutsNotification.showShortcutsNotification) {
      showPinShortcutTooltip()

      // browser.storage.sync.set({
      //   showShortcutsNotification: false,
      // })
    }

    if (featureSurveyNotification.showFeatureSurveyNotification) {
      showFeatureSurveyNotification()

      // browser.storage.sync.set({
      //   showFeatureSurveyNotification: false,
      // })
    }

    async function setWhatsNewToast() {
      const newReleaseToast = document.getElementById(elements.newReleaseToast)!
      const closeToastButton = document.getElementById(
        elements.closeNewReleaseToastButton
      )!
      const newReleaseToastTitle = document.getElementById(
        elements.newReleaseToastTitle
      )!
      const newReleaseToastMessage = document.getElementById(
        elements.newReleaseToastMessage
      )!
      const newReleaseToastLink = document.getElementById(
        elements.newReleaseToastLink
      )!

      newReleaseToastTitle.textContent = newReleaseTitle
      newReleaseToastMessage.textContent = extensionWasUpdated

      newReleaseToast.classList.add('show')
      newReleaseToastLink.addEventListener(
        'click',
        async () => await openTab('whatsNewPage.html')
      )

      closeToastButton.addEventListener('click', async () => {
        newReleaseToast.classList.remove('show')
        await browser.runtime.sendMessage({
          action: 'closeToast',
          type: 'whatsNew',
        })
      })
    }

    async function setErrorToast() {
      const errorToast = document.getElementById(elements.errorToast)!
      const closeToastButton = document.getElementById(
        elements.closeErrorToastButton
      )!
      const errorToastTitle = document.getElementById(elements.errorToastTitle)!
      const errorToastMessage = document.getElementById(
        elements.errorToastMessage
      )!
      const storageData = await browser.storage.sync.get('errorToastMessage')
      const errorToastMessageText = storageData.errorToastMessage

      errorToastTitle.textContent =
        browser.i18n.getMessage('errorToastTitle') || 'Error Alert'
      errorToastMessage.textContent = errorToastMessageText

      errorToast.classList.add('show')
      closeToastButton.addEventListener('click', async () => {
        errorToast.classList.remove('show')
        await browser.runtime.sendMessage({
          action: 'closeToast',
          type: 'error',
        })
      })
    }

    function setClosePopupButton() {
      const closePopup = document.getElementById(elements.closePopup)!
      closePopup.setAttribute(
        'title',
        browser.i18n.getMessage('popupCloseButton')
      )
      closePopup.addEventListener('click', () => window.close())
    }

    function setGeneralEventListeners() {
      const links = [
        { id: elements.authorLink, url: 'https://github.com/Yedidya10' },
        {
          id: elements.buyMeACoffee,
          url: 'https://ko-fi.com/yedidyadev',
        },
        {
          id: elements.versionLink,
          url: import.meta.env.CHROME
            ? `changelog.html`
            : import.meta.env.FIREFOX
            ? `changelog.html`
            : 'changelog.html',
        },
      ]

      links.forEach(link => {
        const element = document.getElementById(link.id)!
        element.addEventListener('click', async () => {
          await openTab(link.url)
        })
      })
    }

    function setBrowserSpecificEventListeners() {
      const extensionId = browser.runtime.id
      const links = [
        {
          id: elements.feedbackLink,
          url: import.meta.env.CHROME
            ? `https://chromewebstore.google.com/detail/pinflux-pin-chatgpt-chats/${extensionId}/support`
            : import.meta.env.FIREFOX
            ? `https://addons.mozilla.org/en-US/firefox/addon/rtlify-gpt/`
            : '',
        },
        {
          id: elements.rateUsLink,
          url: import.meta.env.CHROME
            ? `https://chromewebstore.google.com/detail/pinflux-pin-chatgpt-chats/${extensionId}/reviews`
            : import.meta.env.FIREFOX
            ? `https://addons.mozilla.org/en-US/firefox/addon/pinflux/`
            : '',
        },
      ]

      links.forEach(link => {
        const element = document.getElementById(link.id)!
        element.addEventListener('click', async () => {
          await openTab(link.url)
        })
      })
    }

    function setFeedbackLink() {
      const feedbackLink = document.getElementById(elements.feedbackLink)!
      const feedbackText = browser.i18n.getMessage('feedbackTitle')
      const bagReportText = browser.i18n.getMessage('bugReportTitle')
      feedbackLink.title = `${feedbackText} / ${bagReportText}`
    }

    function setVersion() {
      const versionElement = document.getElementById(elements.versionLink)!
      versionElement.textContent = `v${versionNumber}`
    }

    function setRateUsLinkText() {
      const rateUsLink = document.getElementById(elements.rateUsLink)!
      const rateUsTitle = browser.i18n.getMessage('rateUsTitle', [
        import.meta.env.CHROME
          ? 'Chrome'
          : import.meta.env.FIREFOX
          ? 'Firefox'
          : 'Browser',
      ])
      rateUsLink.title = rateUsTitle
    }

    async function setupTutorialButton() {
      const tutorialBtn = document.getElementById(elements.startTutorialBtn)
      if (!tutorialBtn) return

      // Check if there are any pinned chats
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true })
        if (tabs[0]?.id) {
          const response = await browser.tabs.sendMessage(tabs[0].id, {
            action: 'check-pinned-chats'
          })
          
          // If there are pinned chats, hide the tutorial button
          if (response && response.hasPinnedChats) {
            const tutorialSection = tutorialBtn.closest('.tutorial-section') as HTMLElement
            if (tutorialSection) {
              tutorialSection.style.display = 'none'
            }
            return
          }
        }
      } catch (error) {
        // If we can't check (e.g., not on ChatGPT), keep the button visible
        console.log('Could not check for pinned chats:', error)
      }

      // Set button text
      const buttonText = tutorialBtn.querySelector('span')
      if (buttonText) {
        buttonText.textContent = browser.i18n.getMessage('tutorialStartButton') || 'Start Tutorial'
      }

      tutorialBtn.addEventListener('click', async () => {
        try {
          // Send message to content script to start tutorial
          const tabs = await browser.tabs.query({ active: true, currentWindow: true })
          if (tabs[0]?.id) {
            await browser.tabs.sendMessage(tabs[0].id, {
              action: 'start-tutorial',
              featureId: undefined // Start from beginning
            })
            // Close popup after starting tutorial
            window.close()
          }
        } catch (error) {
          console.error('Failed to start tutorial:', error)
        }
      })
    }

    async function openTab(url: string): Promise<void> {
      await browser.tabs.create({ url })
    }

    await setupPopup()
  } catch (error) {
    console.error('Error in popup script:', error)
  }
}
popupScript()
