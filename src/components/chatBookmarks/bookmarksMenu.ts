import bookmarksMenuButtonHtml from './bookmarks-menu-button.html?raw'
import bookmarksDropdownHtml from './bookmarks-dropdown.html?raw'
import bookmarkItemHtml from './bookmark-item.html?raw'
import bookmarkNamePopupHtml from './bookmark-name-popup.html?raw'
import addBookmarkButtonHtml from './add-bookmark-button.html?raw'
import getBookmarksData from './getBookmarksData'
import getProfileId from '../utils/getProfileId'
import deleteBookmark from './deleteBookmark'
import updateBookmarkName from './updateBookmarkName'
import replaceBookmarkButton from './replaceBookmarkButton'

let isMenuInitialized = false

// Function to update the bookmark indicator
async function updateBookmarkIndicator() {
  const icon = document.querySelector('[data-bookmarks-icon]') as SVGElement
  if (!icon) return

  try {
    const profileId = await getProfileId()
    const path = window.location.pathname.replace(/\/+$/, '')
    let conversationId = ''
    const match = path.match(/\/c\/([\w-]+)/)
    if (match) {
      conversationId = match[1]
    }

    if (!conversationId) {
      icon.setAttribute('fill', 'none')
      icon.setAttribute('stroke', 'currentColor')
      return
    }

    const bookmarksData = await getBookmarksData(profileId, conversationId)
    
    if (bookmarksData.length > 0) {
      // Filled when there are bookmarks
      icon.setAttribute('stroke', 'currentColor')
      icon.setAttribute('fill', 'currentColor')
    } else {
      // Outline only when empty
      icon.setAttribute('stroke', 'currentColor')
      icon.setAttribute('fill', 'none')
    }
  } catch (error) {
    console.error('Error updating bookmark indicator:', error)
    icon.setAttribute('stroke', 'currentColor')
    icon.setAttribute('fill', 'none')
  }
}

// Oct 2026 app shell: the right-hand group of the conversation titlebar, the
// one holding Share and More
const HEADER_ACTIONS_SELECTOR_2026 =
  '[data-app-shell-main-titlebar] [data-app-shell-header-obstacle]'
// 2025 and earlier, most specific first
const LEGACY_HEADER_ACTIONS_SELECTORS = [
  '#conversation-header-actions',
  '[data-testid="conversation-header-actions"]',
  '.conversation-header-actions',
  '[role="toolbar"]',
  'header nav',
  'header [role="navigation"]',
]

function mountBookmarksMenuButton(): boolean {
  const container = document.createElement('div')
  container.setAttribute('data-pinflux-bookmarks-menu', '')
  container.innerHTML = bookmarksMenuButtonHtml

  const actions2026 = document.querySelector(HEADER_ACTIONS_SELECTOR_2026)
  if (actions2026) {
    // Every level of the new header is pointer-events-none
    container.className = 'pointer-events-auto flex shrink-0 items-center'

    // Borrow the native toolbar button's look. Its classes are hashed per
    // ChatGPT build, so read them off the live button rather than hardcoding.
    const nativeButton = actions2026.querySelector('button')
    const ourButton = container.querySelector('button')
    if (nativeButton && ourButton) {
      ourButton.className = nativeButton.className
      for (const attr of ['data-color', 'data-variant', 'data-size']) {
        const value = nativeButton.getAttribute(attr)
        if (value !== null) ourButton.setAttribute(attr, value)
      }
    }

    actions2026.prepend(container)
    return true
  }

  for (const selector of LEGACY_HEADER_ACTIONS_SELECTORS) {
    const actions = document.querySelector(selector)
    if (actions) {
      actions.prepend(container)
      return true
    }
  }
  return false
}

const MENU_BUTTON_SELECTOR = '[data-bookmarks-menu-button]'

// Bookmarks belong to a conversation. The new-chat page has the same header
// but nothing to bookmark yet; it becomes /c/<id> once the first message is
// sent, and the button mounts then.
function isConversationPage(): boolean {
  return /\/c\/[\w-]+/.test(window.location.pathname)
}

function removeBookmarksMenu(): void {
  document.querySelector('[data-pinflux-bookmarks-menu]')?.remove()
  document.querySelector('#bookmarks-dropdown')?.classList.add('hidden')
}

function getMenuButton(): HTMLElement | null {
  return document.querySelector<HTMLElement>(MENU_BUTTON_SELECTOR)
}

/**
 * Listeners that must exist once per page. The dropdown and popup live on
 * <body> for the whole session, while the header button is re-created every
 * time ChatGPT re-renders the header — so these look the button up on each
 * event instead of capturing one. Attaching them per mount stacked a copy on
 * every navigation (one "remove" click ran the handler several times).
 */
function setUpMenuListenersOnce(dropdown: Element) {
  if (isMenuInitialized) return
  isMenuInitialized = true

  // Listen for bookmarks changes to update indicator
  document.addEventListener('bookmarksChanged', () => {
    updateBookmarkIndicator()
  })

  // Listen for menu closing when clicking outside
  document.addEventListener('click', (e: Event) => {
    const menuButton = getMenuButton()
    if (
      !menuButton?.contains(e.target as Node) &&
      !dropdown.contains(e.target as Node)
    ) {
      dropdown.classList.add('hidden')
    }
  })

  // Listen for ESC key to close dropdown
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden')
    }
  })

  // Update dropdown position on scroll and resize
  const updateDropdownPosition = () => {
    const menuButton = getMenuButton()
    if (menuButton && !dropdown.classList.contains('hidden')) {
      positionDropdown(dropdown as HTMLElement, menuButton)
    }
  }
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)

  // Menu event listeners
  dropdown.addEventListener('click', async (e: Event) => {
    const target = e.target as HTMLElement
    
    // Handle bookmark link click - only this will close the menu
    const bookmarkLink = target.closest('[data-bookmark-link]')
    if (bookmarkLink) {
      dropdown.classList.add('hidden')
      return
    }

    // Handle bookmark removal
    const removeButton = target.closest('[data-remove-bookmark]')
    if (removeButton) {
      e.preventDefault()
      e.stopPropagation()
      await handleRemoveBookmark(removeButton as HTMLElement, dropdown)
      return
    }

    // Handle bookmark name editing
    const editButton = target.closest('[data-edit-bookmark]')
    if (editButton) {
      e.preventDefault()
      e.stopPropagation()
      await handleEditBookmark(editButton as HTMLElement, dropdown)
      return
    }

    // Prevent menu closing for any other click inside it
    e.stopPropagation()
  })
}

/**
 * Mounts the bookmarks button into the conversation header if it isn't there.
 * Safe to call repeatedly. Returns false when the header isn't rendered yet.
 */
export default function initBookmarksMenu(): boolean {
  if (!isConversationPage()) {
    removeBookmarksMenu()
    return false
  }
  if (getMenuButton()) return true
  if (!mountBookmarksMenuButton()) return false

  // Append dropdown to body to prevent layout issues
  if (!document.getElementById('bookmarks-dropdown')) {
    document.body.insertAdjacentHTML('beforeend', bookmarksDropdownHtml)
  }

  // Add the name change popup
  if (!document.getElementById('bookmark-name-popup')) {
    document.body.insertAdjacentHTML('beforeend', bookmarkNamePopupHtml)
  }

  const menuButton = getMenuButton()
  const dropdown = document.querySelector('#bookmarks-dropdown')
  if (!menuButton || !dropdown) return false

  setUpMenuListenersOnce(dropdown)

  // The button is a new element on every mount, so this never stacks
  menuButton.addEventListener('click', async (e: Event) => {
    e.stopPropagation()
    await toggleBookmarksMenu(dropdown, menuButton)
  })

  // Update indicator on initialization
  updateBookmarkIndicator()
  return true
}

/**
 * Waits for the conversation header, which can render well after the
 * conversation URL changes, then mounts the button. Warns once if it never
 * shows up; later header re-renders are handled by the bookmarks observer.
 */
export async function waitForBookmarksMenu(
  timeoutMs = 15000,
  intervalMs = 300
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (initBookmarksMenu()) return
    // Left the conversation before the header showed up: nothing to wait for
    if (!isConversationPage()) return
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  console.warn(
    `[PinFlux] No suitable container found for bookmarks menu after ${timeoutMs / 1000}s`
  )
}

function positionDropdown(dropdown: HTMLElement, button: HTMLElement) {
  const buttonRect = button.getBoundingClientRect()
  const dropdownWidth = 384 // w-96 = 24rem = 384px
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Calculate horizontal position
  // Try to align with right edge of button
  let left = buttonRect.right - dropdownWidth
  
  // If that goes off the left edge, align with left edge of button
  if (left < 8) {
    left = buttonRect.left
  }
  
  // If that goes off the right edge, position at right edge of viewport
  if (left + dropdownWidth > viewportWidth - 8) {
    left = viewportWidth - dropdownWidth - 8
  }
  
  // Ensure we don't go off left edge
  left = Math.max(8, left)
  
  // Calculate vertical position
  let top = buttonRect.bottom + 8 // 8px gap below button
  
  // Check if dropdown would go off bottom of viewport
  const dropdownHeight = Math.min(384, dropdown.scrollHeight) // max-h-96
  if (top + dropdownHeight > viewportHeight - 8) {
    // Position above button instead
    top = buttonRect.top - dropdownHeight - 8
    
    // If still off screen, position at top of viewport
    if (top < 8) {
      top = 8
    }
  }
  
  dropdown.style.left = `${left}px`
  dropdown.style.top = `${top}px`
}

async function toggleBookmarksMenu(dropdown: Element, button: HTMLElement) {
  const isHidden = dropdown.classList.contains('hidden')
  
  if (isHidden) {
    await updateBookmarksList(dropdown)
    positionDropdown(dropdown as HTMLElement, button)
    dropdown.classList.remove('hidden')
  } else {
    dropdown.classList.add('hidden')
  }
}

async function updateBookmarksList(dropdown: Element) {
  const bookmarksList = dropdown.querySelector('#bookmarks-list')
  const noBookmarks = dropdown.querySelector('#no-bookmarks')
  const searchContainer = dropdown.querySelector('#bookmark-search-container')
  const noSearchResults = dropdown.querySelector('#no-search-results')
  const headerTitle = dropdown.querySelector('h3')
  
  if (!bookmarksList || !noBookmarks || !searchContainer || !noSearchResults || !headerTitle) return

  try {
    const profileId = await getProfileId()
    const path = window.location.pathname.replace(/\/+$/, '')
    let conversationId = ''
    const match = path.match(/\/c\/([\w-]+)/)
    if (match) {
      conversationId = match[1]
    }

    if (!conversationId) {
      console.warn('No conversation ID found')
      return
    }

    const bookmarksData = await getBookmarksData(profileId, conversationId)

    // Show/hide search field based on number of bookmarks
    if (bookmarksData.length > 4) {
      searchContainer.classList.remove('hidden')
      // When there's search, the title needs bottom margin
      headerTitle.classList.add('mb-2')
      headerTitle.classList.remove('mb-0')
      setupSearchFunctionality(dropdown, bookmarksData)
    } else {
      searchContainer.classList.add('hidden')
      // When there's no search, no need for bottom margin on title
      headerTitle.classList.remove('mb-2')
      headerTitle.classList.add('mb-0')
    }

    // Clear the list
    bookmarksList.innerHTML = ''
    noSearchResults.classList.add('hidden')

    if (bookmarksData.length === 0) {
      noBookmarks.classList.remove('hidden')
      bookmarksList.classList.add('hidden')
    } else {
      noBookmarks.classList.add('hidden')
      bookmarksList.classList.remove('hidden')

      // Create item for each bookmark
      renderBookmarks(bookmarksList, bookmarksData)
    }
    
    // Update the indicator after updating the list
    updateBookmarkIndicator()
  } catch (error) {
    console.error('Error updating bookmarks list:', error)
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderBookmarks(bookmarksList: Element, bookmarksData: any[]) {
  bookmarksList.innerHTML = ''
  bookmarksData.forEach(bookmark => {
    const itemHtml = bookmarkItemHtml
      .replace(/\{\{sectionId\}\}/g, bookmark.sectionId)
      .replace(/\{\{displayName\}\}/g, escapeHtml(bookmark.displayName || ''))
    
    bookmarksList.insertAdjacentHTML('beforeend', itemHtml)
  })
}

function setupSearchFunctionality(dropdown: Element, allBookmarks: any[]) {
  const searchInput = dropdown.querySelector('#bookmark-search-input') as HTMLInputElement
  const bookmarksList = dropdown.querySelector('#bookmarks-list')
  const noSearchResults = dropdown.querySelector('#no-search-results')
  
  if (!searchInput || !bookmarksList || !noSearchResults) return

  // Remove existing listeners
  const newSearchInput = searchInput.cloneNode(true) as HTMLInputElement
  searchInput.parentNode?.replaceChild(newSearchInput, searchInput)

  // Prevent menu closing when clicking on search field
  newSearchInput.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  newSearchInput.addEventListener('input', () => {
    const searchTerm = newSearchInput.value.toLowerCase().trim()
    
    if (searchTerm === '') {
      // Show all bookmarks
      renderBookmarks(bookmarksList, allBookmarks)
      noSearchResults.classList.add('hidden')
      bookmarksList.classList.remove('hidden')
    } else {
      // Filter bookmarks by search
      const filteredBookmarks = allBookmarks.filter(bookmark =>
        bookmark.displayName.toLowerCase().includes(searchTerm)
      )
      
      if (filteredBookmarks.length === 0) {
        bookmarksList.classList.add('hidden')
        noSearchResults.classList.remove('hidden')
      } else {
        noSearchResults.classList.add('hidden')
        bookmarksList.classList.remove('hidden')
        renderBookmarks(bookmarksList, filteredBookmarks)
      }
    }
  })

  // Listen for search clearing with Escape
  newSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      newSearchInput.value = ''
      renderBookmarks(bookmarksList, allBookmarks)
      noSearchResults.classList.add('hidden')
      bookmarksList.classList.remove('hidden')
    }
  })
}

async function handleRemoveBookmark(removeButton: HTMLElement, dropdown: Element) {
  const sectionId = removeButton.getAttribute('data-section-id')
  if (!sectionId) return

  try {
    const profileId = await getProfileId()
    const path = window.location.pathname.replace(/\/+$/, '')
    let conversationId = ''
    const match = path.match(/\/c\/([\w-]+)/)
    if (match) {
      conversationId = match[1]
    }

    if (!conversationId) return

    // Delete the bookmark
    await deleteBookmark({ articleId: sectionId, profileId, conversationId })
    
    // Update the menu
    await updateBookmarksList(dropdown)
    
    // Update the button on the page (if exists)
    const sectionElement = document.getElementById(sectionId)
    if (sectionElement) {
      replaceBookmarkButton(sectionElement, addBookmarkButtonHtml)
    }
  } catch (error) {
    console.error('Error removing bookmark:', error)
  }
}

async function handleEditBookmark(editButton: HTMLElement, dropdown: Element) {
  const sectionId = editButton.getAttribute('data-section-id')
  if (!sectionId) return

  // Find the bookmark item
  const bookmarkItem = editButton.closest('.bookmark-item')
  if (!bookmarkItem) return

  const bookmarkLink = bookmarkItem.querySelector('.bookmark-link') as HTMLElement
  const editContainer = bookmarkItem.querySelector('.bookmark-edit-container') as HTMLElement
  const actionsContainer = bookmarkItem.querySelector('.bookmark-actions') as HTMLElement
  const editInput = editContainer?.querySelector('[data-edit-input]') as HTMLInputElement

  if (!bookmarkLink || !editContainer || !actionsContainer || !editInput) return

  // Switch to edit mode
  bookmarkLink.style.display = 'none'
  actionsContainer.style.display = 'none'
  editContainer.classList.remove('hidden')
  
  // Focus on the field and select text
  editInput.focus()
  editInput.select()

  // Listen for save button
  const saveButton = editContainer.querySelector('[data-save-edit]')
  const cancelButton = editContainer.querySelector('[data-cancel-edit]')

  const handleSave = async () => {
    const newName = editInput.value.trim()
    if (!newName) return

    try {
      const profileId = await getProfileId()
      const path = window.location.pathname.replace(/\/+$/, '')
      let conversationId = ''
      const match = path.match(/\/c\/([\w-]+)/)
      if (match) {
        conversationId = match[1]
      }

      if (!conversationId) return

      // Update the name
      await updateBookmarkName({ 
        articleId: sectionId, 
        profileId, 
        conversationId, 
        customName: newName
      })
      
      // Update the menu
      await updateBookmarksList(dropdown)
    } catch (error) {
      console.error('Error updating bookmark name:', error)
    }
  }

  const handleCancel = () => {
    // Return to normal mode
    editContainer.classList.add('hidden')
    bookmarkLink.style.display = ''
    actionsContainer.style.display = ''
    
    // Clean up listeners
    cleanup()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  // Add listeners
  saveButton?.addEventListener('click', handleSave)
  cancelButton?.addEventListener('click', handleCancel)
  editInput.addEventListener('keydown', handleKeyDown)

  // Function to clean up listeners
  const cleanup = () => {
    saveButton?.removeEventListener('click', handleSave)
    cancelButton?.removeEventListener('click', handleCancel)
    editInput.removeEventListener('keydown', handleKeyDown)
  }
}

function showNamePopup(sectionId: string, currentName: string, callback: (name: string) => void) {
  // Will use the simpler function from bookmarkHandler
}
