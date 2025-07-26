import initContentScript from '@/components/pinChats/main'
import initBookmarks from '@/components/chatBookmarks/main'

const urlPatternStrings = ['https://chatgpt.com/*']
const chatPagePattern = new MatchPattern('https://chatgpt.com/c/*')
const urlMatchPatterns = urlPatternStrings.map(p => new MatchPattern(p))

export default defineContentScript({
  matches: urlPatternStrings,
  async main(ctx) {
    await initContentScript()

    if (chatPagePattern.includes(window.location.href)) {
      initBookmarks()
    }

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

        // Prevent repeated initialization of bookmarks
        const bookmarksContainerId = 'chatBookmarksContainer'
        const bookmarksAlreadyInitialized =
          !!document.getElementById(bookmarksContainerId)

        if (chatPagePattern.includes(newUrl) && !bookmarksAlreadyInitialized) {
          try {
            await initBookmarks()
          } catch (err) {
            console.error('Failed to initialize bookmarks:', err)
          }
        }
      } catch (err) {
        console.error('Error in locationchange event handler:', err)
      }
    })
  },
})
