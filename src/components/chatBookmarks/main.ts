import addBookmarkButtonHtml from './add-bookmark-button.html?raw'

export default function initBookmarks() {
  const articles = document.querySelectorAll('article')

  if (!articles || articles.length === 0) {
    setTimeout(initBookmarks, 1000)
    return
  }

  articles.forEach(article => {
    article.classList.add('relative')
    article.insertAdjacentHTML('beforeend', addBookmarkButtonHtml)
  })
}
