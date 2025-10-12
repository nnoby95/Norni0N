// Debug script to test hCaptcha detection and sitekey extraction
// Run this in the browser console on the Tribal Wars page with hCaptcha

console.log('🔍 hCaptcha Debug Script Starting...');

// Function to find all hCaptcha elements
function findHCaptchaElements() {
    console.log('📋 Searching for hCaptcha elements...');
    
    // Look for iframes
    const iframes = document.querySelectorAll('iframe[src*="hcaptcha.com"]');
    console.log(`Found ${iframes.length} hCaptcha iframes:`, iframes);
    
    iframes.forEach((iframe, index) => {
        console.log(`Iframe ${index + 1}:`, {
            src: iframe.src,
            id: iframe.id,
            className: iframe.className
        });
    });
    
    // Look for hCaptcha divs
    const hcaptchaDivs = document.querySelectorAll('.h-captcha, [data-hcaptcha-widget-id]');
    console.log(`Found ${hcaptchaDivs.length} hCaptcha divs:`, hcaptchaDivs);
    
    hcaptchaDivs.forEach((div, index) => {
        console.log(`Div ${index + 1}:`, {
            sitekey: div.dataset.sitekey,
            widgetId: div.dataset.hcaptchaWidgetId,
            className: div.className
        });
    });
    
    // Look for sitekey attributes
    const sitekeyElements = document.querySelectorAll('[data-sitekey]');
    console.log(`Found ${sitekeyElements.length} elements with data-sitekey:`, sitekeyElements);
    
    sitekeyElements.forEach((el, index) => {
        console.log(`Element ${index + 1}:`, {
            sitekey: el.dataset.sitekey,
            tagName: el.tagName,
            className: el.className
        });
    });
    
    return {
        iframes: iframes,
        divs: hcaptchaDivs,
        sitekeyElements: sitekeyElements
    };
}

// Function to extract sitekey
function extractSitekey() {
    console.log('🔑 Extracting sitekey...');
    
    let sitekey = null;
    
    // Method 1: Check iframe URL
    const iframes = document.querySelectorAll('iframe[src*="hcaptcha.com"]');
    if (iframes.length > 0) {
        const iframeSrc = iframes[0].src;
        console.log('Iframe src:', iframeSrc);
        
        // Try different patterns
        const patterns = [
            /[?&]sitekey=([^&]+)/,
            /\/sitekey\/([^\/\?&]+)/,
            /[#&]sitekey=([^&]+)/
        ];
        
        for (let pattern of patterns) {
            const match = iframeSrc.match(pattern);
            if (match) {
                sitekey = decodeURIComponent(match[1]);
                console.log('✅ Sitekey found in iframe URL:', sitekey);
                break;
            }
        }
    }
    
    // Method 2: Check data-sitekey attributes
    if (!sitekey) {
        const elements = document.querySelectorAll('[data-sitekey]');
        if (elements.length > 0) {
            sitekey = elements[0].dataset.sitekey;
            console.log('✅ Sitekey found in data-sitekey:', sitekey);
        }
    }
    
    // Method 3: Check scripts
    if (!sitekey) {
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
            const content = script.textContent || script.innerHTML || '';
            const match = content.match(/sitekey['"]\s*:\s*['"]([^'"]+)['"]/);
            if (match) {
                sitekey = match[1];
                console.log('✅ Sitekey found in script:', sitekey);
                break;
            }
        }
    }
    
    // Method 4: Check window.hcaptcha
    if (!sitekey && window.hcaptcha) {
        if (window.hcaptcha.sitekey) {
            sitekey = window.hcaptcha.sitekey;
            console.log('✅ Sitekey found in window.hcaptcha:', sitekey);
        }
    }
    
    if (!sitekey) {
        console.log('❌ No sitekey found!');
        sitekey = '10000000-ffff-ffff-ffff-000000000001'; // Test sitekey
        console.log('⚠️ Using test sitekey:', sitekey);
    }
    
    return sitekey;
}

// Function to check response fields
function checkResponseFields() {
    console.log('📝 Checking response fields...');
    
    const hCaptchaResponse = document.querySelector('[name="h-captcha-response"]');
    const gRecaptchaResponse = document.querySelector('[name="g-recaptcha-response"]');
    
    console.log('h-captcha-response field:', hCaptchaResponse);
    console.log('g-recaptcha-response field:', gRecaptchaResponse);
    
    if (hCaptchaResponse) {
        console.log('✅ Found h-captcha-response textarea');
        console.log('  - Display:', hCaptchaResponse.style.display);
        console.log('  - Visibility:', hCaptchaResponse.style.visibility);
        console.log('  - Value:', hCaptchaResponse.value);
    }
    
    if (gRecaptchaResponse) {
        console.log('✅ Found g-recaptcha-response textarea');
        console.log('  - Display:', gRecaptchaResponse.style.display);
        console.log('  - Visibility:', gRecaptchaResponse.style.visibility);
        console.log('  - Value:', gRecaptchaResponse.value);
    }
    
    if (!hCaptchaResponse && !gRecaptchaResponse) {
        console.log('❌ No response fields found!');
    }
    
    return {
        hCaptchaResponse: hCaptchaResponse,
        gRecaptchaResponse: gRecaptchaResponse
    };
}

// Function to test API call
async function testAPICall(sitekey) {
    console.log('🧪 Testing API call...');
    
    const apiKey = prompt('Enter your 2captcha API key:');
    if (!apiKey) {
        console.log('❌ No API key provided');
        return;
    }
    
    const pageUrl = window.location.href;
    console.log('Page URL:', pageUrl);
    
    try {
        const submitUrl = `https://2captcha.com/in.php?key=${apiKey}&method=hcaptcha&sitekey=${sitekey}&pageurl=${encodeURIComponent(pageUrl)}&invisible=1&json=1`;
        console.log('Submitting to:', submitUrl.replace(apiKey, 'API_KEY_HIDDEN'));
        
        const response = await fetch(submitUrl);
        const data = await response.json();
        
        console.log('API Response:', data);
        
        if (data.status === 1) {
            console.log('✅ Captcha submitted successfully!');
            console.log('Task ID:', data.request);
            console.log('⏳ This would normally take 15-30 seconds to solve...');
        } else {
            console.log('❌ API Error:', data.request);
        }
        
    } catch (error) {
        console.log('❌ Network Error:', error);
    }
}

// Run all debug functions
console.log('🚀 Running hCaptcha debug analysis...');

const elements = findHCaptchaElements();
const sitekey = extractSitekey();
const responseFields = checkResponseFields();

console.log('📊 Summary:');
console.log('- hCaptcha iframes:', elements.iframes.length);
console.log('- hCaptcha divs:', elements.divs.length);
console.log('- Sitekey found:', sitekey);
console.log('- Response fields:', responseFields.hCaptchaResponse ? 'h-captcha-response' : 'none', responseFields.gRecaptchaResponse ? 'g-recaptcha-response' : 'none');

console.log('💡 To test API call, run: testAPICall("' + sitekey + '")');

// Make functions available globally
window.debugHCaptcha = {
    findElements: findHCaptchaElements,
    extractSitekey: extractSitekey,
    checkResponseFields: checkResponseFields,
    testAPI: testAPICall
};

console.log('🔧 Debug functions available as window.debugHCaptcha');
