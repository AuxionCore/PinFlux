/**
 * PinFlux Tutorial API
 * 
 * פונקציות לבדיקה ודיבוג של מערכת ההדרכה
 * זמינות דרך window.pinfluxTutorial במצב פיתוח
 */

// דוגמאות שימוש בקונסול:

// 1. התחלת הדרכה ספציפית
// window.pinfluxTutorial.startTutorial('pin_chats', true)

// 2. בדיקת סטטוס ההדרכה
// window.pinfluxTutorial.getTutorialStatus()

// 3. איפוס התקדמות
// window.pinfluxTutorial.resetProgress()

// 4. עצירת ההדרכה
// window.pinfluxTutorial.stopTutorial()

// 5. קבלת תכונות זמינות
// window.pinfluxTutorial.getAvailableFeatures()

// 6. בדיקה אם צריך התחלה אוטומטית
// window.pinfluxTutorial.shouldAutoStart()

// זיהויי תכונות זמינים:
// - pin_chats: הדרכה על קיבוץ צ'אטים
// - drag_drop: הדרכה על גרור ושחרר
// - bookmarks: הדרכה על סימניות
// - rename_chats: הדרכה על שינוי שם צ'אטים
// - pin_shortcuts: הדרכה על קיצורי מקלדת

export const tutorialAPI = {
  // הפעלת הדרכה מתכונה מסוימת
  startFeature: (featureId: string) => {
    return (window as any).pinfluxTutorial?.startTutorial(featureId, true)
  },
  
  // בדיקת סטטוס
  status: () => {
    return (window as any).pinfluxTutorial?.getTutorialStatus()
  },
  
  // איפוס
  reset: () => {
    return (window as any).pinfluxTutorial?.resetProgress()
  },
  
  // עצירה
  stop: () => {
    return (window as any).pinfluxTutorial?.stopTutorial()
  }
}

// ייצוא לשימוש בפיתוח
if (import.meta.env.DEV) {
  (window as any).tutorialAPI = tutorialAPI
}
