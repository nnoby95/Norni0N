// ==UserScript==
// @name         Troop Recruitment Engine
// @version      1.0.0
// @description  Automated troop recruitment with templates + background loop mode
// @author       Norbi0N
// @match        https://*.tribalwars.net/game.php*
// @match        https://*.klanhaboru.hu/game.php*
// @icon         https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/Norbi0n_Recruit_27x27.png
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-recruiter-engine.meta.js
// @downloadURL  https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-recruiter-engine.user.js
// ==/UserScript==

(function() {
'use strict';

// =========================================================================
// CONFIGURATION
// =========================================================================

let CONFIG = {
    enabled: false,
    interval: 30, // minutes (default 30 min for troops)
    randomize: true, // add 1-15 min randomization

    stats: {
        totalRuns: 0,
        lastRun: null,
        nextRunTime: null
    },

    uiVisible: false
};

const saved = GM_getValue('recruiter_engine_config');
if (saved) CONFIG = JSON.parse(saved);

function saveConfig() {
    GM_setValue('recruiter_engine_config', JSON.stringify(CONFIG));
}

function log(msg) {
    console.log(`[Recruiter Engine] ${msg}`);
}

// =========================================================================
// GLOBAL VARIABLES
// =========================================================================

// For screen=train
let recruitTemplates = {}; // Stored recruitment templates

// For background loop (overview)
let loopTimeout = null;
let isLoopRunning = false;

// =========================================================================
// TEMPLATE SYSTEM
// =========================================================================

/**
 * Parses recruitment template
 * Format: "spear 100; sword 50; axe 80"
 * @param {string} templateStr Template string
 * @returns {Object} Object with unit names as keys and amounts as values
 */
function parseRecruitTemplate(templateStr) {
    let template = {};
    if (!templateStr || templateStr.trim() === "") {
        return template;
    }

    // Split by semicolon or newline
    let entries = templateStr.split(/[;\n]/).map(s => s.trim()).filter(s => s.length > 0);

    entries.forEach(entry => {
        // Match pattern: "unitName amount"
        let match = entry.match(/^(\w+)\s+(\d+)$/);
        if (match) {
            let unitId = match[1].toLowerCase();
            let amount = parseInt(match[2]);
            template[unitId] = amount;
        }
    });

    return template;
}

/**
 * Saves recruitment template
 */
function saveRecruitTemplate() {
    let templateName = prompt("Enter template name:");
    if (!templateName) return;

    let templateStr = document.getElementById("recruitTemplateInput").value.trim();

    if (!templateStr) {
        UI.ErrorMessage("No template to save. Please enter a template first.");
        return;
    }

    recruitTemplates[templateName] = templateStr;
    localStorage.recruitTemplates = JSON.stringify(recruitTemplates);

    updateRecruitTemplateDropdown();
    UI.SuccessMessage("Template '" + templateName + "' saved!");
}

/**
 * Updates the template dropdown
 */
function updateRecruitTemplateDropdown() {
    let select = document.getElementById("savedRecruitTemplatesSelect");
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Template --</option>';

    for (let name in recruitTemplates) {
        let option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
}

/**
 * Deletes a saved template
 */
function deleteRecruitTemplate() {
    let select = document.getElementById("savedRecruitTemplatesSelect");
    let templateName = select.value;

    if (!templateName) {
        UI.ErrorMessage("Please select a template to delete.");
        return;
    }

    if (confirm("Delete template '" + templateName + "'?")) {
        delete recruitTemplates[templateName];
        localStorage.recruitTemplates = JSON.stringify(recruitTemplates);
        updateRecruitTemplateDropdown();
        UI.SuccessMessage("Template deleted!");
    }
}

/**
 * Loads template and saves to localStorage for the current village
 */
function loadRecruitTemplate(templateStr) {
    try {
        let template = parseRecruitTemplate(templateStr);

        if (Object.keys(template).length === 0) {
            UI.ErrorMessage("Invalid template format. Use: 'spear 100; sword 50; axe 80'");
            return;
        }

        // Save template to localStorage per village
        let villageId = game_data.village.id;
        let villageTemplates = {};

        if (localStorage.recruitVillageTemplates) {
            villageTemplates = JSON.parse(localStorage.recruitVillageTemplates);
        }

        villageTemplates[villageId] = template;
        localStorage.recruitVillageTemplates = JSON.stringify(villageTemplates);

        console.log("Template loaded for village " + villageId + ":", template);
        UI.SuccessMessage("Template loaded! " + Object.keys(template).length + " unit types.");

        // Update UI if exists
        let statusEl = document.getElementById("recruitStatus");
        if (statusEl) {
            statusEl.textContent = Object.keys(template).length + " unit types configured";
            statusEl.style.color = '#28a745';
        }

    } catch (e) {
        console.error("Error loading template:", e);
        UI.ErrorMessage("Error loading template: " + e.message);
    }
}

// =========================================================================
// TAB OPERATIONS
// =========================================================================

function openTrainTab() {
    return new Promise((resolve, reject) => {
        const trainUrl = game_data.player.sitter > 0
            ? `${game_data.link_base_pure}train&t=${game_data.player.id}`
            : `${game_data.link_base_pure}train`;

        const trainTab = window.open(trainUrl, '_blank');
        if (!trainTab) {
            reject(new Error('Failed to open tab'));
            return;
        }

        const checkLoaded = setInterval(() => {
            try {
                if (trainTab.document.readyState === 'complete') {
                    clearInterval(checkLoaded);
                    resolve(trainTab);
                }
            } catch (e) {}
        }, 500);

        setTimeout(() => {
            clearInterval(checkLoaded);
            reject(new Error('Timeout'));
        }, 15000);
    });
}

/**
 * Gets current troop counts from the game
 * @param {Document} doc Document object
 * @returns {Object} Current troop counts {spear: 150, sword: 80, ...}
 */
function getCurrentTroopCounts(doc) {
    let troops = {};

    // Parse from the troop count column (format: "1859/1859")
    try {
        const allRows = doc.querySelectorAll('#train_form tr');

        allRows.forEach(row => {
            const unitLink = row.querySelector('.unit_link');
            if (!unitLink) return;

            const unitId = unitLink.getAttribute('data-unit');
            if (!unitId) return;

            // Find the count column (format: "1859/1859" or "0/0")
            const countCell = row.querySelector('td[style*="text-align: center"]');
            if (countCell) {
                const countText = countCell.textContent.trim();
                // Extract first number (in village count)
                const match = countText.match(/^(\d+)\//);
                if (match) {
                    troops[unitId] = parseInt(match[1]);
                }
            }
        });

        log('Got troop counts from DOM: ' + JSON.stringify(troops));
    } catch (e) {
        log('Could not parse troops from DOM: ' + e.message);
    }

    return troops;
}

/**
 * Gets unit costs from the page
 * @param {Document} doc Document object
 * @param {string} unitId Unit ID
 * @returns {Object} {wood: X, stone: Y, iron: Z, pop: P}
 */
function getUnitCosts(doc, unitId) {
    try {
        // Costs are in format: <span id="axe_0_cost_wood">60</span>
        const wood = parseInt(doc.getElementById(`${unitId}_0_cost_wood`)?.textContent) || 0;
        const stone = parseInt(doc.getElementById(`${unitId}_0_cost_stone`)?.textContent) || 0;
        const iron = parseInt(doc.getElementById(`${unitId}_0_cost_iron`)?.textContent) || 0;
        const pop = parseInt(doc.getElementById(`${unitId}_0_cost_pop`)?.textContent) || 0;

        return {wood, stone, iron, pop};
    } catch (e) {
        log(`Could not get costs for ${unitId}: ` + e.message);
        return null;
    }
}

/**
 * Calculates how many units we can afford
 * @param {Object} costs Unit costs {wood, stone, iron, pop}
 * @param {Object} resources Available resources {wood, stone, iron, pop}
 * @param {number} maxWant Maximum we want to recruit
 * @returns {number} Amount we can afford
 */
function calculateAffordable(costs, resources, maxWant) {
    if (!costs || !resources) return 0;

    const affordableWood = Math.floor(resources.wood / costs.wood);
    const affordableStone = Math.floor(resources.stone / costs.stone);
    const affordableIron = Math.floor(resources.iron / costs.iron);
    const affordablePop = Math.floor(resources.pop / costs.pop);

    const maxAffordable = Math.min(affordableWood, affordableStone, affordableIron, affordablePop);

    return Math.min(maxAffordable, maxWant);
}

async function checkAndRecruit(trainTab) {
    const doc = trainTab.document;

    log('Checking for troops to recruit...');

    // Get village ID
    const villageId = trainTab.game_data.village.id;

    // Get template for this village
    let template = {};
    try {
        const villageTemplates = localStorage.getItem('recruitVillageTemplates');
        if (villageTemplates) {
            const parsed = JSON.parse(villageTemplates);
            if (parsed[villageId]) {
                template = parsed[villageId];
                log('Template found: ' + JSON.stringify(template));
            } else {
                log('No template for village ' + villageId);
                return;
            }
        } else {
            log('No templates stored');
            return;
        }
    } catch (e) {
        log('Could not get template: ' + e.message);
        return;
    }

    if (Object.keys(template).length === 0) {
        log('Template is empty');
        return;
    }

    // Get current troop counts
    const currentTroops = getCurrentTroopCounts(doc);
    log('Current troops: ' + JSON.stringify(currentTroops));

    // Get available resources
    const resources = {
        wood: parseInt(doc.getElementById('wood').textContent),
        stone: parseInt(doc.getElementById('stone').textContent),
        iron: parseInt(doc.getElementById('iron').textContent),
        pop: 0
    };

    // Get population
    try {
        const popCurrent = parseInt(doc.getElementById('pop_current_label').textContent) || 0;
        const popMax = parseInt(doc.getElementById('pop_max_label').textContent) || 0;
        resources.pop = popMax - popCurrent;
    } catch (e) {
        log('Could not get population: ' + e.message);
        resources.pop = 100; // Default fallback
    }

    log('Resources: Wood=' + resources.wood + ', Stone=' + resources.stone + ', Iron=' + resources.iron + ', Pop=' + resources.pop);

    // Define recruitment categories (order matters!)
    const categories = {
        barracks: ['spear', 'sword', 'axe', 'archer'],
        stable: ['spy', 'light', 'marcher', 'heavy'],
        garage: ['ram', 'catapult']
    };

    const BATCH_SIZE = 20; // Max per unit per batch
    let anyRecruited = false;
    let tempResources = {...resources}; // Track resources as we calculate

    // Get the main form and submit button
    const trainForm = doc.getElementById('train_form');
    if (!trainForm) {
        log('Train form not found!');
        return;
    }

    // Calculate what to recruit for each category
    for (let categoryName in categories) {
        const unitsInCategory = categories[categoryName];

        log(`Processing ${categoryName}...`);

        for (let unitId of unitsInCategory) {
            // Check if this unit is in our template
            if (!template[unitId]) continue;

            const targetAmount = template[unitId];
            const currentAmount = currentTroops[unitId] || 0;

            // Calculate how many more we need
            const needed = targetAmount - currentAmount;

            if (needed <= 0) {
                log(`  - ${unitId}: ✓ target reached (${currentAmount}/${targetAmount})`);
                continue;
            }

            log(`  - ${unitId}: current=${currentAmount}, target=${targetAmount}, needed=${needed}`);

            // Get unit costs
            const costs = getUnitCosts(doc, unitId);
            if (!costs) {
                log(`    └─ Could not get costs, skipping`);
                continue;
            }

            log(`    └─ Costs: Wood=${costs.wood}, Stone=${costs.stone}, Iron=${costs.iron}, Pop=${costs.pop}`);

            // Calculate how many we can afford
            const maxWant = Math.min(needed, BATCH_SIZE);
            const affordable = calculateAffordable(costs, tempResources, maxWant);

            if (affordable <= 0) {
                log(`    └─ Cannot afford any (wanted ${maxWant})`);
                continue;
            }

            log(`    └─ Will recruit ${affordable} ${unitId}`);

            // Fill the input field
            const inputField = doc.querySelector(`input[name="${unitId}"]`);
            if (inputField) {
                inputField.value = affordable;
                log(`    └─ Set input: ${unitId} = ${affordable}`);
                anyRecruited = true;

                // Deduct from temp resources
                tempResources.wood -= costs.wood * affordable;
                tempResources.stone -= costs.stone * affordable;
                tempResources.iron -= costs.iron * affordable;
                tempResources.pop -= costs.pop * affordable;

                log(`    └─ Remaining: Wood=${tempResources.wood}, Stone=${tempResources.stone}, Iron=${tempResources.iron}, Pop=${tempResources.pop}`);
            }
        }
    }

    // If we set any inputs, click the submit button
    if (anyRecruited) {
        const submitBtn = trainForm.querySelector('input[type="submit"]');
        if (submitBtn) {
            log('Clicking submit button...');
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
            submitBtn.click();
            log('✅ Recruitment submitted!');
        } else {
            log('⚠️ Submit button not found');
        }
    } else {
        log('⚠️ No troops recruited (targets reached or not enough resources)');
    }
}

// =========================================================================
// EXECUTION
// =========================================================================

async function executeRecruitmentCheck() {
    log('=== STARTING RECRUITMENT CHECK ===');

    try {
        const trainTab = await openTrainTab();
        log('Tab opened');

        await checkAndRecruit(trainTab);

        log('Waiting 10 seconds...');
        await new Promise(r => setTimeout(r, 10000));

        trainTab.close();
        log('Tab closed');

        CONFIG.stats.totalRuns++;
        CONFIG.stats.lastRun = new Date().toISOString();
        saveConfig();

        log('=== RECRUITMENT CHECK COMPLETE ===');

        return true;

    } catch (error) {
        log('ERROR: ' + error.message);
        return false;
    }
}

// =========================================================================
// LOOP MODE
// =========================================================================

function startRecruiterLoop() {
    log('⚔️ Recruiter Loop started');
    CONFIG.enabled = true;

    if (loopTimeout) clearTimeout(loopTimeout);

    function loop() {
        if (!CONFIG.enabled) return;

        if (isLoopRunning) {
            log('⚠ Recruiter already running, skipping');
            loopTimeout = setTimeout(loop, 5000);
            return;
        }

        log('▶ Recruiter Loop: Running...');
        isLoopRunning = true;

        executeRecruitmentCheck().then(() => {
            isLoopRunning = false;

            // Calculate next run with randomization
            let nextRunMinutes = CONFIG.interval;

            if (CONFIG.randomize) {
                const randomMins = Math.floor(Math.random() * 15) + 1; // 1-15 minutes
                nextRunMinutes += randomMins;
                log(`⏰ Next run in ${nextRunMinutes}m (base: ${CONFIG.interval}m + random: ${randomMins}m)`);
            } else {
                log(`⏰ Next run in ${nextRunMinutes}m`);
            }

            CONFIG.stats.nextRunTime = new Date(Date.now() + nextRunMinutes * 60 * 1000).toISOString();
            saveConfig();

            loopTimeout = setTimeout(loop, nextRunMinutes * 60 * 1000);
        }).catch((error) => {
            isLoopRunning = false;
            log('❌ Error: ' + error.message);
            loopTimeout = setTimeout(loop, 60000);
        });
    }

    // Check if we should run immediately or wait
    const now = Date.now();
    const nextRun = CONFIG.stats.nextRunTime ? new Date(CONFIG.stats.nextRunTime).getTime() : 0;

    if (nextRun > now) {
        const waitMs = nextRun - now;
        log(`📅 Resuming - next run in ${Math.floor(waitMs/60000)}m`);
        saveConfig();
        loopTimeout = setTimeout(loop, waitMs);
    } else {
        log('▶ Starting - running immediately');
        saveConfig();
        setTimeout(loop, 3000);
    }
}

function stopRecruiterLoop() {
    log('🛑 Recruiter Loop stopped');
    CONFIG.enabled = false;
    CONFIG.stats.nextRunTime = null;
    saveConfig();

    if (loopTimeout) clearTimeout(loopTimeout);
}

// =========================================================================
// QUEST BAR BUTTON + ENGINE UI (for overview screen)
// =========================================================================

function createToggleButton() {
    const existing = document.getElementById('recruiter-toggle-btn');
    if (existing) existing.remove();

    const buttonHTML = `
        <div class="quest opened recruiter-toggle"
             id="recruiter-toggle-btn"
             style="background-size: 26px;
                    background-image: url('https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/Norbi0n_Recruit_27x27.png');
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
                RECRUIT
            </div>
        </div>
    `;

    const questlog = document.getElementById('questlog_new');
    if (questlog) {
        questlog.insertAdjacentHTML('beforeend', buttonHTML);

        const button = document.getElementById('recruiter-toggle-btn');

        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleEngineUI();
        });

        button.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
        });

        button.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });

        log('Toggle button created');
    }
}

function toggleEngineUI() {
    let engineUI = document.getElementById('recruiterEngine');

    if (!engineUI) {
        createEngineUI();
        engineUI = document.getElementById('recruiterEngine');
    }

    const button = document.getElementById('recruiter-toggle-btn');
    if (!engineUI) return;

    CONFIG.uiVisible = !CONFIG.uiVisible;

    if (CONFIG.uiVisible) {
        engineUI.style.display = 'block';
        if (button) button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
    } else {
        engineUI.style.display = 'none';
        if (button) button.style.backgroundColor = '';
    }

    saveConfig();
}

function createEngineUI() {
    const html = `
    <div id="recruiterEngine" style="
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
                    Troop Recruiter Engine
                </h3>
                <small style="color: #ffffdf;">v1.0 - Background Loop</small>
            </div>
            <button id="recruiter-minimize-btn"
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
            <span id="recruiterStatus" style="
                padding: 3px 8px;
                border-radius: 4px;
                font-weight: bold;
                margin-left: 8px;
                font-size: 11px;
                background: #FFB6C1;
                color: #8B0000;
            ">STOPPED</span>
        </div>

        <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">
                Loop Interval (minutes):
            </label>
            <input type="number" id="recruiterInterval" value="30" min="1" max="180" style="
                width: 100%;
                padding: 6px;
                border: 2px solid #7d510f;
                border-radius: 4px;
                background: white;
                font-size: 12px;
            ">
            <small style="font-size: 9px; color: #7d510f;">Base interval (adds 1-15 min random)</small>
        </div>

        <div style="margin-bottom: 10px;">
            <label style="font-size: 11px; cursor: pointer;">
                <input type="checkbox" id="recruiterRandomize" checked style="margin-right: 5px;">
                Add 1-15 min random delay
            </label>
        </div>

        <div style="background: #fff5da; padding: 8px; border-radius: 5px; margin-bottom: 10px; font-size: 11px; border: 1px solid #d4b98a;">
            <div><strong>Next run:</strong> <span id="recruiterNextRun">-</span></div>
            <div><strong>Runs:</strong> <span id="recruiterTotalRuns">0</span></div>
            <div><strong>Last:</strong> <span id="recruiterLastRun">Never</span></div>
        </div>

        <div style="display: flex; gap: 6px; margin-bottom: 10px;">
            <button id="btnStartRecruiter" style="
                flex: 1;
                padding: 12px;
                background: linear-gradient(to bottom, #71d467, #5cb85c);
                color: white;
                font-weight: bold;
                border: 2px solid #4a934a;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                box-shadow: 0 2px 3px rgba(0,0,0,0.2);
            ">START</button>
            <button id="btnStopRecruiter" style="
                flex: 1;
                padding: 12px;
                background: linear-gradient(to bottom, #e55353, #d43f3a);
                color: white;
                font-weight: bold;
                border: 2px solid #ac2925;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                box-shadow: 0 2px 3px rgba(0,0,0,0.2);
            ">STOP</button>
        </div>

        <button id="recruiterRunNow" style="
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

        <div style="margin-top: 10px; padding: 8px; background: #e8f4f8; border-radius: 4px; font-size: 10px; color: #333;">
            <strong>ℹ️ How it works:</strong><br>
            1. Set template on screen=train<br>
            2. Loop opens train tab every X minutes<br>
            3. Recruits troops from template<br>
            4. Waits 10s, closes tab<br>
            5. Repeats with randomization
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Minimize button
    document.getElementById('recruiter-minimize-btn').addEventListener('click', function() {
        toggleEngineUI();
    });

    // Load saved config
    document.getElementById('recruiterInterval').value = CONFIG.interval || 30;
    document.getElementById('recruiterRandomize').checked = CONFIG.randomize !== false;

    // Start button
    document.getElementById('btnStartRecruiter').onclick = () => {
        CONFIG.interval = parseInt(document.getElementById('recruiterInterval').value);
        CONFIG.randomize = document.getElementById('recruiterRandomize').checked;
        saveConfig();

        startRecruiterLoop();
        UI.SuccessMessage('⚔️ Recruiter Loop STARTED!');
    };

    // Stop button
    document.getElementById('btnStopRecruiter').onclick = () => {
        stopRecruiterLoop();
        UI.InfoMessage('🛑 Recruiter Loop STOPPED');
    };

    // Run once button
    document.getElementById('recruiterRunNow').onclick = () => {
        executeRecruitmentCheck();
    };

    setInterval(updateEngineUI, 1000);
}

function updateEngineUI() {
    const statusEl = document.getElementById('recruiterStatus');
    if (!statusEl) return;

    if (CONFIG.enabled) {
        if (isLoopRunning) {
            statusEl.textContent = 'RUNNING';
            statusEl.style.background = 'linear-gradient(to bottom, #87CEEB, #6db8e8)';
            statusEl.style.color = '#003366';
        } else {
            statusEl.textContent = 'ACTIVE';
            statusEl.style.background = 'linear-gradient(to bottom, #90EE90, #76d376)';
            statusEl.style.color = '#0a4d0a';
        }
    } else {
        statusEl.textContent = 'STOPPED';
        statusEl.style.background = 'linear-gradient(to bottom, #FFB6C1, #ff9ba8)';
        statusEl.style.color = '#8B0000';
    }

    document.getElementById('recruiterTotalRuns').textContent = CONFIG.stats.totalRuns;

    if (CONFIG.stats.lastRun) {
        document.getElementById('recruiterLastRun').textContent = new Date(CONFIG.stats.lastRun).toLocaleTimeString();
    }

    if (CONFIG.enabled && CONFIG.stats.nextRunTime) {
        const nextRun = new Date(CONFIG.stats.nextRunTime);
        const now = new Date();
        const diffMs = nextRun - now;

        if (diffMs > 0) {
            const m = Math.floor(diffMs / 60000);
            const s = Math.floor((diffMs % 60000) / 1000);
            document.getElementById('recruiterNextRun').textContent = `${m}m ${s}s`;
        } else if (isLoopRunning) {
            document.getElementById('recruiterNextRun').textContent = 'Running...';
        } else {
            document.getElementById('recruiterNextRun').textContent = 'Soon...';
        }
    } else {
        document.getElementById('recruiterNextRun').textContent = '-';
    }
}

// =========================================================================
// TRAIN SCREEN UI
// =========================================================================

function initTrainScreen() {
    log('Initializing on train screen');

    const putEleBefore = document.getElementById("contentContainer");
    if (!putEleBefore) return;

    let newDiv = document.createElement("div");

    let newTable = `<table class="vis" style="width:100%; font-size:11px; margin-bottom:10px;">
        <tr>
            <th colspan="4" style="text-align:center; padding:5px; font-size:13px; background-color:#c1a264;">
                ⚔️ Troop Recruiter Engine v1.0
            </th>
        </tr>
        <tr>
            <td colspan="4" style="padding:5px; background-color:#f4e4bc;">
                <div style="font-weight:bold; font-size:11px; margin-bottom:3px;">
                    Status: <span id="recruitStatus" style="color:#666;">No template loaded</span>
                </div>
            </td>
        </tr>
        <tr>
            <th colspan="4" style="text-align:left; padding:4px 8px; background-color:#c1a264; font-size:11px; cursor:pointer;" id="templateHeader">
                <span style="float:right;" id="templateToggle">▼</span>
                📋 Template Manager
            </th>
        </tr>
        <tbody id="templateBody">
            <tr>
                <td colspan="4" style="padding: 5px;">
                    <textarea id="recruitTemplateInput" placeholder="Example: spear 100; sword 50; axe 80; archer 50&#10;&#10;Enter unit amounts here..."
                        style="width: 99%; height: 45px; font-family: monospace; font-size:10px; padding: 5px; border: 2px solid #c1a264; background-color:#fff;"></textarea>
                </td>
            </tr>
            <tr>
                <td colspan="4" style="padding: 5px;">
                    <button id="loadRecruitTemplateBtn" class="btn btn-confirm-yes" style="padding:4px 12px; font-size:11px; font-weight:bold;">▶ Load Template</button>
                    <span style="margin:0 5px; color:#c1a264;">|</span>
                    <button id="saveRecruitTemplateBtn" class="btn btn-default" style="padding:4px 8px; font-size:10px;">💾 Save</button>
                    <button id="exportRecruitTemplateBtn" class="btn btn-default" style="padding:4px 8px; font-size:10px;">📤 Export</button>
                    <button id="copyRecruitTemplateBtn" class="btn btn-default" style="padding:4px 8px; font-size:10px;">📋 Copy</button>
                    <input type="file" id="importRecruitTemplateFile" accept=".txt" style="display:none;">
                    <button id="importRecruitTemplateBtn" class="btn btn-default" style="padding:4px 8px; font-size:10px;">📁 Import</button>
                </td>
            </tr>
            <tr>
                <td colspan="4" style="padding: 5px;">
                    <select id="savedRecruitTemplatesSelect" style="width:200px; font-size:10px; padding:3px;">
                        <option value="">-- Select Saved Template --</option>
                    </select>
                    <button id="loadSavedRecruitTemplateBtn" class="btn btn-default" style="padding:3px 10px; font-size:10px;">Load</button>
                    <button id="deleteRecruitTemplateBtn" class="btn btn-cancel" style="padding:3px 10px; font-size:10px;">Delete</button>
                </td>
            </tr>
            <tr>
                <td colspan="4" style="padding: 8px; background: #e8f4f8; font-size:10px;">
                    <strong>Unit IDs:</strong> spear, sword, axe, archer, spy, light, marcher, heavy, ram, catapult, knight, snob
                </td>
            </tr>
        </tbody>
        </table>`;

    newDiv.innerHTML = newTable;
    putEleBefore.parentElement.insertBefore(newDiv, putEleBefore);

    // Load saved templates
    if (localStorage.recruitTemplates) {
        recruitTemplates = JSON.parse(localStorage.recruitTemplates);
        updateRecruitTemplateDropdown();
    }

    // Load current village template and display it
    try {
        const villageId = game_data.village.id;
        const villageTemplates = localStorage.getItem('recruitVillageTemplates');

        if (villageTemplates) {
            const parsed = JSON.parse(villageTemplates);
            if (parsed[villageId]) {
                // Convert template object back to string format
                const template = parsed[villageId];
                const templateStr = Object.keys(template).map(unit => `${unit} ${template[unit]}`).join('; ');

                // Display in textarea
                document.getElementById("recruitTemplateInput").value = templateStr;

                // Update status
                const statusEl = document.getElementById("recruitStatus");
                if (statusEl) {
                    statusEl.textContent = Object.keys(template).length + " unit types configured";
                    statusEl.style.color = '#28a745';
                }

                log('Restored template for village ' + villageId + ': ' + templateStr);
            }
        }
    } catch (e) {
        log('Could not restore template: ' + e.message);
    }

    // Template collapse state
    let templateCollapsed = localStorage.recruitTemplateCollapsed === 'true' || false;
    if (templateCollapsed) {
        document.getElementById("templateBody").style.display = 'none';
        document.getElementById("templateToggle").textContent = '▶';
    }

    // Template toggle
    document.getElementById("templateHeader").addEventListener("click", function() {
        let templateBody = document.getElementById("templateBody");
        let templateToggle = document.getElementById("templateToggle");

        if (templateBody.style.display === 'none') {
            templateBody.style.display = '';
            templateToggle.textContent = '▼';
            localStorage.recruitTemplateCollapsed = 'false';
        } else {
            templateBody.style.display = 'none';
            templateToggle.textContent = '▶';
            localStorage.recruitTemplateCollapsed = 'true';
        }
    });

    // Event listeners
    document.getElementById("loadRecruitTemplateBtn").addEventListener("click", function() {
        let templateStr = document.getElementById("recruitTemplateInput").value.trim();
        if (templateStr) {
            loadRecruitTemplate(templateStr);
        } else {
            UI.ErrorMessage("Please enter a template first.");
        }
    });

    document.getElementById("saveRecruitTemplateBtn").addEventListener("click", function() {
        saveRecruitTemplate();
    });

    document.getElementById("exportRecruitTemplateBtn").addEventListener("click", function() {
        let templateStr = document.getElementById("recruitTemplateInput").value.trim();
        if (!templateStr) {
            UI.ErrorMessage("No template to export.");
            return;
        }
        let blob = new Blob([templateStr], { type: "text/plain" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "recruit_template_" + game_data.village.id + ".txt";
        a.click();
        URL.revokeObjectURL(url);
        UI.SuccessMessage("Template exported!");
    });

    document.getElementById("copyRecruitTemplateBtn").addEventListener("click", function() {
        let templateStr = document.getElementById("recruitTemplateInput").value.trim();
        if (!templateStr) {
            UI.ErrorMessage("No template to copy.");
            return;
        }
        navigator.clipboard.writeText(templateStr).then(() => {
            UI.SuccessMessage("Template copied!");
        });
    });

    document.getElementById("importRecruitTemplateBtn").addEventListener("click", function() {
        document.getElementById("importRecruitTemplateFile").click();
    });

    document.getElementById("importRecruitTemplateFile").addEventListener("change", function(e) {
        let file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById("recruitTemplateInput").value = event.target.result;
                UI.SuccessMessage("Template imported!");
            };
            reader.readAsText(file);
        }
    });

    document.getElementById("loadSavedRecruitTemplateBtn").addEventListener("click", function() {
        let select = document.getElementById("savedRecruitTemplatesSelect");
        let templateName = select.value;

        if (!templateName) {
            UI.ErrorMessage("Please select a template to load.");
            return;
        }

        document.getElementById("recruitTemplateInput").value = recruitTemplates[templateName];
        UI.SuccessMessage("Template '" + templateName + "' loaded!");
    });

    document.getElementById("deleteRecruitTemplateBtn").addEventListener("click", function() {
        deleteRecruitTemplate();
    });
}

// =========================================================================
// INITIALIZATION - DUAL MODE
// =========================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRecruiterEngine);
} else {
    initRecruiterEngine();
}

function initRecruiterEngine() {
    const currentUrl = window.location.href;

    if (currentUrl.includes('screen=overview')) {
        // OVERVIEW SCREEN - Show quest bar button + control panel
        initOverviewMode();
    } else if (currentUrl.includes('screen=train')) {
        // TRAIN SCREEN - Show template UI
        initTrainScreen();
    }
}

function initOverviewMode() {
    log('Initializing on overview screen');

    // Create quest bar button
    createToggleButton();

    // Create UI if it was visible before
    if (CONFIG.uiVisible) {
        createEngineUI();
        const engineUI = document.getElementById('recruiterEngine');
        if (engineUI) {
            engineUI.style.display = 'block';
            const button = document.getElementById('recruiter-toggle-btn');
            if (button) button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        }
    }

    // Resume loop if it was running
    if (CONFIG.enabled) {
        log('Resuming Recruiter Loop');
        startRecruiterLoop();
    }

    log('Recruiter Engine initialized - click icon to open');
}

// =========================================================================
// END OF SCRIPT
// =========================================================================

})();

