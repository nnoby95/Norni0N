// Tribal Wars Bot Helper - Content Script
// Detects bot protection and clicks "I am human" checkbox

// Configuration
const STORAGE_KEY = 'tw_bot_helper_enabled';
const INTERVAL_KEY = 'tw_bot_helper_interval';
const LOGS_KEY = 'tw_bot_helper_logs';

// Status tracking
let isEnabled = true;
let checkInterval = 1000; // Default 1000ms
let logsEnabled = false; // Default to disabled
let detectionInterval = null;
let lastClickedElement = null;
let lastClickTime = 0;

// Logging utility - only logs if enabled
function log(message, level = 'info') {
    if (!logsEnabled) return;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = '[TW Bot Helper]';

    if (level === 'error') {
        console.error(`${prefix} ${timestamp}`, message);
    } else if (level === 'warn') {
        console.warn(`${prefix} ${timestamp}`, message);
    } else {
        console.log(`${prefix} ${timestamp}`, message);
    }
}

// Check if we're on a Tribal Wars page
function isTribalWarsPage() {
    return window.location.hostname.includes('tribalwars.net') ||
           window.location.hostname.includes('klanhaboru.hu');
}

// Load settings from storage
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get([STORAGE_KEY, INTERVAL_KEY, LOGS_KEY]);
        isEnabled = result[STORAGE_KEY] !== false; // Default to true
        checkInterval = result[INTERVAL_KEY] || 1000; // Default to 1000ms
        logsEnabled = result[LOGS_KEY] === true; // Default to false
        log(`Settings loaded - enabled: ${isEnabled}, interval: ${checkInterval}ms, logs: ${logsEnabled}`);
        return { enabled: isEnabled, interval: checkInterval, logs: logsEnabled };
    } catch (e) {
        log('Error loading settings: ' + e.message, 'error');
        return { enabled: true, interval: 1000, logs: false };
    }
}

// Bot protection detection - clicks "Start bot protection check" buttons
function detectAndClickBotElements() {
    if (!isTribalWarsPage()) return { found: false };

    const now = Date.now();

    // Step 1: Check for "Start bot protection check" button (Hungarian/English)
    const allButtons = document.querySelectorAll('button, input[type="button"], a, .btn');
    for (let button of allButtons) {
        const text = (button.textContent || button.value || '').toLowerCase();

        // Hungarian and English text detection
        if (text.includes('kezdd meg a botvédelem') ||
            text.includes('botvédelem ellenőrzését') ||
            text.includes('start the bot protection') ||
            text.includes('bot protection check') ||
            text.includes('begin bot protection')) {

            // Prevent clicking too fast
            if (lastClickedElement === 'bot_button' && (now - lastClickTime) < 3000) {
                continue;
            }

            log('Found "Start bot protection check" button - clicking...');

            try {
                button.click();
                lastClickedElement = 'bot_button';
                lastClickTime = now;
                return { found: true, element: 'bot_button' };
            } catch (e) {
                log('Error clicking button: ' + e.message, 'error');
            }
        }
    }

    // Step 2: Check for #botprotection_quest element
    const botQuest = document.getElementById('botprotection_quest');
    if (botQuest) {
        if (lastClickedElement === 'botprotection_quest' && (now - lastClickTime) < 5000) {
            return { found: false };
        }

        log('Found #botprotection_quest - clicking...');

        try {
            botQuest.click();
            lastClickedElement = 'botprotection_quest';
            lastClickTime = now;
            return { found: true, element: 'botprotection_quest' };
        } catch (e) {
            log('Error clicking botprotection_quest: ' + e.message, 'error');
        }
    }

    return { found: false };
}

// Detect hCaptcha iframe presence
function detectHCaptchaIframe() {
    const hcaptchaIframes = document.querySelectorAll('iframe[src*="hcaptcha.com"]');
    if (hcaptchaIframes.length > 0) {
        log('hCaptcha iframe detected - iframe script will handle checkbox');
        return true;
    }
    return false;
}

// Main detection loop
async function startDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
    }

    // Load current settings
    await loadSettings();

    log(`Starting bot protection detection (interval: ${checkInterval}ms)...`);

    lastClickedElement = null;
    lastClickTime = 0;

    detectionInterval = setInterval(async () => {
        // Check if still enabled
        if (!isEnabled) {
            log('Extension disabled, stopping detection');
            clearInterval(detectionInterval);
            detectionInterval = null;
            return;
        }

        // Look for bot protection elements to click
        const botElements = detectAndClickBotElements();
        if (botElements.found) {
            log(`Clicked bot protection element: ${botElements.element}`);
        }

        // Check for hCaptcha iframe (just for logging)
        detectHCaptchaIframe();
    }, checkInterval);
}

function stopDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
        log('Detection stopped');
    }
}

// Listen for messages from hCaptcha iframe
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'HCAPTCHA_CHECKBOX_CLICKED') {
        log('Checkbox clicked notification received from hCaptcha iframe!');

        // Wait a bit and check if challenge appeared or if simple click was enough
        setTimeout(() => {
            const challengeIframe = document.querySelector('iframe[src*="hcaptcha.com"][src*="challenge"]');
            const largeIframe = Array.from(document.querySelectorAll('iframe[src*="hcaptcha.com"]'))
                .find(iframe => {
                    const rect = iframe.getBoundingClientRect();
                    return rect.width > 300 && rect.height > 300;
                });

            if (challengeIframe || largeIframe) {
                log('Challenge iframe detected - manual solving may be required');
            } else {
                log('No challenge detected - simple checkbox click was enough!');
            }
        }, 3000);
    }
});

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'UPDATE_SETTINGS') {
        const wasEnabled = isEnabled;
        const oldInterval = checkInterval;

        isEnabled = message.enabled;
        checkInterval = message.interval || 1000;
        logsEnabled = message.logs === true;

        log(`Settings updated - enabled: ${isEnabled}, interval: ${checkInterval}ms, logs: ${logsEnabled}`);

        // Restart detection if settings changed
        if (isEnabled && (!wasEnabled || oldInterval !== checkInterval)) {
            startDetection();
        } else if (!isEnabled) {
            stopDetection();
        }

        sendResponse({ success: true });
    } else if (message.type === 'TOGGLE_ENABLED') {
        isEnabled = message.enabled;
        log(`Extension ${isEnabled ? 'enabled' : 'disabled'}`);

        if (isEnabled) {
            startDetection();
        } else {
            stopDetection();
        }

        sendResponse({ success: true });
    } else if (message.type === 'GET_STATUS') {
        sendResponse({
            enabled: isEnabled,
            interval: checkInterval,
            detecting: detectionInterval !== null
        });
    }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        let needsRestart = false;

        if (changes[STORAGE_KEY]) {
            isEnabled = changes[STORAGE_KEY].newValue !== false;
            log(`Storage changed - Extension ${isEnabled ? 'enabled' : 'disabled'}`);
            needsRestart = true;
        }

        if (changes[INTERVAL_KEY]) {
            checkInterval = changes[INTERVAL_KEY].newValue || 1000;
            log(`Storage changed - Interval: ${checkInterval}ms`);
            needsRestart = true;
        }

        if (changes[LOGS_KEY]) {
            logsEnabled = changes[LOGS_KEY].newValue === true;
            // No need to restart for logs change
        }

        if (needsRestart) {
            if (isEnabled) {
                startDetection();
            } else {
                stopDetection();
            }
        }
    }
});

// Initialize
function init() {
    if (!document.body) {
        setTimeout(init, 100);
        return;
    }

    log('Tribal Wars Bot Helper initialized');

    // Only run on Tribal Wars pages
    if (isTribalWarsPage()) {
        loadSettings().then(settings => {
            if (settings.enabled) {
                startDetection();
            } else {
                log('Extension is disabled');
            }
        });
    }
}

// Start after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
} else {
    setTimeout(init, 500);
}
