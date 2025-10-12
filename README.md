# Tribal Wars hCaptcha Auto-Solver Chrome Extension

A Chrome extension that automatically solves hCaptcha challenges in Tribal Wars using third-party API services (2captcha or CapSolver).

## 🚀 Features

- **Automatic hCaptcha Solving**: Uses 2captcha or CapSolver APIs to solve captcha challenges
- **Smart Detection**: Automatically detects bot protection flow and hCaptcha widgets
- **Cross-Frame Communication**: Uses iframe scripts to bypass CORS restrictions
- **Non-Intrusive**: Only interacts with hCaptcha elements, doesn't interfere with other page functionality
- **Real-time Status**: Shows solving progress and statistics
- **Configurable**: Easy API key setup and service selection

## 📋 How It Works

### Bot Protection Flow
1. **Detects "Start bot protection check" button** (Hungarian: "Kezdd meg a botvédelem ellenőrzését")
2. **Clicks bot protection quest** (`#botprotection_quest`) or alternative button
3. **Finds hCaptcha iframe** and runs iframe script
4. **Iframe script clicks "I am human" checkbox** automatically
5. **Detects if captcha challenge appears** or if it's just a simple checkbox
6. **Solves captcha automatically** using API services if needed

### Technical Architecture
- **Main Content Script**: Detects bot protection elements and hCaptcha iframes
- **Iframe Script**: Runs inside hCaptcha iframes to click checkboxes (bypasses CORS)
- **Background Script**: Handles API requests and token injection
- **Cross-Frame Communication**: Uses `postMessage()` for iframe-to-main communication

## 🛠️ Installation

### Chrome Extension Installation
1. Download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The extension will appear in your extensions list

### API Setup
1. Click the extension icon in your browser toolbar
2. Choose your preferred service:
   - **2captcha**: $2.99 per 1000 solves
   - **CapSolver**: $2.99 per 1000 solves
3. Enter your API key
4. Click "Save" and "Test API" to verify

## 📖 Usage

1. **Enable Auto-Solve**: Check the "Enable Auto-Solve" checkbox in the extension popup
2. **Navigate to Tribal Wars**: Go to your Tribal Wars game
3. **Trigger Bot Protection**: The extension will automatically handle the entire flow
4. **Monitor Progress**: Check the extension popup for status updates and statistics

## 🔧 Configuration

### Extension Settings
- **API Key**: Your 2captcha or CapSolver API key
- **Service**: Choose between 2captcha or CapSolver
- **Auto-Solve**: Enable/disable automatic solving
- **Statistics**: View total solves, last solve time, and current status

### Supported Sites
- `https://*.tribalwars.net/*`
- `https://*.klanhaboru.hu/*` (Hungarian Tribal Wars)

## 🎯 Key Features

### Smart Checkbox Detection
- **Iframe Script**: Runs inside hCaptcha iframes with full access
- **Multiple Selectors**: Uses various CSS selectors to find checkboxes
- **Event Triggering**: Properly triggers click, change, and input events
- **Retry Logic**: Attempts multiple times with different methods

### API Integration
- **2captcha API**: Uses GET requests with proper parameters
- **CapSolver API**: Uses POST requests with JSON payloads
- **Error Handling**: Robust error handling and retry logic
- **Token Injection**: Multiple methods to inject solved tokens

### Non-Intrusive Design
- **Selective Interaction**: Only touches hCaptcha-related elements
- **No Interference**: Doesn't affect other page checkboxes or functionality
- **Clean Detection**: Separates bot protection detection from captcha handling

## 📊 Statistics

The extension tracks:
- **Total Solves**: Number of successful captcha solves
- **Last Solve**: Timestamp of the most recent solve
- **Current Status**: Real-time status (idle, detecting, clicking, solving, solved, error)

## 🔍 Troubleshooting

### Common Issues
1. **API Test Fails**: Check your API key and account balance
2. **Checkbox Not Clicked**: Ensure the iframe script is loaded (check console logs)
3. **Token Not Injected**: Check if the page has the required textarea elements
4. **Extension Not Working**: Reload the extension and check permissions

### Debug Information
- Check browser console for detailed logs
- Extension popup shows current status and errors
- API test function helps verify configuration

## 📁 Project Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── content.js            # Main content script
├── hcaptcha-iframe.js    # Iframe script for checkbox clicking
├── background.js         # Background service worker
├── popup.html           # Extension popup UI
├── popup.js             # Popup functionality
└── icons/               # Extension icons
```

## 🚨 Important Notes

- **API Costs**: Each captcha solve costs approximately $0.003 (2.99/1000)
- **Rate Limits**: API services have rate limits - don't spam requests
- **Terms of Service**: Ensure compliance with Tribal Wars ToS
- **Privacy**: API keys are stored locally in browser storage

## 📈 Future Improvements

- Support for more captcha types (reCAPTCHA, etc.)
- Multiple API service integration
- Advanced retry logic and error recovery
- User statistics and analytics
- Custom solving strategies

## 🤝 Contributing

This project was developed to solve a specific use case. Feel free to adapt it for your needs or contribute improvements.

## 📄 License

This project is for educational and personal use. Please respect the terms of service of all involved services (Tribal Wars, hCaptcha, 2captcha, CapSolver).

## 🔗 Links

- **GitHub Repository**: [https://github.com/nnoby95/Norni0N](https://github.com/nnoby95/Norni0N)
- **2captcha API**: [https://2captcha.com](https://2captcha.com)
- **CapSolver API**: [https://capsolver.com](https://capsolver.com)
- **Tribal Wars**: [https://tribalwars.net](https://tribalwars.net)
