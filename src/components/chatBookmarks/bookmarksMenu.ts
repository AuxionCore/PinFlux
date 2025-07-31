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

export default async function initBookmarksMenu() {
  if (isMenuInitialized) return
  
  console.log('Initializing bookmarks menu...')
  
  const header = document.getElementById('page-header')
  if (!header) {
    console.warn('Page header not found')
    return
  }

  // מחפש את האזור של כפתורי הפעולות
  const actionsDiv = document.getElementById('conversation-header-actions')
  if (!actionsDiv) {
    console.warn('Conversation header actions not found, trying alternative selectors...')
    
    // נסה למצוא אלמנט חלופי
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
        console.log(`Found alternative element: ${selector}`)
        break
      }
    }
    
    if (!foundElement) {
      console.warn('No suitable container found for bookmarks menu')
      return
    }
    
    // השתמש באלמנט שנמצא
    const bookmarksContainer = document.createElement('div')
    bookmarksContainer.className = 'relative'
    bookmarksContainer.innerHTML = bookmarksMenuButtonHtml + bookmarksDropdownHtml

    foundElement.appendChild(bookmarksContainer)
    console.log('Bookmarks menu added to alternative container')
  } else {
    console.log('Found conversation-header-actions')
    
    // יוצר container לתפריט הסימניות
    const bookmarksContainer = document.createElement('div')
    bookmarksContainer.className = 'relative'
    bookmarksContainer.innerHTML = bookmarksMenuButtonHtml + bookmarksDropdownHtml

    // מוסיף לתחילת אזור הפעולות
    actionsDiv.insertBefore(bookmarksContainer, actionsDiv.firstChild)
    console.log('Bookmarks menu added to conversation-header-actions')
    console.log('Menu HTML:', bookmarksMenuButtonHtml.substring(0, 100))
    console.log('Dropdown HTML:', bookmarksDropdownHtml.substring(0, 100))
  }

  // מוסיף את ה-popup לשינוי שם
  if (!document.getElementById('bookmark-name-popup')) {
    document.body.insertAdjacentHTML('beforeend', bookmarkNamePopupHtml)
  }

  // מוצא את הכפתור והdropdown שנוצרו (עם timeout)
  setTimeout(() => {
    const menuButton = document.querySelector('[data-bookmarks-menu-button]')
    const dropdown = document.querySelector('#bookmarks-dropdown')

    console.log('Looking for elements after timeout:', {
      menuButton: !!menuButton,
      dropdown: !!dropdown,
      allButtons: document.querySelectorAll('[data-bookmarks-menu-button]').length,
      allDropdowns: document.querySelectorAll('#bookmarks-dropdown').length
    })

    if (!menuButton || !dropdown) {
      console.error('Menu button or dropdown not found after timeout', {
        menuButton: !!menuButton,
        dropdown: !!dropdown
      })
      return
    }

    console.log('Bookmarks menu initialized successfully')

    // מאזין ללחיצה על הכפתור
    menuButton.addEventListener('click', async (e: Event) => {
      e.stopPropagation()
      await toggleBookmarksMenu(dropdown)
    })

    // מאזין לסגירת התפריט בלחיצה מחוץ אליו
    document.addEventListener('click', (e: Event) => {
      const bookmarksContainer = (menuButton as Element).closest('.relative')
      if (!bookmarksContainer || !bookmarksContainer.contains(e.target as Node)) {
        dropdown.classList.add('hidden')
      }
    })

    // מאזיני התפריט
    dropdown.addEventListener('click', async (e: Event) => {
      const target = e.target as HTMLElement
      
      // טיפול בלחיצה על קישור סימניה - רק זה יסגור את התפריט
      const bookmarkLink = target.closest('[data-bookmark-link]')
      if (bookmarkLink) {
        dropdown.classList.add('hidden')
        return
      }

      // טיפול בהסרת סימניה
      const removeButton = target.closest('[data-remove-bookmark]')
      if (removeButton) {
        e.preventDefault()
        e.stopPropagation()
        await handleRemoveBookmark(removeButton as HTMLElement, dropdown)
        return
      }

      // טיפול בעריכת שם סימניה
      const editButton = target.closest('[data-edit-bookmark]')
      if (editButton) {
        e.preventDefault()
        e.stopPropagation()
        await handleEditBookmark(editButton as HTMLElement, dropdown)
        return
      }

      // מונע סגירת התפריט עבור כל לחיצה אחרת בתוכו
      e.stopPropagation()
    })

    isMenuInitialized = true
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

    // הצגה/הסתרה של שדה החיפוש לפי מספר הסימניות
    if (bookmarksData.length > 4) {
      searchContainer.classList.remove('hidden')
      // כשיש חיפוש, הכותרת צריכה מרווח תחתון
      headerTitle.classList.add('mb-2')
      headerTitle.classList.remove('mb-0')
      setupSearchFunctionality(dropdown, bookmarksData)
    } else {
      searchContainer.classList.add('hidden')
      // כשאין חיפוש, אין צורך במרווח תחתון לכותרת
      headerTitle.classList.remove('mb-2')
      headerTitle.classList.add('mb-0')
    }

    // מנקה את הרשימה
    bookmarksList.innerHTML = ''
    noSearchResults.classList.add('hidden')

    if (bookmarksData.length === 0) {
      noBookmarks.classList.remove('hidden')
      bookmarksList.classList.add('hidden')
    } else {
      noBookmarks.classList.add('hidden')
      bookmarksList.classList.remove('hidden')

      // יוצר פריט לכל סימניה
      renderBookmarks(bookmarksList, bookmarksData)
    }
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

  // הסרת מאזינים קיימים
  const newSearchInput = searchInput.cloneNode(true) as HTMLInputElement
  searchInput.parentNode?.replaceChild(newSearchInput, searchInput)

  // מונע סגירת התפריט בלחיצה על שדה החיפוש
  newSearchInput.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  newSearchInput.addEventListener('input', () => {
    const searchTerm = newSearchInput.value.toLowerCase().trim()
    
    if (searchTerm === '') {
      // הצגת כל הסימניות
      renderBookmarks(bookmarksList, allBookmarks)
      noSearchResults.classList.add('hidden')
      bookmarksList.classList.remove('hidden')
    } else {
      // סינון סימניות לפי החיפוש
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

  // מאזין לניקוי החיפוש עם Escape
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

    // מוחק את הסימניה
    await deleteBookmark({ articleId: sectionId, profileId, conversationId })
    
    // מעדכן את התפריט
    await updateBookmarksList(dropdown)
    
    // מעדכן את הכפתור בדף (אם קיים)
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

  // מוצא את הפריט של הסימניה
  const bookmarkItem = editButton.closest('.bookmark-item')
  if (!bookmarkItem) return

  const bookmarkLink = bookmarkItem.querySelector('.bookmark-link') as HTMLElement
  const editContainer = bookmarkItem.querySelector('.bookmark-edit-container') as HTMLElement
  const actionsContainer = bookmarkItem.querySelector('.bookmark-actions') as HTMLElement
  const editInput = editContainer?.querySelector('[data-edit-input]') as HTMLInputElement

  if (!bookmarkLink || !editContainer || !actionsContainer || !editInput) return

  // מעבר למצב עריכה
  bookmarkLink.style.display = 'none'
  actionsContainer.style.display = 'none'
  editContainer.classList.remove('hidden')
  
  // פוקוס על השדה ובחירת הטקסט
  editInput.focus()
  editInput.select()

  // מאזין לכפתור שמירה
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

      // מעדכן את השם
      await updateBookmarkName({ 
        articleId: sectionId, 
        profileId, 
        conversationId, 
        customName: newName
      })
      
      // מעדכן את התפריט
      await updateBookmarksList(dropdown)
    } catch (error) {
      console.error('Error updating bookmark name:', error)
    }
  }

  const handleCancel = () => {
    // חזרה למצב רגיל
    editContainer.classList.add('hidden')
    bookmarkLink.style.display = ''
    actionsContainer.style.display = ''
    
    // ניקוי מאזינים
    cleanup()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  // הוספת מאזינים
  saveButton?.addEventListener('click', handleSave)
  cancelButton?.addEventListener('click', handleCancel)
  editInput.addEventListener('keydown', handleKeyDown)

  // פונקציה לניקוי מאזינים
  const cleanup = () => {
    saveButton?.removeEventListener('click', handleSave)
    cancelButton?.removeEventListener('click', handleCancel)
    editInput.removeEventListener('keydown', handleKeyDown)
  }
}

function showNamePopup(sectionId: string, currentName: string, callback: (name: string) => void) {
  // נשתמש בפונקציה הפשוטה יותר מה-bookmarkHandler
  console.log('Edit bookmark functionality - will be implemented with inline popup')
}
