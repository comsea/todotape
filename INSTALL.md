# Installation guide — TO·DO·TAPE

## Windows (recommended)

### Option A — MSI installer (recommended)

1. Download `TO-DO-TAPE_1.0.0_x64_en-US.msi`
2. Double-click the file and follow the installer wizard
3. Launch **TO·DO·TAPE** from the Start menu or desktop shortcut
4. The app icon appears in the system tray — closing the window keeps it running there

### Option B — Portable EXE

1. Copy `todo-tape.exe` to any folder (e.g. `C:\Tools\TO-DO-TAPE\`)
2. Double-click to run
3. To create a shortcut: right-click → *Create shortcut* → move to Desktop

---

## Requirements

**WebView2 Runtime** must be installed. It is pre-installed on:
- Windows 11 (all versions)
- Windows 10 version 1803 and later (with cumulative updates)

If the app shows an error on launch, install WebView2 from:  
`https://developer.microsoft.com/en-us/microsoft-edge/webview2/`  
Choose **Evergreen Bootstrapper** and run it.

---

## First launch

- The app starts with 15 example tasks spread across the current week
- Use **+ Nouvelle tâche** (or `Ctrl+N`) to add your own tasks
- Click **↺ reset** in Preferences (⚙) to restore example tasks
- Your data is saved in `%APPDATA%\com.todotape.app\todotape.json`

---

## Uninstall

- **MSI install**: Settings → Apps → search *TO-DO-TAPE* → Uninstall
- **Portable EXE**: delete the `.exe` file; user data remains in `%APPDATA%\com.todotape.app\`
- To remove user data: delete the folder `%APPDATA%\com.todotape.app\`
