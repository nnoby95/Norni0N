// Tribal Wars Bot Helper - Popup Script
// Simple ON/OFF toggle control with interval setting

console.log('[TW Bot Helper] Popup loaded');

const STORAGE_KEY = 'tw_bot_helper_enabled';
const INTERVAL_KEY = 'tw_bot_helper_interval';
const LOGS_KEY = 'tw_bot_helper_logs';

// DOM elements
const toggleBtn = document.getElementById('toggle-btn');
const statusText = document.getElementById('status-text');
const intervalSelect = document.getElementById('interval-select');
const logsSelect = document.getElementById('logs-select');

let isEnabled = true;
let checkInterval = 1000;
let logsEnabled = false;

// Load current state
async function loadState() {
    try {
        const result = await chrome.storage.local.get([STORAGE_KEY, INTERVAL_KEY, LOGS_KEY]);
        isEnabled = result[STORAGE_KEY] !== false; // Default to true
        checkInterval = result[INTERVAL_KEY] || 1000; // Default to 1000ms
        logsEnabled = result[LOGS_KEY] === true; // Default to false

        // Update selects
        intervalSelect.value = checkInterval.toString();
        logsSelect.value = logsEnabled.toString();

        updateUI();
        console.log('[TW Bot Helper] Loaded state:', isEnabled, 'interval:', checkInterval, 'logs:', logsEnabled);
    } catch (e) {
        console.error('[TW Bot Helper] Error loading state:', e);
    }
}

// Update UI based on state
function updateUI() {
    if (isEnabled) {
        toggleBtn.textContent = 'ON';
        toggleBtn.className = 'toggle-btn on';
        statusText.textContent = 'Detecting...';
        statusText.className = 'status-text active';
    } else {
        toggleBtn.textContent = 'OFF';
        toggleBtn.className = 'toggle-btn off';
        statusText.textContent = 'Disabled';
        statusText.className = 'status-text inactive';
    }
}

// Toggle enabled state
async function toggle() {
    isEnabled = !isEnabled;

    try {
        // Save to storage
        await chrome.storage.local.set({ [STORAGE_KEY]: isEnabled });
        console.log('[TW Bot Helper] Saved state:', isEnabled);

        // Update UI
        updateUI();

        // Notify content scripts
        notifyContentScripts();
    } catch (e) {
        console.error('[TW Bot Helper] Error toggling:', e);
    }
}

// Handle interval change
async function changeInterval() {
    checkInterval = parseInt(intervalSelect.value);

    try {
        // Save to storage
        await chrome.storage.local.set({ [INTERVAL_KEY]: checkInterval });
        console.log('[TW Bot Helper] Saved interval:', checkInterval);

        // Notify content scripts to restart with new interval
        notifyContentScripts();
    } catch (e) {
        console.error('[TW Bot Helper] Error changing interval:', e);
    }
}

// Handle logs toggle change
async function changeLogs() {
    logsEnabled = logsSelect.value === 'true';

    try {
        // Save to storage
        await chrome.storage.local.set({ [LOGS_KEY]: logsEnabled });
        console.log('[TW Bot Helper] Saved logs:', logsEnabled);

        // Notify content scripts
        notifyContentScripts();
    } catch (e) {
        console.error('[TW Bot Helper] Error changing logs:', e);
    }
}

// Notify all Tribal Wars tabs
async function notifyContentScripts() {
    try {
        const tabs = await chrome.tabs.query({
            url: [
                'https://*.tribalwars.net/*',
                'https://*.klanhaboru.hu/*'
            ]
        });

        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'UPDATE_SETTINGS',
                    enabled: isEnabled,
                    interval: checkInterval,
                    logs: logsEnabled
                });
            } catch (e) {
                // Tab might not have content script
                console.log('[TW Bot Helper] Could not notify tab:', tab.id);
            }
        }
    } catch (e) {
        console.error('[TW Bot Helper] Error notifying tabs:', e);
    }
}

// Event listeners
toggleBtn.addEventListener('click', toggle);
intervalSelect.addEventListener('change', changeInterval);
logsSelect.addEventListener('change', changeLogs);

// Listen for storage changes (from other sources)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes[STORAGE_KEY]) {
            isEnabled = changes[STORAGE_KEY].newValue !== false;
            updateUI();
        }
        if (changes[INTERVAL_KEY]) {
            checkInterval = changes[INTERVAL_KEY].newValue || 1000;
            intervalSelect.value = checkInterval.toString();
        }
        if (changes[LOGS_KEY]) {
            logsEnabled = changes[LOGS_KEY].newValue === true;
            logsSelect.value = logsEnabled.toString();
        }
    }
});

// Initialize
loadState();
