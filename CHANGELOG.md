# Changelog

## [v1.3.0] - 2025-07-12

### ✨ New Features

- **Export Output Modal**  
  Users can now export terminal output to `.json` or `.csv` using a clean modal interface with customizable filename and format.

- **DTR/RTS Control**  
  Added DTR and RTS settings in the Settings modal. Their live status is displayed in the main UI (ON/OFF with color indicators).

- **AutoClear Fix**  
  AutoClear settings are now applied immediately during active sessions, without requiring a disconnect.

- **Web Serial API Detection Overlay**  
  Improved browser support check. Displays an overlay if Web Serial API is not supported (now hidden to prevent false positives).

### 🛠 Improvements & Fixes

- Cleaned up inline styles causing permanent display of the unsupported notice
- Stabilized fallback logic for default DTR/RTS using `DEFAULT_SETTINGS`
- Fixed issue where initial AutoClear value persisted after user updated it
- Updated `info.json` and Features modal with new entries

---

## [v1.3.3] - 2025-07-13

### ✨ New Features

- **Social Media Footer**
  - Added official social media icons to the footer (Twitter, YouTube, X, Viber, WhatsApp, Telegram, TikTok, Pinterest, GitHub)
  - Each icon uses its original brand color for instant recognition
  - Hover effect added for visual feedback
  - GitHub icon links to the public repository

### 💄 UI Improvements

- Footer layout updated:
  - Developer credit now left-aligned
  - Social icons now right-aligned
  - Responsive wrapping behavior for small screens

### 🔧 Internal

- Cleaned up older `.copyright` styles
- Ensured accessibility with `title` attributes for all icons

---

## [v1.3.4] – 2025-07-13

### Added
- Emergency Auto-Clear system: automatically clears terminal output if buffer exceeds 12,000 lines
- Display of system message when emergency clear is triggered

### Improved
- Prevented console error related to message rendering after forced buffer reset

### Fixed
- Consistency in Copy, Save, and Export operations after auto-clear event

---

## [v1.3.5] - 2025-07-24

### ✅ Added
- **Hardware Reset Button**  
  A new Reset button has been added to the main interface. It uses RTS/DTR toggling to perform a hardware reset on connected devices (e.g., ESP32) without disconnecting.  
  Displays `<system message>` logs to confirm reset actions.

### 🔄 Changed
- **Baud Rate Priority**  
  The baud rate selected on the main interface now takes priority over the Settings modal value, ensuring quick and easy changes without reopening Settings.

### 🛠 Fixed
- Improved reset reliability by introducing a safe signal sequence before reset.

---

### 🔖 v1.4.0 – Major UI Restructure
- **What's New**
  - Replaced Info and Features modals with standalone responsive pages
  - Dynamic content loading from JSON for easier updates
  - Full Dark/Light theme support across new pages
  - Improved navigation and cleaned unused modal-related scripts

- **Improvements**
  - Better readability on mobile and desktop
  - Simplified app layout for a cleaner UI experience

---

## 🚀 What's New in v1.4.4

### ✅ Added
- **AT Commands page** with categorized tabs (General, Wi-Fi, MQTT, Custom)
- **Real-time search** with keyword highlighting and clear button
- **Responsive design** for AT Commands page (works on mobile and desktop)
- **Dark/Light theme support** for the new page

### 🔗 Integration
- Linked main app with AT Commands page:
  - Selected command from AT page auto-fills in the main app input field
  - Preserves user flow between pages

### 🛠 Project Structure
- Reorganized files:
  - CSS → `assets/css/`
  - JS → `assets/js/`
  - JSON → `assets/json/`

---

**Full changelog**:
- Added AT Commands Library page
- Implemented responsive tab navigation + dropdown
- Added search with debounce and text highlight
- Synced AT page with main app via `localStorage`
- Improved Dark/Light theme handling


## Previous Versions

See full history in [Releases »](https://github.com/YuMERA/serial-terminal/releases)

