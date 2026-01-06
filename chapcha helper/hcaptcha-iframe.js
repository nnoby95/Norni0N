// hCaptcha iframe script - runs inside hCaptcha iframes
// Auto-clicks the "I am human" checkbox

const LOGS_KEY = 'tw_bot_helper_logs';
let logsEnabled = false;

// Load logs setting
async function loadLogsSetting() {
    try {
        const result = await chrome.storage.local.get([LOGS_KEY]);
        logsEnabled = result[LOGS_KEY] === true;
    } catch (e) {
        logsEnabled = false;
    }
}

function log(message, level = 'info') {
    if (!logsEnabled) return;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`[hCaptcha Iframe] ${timestamp} ${prefix} ${message}`);
}

// Auto-click the "I am human" checkbox
function clickHumanCheckbox() {
    log('Looking for "I am human" checkbox in iframe...', 'info');

    // Look for the checkbox with various selectors
    const selectors = [
        '#checkbox',
        'input[type="checkbox"]',
        '.checkbox',
        '[class*="checkbox"]',
        'input[id*="checkbox"]'
    ];

    let checkbox = null;
    for (let selector of selectors) {
        checkbox = document.querySelector(selector);
        if (checkbox) {
            log(`Found checkbox with selector: ${selector}`, 'info');
            break;
        }
    }

    if (checkbox) {
        // Check if it's already checked
        if (checkbox.checked) {
            log('Checkbox already checked', 'info');
            return true;
        }

        // Click the checkbox
        log('Clicking "I am human" checkbox...', 'info');

        try {
            // Multiple click methods to ensure it works
            checkbox.click();
            checkbox.checked = true;

            // Trigger events
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            checkbox.dispatchEvent(new Event('click', { bubbles: true }));
            checkbox.dispatchEvent(new Event('input', { bubbles: true }));

            // Also try mouse events
            const mouseEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            checkbox.dispatchEvent(mouseEvent);

            log('Checkbox clicked successfully!', 'info');

            // Notify parent window that checkbox was clicked
            try {
                window.parent.postMessage({
                    type: 'HCAPTCHA_CHECKBOX_CLICKED',
                    source: 'hcaptcha-iframe'
                }, '*');
                log('Notified parent window of checkbox click', 'info');
            } catch (e) {
                log('Could not notify parent window: ' + e.message, 'warn');
            }

            return true;
        } catch (error) {
            log('Error clicking checkbox: ' + error.message, 'error');
            return false;
        }
    } else {
        log('No checkbox found in iframe', 'warn');
        return false;
    }
}

// Wait for DOM to be ready and try clicking
function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', clickHumanCheckbox);
    } else {
        // DOM is already ready
        setTimeout(clickHumanCheckbox, 500);
    }
}

// Load settings then start
loadLogsSetting().then(() => {
    log('hCaptcha iframe script initialized', 'info');
    init();
});

// Keep trying every 2 seconds for up to 10 seconds
let attempts = 0;
const maxAttempts = 5;
const retryInterval = setInterval(() => {
    attempts++;
    log(`Retry attempt ${attempts}/${maxAttempts}`, 'info');

    if (clickHumanCheckbox() || attempts >= maxAttempts) {
        clearInterval(retryInterval);
    }
}, 2000);

// Listen for messages from parent window
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLICK_CHECKBOX') {
        log('Received click checkbox request from parent', 'info');
        clickHumanCheckbox();
    }
});
