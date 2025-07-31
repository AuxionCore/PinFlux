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
      conversationId = match[1]
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
    } else {
      // Initial save without custom name
      await saveBookmark({ articleId: sectionId, profileId, conversationId })
      replaceBookmarkButton(section, removeBookmarkButtonHtml)
      
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
  inputContainer.className = 'bookmark-name-input-container bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 w-80 max-w-sm mx-4 border-2 border-gray-200 dark:border-gray-600'

  inputContainer.innerHTML = `
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Add Bookmark</h3>
      <label class="block text-sm text-gray-700 dark:text-gray-300 mb-2">
        Bookmark name (optional)
      </label>
      <input
        type="text"
        class="bookmark-name-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        placeholder="Enter bookmark name"
        maxlength="100"
      />
    </div>
    <div class="flex justify-end gap-3">
      <button
        type="button"
        class="bookmark-name-cancel px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Cancel
      </button>
      <button
        type="button"
        class="bookmark-name-save px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
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
