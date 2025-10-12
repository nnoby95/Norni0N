// Chrome Extension Content Script for hCaptcha Auto-Solver
// This runs in ALL frames, including hCaptcha iframes!

console.log('🚀 hCaptcha Auto-Solver Extension loaded in frame:', window.location.href);

// Configuration
const STORAGE_KEYS = {
    SERVICE: 'tw_captcha_service',
    API_KEY: 'tw_captcha_api_key',
    AUTO_SOLVE: 'tw_captcha_auto_solve',
    SOLVE_REQUEST: 'tw_captcha_solve_request',
    SOLVE_STATUS: 'tw_captcha_solve_status',
    SOLVE_RESULT: 'tw_captcha_solve_result'
};

const SOLVING_STATUS = {
    IDLE: 'idle',
    DETECTING: 'detecting',
    CLICKING: 'clicking',
    SOLVING: 'solving',
    SOLVED: 'solved',
    ERROR: 'error'
};

// Global state
let currentStatus = SOLVING_STATUS.IDLE;
let detectionInterval = null;
let solveAttempts = 0;
let maxRetries = 3;
let lastClickedElement = null;
let lastClickTime = 0;

// Utility functions
function log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = '[hCaptcha Extension]';
    
    if (level === 'error') {
        console.error(`${prefix} ${timestamp}`, message);
    } else if (level === 'warn') {
        console.warn(`${prefix} ${timestamp}`, message);
    } else {
        console.log(`${prefix} ${timestamp}`, message);
    }
}

// Storage functions
async function getConfig(key, defaultValue = null) {
    try {
        const result = await chrome.storage.local.get([key]);
        const value = result[key];
        if (value === null || value === undefined) return defaultValue;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    } catch (e) {
        console.error('[hCaptcha] Error reading config:', e);
        return defaultValue;
    }
}

async function setConfig(key, value) {
    try {
        await chrome.storage.local.set({ [key]: value });
        return true;
    } catch (e) {
        console.error('[hCaptcha] Error saving config:', e);
        return false;
    }
}

function updateStatus(status, message = '') {
    currentStatus = status;
    setConfig('SOLVE_STATUS', status);
    log(`Status: ${status}${message ? ' - ' + message : ''}`);
}

// Check if we're in the main Tribal Wars page
function isMainPage() {
    return window.location.hostname.includes('tribalwars.net') || 
           window.location.hostname.includes('klanhaboru.hu');
}

// Check if we're in an hCaptcha iframe
function isHCaptchaIframe() {
    return window.location.hostname.includes('hcaptcha.com');
}

// Bot protection flow detection (only on main page)
function detectAndClickBotElements() {
    if (!isMainPage()) return { found: false, step: 0 };
    
    const now = Date.now();
    
    // Step 0: Check for "Start bot protection check" button (Hungarian)
    const startButtons = document.querySelectorAll('button, input[type="button"], a');
    for (let button of startButtons) {
        const text = button.textContent || button.value || '';
        if (text.includes('Kezdd meg a botvédelem ellenőrzését') || 
            text.includes('botvédelem ellenőrzését') ||
            text.includes('Start the bot protection check')) {
            
            if (lastClickedElement === 'start_button' && (now - lastClickTime) < 3000) {
                continue;
            }
            
            log('Detected "Start bot protection check" button - clicking...', 'info');
            updateStatus(SOLVING_STATUS.CLICKING, 'Starting bot protection check');
            
            try {
                button.click();
                lastClickedElement = 'start_button';
                lastClickTime = now;
                return { found: true, step: 0, element: 'start_button' };
            } catch (e) {
                log('Error clicking start button: ' + e, 'error');
            }
        }
    }
    
    // Step 1: Check for #botprotection_quest (common)
    const botQuest = document.getElementById('botprotection_quest');
    if (botQuest) {
        if (lastClickedElement === 'botprotection_quest' && (now - lastClickTime) < 5000) {
            return { found: false, step: 0 };
        }
        
        log('Detected #botprotection_quest - clicking...', 'info');
        updateStatus(SOLVING_STATUS.CLICKING, 'Clicking bot quest');
        
        try {
            botQuest.click();
            lastClickedElement = 'botprotection_quest';
            lastClickTime = now;
            return { found: true, step: 1, element: 'botprotection_quest' };
        } catch (e) {
            log('Error clicking botprotection_quest: ' + e, 'error');
        }
    }

    // Step 1b: Check for "Begin bot protection check" button (alternative - English & Hungarian)
    const beginButtons = document.querySelectorAll('a.btn.btn-default, .btn.btn-default');
    for (let button of beginButtons) {
        const text = button.textContent || button.innerText || '';
        
        // English and Hungarian text detection
        if (text.includes('Begin bot protection check') || 
            text.includes('bot protection check') ||
            text.includes('Kezdd meg a botvédelem ellenőrzését') ||
            text.includes('botvédelem ellenőrzését') ||
            text.includes('Bot védelem') ||
            text.includes('bot védelem')) {
            
            if (lastClickedElement === 'begin_button' && (now - lastClickTime) < 5000) {
                return { found: false, step: 0 };
            }
            
            log(`Detected "Begin bot protection check" button: "${text.trim()}" - clicking...`, 'info');
            updateStatus(SOLVING_STATUS.CLICKING, 'Clicking begin bot protection');
            
            try {
                button.click();
                lastClickedElement = 'begin_button';
                lastClickTime = now;
                return { found: true, step: 1, element: 'begin_button' };
            } catch (e) {
                log('Error clicking begin button: ' + e, 'error');
            }
        }
    }

    // Step 2: REMOVED - No longer check for checkboxes in main document
    // The hCaptcha iframe script will handle the "I am human" checkbox

    return { found: false, step: 0 };
}

// hCaptcha checkbox clicking (only in hCaptcha iframe)
function clickHCaptchaCheckbox() {
    if (!isHCaptchaIframe()) return false;
    
    log('🎯 In hCaptcha iframe - looking for checkbox...', 'info');
    
    try {
        // Look for the checkbox with ID "checkbox" (from your HTML)
        const checkbox = document.querySelector('#checkbox');
        if (checkbox) {
            log('✅ Found hCaptcha checkbox - clicking!', 'info');
            
            // Click the checkbox
            checkbox.click();
            checkbox.checked = true;
            
            // Trigger events
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            checkbox.dispatchEvent(new Event('click', { bubbles: true }));
            
            log('✅ hCaptcha checkbox clicked successfully!', 'info');
            
            // Notify the main page
            chrome.runtime.sendMessage({
                type: 'CHECKBOX_CLICKED',
                success: true
            });
            
            return true;
        } else {
            log('❌ Checkbox not found in hCaptcha iframe', 'warn');
            return false;
        }
    } catch (e) {
        log('❌ Error clicking hCaptcha checkbox: ' + e, 'error');
        return false;
    }
}

// hCaptcha detection (only on main page) - ONLY detect iframes, don't touch main page checkboxes
function detectHCaptchaWidget() {
    if (!isMainPage()) return { found: false };
    
    log('🔍 Scanning for hCaptcha iframes only...', 'info');
    
    // ONLY look for hCaptcha iframes - let iframe script handle the checkbox
    const hcaptchaIframes = document.querySelectorAll('iframe[src*="hcaptcha.com"]');
    if (hcaptchaIframes.length > 0) {
        log('✅ Detected hCaptcha iframe - iframe script will handle checkbox clicking', 'info');
        return { found: true, type: 'iframe', element: hcaptchaIframes[0] };
    }
    
    log('No hCaptcha iframe detected', 'info');
    return { found: false };
}

// Extract captcha data (only on main page)
function extractCaptchaData() {
    if (!isMainPage()) return null;
    
    const hcaptcha = detectHCaptchaWidget();
    if (!hcaptcha.found) return null;

    let sitekey = null;
    
    // Check the element itself
    if (hcaptcha.element.dataset && hcaptcha.element.dataset.sitekey) {
        sitekey = hcaptcha.element.dataset.sitekey;
    }

    // Check parent elements
    if (!sitekey) {
        let parent = hcaptcha.element.parentElement;
        while (parent && !sitekey) {
            if (parent.dataset && parent.dataset.sitekey) {
                sitekey = parent.dataset.sitekey;
                break;
            }
            parent = parent.parentElement;
        }
    }

    // Search all elements with data-sitekey
    if (!sitekey) {
        const elementsWithSitekey = document.querySelectorAll('[data-sitekey]');
        if (elementsWithSitekey.length > 0) {
            sitekey = elementsWithSitekey[0].dataset.sitekey;
        }
    }

    // Extract from iframe URL (multiple patterns)
    if (!sitekey && hcaptcha.type === 'iframe') {
        const iframe = hcaptcha.element;
        const iframeSrc = iframe.src || '';
        
        log('Iframe src URL: ' + iframeSrc, 'info');
        
        // Pattern 1: sitekey parameter
        let sitekeyMatch = iframeSrc.match(/[?&]sitekey=([^&]+)/);
        if (sitekeyMatch) {
            sitekey = decodeURIComponent(sitekeyMatch[1]);
            log('Extracted sitekey from iframe URL (param): ' + sitekey, 'info');
        }
        
        // Pattern 2: sitekey in path
        if (!sitekey) {
            sitekeyMatch = iframeSrc.match(/\/sitekey\/([^\/\?&]+)/);
            if (sitekeyMatch) {
                sitekey = decodeURIComponent(sitekeyMatch[1]);
                log('Extracted sitekey from iframe URL (path): ' + sitekey, 'info');
            }
        }
        
        // Pattern 3: sitekey in hash
        if (!sitekey) {
            sitekeyMatch = iframeSrc.match(/[#&]sitekey=([^&]+)/);
            if (sitekeyMatch) {
                sitekey = decodeURIComponent(sitekeyMatch[1]);
                log('Extracted sitekey from iframe URL (hash): ' + sitekey, 'info');
            }
        }
    }

    // Look in scripts
    if (!sitekey) {
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
            const content = script.textContent || script.innerHTML || '';
            const sitekeyMatch = content.match(/sitekey['"]\s*:\s*['"]([^'"]+)['"]/);
            if (sitekeyMatch) {
                sitekey = sitekeyMatch[1];
                log('Extracted sitekey from script: ' + sitekey, 'info');
                break;
            }
        }
    }

    // Use test sitekey if not found
    if (!sitekey) {
        log('Could not find hCaptcha sitekey, using test sitekey', 'warn');
        sitekey = '10000000-ffff-ffff-ffff-000000000001';
    }

    return {
        sitekey: sitekey,
        url: window.location.href,
        element: hcaptcha.element,
        type: hcaptcha.type
    };
}

// API solving functions
async function solve2Captcha(sitekey, pageUrl) {
    const apiKey = await getConfig('API_KEY');
    if (!apiKey) {
        throw new Error('2captcha API key not configured');
    }

    log('Submitting to 2captcha...', 'info');
    log(`Sitekey: ${sitekey}`, 'info');
    log(`Page URL: ${pageUrl}`, 'info');

    // Submit captcha using GET method as per 2captcha API documentation
    const submitUrl = `https://2captcha.com/in.php?key=${apiKey}&method=hcaptcha&sitekey=${sitekey}&pageurl=${encodeURIComponent(pageUrl)}&invisible=1&json=1`;
    
    log(`Submitting to: ${submitUrl.replace(apiKey, 'API_KEY_HIDDEN')}`, 'info');
    
    const submitResponse = await fetch(submitUrl);
    
    const submitData = await submitResponse.json();

    if (submitData.status !== 1) {
        throw new Error(`2captcha submit failed: ${submitData.request || 'Unknown error'}`);
    }

    const taskId = submitData.request;
    log(`2captcha task submitted: ${taskId}`, 'info');

    // Poll for result (wait longer initially)
    const maxAttempts = 60;
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds initially
    
    for (let i = 0; i < maxAttempts; i++) {
        const resultUrl = `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${taskId}&json=1`;
        log(`Checking result (attempt ${i + 1}/${maxAttempts})...`, 'info');
        
        const resultResponse = await fetch(resultUrl);
        const resultData = await resultResponse.json();

        if (resultData.status === 1) {
            log('2captcha solved successfully!', 'info');
            return resultData.request;
        }

        if (resultData.request === 'CAPCHA_NOT_READY') {
            log(`2captcha solving... attempt ${i + 1}/${maxAttempts} (not ready yet)`, 'info');
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before next check
            continue;
        }
        
        // If it's an error, log it but don't throw immediately
        log(`2captcha response: ${resultData.request}`, 'warn');
        if (resultData.request.includes('ERROR_')) {
            throw new Error(`2captcha error: ${resultData.request}`);
        }
    }

    throw new Error('2captcha timeout - took too long to solve');
}

async function solveCapSolver(sitekey, pageUrl) {
    const apiKey = await getConfig('API_KEY');
    if (!apiKey) {
        throw new Error('CapSolver API key not configured');
    }

    log('Submitting to CapSolver...', 'info');

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
    log(`CapSolver task created: ${taskId}`, 'info');

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
            log('CapSolver solved successfully!', 'info');
            return resultData.solution.gRecaptchaResponse;
        }

        log(`CapSolver solving... attempt ${i + 1}/${maxAttempts}`, 'info');
    }

    throw new Error('CapSolver timeout - took too long to solve');
}

// Token injection (only on main page)
function injectCaptchaToken(token) {
    if (!isMainPage()) return false;
    
    log('Injecting captcha token...', 'info');

    // Method 1: Find textarea with name g-recaptcha-response or h-captcha-response
    const textareas = document.querySelectorAll('textarea[name="g-recaptcha-response"], textarea[name="h-captcha-response"]');
    if (textareas.length > 0) {
        textareas.forEach(textarea => {
            textarea.value = token;
            textarea.innerHTML = token;
            
            if (textarea.name === 'g-recaptcha-response') {
                textarea.style.display = 'block';
                textarea.style.visibility = 'visible';
            }
            
            const changeEvent = new Event('change', { bubbles: true });
            textarea.dispatchEvent(changeEvent);
            
            const inputEvent = new Event('input', { bubbles: true });
            textarea.dispatchEvent(inputEvent);
        });
        log('Token injected into textarea', 'info');
        return true;
    }

    // Method 2: Try hCaptcha callback
    try {
        if (window.hcaptcha && typeof window.hcaptcha.setResponse === 'function') {
            window.hcaptcha.setResponse(token);
            log('Token set via hcaptcha.setResponse()', 'info');
            return true;
        }
    } catch (e) {
        log('Could not use hcaptcha.setResponse: ' + e, 'warn');
    }

    log('Could not inject token - no suitable method found', 'error');
    return false;
}

// Main solving flow
async function solveCaptcha() {
    if (solveAttempts >= maxRetries) {
        updateStatus(SOLVING_STATUS.ERROR, 'Max retries reached');
        log('Max solve attempts reached. Please solve manually.', 'error');
        return false;
    }

    solveAttempts++;
    log(`🔄 Starting solve attempt ${solveAttempts}/${maxRetries}`, 'info');
    
    try {
        const captchaData = extractCaptchaData();
        if (!captchaData) {
            throw new Error('Could not extract captcha data - no sitekey found');
        }

        log(`📋 Captcha detected - Sitekey: ${captchaData.sitekey}`, 'info');
        log(`🌐 Page URL: ${captchaData.url}`, 'info');
        updateStatus(SOLVING_STATUS.SOLVING, `Attempt ${solveAttempts}/${maxRetries} - Solving...`);

        const service = await getConfig('SERVICE', '2captcha');
        log(`🔧 Using service: ${service}`, 'info');
        
        let token;

        if (service === 'capsolver') {
            token = await solveCapSolver(captchaData.sitekey, captchaData.url);
        } else {
            token = await solve2Captcha(captchaData.sitekey, captchaData.url);
        }

        log(`🎯 Token received: ${token.substring(0, 50)}...`, 'info');
        updateStatus(SOLVING_STATUS.SOLVING, 'Injecting token...');

        const injectionSuccess = injectCaptchaToken(token);

        if (injectionSuccess) {
            updateStatus(SOLVING_STATUS.SOLVED, 'Solved successfully!');
            log(`✅ Captcha solved successfully!`, 'info');
            
            solveAttempts = 0;
            return true;
        } else {
            throw new Error('Token injection failed - could not find response fields');
        }

    } catch (error) {
        log(`❌ Solve attempt ${solveAttempts} failed: ${error.message}`, 'error');
        updateStatus(SOLVING_STATUS.ERROR, `Attempt ${solveAttempts} failed: ${error.message}`);

        if (solveAttempts < maxRetries) {
            const waitTime = Math.min(5000 * solveAttempts, 30000); // Progressive backoff, max 30 seconds
            log(`⏳ Retrying in ${waitTime/1000} seconds... (${solveAttempts}/${maxRetries})`, 'warn');
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return await solveCaptcha();
        }

        log('🚫 All solve attempts exhausted. Please solve manually.', 'error');
        return false;
    }
}

// Detection loop
function startDetection() {
    if (detectionInterval) return;

    log('Starting bot protection detection...', 'info');
    updateStatus(SOLVING_STATUS.DETECTING);
    
    lastClickedElement = null;
    lastClickTime = 0;

    detectionInterval = setInterval(async () => {
        if (currentStatus === SOLVING_STATUS.SOLVING) return;

        const autoSolve = await getConfig('AUTO_SOLVE', true);
        if (!autoSolve) {
            updateStatus(SOLVING_STATUS.IDLE, 'Auto-solve disabled');
            return;
        }

        // Bot protection elements
        const botElements = detectAndClickBotElements();
        if (botElements.found) {
            log(`Bot protection step ${botElements.step} detected`, 'info');
            return;
        }

        // hCaptcha detection - ONLY detect iframe, let iframe script handle checkbox
        const hcaptcha = detectHCaptchaWidget();
        if (hcaptcha.found) {
            log('hCaptcha iframe detected - waiting for iframe script to handle checkbox...', 'info');
            updateStatus(SOLVING_STATUS.CLICKING, 'Waiting for iframe script...');
            
            clearInterval(detectionInterval);
            detectionInterval = null;
            
            // Don't do anything here - just wait for message from iframe script
            // The iframe script will send a message when checkbox is clicked
        }
    }, 1000);
}

// Listen for messages from hCaptcha iframe
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'HCAPTCHA_CHECKBOX_CLICKED') {
        log('✅ Received checkbox clicked notification from hCaptcha iframe!', 'info');
        updateStatus(SOLVING_STATUS.CLICKING, 'Checkbox clicked, waiting for captcha...');
        
        // Wait 3 seconds to see if a captcha challenge appears
        setTimeout(async () => {
            const captchaData = extractCaptchaData();
            if (captchaData && captchaData.sitekey) {
                log('🎯 Captcha challenge detected after checkbox click - solving...', 'info');
                await solveCaptcha();
            } else {
                log('✅ No captcha challenge - just simple checkbox! Bot protection passed ✅', 'info');
                updateStatus(SOLVING_STATUS.SOLVED, 'Simple checkbox solved!');
            }
        }, 3000);
    }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_DETECTION') {
        startDetection();
        sendResponse({ success: true });
    } else if (message.type === 'CHECKBOX_CLICKED') {
        log('✅ Received checkbox clicked notification from iframe', 'info');
        sendResponse({ success: true });
    }
});

// Initialize
function init() {
    if (!document.body) {
        setTimeout(init, 100);
        return;
    }

    log('hCaptcha Auto-Solver Extension initialized', 'info');
    log(`Frame type: ${isMainPage() ? 'Main page' : isHCaptchaIframe() ? 'hCaptcha iframe' : 'Other'}`, 'info');

    // Start detection if on main page
    if (isMainPage()) {
        getConfig('AUTO_SOLVE', true).then(autoSolve => {
            if (autoSolve) {
                startDetection();
            } else {
                updateStatus(SOLVING_STATUS.IDLE, 'Auto-solve disabled');
            }
        });
    }

    // Try to click checkbox if in hCaptcha iframe
    if (isHCaptchaIframe()) {
        setTimeout(() => {
            clickHCaptchaCheckbox();
        }, 500);
    }
}

// Start after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
} else {
    setTimeout(init, 1000);
}
