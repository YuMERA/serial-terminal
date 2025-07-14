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

## Older Versions

See previous releases in [GitHub Releases](https://github.com/your-username/your-repo/releases)