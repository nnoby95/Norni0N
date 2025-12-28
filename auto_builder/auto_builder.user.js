// ==UserScript==
// @name         Auto Builder
// @version      1.0.0
// @description  Template-based auto builder for Tribal Wars
// @author       Norbi0N
// @match        https://*/game.php?village=*&screen=main*
// @match        https://*/game.php?village=*&screen=info_player&mode=daily_bonus*
// @grant        none
// ==/UserScript==

"use strict";

// ============ CONSTANTS ============
const BUILDINGS = {
    main: "Headquarters",
    barracks: "Barracks",
    stable: "Stable",
    garage: "Workshop",
    watchtower: "Watchtower",
    snob: "Academy",
    smith: "Smithy",
    place: "Rally Point",
    statue: "Statue",
    market: "Market",
    wood: "Timber Camp",
    stone: "Clay Pit",
    iron: "Iron Mine",
    farm: "Farm",
    storage: "Warehouse",
    hide: "Hiding Place",
    wall: "Wall",
    church: "Church",
    church_f: "First Church"
};

const STORAGE_KEYS = {
    templates: "autoBuilderTemplates",
    state: "autoBuilderState",
    settings: "autoBuilderSettings"
};

// Default settings
const DEFAULT_SETTINGS = {
    forceFarmEnabled: false,
    forceFarmThreshold: 10,  // percentage of free population
    // Quest system settings
    questCollectResources: false,  // Collect quest resources when can't build
    questAutoSolve: false,         // Auto-solve quests every 2 hours
    questAutoClosePopups: false,   // Auto-close quest popups
    // Daily reward settings
    dailyRewardEnabled: false,     // Auto-collect daily reward
    lastDailyRewardDate: null,     // Last date reward was collected (YYYY-MM-DD)
    // UI collapse states
    builderSectionCollapsed: false,
    questSectionCollapsed: false,
    progressSectionCollapsed: false
};

// ============ STATE ============
let isBuilding = false;
let scriptInterval = null;
let questSolveInterval = null;
let questPopupInterval = null;
let lastQuestSolveTime = 0;

// ============ STORAGE FUNCTIONS ============
function getTemplates() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.templates)) || {};
    } catch (e) {
        return {};
    }
}

function saveTemplates(templates) {
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
}

function getVillageState() {
    try {
        const allStates = JSON.parse(localStorage.getItem(STORAGE_KEYS.state)) || {};
        return allStates[game_data.village.id] || { activeTemplateId: null, currentIndex: 0, isRunning: false };
    } catch (e) {
        return { activeTemplateId: null, currentIndex: 0, isRunning: false };
    }
}

function saveVillageState(state) {
    try {
        const allStates = JSON.parse(localStorage.getItem(STORAGE_KEYS.state)) || {};
        allStates[game_data.village.id] = state;
        localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(allStates));
    } catch (e) {
        console.error("Failed to save village state", e);
    }
}

function getSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings));
        return { ...DEFAULT_SETTINGS, ...settings };
    } catch (e) {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

// ============ TEMPLATE FUNCTIONS ============
function parseTemplate(str) {
    // Parse "main 2;barracks 1;smith 3" -> [{building: "main", level: 2}, ...]
    const sequence = [];
    const items = str.split(";").map(s => s.trim()).filter(s => s);

    for (const item of items) {
        const match = item.match(/^(\w+)\s+(\d+)$/);
        if (match) {
            const building = match[1].toLowerCase();
            const level = parseInt(match[2], 10);
            if (BUILDINGS[building] && level > 0) {
                sequence.push({ building, level });
            }
        }
    }
    return sequence;
}

function templateToString(sequence) {
    return sequence.map(s => `${s.building} ${s.level}`).join(";");
}

function createTemplate(name, templateStr) {
    const sequence = parseTemplate(templateStr);
    if (sequence.length === 0) return null;

    const templates = getTemplates();
    const id = "tpl_" + Date.now();
    templates[id] = {
        name: name || "Unnamed Template",
        sequence: sequence,
        created: new Date().toISOString().split("T")[0]
    };
    saveTemplates(templates);
    return id;
}

function deleteTemplate(id) {
    const templates = getTemplates();
    delete templates[id];
    saveTemplates(templates);

    // Clear state if this template was active
    const state = getVillageState();
    if (state.activeTemplateId === id) {
        state.activeTemplateId = null;
        state.currentIndex = 0;
        state.isRunning = false;
        saveVillageState(state);
    }
}

function activateTemplate(templateId) {
    const state = getVillageState();
    state.activeTemplateId = templateId;
    state.currentIndex = 0;
    state.isRunning = false;
    saveVillageState(state);
    updateUI();
}

// ============ BUILDING FUNCTIONS ============
function getBuildingLevel(buildingId) {
    // Use game_data.village.buildings which contains all levels
    if (game_data && game_data.village && game_data.village.buildings) {
        return parseInt(game_data.village.buildings[buildingId], 10) || 0;
    }
    // Fallback to BuildingMain
    if (typeof BuildingMain !== "undefined" && BuildingMain.buildings && BuildingMain.buildings[buildingId]) {
        return parseInt(BuildingMain.buildings[buildingId].level, 10) || 0;
    }
    return 0;
}

function getResources() {
    return {
        wood: parseInt(game_data.village.wood, 10) || 0,
        stone: parseInt(game_data.village.stone, 10) || 0,
        iron: parseInt(game_data.village.iron, 10) || 0
    };
}

function getBuildingCost(buildingId) {
    try {
        const row = document.querySelector(`#main_buildrow_${buildingId}`);
        if (!row) return null;

        return {
            wood: parseInt(row.querySelector(".cost_wood")?.getAttribute("data-cost"), 10) || 999999,
            stone: parseInt(row.querySelector(".cost_stone")?.getAttribute("data-cost"), 10) || 999999,
            iron: parseInt(row.querySelector(".cost_iron")?.getAttribute("data-cost"), 10) || 999999
        };
    } catch (e) {
        return null;
    }
}

function canAfford(buildingId) {
    const cost = getBuildingCost(buildingId);
    if (!cost) return false;

    const res = getResources();
    return res.wood >= cost.wood && res.stone >= cost.stone && res.iron >= cost.iron;
}

function getQueueLength() {
    const queue = document.getElementById("buildqueue");
    return queue ? queue.rows.length - 2 : 0;
}

function getMaxQueueLength() {
    return game_data.features.Premium.active ? 5 : 2;
}

// ============ POPULATION FUNCTIONS ============
function getPopulationInfo() {
    const popMax = parseInt(game_data.village.pop_max, 10) || 0;
    const popUsed = parseInt(game_data.village.pop, 10) || 0;
    const freePop = popMax - popUsed;
    const freePercent = popMax > 0 ? (freePop / popMax) * 100 : 100;

    return {
        max: popMax,
        used: popUsed,
        free: freePop,
        freePercent: freePercent
    };
}

function needsForceFarm() {
    const settings = getSettings();
    if (!settings.forceFarmEnabled) return false;

    const popInfo = getPopulationInfo();
    return popInfo.freePercent < settings.forceFarmThreshold;
}

function canBuildFarm() {
    // Check if farm row exists and we can afford it
    const farmRow = document.querySelector("#main_buildrow_farm");
    if (!farmRow) return false;

    // Check if farm is at max level
    const currentLevel = getBuildingLevel("farm");
    const maxLevel = 30; // Default max, could be different on some worlds

    if (currentLevel >= maxLevel) return false;

    return canAfford("farm");
}

// ============ QUEST FUNCTIONS ============
function getStorageCapacity() {
    // Storage capacity is stored in game_data
    if (game_data && game_data.village && game_data.village.storage_max) {
        return parseInt(game_data.village.storage_max, 10) || 0;
    }
    return 0;
}

function canAffordAnyBuilding() {
    // Check if we can afford ANY building in the queue
    const state = getVillageState();
    if (!state.activeTemplateId) return false;

    const templates = getTemplates();
    const template = templates[state.activeTemplateId];
    if (!template) return false;

    // Check current step and a few ahead
    for (let i = state.currentIndex; i < Math.min(state.currentIndex + 3, template.sequence.length); i++) {
        const step = template.sequence[i];
        const currentLevel = getBuildingLevel(step.building);
        if (currentLevel < step.level && canAfford(step.building)) {
            return true;
        }
    }
    return false;
}

function getQuestRewardResources(quest) {
    // Extract resource rewards from quest data
    const data = quest.getData();
    const resources = { wood: 0, stone: 0, iron: 0 };

    if (data.rewards && Array.isArray(data.rewards)) {
        data.rewards.forEach(reward => {
            if (reward.wood) resources.wood += parseInt(reward.wood, 10) || 0;
            if (reward.stone) resources.stone += parseInt(reward.stone, 10) || 0;
            if (reward.iron) resources.iron += parseInt(reward.iron, 10) || 0;
        });
    }

    return resources;
}

function wouldOverflowStorage(questResources) {
    const currentRes = getResources();
    const storageMax = getStorageCapacity();

    if (storageMax === 0) return false; // Can't determine, allow collection

    // Check if adding quest resources would exceed storage
    const newWood = currentRes.wood + questResources.wood;
    const newStone = currentRes.stone + questResources.stone;
    const newIron = currentRes.iron + questResources.iron;

    return newWood > storageMax || newStone > storageMax || newIron > storageMax;
}

function collectQuestResources() {
    const settings = getSettings();
    if (!settings.questCollectResources) return 0;

    // Only collect if we CAN'T afford the next building
    if (canAffordAnyBuilding()) {
        console.log("[Quest] Can still afford buildings, skipping quest collection");
        return 0;
    }

    if (typeof Quests === "undefined") {
        console.log("[Quest] Quests API not available");
        return 0;
    }

    const allQuests = Quests.getAll();
    let collected = 0;

    Object.keys(allQuests).forEach(id => {
        const quest = Quests.getQuest(id);
        const data = quest.getData();

        // Quest must be finished and active (ready to collect)
        if (data.finished && data.state === "active") {
            const rewards = getQuestRewardResources(quest);
            const hasResources = rewards.wood > 0 || rewards.stone > 0 || rewards.iron > 0;

            // Only process quests with resource rewards
            if (hasResources) {
                // Check if it would overflow storage
                if (wouldOverflowStorage(rewards)) {
                    console.log(`[Quest] Skipping "${data.title}" - would overflow storage`);
                    return;
                }

                try {
                    quest.complete();
                    collected++;
                    console.log(`[Quest] Collected: ${data.title} (+${rewards.wood}W, +${rewards.stone}S, +${rewards.iron}I)`);

                    // Handle popup after a delay
                    setTimeout(() => closeQuestPopup(), 1000);
                } catch (e) {
                    console.error(`[Quest] Failed to collect ${id}:`, e);
                }
            }
        }
    });

    return collected;
}

function autoSolveQuests() {
    const settings = getSettings();
    if (!settings.questAutoSolve) return 0;

    if (typeof Quests === "undefined") {
        console.log("[Quest] Quests API not available");
        return 0;
    }

    const allQuests = Quests.getAll();
    let collected = 0;

    Object.keys(allQuests).forEach(id => {
        const quest = Quests.getQuest(id);
        const data = quest.getData();

        // Complete any finished quest
        if (data.finished && data.state === "active") {
            try {
                quest.complete();
                collected++;
                console.log(`[Quest Auto-Solve] Completed: ${data.title}`);

                // Handle popup after a delay
                setTimeout(() => closeQuestPopup(), 1000);
            } catch (e) {
                console.error(`[Quest Auto-Solve] Failed to complete ${id}:`, e);
            }
        }
    });

    if (collected > 0) {
        UI.SuccessMessage(`Auto-solved ${collected} quest(s)!`);
    }

    return collected;
}

function closeQuestPopup() {
    // Method 1: Use Dialog API (recommended)
    if (typeof Dialog !== "undefined" && Dialog.active_id) {
        Dialog.close();
        console.log("[Quest] Closed popup via Dialog.close()");
        return true;
    }

    // Method 2: Click the green button
    const selectors = [
        ".btn-confirm-yes",
        "a.btn-confirm-yes",
        ".popup_box_content a.btn",
        "button[type='submit']"
    ];

    for (const selector of selectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
            button.click();
            console.log("[Quest] Clicked button:", selector);
            return true;
        }
    }

    // Method 3: Search by text content
    const buttons = Array.from(document.querySelectorAll("a, button"));
    const greenBtn = buttons.find(btn =>
        (btn.textContent.includes("Teljesítsd") ||
         btn.textContent.includes("Igényeld") ||
         btn.textContent.includes("Rendben") ||
         btn.textContent.includes("OK") ||
         btn.textContent.includes("Collect")) &&
        btn.offsetParent !== null
    );

    if (greenBtn) {
        greenBtn.click();
        console.log("[Quest] Clicked button by text");
        return true;
    }

    return false;
}

function checkAndCloseQuestPopups() {
    const settings = getSettings();
    if (!settings.questAutoClosePopups) return;

    // Check if there's an active dialog/popup
    if (typeof Dialog !== "undefined" && Dialog.active_id) {
        // Check if it's a quest-related popup
        const popupContent = document.querySelector(".popup_box_content");
        if (popupContent) {
            // Look for quest-related content or green buttons
            const hasGreenButton = document.querySelector(".btn-confirm-yes");
            if (hasGreenButton) {
                closeQuestPopup();
                console.log("[Quest Popup] Auto-closed quest popup");
            }
        }
    }
}

function startQuestSystems() {
    const settings = getSettings();

    // Auto-solve quests every 2 hours (7200000 ms)
    if (settings.questAutoSolve) {
        const TWO_HOURS = 2 * 60 * 60 * 1000;

        // Check if enough time has passed since last solve
        const now = Date.now();
        const timeSinceLast = now - lastQuestSolveTime;

        if (timeSinceLast >= TWO_HOURS) {
            // Run immediately
            setTimeout(() => {
                autoSolveQuests();
                lastQuestSolveTime = Date.now();
            }, 5000); // Wait 5 seconds after page load
        }

        // Set up interval for subsequent runs
        if (questSolveInterval) clearInterval(questSolveInterval);
        questSolveInterval = setInterval(() => {
            autoSolveQuests();
            lastQuestSolveTime = Date.now();
        }, TWO_HOURS);

        console.log("[Quest] Auto-solve enabled (every 2 hours)");
    }

    // Check for popups every minute
    if (settings.questAutoClosePopups) {
        if (questPopupInterval) clearInterval(questPopupInterval);
        questPopupInterval = setInterval(checkAndCloseQuestPopups, 60000);
        console.log("[Quest] Popup auto-close enabled (checking every minute)");
    }
}

function stopQuestSystems() {
    if (questSolveInterval) {
        clearInterval(questSolveInterval);
        questSolveInterval = null;
    }
    if (questPopupInterval) {
        clearInterval(questPopupInterval);
        questPopupInterval = null;
    }
}

// ============ DAILY REWARD FUNCTIONS ============
function getTodayDate() {
    const now = new Date();
    return now.toISOString().split("T")[0]; // YYYY-MM-DD format
}

function getCurrentHour() {
    return new Date().getHours();
}

function getCurrentMinute() {
    return new Date().getMinutes();
}

function isInDailyRewardWindow() {
    // Check if current time is between 00:01 and 03:00
    const hour = getCurrentHour();
    const minute = getCurrentMinute();

    if (hour === 0 && minute >= 1) return true;  // 00:01 - 00:59
    if (hour === 1 || hour === 2) return true;   // 01:00 - 02:59
    return false;
}

function hasCollectedTodayReward() {
    const settings = getSettings();
    const today = getTodayDate();
    return settings.lastDailyRewardDate === today;
}

function markDailyRewardCollected() {
    const settings = getSettings();
    settings.lastDailyRewardDate = getTodayDate();
    saveSettings(settings);
    console.log("[Daily Reward] Marked as collected for:", getTodayDate());
}

function isOnDailyBonusPage() {
    return window.location.href.includes("screen=info_player") &&
           window.location.href.includes("mode=daily_bonus");
}

function isOnMainPage() {
    return window.location.href.includes("screen=main");
}

function navigateToDailyBonus() {
    const villageId = game_data.village.id;
    const url = `/game.php?village=${villageId}&screen=info_player&mode=daily_bonus`;
    console.log("[Daily Reward] Navigating to daily bonus page...");
    window.location.href = url;
}

function navigateToMain() {
    const villageId = game_data.village.id;
    const url = `/game.php?village=${villageId}&screen=main`;
    console.log("[Daily Reward] Navigating back to main page...");
    window.location.href = url;
}

function collectDailyReward() {
    // Find and click the daily reward button
    // Supported languages: Hungarian (Kinyitni), English (Open/Collect), German (Öffnen/Abholen)
    const buttonTexts = ["Kinyitni", "Open", "Collect", "Öffnen", "Abholen", "Ouvrir", "Abrir"];
    const buttons = document.querySelectorAll(".actions a.btn.btn-default");
    let collected = false;

    buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (buttonTexts.some(t => text.includes(t))) {
            console.log("[Daily Reward] Found reward button:", text);
            btn.click();
            collected = true;
        }
    });

    // Also try more specific selector
    if (!collected) {
        const specificBtns = document.querySelectorAll('div.actions > a.btn-default[href*="daily_bonus"]');
        specificBtns.forEach(btn => {
            console.log("[Daily Reward] Found reward button (specific), clicking...");
            btn.click();
            collected = true;
        });
    }

    // Fallback: try to find any button with daily_bonus in href
    if (!collected) {
        const allBtns = document.querySelectorAll('a.btn[href*="daily_bonus"], a.btn-default[href*="daily_bonus"]');
        allBtns.forEach(btn => {
            if (!btn.classList.contains("btn-disabled")) {
                console.log("[Daily Reward] Found reward button (fallback), clicking...");
                btn.click();
                collected = true;
            }
        });
    }

    if (collected) {
        markDailyRewardCollected();
        UI.SuccessMessage("Daily reward collected!");

        // Navigate back to main after a delay
        setTimeout(() => {
            navigateToMain();
        }, 2000 + Math.random() * 2000);
    } else {
        console.log("[Daily Reward] No reward button found, might already be collected");
        // Mark as collected anyway to avoid repeated checks
        markDailyRewardCollected();

        // Navigate back to main
        setTimeout(() => {
            navigateToMain();
        }, 1000 + Math.random() * 1000);
    }

    return collected;
}

function checkAndCollectDailyReward() {
    const settings = getSettings();
    if (!settings.dailyRewardEnabled) return;

    // Check if already collected today
    if (hasCollectedTodayReward()) {
        console.log("[Daily Reward] Already collected today");
        return;
    }

    // Check if in the reward window (00:01 - 03:00)
    if (!isInDailyRewardWindow()) {
        console.log("[Daily Reward] Not in collection window (00:01 - 03:00)");
        return;
    }

    // If we're on the main page, navigate to daily bonus page
    if (isOnMainPage()) {
        // Add a random delay before navigating (to spread out the collection time)
        const randomDelay = Math.floor(Math.random() * 60000) + 5000; // 5-65 seconds
        console.log(`[Daily Reward] Will navigate to daily bonus page in ${(randomDelay / 1000).toFixed(0)}s...`);

        setTimeout(() => {
            // Double-check settings and conditions before navigating
            const settings = getSettings();
            if (settings.dailyRewardEnabled && !hasCollectedTodayReward() && isInDailyRewardWindow()) {
                navigateToDailyBonus();
            }
        }, randomDelay);
    }
}

function initDailyRewardOnBonusPage() {
    const settings = getSettings();
    if (!settings.dailyRewardEnabled) {
        // If disabled but we're on the bonus page, just go back to main
        navigateToMain();
        return;
    }

    // If already collected today, go back to main
    if (hasCollectedTodayReward()) {
        console.log("[Daily Reward] Already collected, going back to main");
        navigateToMain();
        return;
    }

    // Wait for page to load, then collect reward
    console.log("[Daily Reward] On daily bonus page, attempting to collect...");
    setTimeout(() => {
        collectDailyReward();
    }, 1500 + Math.random() * 1500);
}

// ============ BUILD LOGIC ============
function getNextStep() {
    const state = getVillageState();
    if (!state.activeTemplateId) return null;

    const templates = getTemplates();
    const template = templates[state.activeTemplateId];
    if (!template) return null;

    // Find next incomplete step
    while (state.currentIndex < template.sequence.length) {
        const step = template.sequence[state.currentIndex];
        const currentLevel = getBuildingLevel(step.building);

        if (currentLevel >= step.level) {
            // Already done, skip to next
            state.currentIndex++;
            saveVillageState(state);
            continue;
        }

        return { step, index: state.currentIndex, total: template.sequence.length };
    }

    return null; // Template complete
}

function buildBuilding(buildingId, callback) {
    const data = {
        id: buildingId,
        force: 1,
        destroy: 0,
        source: game_data.village.id,
        h: game_data.csrf
    };

    const url = `/game.php?village=${game_data.village.id}&screen=main&ajaxaction=upgrade_building&type=main&`;

    $.ajax({
        url: url,
        type: "post",
        data: data,
        headers: {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "TribalWars-Ajax": 1
        }
    }).done(function(r) {
        const response = JSON.parse(r);
        if (response.error) {
            UI.ErrorMessage(response.error[0]);
            console.error("Build error:", response.error[0]);
            callback(false);
        } else if (response.response && response.response.success) {
            UI.SuccessMessage(response.response.success);
            console.log("Build success:", response.response.success);
            callback(true);
        } else {
            callback(false);
        }
    }).fail(function() {
        UI.ErrorMessage("Build request failed");
        callback(false);
    });
}

function processQueue() {
    const state = getVillageState();
    if (!state.isRunning) return;

    // Click free instant complete button if available
    const freeBtn = document.querySelector(".btn-instant-free");
    if (freeBtn && freeBtn.style.display !== "none") {
        freeBtn.click();
    }

    // Check if we can build
    if (isBuilding) return;
    if (getQueueLength() >= getMaxQueueLength()) return;

    // Check if we need to force build farm due to low population
    if (needsForceFarm()) {
        if (canBuildFarm()) {
            isBuilding = true;
            const popInfo = getPopulationInfo();
            console.log(`Force building Farm! Population at ${popInfo.freePercent.toFixed(1)}% free`);
            UI.InfoMessage(`Low population (${popInfo.freePercent.toFixed(0)}%) - Building Farm!`);

            setTimeout(() => {
                buildBuilding("farm", (success) => {
                    isBuilding = false;
                    if (success) {
                        setTimeout(() => {
                            window.location.reload();
                        }, Math.floor(Math.random() * 300 + 500));
                    }
                });
            }, Math.floor(Math.random() * 500 + 800));
            return;
        }
        // Can't afford farm, continue with template
    }

    const next = getNextStep();
    if (!next) {
        // Template complete or no template
        if (state.activeTemplateId) {
            UI.SuccessMessage("Template completed!");
            state.isRunning = false;
            saveVillageState(state);
            updateUI();
        }
        return;
    }

    const { step } = next;

    // Check if we can afford it
    if (!canAfford(step.building)) {
        // Try to collect quest resources if enabled
        const settings = getSettings();
        if (settings.questCollectResources) {
            const collected = collectQuestResources();
            if (collected > 0) {
                console.log(`[Quest] Collected ${collected} quest(s) for resources`);
                // Check again after a short delay to allow resources to update
                setTimeout(() => {
                    if (canAfford(step.building)) {
                        window.location.reload();
                    }
                }, 2000);
            }
        }
        return;
    }

    // Build it
    isBuilding = true;
    console.log(`Building ${BUILDINGS[step.building]} to level ${step.level}`);

    setTimeout(() => {
        buildBuilding(step.building, (success) => {
            isBuilding = false;
            if (success) {
                // Move to next step
                const currentState = getVillageState();
                currentState.currentIndex++;
                saveVillageState(currentState);

                // Reload after short delay
                setTimeout(() => {
                    window.location.reload();
                }, Math.floor(Math.random() * 300 + 500));
            }
        });
    }, Math.floor(Math.random() * 500 + 800));
}

function startScript() {
    const state = getVillageState();
    state.isRunning = true;
    saveVillageState(state);

    if (scriptInterval) clearInterval(scriptInterval);
    scriptInterval = setInterval(processQueue, 1000);

    updateUI();
}

function stopScript() {
    const state = getVillageState();
    state.isRunning = false;
    saveVillageState(state);

    if (scriptInterval) {
        clearInterval(scriptInterval);
        scriptInterval = null;
    }

    updateUI();
}

// ============ UI FUNCTIONS ============
function createWidget() {
    const container = document.createElement("div");
    container.id = "autoBuilderWidget";
    container.style.cssText = "margin-bottom: 10px;";
    container.innerHTML = `
        <table class="vis" width="100%" style="margin-bottom: 0;">
            <tr>
                <th colspan="3" id="abBuilderHeader" style="
                    background: #C1A264;
                    color: #000;
                    padding: 5px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    user-select: none;
                    border: 1px solid #7D510F;
                ">
                    <span id="abBuilderToggle" style="margin-right: 6px;">▼</span>Auto Builder
                </th>
            </tr>
        </table>
        <div id="abBuilderContent">
            <table class="vis" width="100%" style="margin-top: -1px;">
                <tr style="background: #F4E4BC;">
                    <td width="80" style="padding: 5px; border: 1px solid #7D510F;"><b>Template:</b></td>
                    <td style="padding: 5px; border: 1px solid #7D510F;">
                        <select id="abTemplateSelect" style="
                            width: 160px;
                            padding: 3px;
                            border: 1px solid #7D510F;
                            background: #FFF8E8;
                            font-size: 12px;
                            font-family: Verdana, Arial, sans-serif;
                            color: #000;
                        "></select>
                    </td>
                    <td style="text-align:right; padding: 5px; border: 1px solid #7D510F;">
                        <input type="button" id="abNewBtn" class="btn" value="New" style="
                            background: #654321;
                            color: #fff;
                            border: 1px solid #4a3214;
                            padding: 3px 10px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                        ">
                        <input type="button" id="abEditBtn" class="btn" value="Edit" style="
                            background: #654321;
                            color: #fff;
                            border: 1px solid #4a3214;
                            padding: 3px 10px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                        ">
                        <input type="button" id="abDeleteBtn" class="btn" value="Del" style="
                            background: #654321;
                            color: #fff;
                            border: 1px solid #4a3214;
                            padding: 3px 10px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                        ">
                    </td>
                </tr>
                <tr style="background: #DED3B9;">
                    <td colspan="3" style="text-align:right; padding: 5px; border: 1px solid #7D510F;">
                        <input type="button" id="abImportBtn" class="btn" value="Import" style="
                            background: #654321;
                            color: #fff;
                            border: 1px solid #4a3214;
                            padding: 3px 10px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                        ">
                        <input type="button" id="abExportBtn" class="btn" value="Export" style="
                            background: #654321;
                            color: #fff;
                            border: 1px solid #4a3214;
                            padding: 3px 10px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                        ">
                    </td>
                </tr>
                <tr style="background: #F4E4BC;">
                    <td colspan="3" style="padding: 5px; border: 1px solid #7D510F;">
                        <label style="display: inline-flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="abForceFarmEnabled" style="margin-right: 6px;">
                            <span>Force build Farm when free population below</span>
                        </label>
                        <select id="abForceFarmThreshold" style="
                            margin-left: 6px;
                            padding: 2px 4px;
                            border: 1px solid #7D510F;
                            background: #FFF8E8;
                            font-size: 12px;
                            font-family: Verdana, Arial, sans-serif;
                        ">
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                            <option value="20">20%</option>
                            <option value="25">25%</option>
                            <option value="30">30%</option>
                        </select>
                        <span id="abPopStatus" style="margin-left: 10px; color: #666; font-size: 11px;"></span>
                    </td>
                </tr>
            </table>
        </div>
        <table class="vis" width="100%" style="margin-top: -1px;">
            <tr>
                <th colspan="3" id="abQuestHeader" style="
                    background: #C1A264;
                    color: #000;
                    padding: 5px;
                    font-size: 12px;
                    font-weight: bold;
                    text-align: left;
                    cursor: pointer;
                    user-select: none;
                    border: 1px solid #7D510F;
                ">
                    <span id="abQuestToggle" style="margin-right: 6px;">▼</span>Quest System
                </th>
            </tr>
        </table>
        <div id="abQuestContent">
            <table class="vis" width="100%" style="margin-top: -1px;">
                <tr style="background: #F4E4BC;">
                    <td colspan="3" style="padding: 5px; border: 1px solid #7D510F;">
                        <label style="display: inline-flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="abQuestCollectResources" style="margin-right: 6px;">
                            <span>Collect quest resources when can't afford building</span>
                        </label>
                        <span style="margin-left: 6px; color: #666; font-size: 10px;">(only if storage has space)</span>
                    </td>
                </tr>
                <tr style="background: #DED3B9;">
                    <td colspan="3" style="padding: 5px; border: 1px solid #7D510F;">
                        <label style="display: inline-flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="abQuestAutoSolve" style="margin-right: 6px;">
                            <span>Auto-solve all quests every 2 hours</span>
                        </label>
                    </td>
                </tr>
                <tr style="background: #F4E4BC;">
                    <td colspan="3" style="padding: 5px; border: 1px solid #7D510F;">
                        <label style="display: inline-flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="abQuestAutoClosePopups" style="margin-right: 6px;">
                            <span>Auto-close quest completion popups</span>
                        </label>
                        <span style="margin-left: 6px; color: #666; font-size: 10px;">(checks every minute)</span>
                    </td>
                </tr>
                <tr style="background: #DED3B9;">
                    <td colspan="3" style="padding: 5px; border: 1px solid #7D510F;">
                        <label style="display: inline-flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="abDailyRewardEnabled" style="margin-right: 6px;">
                            <span>Auto-collect daily reward</span>
                        </label>
                        <span style="margin-left: 6px; color: #666; font-size: 10px;">(between 00:01-03:00)</span>
                        <span id="abDailyRewardStatus" style="margin-left: 10px; font-size: 10px;"></span>
                    </td>
                </tr>
            </table>
        </div>
        <table class="vis" width="100%" id="abProgressTable" style="display:none; margin-top: -1px;">
            <tr>
                <th colspan="2" id="abProgressHeader" style="
                    background: #C1A264;
                    color: #000;
                    padding: 5px;
                    font-size: 12px;
                    font-weight: bold;
                    text-align: left;
                    cursor: pointer;
                    user-select: none;
                    border: 1px solid #7D510F;
                ">
                    <span id="abProgressToggle" style="margin-right: 6px;">▼</span>
                    <span id="abProgressText">Progress: 0/0</span>
                    <span id="abCurrentText" style="float: right; font-weight: normal;">-</span>
                </th>
            </tr>
        </table>
        <div id="abProgressContent" style="display: none;">
            <div id="abQueueContainer" style="max-height: 180px; overflow-y: auto; border: 1px solid #7D510F; border-top: none;">
                <table class="vis" width="100%" id="abQueueTable" style="margin: 0;"></table>
            </div>
        </div>
        <table class="vis" width="100%" style="margin-top: -1px;">
            <tr>
                <td style="text-align: center; padding: 8px; background: #DED3B9; border: 1px solid #7D510F;">
                    <input type="button" id="abStartBtn" class="btn" value="Start" style="
                        background: #654321;
                        color: #fff;
                        font-weight: bold;
                        border: 1px solid #4a3214;
                        padding: 5px 20px;
                        font-size: 12px;
                        cursor: pointer;
                    ">
                    <input type="button" id="abStopBtn" class="btn" value="Stop" style="
                        display: none;
                        background: #C14747;
                        color: #fff;
                        font-weight: bold;
                        border: 1px solid #a03737;
                        padding: 5px 20px;
                        font-size: 12px;
                        cursor: pointer;
                    ">
                </td>
            </tr>
        </table>
    `;

    // Insert before content
    const content = document.getElementById("content_value");
    if (content && content.parentElement) {
        content.parentElement.parentElement.insertBefore(container, content.parentElement);
    }

    // Event listeners
    document.getElementById("abTemplateSelect").addEventListener("change", function() {
        const templateId = this.value;
        if (templateId) {
            activateTemplate(templateId);
        } else {
            const state = getVillageState();
            state.activeTemplateId = null;
            state.currentIndex = 0;
            saveVillageState(state);
            updateUI();
        }
    });

    document.getElementById("abNewBtn").addEventListener("click", () => {
        showTemplateEditor();
    });

    document.getElementById("abEditBtn").addEventListener("click", () => {
        const state = getVillageState();
        if (state.activeTemplateId) {
            showTemplateEditor(state.activeTemplateId);
        } else {
            UI.ErrorMessage("Select a template first");
        }
    });

    document.getElementById("abDeleteBtn").addEventListener("click", () => {
        const state = getVillageState();
        if (state.activeTemplateId && confirm("Delete this template?")) {
            deleteTemplate(state.activeTemplateId);
            updateUI();
        } else if (!state.activeTemplateId) {
            UI.ErrorMessage("Select a template first");
        }
    });

    document.getElementById("abImportBtn").addEventListener("click", () => {
        showImportDialog();
    });

    document.getElementById("abExportBtn").addEventListener("click", () => {
        exportTemplate();
    });

    document.getElementById("abStartBtn").addEventListener("click", () => {
        const state = getVillageState();
        if (!state.activeTemplateId) {
            UI.ErrorMessage("Select a template first");
            return;
        }
        startScript();
    });

    document.getElementById("abStopBtn").addEventListener("click", () => {
        stopScript();
    });

    // Force Farm settings
    const forceFarmCheckbox = document.getElementById("abForceFarmEnabled");
    const forceFarmSelect = document.getElementById("abForceFarmThreshold");

    // Load saved settings
    const settings = getSettings();
    forceFarmCheckbox.checked = settings.forceFarmEnabled;
    forceFarmSelect.value = settings.forceFarmThreshold.toString();

    forceFarmCheckbox.addEventListener("change", () => {
        const settings = getSettings();
        settings.forceFarmEnabled = forceFarmCheckbox.checked;
        saveSettings(settings);
        updatePopStatus();
    });

    forceFarmSelect.addEventListener("change", () => {
        const settings = getSettings();
        settings.forceFarmThreshold = parseInt(forceFarmSelect.value, 10);
        saveSettings(settings);
        updatePopStatus();
    });

    // Quest settings
    const questCollectCheckbox = document.getElementById("abQuestCollectResources");
    const questAutoSolveCheckbox = document.getElementById("abQuestAutoSolve");
    const questPopupsCheckbox = document.getElementById("abQuestAutoClosePopups");

    // Load saved quest settings
    questCollectCheckbox.checked = settings.questCollectResources;
    questAutoSolveCheckbox.checked = settings.questAutoSolve;
    questPopupsCheckbox.checked = settings.questAutoClosePopups;

    questCollectCheckbox.addEventListener("change", () => {
        const settings = getSettings();
        settings.questCollectResources = questCollectCheckbox.checked;
        saveSettings(settings);
        console.log("[Quest] Collect resources:", questCollectCheckbox.checked ? "enabled" : "disabled");
    });

    questAutoSolveCheckbox.addEventListener("change", () => {
        const settings = getSettings();
        settings.questAutoSolve = questAutoSolveCheckbox.checked;
        saveSettings(settings);
        // Restart quest systems to apply changes
        stopQuestSystems();
        startQuestSystems();
        console.log("[Quest] Auto-solve:", questAutoSolveCheckbox.checked ? "enabled" : "disabled");
    });

    questPopupsCheckbox.addEventListener("change", () => {
        const settings = getSettings();
        settings.questAutoClosePopups = questPopupsCheckbox.checked;
        saveSettings(settings);
        // Restart quest systems to apply changes
        stopQuestSystems();
        startQuestSystems();
        console.log("[Quest] Auto-close popups:", questPopupsCheckbox.checked ? "enabled" : "disabled");
    });

    // Daily reward settings
    const dailyRewardCheckbox = document.getElementById("abDailyRewardEnabled");
    dailyRewardCheckbox.checked = settings.dailyRewardEnabled;

    dailyRewardCheckbox.addEventListener("change", () => {
        const settings = getSettings();
        settings.dailyRewardEnabled = dailyRewardCheckbox.checked;
        saveSettings(settings);
        updateDailyRewardStatus();
        console.log("[Daily Reward] Auto-collect:", dailyRewardCheckbox.checked ? "enabled" : "disabled");

        // If enabled and conditions are right, check for daily reward
        if (dailyRewardCheckbox.checked) {
            checkAndCollectDailyReward();
        }
    });

    // Update daily reward status display
    updateDailyRewardStatus();

    // Collapsible section toggles
    const builderHeader = document.getElementById("abBuilderHeader");
    const builderContent = document.getElementById("abBuilderContent");
    const builderToggle = document.getElementById("abBuilderToggle");
    const questHeader = document.getElementById("abQuestHeader");
    const questContent = document.getElementById("abQuestContent");
    const questToggle = document.getElementById("abQuestToggle");

    // Apply saved collapse states
    if (settings.builderSectionCollapsed) {
        builderContent.style.display = "none";
        builderToggle.textContent = "▶";
    }
    if (settings.questSectionCollapsed) {
        questContent.style.display = "none";
        questToggle.textContent = "▶";
    }

    builderHeader.addEventListener("click", () => {
        const settings = getSettings();
        const isCollapsed = builderContent.style.display === "none";

        if (isCollapsed) {
            builderContent.style.display = "";
            builderToggle.textContent = "▼";
            settings.builderSectionCollapsed = false;
        } else {
            builderContent.style.display = "none";
            builderToggle.textContent = "▶";
            settings.builderSectionCollapsed = true;
        }
        saveSettings(settings);
    });

    questHeader.addEventListener("click", () => {
        const settings = getSettings();
        const isCollapsed = questContent.style.display === "none";

        if (isCollapsed) {
            questContent.style.display = "";
            questToggle.textContent = "▼";
            settings.questSectionCollapsed = false;
        } else {
            questContent.style.display = "none";
            questToggle.textContent = "▶";
            settings.questSectionCollapsed = true;
        }
        saveSettings(settings);
    });

    // Progress section toggle
    const progressHeader = document.getElementById("abProgressHeader");
    const progressContent = document.getElementById("abProgressContent");
    const progressToggle = document.getElementById("abProgressToggle");

    // Apply saved progress collapse state
    if (settings.progressSectionCollapsed) {
        progressContent.style.display = "none";
        progressToggle.textContent = "▶";
    }

    progressHeader.addEventListener("click", () => {
        const settings = getSettings();
        const isCollapsed = progressContent.style.display === "none";

        if (isCollapsed) {
            progressContent.style.display = "";
            progressToggle.textContent = "▼";
            settings.progressSectionCollapsed = false;
        } else {
            progressContent.style.display = "none";
            progressToggle.textContent = "▶";
            settings.progressSectionCollapsed = true;
        }
        saveSettings(settings);
    });

    // Update population status display
    updatePopStatus();
}

function updatePopStatus() {
    const popStatus = document.getElementById("abPopStatus");
    if (!popStatus) return;

    const popInfo = getPopulationInfo();
    const settings = getSettings();

    let statusText = `(${popInfo.free}/${popInfo.max} = ${popInfo.freePercent.toFixed(1)}% free)`;
    let statusColor = "#666";

    if (settings.forceFarmEnabled) {
        if (popInfo.freePercent < settings.forceFarmThreshold) {
            statusText += " ⚠️ LOW!";
            statusColor = "#c44";
        } else {
            statusText += " ✓";
            statusColor = "#4a4";
        }
    }

    popStatus.textContent = statusText;
    popStatus.style.color = statusColor;
}

function updateDailyRewardStatus() {
    const statusSpan = document.getElementById("abDailyRewardStatus");
    if (!statusSpan) return;

    const settings = getSettings();

    if (!settings.dailyRewardEnabled) {
        statusSpan.textContent = "";
        return;
    }

    if (hasCollectedTodayReward()) {
        statusSpan.textContent = "✓ Collected today";
        statusSpan.style.color = "#006600";
    } else if (isInDailyRewardWindow()) {
        statusSpan.textContent = "⏳ Waiting to collect...";
        statusSpan.style.color = "#FF6B00";
    } else {
        statusSpan.textContent = "○ Next: 00:01";
        statusSpan.style.color = "#666";
    }
}

function updateUI() {
    const state = getVillageState();
    const templates = getTemplates();

    // Update template selector
    const select = document.getElementById("abTemplateSelect");
    if (select) {
        select.innerHTML = '<option value="">-- Select Template --</option>';
        for (const [id, tpl] of Object.entries(templates)) {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = tpl.name;
            if (id === state.activeTemplateId) opt.selected = true;
            select.appendChild(opt);
        }
    }

    // Update progress and queue display
    const progressTable = document.getElementById("abProgressTable");
    const progressContent = document.getElementById("abProgressContent");
    const progressToggle = document.getElementById("abProgressToggle");
    const queueTable = document.getElementById("abQueueTable");

    if (state.activeTemplateId && templates[state.activeTemplateId]) {
        const template = templates[state.activeTemplateId];
        const sequence = template.sequence;

        // Count completed steps
        let completed = 0;
        for (let i = 0; i < sequence.length; i++) {
            if (getBuildingLevel(sequence[i].building) >= sequence[i].level) {
                completed++;
            } else {
                break;
            }
        }

        // Update progress text
        document.getElementById("abProgressText").textContent = `Progress: ${completed}/${sequence.length}`;

        // Update current building text
        const next = getNextStep();
        if (next) {
            const currentLvl = getBuildingLevel(next.step.building);
            document.getElementById("abCurrentText").textContent =
                `Current: ${BUILDINGS[next.step.building]} (${currentLvl} → ${next.step.level})`;
        } else {
            document.getElementById("abCurrentText").textContent = "Complete!";
        }

        // Build queue display
        queueTable.innerHTML = "";
        for (let i = 0; i < sequence.length; i++) {
            const step = sequence[i];
            const currentLvl = getBuildingLevel(step.building);
            const isDone = currentLvl >= step.level;
            const isCurrent = i === state.currentIndex && !isDone;

            const row = document.createElement("tr");

            // TW alternating row colors
            let rowBg = i % 2 === 0 ? "#F4E4BC" : "#DED3B9";
            let icon = "○";
            let iconColor = "#999";
            let textStyle = "";

            if (isDone) {
                icon = "✓";
                iconColor = "#006600";  // TW success green
                textStyle = "opacity: 0.6;";
            } else if (isCurrent) {
                icon = "▶";
                iconColor = "#FF6B00";  // TW progress orange
                rowBg = "#FFF3CD";      // TW warning background
                textStyle = "font-weight: bold;";
            }

            row.style.cssText = `background: ${rowBg}; ${textStyle}`;
            row.innerHTML = `
                <td width="25" style="text-align: center; padding: 5px; border: 1px solid #7D510F; color: ${iconColor}; font-weight: bold;">${icon}</td>
                <td width="30" style="padding: 5px; border: 1px solid #7D510F; color: #666;">${i + 1}.</td>
                <td style="padding: 5px; border: 1px solid #7D510F;">${BUILDINGS[step.building]} → Lv.${step.level}</td>
            `;
            queueTable.appendChild(row);
        }

        // Show progress header
        progressTable.style.display = "";

        // Show/hide content based on saved collapse state
        const settings = getSettings();
        if (!settings.progressSectionCollapsed) {
            progressContent.style.display = "";
            progressToggle.textContent = "▼";
        } else {
            progressContent.style.display = "none";
            progressToggle.textContent = "▶";
        }
    } else {
        progressTable.style.display = "none";
        progressContent.style.display = "none";
    }

    // Update start/stop buttons
    const startBtn = document.getElementById("abStartBtn");
    const stopBtn = document.getElementById("abStopBtn");

    if (state.isRunning) {
        startBtn.style.display = "none";
        stopBtn.style.display = "";
    } else {
        startBtn.style.display = "";
        stopBtn.style.display = "none";
    }

    // Update population status
    updatePopStatus();
}

function showTemplateEditor(editId = null) {
    const templates = getTemplates();
    const isEdit = editId && templates[editId];
    const template = isEdit ? templates[editId] : null;

    // Use TW's native Dialog if available, otherwise create styled popup
    const overlay = document.createElement("div");
    overlay.id = "abEditorOverlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 12000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    overlay.innerHTML = `
        <div id="abEditorPopup" style="
            background: #FFF8E8;
            border: 1px solid #7D510F;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            width: 520px;
            max-height: 85vh;
            overflow: hidden;
            font-family: Verdana, Arial, sans-serif;
            font-size: 12px;
        ">
            <div style="
                background: #C1A264;
                color: #000;
                padding: 5px 10px;
                font-weight: bold;
                font-size: 12px;
                border-bottom: 1px solid #7D510F;
            ">
                ${isEdit ? "Edit" : "Create"} Template
            </div>
            <div style="padding: 10px; max-height: 70vh; overflow-y: auto;">
                <table class="vis" width="100%">
                    <tr style="background: #F4E4BC;">
                        <td width="100" style="padding: 5px; border: 1px solid #7D510F;"><b>Name:</b></td>
                        <td style="padding: 5px; border: 1px solid #7D510F;">
                            <input type="text" id="abEditorName" style="
                                width: 95%;
                                padding: 5px;
                                border: 1px solid #7D510F;
                                background: #FFFFFF;
                                font-size: 12px;
                                font-family: Verdana, Arial, sans-serif;
                            " value="${isEdit ? template.name : ""}" placeholder="My Template">
                        </td>
                    </tr>
                </table>

                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th style="padding: 5px; border: 1px solid #7D510F; text-align: left;">Template String</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td style="padding: 5px; border: 1px solid #7D510F;">
                            <textarea id="abEditorText" style="
                                width: 97%;
                                height: 80px;
                                padding: 5px;
                                border: 1px solid #7D510F;
                                background: #FFFFFF;
                                font-family: Verdana, Arial, sans-serif;
                                font-size: 11px;
                                resize: vertical;
                            " placeholder="main 2;barracks 1;smith 1;barracks 2;farm 3">${isEdit ? templateToString(template.sequence) : ""}</textarea>
                            <div style="font-size: 10px; color: #666; margin-top: 5px;">
                                Format: building level;building level;... (e.g., main 2;barracks 1;smith 3)
                            </div>
                        </td>
                    </tr>
                </table>

                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th colspan="3" style="padding: 5px; border: 1px solid #7D510F; text-align: left;">Or Add One by One</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td style="padding: 5px; border: 1px solid #7D510F;">
                            <select id="abEditorBuilding" style="
                                padding: 3px;
                                border: 1px solid #7D510F;
                                background: #FFF8E8;
                                font-size: 12px;
                                font-family: Verdana, Arial, sans-serif;
                                width: 160px;
                            ">
                                ${Object.entries(BUILDINGS).map(([id, name]) => `<option value="${id}">${name}</option>`).join("")}
                            </select>
                        </td>
                        <td width="80" style="padding: 5px; border: 1px solid #7D510F;">
                            <input type="number" id="abEditorLevel" style="
                                width: 50px;
                                padding: 3px;
                                border: 1px solid #7D510F;
                                background: #FFFFFF;
                                font-size: 12px;
                                text-align: center;
                            " value="1" min="1" max="30">
                        </td>
                        <td width="60" style="padding: 5px; border: 1px solid #7D510F;">
                            <input type="button" id="abEditorAddBtn" value="Add" style="
                                background: #654321;
                                color: #fff;
                                border: 1px solid #4a3214;
                                padding: 3px 10px;
                                font-size: 12px;
                                font-weight: bold;
                                cursor: pointer;
                            ">
                        </td>
                    </tr>
                </table>

                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th style="padding: 5px; border: 1px solid #7D510F; text-align: left;">Preview</th>
                    </tr>
                </table>
                <div style="max-height: 150px; overflow-y: auto; border: 1px solid #7D510F; border-top: none;">
                    <table class="vis" width="100%" id="abEditorPreviewTable" style="margin: 0;"></table>
                </div>
            </div>
            <div style="
                padding: 10px;
                background: #DED3B9;
                border-top: 1px solid #7D510F;
                text-align: right;
            ">
                <input type="button" id="abEditorCancelBtn" value="Cancel" style="
                    background: #654321;
                    color: #fff;
                    border: 1px solid #4a3214;
                    padding: 5px 15px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-right: 8px;
                ">
                <input type="button" id="abEditorSaveBtn" value="Save Template" style="
                    background: #654321;
                    color: #fff;
                    border: 1px solid #4a3214;
                    padding: 5px 15px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                ">
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Close on overlay click (outside popup)
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    // Update preview function
    function updatePreview() {
        const text = document.getElementById("abEditorText").value;
        const sequence = parseTemplate(text);
        const table = document.getElementById("abEditorPreviewTable");

        table.innerHTML = "";
        sequence.forEach((step, i) => {
            const row = document.createElement("tr");
            const rowBg = i % 2 === 0 ? "#F4E4BC" : "#DED3B9";
            row.style.background = rowBg;
            row.innerHTML = `
                <td width="30" style="padding: 5px; border: 1px solid #7D510F;">${i + 1}.</td>
                <td style="padding: 5px; border: 1px solid #7D510F;">${BUILDINGS[step.building]}</td>
                <td width="50" style="padding: 5px; border: 1px solid #7D510F;">→ ${step.level}</td>
            `;
            table.appendChild(row);
        });

        if (sequence.length === 0) {
            table.innerHTML = '<tr style="background: #F4E4BC;"><td style="color:#999;text-align:center;padding:10px;border:1px solid #7D510F;">No valid entries</td></tr>';
        }
    }

    // Event listeners
    document.getElementById("abEditorText").addEventListener("input", updatePreview);

    document.getElementById("abEditorAddBtn").addEventListener("click", (e) => {
        e.preventDefault();
        const building = document.getElementById("abEditorBuilding").value;
        const level = document.getElementById("abEditorLevel").value;
        const textarea = document.getElementById("abEditorText");

        const current = textarea.value.trim();
        const newEntry = `${building} ${level}`;
        textarea.value = current ? `${current};${newEntry}` : newEntry;
        updatePreview();
    });

    document.getElementById("abEditorCancelBtn").addEventListener("click", (e) => {
        e.preventDefault();
        overlay.remove();
    });

    document.getElementById("abEditorSaveBtn").addEventListener("click", (e) => {
        e.preventDefault();
        const name = document.getElementById("abEditorName").value.trim();
        const text = document.getElementById("abEditorText").value.trim();

        if (!text) {
            UI.ErrorMessage("Template cannot be empty");
            return;
        }

        const sequence = parseTemplate(text);
        if (sequence.length === 0) {
            UI.ErrorMessage("No valid building entries found");
            return;
        }

        if (isEdit) {
            // Update existing template
            templates[editId].name = name || "Unnamed Template";
            templates[editId].sequence = sequence;
            saveTemplates(templates);
        } else {
            // Create new template and activate it
            const newId = createTemplate(name, text);
            if (newId) {
                activateTemplate(newId);
            }
        }

        overlay.remove();
        updateUI();
        UI.SuccessMessage("Template saved!");
    });

    // Initial preview
    updatePreview();
}

function showImportDialog() {
    const overlay = document.createElement("div");
    overlay.id = "abImportOverlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 12000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    overlay.innerHTML = `
        <div style="
            background: #FFF8E8;
            border: 1px solid #7D510F;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            width: 480px;
            font-family: Verdana, Arial, sans-serif;
            font-size: 12px;
        ">
            <div style="
                background: #C1A264;
                color: #000;
                padding: 5px 10px;
                font-weight: bold;
                font-size: 12px;
                border-bottom: 1px solid #7D510F;
            ">
                Import Template
            </div>
            <div style="padding: 10px;">
                <table class="vis" width="100%">
                    <tr style="background: #F4E4BC;">
                        <td width="80" style="padding: 5px; border: 1px solid #7D510F;"><b>Name:</b></td>
                        <td style="padding: 5px; border: 1px solid #7D510F;">
                            <input type="text" id="abImportName" style="
                                width: 95%;
                                padding: 5px;
                                border: 1px solid #7D510F;
                                background: #FFFFFF;
                                font-size: 12px;
                                font-family: Verdana, Arial, sans-serif;
                            " placeholder="Imported Template">
                        </td>
                    </tr>
                </table>

                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th style="padding: 5px; border: 1px solid #7D510F; text-align: left;">Paste Template</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td style="padding: 5px; border: 1px solid #7D510F;">
                            <textarea id="abImportText" style="
                                width: 97%;
                                height: 100px;
                                padding: 5px;
                                border: 1px solid #7D510F;
                                background: #FFFFFF;
                                font-family: Verdana, Arial, sans-serif;
                                font-size: 11px;
                                resize: vertical;
                            " placeholder="main 2;barracks 1;smith 3;...

Or paste JSON:
{&quot;name&quot;:&quot;My Template&quot;,&quot;template&quot;:&quot;main 2;barracks 1&quot;}"></textarea>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="
                padding: 10px;
                background: #DED3B9;
                border-top: 1px solid #7D510F;
                text-align: right;
            ">
                <input type="button" id="abImportCancelBtn" value="Cancel" style="
                    background: #654321;
                    color: #fff;
                    border: 1px solid #4a3214;
                    padding: 5px 15px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-right: 8px;
                ">
                <input type="button" id="abImportConfirmBtn" value="Import" style="
                    background: #654321;
                    color: #fff;
                    border: 1px solid #4a3214;
                    padding: 5px 15px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                ">
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Close on overlay click (outside popup)
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    document.getElementById("abImportCancelBtn").addEventListener("click", () => {
        overlay.remove();
    });

    document.getElementById("abImportConfirmBtn").addEventListener("click", () => {
        let name = document.getElementById("abImportName").value.trim();
        const text = document.getElementById("abImportText").value.trim();

        if (!text) {
            UI.ErrorMessage("Please paste a template");
            return;
        }

        let templateStr = text;

        // Try to parse as JSON first
        try {
            const json = JSON.parse(text);
            if (json.template) {
                templateStr = json.template;
                if (json.name && !name) name = json.name;
            }
        } catch (e) {
            // Not JSON, use as-is
        }

        const sequence = parseTemplate(templateStr);
        if (sequence.length === 0) {
            UI.ErrorMessage("No valid building entries found");
            return;
        }

        const newId = createTemplate(name || "Imported Template", templateStr);
        if (newId) {
            activateTemplate(newId);
            overlay.remove();
            updateUI();
            UI.SuccessMessage(`Imported ${sequence.length} steps!`);
        }
    });
}

function exportTemplate() {
    const state = getVillageState();
    if (!state.activeTemplateId) {
        UI.ErrorMessage("No template selected");
        return;
    }

    const templates = getTemplates();
    const template = templates[state.activeTemplateId];
    if (!template) return;

    const textFormat = templateToString(template.sequence);
    const jsonFormat = JSON.stringify({
        name: template.name,
        template: textFormat,
        created: template.created
    }, null, 2);

    const overlay = document.createElement("div");
    overlay.id = "abExportOverlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 12000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    overlay.innerHTML = `
        <div style="
            background: #FFF8E8;
            border: 1px solid #7D510F;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            width: 520px;
            font-family: Verdana, Arial, sans-serif;
            font-size: 12px;
        ">
            <div style="
                background: #C1A264;
                color: #000;
                padding: 5px 10px;
                font-weight: bold;
                font-size: 12px;
                border-bottom: 1px solid #7D510F;
            ">
                Export: ${template.name}
            </div>
            <div style="padding: 10px;">
                <table class="vis" width="100%">
                    <tr style="background: #C1A264;">
                        <th style="padding: 5px; border: 1px solid #7D510F; text-align: left;">Text Format</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td style="padding: 5px; border: 1px solid #7D510F;">
                            <textarea id="abExportText" readonly style="
                                width: 97%;
                                height: 60px;
                                padding: 5px;
                                border: 1px solid #7D510F;
                                background: #FFFFFF;
                                font-family: Verdana, Arial, sans-serif;
                                font-size: 11px;
                            ">${textFormat}</textarea>
                            <div style="margin-top: 8px;">
                                <input type="button" id="abCopyTextBtn" value="Copy Text" style="
                                    background: #654321;
                                    color: #fff;
                                    border: 1px solid #4a3214;
                                    padding: 3px 10px;
                                    font-size: 12px;
                                    font-weight: bold;
                                    cursor: pointer;
                                ">
                            </div>
                        </td>
                    </tr>
                </table>

                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th style="padding: 5px; border: 1px solid #7D510F; text-align: left;">JSON Format</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td style="padding: 5px; border: 1px solid #7D510F;">
                            <textarea id="abExportJson" readonly style="
                                width: 97%;
                                height: 80px;
                                padding: 5px;
                                border: 1px solid #7D510F;
                                background: #FFFFFF;
                                font-family: Verdana, Arial, sans-serif;
                                font-size: 11px;
                            ">${jsonFormat}</textarea>
                            <div style="margin-top: 8px;">
                                <input type="button" id="abCopyJsonBtn" value="Copy JSON" style="
                                    background: #654321;
                                    color: #fff;
                                    border: 1px solid #4a3214;
                                    padding: 3px 10px;
                                    font-size: 12px;
                                    font-weight: bold;
                                    cursor: pointer;
                                ">
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="
                padding: 10px;
                background: #DED3B9;
                border-top: 1px solid #7D510F;
                text-align: right;
            ">
                <input type="button" id="abExportCloseBtn" value="Close" style="
                    background: #654321;
                    color: #fff;
                    border: 1px solid #4a3214;
                    padding: 5px 15px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                ">
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Close on overlay click (outside popup)
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    document.getElementById("abCopyTextBtn").addEventListener("click", () => {
        navigator.clipboard.writeText(textFormat).then(() => {
            UI.SuccessMessage("Text copied!");
        });
    });

    document.getElementById("abCopyJsonBtn").addEventListener("click", () => {
        navigator.clipboard.writeText(jsonFormat).then(() => {
            UI.SuccessMessage("JSON copied!");
        });
    });

    document.getElementById("abExportCloseBtn").addEventListener("click", () => {
        overlay.remove();
    });
}

// ============ INIT ============
function init() {
    // Check if we're on the daily bonus page
    if (isOnDailyBonusPage()) {
        console.log("[Auto Builder] On daily bonus page");
        initDailyRewardOnBonusPage();
        return; // Don't initialize the full widget on this page
    }

    // Only initialize full widget on main page
    if (!isOnMainPage()) {
        console.log("[Auto Builder] Not on main page, skipping initialization");
        return;
    }

    createWidget();
    updateUI();

    // Auto-resume if was running
    const state = getVillageState();
    if (state.isRunning && state.activeTemplateId) {
        console.log("Auto-resuming template...");
        scriptInterval = setInterval(processQueue, 1000);
    }

    // Start quest systems
    startQuestSystems();

    // Check for daily reward collection
    checkAndCollectDailyReward();
}

// Start when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
