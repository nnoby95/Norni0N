// Tribal Wars Bot Helper - Background Script
// Minimal background script for extension state management

console.log('[TW Bot Helper] Background script loaded');

const STORAGE_KEY = 'tw_bot_helper_enabled';

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[TW Bot Helper] Background received:', message);

    switch (message.type) {
        case 'GET_ENABLED':
            chrome.storage.local.get([STORAGE_KEY]).then(result => {
                const enabled = result[STORAGE_KEY] !== false;
                sendResponse({ enabled });
            });
            return true; // Keep channel open for async

        case 'SET_ENABLED':
            chrome.storage.local.set({ [STORAGE_KEY]: message.enabled }).then(() => {
                console.log(`[TW Bot Helper] Extension ${message.enabled ? 'enabled' : 'disabled'}`);
                sendResponse({ success: true });
            });
            return true;

        case 'CHECKBOX_CLICKED':
            console.log('[TW Bot Helper] Checkbox clicked in hCaptcha iframe');
            sendResponse({ success: true });
            break;

        default:
            sendResponse({ error: 'Unknown message type' });
    }
});

// Initialize with default enabled state
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get([STORAGE_KEY]).then(result => {
        if (result[STORAGE_KEY] === undefined) {
            chrome.storage.local.set({ [STORAGE_KEY]: true });
            console.log('[TW Bot Helper] Initialized with default enabled state');
        }
    });
});

console.log('[TW Bot Helper] Background script ready');
