# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
