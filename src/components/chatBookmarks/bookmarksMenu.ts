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
      icon.setAttribute('stroke', 'white')
      return
    }

    const bookmarksData = await getBookmarksData(profileId, conversationId)
    
    if (bookmarksData.length > 0) {
      // White border with white fill when there are bookmarks
      icon.setAttribute('stroke', 'white')
      icon.setAttribute('fill', 'white')
    } else {
      // White border without fill when empty
      icon.setAttribute('stroke', 'white')
      icon.setAttribute('fill', 'none')
    }
  } catch (error) {
    console.error('Error updating bookmark indicator:', error)
    icon.setAttribute('stroke', 'white')
    icon.setAttribute('fill', 'none')
  }
}

export default async function initBookmarksMenu() {
  // Check if the button already exists on the page
  const existingButton = document.querySelector('[data-bookmarks-menu-button]')
  if (existingButton) {
    return
  }
  
  
  const header = document.getElementById('page-header')
  if (!header) {
    console.warn('Page header not found')
    return
  }

  // Look for the actions buttons area
  const actionsDiv = document.getElementById('conversation-header-actions')
  if (!actionsDiv) {
    console.warn('Conversation header actions not found, trying alternative selectors...')
    
    // Try to find an alternative element
    const alternatives = [
      '[data-testid="conversation-header-actions"]',
      '.conversation-header-actions',
      '[role="toolbar"]',
      'header nav',
      'header [role="navigation"]'
    ]
    
    let foundElement = null
    for (const selector of alternatives) {
      foundElement = document.querySelector(selector)
      if (foundElement) {
        break
      }
    }
    
    if (!foundElement) {
      console.warn('No suitable container found for bookmarks menu')
      return
    }
    
    // Use the found element
    const bookmarksContainer = document.createElement('div')
    bookmarksContainer.className = 'relative'
    bookmarksContainer.innerHTML = bookmarksMenuButtonHtml + bookmarksDropdownHtml

    foundElement.appendChild(bookmarksContainer)
  } else {
    
    // Create container for bookmarks menu
    const bookmarksContainer = document.createElement('div')
    bookmarksContainer.className = 'relative'
    bookmarksContainer.innerHTML = bookmarksMenuButtonHtml + bookmarksDropdownHtml

    // Add to the beginning of the actions area
    actionsDiv.insertBefore(bookmarksContainer, actionsDiv.firstChild)
  }

  // Add the name change popup
  if (!document.getElementById('bookmark-name-popup')) {
    document.body.insertAdjacentHTML('beforeend', bookmarkNamePopupHtml)
  }

  // Find the created button and dropdown (with timeout)
  setTimeout(() => {
    const menuButton = document.querySelector('[data-bookmarks-menu-button]')
    const dropdown = document.querySelector('#bookmarks-dropdown')

    if (!menuButton || !dropdown) {
      console.error('Menu button or dropdown not found after timeout', {
        menuButton: !!menuButton,
        dropdown: !!dropdown
      })
      return
    }


    // Update indicator on initialization
    updateBookmarkIndicator()

    // Listen for bookmarks changes to update indicator
    document.addEventListener('bookmarksChanged', () => {
      updateBookmarkIndicator()
    })

    // Listen to button clicks
    menuButton.addEventListener('click', async (e: Event) => {
      e.stopPropagation()
      await toggleBookmarksMenu(dropdown)
    })

    // Listen for menu closing when clicking outside
    document.addEventListener('click', (e: Event) => {
      const bookmarksContainer = (menuButton as Element).closest('.relative')
      if (!bookmarksContainer || !bookmarksContainer.contains(e.target as Node)) {
        dropdown.classList.add('hidden')
      }
    })

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

  }, 100)
}

async function toggleBookmarksMenu(dropdown: Element) {
  const isHidden = dropdown.classList.contains('hidden')
  
  if (isHidden) {
    await updateBookmarksList(dropdown)
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

function renderBookmarks(bookmarksList: Element, bookmarksData: any[]) {
  bookmarksList.innerHTML = ''
  bookmarksData.forEach(bookmark => {
    const itemHtml = bookmarkItemHtml
      .replace(/\{\{sectionId\}\}/g, bookmark.sectionId)
      .replace(/\{\{displayName\}\}/g, bookmark.displayName)
    
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
