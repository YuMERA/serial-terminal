# Web Serial Terminal

[![GitHub Stars](https://img.shields.io/github/stars/YuMERA/serial-terminal?style=social)](https://github.com/YuMERA/serial-terminal)
[![Latest Release](https://img.shields.io/github/v/release/YuMERA/serial-terminal?color=brightgreen&label=latest)](https://github.com/YuMERA/serial-terminal/releases)
[![Issues](https://img.shields.io/github/issues/YuMERA/serial-terminal?color=orange)](https://github.com/YuMERA/serial-terminal/issues)
[![License](https://img.shields.io/badge/license-Private-red)]()
[![Vercel Deploy](https://img.shields.io/badge/deployed%20on-Vercel-blue)](https://serial-terminal-cyan.vercel.app/)

---

## 🌐 Live Demo
👉 [**Try it on Vercel**](https://serial-terminal-cyan.vercel.app/)

---

## 📑 Quick Links
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Installation](#-installation)
- [Usage Guide](#-how-to-use)
- [Changelog](#-changelog)
- [License](#-license)
- [Project Structure](#-project-structure)

---

## 🚀 Features
✔ Serial Communication via Web Serial API  
✔ Connect / Disconnect with **dynamic baud rate**  
✔ **Hardware Reset** (RTS/DTR toggle)  
✔ Live Terminal:
- Timestamp (12h/24h)
- Normal / Hex / JSON display modes
- Auto-scroll & Auto-clear  
✔ Export Options: TXT, JSON, CSV  
✔ **Custom Settings** (baud, data bits, parity, RTS/DTR)  
✔ Dark & Light Themes  
✔ **Emergency Auto-Clear** at 12,000 lines for browser stability  

---

## 🖼 Screenshots
### Light Mode  
![Light Mode Screenshot](./screenshots/light-mode.png)

### Dark Mode  
![Dark Mode Screenshot](./screenshots/dark-mode.png)

---

## 🛠 Requirements
- Browser: **Chrome**, **Edge**, or any with Web Serial API
- HTTPS connection (required by Web Serial)
- USB device supporting serial communication (ESP32, Arduino, etc.)

---

## 📜 Changelog
### v1.4.0
- ✅ Moved Info & Features to separate pages
- ✅ JSON-based dynamic loading for both sections
- ✅ Added responsive design with full Dark mode support

_For full changelog see [info.html](./info.html) or [info.json](./info.json)_

---

## 🔑 How to Use
1. Open the app in a compatible browser
2. Click Connect, select your serial port
3. Set baud rate and settings
4. Start sending and receiving data
5. Use Reset for quick hardware restart without disconnecting

---

## 📂 Project Structure
- serial-terminal/
- ├── index.html
- ├── style.css
- ├── script.js
- ├── features.html
- ├── info.html
- ├── features.json
- ├── info.json
- ├── version.json
- ├── menu.css
- ├── at_commands.json
- ├── favicon.ico
- └── README.md

---

## 🔒 License
© 2025 me[R]a — All rights reserved.

---

## ⚙ Installation
Clone the repo:
```bash
git clone https://github.com/YuMERA/serial-terminal.git
cd serial-terminal
