import initContentScript from '@/components/pinChats/main'
import initBookmarks from '@/components/chatBookmarks/main'
import getProfileId from '@/components/utils/getProfileId'
import bumpBookmarkGroupTimestamp from '@/components/chatBookmarks/bumpBookmarkGroupTimestamp'

/**
 * URL patterns that the content script should match against
 */
const urlPatternStrings = ['https://chatgpt.com/*']
const chatPagePattern = new MatchPattern('https://chatgpt.com/c/*')
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
    // Expecting /c/{conversationId} as the last two segments
    let conversationId = ''
    if (segments.length >= 2 && segments[segments.length - 2] === 'c') {
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
      // Initialize the main pin chats functionality
      await initContentScript()

      // Initialize bookmarks on initial entry to chat page
      if (chatPagePattern.includes(window.location.href)) {
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
          if (chatPagePattern.includes(newUrl)) {
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
