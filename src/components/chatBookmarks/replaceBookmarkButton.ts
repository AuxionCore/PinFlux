export default function replaceBookmarkButton(section: Element, newHtml: string) {
  console.log('replaceBookmarkButton called with:', section, newHtml)
  // החיפוש נעשה ב-container (האלמנט ההורה)
  const container = section.parentElement
  if (!container) {
    console.log('No container found')
    return
  }
  
  const oldButton = container.querySelector('[data-bookmark-button]')
  if (oldButton) {
    console.log('Removing old button:', oldButton)
    oldButton.remove()
  }
  
  console.log('Adding new button to container:', container)
  container.insertAdjacentHTML('beforeend', newHtml)
  
  // צריך להוסיף את הattributes לכפתור החדש
  const newButton = container.querySelector('[data-bookmark-button]:last-child') as HTMLElement
  if (newButton && section.id) {
    newButton.setAttribute('data-section-id', section.id)
    console.log('Added data-section-id to new button:', section.id)
  }
}