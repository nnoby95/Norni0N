/**
 * Collect all available quest rewards
 * Stops automatically when storage warning detected
 * @returns {Promise<number>} Number of rewards claimed
 */
async function collectQuestRewards() {
    console.log('Starting quest reward collection...');
    
    // Check if we're on rewards tab, if not try to open it
    const rewardTab = document.getElementById('reward-tab');
    if (!rewardTab || !rewardTab.classList.contains('active-tab')) {
        // Try to find and click rewards tab
        const tabs = document.querySelectorAll('.tab-link');
        let rewardsTab = null;
        
        tabs.forEach(tab => {
            if (tab.textContent.includes('Jutalmak')) {
                rewardsTab = tab;
            }
        });
        
        if (rewardsTab) {
            rewardsTab.click();
            await sleep(1500); // Wait for tab to load
        } else {
            console.log('Could not find rewards tab');
            return 0;
        }
    }
    
    let claimedCount = 0;
    let iterationCount = 0;
    const maxIterations = 50;
    
    while (iterationCount < maxIterations) {
        iterationCount++;
        
        // Get first available claim button
        const firstClaimButton = document.querySelector('#reward-system-rewards .reward-system-claim-button:not([disabled])');
        
        if (!firstClaimButton) {
            console.log('No more claimable rewards');
            break;
        }
        
        // Check for storage warning
        const buttonRow = firstClaimButton.closest('tr');
        const warning = buttonRow.querySelector('.small.warn');
        
        if (warning && warning.textContent.includes('túl kevés a hely')) {
            console.log('Storage full - stopping');
            break;
        }
        
        // Get building info
        const buildingName = buttonRow.querySelector('.building-name')?.textContent || 'Unknown';
        const level = buttonRow.querySelector('td:nth-child(2) strong')?.textContent || '?';
        
        console.log(`Claiming: ${buildingName} Level ${level}`);
        
        // Claim reward
        firstClaimButton.click();
        claimedCount++;
        
        await sleep(200);
    }
    
    console.log(`Claimed ${claimedCount} rewards`);
    return claimedCount;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}