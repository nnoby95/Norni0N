// ==UserScript==
// @name         Auto Builder Engine
// @version      1.0.0
// @description  Automated building with templates + background loop mode
// @author       Norbi0N
// @match        https://*.tribalwars.net/game.php*
// @match        https://*.klanhaboru.hu/game.php*
// @icon         https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_builder_27x27.png
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-builder-engine.meta.js
// @downloadURL  https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-builder-engine.user.js
// ==/UserScript==

(function() {
'use strict';

// =========================================================================
// CONFIGURATION
// =========================================================================

let CONFIG = {
    enabled: false,
    interval: 60, // minutes
    randomize: true, // add 1-15 min randomization
    
    stats: {
        totalRuns: 0,
        lastRun: null,
        nextRunTime: null
    },
    
    uiVisible: false
};

const saved = GM_getValue('builder_engine_config');
if (saved) CONFIG = JSON.parse(saved);

function saveConfig() {
    GM_setValue('builder_engine_config', JSON.stringify(CONFIG));
}

function log(msg) {
    console.log(`[Builder Engine] ${msg}`);
}

// =========================================================================
// GLOBAL VARIABLES
// =========================================================================

// For screen=main
let buildingObject;
let scriptStatus = false;
let isBuilding = false;
let savedTemplates = {};

// For background loop (overview)
let loopTimeout = null;
let isLoopRunning = false;

class BQueue {
    constructor(bQueue, bQueueLength) {
        this.buildingQueue = bQueue;
        this.buildingQueueLength = bQueueLength;
    }
    add(building, display) {
        this.buildingQueue.push(building);
        if (display) {
            let ele = document.createElement("tr");
            ele.innerHTML = `<td>${building}</td>
                <td class="delete-icon-large hint-toggle float_left"></td>`;
            ele.addEventListener("click", () => {
                this.removeBuilding(ele);
            });
            document.getElementById("autoBuilderTable").appendChild(ele);
        }
    }
    /**
     * Appends buildings to a table
     * @param {DOM element} parent The element (table) where the buildings should be appended to.
     */
    display(parent) {
        this.buildingQueue.forEach((building) => {
            let ele = document.createElement("tr");
            ele.innerHTML = `<td>${building}</td>
                <td class="delete-icon-large hint-toggle float_left"></td>`;
            ele.addEventListener("click", () => {
                this.removeBuilding(ele);
            });
            parent.appendChild(ele);
        });
    }
    removeBuilding(ele) {
        // Calculate the index in the queue based on row position within tbody
        let queueBody = document.getElementById("queueBody");
        let queueIndex = Array.from(queueBody.rows).indexOf(ele);
        this.buildingQueue.splice(queueIndex, 1);
        ele.remove();
        let setLocalStorage = JSON.parse(localStorage.buildingObject);
        setLocalStorage[game_data.village.id] = buildingObject;
        localStorage.buildingObject = JSON.stringify(setLocalStorage);
    }
}

// ==================== UI UPDATE FUNCTIONS ====================

/**
 * Updates the script status display
 * @param {boolean} isRunning Whether the script is running
 */
function updateScriptStatus(isRunning) {
    let statusSpan = document.getElementById("scriptStatus");
    let startBtn = document.getElementById("startBuildingScript");
    
    if (isRunning) {
        statusSpan.innerHTML = '🟢 <span style="color:#28a745; font-weight:bold;">RUNNING</span>';
        startBtn.innerHTML = '⏸ STOP';
        startBtn.className = 'btn btn-cancel';
    } else {
        statusSpan.innerHTML = '⭕ <span style="color:#666;">Stopped</span>';
        startBtn.innerHTML = '▶ START';
        startBtn.className = 'btn btn-confirm-yes';
    }
}

/**
 * Updates the template status display
 * @param {string} message Status message
 * @param {string} type Type: 'success', 'info', 'error'
 */
function updateTemplateStatus(message, type = 'info') {
    let templateStatus = document.getElementById("templateStatus");
    let colors = {
        'success': '#28a745',
        'info': '#666',
        'error': '#dc3545'
    };
    templateStatus.style.color = colors[type] || colors.info;
    templateStatus.textContent = message;
}

/**
 * Updates the queue count display
 */
function updateQueueCount() {
    let count = buildingObject ? buildingObject.buildingQueue.length : 0;
    let queueCountSpan = document.getElementById("queueCount");
    if (queueCountSpan) {
        queueCountSpan.textContent = count;
    }
}

// ==================== TEMPLATE SYSTEM ====================

/**
 * Gets current building levels from the page
 * @returns {Object} Object with building IDs as keys and current levels as values
 */
function getCurrentBuildingLevels() {
    let levels = {};
    const buildingIds = ["main", "barracks", "stable", "garage", "watchtower", "smith", 
                        "market", "wood", "stone", "iron", "farm", "storage", "hide", "wall"];
    
    buildingIds.forEach(buildingId => {
        try {
            // Try to get level from the building row
            let buildingRow = document.querySelector("#main_buildrow_" + buildingId);
            if (buildingRow) {
                // Look for level indicator in multiple languages
                let levelText = buildingRow.textContent;
                
                // Try different patterns:
                // English: "Level X" or "(X)"
                // Hungarian: "X. szint" or "szint X"
                // German: "Stufe X" or "Ausbaustufe X"
                let levelMatch = levelText.match(/Level\s+(\d+)/i) || 
                                levelText.match(/(\d+)\.\s*szint/i) ||
                                levelText.match(/szint\s+(\d+)/i) ||
                                levelText.match(/Stufe\s+(\d+)/i) ||
                                levelText.match(/Ausbaustufe\s+(\d+)/i) ||
                                levelText.match(/\((\d+)\)/);
                
                if (levelMatch) {
                    levels[buildingId] = parseInt(levelMatch[1]);
                } else {
                    // Try alternative method - look for current level in data attributes or spans
                    let levelSpan = buildingRow.querySelector(".level");
                    if (levelSpan) {
                        levels[buildingId] = parseInt(levelSpan.textContent);
                    } else {
                        // Last resort: try to find any number followed by "szint" or in parentheses
                        let anyNumber = levelText.match(/(\d+)/);
                        if (anyNumber) {
                            levels[buildingId] = parseInt(anyNumber[1]);
                        } else {
                            levels[buildingId] = 0;
                        }
                    }
                }
            } else {
                levels[buildingId] = 0;
            }
        } catch (e) {
            console.log("Could not get level for " + buildingId, e);
            levels[buildingId] = 0;
        }
    });
    
    console.log("Detected building levels:", levels); // Debug output
    return levels;
}

/**
 * Parses template string format: "main 3; iron 5; farm 4; smith 5"
 * Supports TWO formats:
 * 1. TARGET LEVELS: "main 20; wood 30" - Script calculates sequence
 * 2. EXACT SEQUENCE: "wood 1, stone 1, iron 1, wood 2" - Exact order preserved
 * @param {string} templateStr Template string
 * @returns {Object} {type: 'target'|'sequence', data: Object|Array}
 */
function parseTemplate(templateStr) {
    if (!templateStr || templateStr.trim() === "") {
        return {type: 'target', data: {}};
    }
    
    // Detect format by checking separator
    let isSequenceFormat = templateStr.includes(',');
    
    if (isSequenceFormat) {
        // EXACT SEQUENCE FORMAT: "wood 1, stone 1, iron 1, main 2, wood 2"
        let entries = templateStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        let sequence = [];
        
        entries.forEach(entry => {
            let match = entry.match(/^(\w+)\s+(\d+)$/);
            if (match) {
                let buildingId = match[1].toLowerCase();
                sequence.push(buildingId);
            }
        });
        
        return {type: 'sequence', data: sequence};
        
    } else {
        // TARGET LEVEL FORMAT: "main 20; wood 30; stone 30"
        let template = {};
        let entries = templateStr.split(/[;\n]/).map(s => s.trim()).filter(s => s.length > 0);
        
        entries.forEach(entry => {
            let match = entry.match(/^(\w+)\s+(\d+)$/);
            if (match) {
                let buildingId = match[1].toLowerCase();
                let targetLevel = parseInt(match[2]);
                template[buildingId] = targetLevel;
            }
        });
        
        return {type: 'target', data: template};
    }
}

/**
 * Generates building queue from template and current levels
 * @param {Object} template Target levels for each building
 * @param {Object} currentLevels Current levels for each building
 * @returns {Array} Array of building IDs to build in order
 */
function generateQueueFromTemplate(template, currentLevels) {
    let queue = [];
    let tempLevels = { ...currentLevels };
    
    // Keep looping until all buildings reach their targets
    let maxIterations = 1000; // Safety limit
    let iterations = 0;
    let hasMore = true;
    
    while (hasMore && iterations < maxIterations) {
        hasMore = false;
        iterations++;
        
        // Go through each building in template
        for (let buildingId in template) {
            let targetLevel = template[buildingId];
            let currentLevel = tempLevels[buildingId] || 0;
            
            if (currentLevel < targetLevel) {
                queue.push(buildingId);
                tempLevels[buildingId] = currentLevel + 1;
                hasMore = true;
            }
        }
    }
    
    return queue;
}

/**
 * Converts template object to string format
 * @param {Object} template Template object
 * @returns {string} Template string
 */
function templateToString(template) {
    let parts = [];
    for (let buildingId in template) {
        parts.push(buildingId + " " + template[buildingId]);
    }
    return parts.join("; ");
}

/**
 * Loads template into the building queue
 * @param {string} templateStr Template string
 */
function loadTemplateIntoQueue(templateStr) {
    try {
        let parsed = parseTemplate(templateStr);
        console.log("Parsed template:", parsed);
        
        let queue = [];
        
        if (parsed.type === 'sequence') {
            // EXACT SEQUENCE MODE - Use the exact order provided
            queue = parsed.data;
            console.log("Using EXACT SEQUENCE mode");
            console.log("Queue:", queue);
            
            if (queue.length === 0) {
                UI.ErrorMessage("Invalid sequence format. Use: 'wood 1, stone 1, iron 1, main 2'");
                return;
            }
            
        } else if (parsed.type === 'target') {
            // TARGET LEVEL MODE - Calculate the sequence
            let template = parsed.data;
            
            if (Object.keys(template).length === 0) {
                UI.ErrorMessage("Invalid template format. Use: 'main 20; wood 30' or 'wood 1, stone 1, iron 1'");
                return;
            }
            
            let currentLevels = getCurrentBuildingLevels();
            console.log("Using TARGET LEVEL mode");
            console.log("Current levels:", currentLevels);
            console.log("Target levels:", template);
            
            queue = generateQueueFromTemplate(template, currentLevels);
            console.log("Generated queue:", queue);
            
            if (queue.length === 0) {
                let message = "All buildings are already at target levels!\n\n";
                for (let building in template) {
                    message += building + ": current=" + currentLevels[building] + ", target=" + template[building] + "\n";
                }
                console.log(message);
                UI.InfoMessage("All buildings are already at target levels! Check console (F12) for details.");
                return;
            }
        }
        
        // Clear current queue
        buildingObject.buildingQueue = [];
        
        // Clear UI - remove all queue items from tbody
        let queueBody = document.getElementById("queueBody");
        queueBody.innerHTML = '';
        
        // Add new queue
        queue.forEach(building => {
            buildingObject.buildingQueue.push(building);
            addBuilding(building);
        });
        
        // Save to localStorage
        let setLocalStorage = JSON.parse(localStorage.buildingObject);
        setLocalStorage[game_data.village.id] = buildingObject;
        localStorage.buildingObject = JSON.stringify(setLocalStorage);
        
        // Show detailed success message
        let buildingSummary = {};
        queue.forEach(b => buildingSummary[b] = (buildingSummary[b] || 0) + 1);
        let summaryText = Object.keys(buildingSummary).map(b => b + " x" + buildingSummary[b]).join(", ");
        
        let message = "✅ Template loaded! " + queue.length + " buildings queued.\n" + summaryText;
        
        // Show mode used
        if (parsed.type === 'sequence') {
            message += "\n\n📋 Mode: EXACT SEQUENCE (preserves order)";
        } else {
            message += "\n\n🎯 Mode: TARGET LEVELS (optimized order)";
            
            // Show which buildings were skipped (only for target mode)
            let skipped = [];
            for (let building in parsed.data) {
                let currentLevels = getCurrentBuildingLevels();
                if ((currentLevels[building] || 0) >= parsed.data[building]) {
                    skipped.push(building + " (already at level " + (currentLevels[building] || 0) + ")");
                }
            }
            if (skipped.length > 0) {
                message += "\n⚠️ Skipped: " + skipped.join(", ");
            }
        }
        
        console.log(message);
        UI.SuccessMessage("Template loaded! " + queue.length + " buildings queued. Mode: " + parsed.type.toUpperCase());
        
        // Update status display
        let modeText = parsed.type === 'sequence' ? 'EXACT SEQUENCE' : 'TARGET LEVELS';
        updateTemplateStatus(queue.length + " buildings queued (" + modeText + ")", 'success');
        updateQueueCount();
    } catch (e) {
        console.error("Error loading template:", e);
        UI.ErrorMessage("Error loading template: " + e.message);
        updateTemplateStatus("Error: " + e.message, 'error');
    }
}

/**
 * Saves current queue as a template
 */
function saveCurrentQueueAsTemplate() {
    let templateName = prompt("Enter template name:");
    if (!templateName) return;
    
    let currentLevels = getCurrentBuildingLevels();
    let templateStr = document.getElementById("templateInput").value.trim();
    
    if (!templateStr) {
        UI.ErrorMessage("No template to save. Please enter a template first.");
        return;
    }
    
    savedTemplates[templateName] = templateStr;
    localStorage.savedTemplates = JSON.stringify(savedTemplates);
    
    updateTemplateDropdown();
    UI.SuccessMessage("Template '" + templateName + "' saved!");
}

/**
 * Exports template to file
 */
function exportTemplate() {
    let templateStr = document.getElementById("templateInput").value.trim();
    if (!templateStr) {
        UI.ErrorMessage("No template to export.");
        return;
    }
    
    let blob = new Blob([templateStr], { type: "text/plain" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "builder_template_" + game_data.village.id + ".txt";
    a.click();
    URL.revokeObjectURL(url);
    
    UI.SuccessMessage("Template exported!");
}

/**
 * Copies template to clipboard
 */
function copyTemplateToClipboard() {
    let templateStr = document.getElementById("templateInput").value.trim();
    if (!templateStr) {
        UI.ErrorMessage("No template to copy.");
        return;
    }
    
    navigator.clipboard.writeText(templateStr).then(() => {
        UI.SuccessMessage("Template copied to clipboard!");
    }).catch(() => {
        // Fallback method
        let textarea = document.getElementById("templateInput");
        textarea.select();
        document.execCommand("copy");
        UI.SuccessMessage("Template copied to clipboard!");
    });
}

/**
 * Updates the template dropdown with saved templates
 */
function updateTemplateDropdown() {
    let select = document.getElementById("savedTemplatesSelect");
    if (!select) return;
    
    // Clear existing options except first
    select.innerHTML = '<option value="">-- Select Template --</option>';
    
    for (let name in savedTemplates) {
        let option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
}

/**
 * Deletes a saved template
 */
function deleteTemplate() {
    let select = document.getElementById("savedTemplatesSelect");
    let templateName = select.value;
    
    if (!templateName) {
        UI.ErrorMessage("Please select a template to delete.");
        return;
    }
    
    if (confirm("Delete template '" + templateName + "'?")) {
        delete savedTemplates[templateName];
        localStorage.savedTemplates = JSON.stringify(savedTemplates);
        updateTemplateDropdown();
        UI.SuccessMessage("Template deleted!");
    }
}

// ==================== END TEMPLATE SYSTEM ====================

// =========================================================================
// INIT - Detects screen and initializes appropriate mode
// =========================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBuilderEngine);
} else {
    initBuilderEngine();
}

function initBuilderEngine() {
    const currentUrl = window.location.href;
    
    if (currentUrl.includes('screen=overview')) {
        // OVERVIEW SCREEN - Show quest bar button + control panel
        initOverviewMode();
    } else if (currentUrl.includes('screen=main')) {
        // MAIN SCREEN - Show template UI
        initMainScreen();
    }
}

function initOverviewMode() {
    log('Initializing on overview screen');
    
    // Create quest bar button
    createToggleButton();
    
    // Create UI if it was visible before
    if (CONFIG.uiVisible) {
        createEngineUI();
        const engineUI = document.getElementById('builderEngine');
        if (engineUI) {
            engineUI.style.display = 'block';
            const button = document.getElementById('builder-toggle-btn');
            if (button) button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        }
    }
    
    // Resume loop if it was running
    if (CONFIG.enabled) {
        log('Resuming Builder Loop');
        startBuilderLoop();
    }
    
    log('Builder Engine initialized - click icon to open');
}

function initMainScreen() {
    const putEleBefore = document.getElementById("content_value");
    let newDiv = document.createElement("div");
    
    let newTable = `<table id="autoBuilderTable" class="vis" style="width:100%; font-size:11px;">
        <tr>
            <th colspan="6" style="text-align:center; padding:5px; font-size:13px; background-color:#c1a264;">
                🏰 Auto Builder v0.6.1
            </th>
        </tr>
        <tr>
            <td colspan="6" style="padding:5px; background-color:#f4e4bc;">
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td style="width:120px; vertical-align:middle;">
                            <button id="startBuildingScript" class="btn btn-confirm-yes" style="width:100%; padding:5px; font-weight:bold; font-size:12px;">
                                ▶ START
                            </button>
                        </td>
                        <td style="padding:0 10px; vertical-align:middle;">
                            <div style="font-weight:bold; font-size:11px; margin-bottom:2px;">
                                Status: <span id="scriptStatus" style="color:#666;">⭕ Stopped</span>
                            </div>
                            <div style="font-size:10px; color:#666;" id="templateStatus">
                                No template loaded
                            </div>
                        </td>
                        <td style="width:120px; text-align:right; vertical-align:middle; white-space:nowrap;">
                            Queue Length: 
                            <input id='queueLengthInput' style='width:35px; text-align:center; padding:3px; font-size:11px;'>
                            <button id='queueLengthBtn' class='btn btn-default' style='padding:3px 8px; font-size:10px;'>Set</button>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <th colspan="6" style="text-align:left; padding:4px 8px; background-color:#c1a264; font-size:11px; cursor:pointer;" id="templateHeader">
                <span style="float:right;" id="templateToggle">▼</span>
                📋 Template Manager
            </th>
        </tr>
        <tbody id="templateBody">
            <tr>
                <td colspan="6" style="padding: 5px;">
                    <textarea id="templateInput" placeholder="TARGET LEVELS (;): main 20; wood 30; stone 30&#10;EXACT SEQUENCE (,): wood 1, stone 1, iron 1, main 2" 
                        style="width: 99%; height: 45px; font-family: monospace; font-size:10px; padding: 5px; border: 2px solid #c1a264; background-color:#fff;"></textarea>
                </td>
            </tr>
            <tr>
                <td colspan="6" style="padding: 5px;">
                    <button id="loadTemplateBtn" class="btn btn-confirm-yes" style="padding:4px 12px; font-size:11px; font-weight:bold;">▶ Load Template</button>
                    <button id="clearTemplateBtn" class="btn btn-cancel" style="padding:4px 8px; font-size:10px;">✖ Clear</button>
                    <span style="margin:0 5px; color:#c1a264;">|</span>
                    <button id="saveTemplateBtn" class="btn btn-default" style="padding:4px 8px; font-size:10px;">💾 Save</button>
                    <button id="exportTemplateBtn" class="btn btn-default" style="padding:4px 8px; font-size:10px;">📤 Export</button>
                    <button id="copyTemplateBtn" class="btn btn-default" style="padding:4px 8px; font-size:10px;">📋 Copy</button>
                    <input type="file" id="importTemplateFile" accept=".txt" style="display:none;">
                    <button id="importTemplateBtn" class="btn btn-default" style="padding:4px 8px; font-size:10px;">📁 Import</button>
                </td>
            </tr>
            <tr>
                <td colspan="6" style="padding: 5px;">
                    <select id="savedTemplatesSelect" style="width:200px; font-size:10px; padding:3px;">
                        <option value="">-- Select Saved Template --</option>
                    </select>
                    <button id="loadSavedTemplateBtn" class="btn btn-default" style="padding:3px 10px; font-size:10px;">Load</button>
                    <button id="deleteTemplateBtn" class="btn btn-cancel" style="padding:3px 10px; font-size:10px;">Delete</button>
                </td>
            </tr>
        </tbody>
        <tr>
            <th colspan="6" style="text-align:left; padding:4px 8px; background-color:#c1a264; font-size:11px; cursor:pointer;" id="queueHeader">
                <span style="float:right;" id="queueToggle">▼</span>
                📋 Build Queue (<span id="queueCount">0</span> buildings)
            </th>
        </tr>
        <tbody id="queueBody"></tbody>
        </table>`;

    newDiv.innerHTML = newTable;
    putEleBefore.parentElement.parentElement.insertBefore(newDiv, putEleBefore.parentElement);

    let premiumBQueueLength = game_data.features.Premium.active ? 5 : 2;

    // Checks if localStorage exists
    if (localStorage.buildingObject) {
        // Checks if village exists in localStorage
        if (JSON.parse(localStorage.buildingObject)[game_data.village.id]) {
            let newBqueue = JSON.parse(localStorage.buildingObject)[game_data.village.id];
            buildingObject = new BQueue(newBqueue.buildingQueue, newBqueue.buildingQueueLength); // Save stored BQueue in new BQueue
            document.getElementById("queueLengthInput").value = buildingObject.buildingQueueLength;
            // Add each building in the BQueue to the actual queue
            buildingObject.buildingQueue.forEach((b) => {
                addBuilding(b);
            });
        }
        // Else create empty village and add into localStorage
        else {
            buildingObject = new BQueue([], premiumBQueueLength);
            document.getElementById("queueLengthInput").value = premiumBQueueLength;
            let setLocalStorage = JSON.parse(localStorage.buildingObject);
            setLocalStorage[game_data.village.id] = buildingObject;
            localStorage.buildingObject = JSON.stringify(setLocalStorage);
        }
    }
    // Else create new object
    else {
        buildingObject = new BQueue([], premiumBQueueLength);
        let newLocalStorage = { [game_data.village.id]: buildingObject };
        localStorage.buildingObject = JSON.stringify(newLocalStorage);
    }

    // Load saved templates from localStorage
    if (localStorage.savedTemplates) {
        savedTemplates = JSON.parse(localStorage.savedTemplates);
        updateTemplateDropdown();
    }

    // Update queue count
    updateQueueCount();

    // Queue collapse state
    let queueCollapsed = localStorage.queueCollapsed === 'true' || false;
    if (queueCollapsed) {
        document.getElementById("queueBody").style.display = 'none';
        document.getElementById("queueToggle").textContent = '▶';
    }

    // Template Manager collapse state
    let templateCollapsed = localStorage.templateCollapsed === 'true' || false;
    if (templateCollapsed) {
        document.getElementById("templateBody").style.display = 'none';
        document.getElementById("templateToggle").textContent = '▶';
    }

    // Queue toggle event listener
    document.getElementById("queueHeader").addEventListener("click", function() {
        let queueBody = document.getElementById("queueBody");
        let queueToggle = document.getElementById("queueToggle");
        
        if (queueBody.style.display === 'none') {
            queueBody.style.display = '';
            queueToggle.textContent = '▼';
            localStorage.queueCollapsed = 'false';
        } else {
            queueBody.style.display = 'none';
            queueToggle.textContent = '▶';
            localStorage.queueCollapsed = 'true';
        }
    });

    // Template Manager toggle event listener
    document.getElementById("templateHeader").addEventListener("click", function() {
        let templateBody = document.getElementById("templateBody");
        let templateToggle = document.getElementById("templateToggle");
        
        if (templateBody.style.display === 'none') {
            templateBody.style.display = '';
            templateToggle.textContent = '▼';
            localStorage.templateCollapsed = 'false';
        } else {
            templateBody.style.display = 'none';
            templateToggle.textContent = '▶';
            localStorage.templateCollapsed = 'true';
        }
    });

    eventListeners();
    templateEventListeners();

    if (localStorage.scriptStatus) {
        scriptStatus = JSON.parse(localStorage.scriptStatus);
        if (scriptStatus) {
            updateScriptStatus(true);
            startScript();
        } else {
            updateScriptStatus(false);
        }
    } else {
        updateScriptStatus(false);
    }
    
    // Set initial template status
    if (buildingObject.buildingQueue.length > 0) {
        updateTemplateStatus(buildingObject.buildingQueue.length + " buildings in queue", 'success');
    } else {
        updateTemplateStatus("No template loaded", 'info');
    }
}

// =========================================================================
// BUILDING FUNCTIONS (for screen=main)
// =========================================================================

function startScript() {
    let currentBuildLength = 0;
    if (document.getElementById("buildqueue")) {
        currentBuildLength = document.getElementById("buildqueue").rows.length - 2;
    }
    setInterval(function () {
        let btn = document.querySelector(".btn-instant-free");
        if (btn && btn.style.display != "none") {
            btn.click();
        }
        if (buildingObject.buildingQueue.length !== 0) {
            let building = buildingObject.buildingQueue[0];
            let wood = parseInt(document.getElementById("wood").textContent);
            let stone = parseInt(document.getElementById("stone").textContent);
            let iron = parseInt(document.getElementById("iron").textContent);
            let woodCost = 9999999;
            let stoneCost = 9999999;
            let ironCost = 9999999;

            try {
                woodCost = parseInt(document.querySelector("#main_buildrow_" + building + " > .cost_wood").getAttribute("data-cost"));
                stoneCost = parseInt(document.querySelector("#main_buildrow_" + building + " > .cost_stone").getAttribute("data-cost"));
                ironCost = parseInt(document.querySelector("#main_buildrow_" + building + " > .cost_iron").getAttribute("data-cost"));
            } catch (e) { console.log("Error getting building cost"); }

            if (document.getElementById("buildqueue")) {
                currentBuildLength = document.getElementById("buildqueue").rows.length - 2;
            }
            if (currentBuildLength < buildingObject.buildingQueueLength && !isBuilding && scriptStatus && wood >= woodCost && stone >= stoneCost && iron >= ironCost) {
                isBuilding = true;
                console.log("Sending build order for " + building);
                setTimeout(function () {
                    buildBuilding(building);
                }, Math.floor(Math.random() * 500 + 1000));
            }
        }
    }, 1000);
}

function addBuilding(building) {
    // Building name mapping
    const buildingNames = {
        'main': 'HQ',
        'barracks': 'Barracks',
        'stable': 'Stable',
        'garage': 'Workshop',
        'watchtower': 'Watchtower',
        'smith': 'Smithy',
        'market': 'Market',
        'wood': 'Wood',
        'stone': 'Clay',
        'iron': 'Iron',
        'farm': 'Farm',
        'storage': 'Storage',
        'hide': 'Hide',
        'wall': 'Wall'
    };
    
    let displayName = buildingNames[building] || building;
    let ele = document.createElement("tr");
    ele.innerHTML = `<td colspan="3" style="padding: 1px 5px; font-size:11px;">${displayName}</td>
    <td style="text-align:center; cursor:pointer; padding:1px;" class="delete-icon-large hint-toggle"></td>`;
    
    // Add click event to delete icon (last cell)
    ele.cells[1].addEventListener("click", function () {
        removeBuilding(ele);
    });
    
    document.getElementById("queueBody").appendChild(ele);
    updateQueueCount();
}

/**
 * Removes the row of the building that should be removed
 * @param {DOM} ele table row of building queue to be removed
 */
function removeBuilding(ele) {
    // Calculate the index in the queue based on row position within tbody
    let queueBody = document.getElementById("queueBody");
    let queueIndex = Array.from(queueBody.rows).indexOf(ele);
    buildingObject.buildingQueue.splice(queueIndex, 1);
    let setLocalStorage = JSON.parse(localStorage.buildingObject);
    setLocalStorage[game_data.village.id] = buildingObject;
    localStorage.buildingObject = JSON.stringify(setLocalStorage);
    ele.remove();
    updateQueueCount();
    
    if (buildingObject.buildingQueue.length === 0) {
        updateTemplateStatus("Queue is empty", 'info');
    }
}

function buildBuilding(building) {
    let data = {
        "id": building,
        "force": 1,
        "destroy": 0,
        "source": game_data.village.id,
        "h": game_data.csrf
    };
    let url = "/game.php?village=" + game_data.village.id + "&screen=main&ajaxaction=upgrade_building&type=main&";
    $.ajax({
        url: url,
        type: "post",
        data: data,
        headers: {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "TribalWars-Ajax": 1
        }
    }).done(function (r) {
        let response = JSON.parse(r);
        if (response.error) {
            UI.ErrorMessage(response.error[0]);
            console.error(response.error[0]);
        } else if (response.response.success) {
            UI.SuccessMessage(response.response.success);
            console.log(response.response.success);
            
            // Remove from queue
            buildingObject.buildingQueue.splice(0, 1);
            let setLocalStorage = JSON.parse(localStorage.buildingObject);
            setLocalStorage[game_data.village.id] = buildingObject;
            localStorage.buildingObject = JSON.stringify(setLocalStorage);
            
            // Remove first building row from UI (from tbody)
            let queueBody = document.getElementById("queueBody");
            if (queueBody.rows.length > 0) {
                queueBody.deleteRow(0);
            }
            
            updateQueueCount();
            updateTemplateStatus(buildingObject.buildingQueue.length + " buildings remaining", 'success');
            
            setTimeout(() => { window.location.reload(); }, Math.floor(Math.random() * 50 + 500));
        }
    }).fail(function () {
        UI.ErrorMessage("Build request failed. Check console for details.");
        console.error("Build request failed for building:", building);
    }).always(function () {
        isBuilding = false;
    });
}


function eventListeners() {
    // #region Query
    // Enter triggers OK for "Queue length"
    document.getElementById("queueLengthInput").addEventListener("keydown", function(event) {
        clickOnKeyPress(13, "#queueLengthBtn", event);
    });

    // Saves query length
    document.getElementById("queueLengthBtn").addEventListener("click", function () {
        let qLength = parseInt(document.getElementById("queueLengthInput").value);
        if (Number.isNaN(qLength)) {
            qLength = 2;
        }
        if (!game_data.features.Premium.active && qLength > 2) {
            buildingObject.buildingQueueLength = 2;
        } else {
            buildingObject.buildingQueueLength = qLength;
        }
        let setLocalStorage = JSON.parse(localStorage.buildingObject);
        setLocalStorage[game_data.village.id] = buildingObject;
        localStorage.buildingObject = JSON.stringify(setLocalStorage);
        if (!game_data.features.Premium.active && qLength > 2) {
            document.getElementById("queueText").innerHTML = " Premium account not active, queue length set to 2.";
        } else if (parseInt(buildingObject.buildingQueueLength) > 5) {
            document.getElementById("queueText").innerHTML = " Queue length set to " + buildingObject.buildingQueueLength + ". There will be additional costs for more than 5 constructions in the queue";
        } else {
            document.getElementById("queueText").innerHTML = " Queue length set to " + buildingObject.buildingQueueLength;
        }
        document.getElementById("queueLengthInput").value = buildingObject.buildingQueueLength;
    });
    // #endregion Query

    // #region Building
    document.getElementById("startBuildingScript").addEventListener("click", function () {
        if (scriptStatus) {
            // Stop
            scriptStatus = false;
            localStorage.scriptStatus = JSON.stringify(scriptStatus);
            updateScriptStatus(false);
        } else {
            // Start
            if (buildingObject.buildingQueue.length === 0) {
                UI.ErrorMessage("Queue is empty! Load a template or add buildings first.");
                return;
            }
            scriptStatus = true;
            localStorage.scriptStatus = JSON.stringify(scriptStatus);
            updateScriptStatus(true);
            startScript();
        }
    });
    // #endregion Building
}

function templateEventListeners() {
    // Load template button
    document.getElementById("loadTemplateBtn").addEventListener("click", function() {
        let templateStr = document.getElementById("templateInput").value.trim();
        if (templateStr) {
            loadTemplateIntoQueue(templateStr);
        } else {
            UI.ErrorMessage("Please enter a template first.");
            updateTemplateStatus("No template entered", 'error');
        }
    });

    // Clear template button
    document.getElementById("clearTemplateBtn").addEventListener("click", function() {
        if (confirm("Clear the entire queue?")) {
            buildingObject.buildingQueue = [];
            let setLocalStorage = JSON.parse(localStorage.buildingObject);
            setLocalStorage[game_data.village.id] = buildingObject;
            localStorage.buildingObject = JSON.stringify(setLocalStorage);
            
            let queueBody = document.getElementById("queueBody");
            queueBody.innerHTML = '';
            
            updateTemplateStatus("Queue cleared", 'info');
            updateQueueCount();
            UI.SuccessMessage("Queue cleared!");
        }
    });

    // Save template button
    document.getElementById("saveTemplateBtn").addEventListener("click", function() {
        saveCurrentQueueAsTemplate();
    });

    // Export template button
    document.getElementById("exportTemplateBtn").addEventListener("click", function() {
        exportTemplate();
    });

    // Copy template button
    document.getElementById("copyTemplateBtn").addEventListener("click", function() {
        copyTemplateToClipboard();
    });

    // Import template button
    document.getElementById("importTemplateBtn").addEventListener("click", function() {
        document.getElementById("importTemplateFile").click();
    });

    // Import file handler
    document.getElementById("importTemplateFile").addEventListener("change", function(e) {
        let file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function(event) {
                let content = event.target.result;
                document.getElementById("templateInput").value = content;
                UI.SuccessMessage("Template imported!");
            };
            reader.readAsText(file);
        }
    });

    // Load saved template button
    document.getElementById("loadSavedTemplateBtn").addEventListener("click", function() {
        let select = document.getElementById("savedTemplatesSelect");
        let templateName = select.value;
        
        if (!templateName) {
            UI.ErrorMessage("Please select a template to load.");
            return;
        }
        
        let templateStr = savedTemplates[templateName];
        document.getElementById("templateInput").value = templateStr;
        UI.SuccessMessage("Template '" + templateName + "' loaded into editor.");
    });

    // Delete template button
    document.getElementById("deleteTemplateBtn").addEventListener("click", function() {
        deleteTemplate();
    });
}

/**
 * Triggers a click on a keypress
 * @param {int} key key that has been pressed
 * @param {string} selector CSS selector of the element that is to be triggered
 * @param {Event} event The keyboard event
 */
function clickOnKeyPress(key, selector, event) {
    "use strict";
    if (event.defaultPrevented) {
        return; // Should do nothing if the default action has been cancelled
    }
    let handled = false;
    if (event.key === key || event.keyCode === key) {
        document.querySelector(selector).click();
        handled = true;
    }
    if (handled) {
        event.preventDefault();
    }
}

// =========================================================================
// BACKGROUND LOOP SYSTEM (for overview screen)
// =========================================================================

function openMainTab() {
    return new Promise((resolve, reject) => {
        const mainUrl = game_data.player.sitter > 0
            ? `${game_data.link_base_pure}main&t=${game_data.player.id}`
            : `${game_data.link_base_pure}main`;

        const mainTab = window.open(mainUrl, '_blank');
        if (!mainTab) {
            reject(new Error('Failed to open tab'));
            return;
        }

        const checkLoaded = setInterval(() => {
            try {
                if (mainTab.document.readyState === 'complete') {
                    clearInterval(checkLoaded);
                    resolve(mainTab);
                }
            } catch (e) {}
        }, 500);

        setTimeout(() => {
            clearInterval(checkLoaded);
            reject(new Error('Timeout'));
        }, 15000);
    });
}

async function checkAndBuild(mainTab) {
    const doc = mainTab.document;
    
    log('Checking for buildings to build...');
    
    // Check if there's a building queue
    const buildQueue = doc.getElementById('buildqueue');
    const rows = buildQueue ? buildQueue.rows.length - 2 : 0;
    log(`Current queue: ${rows} buildings`);
    
    // Get queue length setting
    let queueLength = 2;
    try {
        const villageId = mainTab.game_data.village.id;
        const buildingObject = localStorage.getItem('buildingObject');
        if (buildingObject) {
            const parsed = JSON.parse(buildingObject);
            if (parsed[villageId] && parsed[villageId].buildingQueueLength) {
                queueLength = parsed[villageId].buildingQueueLength;
            }
        }
    } catch (e) {
        log('Could not get queue length: ' + e.message);
    }
    
    // Check if queue has space
    if (rows >= queueLength) {
        log('Queue is full, skipping');
        return;
    }
    
    // Get building queue
    let buildingQueue = [];
    try {
        const villageId = mainTab.game_data.village.id;
        const buildingObject = localStorage.getItem('buildingObject');
        if (buildingObject) {
            const parsed = JSON.parse(buildingObject);
            if (parsed[villageId] && parsed[villageId].buildingQueue) {
                buildingQueue = parsed[villageId].buildingQueue;
            }
        }
    } catch (e) {
        log('Could not get building queue: ' + e.message);
    }
    
    if (buildingQueue.length === 0) {
        log('Building queue is empty');
        return;
    }
    
    const nextBuilding = buildingQueue[0];
    log(`Next building to build: ${nextBuilding}`);
    
    // Get resources
    const wood = parseInt(doc.getElementById('wood').textContent);
    const stone = parseInt(doc.getElementById('stone').textContent);
    const iron = parseInt(doc.getElementById('iron').textContent);
    log(`Resources: Wood=${wood}, Stone=${stone}, Iron=${iron}`);
    
    // Get building costs
    let woodCost = 9999999;
    let stoneCost = 9999999;
    let ironCost = 9999999;
    
    try {
        const buildRow = doc.querySelector(`#main_buildrow_${nextBuilding}`);
        if (buildRow) {
            woodCost = parseInt(buildRow.querySelector('.cost_wood').getAttribute('data-cost'));
            stoneCost = parseInt(buildRow.querySelector('.cost_stone').getAttribute('data-cost'));
            ironCost = parseInt(buildRow.querySelector('.cost_iron').getAttribute('data-cost'));
            log(`Costs: Wood=${woodCost}, Stone=${stoneCost}, Iron=${ironCost}`);
        }
    } catch (e) {
        log('Could not get costs: ' + e.message);
    }
    
    // Check resources and build
    if (wood >= woodCost && stone >= stoneCost && iron >= ironCost) {
        log('✅ Enough resources! Building...');
        
        // Build in the opened tab
        const data = {
            "id": nextBuilding,
            "force": 1,
            "destroy": 0,
            "source": mainTab.game_data.village.id,
            "h": mainTab.game_data.csrf
        };
        
        const url = `/game.php?village=${mainTab.game_data.village.id}&screen=main&ajaxaction=upgrade_building&type=main&`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'TribalWars-Ajax': '1'
                },
                body: new URLSearchParams(data)
            });
            
            const result = await response.json();
            
            if (result.error) {
                log('❌ Build error: ' + result.error[0]);
            } else if (result.response && result.response.success) {
                log('✅ Build success: ' + result.response.success);
                
                // Remove from localStorage queue
                try {
                    const villageId = mainTab.game_data.village.id;
                    const buildingObject = localStorage.getItem('buildingObject');
                    if (buildingObject) {
                        const parsed = JSON.parse(buildingObject);
                        if (parsed[villageId] && parsed[villageId].buildingQueue) {
                            parsed[villageId].buildingQueue.shift();
                            localStorage.setItem('buildingObject', JSON.stringify(parsed));
                            log('✅ Removed from queue');
                        }
                    }
                } catch (e) {
                    log('⚠️ Could not update queue: ' + e.message);
                }
            }
        } catch (error) {
            log('❌ Build request failed: ' + error.message);
        }
    } else {
        log('⚠️ Not enough resources');
    }
}

async function executeBuilderCheck() {
    log('=== STARTING BUILDER CHECK ===');

    try {
        const mainTab = await openMainTab();
        log('Tab opened');
        
        await checkAndBuild(mainTab);
        
        log('Waiting 10 seconds...');
        await new Promise(r => setTimeout(r, 10000));
        
        mainTab.close();
        log('Tab closed');

        CONFIG.stats.totalRuns++;
        CONFIG.stats.lastRun = new Date().toISOString();
        saveConfig();
        
        log('=== BUILDER CHECK COMPLETE ===');
        
        return true;
        
    } catch (error) {
        log('ERROR: ' + error.message);
        return false;
    }
}

function startBuilderLoop() {
    log('🏰 Builder Loop started');
    CONFIG.enabled = true;
    
    if (loopTimeout) clearTimeout(loopTimeout);
    
    function loop() {
        if (!CONFIG.enabled) return;
        
        if (isLoopRunning) {
            log('⚠ Builder already running, skipping');
            loopTimeout = setTimeout(loop, 5000);
            return;
        }
        
        log('▶ Builder Loop: Running...');
        isLoopRunning = true;
        
        executeBuilderCheck().then(() => {
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

function stopBuilderLoop() {
    log('🛑 Builder Loop stopped');
    CONFIG.enabled = false;
    CONFIG.stats.nextRunTime = null;
    saveConfig();
    
    if (loopTimeout) clearTimeout(loopTimeout);
}

// =========================================================================
// QUEST BAR BUTTON + ENGINE UI (for overview screen)
// =========================================================================

function createToggleButton() {
    const existing = document.getElementById('builder-toggle-btn');
    if (existing) existing.remove();
    
    const buttonHTML = `
        <div class="quest opened builder-toggle" 
             id="builder-toggle-btn"
             style="background-size: 26px; 
                    background-image: url('https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_builder_27x27.png');
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
                BUILD
            </div>
        </div>
    `;
    
    const questlog = document.getElementById('questlog_new');
    if (questlog) {
        questlog.insertAdjacentHTML('beforeend', buttonHTML);
        
        const button = document.getElementById('builder-toggle-btn');
        
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
    let engineUI = document.getElementById('builderEngine');
    
    if (!engineUI) {
        createEngineUI();
        engineUI = document.getElementById('builderEngine');
    }
    
    const button = document.getElementById('builder-toggle-btn');
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
    <div id="builderEngine" style="
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
                    Auto Builder Engine
                </h3>
                <small style="color: #ffffdf;">v1.0 - Background Loop</small>
            </div>
            <button id="builder-minimize-btn" 
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
        </div>
        
        <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">
                Loop Interval (minutes):
            </label>
            <input type="number" id="builderInterval" value="60" min="1" max="180" style="
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
                <input type="checkbox" id="builderRandomize" checked style="margin-right: 5px;">
                Add 1-15 min random delay
            </label>
        </div>
        
        <div style="background: #fff5da; padding: 8px; border-radius: 5px; margin-bottom: 10px; font-size: 11px; border: 1px solid #d4b98a;">
            <div><strong>Next run:</strong> <span id="builderNextRun">-</span></div>
            <div><strong>Runs:</strong> <span id="builderTotalRuns">0</span></div>
            <div><strong>Last:</strong> <span id="builderLastRun">Never</span></div>
        </div>
        
        <div style="display: flex; gap: 6px; margin-bottom: 10px;">
            <button id="btnStartLoop" style="
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
            <button id="btnStopLoop" style="
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
        
        <button id="builderRunNow" style="
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
            1. Set template on screen=main<br>
            2. Loop opens main tab every X minutes<br>
            3. Checks resources & builds<br>
            4. Waits 10s, closes tab<br>
            5. Repeats with randomization
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);

    // Minimize button
    document.getElementById('builder-minimize-btn').addEventListener('click', function() {
        toggleEngineUI();
    });

    // Load saved config
    document.getElementById('builderInterval').value = CONFIG.interval || 60;
    document.getElementById('builderRandomize').checked = CONFIG.randomize !== false;

    // Start button
    document.getElementById('btnStartLoop').onclick = () => {
        CONFIG.interval = parseInt(document.getElementById('builderInterval').value);
        CONFIG.randomize = document.getElementById('builderRandomize').checked;
        saveConfig();
        
        startBuilderLoop();
        UI.SuccessMessage('🏰 Builder Loop STARTED!');
    };

    // Stop button
    document.getElementById('btnStopLoop').onclick = () => {
        stopBuilderLoop();
        UI.InfoMessage('🛑 Builder Loop STOPPED');
    };

    // Run once button
    document.getElementById('builderRunNow').onclick = () => {
        executeBuilderCheck();
    };

    setInterval(updateEngineUI, 1000);
}

function updateEngineUI() {
    const statusEl = document.getElementById('engineStatus');
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
    
    document.getElementById('builderTotalRuns').textContent = CONFIG.stats.totalRuns;
    
    if (CONFIG.stats.lastRun) {
        document.getElementById('builderLastRun').textContent = new Date(CONFIG.stats.lastRun).toLocaleTimeString();
    }

    if (CONFIG.enabled && CONFIG.stats.nextRunTime) {
        const nextRun = new Date(CONFIG.stats.nextRunTime);
        const now = new Date();
        const diffMs = nextRun - now;
        
        if (diffMs > 0) {
            const m = Math.floor(diffMs / 60000);
            const s = Math.floor((diffMs % 60000) / 1000);
            document.getElementById('builderNextRun').textContent = `${m}m ${s}s`;
        } else if (isLoopRunning) {
            document.getElementById('builderNextRun').textContent = 'Running...';
        } else {
            document.getElementById('builderNextRun').textContent = 'Soon...';
        }
    } else {
        document.getElementById('builderNextRun').textContent = '-';
    }
}

// =========================================================================
// END OF SCRIPT
// =========================================================================

})();
