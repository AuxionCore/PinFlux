export default function replaceBookmarkButton(section: Element, newHtml: string) {
  // החיפוש נעשה ב-container (האלמנט ההורה)
  const container = section.parentElement
  if (!container) return
  
  const oldButton = container.querySelector('[data-bookmark-button]')
  if (oldButton) oldButton.remove()
  container.insertAdjacentHTML('beforeend', newHtml)
}