// ==UserScript==
// @name         Tribal Wars - Dual Scavenge Engine v4.0
// @namespace    https://tribalwars.net/
// @version      4.0.0
// @description  Smart Scav (batching) + Simple Scav (loop) modes
// @author       Norbi0N
// @match        https://*.tribalwars.net/game.php*
// @match        https://*.klanhaboru.hu/game.php*
// @icon         https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_scav_27x27.png
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-scav-engine.meta.js
// @downloadURL  https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-scav-engine.user.js
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    let CONFIG = {
        mode: null, // 'smart' or 'simple'
        runtime: 2,
        enabledCategories: [true, true, true, true],
        enabledTroops: {},
        
        // Smart Scav Config
        smartEnabled: false,
        
        // Simple Scav Config
        simpleEnabled: false,
        simpleInterval: 3600, // seconds (default 1 hour)
        simpleRandomize: true, // add 1-5 min randomization
        simpleStopTimes: [], // [{start: "19:00", end: "23:00"}]
        
        // UI State
        uiVisible: false,
        
        stats: {
            totalRuns: 0,
            lastRun: null,
            nextRunTime: null,
            lastSlotCheck: null
        }
    };

    const saved = GM_getValue('scavenge_engine_config');
    if (saved) CONFIG = JSON.parse(saved);

    function saveConfig() {
        GM_setValue('scavenge_engine_config', JSON.stringify(CONFIG));
    }

    function log(msg) {
        console.log(`[Engine] ${msg}`);
    }

    // =========================================================================
    // BOT PROTECTION DETECTION
    // =========================================================================

    let botDetectionInterval = null;
    let botProtectionDetected = false;

    function checkBotProtection() {
        const selectors = [
            '#bot_check', 
            '#popup_box_bot_protection', 
            '#botprotection_quest', 
            '#bot_protection',
            'form#bot_protection', 
            '.bot_protection', 
            '.bot-protection-row',
            '[id*="bot_protect"]', 
            '[class*="bot_protect"]',
            'img[id*="captcha"]', 
            'canvas[id*="captcha"]',
            '.captcha'
        ];

        // Check CSS selectors
        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element && element.offsetParent !== null) {
                    // Element exists and is visible
                    return true;
                }
            } catch (e) {
                // Invalid selector, skip
                continue;
            }
        }

        // Check for Hungarian text "Bot védelem" or "botvédelmi"
        try {
            const bodyText = document.body.innerText || document.body.textContent || '';
            if (bodyText.includes('Bot védelem') || bodyText.includes('botvédelmi') || bodyText.includes('bot védelem')) {
                return true;
            }
            
            // Check all h2 elements for bot protection text
            const h2Elements = document.querySelectorAll('h2');
            for (const h2 of h2Elements) {
                const text = h2.textContent || h2.innerText || '';
                if (text.includes('Bot védelem') || text.includes('bot védelem')) {
                    return true;
                }
            }
        } catch (e) {
            // Error checking text, skip
        }

        return false;
    }

    function handleBotProtection() {
        if (checkBotProtection()) {
            if (!botProtectionDetected) {
                botProtectionDetected = true;
                log('🚨 BOT PROTECTION DETECTED! Stopping all functions!');
                
                // Stop Smart Scav
                if (CONFIG.smartEnabled) {
                    stopSmartScav();
                    log('🛑 Smart Scav stopped due to bot protection');
                }
                
                // Stop Simple Scav
                if (CONFIG.simpleEnabled) {
                    stopSimpleScav();
                    log('🛑 Simple Scav stopped due to bot protection');
                }
                
                // Show alert
                UI.ErrorMessage('🚨 BOT PROTECTION DETECTED! All functions stopped. Solve the captcha and refresh the page.');
                
                // Update UI to show warning
                const statusEl = document.getElementById('engineStatus');
                const modeEl = document.getElementById('engineMode');
                const botWarning = document.getElementById('botWarning');
                
                if (statusEl) {
                    statusEl.textContent = 'BOT DETECTED';
                    statusEl.style.background = 'linear-gradient(to bottom, #ff4444, #cc0000)';
                    statusEl.style.color = '#fff';
                    statusEl.style.fontWeight = 'bold';
                }
                if (modeEl) {
                    modeEl.textContent = '(Solve Captcha!)';
                    modeEl.style.color = '#cc0000';
                    modeEl.style.fontWeight = 'bold';
                }
                if (botWarning) {
                    botWarning.style.display = 'block';
                }
            }
        } else {
            if (botProtectionDetected) {
                // Bot protection was cleared
                botProtectionDetected = false;
                log('✅ Bot protection cleared');
                
                // Hide warning box
                const botWarning = document.getElementById('botWarning');
                if (botWarning) {
                    botWarning.style.display = 'none';
                }
            }
        }
    }

    function startBotDetection() {
        if (botDetectionInterval) return;
        
        log('🛡️ Bot detection started - checking every 10 seconds');
        
        // Check immediately
        handleBotProtection();
        
        // Then check every 10 seconds
        botDetectionInterval = setInterval(handleBotProtection, 10000);
    }

    function stopBotDetection() {
        if (botDetectionInterval) {
            clearInterval(botDetectionInterval);
            botDetectionInterval = null;
            log('🛡️ Bot detection stopped');
        }
    }

    // =========================================================================
    // TROOP MANAGEMENT
    // =========================================================================

    function initTroopSettings() {
        const stored = localStorage.getItem("massScavenging");
        
        if (stored === null) {
            const defaultTroops = {};
            for (let unit of game_data.units) {
                defaultTroops[unit] = !["militia", "snob", "ram", "catapult", "spy"].includes(unit);
            }
            localStorage.setItem("massScavenging", JSON.stringify(defaultTroops));
            CONFIG.enabledTroops = defaultTroops;
        } else {
            CONFIG.enabledTroops = JSON.parse(stored);
        }
        
        saveConfig();
    }

    function saveTroopSettings() {
        localStorage.setItem("massScavenging", JSON.stringify(CONFIG.enabledTroops));
        saveConfig();
    }

    // =========================================================================
    // SLOT DETECTION - SMART FILTERING
    // =========================================================================
    // 
    // STRATEGY: Only track villages that ACTUALLY SENT TROOPS!
    // 
    // After scavenging:
    //   ✓ Village has ACTIVE slots → Track it (has troops)
    //   ✗ Village has only FREE slots → Ignore it (no troops)
    // 
    // This prevents infinite loops where villages without troops keep 
    // triggering "free slots available" checks.
    // =========================================================================

    async function extractSlotData(scavTab) {
        log('Extracting slot data...');

        try {
            const doc = scavTab.document;
            const win = scavTab;
            const villagesData = {};
            let totalSlots = 0;
            let freeSlots = 0;
            let globalEarliestReturnTime = null;
            let villagesWithTroops = 0;
            let villagesWithoutTroops = 0;

            // Try to access the game's internal scavenging data
            let scavengeData = null;
            try {
                // The game stores scavenge info in ScavengeMassScreen or similar
                if (win.ScavengeMassScreen) {
                    scavengeData = win.ScavengeMassScreen;
                    log('Found ScavengeMassScreen data object');
                } else if (win.Accountmanager && win.Accountmanager.scavenge) {
                    scavengeData = win.Accountmanager.scavenge;
                    log('Found Accountmanager.scavenge data');
                }
            } catch (e) {
                log('Could not access internal game data: ' + e.message);
            }

            const villageRows = doc.querySelectorAll('tr[id^="scavenge_village_"]');
            
            for (const row of villageRows) {
                const villageId = row.getAttribute('data-id');
                const villageName = row.querySelector('td:first-child a')?.textContent?.trim();
                
                let activeSlotsCount = 0;
                let maxReturnTimeForVillage = null;
                const categories = {};

                for (let cat = 1; cat <= 4; cat++) {
                    const optionCell = row.querySelector(`.option-${cat}`);
                    
                    if (!optionCell) continue;

                    const isActive = optionCell.classList.contains('option-active');
                    const isInactive = optionCell.classList.contains('option-inactive');
                    const isLocked = optionCell.classList.contains('option-locked');
                    const isUnlocking = optionCell.classList.contains('option-unlocking');
                    
                    let status = 'unknown';
                    let returnTime = null;
                    
                    if (isActive) {
                        status = 'active';
                        activeSlotsCount++;
                        
                        // EVENT-DRIVEN DOM SCRAPING: Trigger hover to get tooltip with real time
                        const scavengeIcon = optionCell.querySelector('img.status-active');
                        let countdownText = null;
                        
                        if (scavengeIcon) {
                            try {
                                // Simulate mouseover to trigger tooltip
                                scavengeIcon.dispatchEvent(new doc.defaultView.MouseEvent('mouseover', {
                                    view: doc.defaultView,
                                    bubbles: true,
                                    cancelable: true
                                }));
                                
                                // Wait for tooltip to appear (random delay 250-450ms)
                                const delay = 250 + Math.random() * 200;
                                await new Promise(r => setTimeout(r, delay));
                                
                                // Find tooltip in DOM
                                const allDivs = doc.querySelectorAll('body > div');
                                for (const div of allDivs) {
                                    const text = div.textContent;
                                    if (text && (text.includes('Elkészül') || text.includes('Elteszül'))) {
                                        // Extract time pattern HH:MM:SS
                                        const timeMatch = text.match(/(\d+):(\d+):(\d+)/);
                                        if (timeMatch) {
                                            countdownText = timeMatch[0];
                                            break;
                                        }
                                    }
                                }
                                
                                // Clear hover (simulate mouseout)
                                scavengeIcon.dispatchEvent(new doc.defaultView.MouseEvent('mouseout', {
                                    view: doc.defaultView,
                                    bubbles: true,
                                    cancelable: true
                                }));
                                
                            } catch (e) {
                                log(`  └─ Village ${villageId}, Cat ${cat}: Hover failed: ${e.message}`);
                            }
                        }
                        
                        // Parse the extracted countdown
                        if (countdownText) {
                            const parts = countdownText.split(':').map(Number);
                            const hours = parts[0] || 0;
                            const minutes = parts[1] || 0;
                            const seconds = parts[2] || 0;
                            
                            const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
                            returnTime = Date.now() + (totalSeconds * 1000);
                            
                            // Log short timers for debugging
                            if (totalSeconds < 600) {
                                log(`  ✓ Village ${villageId}, Cat ${cat}: Extracted ${countdownText} via tooltip (${totalSeconds}s)`);
                            }
                        } else {
                            // Fallback: estimate based on runtime setting
                            returnTime = Date.now() + (CONFIG.runtime * 3600 * 1000) + (2 * 60 * 1000);
                            log(`  └─ Village ${villageId}, Cat ${cat}: ⚠ No tooltip, using ${CONFIG.runtime}h estimate`);
                        }
                        
                        // Update max return time for this village
                        if (!maxReturnTimeForVillage || returnTime > maxReturnTimeForVillage) {
                            maxReturnTimeForVillage = returnTime;
                        }
                        
                        // Update global earliest return time
                        if (!globalEarliestReturnTime || returnTime < globalEarliestReturnTime) {
                            globalEarliestReturnTime = returnTime;
                        }
                    } else if (isInactive) {
                        status = 'free';
                        freeSlots++;
                    } else if (isLocked) {
                        status = 'locked';
                    } else if (isUnlocking) {
                        status = 'unlocking';
                    }

                    categories[cat] = {
                        status: status,
                        returnTime: returnTime
                    };

                    totalSlots++;
                }

                // FILTER: Only store villages that have at least 1 ACTIVE slot
                // If activeSlotsCount = 0, village has no troops → IGNORE IT!
                if (activeSlotsCount > 0) {
                    villagesData[villageId] = {
                        villageId: villageId,
                        villageName: villageName,
                        activeSlotsCount: activeSlotsCount,
                        maxReturnTime: maxReturnTimeForVillage ? new Date(maxReturnTimeForVillage).toISOString() : null,
                        maxReturnTimeMs: maxReturnTimeForVillage,
                        categories: categories
                    };
                    villagesWithTroops++;
                } else {
                    villagesWithoutTroops++;
                    log(`  └─ Skipping village ${villageId} (${villageName}) - no troops available`);
                }
            }

            const slotData = {
                villages: villagesData,
                extractedAt: new Date().toISOString(),
                earliestReturnTime: globalEarliestReturnTime ? new Date(globalEarliestReturnTime).toISOString() : new Date().toISOString(),
                totalSlots: totalSlots,
                freeSlots: freeSlots
            };

            log(`Extracted: ${villagesWithTroops} villages WITH troops (tracked), ${villagesWithoutTroops} villages WITHOUT troops (ignored)`);
            log(`Active missions: ${totalSlots - freeSlots}/${totalSlots} slots in use`);
            
            if (globalEarliestReturnTime) {
                const minutesUntilFirst = Math.round((globalEarliestReturnTime - Date.now()) / 60000);
                log(`⏰ Earliest slot returns in: ${minutesUntilFirst} minutes`);
            }

            localStorage.setItem('scavenge_slot_data', JSON.stringify(slotData));
            
            return slotData;
            
        } catch (error) {
            log('Extraction failed: ' + error.message);
            return null;
        }
    }

    function getSlotStatus() {
        const stored = localStorage.getItem('scavenge_slot_data');
        
        if (!stored) {
            return {
                hasData: false,
                slotsAvailable: true,
                message: 'No data - ready to run'
            };
        }

        try {
            const slotData = JSON.parse(stored);
            const now = Date.now();
            const BUFFER_TIME = 60 * 1000; // 1 minute buffer in milliseconds
            const BATCHING_WINDOW = 10 * 60 * 1000; // 10 minutes batching window
            
            // Collect ALL return times to find batching opportunity
            let allReturnTimes = [];
            
            for (const villageId in slotData.villages) {
                const village = slotData.villages[villageId];
                
                for (const catId in village.categories) {
                    const category = village.categories[catId];
                    
                    if (category.status === 'active' && category.returnTime) {
                        allReturnTimes.push(category.returnTime + BUFFER_TIME);
                    }
                }
            }
            
            // Sort return times
            allReturnTimes.sort((a, b) => a - b);
            
            if (allReturnTimes.length === 0) {
                // No active missions
                return {
                    hasData: true,
                    slotsAvailable: true,
                    freeSlots: slotData.freeSlots,
                    totalSlots: slotData.totalSlots,
                    villages: slotData.villages,
                    message: 'Ready to run!'
                };
            }
            
            const earliestReturn = allReturnTimes[0];
            const latestReturnInWindow = earliestReturn + BATCHING_WINDOW;
            
            // Find all slots that return within 10 minutes of earliest
            let slotsInBatch = allReturnTimes.filter(time => time <= latestReturnInWindow);
            let batchEndTime = Math.max(...slotsInBatch); // Wait for the LAST slot in batch
            
            // Check how many villages will be ready in this batch
            let villagesReadyInBatch = 0;
            for (const villageId in slotData.villages) {
                const village = slotData.villages[villageId];
                
                for (const catId in village.categories) {
                    const category = village.categories[catId];
                    
                    if (category.status === 'active' && category.returnTime) {
                        const returnWithBuffer = category.returnTime + BUFFER_TIME;
                        if (returnWithBuffer <= batchEndTime) {
                            villagesReadyInBatch++;
                            break; // Count each village only once
                        }
                    }
                }
            }
            
            // Log batching info if multiple slots
            if (slotsInBatch.length > 1 && now < batchEndTime) {
                const minutesToBatch = Math.round((batchEndTime - now) / 60000);
                log(`📦 Batching ${slotsInBatch.length} slots (${villagesReadyInBatch} villages) - waiting ${minutesToBatch}m for batch completion`);
            }
            
            // Check if batch is ready (all slots in batch have returned)
            if (now >= batchEndTime) {
                // Batch is complete! Run MASS scavenge ONCE for all villages
                log(`✅ Batch ready! Running MASS scavenge once for ${villagesReadyInBatch} villages`);
                
                return {
                    hasData: true,
                    slotsAvailable: true,
                    freeSlots: slotData.freeSlots,
                    totalSlots: slotData.totalSlots,
                    villages: slotData.villages,
                    message: `Batch ready! ${villagesReadyInBatch} villages`,
                    batchInfo: `${slotsInBatch.length} slots in ${villagesReadyInBatch} villages`
                };
            } else {
                // Batch not ready yet - show countdown to batch completion
                const secondsLeft = Math.round((batchEndTime - now) / 1000);
                const minutesLeft = Math.floor(secondsLeft / 60);
                const seconds = secondsLeft % 60;
                
                return {
                    hasData: true,
                    slotsAvailable: false,
                    freeSlots: 0,
                    totalSlots: slotData.totalSlots,
                    villages: slotData.villages,
                    message: `Batching ${villagesReadyInBatch} villages - Ready in ${minutesLeft}m ${seconds}s`,
                    minutesLeft: minutesLeft,
                    secondsLeft: secondsLeft
                };
            }
            
        } catch (error) {
            log('getSlotStatus error: ' + error.message);
            return {
                hasData: false,
                slotsAvailable: true,
                message: 'Data error - ready to run'
            };
        }
    }

    // =========================================================================
    // TAB OPERATIONS (same as before)
    // =========================================================================

    function openScavengeTab() {
        return new Promise((resolve, reject) => {
            const scavengeUrl = game_data.player.sitter > 0
                ? `${game_data.link_base_pure}place&mode=scavenge_mass&t=${game_data.player.id}`
                : `${game_data.link_base_pure}place&mode=scavenge_mass`;

            const scavTab = window.open(scavengeUrl, '_blank');
            if (!scavTab) {
                reject(new Error('Failed to open tab'));
                return;
            }

            const checkLoaded = setInterval(() => {
                try {
                    if (scavTab.document.readyState === 'complete') {
                        clearInterval(checkLoaded);
                        resolve(scavTab);
                    }
                } catch (e) {}
            }, 500);

            setTimeout(() => {
                clearInterval(checkLoaded);
                reject(new Error('Timeout'));
            }, 15000);
        });
    }

    function injectSophieScript(scavTab) {
        return new Promise((resolve, reject) => {
            const doc = scavTab.document;
            const script = doc.createElement('script');
            script.src = 'https://media.innogamescdn.com/com_DS_HU/scripts/massscavenging.js';
            script.onload = () => setTimeout(() => resolve(scavTab), 2000);
            script.onerror = () => reject(new Error('Script load failed'));
            doc.head.appendChild(script);
        });
    }

    function configureSophieScript(scavTab) {
        return new Promise((resolve) => {
            const doc = scavTab.document;
            
            const runtimeInput = doc.querySelector('#runTime');
            if (runtimeInput) runtimeInput.value = CONFIG.runtime.toString();

            for (let i = 1; i <= 4; i++) {
                const checkbox = doc.querySelector(`#category${i}`);
                if (checkbox) checkbox.checked = CONFIG.enabledCategories[i - 1];
            }

            resolve(scavTab);
        });
    }

    function triggerAndLaunch(scavTab) {
        return new Promise((resolve, reject) => {
            const doc = scavTab.document;
            const generateButton = doc.querySelector('#sendMass');
            
            if (!generateButton) {
                reject(new Error('Generate button not found'));
                return;
            }

            generateButton.click();

            setTimeout(() => {
                const checkButtons = setInterval(() => {
                    const launchButtons = doc.querySelectorAll('input[id="sendMass"]');
                    
                    if (launchButtons.length > 0) {
                        clearInterval(checkButtons);
                        
                        let clickCount = 0;
                        function clickNext() {
                            if (clickCount >= launchButtons.length) {
                                resolve(scavTab);
                                return;
                            }
                            launchButtons[clickCount].click();
                            clickCount++;
                            setTimeout(clickNext, 1000);
                        }
                        clickNext();
                    }
                }, 500);

                setTimeout(() => {
                    clearInterval(checkButtons);
                    reject(new Error('Launch buttons timeout'));
                }, 10000);
            }, 2000);
        });
    }

    // =========================================================================
    // EXECUTION
    // =========================================================================

    // SMART SCAV: Full execution with DOM scraping and localStorage
    async function executeSmartScavenging() {
        log('=== STARTING SMART SCAVENGE ===');

        try {
            const scavTab = await openScavengeTab();
            log('Tab opened');
            
            await injectSophieScript(scavTab);
            log('Script injected');
            
            await configureSophieScript(scavTab);
            log('Script configured');
            
            await triggerAndLaunch(scavTab);
            log('Squads launched');

            // Reload the scavenge page to get the updated table with accurate slot statuses
            log('Reloading page to get updated slot statuses...');
            scavTab.location.reload();
            
            // Wait for page to reload completely
            await new Promise((resolve) => {
                const checkReload = setInterval(() => {
                    try {
                        if (scavTab.document.readyState === 'complete') {
                            clearInterval(checkReload);
                            setTimeout(resolve, 2000); // Extra 2 seconds for full rendering
                        }
                    } catch(e) {}
                }, 500);
            });
            
            // NOW extract slot data from the freshly reloaded page (SMART MODE ONLY)
            log('Extracting slot data from reloaded page...');
            const slotData = await extractSlotData(scavTab);
            
            if (slotData) {
                const activeSlots = slotData.totalSlots - slotData.freeSlots;
                log(`✓ Data saved to localStorage: ${Object.keys(slotData.villages).length} villages, ${activeSlots} active missions`);
                
                if (activeSlots === 0) {
                    log('⚠ WARNING: No active missions detected! Page might not have updated properly.');
                }
            } else {
                log('⚠ Failed to extract slot data');
            }

            setTimeout(() => {
                scavTab.close();
                log('Tab closed');
            }, 2000);

            CONFIG.stats.totalRuns++;
            CONFIG.stats.lastRun = new Date().toISOString();
            saveConfig();
            
            UI.SuccessMessage(`Smart Scav complete! Run #${CONFIG.stats.totalRuns}`);
            log('=== SMART SCAV COMPLETE ===');
            
            return true;
            
                } catch (error) {
            log('ERROR: ' + error.message);
            UI.ErrorMessage('Error: ' + error.message);
            return false;
        }
    }

    // SIMPLE SCAV: Just run the 3rd party script, no data extraction!
    async function executeSimpleScavenging() {
        log('=== STARTING SIMPLE SCAVENGE ===');

        try {
            const scavTab = await openScavengeTab();
            log('Tab opened');
            
            await injectSophieScript(scavTab);
            log('Script injected');
            
            await configureSophieScript(scavTab);
            log('Script configured');
            
            await triggerAndLaunch(scavTab);
            log('Squads launched');

            // Simple mode: Just close the tab, no data extraction!
            setTimeout(() => {
                scavTab.close();
                log('Tab closed');
            }, 3000);

            CONFIG.stats.totalRuns++;
            CONFIG.stats.lastRun = new Date().toISOString();
            saveConfig();
            
            UI.SuccessMessage(`Simple Scav complete! Run #${CONFIG.stats.totalRuns}`);
            log('=== SIMPLE SCAV COMPLETE ===');
            
            return true;
            
        } catch (error) {
            log('ERROR: ' + error.message);
            UI.ErrorMessage('Error: ' + error.message);
            return false;
        }
    }

    // =========================================================================
    // SMART SCAV MODE - Intelligent batching with localStorage
    // =========================================================================
    
    let smartTimeout = null;
    let isSmartRunning = false;

    function startSmartScav() {
        log('🧠 Smart Scav started - intelligent batching mode');
        CONFIG.mode = 'smart';
        CONFIG.smartEnabled = true;
        saveConfig();
        
        if (smartTimeout) clearTimeout(smartTimeout);
        
        function checkAndSchedule() {
            if (!CONFIG.smartEnabled || CONFIG.mode !== 'smart') return;
            
            // BOT PROTECTION CHECK
            if (botProtectionDetected) {
                log('🚨 Bot protection detected - Smart Scav paused');
                return;
            }
            
            if (isSmartRunning) {
                log('⚠ Smart Scav already running, skipping');
                smartTimeout = setTimeout(checkAndSchedule, 5000);
                return;
            }

            CONFIG.stats.lastSlotCheck = new Date().toISOString();
            saveConfig();
            
            const status = getSlotStatus();
            
            if (status.slotsAvailable) {
                log('✅ Batch ready! Opening tab to scavenge ONCE...');
                isSmartRunning = true;
                
                executeSmartScavenging().then(() => {
                    isSmartRunning = false;
                    setTimeout(checkAndSchedule, 5000);
                }).catch((error) => {
                    isSmartRunning = false;
                    log('❌ Error: ' + error.message);
                    setTimeout(checkAndSchedule, 30000);
                });
            } else if (status.secondsLeft) {
                const waitMs = status.secondsLeft * 1000;
                
                if (waitMs < 120000) {
                    log(`⏱ Exact timing: Running in ${status.minutesLeft}m ${status.secondsLeft % 60}s`);
                    smartTimeout = setTimeout(checkAndSchedule, waitMs);
                } else {
                    log(`⏳ Batch in ${status.minutesLeft}m ${status.secondsLeft % 60}s - checking every 60s`);
                    smartTimeout = setTimeout(checkAndSchedule, 60000);
                }
            } else {
                log('⏳ No timing data - checking in 60s');
                smartTimeout = setTimeout(checkAndSchedule, 60000);
            }
        }
        
        setTimeout(checkAndSchedule, 3000);
    }

    function stopSmartScav() {
        log('🛑 Smart Scav stopped');
        CONFIG.mode = null;
        CONFIG.smartEnabled = false;
        saveConfig();
        
        if (smartTimeout) clearTimeout(smartTimeout);
    }

    // =========================================================================
    // SIMPLE SCAV MODE - Loop with interval + randomization
    // =========================================================================
    
    let simpleTimeout = null;
    let isSimpleRunning = false;

    function isInStopTime() {
        if (!CONFIG.simpleStopTimes || CONFIG.simpleStopTimes.length === 0) return false;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        for (let stopTime of CONFIG.simpleStopTimes) {
            const [startH, startM] = stopTime.start.split(':').map(Number);
            const [endH, endM] = stopTime.end.split(':').map(Number);
            
            const startMins = startH * 60 + startM;
            const endMins = endH * 60 + endM;
            
            if (currentTime >= startMins && currentTime <= endMins) {
                return true;
            }
        }
        
        return false;
    }

    function startSimpleScav() {
        log('⚡ Simple Scav started - loop mode');
        CONFIG.mode = 'simple';
        CONFIG.simpleEnabled = true;
        
        if (simpleTimeout) clearTimeout(simpleTimeout);
        
        function simpleLoop() {
            if (!CONFIG.simpleEnabled || CONFIG.mode !== 'simple') return;
            
            // BOT PROTECTION CHECK
            if (botProtectionDetected) {
                log('🚨 Bot protection detected - Simple Scav paused');
                return;
            }
            
            if (isInStopTime()) {
                log('⏸ In stop time window, skipping run');
                simpleTimeout = setTimeout(simpleLoop, 60000); // Check again in 1 min
                return;
            }
            
            if (isSimpleRunning) {
                log('⚠ Simple Scav already running, skipping');
                simpleTimeout = setTimeout(simpleLoop, 5000);
                return;
            }
            
            log('▶ Simple Scav: Running...');
            isSimpleRunning = true;
            
            executeSimpleScavenging().then(() => {
                isSimpleRunning = false;
                
                // Calculate next run with randomization
                let nextRunSeconds = CONFIG.simpleInterval;
                
                if (CONFIG.simpleRandomize) {
                    const randomSecs = Math.floor(Math.random() * 300) + 60; // 1-5 minutes
                    nextRunSeconds += randomSecs;
                    log(`⏰ Next run in ${Math.floor(nextRunSeconds/60)}m ${nextRunSeconds%60}s (base: ${Math.floor(CONFIG.simpleInterval/60)}m + random: ${Math.floor(randomSecs/60)}m)`);
                } else {
                    log(`⏰ Next run in ${Math.floor(nextRunSeconds/60)}m ${nextRunSeconds%60}s`);
                }
                
                CONFIG.stats.nextRunTime = new Date(Date.now() + nextRunSeconds * 1000).toISOString();
                saveConfig();
                
                simpleTimeout = setTimeout(simpleLoop, nextRunSeconds * 1000);
            }).catch((error) => {
                isSimpleRunning = false;
                log('❌ Error: ' + error.message);
                simpleTimeout = setTimeout(simpleLoop, 60000); // Retry in 1 min
            });
        }
        
        // Check if we should run immediately or wait for scheduled time
            const now = Date.now();
        const nextRun = CONFIG.stats.nextRunTime ? new Date(CONFIG.stats.nextRunTime).getTime() : 0;
        
        if (nextRun > now) {
            // We have a scheduled run in the future - wait for it
            const waitMs = nextRun - now;
            log(`📅 Resuming Simple Scav - next run in ${Math.floor(waitMs/60000)}m ${Math.floor((waitMs%60000)/1000)}s`);
            saveConfig();
            simpleTimeout = setTimeout(simpleLoop, waitMs);
            } else {
            // No scheduled run or it's in the past - run immediately
            log('▶ Starting Simple Scav - running immediately');
            saveConfig();
            setTimeout(simpleLoop, 3000);
        }
    }

    function stopSimpleScav() {
        log('🛑 Simple Scav stopped');
        CONFIG.mode = null;
        CONFIG.simpleEnabled = false;
        CONFIG.stats.nextRunTime = null;
        saveConfig();
        
        if (simpleTimeout) clearTimeout(simpleTimeout);
    }

    // =========================================================================
    // TOGGLE BUTTON (Quest Bar Icon)
    // =========================================================================

    function createToggleButton() {
        const existing = document.getElementById('scav-toggle-btn');
        if (existing) existing.remove();
        
        const buttonHTML = `
            <div class="quest opened scav-toggle" 
                 id="scav-toggle-btn"
                 style="background-size: 26px; 
                        background-image: url('https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_scav_27x27.png');
                        cursor: pointer;
                        position: relative;">
                <div class="quest_progress" style="width: 0%;"></div>
                <div style="position: absolute; 
                           bottom: 2px; 
                           right: 2px; 
                           background: rgba(0,0,0,0.7); 
                           color: #fff; 
                           font-size: 8px; 
                           padding: 1px 3px; 
                           border-radius: 2px; 
                           font-weight: bold;">
                    SCAV
                </div>
            </div>
        `;
        
        const questlog = document.getElementById('questlog_new');
        if (questlog) {
            questlog.insertAdjacentHTML('beforeend', buttonHTML);
            
            const button = document.getElementById('scav-toggle-btn');
            
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleUI();
            });
            
            button.addEventListener('mouseenter', function() {
                this.style.opacity = '0.8';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.opacity = '1';
            });
            
            log('Toggle button created in questlog');
        } else {
            log('⚠ Questlog not found, button not created');
        }
    }

    function toggleUI() {
        let engineUI = document.getElementById('scavengeEngine');
        
        // If UI doesn't exist yet, create it
        if (!engineUI) {
            createEngineUI();
            engineUI = document.getElementById('scavengeEngine');
        }
        
        const button = document.getElementById('scav-toggle-btn');
        if (!engineUI) return;
        
        CONFIG.uiVisible = !CONFIG.uiVisible;
        
        if (CONFIG.uiVisible) {
            engineUI.style.display = 'block';
            if (button) button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            log('UI opened');
        } else {
            engineUI.style.display = 'none';
            if (button) button.style.backgroundColor = '';
            log('UI minimized');
        }
        
        saveConfig();
    }

    // =========================================================================
    // MAIN UI
    // =========================================================================

    function createEngineUI() {
        let troopCheckboxes = '';
        for (let unit of game_data.units) {
            if (["militia", "snob"].includes(unit)) continue;
            
            const checked = CONFIG.enabledTroops[unit] ? 'checked' : '';
            const unitName = unit.charAt(0).toUpperCase() + unit.slice(1);
            
            troopCheckboxes += `
                <label style="display: inline-block; width: 48%; font-size: 11px; margin-bottom: 4px;">
                    <input type="checkbox" class="troop-checkbox" data-unit="${unit}" ${checked}>
                    <img src="/graphic/unit/unit_${unit}.png" style="width: 16px; height: 16px; vertical-align: middle;">
                    ${unitName}
                </label>
            `;
        }

        const html = `
        <div id="scavengeEngine" style="
            position: fixed;
            top: 80px;
            right: 20px;
            width: 340px;
            background: linear-gradient(to bottom, #f4e4bc, #e8d9b5);
            border: 3px solid #7d510f;
            border-radius: 10px;
            padding: 0;
            z-index: 99999;
            font-family: Verdana, Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            max-height: 90vh;
            overflow-y: auto;
            display: none;
        ">
            <div style="
                background: linear-gradient(to bottom, #c1a264, #b09456);
                padding: 12px;
                border-radius: 7px 7px 0 0;
                border-bottom: 2px solid #7d510f;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <h3 style="margin: 0; color: #fff; text-shadow: 2px 2px 3px rgba(0,0,0,0.5); font-size: 16px;">
                        Dual Scavenge Engine
                    </h3>
                    <small style="color: #ffffdf;">v4.0 - Smart + Simple Modes</small>
                </div>
                <button id="scav-minimize-btn" 
                        style="background: rgba(255,255,255,0.2); 
                               border: 1px solid #603000; 
                               border-radius: 3px; 
                               width: 24px; 
                               height: 24px; 
                               cursor: pointer; 
                               font-weight: bold; 
                               color: #2c1810;
                               padding: 0;
                               line-height: 1;
                               font-size: 18px;">
                    ×
                </button>
            </div>
            
            <div style="padding: 15px;">
            
            <div style="margin-bottom: 10px; padding: 8px; background: #fff5da; border-radius: 5px; border: 1px solid #d4b98a;">
                <strong>Status:</strong>
                <span id="engineStatus" style="
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    margin-left: 8px;
                    font-size: 11px;
                    background: #FFB6C1;
                    color: #8B0000;
                ">STOPPED</span>
                <span id="engineMode" style="font-size: 10px; color: #666; margin-left: 5px;"></span>
            </div>
            
            <!-- BOT PROTECTION WARNING -->
            <div id="botWarning" style="display: none; margin-bottom: 10px; padding: 10px; background: linear-gradient(to bottom, #ff4444, #cc0000); border: 2px solid #990000; border-radius: 5px; text-align: center; color: white; font-weight: bold; font-size: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
                🚨 BOT PROTECTION DETECTED!<br>
                <small style="font-size: 10px; font-weight: normal;">Solve captcha and refresh page</small>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">
                    Runtime:
                </label>
                <select id="engineRuntime" style="
                    width: 100%;
                    padding: 6px;
                    border: 2px solid #7d510f;
                    border-radius: 4px;
                    background: white;
                    font-size: 12px;
                ">
                    <option value="1">1 hour</option>
                    <option value="2" selected>2 hours</option>
                    <option value="3">3 hours</option>
                    <option value="4">4 hours</option>
                    <option value="6">6 hours</option>
                    <option value="8">8 hours</option>
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <strong style="font-size: 12px;">Categories:</strong>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 5px; font-size: 11px;">
                    <label><input type="checkbox" id="engineCat1" checked> Lusta</label>
                    <label><input type="checkbox" id="engineCat2" checked> Szerény</label>
                    <label><input type="checkbox" id="engineCat3" checked> Okos</label>
                    <label><input type="checkbox" id="engineCat4" checked> Kiváló</label>
                </div>
            </div>
            
            <div style="margin-bottom: 10px;">
                <strong style="font-size: 12px;">Troops:</strong>
            <div style="
                    margin-top: 5px;
                    padding: 8px;
                    background: white;
                border: 1px solid #d4b98a;
                    border-radius: 4px;
                    max-height: 120px;
                    overflow-y: auto;
            ">
                    ${troopCheckboxes}
                </div>
            </div>
            
            <!-- MODE TABS -->
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <button id="tabSmartScav" style="
                    flex: 1;
                    padding: 10px;
                    font-weight: bold;
                    font-size: 12px;
                    background: linear-gradient(to bottom, #f4e4bc, #e1d4a5);
                    border: 2px solid #7d510f;
                    border-radius: 4px;
                    cursor: pointer;
                    color: #5a3d0f;
                    text-shadow: 0 1px 0 rgba(255,255,255,0.5);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
                ">SMART</button>
                <button id="tabSimpleScav" style="
                    flex: 1;
                    padding: 10px;
                    font-weight: bold;
                    font-size: 12px;
                    background: linear-gradient(to bottom, #c9c9c9, #b0b0b0);
                    border: 2px solid #7d7d7d;
                    border-radius: 4px;
                    cursor: pointer;
                    color: #3a3a3a;
                    text-shadow: 0 1px 0 rgba(255,255,255,0.5);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
                ">SIMPLE</button>
            </div>
            
            <!-- SMART SCAV PANEL -->
            <div id="panelSmartScav" style="display: block; padding: 12px; background: #fff5da; border: 2px solid #d4b98a; border-radius: 5px; margin-bottom: 10px;">
                <h4 style="margin: 0 0 5px 0; font-size: 13px; color: #5a3d0f; font-weight: bold;">Smart Scav Mode</h4>
                <p style="font-size: 10px; margin: 0 0 10px 0; color: #7d510f; line-height: 1.3;">Intelligent 10-min batching. Opens tab only when needed.</p>
                
                <div id="smartStatus" style="background: #fff; padding: 8px; border-radius: 4px; margin-bottom: 10px; font-size: 11px; border: 1px solid #d4b98a;">
                    <div style="margin-bottom: 4px;"><strong>Batching:</strong> <span id="smartBatchInfo">-</span></div>
                    <div><strong>Next run:</strong> <span id="smartNextRun">-</span></div>
                </div>
                
                <div style="display: flex; gap: 6px;">
                    <button id="btnStartSmart" style="
                        flex: 1;
                padding: 10px;
                        background: linear-gradient(to bottom, #71d467, #5cb85c);
                        color: white;
                font-weight: bold;
                        border: 2px solid #4a934a;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        box-shadow: 0 2px 3px rgba(0,0,0,0.2);
                    ">START</button>
                    <button id="btnStopSmart" style="
                        flex: 1;
                        padding: 10px;
                        background: linear-gradient(to bottom, #e55353, #d43f3a);
                        color: white;
                        font-weight: bold;
                        border: 2px solid #ac2925;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        box-shadow: 0 2px 3px rgba(0,0,0,0.2);
                    ">STOP</button>
                </div>
            </div>
            
            <!-- SIMPLE SCAV PANEL -->
            <div id="panelSimpleScav" style="display: none; padding: 12px; background: #fff5da; border: 2px solid #d4b98a; border-radius: 5px; margin-bottom: 10px;">
                <h4 style="margin: 0 0 5px 0; font-size: 13px; color: #5a3d0f; font-weight: bold;">Simple Scav Mode</h4>
                <p style="font-size: 10px; margin: 0 0 10px 0; color: #7d510f; line-height: 1.3;">Loop with interval + randomization. No localStorage.</p>
            
            <div style="margin-bottom: 10px;">
                    <label style="display: block; font-size: 11px; margin-bottom: 4px; font-weight: bold; color: #5a3d0f;">Interval (seconds):</label>
                    <input type="number" id="simpleInterval" value="3600" min="0" max="7200" style="width: 100%; padding: 6px; font-size: 12px; border: 2px solid #d4b98a; border-radius: 3px; background: white;">
                    <small style="font-size: 9px; color: #7d510f;">0-7200s (0 = instant loop)</small>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 11px; cursor: pointer;">
                        <input type="checkbox" id="simpleRandomize" checked style="margin-right: 5px;">
                        Add 1-5 min random
                </label>
            </div>
            
                <div style="margin-bottom: 10px;">
                    <label style="display: block; font-size: 11px; margin-bottom: 4px; font-weight: bold; color: #5a3d0f;">Stop Time (optional):</label>
                    <div style="display: flex; gap: 5px; align-items: center; font-size: 11px;">
                        <input type="time" id="simpleStopStart" style="flex: 1; padding: 5px; font-size: 11px; border: 2px solid #d4b98a; border-radius: 3px; background: white;">
                        <span style="font-weight: bold;">to</span>
                        <input type="time" id="simpleStopEnd" style="flex: 1; padding: 5px; font-size: 11px; border: 2px solid #d4b98a; border-radius: 3px; background: white;">
            </div>
                    <small style="font-size: 9px; color: #7d510f;">Leave empty for 24/7</small>
                </div>
                
                <div id="simpleStatus" style="background: #fff; padding: 8px; border-radius: 4px; margin-bottom: 10px; font-size: 11px; border: 1px solid #d4b98a;">
                    <div><strong>Next run:</strong> <span id="simpleNextRun">-</span></div>
                </div>
                
                <div style="display: flex; gap: 6px;">
                    <button id="btnStartSimple" style="
                        flex: 1;
                        padding: 10px;
                        background: linear-gradient(to bottom, #71d467, #5cb85c);
                        color: white;
                        font-weight: bold;
                        border: 2px solid #4a934a;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        box-shadow: 0 2px 3px rgba(0,0,0,0.2);
                    ">START</button>
                    <button id="btnStopSimple" style="
                        flex: 1;
                        padding: 10px;
                        background: linear-gradient(to bottom, #e55353, #d43f3a);
                        color: white;
                        font-weight: bold;
                        border: 2px solid #ac2925;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        box-shadow: 0 2px 3px rgba(0,0,0,0.2);
                    ">STOP</button>
                </div>
            </div>
            
            <!-- STATS -->
            <div style="background: #fff5da; padding: 8px; border-radius: 5px; margin-bottom: 10px; font-size: 11px; border: 1px solid #d4b98a;">
                <div><strong>Runs:</strong> <span id="engineRuns">0</span></div>
                <div><strong>Last:</strong> <span id="engineLast">Never</span></div>
            </div>
            
            <!-- RUN ONCE BUTTON -->
            <button id="engineRunNow" style="
                width: 100%;
                padding: 12px;
                font-weight: bold;
                font-size: 13px;
                background: linear-gradient(to bottom, #ffd966, #f0b429);
                color: #5a3d0f;
                border: 2px solid #d4910f;
                border-radius: 4px;
                cursor: pointer;
                text-shadow: 0 1px 0 rgba(255,255,255,0.5);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">RUN ONCE</button>
        </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);

        // Minimize button
        const minimizeBtn = document.getElementById('scav-minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', function() {
                toggleUI();
            });
        }

        // Troop checkboxes
        document.querySelectorAll('.troop-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                CONFIG.enabledTroops[e.target.getAttribute('data-unit')] = e.target.checked;
                saveTroopSettings();
            });
        });

        // Tab switching
        document.getElementById('tabSmartScav').onclick = () => {
            document.getElementById('tabSmartScav').style.background = 'linear-gradient(to bottom, #f4e4bc, #e1d4a5)';
            document.getElementById('tabSmartScav').style.borderColor = '#7d510f';
            document.getElementById('tabSimpleScav').style.background = 'linear-gradient(to bottom, #c9c9c9, #b0b0b0)';
            document.getElementById('tabSimpleScav').style.borderColor = '#7d7d7d';
            document.getElementById('panelSmartScav').style.display = 'block';
            document.getElementById('panelSimpleScav').style.display = 'none';
        };

        document.getElementById('tabSimpleScav').onclick = () => {
            document.getElementById('tabSimpleScav').style.background = 'linear-gradient(to bottom, #f4e4bc, #e1d4a5)';
            document.getElementById('tabSimpleScav').style.borderColor = '#7d510f';
            document.getElementById('tabSmartScav').style.background = 'linear-gradient(to bottom, #c9c9c9, #b0b0b0)';
            document.getElementById('tabSmartScav').style.borderColor = '#7d7d7d';
            document.getElementById('panelSimpleScav').style.display = 'block';
            document.getElementById('panelSmartScav').style.display = 'none';
        };

        // Smart Scav buttons
        document.getElementById('btnStartSmart').onclick = () => {
            // Stop Simple if running
            if (CONFIG.simpleEnabled) {
                stopSimpleScav();
            }
            
            CONFIG.runtime = parseInt(document.getElementById('engineRuntime').value);
            CONFIG.enabledCategories = [
                document.getElementById('engineCat1').checked,
                document.getElementById('engineCat2').checked,
                document.getElementById('engineCat3').checked,
                document.getElementById('engineCat4').checked
            ];
            saveConfig();
            
            startSmartScav();
            UI.SuccessMessage('🧠 Smart Scav STARTED!');
        };

        document.getElementById('btnStopSmart').onclick = () => {
            stopSmartScav();
            UI.InfoMessage('🛑 Smart Scav STOPPED');
        };

        // Simple Scav buttons
        document.getElementById('btnStartSimple').onclick = () => {
            // Stop Smart if running
            if (CONFIG.smartEnabled) {
                stopSmartScav();
            }
            
            CONFIG.runtime = parseInt(document.getElementById('engineRuntime').value);
            CONFIG.enabledCategories = [
                document.getElementById('engineCat1').checked,
                document.getElementById('engineCat2').checked,
                document.getElementById('engineCat3').checked,
                document.getElementById('engineCat4').checked
            ];
            CONFIG.simpleInterval = parseInt(document.getElementById('simpleInterval').value);
            CONFIG.simpleRandomize = document.getElementById('simpleRandomize').checked;
            
            // Stop time config
            const stopStart = document.getElementById('simpleStopStart').value;
            const stopEnd = document.getElementById('simpleStopEnd').value;
            if (stopStart && stopEnd) {
                CONFIG.simpleStopTimes = [{start: stopStart, end: stopEnd}];
            } else {
                CONFIG.simpleStopTimes = [];
            }
            
            saveConfig();
            
            startSimpleScav();
            UI.SuccessMessage('⚡ Simple Scav STARTED!');
        };

        document.getElementById('btnStopSimple').onclick = () => {
            stopSimpleScav();
            UI.InfoMessage('🛑 Simple Scav STOPPED');
        };

        // Run Once button (uses Smart execution to extract data)
        document.getElementById('engineRunNow').onclick = () => {
            CONFIG.runtime = parseInt(document.getElementById('engineRuntime').value);
            CONFIG.enabledCategories = [
                document.getElementById('engineCat1').checked,
                document.getElementById('engineCat2').checked,
                document.getElementById('engineCat3').checked,
                document.getElementById('engineCat4').checked
            ];
            saveConfig();
            executeSmartScavenging();
        };

        // Load saved Simple Scav config
        document.getElementById('simpleInterval').value = CONFIG.simpleInterval || 3600;
        document.getElementById('simpleRandomize').checked = CONFIG.simpleRandomize !== false;
        if (CONFIG.simpleStopTimes && CONFIG.simpleStopTimes.length > 0) {
            document.getElementById('simpleStopStart').value = CONFIG.simpleStopTimes[0].start;
            document.getElementById('simpleStopEnd').value = CONFIG.simpleStopTimes[0].end;
        }

        setInterval(updateUI, 1000);
    }

    function updateUI() {
        const statusEl = document.getElementById('engineStatus');
        const modeEl = document.getElementById('engineMode');
        
        // Update main status
        if (CONFIG.smartEnabled) {
            if (isSmartRunning) {
                statusEl.textContent = 'RUNNING';
                statusEl.style.background = 'linear-gradient(to bottom, #87CEEB, #6db8e8)';
                statusEl.style.color = '#003366';
        } else {
                statusEl.textContent = 'ACTIVE';
                statusEl.style.background = 'linear-gradient(to bottom, #90EE90, #76d376)';
                statusEl.style.color = '#0a4d0a';
            }
            modeEl.textContent = '(Smart Mode)';
            modeEl.style.color = '#0a4d0a';
        } else if (CONFIG.simpleEnabled) {
            if (isSimpleRunning) {
                statusEl.textContent = 'RUNNING';
                statusEl.style.background = 'linear-gradient(to bottom, #87CEEB, #6db8e8)';
                statusEl.style.color = '#003366';
            } else {
                statusEl.textContent = 'ACTIVE';
                statusEl.style.background = 'linear-gradient(to bottom, #ffd966, #f0b429)';
                statusEl.style.color = '#5a3d0f';
            }
            modeEl.textContent = '(Simple Mode)';
            modeEl.style.color = '#5a3d0f';
        } else {
            statusEl.textContent = 'STOPPED';
            statusEl.style.background = 'linear-gradient(to bottom, #FFB6C1, #ff9ba8)';
            statusEl.style.color = '#8B0000';
            modeEl.textContent = '';
        }
        
        document.getElementById('engineRuns').textContent = CONFIG.stats.totalRuns;
        
        if (CONFIG.stats.lastRun) {
            document.getElementById('engineLast').textContent = new Date(CONFIG.stats.lastRun).toLocaleTimeString();
        }

        // Update Smart Scav panel
        if (CONFIG.smartEnabled) {
            const slotStatus = getSlotStatus();
            
            if (slotStatus.hasData && slotStatus.secondsLeft) {
                const m = slotStatus.minutesLeft || 0;
                const s = (slotStatus.secondsLeft || 0) % 60;
                document.getElementById('smartNextRun').textContent = `${m}m ${s}s`;
                document.getElementById('smartBatchInfo').textContent = slotStatus.message || '-';
            } else if (isSmartRunning) {
                document.getElementById('smartNextRun').textContent = 'Running...';
                document.getElementById('smartBatchInfo').textContent = 'Scavenging now';
                } else {
                document.getElementById('smartNextRun').textContent = 'Ready';
                document.getElementById('smartBatchInfo').textContent = slotStatus.message || '-';
                }
            } else {
            document.getElementById('smartNextRun').textContent = '-';
            document.getElementById('smartBatchInfo').textContent = '-';
        }

        // Update Simple Scav panel
        if (CONFIG.simpleEnabled && CONFIG.stats.nextRunTime) {
            const nextRun = new Date(CONFIG.stats.nextRunTime);
            const now = new Date();
            const diffMs = nextRun - now;
            
            if (diffMs > 0) {
                const m = Math.floor(diffMs / 60000);
                const s = Math.floor((diffMs % 60000) / 1000);
                document.getElementById('simpleNextRun').textContent = `${m}m ${s}s`;
            } else if (isSimpleRunning) {
                document.getElementById('simpleNextRun').textContent = 'Running...';
                } else {
                document.getElementById('simpleNextRun').textContent = 'Soon...';
            }
        } else {
            document.getElementById('simpleNextRun').textContent = '-';
        }
    }

    // =========================================================================
    // INIT
    // =========================================================================

    function init() {
        initTroopSettings();

        if (window.location.href.includes('screen=overview')) {
            // Create toggle button
            createToggleButton();
            
            // Create UI if it was visible before
            if (CONFIG.uiVisible) {
                createEngineUI();
                const engineUI = document.getElementById('scavengeEngine');
                if (engineUI) {
                    engineUI.style.display = 'block';
                    const button = document.getElementById('scav-toggle-btn');
                    if (button) button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
                }
            }
            
            // Start bot detection
            startBotDetection();
            
            // Resume mode if it was running
            if (CONFIG.smartEnabled && CONFIG.mode === 'smart') {
                log('Resuming Smart Scav mode');
                startSmartScav();
            } else if (CONFIG.simpleEnabled && CONFIG.mode === 'simple') {
                log('Resuming Simple Scav mode');
                startSimpleScav();
            }
            
            log('Norbi0N Scav Engine initialized - click icon to open');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();