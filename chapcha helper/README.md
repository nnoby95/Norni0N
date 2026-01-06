# Tribal Wars Bot Helper

A lightweight Chrome extension that automatically clicks the "I am human" checkbox for bot protection in Tribal Wars.

## Features

- **Auto-click bot protection buttons** - Detects and clicks "Start bot protection check" buttons
- **Auto-click hCaptcha checkbox** - Clicks the "I am human" checkbox in hCaptcha iframes
- **Configurable check interval** - Set how often to scan for bot protection (250ms - 3000ms)
- **Optional console logging** - Enable/disable logs to save resources
- **Tribal Wars themed UI** - Medieval-style popup that matches the game

## Installation

1. Download all files to a folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the folder containing the extension files

## Files

```
chapcha helper/
├── manifest.json        - Extension configuration
├── content.js           - Bot detection script (runs on TW pages)
├── hcaptcha-iframe.js   - Checkbox clicker (runs in hCaptcha iframes)
├── background.js        - Service worker
├── popup.html           - Settings popup UI
├── popup.js             - Popup logic
└── README.md            - This file
```

## Usage

1. Click the extension icon in your toolbar
2. Use the **ON/OFF** button to enable/disable
3. Adjust **Check interval** if needed (default: 1000ms)
4. Enable **Console logs** for debugging (disabled by default)

## Settings

| Setting | Options | Description |
|---------|---------|-------------|
| **ON/OFF** | Toggle button | Enable or disable the extension |
| **Check interval** | 250ms - 3000ms | How often to check for bot protection |
| **Console logs** | Enabled/Disabled | Show debug logs in browser console |

## How It Works

1. **Bot Protection Detection** - Scans for "Start bot protection check" buttons on Tribal Wars pages
2. **Auto-Click Buttons** - Clicks detected buttons automatically
3. **hCaptcha Checkbox** - When hCaptcha iframe loads, clicks the "I am human" checkbox
4. **Challenge Detection** - If a challenge appears after clicking, you'll need to solve it manually

## Supported Sites

- tribalwars.net (all servers)
- klanhaboru.hu (Hungarian servers)

## Troubleshooting

**Extension not working?**
- Make sure it's enabled in `chrome://extensions/`
- Check if the ON/OFF button is set to ON
- Try refreshing the Tribal Wars page

**Want to see what's happening?**
- Enable "Console logs" in settings
- Open DevTools (F12) > Console tab
- Look for `[TW Bot Helper]` messages

**Checkbox not clicking?**
- The hCaptcha iframe might take a moment to load
- The extension retries every 2 seconds (up to 5 times)

## Limitations

- Only clicks the initial "I am human" checkbox
- Does NOT solve image challenges (if hCaptcha shows a puzzle, you must solve it manually)
- Only works on Tribal Wars pages

## Version History

**v2.0.0** - Simplified version
- Removed API-based captcha solving
- Added configurable check interval
- Added console log toggle
- New Tribal Wars themed UI
- Reduced resource usage

**v1.0.0** - Initial version
- API-based hCaptcha solving (removed)
