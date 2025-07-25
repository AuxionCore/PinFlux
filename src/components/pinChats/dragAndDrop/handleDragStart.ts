import createDraggableDisplay from './createDraggableDisplay'

export default function handleDragStart(event: DragEvent): void {
  const target = event.target as HTMLAnchorElement
  const chatLink = target?.outerHTML || ''
  event.dataTransfer?.setData('text/plain', chatLink)

  if (!target.id) {
    const pinnedChats = document.querySelector(
      '#chatListContainer'
    ) as HTMLDivElement

    const scrollTop = pinnedChats.scrollTop
    const draggableDisplay = createDraggableDisplay('Drag here to pin')

    draggableDisplay.style.position = 'absolute'
    draggableDisplay.style.top = `${scrollTop}px`
    draggableDisplay.style.left = '0'
    draggableDisplay.style.width = '100%'
    draggableDisplay.style.height = `${pinnedChats.clientHeight}px`
    draggableDisplay.style.pointerEvents = 'none' // Prevent interaction with the draggable display

    pinnedChats.appendChild(draggableDisplay)

    if (pinnedChats.offsetHeight < 70) {
      requestAnimationFrame(() => {
        pinnedChats.style.height = '70px'
        pinnedChats.style.transition = 'height 0.3s'
        pinnedChats.style.borderStyle = 'dashed'
      })
    }

    const updatePosition = () => {
      draggableDisplay.style.top = `${pinnedChats.scrollTop}px`
    }

    pinnedChats.addEventListener('scroll', updatePosition)

    const cleanup = () => {
      document.getElementById('draggableDisplay')?.remove()
      pinnedChats.removeEventListener('scroll', updatePosition)
      event.target?.removeEventListener('dragend', cleanup)
    }
    event.target?.addEventListener('dragend', cleanup)
  }
}
