# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.2] - 2025-11-29

### Added
- **Firefox Add-ons Support**: PinFlux is now officially available on Firefox Add-ons store
- **Dual Browser Installation**: Website now features separate install buttons for both Chrome Web Store and Firefox Add-ons

### Enhanced
- **Website Design**: Updated gradient colors to prettier purple tones (#6366f1, #8b5cf6, #a855f7) matching the PinFlux logo
- **Browser Icons**: Added Chrome and Firefox SVG icons to installation buttons for better visual clarity
- **Cross-Browser Description**: Updated meta descriptions to reflect support for both Chrome and Firefox browsers

### Fixed
- **Firefox Manifest Validation**: Resolved Firefox Add-ons validation errors
  - Added proper `gecko.id` (pinflux@auxioncore.com) for Firefox extension identification
  - Implemented `data_collection_permissions` with `required: ["none"]` declaration
  - All Firefox Add-ons validation tests now pass successfully

## [2.2.1] - 2025-11-29

### Enhanced
- **Tutorial Icon**: Replaced trash icon with book icon for better tutorial representation
- **Tutorial Button Logic**: Tutorial "Start Tutorial" button now only appears on ChatGPT website when no pinned chats exist

### Fixed
- **Bookmark Indicator Colors**: Changed to white border with white fill when bookmarks exist, white border without fill when empty
- **PinFlux Board Header**: Removed gray hover background on "PinFlux Board" header to match native ChatGPT list behavior
- **Website Statistics**: Updated to show 4.3★ rating and 3,000+ active users

### Removed
- **Console Logs**: Removed all console.log statements from codebase (233 statements) while preserving console.error and console.warn

## [2.2.0] - 2025-11-19

### Added
- **Interactive Tutorial System**: Comprehensive step-by-step tutorial guiding users through all extension features
  - Pin chats tutorial with three methods: sidebar menu, drag & drop, and keyboard shortcuts
  - Bookmarks tutorial demonstrating message saving and organization
  - Tutorial tooltips with navigation (Next, Previous, Skip, Finish)
  - Smart tutorial state management and auto-start for new users
  - Tutorial cleanup system preventing observer conflicts
- **Drag & Drop Reordering**: Ability to reorder pinned chats within the pinned chats panel
  - Visual drag feedback with custom draggable display
  - Smooth reordering animations
  - Persistent order saving
- **Localization Expansion**: Added full support for Japanese and Korean languages
  - Complete tutorial translations for ja and ko locales
  - All UI strings translated including buttons, tooltips, and messages
- **Projects Feature Support**: Full compatibility with ChatGPT's new "Projects" feature
  - Pin chats functionality works seamlessly in project conversations
  - Bookmarks system fully functional within project chats
- **Collapsible Pinned Panel**: Added expand/collapse functionality for pinned chats panel
  - Consistent with ChatGPT's native sidebar behavior
  - State persistence across sessions
- **Bookmark Indicator**: Visual indicator on bookmarks menu button when bookmarks exist
  - Subtle blue dot notification
  - Real-time updates when adding/removing bookmarks

### Enhanced
- **Tutorial Experience**: 
  - Fixed unpin instructions to correctly reference three-dot menu instead of X button
  - Global step counter showing progress across all features (e.g., 11/15)
  - Automatic progression between tutorial features
  - Debounced unpin detection to prevent false triggers
  - Observer cleanup between steps preventing interference
- **Notification Management**: Tutorial-aware notifications that don't interfere with tutorial flow
- **UI Consistency**: Updated pinned chats panel styling to match ChatGPT's latest design changes
  - Improved spacing and alignment
  - Better visual integration with sidebar

### Fixed
- Tutorial system observer lifecycle management
  - Observers now properly cleaned up between steps
  - Menu observer scoped to correct tutorial step
  - Drag guide cleanup in unpin step
- Tutorial notification conflicts resolved with sessionStorage flags
- Removed duplicate drag_drop tutorial feature
- Improved pinned chats display positioning outside of main chat panel
- Enhanced drag-and-drop visual feedback and reliability

## [2.1.0] - 2025-08-05

### Added
- **Bookmarks System**: Complete bookmarks functionality for saving and organizing important messages
  - Search functionality in bookmarks menu with dynamic filtering
  - Inline editing with save/cancel options for bookmark names
  - Floating input modal for adding and updating bookmark names
  - Navigation menu with toggle functionality
  - Remove bookmark button component
- **Pin Shortcuts**: Pin current chat functionality with keyboard command integration
- **Options Page**: Customizable settings page with shortcut links
- **Storage Management**: Enhanced storage capacity management with bookmark key removal logic
- **UI Improvements**: 
  - Dynamic scrollbar visibility for chat list container
  - Enhanced pin/unpin button styles with hover effects
  - Improved input styling and positioning for rename functionality
  - Updated rename icon size and SVG paths for better clarity

### Enhanced
- **Performance**: Increased DELETE_BATCH_SIZE for improved bookmark key removal efficiency
- **Article Processing**: Enhanced with throttled observer and state management
- **Drag & Drop**: Improved draggable display height matching during drag operations
- **Bookmark Management**: Better initialization with existing button checks and improved error handling
- **Code Quality**: Updated comments across multiple files for better maintainability

### Fixed
- Enhanced button focus visibility and hover styles
- Improved error handling and prevention of repeated bookmark initialization
- Better bookmark button handling with improved container checks
- Updated Chrome store URLs for feedback and rate us links
- Standardized quotation marks in CSS for consistency

## [2.0.2] - 2025-05-26

### Fixed
- Refactored tooltip and notification functions for consistency
- Added feature survey notification messages for user feedback
- Improved onInstalled listener with better error handling

## [2.0.1] - 2025-05-25

### Fixed
- Simplified onInstalled listener and improved error handling in pin command
- Updated Chrome store URLs for feedback and rate us links
- Updated localization strings for clarity and consistency
- Added tooltip functionality for pin shortcut notifications

## [2.0.0] - 2025-05-25

### Added
- **Rename Feature**: Added ability to rename pinned conversations
- **WXT Framework**: Integrated WXT Extension Framework for better development experience
- **Improved Styling**: Enhanced PinFlux board style and UI components

### Fixed
- Fixed issue with PinFlux functionality due to ChatGPT UI changes

## [1.1.4] - 2025-05-17

### Fixed
- Adjusted pin/unpin button styles to match ChatGPT's new design system
- Removed registration of duplicate click events for better performance
- Improved functionality for removing pinned conversations when original chat is deleted
- Added unicodeBidi style to chat title for improved text rendering

## [1.1.3] - 2025-04-29

### Fixed
- Fixed issue with displacement of pinned chats in the side menu

## [1.1.2] - 2025-04-22

### Fixed
- Fixed issue with displacement of pinned chats in the side menu

## [1.1.1] - 2025-04-20

### Fixed
- Fixed issue with displacement of pinned chats in the side menu
- Fixed issue when PinFlux board was shown even when profile ID was not found
- Changed the title of pinned chats to "PinFlux" in the side menu for better branding

## [1.1.0] - 2025-04-08

### Added
- **Drag & Drop**: Added drag and drop functionality for organizing pinned chats
- **Original Chat Search**: Added option to search for original chat from pinned version

### Fixed
- Fixed issue with pin chats storage savings for better data persistence

## [1.0.0] - 2025-03-19

### Added
- **Initial Release**: Added core feature to pin chats in the ChatGPT side menu
