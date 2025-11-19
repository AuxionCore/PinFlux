import initContentScript from '@/components/pinChats/main'
import initBookmarks from '@/components/chatBookmarks/main'
import getProfileId from '@/components/utils/getProfileId'
import bumpBookmarkGroupTimestamp from '@/components/chatBookmarks/bumpBookmarkGroupTimestamp'
import { tutorialManager } from '@/components/tutorial/tutorialManager'
import '@/components/tutorial/tutorialAPI' // Load API for debugging

/**
 * URL patterns that the content script should match against
 */
const urlPatternStrings = ['https://chatgpt.com/*']
const chatPagePattern = new MatchPattern('https://chatgpt.com/c/*')
const projectChatPattern = new MatchPattern('https://chatgpt.com/g/g-p-*/c/*')
const urlMatchPatterns = urlPatternStrings.map(p => new MatchPattern(p))

/**
 * Waits for both profile ID and conversation ID to be available
 * @param maxRetries - Maximum number of retry attempts
 * @param delayMs - Delay between retry attempts in milliseconds
 * @returns Promise that resolves to profile and conversation IDs or null if not found
 */
async function waitForProfileAndConversationId(
  maxRetries = 10,
  delayMs = 300
): Promise<{ profileId: string; conversationId: string } | null> {
  for (let i = 0; i < maxRetries; i++) {
    const profileId = await getProfileId()
    const path = window.location.pathname.replace(/\/+$/, '')
    const segments = path.split('/').filter(Boolean)
    
    // Support two URL patterns:
    // 1. Regular chat: /c/{conversationId}
    // 2. Project chat: /g/g-p-{projectId}/c/{conversationId}
    let conversationId = ''
    
    if (segments.length >= 2 && segments[segments.length - 2] === 'c') {
      // Regular chat or project chat - conversationId is always after 'c'
      conversationId = segments[segments.length - 1]
    }

    // Validate conversationId: for example, must be a 32+ char hex string (adjust as needed)
    const isValidConversationId = /^[a-zA-Z0-9_-]{16,}$/.test(conversationId)

    if (profileId && isValidConversationId) {
      return { profileId, conversationId }
    }

    console.warn(
      `[WARN] Missing or invalid IDs, retrying... (${i + 1}/${maxRetries})`
    )
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }

  console.error(
    '[ERROR] Failed to get valid profileId and conversationId after retries.'
  )
  return null
}

/**
 * Main content script definition for the PinFlux extension
 * Handles initialization of pin chats and bookmarks features
 */
export default defineContentScript({
  matches: urlPatternStrings,
  async main(ctx) {
    try {
      // Set up message listener for tutorial actions
      browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'start-tutorial') {
          // Start tutorial with specified feature or from beginning
          tutorialManager.startTutorial(message.featureId, true)
          sendResponse({ success: true })
        } else if (message.action === 'check-pinned-chats') {
          // Check if there are any pinned chats
          const pinnedChatsContainer = document.querySelector('#chatListContainer')
          const pinnedChats = pinnedChatsContainer?.querySelectorAll('a[href*="/c/"]')
          const hasPinnedChats = pinnedChats && pinnedChats.length > 0
          sendResponse({ hasPinnedChats })
        }
        return true // Indicates we'll respond asynchronously
      })

      // Initialize the main pin chats functionality
      await initContentScript()

      // Expose tutorial manager for debugging (development only)
      if (import.meta.env.DEV) {
        (window as any).pinfluxTutorial = tutorialManager
      }

      // Check if tutorial should auto-start for new users
      setTimeout(async () => {
        const shouldAutoStart = await tutorialManager.shouldAutoStart()
        if (shouldAutoStart) {
          // Wait a bit more for the UI to fully load
          setTimeout(() => {
            tutorialManager.startTutorial()
          }, 2000)
        }
      }, 1000)

      // Initialize bookmarks on initial entry to chat page
      if (chatPagePattern.includes(window.location.href) || projectChatPattern.includes(window.location.href)) {
        const result = await waitForProfileAndConversationId()
        if (result) {
          const { profileId, conversationId } = result
          await bumpBookmarkGroupTimestamp(profileId, conversationId)
          await initBookmarks({ profileId, conversationId })
        }
      }

      // Listen for navigation changes within the SPA
      ctx.addEventListener(window, 'wxt:locationchange', async ({ newUrl }) => {
        try {
          // Re-initialize pin chats if container doesn't exist
          if (urlMatchPatterns.some(pattern => pattern.includes(newUrl))) {
            const pinnedContainer = document.querySelector(
              '#chatListContainer'
            ) as HTMLOListElement
            if (!pinnedContainer) {
              try {
                await initContentScript()
              } catch (err) {
                console.error('Failed to initialize content script:', err)
              }
            }
          }

          // Initialize bookmarks when navigating to a chat page
          if (chatPagePattern.includes(newUrl) || projectChatPattern.includes(newUrl)) {
            try {
              const result = await waitForProfileAndConversationId()
              if (!result) return

              const { profileId, conversationId } = result

              // Update bookmark group timestamp and initialize bookmarks
              await bumpBookmarkGroupTimestamp(profileId, conversationId)
              await initBookmarks({ profileId, conversationId })
            } catch (err) {
              console.error('Failed to initialize bookmarks:', err)
            }
          }
        } catch (err) {
          console.error('Error in locationchange event handler:', err)
        }
      })
    } catch (err) {
      console.error(err)
    }
  },
})
