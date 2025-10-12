// Chrome Extension Popup Script for hCaptcha Auto-Solver

console.log('🚀 hCaptcha Auto-Solver Popup loaded');

// DOM elements
const configForm = document.getElementById('config-form');
const serviceSelect = document.getElementById('service');
const apiKeyInput = document.getElementById('api-key');
const autoSolveCheckbox = document.getElementById('auto-solve');
const saveBtn = document.getElementById('save-btn');
const testBtn = document.getElementById('test-btn');
const loading = document.getElementById('loading');
const status = document.getElementById('status');
const statusTitle = document.getElementById('status-title');
const statusMessage = document.getElementById('status-message');
const solveCount = document.getElementById('solve-count');
const lastSolve = document.getElementById('last-solve');
const currentStatus = document.getElementById('current-status');

// Configuration keys
const STORAGE_KEYS = {
    SERVICE: 'tw_captcha_service',
    API_KEY: 'tw_captcha_api_key',
    AUTO_SOLVE: 'tw_captcha_auto_solve',
    SOLVE_STATUS: 'tw_captcha_solve_status',
    LAST_SOLVE_TIME: 'tw_captcha_last_solve',
    SOLVE_COUNT: 'tw_captcha_solve_count',
    ERROR_LOG: 'tw_captcha_error_log'
};

// Initialize popup
async function init() {
    console.log('Popup: Initializing...');
    
    try {
        // Load current configuration
        await loadConfig();
        
        // Load statistics
        await loadStatistics();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('Popup: Initialized successfully');
        
    } catch (error) {
        console.error('Popup: Initialization failed:', error);
        showStatus('error', 'Initialization Failed', error.message);
    }
}

// Load configuration from storage
async function loadConfig() {
    try {
        const result = await chrome.storage.local.get([
            STORAGE_KEYS.SERVICE,
            STORAGE_KEYS.API_KEY,
            STORAGE_KEYS.AUTO_SOLVE
        ]);
        
        // Set form values
        serviceSelect.value = result[STORAGE_KEYS.SERVICE] || '2captcha';
        apiKeyInput.value = result[STORAGE_KEYS.API_KEY] || '';
        autoSolveCheckbox.checked = result[STORAGE_KEYS.AUTO_SOLVE] !== false;
        
        console.log('Popup: Configuration loaded');
        
    } catch (error) {
        console.error('Popup: Error loading config:', error);
        throw error;
    }
}

// Load statistics from storage
async function loadStatistics() {
    try {
        const result = await chrome.storage.local.get([
            STORAGE_KEYS.SOLVE_COUNT,
            STORAGE_KEYS.LAST_SOLVE_TIME,
            STORAGE_KEYS.SOLVE_STATUS
        ]);
        
        // Update solve count
        const count = parseInt(result[STORAGE_KEYS.SOLVE_COUNT] || '0');
        solveCount.textContent = count.toString();
        
        // Update last solve time
        const lastSolveTime = result[STORAGE_KEYS.LAST_SOLVE_TIME];
        if (lastSolveTime) {
            const date = new Date(parseInt(lastSolveTime));
            lastSolve.textContent = date.toLocaleString();
        } else {
            lastSolve.textContent = 'Never';
        }
        
        // Update current status
        const currentStatusValue = result[STORAGE_KEYS.SOLVE_STATUS] || 'idle';
        currentStatus.textContent = currentStatusValue;
        
        console.log('Popup: Statistics loaded');
        
    } catch (error) {
        console.error('Popup: Error loading statistics:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Save button
    saveBtn.addEventListener('click', handleSave);
    
    // Test button
    testBtn.addEventListener('click', handleTest);
    
    // Form submission
    configForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSave();
    });
    
    // Real-time status updates
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            // Update current status if it changed
            if (changes[STORAGE_KEYS.SOLVE_STATUS]) {
                currentStatus.textContent = changes[STORAGE_KEYS.SOLVE_STATUS].newValue || 'idle';
            }
            
            // Update solve count if it changed
            if (changes[STORAGE_KEYS.SOLVE_COUNT]) {
                solveCount.textContent = changes[STORAGE_KEYS.SOLVE_COUNT].newValue || '0';
            }
            
            // Update last solve time if it changed
            if (changes[STORAGE_KEYS.LAST_SOLVE_TIME]) {
                const lastSolveTime = changes[STORAGE_KEYS.LAST_SOLVE_TIME].newValue;
                if (lastSolveTime) {
                    const date = new Date(parseInt(lastSolveTime));
                    lastSolve.textContent = date.toLocaleString();
                }
            }
        }
    });
}

// Handle save button click
async function handleSave() {
    console.log('Popup: Saving configuration...');
    
    try {
        // Get form values
        const service = serviceSelect.value;
        const apiKey = apiKeyInput.value.trim();
        const autoSolve = autoSolveCheckbox.checked;
        
        // Validate input
        if (!apiKey) {
            showStatus('warning', 'Validation Error', 'Please enter an API key');
            return;
        }
        
        // Save to storage
        await chrome.storage.local.set({
            [STORAGE_KEYS.SERVICE]: service,
            [STORAGE_KEYS.API_KEY]: apiKey,
            [STORAGE_KEYS.AUTO_SOLVE]: autoSolve
        });
        
        console.log('Popup: Configuration saved successfully');
        showStatus('success', 'Success', 'Configuration saved successfully!');
        
        // Send message to content scripts to restart detection
        try {
            const tabs = await chrome.tabs.query({
                url: [
                    'https://*.tribalwars.net/game.php*',
                    'https://*.klanhaboru.hu/game.php*'
                ]
            });
            
            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: 'START_DETECTION'
                    });
                } catch (e) {
                    // Tab might not have content script loaded yet
                    console.log('Popup: Could not send message to tab:', tab.id);
                }
            }
        } catch (e) {
            console.log('Popup: Could not send restart message to tabs');
        }
        
    } catch (error) {
        console.error('Popup: Error saving configuration:', error);
        showStatus('error', 'Save Failed', error.message);
    }
}

// Handle test button click
async function handleTest() {
    console.log('Popup: Testing API...');
    
    try {
        // Get form values
        const service = serviceSelect.value;
        const apiKey = apiKeyInput.value.trim();
        
        // Validate input
        if (!apiKey) {
            showStatus('warning', 'Validation Error', 'Please enter an API key first');
            return;
        }
        
        // Show loading
        showLoading(true);
        hideStatus();
        
        // Send test request to background script
        const response = await chrome.runtime.sendMessage({
            type: 'TEST_API',
            service: service,
            apiKey: apiKey
        });
        
        // Hide loading
        showLoading(false);
        
        // Show result
        if (response.success) {
            showStatus('success', 'API Test Successful', response.message);
        } else {
            showStatus('error', 'API Test Failed', response.error);
        }
        
    } catch (error) {
        console.error('Popup: Error testing API:', error);
        showLoading(false);
        showStatus('error', 'Test Failed', error.message);
    }
}

// Show/hide loading indicator
function showLoading(show) {
    if (show) {
        loading.style.display = 'block';
        saveBtn.disabled = true;
        testBtn.disabled = true;
    } else {
        loading.style.display = 'none';
        saveBtn.disabled = false;
        testBtn.disabled = false;
    }
}

// Show status message
function showStatus(type, title, message) {
    status.className = `status ${type}`;
    statusTitle.textContent = title;
    statusMessage.textContent = message;
    status.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideStatus();
    }, 5000);
}

// Hide status message
function hideStatus() {
    status.style.display = 'none';
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
