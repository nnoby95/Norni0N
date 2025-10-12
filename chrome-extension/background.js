// Chrome Extension Background Script for hCaptcha Auto-Solver
// This handles API communication and cross-frame messaging

console.log('🚀 hCaptcha Auto-Solver Background Script loaded');

// Configuration
const STORAGE_KEYS = {
    SERVICE: 'tw_captcha_service',
    API_KEY: 'tw_captcha_api_key',
    AUTO_SOLVE: 'tw_captcha_auto_solve',
    SOLVE_REQUEST: 'tw_captcha_solve_request',
    SOLVE_STATUS: 'tw_captcha_solve_status',
    SOLVE_RESULT: 'tw_captcha_solve_result',
    LAST_SOLVE_TIME: 'tw_captcha_last_solve',
    SOLVE_COUNT: 'tw_captcha_solve_count',
    ERROR_LOG: 'tw_captcha_error_log'
};

const SOLVING_STATUS = {
    IDLE: 'idle',
    DETECTING: 'detecting',
    CLICKING: 'clicking',
    SOLVING: 'solving',
    SOLVED: 'solved',
    ERROR: 'error'
};

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.type) {
        case 'SOLVE_CAPTCHA':
            handleSolveCaptcha(message, sendResponse);
            return true; // Keep message channel open for async response
            
        case 'CHECKBOX_CLICKED':
            handleCheckboxClicked(message, sendResponse);
            break;
            
        case 'UPDATE_STATUS':
            handleUpdateStatus(message, sendResponse);
            break;
            
        case 'GET_CONFIG':
            handleGetConfig(message, sendResponse);
            break;
            
        case 'SET_CONFIG':
            handleSetConfig(message, sendResponse);
            break;
            
        case 'TEST_API':
            handleTestAPI(message, sendResponse);
            return true; // Keep message channel open for async response
            
        default:
            console.log('Unknown message type:', message.type);
            sendResponse({ error: 'Unknown message type' });
    }
});

// Handle captcha solving request
async function handleSolveCaptcha(message, sendResponse) {
    try {
        console.log('Background: Starting captcha solve process');
        
        const { sitekey, pageUrl } = message;
        if (!sitekey) {
            throw new Error('No sitekey provided');
        }
        
        // Get API configuration
        const result = await chrome.storage.local.get(['API_KEY', 'SERVICE']);
        const apiKey = result.API_KEY;
        const service = result.SERVICE || '2captcha';
        
        if (!apiKey) {
            throw new Error('API key not configured');
        }
        
        console.log(`Background: Solving with ${service}, sitekey: ${sitekey}`);
        
        let token;
        if (service === 'capsolver') {
            token = await solveCapSolver(apiKey, sitekey, pageUrl);
        } else {
            token = await solve2Captcha(apiKey, sitekey, pageUrl);
        }
        
        console.log('Background: Captcha solved successfully!');
        
        // Update statistics
        await updateStatistics();
        
        // Send result back to content script
        sendResponse({
            success: true,
            token: token,
            service: service
        });
        
    } catch (error) {
        console.error('Background: Captcha solve failed:', error);
        
        // Log error
        await logError(error.message);
        
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// Handle checkbox clicked notification
function handleCheckboxClicked(message, sendResponse) {
    console.log('Background: Checkbox clicked in iframe');
    
    // Update status
    chrome.storage.local.set({
        [STORAGE_KEYS.SOLVE_STATUS]: SOLVING_STATUS.CLICKING
    });
    
    sendResponse({ success: true });
}

// Handle status updates
function handleUpdateStatus(message, sendResponse) {
    const { status, message: statusMessage } = message;
    
    chrome.storage.local.set({
        [STORAGE_KEYS.SOLVE_STATUS]: status
    });
    
    console.log(`Background: Status updated to ${status}: ${statusMessage}`);
    sendResponse({ success: true });
}

// Handle config requests
async function handleGetConfig(message, sendResponse) {
    try {
        const { key } = message;
        const result = await chrome.storage.local.get([key]);
        const value = result[key];
        
        sendResponse({
            success: true,
            value: value
        });
    } catch (error) {
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// Handle config updates
async function handleSetConfig(message, sendResponse) {
    try {
        const { key, value } = message;
        await chrome.storage.local.set({ [key]: value });
        
        console.log(`Background: Config updated: ${key} = ${value}`);
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// Handle API testing
async function handleTestAPI(message, sendResponse) {
    try {
        const { service, apiKey } = message;
        
        if (!apiKey) {
            throw new Error('API key not provided');
        }
        
        // Use a test sitekey
        const testSitekey = '10000000-ffff-ffff-ffff-000000000001';
        const testUrl = 'https://example.com';
        
        console.log(`Background: Testing ${service} API with key: ${apiKey.substring(0, 10)}...`);
        
        let token;
        if (service === 'capsolver') {
            token = await solveCapSolver(apiKey, testSitekey, testUrl);
        } else {
            token = await solve2Captcha(apiKey, testSitekey, testUrl);
        }
        
        console.log('Background: API test successful!');
        
        sendResponse({
            success: true,
            message: `API test successful! Token received: ${token.substring(0, 50)}...`
        });
        
    } catch (error) {
        console.error('Background: API test failed:', error);
        
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// 2captcha API solving
async function solve2Captcha(apiKey, sitekey, pageUrl) {
    console.log('Background: Submitting to 2captcha...');
    console.log(`Background: Sitekey: ${sitekey}`);
    console.log(`Background: Page URL: ${pageUrl}`);
    
    // Submit captcha using GET method as per 2captcha API documentation
    const submitUrl = `https://2captcha.com/in.php?key=${apiKey}&method=hcaptcha&sitekey=${sitekey}&pageurl=${encodeURIComponent(pageUrl)}&invisible=1&json=1`;
    
    console.log(`Background: Submitting to: ${submitUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const submitResponse = await fetch(submitUrl);
    
    const submitData = await submitResponse.json();
    
    if (submitData.status !== 1) {
        throw new Error(`2captcha submit failed: ${submitData.request || 'Unknown error'}`);
    }
    
    const taskId = submitData.request;
    console.log(`Background: 2captcha task submitted: ${taskId}`);
    
    // Poll for result (wait 15 seconds initially)
    const maxAttempts = 60;
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds initially
    
    for (let i = 0; i < maxAttempts; i++) {
        const resultUrl = `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${taskId}&json=1`;
        console.log(`Background: Checking result (attempt ${i + 1}/${maxAttempts})...`);
        
        const resultResponse = await fetch(resultUrl);
        const resultData = await resultResponse.json();
        
        if (resultData.status === 1) {
            console.log('Background: 2captcha solved successfully!');
            return resultData.request;
        }
        
        if (resultData.request === 'CAPCHA_NOT_READY') {
            console.log(`Background: 2captcha solving... attempt ${i + 1}/${maxAttempts} (not ready yet)`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before next check
            continue;
        }
        
        // If it's an error, log it but don't throw immediately
        console.log(`Background: 2captcha response: ${resultData.request}`);
        if (resultData.request.includes('ERROR_')) {
            throw new Error(`2captcha error: ${resultData.request}`);
        }
    }
    
    throw new Error('2captcha timeout - took too long to solve');
}

// CapSolver API solving
async function solveCapSolver(apiKey, sitekey, pageUrl) {
    console.log('Background: Submitting to CapSolver...');
    
    // Create task
    const createTaskUrl = 'https://api.capsolver.com/createTask';
    const createTaskData = {
        clientKey: apiKey,
        task: {
            type: 'HCaptchaTaskProxyLess',
            websiteURL: pageUrl,
            websiteKey: sitekey
        }
    };
    
    const createResponse = await fetch(createTaskUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createTaskData)
    });
    const createResult = await createResponse.json();
    
    if (createResult.errorId !== 0) {
        throw new Error(`CapSolver error: ${createResult.errorDescription || 'Unknown error'}`);
    }
    
    const taskId = createResult.taskId;
    console.log(`Background: CapSolver task created: ${taskId}`);
    
    // Poll for result
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const getResultUrl = 'https://api.capsolver.com/getTaskResult';
        const getResultData = {
            clientKey: apiKey,
            taskId: taskId
        };
        
        const resultResponse = await fetch(getResultUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(getResultData)
        });
        const resultData = await resultResponse.json();
        
        if (resultData.errorId !== 0) {
            throw new Error(`CapSolver error: ${resultData.errorDescription}`);
        }
        
        if (resultData.status === 'ready') {
            console.log('Background: CapSolver solved successfully!');
            return resultData.solution.gRecaptchaResponse;
        }
        
        console.log(`Background: CapSolver solving... attempt ${i + 1}/${maxAttempts}`);
    }
    
    throw new Error('CapSolver timeout - took too long to solve');
}

// Update statistics
async function updateStatistics() {
    try {
        const now = Date.now();
        
        // Update last solve time
        await chrome.storage.local.set({
            [STORAGE_KEYS.LAST_SOLVE_TIME]: now.toString()
        });
        
        // Update solve count
        const result = await chrome.storage.local.get([STORAGE_KEYS.SOLVE_COUNT]);
        const currentCount = parseInt(result[STORAGE_KEYS.SOLVE_COUNT] || '0');
        await chrome.storage.local.set({
            [STORAGE_KEYS.SOLVE_COUNT]: (currentCount + 1).toString()
        });
        
        console.log(`Background: Statistics updated - Total solves: ${currentCount + 1}`);
        
    } catch (error) {
        console.error('Background: Error updating statistics:', error);
    }
}

// Log error
async function logError(errorMessage) {
    try {
        const result = await chrome.storage.local.get([STORAGE_KEYS.ERROR_LOG]);
        const errorLog = JSON.parse(result[STORAGE_KEYS.ERROR_LOG] || '[]');
        
        errorLog.push({
            timestamp: Date.now(),
            error: errorMessage
        });
        
        // Keep only last 10 errors
        if (errorLog.length > 10) {
            errorLog.shift();
        }
        
        await chrome.storage.local.set({
            [STORAGE_KEYS.ERROR_LOG]: JSON.stringify(errorLog)
        });
        
        console.log('Background: Error logged:', errorMessage);
        
    } catch (error) {
        console.error('Background: Error logging error:', error);
    }
}

// Initialize background script
function init() {
    console.log('Background: Initializing hCaptcha Auto-Solver...');
    
    // Set default configuration if not exists
    chrome.storage.local.get(['API_KEY', 'SERVICE', 'AUTO_SOLVE']).then(result => {
        const defaults = {
            API_KEY: result.API_KEY || '',
            SERVICE: result.SERVICE || '2captcha',
            AUTO_SOLVE: result.AUTO_SOLVE !== undefined ? result.AUTO_SOLVE : true
        };
        
        chrome.storage.local.set(defaults);
        console.log('Background: Default configuration set');
    });
    
    console.log('Background: Ready to handle captcha solving requests');
}

// Start initialization
init();
