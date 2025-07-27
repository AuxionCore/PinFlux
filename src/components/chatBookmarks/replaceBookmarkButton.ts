export default function replaceBookmarkButton(article: Element, newHtml: string) {
  const oldButton = article.querySelector('[data-bookmark-button]')
  if (oldButton) oldButton.remove()
  article.insertAdjacentHTML('beforeend', newHtml)
}