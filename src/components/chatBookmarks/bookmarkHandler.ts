import addBookmarkButtonHtml from './add-bookmark-button.html?raw'
import removeBookmarkButtonHtml from './remove-bookmark-button.html?raw'
import saveBookmark from './saveBookmark'
import deleteBookmark from './deleteBookmark'
import updateBookmarkName from './updateBookmarkName'
import replaceBookmarkButton from './replaceBookmarkButton'
import getConversationBookmarksIds from './getConversationBookmarksIds'
import getProfileId from '../utils/getProfileId'

export default async function handleBookmarkButtonClick(event: MouseEvent) {
  try {
    const button = (event.target as HTMLElement).closest(
      '[data-bookmark-button]'
    )
    if (!button) return

    // Find the section - it's now inside the container
    const container = button.parentElement
    if (!container) return
    
    const section = container.querySelector('.bookmark-section')
    if (!section) return

    // Get the section ID from the button or from the section's ID
    const sectionId = button.getAttribute('data-section-id') || section.id
    if (!sectionId) return

    const profileId = await getProfileId()
    // Robust extraction of conversationId from pathname (e.g., /c/{conversationId})
    const path = window.location.pathname.replace(/\/+$/, '')
    let conversationId = ''
    const match = path.match(/\/c\/([\w-]+)/)
    if (match) {
      conversationId = match[1] ?? ''
    }
    if (!conversationId) {
      console.warn(
        '[handleBookmarkButtonClick] Missing conversationId, aborting.'
      )
      return null
    }

    const bookmarkIds = await getConversationBookmarksIds(
      profileId,
      conversationId
    )

    const isCurrentlyBookmarked = bookmarkIds.includes(sectionId)

    if (isCurrentlyBookmarked) {
      await deleteBookmark({ articleId: sectionId, profileId, conversationId })
      replaceBookmarkButton(section, addBookmarkButtonHtml)
      // Dispatch event to update indicator
      document.dispatchEvent(new CustomEvent('bookmarksChanged'))
    } else {
      // Initial save without custom name
      await saveBookmark({ articleId: sectionId, profileId, conversationId })
      replaceBookmarkButton(section, removeBookmarkButtonHtml)
      // Dispatch event to update indicator
      document.dispatchEvent(new CustomEvent('bookmarksChanged'))
      
      // Show floating input field for name change
      showFloatingBookmarkInput(container, sectionId, profileId, conversationId)
    }
  } catch (error) {
    console.error('Failed to handle bookmark button click:', error)
  }
}

function showFloatingBookmarkInput(
  container: Element,
  sectionId: string, 
  profileId: string, 
  conversationId: string
) {
  // Ensure no modal already exists
  const existingModals = document.querySelectorAll('.bookmark-modal-overlay')
  existingModals.forEach(modal => modal.remove())

  // Create the modal in JavaScript instead of HTML
  const modalOverlay = document.createElement('div')
  modalOverlay.className = 'bookmark-modal-overlay'
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.3);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  const inputContainer = document.createElement('div')
  // Theme-aware classes from themeStyles.ts: `dark:` utilities don't apply in
  // the Oct 2026 app shell
  inputContainer.className = 'bookmark-name-input-container pf-dialog'

  inputContainer.innerHTML = `
    <div>
      <h3 class="pf-dialog-title">Add Bookmark</h3>
      <label class="pf-dialog-label">
        Bookmark name (optional)
      </label>
      <input
        type="text"
        class="bookmark-name-input pf-input"
        placeholder="Enter bookmark name"
        maxlength="100"
      />
    </div>
    <div class="pf-dialog-actions">
      <button
        type="button"
        class="bookmark-name-cancel pf-btn"
      >
        Cancel
      </button>
      <button
        type="button"
        class="bookmark-name-save pf-btn pf-btn-primary"
      >
        Save
      </button>
    </div>
  `

  modalOverlay.appendChild(inputContainer)
  document.body.appendChild(modalOverlay)

  // Now find the elements that we know exist
  const input = inputContainer.querySelector('.bookmark-name-input') as HTMLInputElement
  const cancelBtn = inputContainer.querySelector('.bookmark-name-cancel') as HTMLButtonElement
  const saveBtn = inputContainer.querySelector('.bookmark-name-save') as HTMLButtonElement

  if (!input || !cancelBtn || !saveBtn) {
    console.error('Modal elements not found after creation')
    return
  }

  // Focus on the input
  setTimeout(() => input.focus(), 50)

  // Function to close the modal
  const closeInput = () => {
    modalOverlay.remove()
    cleanup()
  }

  // Function to save
  const saveBookmarkName = async () => {
    const customName = input.value.trim()
    if (customName) {
      try {
        await updateBookmarkName({ 
          articleId: sectionId, 
          profileId, 
          conversationId, 
          customName 
        })
      } catch (error) {
        console.error('Error updating bookmark name:', error)
      }
    }
    closeInput()
  }

  // Temporary listeners
  const handleCancel = () => closeInput()
  const handleSave = () => saveBookmarkName()
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveBookmarkName()
    } else if (e.key === 'Escape') {
      closeInput()
    }
  }
  const handleOverlayClick = (e: Event) => {
    if (e.target === modalOverlay) {
      closeInput()
    }
  }

  // Add listeners
  cancelBtn.addEventListener('click', handleCancel)
  saveBtn.addEventListener('click', handleSave)
  input.addEventListener('keydown', handleKeyDown)
  modalOverlay.addEventListener('click', handleOverlayClick)

  // Function to clean up listeners
  const cleanup = () => {
    cancelBtn.removeEventListener('click', handleCancel)
    saveBtn.removeEventListener('click', handleSave)
    input.removeEventListener('keydown', handleKeyDown)
    modalOverlay.removeEventListener('click', handleOverlayClick)
  }
}
