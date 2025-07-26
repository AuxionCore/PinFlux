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
      if (urlMatchPatterns.some(pattern => pattern.includes(newUrl))) {
        const pinnedContainer = document.querySelector(
          '#chatListContainer'
        ) as HTMLOListElement
        if (!pinnedContainer) {
          await initContentScript()
        }
      }

      if (chatPagePattern.includes(newUrl)) {
        initBookmarks()
      }
    })
  },
})
