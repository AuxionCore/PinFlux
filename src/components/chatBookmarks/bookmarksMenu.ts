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
  
  const header = document.getElementById('page-header')
  if (!header) {
    console.warn('Page header not found')
    return
  }

  // מחפש את האזור של כפתורי הפעולות
  const actionsDiv = document.getElementById('conversation-header-actions')
  if (!actionsDiv) {
    console.warn('Conversation header actions not found')
    return
  }

  // יוצר container לתפריט הסימניות
  const bookmarksContainer = document.createElement('div')
  bookmarksContainer.className = 'relative'
  bookmarksContainer.innerHTML = bookmarksMenuButtonHtml + bookmarksDropdownHtml

  // מוסיף לתחילת אזור הפעולות
  actionsDiv.insertBefore(bookmarksContainer, actionsDiv.firstChild)

  // מוסיף את ה-popup לשינוי שם
  if (!document.getElementById('bookmark-name-popup')) {
    document.body.insertAdjacentHTML('beforeend', bookmarkNamePopupHtml)
  }

  const menuButton = bookmarksContainer.querySelector('[data-bookmarks-menu-button]')
  const dropdown = bookmarksContainer.querySelector('#bookmarks-dropdown')

  if (!menuButton || !dropdown) return

  // מאזין ללחיצה על הכפתור
  menuButton.addEventListener('click', async (e) => {
    e.stopPropagation()
    await toggleBookmarksMenu(dropdown)
  })

  // מאזין לסגירת התפריט בלחיצה מחוץ אליו
  document.addEventListener('click', (e) => {
    if (!bookmarksContainer.contains(e.target as Node)) {
      dropdown.classList.add('hidden')
    }
  })

  // מאזיני התפריט
  dropdown.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement
    
    // טיפול בלחיצה על קישור סימניה
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
  })

  // מאזיני ה-popup
  // הpopup מנוהל בbookmarkHandler

  isMenuInitialized = true
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
  
  if (!bookmarksList || !noBookmarks) return

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

    // מנקה את הרשימה
    bookmarksList.innerHTML = ''

    if (bookmarksData.length === 0) {
      noBookmarks.classList.remove('hidden')
      bookmarksList.classList.add('hidden')
    } else {
      noBookmarks.classList.add('hidden')
      bookmarksList.classList.remove('hidden')

      // יוצר פריט לכל סימניה
      bookmarksData.forEach(bookmark => {
        const itemHtml = bookmarkItemHtml
          .replace(/\{\{sectionId\}\}/g, bookmark.sectionId)
          .replace(/\{\{displayName\}\}/g, bookmark.displayName)
        
        bookmarksList.insertAdjacentHTML('beforeend', itemHtml)
      })
    }
  } catch (error) {
    console.error('Error updating bookmarks list:', error)
  }
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

  // מוצא את הסימניה הנוכחית
  const bookmarkItem = editButton.closest('.bookmark-item')
  const bookmarkLink = bookmarkItem?.querySelector('[data-bookmark-link]')
  const currentName = bookmarkLink?.textContent?.trim() || ''

  // מציג prompt לעריכת השם
  const newName = prompt('Enter new bookmark name:', currentName)
  if (newName === null) return // ביטול

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
      customName: newName.trim() 
    })
    
    // מעדכן את התפריט
    await updateBookmarksList(dropdown)
  } catch (error) {
    console.error('Error updating bookmark name:', error)
  }
}

function showNamePopup(sectionId: string, currentName: string, callback: (name: string) => void) {
  // נשתמש בפונקציה הפשוטה יותר מה-bookmarkHandler
  console.log('Edit bookmark functionality - will be implemented with inline popup')
}
