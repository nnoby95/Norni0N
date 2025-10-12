/**
 * Complete Quest Reward Collector - Standalone Function
 * Handles quest dialog opening, tab navigation, and reward claiming
 */

// Helper function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function - Call this to collect all quest rewards
 * @returns {Promise<Object>} Result object with claimed count and status
 */
async function collectQuestRewards() {
    console.log('Starting quest reward collection...');
    
    // Step 1: Check if quest notification exists and open it
    const questButton = document.getElementById('new_quest');
    if (questButton && questButton.style.display !== 'none') {
        console.log('Quest notification found - opening dialog...');
        questButton.click();
        await sleep(2000); // Wait for dialog to open
    }
    
    // Step 2: Navigate to Rewards tab
    const tabs = document.querySelectorAll('.tab-link');
    let rewardsTab = null;
    
    tabs.forEach(tab => {
        if (tab.textContent.includes('Jutalmak')) {
            rewardsTab = tab;
        }
    });
    
    if (rewardsTab) {
        console.log('Navigating to Rewards tab...');
        rewardsTab.click();
        await sleep(1500); // Wait for tab content to load
    } else {
        console.log('Could not find Rewards tab');
        return { success: false, claimed: 0, message: 'Rewards tab not found' };
    }
    
    // Step 3: Claim all rewards
    let claimedCount = 0;
    let iterationCount = 0;
    const maxIterations = 50;
    let stopReason = 'completed';
    
    while (iterationCount < maxIterations) {
        iterationCount++;
        
        // Get first available claim button
        const firstClaimButton = document.querySelector('#reward-system-rewards .reward-system-claim-button:not([disabled])');
        
        if (!firstClaimButton) {
            stopReason = 'no_more_rewards';
            break;
        }
        
        // Check for storage warning
        const buttonRow = firstClaimButton.closest('tr');
        const warning = buttonRow.querySelector('.small.warn');
        
        if (warning && warning.textContent.includes('túl kevés a hely')) {
            stopReason = 'storage_full';
            console.log('Storage full - stopping collection');
            break;
        }
        
        // Get building info
        const buildingName = buttonRow.querySelector('.building-name')?.textContent || 'Unknown';
        const level = buttonRow.querySelector('td:nth-child(2) strong')?.textContent || '?';
        
        console.log(`[${claimedCount + 1}] Claiming: ${buildingName} Level ${level}`);
        
        // Claim reward
        firstClaimButton.click();
        claimedCount++;
        
        await sleep(200); // Wait between claims
    }
    
    console.log(`Collection complete! Claimed: ${claimedCount} rewards (${stopReason})`);
    
    // Step 4: Close dialog
    await sleep(500);
    const closeButton = document.querySelector('.popup_box_close');
    if (closeButton) {
        closeButton.click();
        console.log('Closed rewards dialog');
    }
    
    return {
        success: true,
        claimed: claimedCount,
        stopReason: stopReason
    };
}