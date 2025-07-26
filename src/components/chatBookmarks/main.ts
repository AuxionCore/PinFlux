import addBookmarkButtonHtml from './add-bookmark-button.html?raw'

const MAX_RETRIES = 10
let retryCount = 0

export default function initBookmarks() {
  const articles = document.querySelectorAll('article')

  if (!articles || articles.length === 0) {
    if (retryCount < MAX_RETRIES) {
      retryCount++
      setTimeout(initBookmarks, 1000)
    } else {
      console.warn(
        'initBookmarks: Maximum retry limit reached. Articles not found.'
      )
    }
    return
  }

  retryCount = 0 // Reset on success
  articles.forEach(article => {
    article.classList.add('relative')
    // Prevent duplicate bookmark buttons
    if (!article.querySelector('[data-bookmark-button]')) {
      article.insertAdjacentHTML('beforeend', addBookmarkButtonHtml)
    }
  })
}
