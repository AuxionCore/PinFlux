import initContentScript from '@/components/pinChats/main'
import initBookmarks from '@/components/chatBookmarks/main'
import getProfileId from '@/components/utils/getProfileId'
import bumpBookmarkGroupTimestamp from '@/components/chatBookmarks/bumpBookmarkGroupTimestamp'

const urlPatternStrings = ['https://chatgpt.com/*']
const chatPagePattern = new MatchPattern('https://chatgpt.com/c/*')
const urlMatchPatterns = urlPatternStrings.map(p => new MatchPattern(p))

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

export default defineContentScript({
  matches: urlPatternStrings,
  async main(ctx) {
    try {
      await initContentScript()

      // if (chatPagePattern.includes(window.location.href)) {
      //   const result = await waitForProfileAndConversationId()
      //   if (!result) return

      //   const { profileId, conversationId } = result

      //   await bumpBookmarkGroupTimestamp(profileId, conversationId)
      //   await initBookmarks({ profileId, conversationId })
      // }

      ctx.addEventListener(window, 'wxt:locationchange', async ({ newUrl }) => {
        try {
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

          if (chatPagePattern.includes(newUrl)) {
            try {
              const result = await waitForProfileAndConversationId()
              if (!result) return

              const { profileId, conversationId } = result

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
