/**
 * Creates a drag handle button with grip icon for pinned chat elements
 * @returns HTMLButtonElement - The drag handle button
 */
export default function createDragHandle(): HTMLButtonElement {
  const dragHandle = document.createElement('button');
  dragHandle.className = 'drag-handle';
  dragHandle.setAttribute('draggable', 'false'); // Prevent the button itself from being draggable
  dragHandle.setAttribute('type', 'button');
  dragHandle.setAttribute('aria-label', 'Drag to reorder');
  dragHandle.title = 'Drag to reorder';
  dragHandle.setAttribute('data-pin-chat-drag-handle', 'true'); // Identifier for our drag system
  
  // Add the grip icon SVG
  dragHandle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-horizontal">
      <circle cx="12" cy="9" r="1"/>
      <circle cx="19" cy="9" r="1"/>
      <circle cx="5" cy="9" r="1"/>
      <circle cx="12" cy="15" r="1"/>
      <circle cx="19" cy="15" r="1"/>
      <circle cx="5" cy="15" r="1"/>
    </svg>
  `;
  
  // Add styles
  Object.assign(dragHandle.style, {
    position: 'absolute',
    left: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(35, 35, 35, 0.92)',
    border: 'none',
    cursor: 'grab',
    opacity: '0',
    transition: 'opacity 0.2s ease',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    zIndex: '10',
    minWidth: '24px',
    minHeight: '24px'
  });
  
  // Add hover effects
  dragHandle.addEventListener('mouseenter', () => {
    dragHandle.style.backgroundColor = 'rgba(35, 35, 35, 0.98)';
    dragHandle.style.cursor = 'grab';
  });
  
  dragHandle.addEventListener('mouseleave', () => {
    dragHandle.style.backgroundColor = 'rgba(35, 35, 35, 0.92)';
  });

  // Change cursor to grabbing when dragging
  dragHandle.addEventListener('mousedown', (e) => {
    dragHandle.style.cursor = 'grabbing';
    // Prevent any other drag systems from interfering
    e.stopPropagation();
  });
  
  dragHandle.addEventListener('mouseup', () => {
    dragHandle.style.cursor = 'grab';
  });

  // Prevent click propagation to avoid triggering other systems
  dragHandle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
  return dragHandle;
}
