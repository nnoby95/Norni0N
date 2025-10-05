// ============================================================================
// QUEUE SYSTEM INTEGRATION EXAMPLE
// ============================================================================
// This file shows how to integrate the queue system into your existing modules
// Copy and adapt this pattern for: Farm, Scavenger, Builder, Recruiter
// ============================================================================

// ============================================================================
// STEP 1: Add Queue Helper Functions
// ============================================================================

/**
 * Check if Master Control queue system is available
 */
function isQueueSystemAvailable() {
    if (typeof window.Norbi0N_QueueSystem === 'undefined') {
        console.warn('[MODULE] Queue system not available - running in fallback mode');
        return false;
    }
    return true;
}

/**
 * Wrapper to run work with queue system
 * @param {string} moduleName - Name of module (farm/scavenger/builder/recruiter)
 * @param {function} workFunction - Async function containing your work logic
 */
async function runWithQueue(moduleName, workFunction) {
    if (!isQueueSystemAvailable()) {
        // Fallback: run directly without queue
        console.log(`[${moduleName.toUpperCase()}] Running without queue system`);
        await workFunction();
        return;
    }
    
    // Request slot from queue system
    await window.Norbi0N_QueueSystem.requestSlot(moduleName, async () => {
        console.log(`[${moduleName.toUpperCase()}] Got slot! Starting work...`);
        
        try {
            await workFunction();
            console.log(`[${moduleName.toUpperCase()}] Work completed successfully!`);
        } catch (error) {
            console.error(`[${moduleName.toUpperCase()}] Work failed:`, error);
            // Error is caught and logged, slot will be released automatically
        }
    });
}

// ============================================================================
// STEP 2: Example - Farm Module Integration
// ============================================================================

// BEFORE: Original farming function (without queue)
async function startFarming_OLD() {
    console.log('[FARM] Starting farming...');
    
    // Navigate to farm page
    window.location.href = '/game.php?screen=am_farm';
    await waitForPageLoad();
    
    // Click start button
    const startBtn = document.querySelector('#start_button');
    if (startBtn) startBtn.click();
    
    // Wait for farming to complete
    await sleep(180000); // 3 minutes
    
    console.log('[FARM] Farming complete!');
}

// AFTER: With queue system
async function startFarming_NEW() {
    // Wrap your work in runWithQueue
    await runWithQueue('farm', async () => {
        console.log('[FARM] Starting farming...');
        
        // Navigate to farm page
        window.location.href = '/game.php?screen=am_farm';
        await waitForPageLoad();
        
        // Click start button
        const startBtn = document.querySelector('#start_button');
        if (startBtn) startBtn.click();
        
        // Wait for farming to complete
        await sleep(180000); // 3 minutes
        
        console.log('[FARM] Farming complete!');
    });
}

// ============================================================================
// STEP 3: Example - Main Loop Integration
// ============================================================================

// BEFORE: Original loop (without queue)
async function farmingLoop_OLD() {
    while (isFarmingEnabled) {
        try {
            await startFarming_OLD();
        } catch (error) {
            console.error('[FARM] Error:', error);
        }
        
        // Wait 30 minutes before next cycle
        await sleep(1800000);
    }
}

// AFTER: With queue system
async function farmingLoop_NEW() {
    while (isFarmingEnabled) {
        try {
            // Queue system handles coordination!
            await startFarming_NEW();
        } catch (error) {
            console.error('[FARM] Error:', error);
        }
        
        // Wait 30 minutes before next cycle
        await sleep(1800000);
    }
}

// ============================================================================
// STEP 4: Example - Scavenger Module Integration
// ============================================================================

async function startScavenging() {
    await runWithQueue('scavenger', async () => {
        console.log('[SCAVENGER] Starting scavenging...');
        
        // Navigate to scavenge page
        window.location.href = '/game.php?screen=place&mode=scavenge';
        await waitForPageLoad();
        
        // Send scavenging missions
        const scavButtons = document.querySelectorAll('.scavenge-option-button');
        scavButtons.forEach((btn, index) => {
            console.log(`[SCAVENGER] Sending mission ${index + 1}`);
            btn.click();
        });
        
        // Wait a bit for UI updates
        await sleep(2000);
        
        console.log('[SCAVENGER] Scavenging complete!');
    });
}

async function scavengingLoop() {
    while (isScavengingEnabled) {
        try {
            await startScavenging();
        } catch (error) {
            console.error('[SCAVENGER] Error:', error);
        }
        
        // Wait 60 minutes before next cycle
        await sleep(3600000);
    }
}

// ============================================================================
// STEP 5: Example - Builder Module Integration
// ============================================================================

async function startBuilding() {
    await runWithQueue('builder', async () => {
        console.log('[BUILDER] Starting building sequence...');
        
        // Get building queue
        const villages = getMyVillages();
        
        for (const village of villages) {
            console.log(`[BUILDER] Processing village ${village.name}`);
            
            // Navigate to village
            window.location.href = `/game.php?village=${village.id}&screen=main`;
            await waitForPageLoad();
            
            // Check and queue buildings
            await checkAndQueueBuildings();
            
            await sleep(1000);
        }
        
        console.log('[BUILDER] Building sequence complete!');
    });
}

async function buildingLoop() {
    while (isBuildingEnabled) {
        try {
            await startBuilding();
        } catch (error) {
            console.error('[BUILDER] Error:', error);
        }
        
        // Wait 45 minutes before next cycle
        await sleep(2700000);
    }
}

// ============================================================================
// STEP 6: Example - Recruiter Module Integration
// ============================================================================

async function startRecruiting() {
    await runWithQueue('recruiter', async () => {
        console.log('[RECRUITER] Starting recruitment...');
        
        const villages = getMyVillages();
        
        for (const village of villages) {
            console.log(`[RECRUITER] Recruiting in ${village.name}`);
            
            // Navigate to barracks
            window.location.href = `/game.php?village=${village.id}&screen=barracks`;
            await waitForPageLoad();
            
            // Queue units
            await queueUnits();
            
            await sleep(1000);
        }
        
        console.log('[RECRUITER] Recruitment complete!');
    });
}

async function recruitingLoop() {
    while (isRecruitingEnabled) {
        try {
            await startRecruiting();
        } catch (error) {
            console.error('[RECRUITER] Error:', error);
        }
        
        // Wait 15 minutes before next cycle
        await sleep(900000);
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForPageLoad() {
    return new Promise(resolve => setTimeout(resolve, 2000));
}

function getMyVillages() {
    // Placeholder - implement your village detection logic
    return [];
}

async function checkAndQueueBuildings() {
    // Placeholder - implement your building logic
}

async function queueUnits() {
    // Placeholder - implement your recruitment logic
}

// ============================================================================
// STEP 7: Module Status Flags (examples)
// ============================================================================

let isFarmingEnabled = GM_getValue('farm_enabled', false);
let isScavengingEnabled = GM_getValue('scav_enabled', false);
let isBuildingEnabled = GM_getValue('builder_enabled', false);
let isRecruitingEnabled = GM_getValue('recruiter_enabled', false);

// ============================================================================
// USAGE SUMMARY
// ============================================================================

/*

1. Copy the helper functions (isQueueSystemAvailable, runWithQueue) to your module

2. Wrap your work logic in runWithQueue:
   
   await runWithQueue('farm', async () => {
       // Your work here
   });

3. The queue system will:
   - Check if slot is available
   - Wait in queue if busy
   - Execute your work when ready
   - Release slot automatically when done
   - Handle errors gracefully

4. Console will show queue activity:
   [QUEUE] farm requesting slot...
   [QUEUE] ▶️ Executing: farm (Priority 1)
   [FARM] Got slot! Starting work...
   [FARM] Work completed successfully!
   [QUEUE] ✅ farm completed

5. Master Control Panel UI shows:
   ▶️ Running: farm
   ⏳ Queue: scavenger, builder

That's it! Your module is now integrated with the queue system! 🎉

*/

// ============================================================================
// TESTING YOUR INTEGRATION
// ============================================================================

/*

1. Load Master Control Panel
2. Enable your module
3. Open browser console (F12)
4. Watch for queue messages
5. Check Master Control Panel → Queue Status section

Expected console output:
[Master Control] ✅ GM API Bridge + Queue System ready in page context
[QUEUE] farm requesting slot...
[QUEUE] ▶️ Executing: farm (Priority 1)
[FARM] Got slot! Starting work...
[FARM] Starting farming...
[FARM] Farming complete!
[FARM] Work completed successfully!
[QUEUE] ✅ farm completed
[QUEUE] farm releasing slot
[QUEUE] Queue empty - system idle

*/

