export default function replaceBookmarkButton(section: Element, newHtml: string) {
  // Search is done in container (parent element)
  const container = section.parentElement
  if (!container) return
  
  const oldButton = container.querySelector('[data-bookmark-button]')
  if (oldButton) oldButton.remove()
  
  container.insertAdjacentHTML('beforeend', newHtml)
  
  // Need to add attributes to the new button
  const newButton = container.querySelector('[data-bookmark-button]:last-child') as HTMLElement
  if (newButton && section.id) {
    newButton.setAttribute('data-section-id', section.id)
  }
}