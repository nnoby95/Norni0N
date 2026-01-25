// ==UserScript==
// @name         Auto Builder
// @version      1.0.0
// @description  Template-based auto builder for Tribal Wars
// @author       Norbi0N
// @match        https://*/game.php?village=*&screen=main*
// @match        https://*/game.php?village=*&screen=info_player&mode=daily_bonus*
// @match        https://*/game.php?village=*&screen=place&mode=scavenge*
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

// Scavenger slot costs and info
const SCAVENGER_SLOTS = {
    1: {
        name: "Lusta gyűjtögetők",
        nameEn: "Lazy Gatherers",
        wood: 25,
        stone: 30,
        iron: 25,
        duration: "30s"
    },
    2: {
        name: "Szerény gyűjtögetők",
        nameEn: "Modest Gatherers",
        wood: 250,
        stone: 300,
        iron: 250,
        duration: "1h",
        requires: 1
    },
    3: {
        name: "Okos gyűjtögetők",
        nameEn: "Smart Gatherers",
        wood: 1000,
        stone: 1200,
        iron: 1000,
        duration: "3h",
        requires: 2
    },
    4: {
        name: "Kiváló gyűjtögetők",
        nameEn: "Excellent Gatherers",
        wood: 10000,
        stone: 12000,
        iron: 10000,
        duration: "6h",
        requires: 3
    }
};

// Paladin recruitment costs and info
const PALADIN_COST = {
    wood: 20,
    stone: 20,
    iron: 40,
    pop: 10,
    duration: "3:20:00",
    durationSeconds: 12000 // 3 hours 20 minutes
};

// Default template: Norbi0N_BotStart
// MINES = stone (clay) -> wood (timber) -> iron in exact order
const DEFAULT_TEMPLATE = {
    name: "Norbi0N_BotStart",
    sequence: [
        // MINES 1
        { building: "stone", level: 1 }, { building: "wood", level: 1 }, { building: "iron", level: 1 },
        { building: "main", level: 2 },
        { building: "farm", level: 2 },
        // MINES 2
        { building: "stone", level: 2 }, { building: "wood", level: 2 }, { building: "iron", level: 2 },
        { building: "storage", level: 3 },
        { building: "farm", level: 3 },
        // MINES 3
        { building: "stone", level: 3 }, { building: "wood", level: 3 }, { building: "iron", level: 3 },
        { building: "main", level: 3 },
        { building: "barracks", level: 1 },
        { building: "market", level: 1 },
        // MINES 4
        { building: "stone", level: 4 }, { building: "wood", level: 4 }, { building: "iron", level: 4 },
        { building: "market", level: 2 },
        { building: "main", level: 5 },
        { building: "barracks", level: 3 },
        { building: "smith", level: 1 },
        { building: "storage", level: 4 },
        { building: "farm", level: 4 },
        // MINES 8
        { building: "stone", level: 8 }, { building: "wood", level: 8 }, { building: "iron", level: 8 },
        { building: "storage", level: 5 },
        { building: "main", level: 7 },
        { building: "farm", level: 5 },
        // MINES 10
        { building: "stone", level: 10 }, { building: "wood", level: 10 }, { building: "iron", level: 10 },
        { building: "storage", level: 6 },
        { building: "main", level: 10 },
        { building: "farm", level: 6 },
        { building: "storage", level: 7 },
        { building: "smith", level: 5 },
        { building: "barracks", level: 5 },
        { building: "stable", level: 3 },
        { building: "farm", level: 7 },
        { building: "storage", level: 9 },
        // MINES 11
        { building: "stone", level: 11 }, { building: "wood", level: 11 }, { building: "iron", level: 11 },
        { building: "farm", level: 8 },
        { building: "storage", level: 10 },
        // MINES 13
        { building: "stone", level: 13 }, { building: "wood", level: 13 }, { building: "iron", level: 13 },
        { building: "market", level: 5 },
        { building: "storage", level: 11 },
        // MINES 14
        { building: "stone", level: 14 }, { building: "wood", level: 14 }, { building: "iron", level: 14 },
        { building: "storage", level: 12 },
        { building: "barracks", level: 8 },
        { building: "stable", level: 5 },
        { building: "main", level: 13 },
        // MINES 15
        { building: "stone", level: 15 }, { building: "wood", level: 15 }, { building: "iron", level: 15 },
        { building: "main", level: 15 },
        { building: "storage", level: 13 },
        { building: "market", level: 10 },
        { building: "farm", level: 9 },
        { building: "storage", level: 14 },
        { building: "wall", level: 5 },
        // MINES 16
        { building: "stone", level: 16 }, { building: "wood", level: 16 }, { building: "iron", level: 16 },
        { building: "storage", level: 15 },
        // MINES 18
        { building: "stone", level: 18 }, { building: "wood", level: 18 }, { building: "iron", level: 18 },
        { building: "farm", level: 10 },
        { building: "market", level: 15 },
        // MINES 20
        { building: "stone", level: 20 }, { building: "wood", level: 20 }, { building: "iron", level: 20 },
        { building: "main", level: 17 },
        { building: "storage", level: 18 },
        { building: "main", level: 20 },
        // MINES 22
        { building: "stone", level: 22 }, { building: "wood", level: 22 }, { building: "iron", level: 22 },
        { building: "farm", level: 11 },
        { building: "storage", level: 21 },
        { building: "smith", level: 10 },
        { building: "garage", level: 3 },
        { building: "barracks", level: 10 },
        { building: "stable", level: 7 },
        // MINES 25
        { building: "stone", level: 25 }, { building: "wood", level: 25 }, { building: "iron", level: 25 },
        { building: "farm", level: 12 },
        { building: "storage", level: 23 },
        { building: "barracks", level: 12 },
        { building: "stable", level: 8 },
        { building: "farm", level: 13 },
        { building: "wall", level: 15 },
        // MINES 27
        { building: "stone", level: 27 }, { building: "wood", level: 27 }, { building: "iron", level: 27 },
        { building: "storage", level: 25 },
        { building: "market", level: 20 },
        { building: "barracks", level: 15 },
        { building: "stable", level: 10 },
        { building: "smith", level: 15 },
        { building: "farm", level: 15 },
        { building: "storage", level: 27 },
        // MINES 30
        { building: "stone", level: 30 }, { building: "wood", level: 30 }, { building: "iron", level: 30 },
        { building: "barracks", level: 18 },
        { building: "stable", level: 13 },
        { building: "smith", level: 20 },
        { building: "farm", level: 17 },
        { building: "storage", level: 29 },
        { building: "snob", level: 1 },
        { building: "barracks", level: 20 },
        { building: "stable", level: 15 },
        { building: "barracks", level: 23 },
        { building: "stable", level: 17 },
        { building: "barracks", level: 25 },
        { building: "stable", level: 20 },
        { building: "storage", level: 30 },
        { building: "farm", level: 30 }
    ],
    created: "2024-12-28"
};

function installDefaultTemplate() {
    const templates = getTemplates();
    // Check if Norbi0N_BotStart already exists
    let exists = false;
    for (const id in templates) {
        if (templates[id].name === "Norbi0N_BotStart") {
            exists = true;
            break;
        }
    }
    if (!exists) {
        const templateId = "norbi0n_botstart_" + Date.now();
        templates[templateId] = DEFAULT_TEMPLATE;
        saveTemplates(templates);
        console.log("[Auto Builder] Installed default template: Norbi0N_BotStart");
    }
}

// Default settings
const DEFAULT_SETTINGS = {
    forceFarmEnabled: false,
    forceFarmThreshold: 10,  // percentage of free population
    // Quest system settings
    questCollectResources: false,  // Collect quest resources when can't build
    questAutoSolve: false,         // Auto-complete quests (after buildings + 2min backup)
    questAutoClosePopups: false,   // Auto-close quest popups
    // Daily reward settings
    dailyRewardEnabled: false,     // Auto-collect daily reward
    lastDailyRewardDate: null,     // Last date reward was collected (YYYY-MM-DD)
    // Scavenger slot unlock settings
    scavSlot1Unlocked: false,      // Track if slot 1 was unlocked
    scavSlot2Unlocked: false,      // Track if slot 2 was unlocked
    scavSlot3Enabled: false,       // Enable auto-unlock for slot 3
    scavSlot3Unlocked: false,      // Track if slot 3 was unlocked
    scavSlot4Enabled: false,       // Enable auto-unlock for slot 4
    scavSlot4Unlocked: false,      // Track if slot 4 was unlocked
    // Scavenger automation settings
    scavAutoRunEnabled: false,     // Enable auto-run scavenging
    scavExcludedUnits: ['knight', 'snob'],  // Units to leave home (default: knight, snob)
    scavExcludedSlots: [],         // Slots to exclude (default: use all available)
    scavMaxDuration: 7200,         // Max duration in seconds (default: 2 hours)
    scavPauseEnabled: false,       // Enable pause during specific hours
    scavPauseStart: '00:00',       // Pause start time (HH:MM)
    scavPauseEnd: '06:00',         // Pause end time (HH:MM)
    scavStopOnAttack: false,       // Stop scavenging when incoming attack detected
    // Paladin settings (DISABLED - NEEDS FIXING)
    // paladinAutoRecruit: true,      // Auto-recruit paladin when statue is built
    // paladinAutoFinish: true,       // Auto-finish paladin training
    // paladinName: "Paul",           // Default paladin name
    // paladinRecruited: false,       // Track if paladin was recruited (in training)
    // paladinCompleted: false,       // Track if paladin was fully recruited and finished
    // UI collapse states
    builderSectionCollapsed: false,
    questSectionCollapsed: false,
    progressSectionCollapsed: false
};

// ============ STATE ============
let isBuilding = false;
let isCollectingRewards = false; // Flag to prevent building while collecting rewards
let rewardsCheckedForBuilding = null; // Track which building we already checked rewards for (e.g., "smith_12")
let isUnlockingScavSlot = false; // Flag to prevent building while unlocking scav slot
let scriptInterval = null;
let questSolveInterval = null;
let questPopupInterval = null;
// let paladinCheckInterval = null; // Interval for checking paladin recruitment/finishing (DISABLED)
let lastQuestSolveTime = 0;
let wakeLock = null; // Wake Lock API object to prevent tab from going idle

// ============ WAKE LOCK FUNCTIONS ============
async function acquireWakeLock() {
    if (!("wakeLock" in navigator)) {
        console.log("[Auto Builder] Wake Lock API not supported in this browser");
        return;
    }

    try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("[Auto Builder] Wake Lock acquired - tab will stay active");

        wakeLock.addEventListener("release", () => {
            console.log("[Auto Builder] Wake Lock released");
        });
    } catch (err) {
        console.error(`[Auto Builder] Failed to acquire Wake Lock: ${err.name}, ${err.message}`);
    }
}

async function releaseWakeLock() {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
            wakeLock = null;
            console.log("[Auto Builder] Wake Lock manually released");
        } catch (err) {
            console.error(`[Auto Builder] Failed to release Wake Lock: ${err.message}`);
        }
    }
}

function handleVisibilityChange() {
    const state = getVillageState();

    if (document.visibilityState === "visible" && state.isRunning) {
        // Tab became visible and auto builder is running - re-acquire wake lock
        if (wakeLock === null || wakeLock.released) {
            console.log("[Auto Builder] Tab visible again, re-acquiring Wake Lock");
            acquireWakeLock();
        }
    }
}

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

function getBuildingQueueCount(buildingId) {
    // Count how many times a specific building is in the build queue
    // The queue rows have class like "buildorder_market", "buildorder_barracks", etc.
    const queue = document.getElementById("buildqueue");
    if (!queue) return 0;

    // Method 1: Count rows by class name (most reliable)
    // The class format is "buildorder_<buildingId>" e.g. "buildorder_market"
    const rowsByClass = queue.querySelectorAll(`tr.buildorder_${buildingId}`);
    if (rowsByClass.length > 0) {
        console.log(`[Queue Check] Found ${rowsByClass.length} ${buildingId} in queue (by class)`);
        return rowsByClass.length;
    }

    // Method 2: Fallback - check by image src which contains building name
    let count = 0;
    const rows = queue.querySelectorAll("tr");
    rows.forEach(row => {
        const img = row.querySelector("img.bmain_list_img");
        if (img && img.src) {
            // Image src contains building name like "market2.webp" or "barracks.webp"
            if (img.src.includes(`/${buildingId}`) || img.src.includes(`${buildingId}.`) || img.src.includes(`${buildingId}2.`)) {
                count++;
            }
        }
    });

    if (count > 0) {
        console.log(`[Queue Check] Found ${count} ${buildingId} in queue (by image)`);
    }

    return count;
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
    // Check if we can afford the CURRENT building we need to build
    const next = getNextStep();
    if (!next) return false; // No next step means template complete

    return canAfford(next.step.building);
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

function getCurrentBuildingKey() {
    // Get the current building we're trying to build (e.g., "smith_12")
    const state = getVillageState();
    if (!state.activeTemplateId) return null;

    const templates = getTemplates();
    const template = templates[state.activeTemplateId];
    if (!template || state.currentIndex >= template.sequence.length) return null;

    const step = template.sequence[state.currentIndex];
    return `${step.building}_${step.level}`;
}

function collectQuestResources() {
    const settings = getSettings();
    if (!settings.questCollectResources) return 0;

    // Don't start if already collecting
    if (isCollectingRewards) {
        console.log("[Reward] Already collecting rewards, waiting...");
        return 0;
    }

    // Only collect if we CAN'T afford the next building
    if (canAffordAnyBuilding()) {
        // Reset the check flag when we CAN afford a building (means resources regenerated or we got rewards)
        rewardsCheckedForBuilding = null;
        console.log("[Reward] Can still afford buildings, skipping reward collection");
        return 0;
    }

    // Check if we already tried to collect rewards for this building and found none
    const currentBuildingKey = getCurrentBuildingKey();
    if (currentBuildingKey && rewardsCheckedForBuilding === currentBuildingKey) {
        // We already checked rewards for this building and found none
        // Don't check again until a new building is completed (which will change currentBuildingKey)
        // or until we can afford a building (which resets rewardsCheckedForBuilding above)
        console.log(`[Reward] Already checked rewards for ${currentBuildingKey}, waiting for new building to complete...`);
        return 0;
    }

    console.log("[Reward] Can't afford building, attempting to collect rewards...");

    // Set flag to prevent building while collecting
    isCollectingRewards = true;

    // Step 1: Click on #new_quest to open the quest popup
    const questButton = document.getElementById("new_quest");
    if (!questButton) {
        console.log("[Reward] Quest button (#new_quest) not found");
        isCollectingRewards = false;
        return 0;
    }

    questButton.click();
    console.log("[Reward] Opened quest popup");

    // Step 2: Wait for popup to load, then click on Rewards tab
    setTimeout(() => {
        const rewardTab = document.querySelector('a.tab-link[data-tab="reward-tab"]');
        if (!rewardTab) {
            console.log("[Reward] Rewards tab not found");
            closeRewardPopup();
            isCollectingRewards = false;
            // Mark that we checked for this building
            rewardsCheckedForBuilding = currentBuildingKey;
            return;
        }

        rewardTab.click();
        console.log("[Reward] Clicked on Rewards tab");

        // Step 3: Wait for rewards to load, then collect
        setTimeout(() => {
            collectAvailableRewards(currentBuildingKey);
        }, 200);
    }, 250);

    return 1; // Return 1 to indicate we started the process
}

function collectAvailableRewards(currentBuildingKey, totalCollected = 0) {
    // Find all claim buttons currently visible
    const claimButtons = document.querySelectorAll(".reward-system-claim-button");

    if (claimButtons.length === 0) {
        console.log(`[Reward] No more rewards available. Total collected: ${totalCollected}`);
        closeRewardPopup();
        isCollectingRewards = false;
        // Mark that we checked for this building - no need to check again until new building completes
        rewardsCheckedForBuilding = currentBuildingKey;
        console.log(`[Reward] Marked ${currentBuildingKey} as checked, will wait for new building`);
        return totalCollected;
    }

    console.log(`[Reward] Found ${claimButtons.length} reward(s) in current view`);

    // Check the FIRST button only
    const firstButton = claimButtons[0];
    const parentTd = firstButton.closest("td");
    const warning = parentTd ? parentTd.querySelector(".small.warn") : null;

    // If first reward has storage warning, stop collecting
    if (warning) {
        console.log(`[Reward] Storage warning detected! Stopping collection. Total collected: ${totalCollected}`);
        closeRewardPopup();
        isCollectingRewards = false;
        rewardsCheckedForBuilding = currentBuildingKey;
        console.log(`[Reward] Marked ${currentBuildingKey} as checked (storage full)`);
        return totalCollected;
    }

    // Click the first button
    console.log(`[Reward] Collecting reward ${totalCollected + 1}...`);
    firstButton.click();

    // Wait for reward to be collected (button disappears), then check for more
    setTimeout(() => {
        collectAvailableRewards(currentBuildingKey, totalCollected + 1);
    }, 300); // Wait 300ms for DOM to update after clicking

    return totalCollected + 1;
}

function closeRewardPopup() {
    // Try to close the quest/reward popup
    const closeBtn = document.querySelector(".popup_box_close, .popup_cross, [class*='close']");
    if (closeBtn) {
        closeBtn.click();
        console.log("[Reward] Closed popup");
    }

    // Also try clicking outside or pressing escape
    const overlay = document.querySelector(".fader, .popup_helper");
    if (overlay) {
        overlay.click();
    }
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
        // First, try to complete any quest if "Teljesítsd a küldetést" button exists
        const completeBtn = document.querySelector(".quest-complete-btn, .btn.btn-confirm-yes.status-btn");
        if (completeBtn && completeBtn.offsetParent !== null) {
            console.log("[Quest Popup] Auto-completing quest");
            completeBtn.click();
            return;
        }

        // Then check if it's a quest-related popup to close
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

    // Auto-solve quests immediately when they're completed
    if (settings.questAutoSolve) {
        const BACKUP_CHECK = 2 * 60 * 1000; // Check every 2 minutes as backup

        // Run immediately after 5 seconds
        setTimeout(() => {
            autoSolveQuests();
            lastQuestSolveTime = Date.now();
        }, 5000);

        // Set up backup interval (main checks happen after each building completion)
        if (questSolveInterval) clearInterval(questSolveInterval);
        questSolveInterval = setInterval(() => {
            autoSolveQuests();
            lastQuestSolveTime = Date.now();
        }, BACKUP_CHECK);

        console.log("[Quest] Auto-solve enabled (checks after each building + every 2 minutes backup)");
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

// ============ SCAVENGER SLOT UNLOCK FUNCTIONS ============
function canAffordScavSlot(slotId) {
    const slot = SCAVENGER_SLOTS[slotId];
    if (!slot) return false;

    const res = getResources();
    return res.wood >= slot.wood && res.stone >= slot.stone && res.iron >= slot.iron;
}

function unlockScavSlot(slotId, callback) {
    const slot = SCAVENGER_SLOTS[slotId];
    if (!slot) {
        console.error(`[Scavenger] Invalid slot ID: ${slotId}`);
        if (callback) callback(false);
        return;
    }

    console.log(`[Scavenger] Unlocking slot ${slotId}: ${slot.name}`);

    const requestData = {
        village_id: game_data.village.id,
        option_id: slotId
    };

    // Use TribalWars.post for AJAX call
    if (typeof TribalWars !== "undefined" && TribalWars.post) {
        TribalWars.post(
            'scavenge_api',
            { ajaxaction: 'start_unlock' },
            requestData,
            function(response) {
                console.log(`[Scavenger] Slot ${slotId} unlock request sent!`, response);
                UI.SuccessMessage(`Unlocking ${slot.name}! (${slot.duration})`);
                if (callback) callback(true);
            },
            function(error) {
                console.error(`[Scavenger] Failed to unlock slot ${slotId}:`, error);
                UI.ErrorMessage(`Failed to unlock ${slot.name}`);
                if (callback) callback(false);
            }
        );
    } else {
        console.error("[Scavenger] TribalWars.post not available");
        if (callback) callback(false);
    }
}

function detectUnlockedSlots() {
    // Detect which slots are already unlocked by checking ScavengeScreen
    // This prevents trying to unlock already unlocked slots

    if (typeof ScavengeScreen === 'undefined' || !ScavengeScreen.village || !ScavengeScreen.village.options) {
        console.log("[Scavenger] ScavengeScreen not available, cannot detect unlocked slots");
        return;
    }

    const settings = getSettings();
    let updated = false;

    // Check each slot (1-4)
    for (let slotId = 1; slotId <= 4; slotId++) {
        const opt = ScavengeScreen.village.options[slotId];

        if (opt && !opt.is_locked) {
            // Slot is unlocked!
            const settingKey = `scavSlot${slotId}Unlocked`;

            if (!settings[settingKey]) {
                console.log(`[Scavenger] Detected Slot ${slotId} is already unlocked! Marking as unlocked.`);
                settings[settingKey] = true;
                updated = true;
            }
        }
    }

    if (updated) {
        saveSettings(settings);
        console.log("[Scavenger] Updated settings with detected unlocked slots");
    }
}

function checkAndUnlockSlot1() {
    const settings = getSettings();

    // Only try once
    if (settings.scavSlot1Unlocked) {
        return false;
    }

    console.log("[Scavenger] Auto-unlocking Slot 1...");

    unlockScavSlot(1, (success) => {
        if (success) {
            const settings = getSettings();
            settings.scavSlot1Unlocked = true;
            saveSettings(settings);
            console.log("[Scavenger] Slot 1 unlocked and marked!");
        }
    });

    return true;
}

function checkAndUnlockSlot2() {
    const settings = getSettings();

    // Only try once
    if (settings.scavSlot2Unlocked) {
        return false;
    }

    // Check if barracks is level 3+
    const barracksLevel = getBuildingLevel("barracks");
    if (barracksLevel < 3) {
        return false;
    }

    // Check if we have resources
    if (!canAffordScavSlot(2)) {
        console.log("[Scavenger] Barracks lvl 3+ but not enough resources for Slot 2");
        return false;
    }

    console.log("[Scavenger] Auto-unlocking Slot 2 (Barracks lvl 3+)...");

    unlockScavSlot(2, (success) => {
        if (success) {
            const settings = getSettings();
            settings.scavSlot2Unlocked = true;
            saveSettings(settings);
            console.log("[Scavenger] Slot 2 unlocked and marked!");
        }
    });

    return true;
}

function checkAndUnlockSlot3() {
    const settings = getSettings();

    // Check if user enabled slot 3 unlock
    if (!settings.scavSlot3Enabled) {
        return false;
    }

    // Already unlocked
    if (settings.scavSlot3Unlocked) {
        return false;
    }

    // Check if we have resources
    if (!canAffordScavSlot(3)) {
        console.log("[Scavenger] Slot 3 enabled but waiting for resources...");
        // Set flag to pause building
        isUnlockingScavSlot = true;
        return false; // Don't have resources yet
    }

    // We have resources! Unlock it
    console.log("[Scavenger] Unlocking Slot 3...");
    isUnlockingScavSlot = true;

    unlockScavSlot(3, (success) => {
        isUnlockingScavSlot = false;
        if (success) {
            const settings = getSettings();
            settings.scavSlot3Unlocked = true;
            saveSettings(settings);
            console.log("[Scavenger] Slot 3 unlocked! Resuming building...");

            // Reload page after short delay to update UI
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    });

    return true;
}

function checkAndUnlockSlot4() {
    const settings = getSettings();

    // Check if user enabled slot 4 unlock
    if (!settings.scavSlot4Enabled) {
        return false;
    }

    // Already unlocked
    if (settings.scavSlot4Unlocked) {
        return false;
    }

    // Check if we have resources
    if (!canAffordScavSlot(4)) {
        console.log("[Scavenger] Slot 4 enabled but waiting for resources...");
        // Set flag to pause building
        isUnlockingScavSlot = true;
        return false; // Don't have resources yet
    }

    // We have resources! Unlock it
    console.log("[Scavenger] Unlocking Slot 4...");
    isUnlockingScavSlot = true;

    unlockScavSlot(4, (success) => {
        isUnlockingScavSlot = false;
        if (success) {
            const settings = getSettings();
            settings.scavSlot4Unlocked = true;
            saveSettings(settings);
            console.log("[Scavenger] Slot 4 unlocked! Resuming building...");

            // Reload page after short delay to update UI
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    });

    return true;
}

// ============ PALADIN FUNCTIONS (DISABLED - NEEDS FIXING) ============
/*
function checkAndRecruitPaladin() {
    const settings = getSettings();

    // Only check once - if completed, stop
    if (settings.paladinCompleted) {
        return false;
    }

    // Check if statue is built (level 1)
    const statueLevel = getBuildingLevel("statue");
    if (statueLevel < 1) {
        return false;
    }

    // Statue is built! Recruit paladin NOW
    console.log("[Paladin] Statue level 1 detected - recruiting paladin!");

    const paladinName = settings.paladinName || "Paul";

    // Step 1: Recruit using TribalWars.post
    TribalWars.post(
        'statue',
        { ajaxaction: 'recruit' },
        {
            name: paladinName,
            home: game_data.village.id
        },
        function() {
            console.log(`[Paladin] Recruited: ${paladinName}`);
            UI.SuccessMessage(`Paladin "${paladinName}" recruited!`);

            // Step 2: Wait 200ms then instant finish
            setTimeout(function() {
                TribalWars.post(
                    'statue',
                    { ajaxaction: 'recruit_rush' },
                    {},
                    function() {
                        console.log(`[Paladin] Instant finished!`);
                        UI.SuccessMessage("Paladin ready!");

                        // Mark as completed and stop
                        const settings = getSettings();
                        settings.paladinCompleted = true;
                        saveSettings(settings);
                        stopPaladinSystem();
                        console.log("[Paladin] DONE!");
                    },
                    function(error) {
                        console.error(`[Paladin] Finish error:`, error);
                    }
                );
            }, 200);
        },
        function(error) {
            console.error(`[Paladin] Recruitment error:`, error);
        }
    );

    return true;
}

function startPaladinSystem() {
    const settings = getSettings();

    // Don't start if paladin is already completed
    if (settings.paladinCompleted) {
        console.log("[Paladin] Already completed - system not needed");
        return;
    }

    // Only start if at least one paladin feature is enabled
    if (!settings.paladinAutoRecruit && !settings.paladinAutoFinish) {
        return;
    }

    // Clear existing interval if any
    if (paladinCheckInterval) {
        clearInterval(paladinCheckInterval);
    }

    // Check every 2 seconds for paladin recruitment (no finish check needed - happens immediately)
    paladinCheckInterval = setInterval(() => {
        checkAndRecruitPaladin();
    }, 2000);

    console.log("[Paladin] Auto-system started (independent of builder)");
}

function stopPaladinSystem() {
    if (paladinCheckInterval) {
        clearInterval(paladinCheckInterval);
        paladinCheckInterval = null;
        console.log("[Paladin] Auto-system stopped");
    }
}
*/

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

    // Note: Paladin checks now run independently via startPaladinSystem()
    // No need to check here anymore - it runs every 2 seconds regardless of builder state

    // Check if we can build
    if (isBuilding) return;
    if (isCollectingRewards) return; // Don't build while collecting rewards
    if (isUnlockingScavSlot) return; // Don't build while unlocking scav slot (waiting for resources)
    if (getQueueLength() >= getMaxQueueLength()) return;

    // Check and unlock scavenger slots
    checkAndUnlockSlot2(); // Auto-unlock slot 2 if barracks lvl 3+
    if (checkAndUnlockSlot3()) {
        // Slot 3 is being unlocked or waiting for resources - pause building
        return;
    }
    if (checkAndUnlockSlot4()) {
        // Slot 4 is being unlocked or waiting for resources - pause building
        return;
    }

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
    const currentLevel = getBuildingLevel(step.building);
    const queuedCount = getBuildingQueueCount(step.building);
    const levelAfterQueue = currentLevel + queuedCount;

    // Check if target will be reached after queue completes
    if (levelAfterQueue >= step.level) {
        console.log(`[Queue] ${BUILDINGS[step.building]} already queued to reach target (${currentLevel} + ${queuedCount} queued = ${levelAfterQueue} >= ${step.level})`);
        // Target will be reached, move to next step
        state.currentIndex++;
        saveVillageState(state);
        return; // Will check next step on next cycle
    }

    // Check if we can afford it
    if (!canAfford(step.building)) {
        // Try to collect quest resources if enabled
        const settings = getSettings();
        if (settings.questCollectResources) {
            collectQuestResources();
            // Don't reload here - let the reward collection complete
            // The isCollectingRewards flag will prevent building during collection
            // After collection completes, the next processQueue() cycle will handle building
        }
        return;
    }

    // Build it
    isBuilding = true;
    console.log(`Building ${BUILDINGS[step.building]} (${currentLevel} + ${queuedCount} queued → ${levelAfterQueue + 1}, target: ${step.level})`);

    setTimeout(() => {
        buildBuilding(step.building, (success) => {
            isBuilding = false;
            if (success) {
                // DON'T increment currentIndex here!
                // The page will reload and getNextStep() will check if the building
                // has reached the target level. If not, it will build again.
                // Only when building level >= target level, getNextStep() will skip to next step.

                // Check for completed quests after successful building
                const settings = getSettings();
                if (settings.questAutoSolve) {
                    setTimeout(() => {
                        autoSolveQuests();
                        console.log("[Quest] Checked for completed quests after building");
                    }, 800);
                }

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

    // Acquire Wake Lock to prevent tab from going idle
    acquireWakeLock();

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

    // Release Wake Lock when stopping
    releaseWakeLock();

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
                            <span>Auto-complete finished quests</span>
                        </label>
                        <span style="margin-left: 6px; color: #666; font-size: 10px;">(after each building + 2min backup)</span>
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
                <tr style="background: #F4E4BC;">
                    <td colspan="3" style="text-align:center; padding: 8px; border: 1px solid #7D510F;">
                        <input type="button" id="abQuestFeaturesBtn" class="btn" value="Quest Features" style="
                            background: #654321;
                            color: #fff;
                            border: 1px solid #4a3214;
                            padding: 5px 20px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                        ">
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

    // Quest Features button
    document.getElementById("abQuestFeaturesBtn").addEventListener("click", () => {
        showQuestFeaturesMenu();
    });

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

function showQuestFeaturesMenu() {
    const settings = getSettings();

    const overlay = document.createElement("div");
    overlay.id = "abQuestFeaturesOverlay";
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

    // Build slot status rows
    let slotRows = '';
    for (let slotId = 1; slotId <= 4; slotId++) {
        const slot = SCAVENGER_SLOTS[slotId];
        let statusText = '';
        let statusColor = '#666';
        let checkboxHtml = '';

        if (slotId === 1) {
            statusText = settings.scavSlot1Unlocked ? '✓ Unlocked' : '○ Auto-unlock on start';
            statusColor = settings.scavSlot1Unlocked ? '#006600' : '#FF6B00';
        } else if (slotId === 2) {
            const barracksLevel = getBuildingLevel("barracks");
            if (settings.scavSlot2Unlocked) {
                statusText = '✓ Unlocked';
                statusColor = '#006600';
            } else if (barracksLevel >= 3) {
                statusText = `○ Will unlock (Barracks lvl ${barracksLevel})`;
                statusColor = '#FF6B00';
            } else {
                statusText = `○ Needs Barracks lvl 3 (current: ${barracksLevel})`;
                statusColor = '#999';
            }
        } else if (slotId === 3) {
            checkboxHtml = `
                <label style="display: inline-flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="abScavSlot3Enabled" ${settings.scavSlot3Enabled ? 'checked' : ''} style="margin-right: 6px;">
                    <span>Enable auto-unlock</span>
                </label>
            `;
            if (settings.scavSlot3Unlocked) {
                statusText = '✓ Unlocked';
                statusColor = '#006600';
            } else if (settings.scavSlot3Enabled) {
                statusText = canAffordScavSlot(3) ? '⏳ Unlocking...' : '⏳ Waiting for resources...';
                statusColor = '#FF6B00';
            } else {
                statusText = '○ Disabled';
                statusColor = '#999';
            }
        } else if (slotId === 4) {
            checkboxHtml = `
                <label style="display: inline-flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="abScavSlot4Enabled" ${settings.scavSlot4Enabled ? 'checked' : ''} style="margin-right: 6px;">
                    <span>Enable auto-unlock</span>
                </label>
            `;
            if (settings.scavSlot4Unlocked) {
                statusText = '✓ Unlocked';
                statusColor = '#006600';
            } else if (settings.scavSlot4Enabled) {
                statusText = canAffordScavSlot(4) ? '⏳ Unlocking...' : '⏳ Waiting for resources...';
                statusColor = '#FF6B00';
            } else {
                statusText = '○ Disabled';
                statusColor = '#999';
            }
        }

        const rowBg = slotId % 2 === 0 ? '#DED3B9' : '#F4E4BC';
        slotRows += `
            <tr style="background: ${rowBg};">
                <td style="padding: 8px; border: 1px solid #7D510F; font-weight: bold;">Slot ${slotId}</td>
                <td style="padding: 8px; border: 1px solid #7D510F;">${slot.name}</td>
                <td style="padding: 8px; border: 1px solid #7D510F; text-align: center;">
                    <span class="icon header wood" style="margin-right: 3px;"></span>${slot.wood}
                    <span class="icon header stone" style="margin-left: 8px; margin-right: 3px;"></span>${slot.stone}
                    <span class="icon header iron" style="margin-left: 8px; margin-right: 3px;"></span>${slot.iron}
                </td>
                <td style="padding: 8px; border: 1px solid #7D510F; text-align: center;">${slot.duration}</td>
                <td style="padding: 8px; border: 1px solid #7D510F; text-align: center;">
                    ${checkboxHtml}
                    <span style="color: ${statusColor}; font-size: 11px; ${checkboxHtml ? 'display: block; margin-top: 5px;' : ''}">${statusText}</span>
                </td>
            </tr>
        `;
    }

    overlay.innerHTML = `
        <div style="
            background: #FFF8E8;
            border: 1px solid #7D510F;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            width: 750px;
            max-height: 80vh;
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
                Extra - Scavenger Slot Manager
            </div>
            <div style="padding: 15px; max-height: 65vh; overflow-y: auto;">
                <table class="vis" width="100%">
                    <tr style="background: #C1A264;">
                        <th style="padding: 5px; border: 1px solid #7D510F; width: 60px;">Slot</th>
                        <th style="padding: 5px; border: 1px solid #7D510F;">Name</th>
                        <th style="padding: 5px; border: 1px solid #7D510F; width: 180px;">Cost</th>
                        <th style="padding: 5px; border: 1px solid #7D510F; width: 70px;">Duration</th>
                        <th style="padding: 5px; border: 1px solid #7D510F; width: 180px;">Status</th>
                    </tr>
                    ${slotRows}
                </table>

                <div style="margin-top: 15px; padding: 10px; background: #FFF3CD; border: 1px solid #FFD700; border-radius: 3px;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; color: #000;">How it works:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #333;">
                        <li><b>Slot 1:</b> Auto-unlocks when script starts (costs very little)</li>
                        <li><b>Slot 2:</b> Auto-unlocks when Barracks reaches level 3</li>
                        <li><b>Slot 3 & 4:</b> Enable checkbox to unlock. <b>Building will pause</b> until resources are available!</li>
                    </ul>
                </div>

                <!-- PALADIN FEATURE DISABLED - NEEDS FIXING
                <table class="vis" width="100%" style="margin-top: 15px;">
                    <tr style="background: #C1A264;">
                        <th colspan="2" style="padding: 5px; border: 1px solid #7D510F; text-align: left;">Paladin Auto-Recruitment (DISABLED)</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td colspan="2" style="padding: 8px; border: 1px solid #7D510F; text-align: center;">
                            <span style="color: #FF6B00; font-size: 11px;">This feature is temporarily disabled and will be available in a future update.</span>
                        </td>
                    </tr>
                </table>
                -->
            </div>
            <div style="
                padding: 10px;
                background: #DED3B9;
                border-top: 1px solid #7D510F;
                text-align: right;
            ">
                <input type="button" id="abQuestFeaturesCloseBtn" value="Close" style="
                    background: #654321;
                    color: #fff;
                    border: 1px solid #4a3214;
                    padding: 5px 20px;
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

    // Close button
    document.getElementById("abQuestFeaturesCloseBtn").addEventListener("click", () => {
        overlay.remove();
    });

    // Slot 3 checkbox event
    const slot3Checkbox = document.getElementById("abScavSlot3Enabled");
    if (slot3Checkbox) {
        slot3Checkbox.addEventListener("change", () => {
            const settings = getSettings();
            settings.scavSlot3Enabled = slot3Checkbox.checked;
            saveSettings(settings);
            console.log("[Scavenger] Slot 3 auto-unlock:", slot3Checkbox.checked ? "enabled" : "disabled");

            if (slot3Checkbox.checked) {
                UI.InfoMessage("Slot 3 unlock enabled! Building will pause until unlocked.");
            } else {
                UI.InfoMessage("Slot 3 unlock disabled.");
                // Clear the paused state if we disable it
                isUnlockingScavSlot = false;
            }

            // Refresh the menu to show updated status
            overlay.remove();
            showQuestFeaturesMenu();
        });
    }

    // Slot 4 checkbox event
    const slot4Checkbox = document.getElementById("abScavSlot4Enabled");
    if (slot4Checkbox) {
        slot4Checkbox.addEventListener("change", () => {
            const settings = getSettings();
            settings.scavSlot4Enabled = slot4Checkbox.checked;
            saveSettings(settings);
            console.log("[Scavenger] Slot 4 auto-unlock:", slot4Checkbox.checked ? "enabled" : "disabled");

            if (slot4Checkbox.checked) {
                UI.InfoMessage("Slot 4 unlock enabled! Building will pause until unlocked.");
            } else {
                UI.InfoMessage("Slot 4 unlock disabled.");
                // Clear the paused state if we disable it
                isUnlockingScavSlot = false;
            }

            // Refresh the menu to show updated status
            overlay.remove();
            showQuestFeaturesMenu();
        });
    }

    // Paladin event listeners - DISABLED
    /*
    // Paladin auto-recruit checkbox event
    const paladinRecruitCheckbox = document.getElementById("abPaladinAutoRecruit");
    if (paladinRecruitCheckbox) {
        paladinRecruitCheckbox.addEventListener("change", () => {
            const settings = getSettings();
            settings.paladinAutoRecruit = paladinRecruitCheckbox.checked;
            saveSettings(settings);
            console.log("[Paladin] Auto-recruit:", paladinRecruitCheckbox.checked ? "enabled" : "disabled");

            // Restart paladin system to apply changes
            stopPaladinSystem();
            startPaladinSystem();

            if (paladinRecruitCheckbox.checked) {
                UI.InfoMessage("Paladin auto-recruit enabled! Will recruit when Statue is built.");
            } else {
                UI.InfoMessage("Paladin auto-recruit disabled.");
            }
        });
    }

    // Paladin auto-finish checkbox event
    const paladinFinishCheckbox = document.getElementById("abPaladinAutoFinish");
    if (paladinFinishCheckbox) {
        paladinFinishCheckbox.addEventListener("change", () => {
            const settings = getSettings();
            settings.paladinAutoFinish = paladinFinishCheckbox.checked;
            saveSettings(settings);
            console.log("[Paladin] Auto-finish:", paladinFinishCheckbox.checked ? "enabled" : "disabled");

            // Restart paladin system to apply changes
            stopPaladinSystem();
            startPaladinSystem();

            if (paladinFinishCheckbox.checked) {
                UI.InfoMessage("Paladin auto-finish enabled! Will finish training automatically.");
            } else {
                UI.InfoMessage("Paladin auto-finish disabled.");
            }
        });
    }

    // Paladin name input event
    const paladinNameInput = document.getElementById("abPaladinName");
    if (paladinNameInput) {
        paladinNameInput.addEventListener("blur", () => {
            const settings = getSettings();
            settings.paladinName = paladinNameInput.value.trim() || "Paul";
            saveSettings(settings);
            console.log("[Paladin] Name set to:", settings.paladinName);
        });
    }

    // Paladin reset button event
    const paladinResetBtn = document.getElementById("abPaladinReset");
    if (paladinResetBtn) {
        paladinResetBtn.addEventListener("click", () => {
            if (confirm("Reset paladin recruitment status? This will allow the script to recruit again.")) {
                const settings = getSettings();
                settings.paladinRecruited = false;
                settings.paladinCompleted = false;
                settings.paladinFinishTime = null;
                saveSettings(settings);

                console.log("[Paladin] Status reset - system will restart");
                UI.InfoMessage("Paladin status reset!");

                // Restart the paladin system
                stopPaladinSystem();
                startPaladinSystem();

                // Refresh menu
                overlay.remove();
                showQuestFeaturesMenu();
            }
        });
    }
    */

    console.log("[Extra] Menu opened");
}

function createExtraQuestButton() {
    // Find the questlog container div
    const questlogContainer = document.querySelector('div.questlog#questlog_new');
    if (!questlogContainer) {
        console.log("[Extra Button] Questlog container not found");
        return;
    }

    // Find the quest button inside the container
    const questDiv = questlogContainer.querySelector('div.quest#new_quest');
    if (!questDiv) {
        console.log("[Extra Button] Quest button not found in questlog");
        return;
    }

    // Create the Extra button (clone the quest button structure)
    const extraBtn = document.createElement("div");
    extraBtn.id = "extraQuestButton";
    extraBtn.className = "quest";

    // Match the exact HTML structure of the quest button
    extraBtn.innerHTML = `
        <div class="quest_new hu">Extra</div>
    `;

    // Add click event
    extraBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showQuestFeaturesMenu();
    });

    // Append the Extra button to the questlog container (after the quest button)
    questlogContainer.appendChild(extraBtn);
    console.log("[Extra Button] Created under quest button in questlog container");
}

function createScavButton() {
    // Find the questlog container div
    const questlogContainer = document.querySelector('div.questlog#questlog_new');
    if (!questlogContainer) {
        console.log("[Scav Button] Questlog container not found");
        return;
    }

    // Create the Scav button
    const scavBtn = document.createElement("div");
    scavBtn.id = "scavQuestButton";
    scavBtn.className = "quest";

    // Match the exact HTML structure of the quest button
    scavBtn.innerHTML = `
        <div class="quest_new hu">Scav</div>
    `;

    // Add click event
    scavBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScavMenu();
    });

    // Append the Scav button to the questlog container (after the Extra button)
    questlogContainer.appendChild(scavBtn);
    console.log("[Scav Button] Created under Extra button in questlog container");
}

function showScavMenu() {
    console.log("[Scav] Opening scavenger menu...");

    const settings = getSettings();
    const villageData = Norbi0nScavenger.getVillageData(game_data.village.id);

    // All available units
    const ALL_UNITS = [
        { id: 'spear', name: 'Spear' },
        { id: 'sword', name: 'Sword' },
        { id: 'axe', name: 'Axe' },
        { id: 'archer', name: 'Archer' },
        { id: 'spy', name: 'Spy' },
        { id: 'light', name: 'Light Cavalry' },
        { id: 'marcher', name: 'Mounted Archer' },
        { id: 'heavy', name: 'Heavy Cavalry' },
        { id: 'ram', name: 'Ram' },
        { id: 'catapult', name: 'Catapult' },
        { id: 'knight', name: 'Knight/Paladin' },
        { id: 'snob', name: 'Noble' }
    ];

    // Build compact unit grid (2 columns)
    let unitCheckboxes = '';
    for (let i = 0; i < ALL_UNITS.length; i += 2) {
        const unit1 = ALL_UNITS[i];
        const unit2 = ALL_UNITS[i + 1];
        const isExcluded1 = settings.scavExcludedUnits.includes(unit1.id);
        const isExcluded2 = unit2 ? settings.scavExcludedUnits.includes(unit2.id) : false;
        const rowBg = (i / 2) % 2 === 0 ? '#F4E4BC' : '#DED3B9';

        unitCheckboxes += `
            <tr style="background: ${rowBg};">
                <td style="padding: 4px 6px; border: 1px solid #7D510F; width: 50%;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" class="scavUnitCheckbox" data-unit="${unit1.id}" ${isExcluded1 ? 'checked' : ''} style="margin-right: 5px;">
                        <span class="unit-item unit-small ${unit1.id}" style="margin-right: 4px;"></span>
                        <span style="font-size: 11px;">${unit1.name}</span>
                    </label>
                </td>
                ${unit2 ? `
                <td style="padding: 4px 6px; border: 1px solid #7D510F; width: 50%;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" class="scavUnitCheckbox" data-unit="${unit2.id}" ${isExcluded2 ? 'checked' : ''} style="margin-right: 5px;">
                        <span class="unit-item unit-small ${unit2.id}" style="margin-right: 4px;"></span>
                        <span style="font-size: 11px;">${unit2.name}</span>
                    </label>
                </td>
                ` : '<td style="border: 1px solid #7D510F;"></td>'}
            </tr>
        `;
    }

    // Build compact slot checkboxes (2 columns)
    let slotCheckboxes = '';
    for (let slotId = 1; slotId <= 4; slotId += 2) {
        const slot1 = SCAVENGER_SLOTS[slotId];
        const slot2 = SCAVENGER_SLOTS[slotId + 1];
        const isExcluded1 = settings.scavExcludedSlots.includes(slotId);
        const isExcluded2 = slot2 ? settings.scavExcludedSlots.includes(slotId + 1) : false;
        const rowBg = ((slotId - 1) / 2) % 2 === 0 ? '#F4E4BC' : '#DED3B9';

        slotCheckboxes += `
            <tr style="background: ${rowBg};">
                <td style="padding: 4px 6px; border: 1px solid #7D510F; width: 50%;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" class="scavSlotCheckbox" data-slot="${slotId}" ${isExcluded1 ? 'checked' : ''} style="margin-right: 5px;">
                        <span style="font-size: 11px;"><b>Slot ${slotId}:</b> ${slot1.duration}</span>
                    </label>
                </td>
                ${slot2 ? `
                <td style="padding: 4px 6px; border: 1px solid #7D510F; width: 50%;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" class="scavSlotCheckbox" data-slot="${slotId + 1}" ${isExcluded2 ? 'checked' : ''} style="margin-right: 5px;">
                        <span style="font-size: 11px;"><b>Slot ${slotId + 1}:</b> ${slot2.duration}</span>
                    </label>
                </td>
                ` : ''}
            </tr>
        `;
    }

    // Status display
    let statusHtml = '';
    let statusColor = '#999';
    if (settings.scavAutoRunEnabled) {
        if (villageData && villageData.nextRunTime) {
            const serverTime = Norbi0nScavenger.getServerTime();
            const timeUntilNext = villageData.nextRunTime - serverTime;

            if (timeUntilNext > 0) {
                const hours = Math.floor(timeUntilNext / 3600);
                const minutes = Math.floor((timeUntilNext % 3600) / 60);
                statusHtml = `Running - Next: ${hours}h ${minutes}m`;
                statusColor = '#FF6B00';
            } else {
                statusHtml = 'Running - Ready to scavenge';
                statusColor = '#006600';
            }
        } else {
            statusHtml = 'Running - Waiting for first run';
            statusColor = '#006600';
        }
    } else {
        statusHtml = 'Stopped';
        statusColor = '#999';
    }

    const overlay = document.createElement("div");
    overlay.id = "abScavMenuOverlay";
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
            border: 2px solid #7D510F;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            width: 680px;
            max-height: 85vh;
            overflow: hidden;
            font-family: Verdana, Arial, sans-serif;
            font-size: 11px;
        ">
            <div style="
                background: #C1A264;
                color: #000;
                padding: 6px 12px;
                font-weight: bold;
                font-size: 12px;
                border-bottom: 2px solid #7D510F;
            ">
                Scavenger Auto-Run - Norbi0nScavenger v2.2
            </div>
            <div style="padding: 12px; max-height: 70vh; overflow-y: auto;">

                <!-- Status & Control -->
                <table class="vis" width="100%">
                    <tr style="background: #C1A264;">
                        <th style="padding: 4px; border: 1px solid #7D510F; text-align: left; font-size: 11px;">Status & Control</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td style="padding: 8px; border: 1px solid #7D510F;">
                            <div style="margin-bottom: 8px; font-size: 11px;">
                                <b>Status:</b> <span style="color: ${statusColor};">${statusHtml}</span>
                            </div>
                            <div style="text-align: center;">
                                <input type="button" id="scavStartBtn" value="Start Auto-Run" class="btn" style="
                                    background: linear-gradient(to bottom, #5a9a5a 0%, #4a8a4a 100%);
                                    color: #fff;
                                    border: 1px solid #3a7a3a;
                                    padding: 5px 18px;
                                    font-size: 11px;
                                    font-weight: bold;
                                    cursor: pointer;
                                    margin-right: 6px;
                                    border-radius: 2px;
                                    ${settings.scavAutoRunEnabled ? 'display: none;' : ''}
                                ">
                                <input type="button" id="scavStopBtn" value="Stop Auto-Run" class="btn" style="
                                    background: linear-gradient(to bottom, #D15757 0%, #C14747 100%);
                                    color: #fff;
                                    border: 1px solid #a03737;
                                    padding: 5px 18px;
                                    font-size: 11px;
                                    font-weight: bold;
                                    cursor: pointer;
                                    margin-right: 6px;
                                    border-radius: 2px;
                                    ${settings.scavAutoRunEnabled ? '' : 'display: none;'}
                                ">
                                <input type="button" id="scavRunNowBtn" value="Run Once Now" class="btn" style="
                                    background: linear-gradient(to bottom, #755331 0%, #654321 100%);
                                    color: #fff;
                                    border: 1px solid #4a3214;
                                    padding: 5px 18px;
                                    font-size: 11px;
                                    font-weight: bold;
                                    cursor: pointer;
                                    border-radius: 2px;
                                ">
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Max Duration -->
                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th style="padding: 4px; border: 1px solid #7D510F; text-align: left; font-size: 11px;">Maximum Scavenge Duration</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td style="padding: 6px 8px; border: 1px solid #7D510F;">
                            <label style="margin-right: 8px; font-size: 11px;"><b>Max duration:</b></label>
                            <select id="scavMaxDuration" style="
                                padding: 3px 6px;
                                border: 1px solid #7D510F;
                                background: #FFF8E8;
                                font-size: 11px;
                                font-family: Verdana, Arial, sans-serif;
                            ">
                                <option value="1800" ${settings.scavMaxDuration === 1800 ? 'selected' : ''}>30 minutes</option>
                                <option value="3600" ${settings.scavMaxDuration === 3600 ? 'selected' : ''}>1 hour</option>
                                <option value="5400" ${settings.scavMaxDuration === 5400 ? 'selected' : ''}>1.5 hours</option>
                                <option value="7200" ${settings.scavMaxDuration === 7200 ? 'selected' : ''}>2 hours (default)</option>
                                <option value="10800" ${settings.scavMaxDuration === 10800 ? 'selected' : ''}>3 hours</option>
                                <option value="14400" ${settings.scavMaxDuration === 14400 ? 'selected' : ''}>4 hours</option>
                            </select>
                            <span style="margin-left: 8px; color: #666; font-size: 10px;">(longer = more loot)</span>
                        </td>
                    </tr>
                </table>

                <!-- Units to Leave Home -->
                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th style="padding: 4px; border: 1px solid #7D510F; text-align: left; font-size: 11px;">
                            Units to Leave Home (checked = excluded)
                        </th>
                    </tr>
                </table>
                <div style="max-height: 160px; overflow-y: auto; border: 1px solid #7D510F; border-top: none;">
                    <table class="vis" width="100%" style="margin: 0;">
                        ${unitCheckboxes}
                    </table>
                </div>

                <!-- Slot Exclusions -->
                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th style="padding: 4px; border: 1px solid #7D510F; text-align: left; font-size: 11px;">
                            Slots to Exclude (checked = skip)
                        </th>
                    </tr>
                </table>
                <div style="border: 1px solid #7D510F; border-top: none;">
                    <table class="vis" width="100%" style="margin: 0;">
                        ${slotCheckboxes}
                    </table>
                </div>

                <!-- Pause Hours -->
                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th style="padding: 4px; border: 1px solid #7D510F; text-align: left; font-size: 11px;">Pause During Specific Hours</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td style="padding: 6px 8px; border: 1px solid #7D510F;">
                            <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 6px;">
                                <input type="checkbox" id="scavPauseEnabled" ${settings.scavPauseEnabled ? 'checked' : ''} style="margin-right: 6px;">
                                <span style="font-size: 11px;"><b>Enable pause between hours</b></span>
                            </label>
                            <div style="margin-left: 20px; font-size: 11px;">
                                <label style="margin-right: 12px;">
                                    From: <input type="time" id="scavPauseStart" value="${settings.scavPauseStart}" style="
                                        padding: 2px 4px;
                                        border: 1px solid #7D510F;
                                        background: #FFFFFF;
                                        font-size: 11px;
                                        font-family: Verdana, Arial, sans-serif;
                                    ">
                                </label>
                                <label>
                                    To: <input type="time" id="scavPauseEnd" value="${settings.scavPauseEnd}" style="
                                        padding: 2px 4px;
                                        border: 1px solid #7D510F;
                                        background: #FFFFFF;
                                        font-size: 11px;
                                        font-family: Verdana, Arial, sans-serif;
                                    ">
                                </label>
                                <span style="margin-left: 8px; color: #666; font-size: 10px;">(e.g., 00:00 to 06:00)</span>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Stop on Attack -->
                <table class="vis" width="100%" style="margin-top: 10px;">
                    <tr style="background: #C1A264;">
                        <th style="padding: 4px; border: 1px solid #7D510F; text-align: left; font-size: 11px;">Attack Detection</th>
                    </tr>
                    <tr style="background: #F4E4BC;">
                        <td style="padding: 6px 8px; border: 1px solid #7D510F;">
                            <label style="display: inline-flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="scavStopOnAttack" ${settings.scavStopOnAttack ? 'checked' : ''} style="margin-right: 6px;">
                                <span style="font-size: 11px;"><b>Stop scavenging when incoming attack detected</b></span>
                            </label>
                            <div style="margin-left: 20px; margin-top: 4px; color: #666; font-size: 10px;">
                                (Attack detection will be implemented later)
                            </div>
                        </td>
                    </tr>
                </table>

            </div>
            <div style="
                padding: 8px;
                background: #DED3B9;
                border-top: 2px solid #7D510F;
                text-align: right;
            ">
                <input type="button" id="scavSaveBtn" value="Save Settings" class="btn" style="
                    background: linear-gradient(to bottom, #5a9a5a 0%, #4a8a4a 100%);
                    color: #fff;
                    border: 1px solid #3a7a3a;
                    padding: 5px 16px;
                    font-size: 11px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-right: 6px;
                    border-radius: 2px;
                ">
                <input type="button" id="abScavMenuCloseBtn" value="Close" class="btn" style="
                    background: linear-gradient(to bottom, #755331 0%, #654321 100%);
                    color: #fff;
                    border: 1px solid #4a3214;
                    padding: 5px 16px;
                    font-size: 11px;
                    font-weight: bold;
                    cursor: pointer;
                    border-radius: 2px;
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

    // Close button
    document.getElementById("abScavMenuCloseBtn").addEventListener("click", () => {
        overlay.remove();
    });

    // Save button - collect all settings and save
    document.getElementById("scavSaveBtn").addEventListener("click", () => {
        const settings = getSettings();

        // Collect excluded units
        const excludedUnits = [];
        document.querySelectorAll('.scavUnitCheckbox:checked').forEach(cb => {
            excludedUnits.push(cb.dataset.unit);
        });

        // Collect excluded slots
        const excludedSlots = [];
        document.querySelectorAll('.scavSlotCheckbox:checked').forEach(cb => {
            excludedSlots.push(parseInt(cb.dataset.slot));
        });

        // Update settings
        settings.scavExcludedUnits = excludedUnits;
        settings.scavExcludedSlots = excludedSlots;
        settings.scavMaxDuration = parseInt(document.getElementById("scavMaxDuration").value);
        settings.scavPauseEnabled = document.getElementById("scavPauseEnabled").checked;
        settings.scavPauseStart = document.getElementById("scavPauseStart").value;
        settings.scavPauseEnd = document.getElementById("scavPauseEnd").value;
        settings.scavStopOnAttack = document.getElementById("scavStopOnAttack").checked;

        saveSettings(settings);

        // Also update Norbi0nScavenger settings
        Norbi0nScavenger.updateSettings({
            excludedUnits: excludedUnits,
            excludedSlots: excludedSlots,
            maxDurationSeconds: settings.scavMaxDuration
        });

        UI.SuccessMessage("Scavenger settings saved!");
        console.log("[Scav] Settings saved:", settings);
    });

    // Start button
    document.getElementById("scavStartBtn").addEventListener("click", () => {
        const settings = getSettings();
        settings.scavAutoRunEnabled = true;
        saveSettings(settings);

        startScavSystem();
        UI.SuccessMessage("Scavenger auto-run started!");
        overlay.remove();
    });

    // Stop button
    document.getElementById("scavStopBtn").addEventListener("click", () => {
        const settings = getSettings();
        settings.scavAutoRunEnabled = false;
        saveSettings(settings);

        stopScavSystem();
        UI.InfoMessage("Scavenger auto-run stopped!");
        overlay.remove();
    });

    // Run Now button
    document.getElementById("scavRunNowBtn").addEventListener("click", async () => {
        UI.InfoMessage("Running scavenger once...");

        const settings = getSettings();
        const result = await Norbi0nScavenger.run({
            excludedUnits: settings.scavExcludedUnits,
            excludedSlots: settings.scavExcludedSlots,
            maxDurationSeconds: settings.scavMaxDuration,
            villageId: game_data.village.id
        });

        if (result.success && result.sent > 0) {
            UI.SuccessMessage(`Sent ${result.sent} squad(s)! Next: ${result.nextRunDate}`);
        } else if (result.message) {
            UI.InfoMessage(result.message);
        }

        console.log("[Scav] Manual run result:", result);
    });

    console.log("[Scav] Menu opened");
}

// ============ SCAVENGER SYSTEM CONTROL ============
let scavCheckInterval = null;

function isInPauseWindow() {
    const settings = getSettings();
    if (!settings.scavPauseEnabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Compare times as strings (HH:MM format)
    return currentTime >= settings.scavPauseStart && currentTime < settings.scavPauseEnd;
}

function hasIncomingAttack() {
    // TODO: Implement attack detection
    // This will check if there are any incoming attacks
    // For now, always return false
    return false;
}

async function checkAndRunScavenger() {
    const settings = getSettings();

    // Check if auto-run is enabled
    if (!settings.scavAutoRunEnabled) {
        return;
    }

    // Check if in pause window
    if (isInPauseWindow()) {
        console.log("[Scav] In pause window, skipping...");
        return;
    }

    // Check if incoming attack
    if (settings.scavStopOnAttack && hasIncomingAttack()) {
        console.log("[Scav] Incoming attack detected, stopping auto-run!");
        settings.scavAutoRunEnabled = false;
        saveSettings(settings);
        stopScavSystem();
        UI.ErrorMessage("Scavenger stopped - incoming attack!");
        return;
    }

    // Check if it's time to run
    const villageData = Norbi0nScavenger.getVillageData(game_data.village.id);
    const serverTime = Norbi0nScavenger.getServerTime();

    const needsToRun = !villageData || !villageData.nextRunTime || serverTime >= villageData.nextRunTime;

    if (needsToRun) {
        console.log("[Scav] Time to run! Opening scavenge page in new tab...");

        // Open scavenge page in new tab
        const scavengeUrl = `/game.php?village=${game_data.village.id}&screen=place&mode=scavenge`;
        const scavTab = window.open(scavengeUrl, '_blank');

        console.log("[Scav] Scavenge tab opened, will be processed automatically");
    } else {
        // Not time yet
        const timeUntil = villageData.nextRunTime - serverTime;
        const minutes = Math.floor(timeUntil / 60);
        console.log(`[Scav] Next run in ${minutes} minutes`);
    }
}

// This runs when script loads on the scavenge page (in the new tab)
async function executeScavengerOnPage() {
    console.log("[Scav] ===========================================");
    console.log("[Scav] Scavenger execution started in new tab!");
    console.log("[Scav] ===========================================");

    // Wait for game_data to be available
    console.log("[Scav] Waiting for game_data...");
    let gameDataAttempts = 0;
    while (typeof game_data === 'undefined' && gameDataAttempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 250));
        gameDataAttempts++;
    }

    if (typeof game_data === 'undefined') {
        console.error("[Scav] ERROR: game_data not available!");
        window.close();
        return;
    }

    console.log("[Scav] ✓ game_data available");

    // Wait for ScavengeScreen to be available (max 10 seconds)
    console.log("[Scav] Waiting for ScavengeScreen API...");
    let attempts = 0;
    while (typeof ScavengeScreen === 'undefined' && attempts < 40) {
        await new Promise(resolve => setTimeout(resolve, 250));
        attempts++;
        if (attempts % 4 === 0) {
            console.log(`[Scav] Still waiting... (${attempts}/40)`);
        }
    }

    if (typeof ScavengeScreen === 'undefined') {
        console.error("[Scav] ERROR: ScavengeScreen not loaded!");
        window.close();
        return;
    }

    console.log("[Scav] ✓ ScavengeScreen API loaded");

    // Detect already unlocked slots FIRST (before running scavenger)
    console.log("[Scav] Detecting unlocked slots...");
    detectUnlockedSlots();

    // Wait for Norbi0nScavenger module
    console.log("[Scav] Waiting for Norbi0nScavenger module...");
    let modAttempts = 0;
    while (typeof Norbi0nScavenger === 'undefined' && modAttempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 250));
        modAttempts++;
    }

    if (typeof Norbi0nScavenger === 'undefined') {
        console.error("[Scav] ERROR: Norbi0nScavenger module not available!");
        window.close();
        return;
    }

    console.log("[Scav] ✓ Norbi0nScavenger module loaded");

    // Get settings from localStorage (shared between tabs)
    const settings = getSettings();
    console.log("[Scav] Settings:", {
        excludedUnits: settings.scavExcludedUnits,
        excludedSlots: settings.scavExcludedSlots,
        maxDuration: settings.scavMaxDuration
    });

    // Run the scavenger!
    console.log("[Scav] Starting Norbi0nScavenger.run()...");

    try {
        const result = await Norbi0nScavenger.run({
            excludedUnits: settings.scavExcludedUnits,
            excludedSlots: settings.scavExcludedSlots,
            maxDurationSeconds: settings.scavMaxDuration,
            villageId: game_data.village.id
        });

        console.log("[Scav] ===========================================");
        console.log("[Scav] Norbi0nScavenger.run() COMPLETED!");
        console.log("[Scav] Result:", result);
        console.log("[Scav] ===========================================");

        if (result.success && result.sent > 0) {
            console.log(`[Scav] ✓ SUCCESS! Sent ${result.sent} squad(s)!`);
            console.log(`[Scav] Next run: ${result.nextRunDate}`);
        } else {
            console.log(`[Scav] ${result.message || 'No squads sent'}`);
        }
    } catch (error) {
        console.error("[Scav] ERROR during execution:", error);
        console.error("[Scav] Stack:", error.stack);
    }

    // Wait 10 seconds then close the tab
    console.log("[Scav] Waiting 10 seconds before closing tab...");
    setTimeout(() => {
        console.log("[Scav] Closing scavenge tab now!");
        window.close();
    }, 10000);
}

function startScavSystem() {
    const settings = getSettings();

    // Clear existing interval if any
    if (scavCheckInterval) {
        clearInterval(scavCheckInterval);
    }

    // Check every 30 seconds
    scavCheckInterval = setInterval(() => {
        checkAndRunScavenger();
    }, 30000);

    // Run immediately
    setTimeout(() => {
        checkAndRunScavenger();
    }, 2000);

    console.log("[Scav] Auto-run system started (checks every 30s)");
}

function stopScavSystem() {
    if (scavCheckInterval) {
        clearInterval(scavCheckInterval);
        scavCheckInterval = null;
        console.log("[Scav] Auto-run system stopped");
    }
}

// ============ NORBI0NSCAVENGER MODULE ============
/**
 * Norbi0nScavenger v2.2 - Complete Scavenging Automation
 * Embedded from Scav_module.md - EXACT WORKING VERSION
 */
const Norbi0nScavenger = (function() {

    const STORAGE_KEYS = {
        settings: 'Norbi0nScavengerSettings',
        data: 'Norbi0nScavengerData'
    };

    const DEFAULTS = {
        excludedUnits: ['spy', 'ram', 'catapult', 'snob', 'knight'],
        excludedSlots: [],
        maxDurationSeconds: 7200,
        minDelay: 500,
        maxDelay: 2000
    };

    const UNIT_CARRY = {
        spear: 25, sword: 15, axe: 10, archer: 10, spy: 0,
        light: 80, marcher: 50, heavy: 50, ram: 0, catapult: 0,
        knight: 100, snob: 0
    };

    const DURATION = { exponent: 0.45, initial: 1800, factor: 0.7722074896557402 };
    const LOOT_FACTORS = { 1: 0.10, 2: 0.25, 3: 0.50, 4: 0.75 };

    // ============ SERVER TIME ============
    function getServerTime() {
        if (typeof Timing !== 'undefined' && Timing.getCurrentServerTime) {
            return Math.floor(Timing.getCurrentServerTime() / 1000);
        }
        return Math.floor(Date.now() / 1000);
    }

    // ============ SETTINGS MANAGEMENT ============
    function loadSettings() {
        try {
            const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}');
            return {
                excludedUnits: s.excludedUnits || DEFAULTS.excludedUnits,
                excludedSlots: s.excludedSlots || DEFAULTS.excludedSlots,
                maxDurationSeconds: s.maxDurationSeconds || DEFAULTS.maxDurationSeconds
            };
        } catch (e) {
            return { ...DEFAULTS };
        }
    }

    function saveSettings(s) {
        const toSave = {
            excludedUnits: s.excludedUnits || DEFAULTS.excludedUnits,
            excludedSlots: s.excludedSlots || DEFAULTS.excludedSlots,
            maxDurationSeconds: s.maxDurationSeconds || DEFAULTS.maxDurationSeconds,
            updatedAt: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(toSave));
        console.log('[Norbi0nScavenger] Settings saved');
        return toSave;
    }

    function getSettings() {
        return loadSettings();
    }

    function updateSettings(newSettings) {
        const current = loadSettings();
        const merged = {
            excludedUnits: newSettings.excludedUnits !== undefined ? newSettings.excludedUnits : current.excludedUnits,
            excludedSlots: newSettings.excludedSlots !== undefined ? newSettings.excludedSlots : current.excludedSlots,
            maxDurationSeconds: newSettings.maxDurationSeconds !== undefined ? newSettings.maxDurationSeconds : current.maxDurationSeconds
        };
        return saveSettings(merged);
    }

    // ============ DATA MANAGEMENT ============
    function saveVillageData(villageId, data) {
        try {
            const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.data) || '{}');
            all[villageId] = { ...data, savedAt: Date.now() };
            localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(all));
            console.log(`[Norbi0nScavenger] Village ${villageId} data saved`);
        } catch (e) {
            console.error('[Norbi0nScavenger] Error saving village data:', e);
        }
    }

    function getVillageData(villageId) {
        try {
            const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.data) || '{}');
            return villageId ? all[villageId] : all;
        } catch (e) {
            return villageId ? null : {};
        }
    }

    // ============ HELPERS ============
    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function randomDelay() {
        return DEFAULTS.minDelay + Math.random() * (DEFAULTS.maxDelay - DEFAULTS.minDelay);
    }

    function calcDuration(carry, optId) {
        const lf = LOOT_FACTORS[optId];
        return Math.round((Math.pow(carry * 100 * lf * carry * lf, DURATION.exponent) + DURATION.initial) * DURATION.factor);
    }

    function calcCarry(troops, excluded) {
        let total = 0;
        for (let u in troops) {
            if (UNIT_CARRY[u] && !excluded.includes(u)) {
                total += (troops[u] || 0) * UNIT_CARRY[u];
            }
        }
        return total;
    }

    function calcCarryForDuration(targetSeconds, optId) {
        let lo = 0, hi = 1000000;
        while (hi - lo > 1) {
            const mid = Math.floor((lo + hi) / 2);
            if (calcDuration(mid, optId) <= targetSeconds) lo = mid;
            else hi = mid;
        }
        return lo;
    }

    function distribute(available, targetCarry, excluded) {
        const dist = { light: 0, knight: 0, heavy: 0, marcher: 0, spear: 0, sword: 0, axe: 0, archer: 0 };
        let remaining = targetCarry;

        for (let u of ['light', 'knight', 'heavy', 'marcher', 'spear', 'sword', 'axe', 'archer']) {
            if (excluded.includes(u) || !available[u] || UNIT_CARRY[u] <= 0) continue;
            const toUse = Math.min(Math.ceil(remaining / UNIT_CARRY[u]), available[u]);
            dist[u] = toUse;
            remaining -= toUse * UNIT_CARRY[u];
            if (remaining <= 0) break;
        }
        return dist;
    }

    function fillInputs(troops) {
        document.querySelectorAll('.unitsInput').forEach(input => {
            input.value = troops[input.name] || '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    function clearInputs() {
        document.querySelectorAll('.unitsInput').forEach(input => {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    function clickSend(optionId) {
        const options = document.querySelectorAll('.scavenge-option');
        const btn = options[optionId - 1]?.querySelector('.free_send_button');
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    }

    function isOnScavengePage() {
        return typeof ScavengeScreen !== 'undefined' && location.href.includes('mode=scavenge');
    }

    function navigateTo(villageId) {
        const vid = villageId || (typeof game_data !== 'undefined' ? game_data.village.id : null);
        if (!vid) throw new Error('No village ID');
        window.location.href = `/game.php?village=${vid}&screen=place&mode=scavenge`;
    }

    // ============ MAIN RUN FUNCTION ============
    async function run(opts = {}) {
        // Load and apply settings
        let settings = loadSettings();

        if (opts.excludedUnits !== undefined) settings.excludedUnits = opts.excludedUnits;
        if (opts.excludedSlots !== undefined) settings.excludedSlots = opts.excludedSlots;
        if (opts.maxDurationSeconds !== undefined) settings.maxDurationSeconds = opts.maxDurationSeconds;

        // Save settings (always, so they persist)
        if (opts.saveSettingsToStorage !== false) {
            saveSettings(settings);
        }

        // Check if on scavenge page
        if (!isOnScavengePage()) {
            console.log('[Norbi0nScavenger] Not on scavenge page, navigating...');
            navigateTo(opts.villageId);
            return { success: false, message: 'Navigating to scavenge page...' };
        }

        const villageId = ScavengeScreen.village.village_id;
        const { excludedUnits, excludedSlots, maxDurationSeconds } = settings;
        const serverTime = getServerTime();

        console.log('========================================');
        console.log('[Norbi0nScavenger] Starting');
        console.log(`  Village: ${villageId}`);
        console.log(`  Server time: ${new Date(serverTime * 1000).toLocaleString()}`);
        console.log(`  Max duration: ${maxDurationSeconds}s (${(maxDurationSeconds/3600).toFixed(1)}h)`);
        console.log(`  Excluded units: ${excludedUnits.join(', ')}`);
        console.log(`  Excluded slots: ${excludedSlots.length ? excludedSlots.join(', ') : 'None'}`);
        console.log('========================================');

        // Get available troops
        const troops = { ...ScavengeScreen.village.unit_counts_home };
        for (let u of excludedUnits) troops[u] = 0;

        console.log('[Norbi0nScavenger] Available troops (after exclusions):', troops);

        // Get free slots
        const freeSlots = [];
        for (let k in ScavengeScreen.village.options) {
            const opt = ScavengeScreen.village.options[k];
            const slotId = parseInt(k);

            if (!opt.is_locked && !opt.scavenging_squad && !excludedSlots.includes(slotId)) {
                freeSlots.push(slotId);
            }
        }
        freeSlots.sort((a, b) => b - a); // Highest first

        console.log(`[Norbi0nScavenger] Free slots: ${freeSlots.join(', ') || 'None'}`);

        // If no free slots, return existing data WITHOUT overwriting
        if (freeSlots.length === 0) {
            console.log('[Norbi0nScavenger] No free slots - keeping existing return times');
            const existingData = getVillageData(villageId);
            return {
                success: true,
                sent: 0,
                message: 'No free slots available',
                nextRunTime: existingData?.nextRunTime || null,
                nextRunDate: existingData?.nextRunDate || null,
                existingData: existingData
            };
        }

        // ========================================================
        // MODIFIED ALGORITHM: EQUAL RETURN TIMES FOR ALL SLOTS
        // ========================================================
        // Strategy:
        // 1. Calculate total available carry capacity
        // 2. Find a target duration that ALL slots can achieve
        // 3. Calculate exact carry needed per slot for that duration
        // 4. Send troops to match those exact carries
        // Result: ALL slots return at the SAME time
        // ========================================================

        let available = { ...troops };
        const results = [];
        const returnTimes = [];

        // Step 1: Calculate total available carry
        const totalCarry = calcCarry(available, excludedUnits);
        console.log(`[Norbi0nScavenger] Total available carry: ${totalCarry}`);

        if (totalCarry <= 0) {
            console.log('[Norbi0nScavenger] No troops available');
            return { success: true, sent: 0, message: 'No troops available' };
        }

        // Step 2: Find the target duration that ALL slots can achieve
        // We need to find a duration where the sum of required carries <= total available
        let targetDuration = maxDurationSeconds;
        let iterations = 0;

        while (targetDuration > 60 && iterations < 100) {
            // Calculate required carry for each slot at this duration
            let totalRequiredCarry = 0;
            for (const slotId of freeSlots) {
                totalRequiredCarry += calcCarryForDuration(targetDuration, slotId);
            }

            // If we have enough troops, use this duration
            if (totalRequiredCarry <= totalCarry) {
                break;
            }

            // Otherwise, reduce target duration by 10%
            targetDuration = Math.floor(targetDuration * 0.9);
            iterations++;
        }

        console.log(`[Norbi0nScavenger] Target duration for equal return: ${Math.floor(targetDuration/60)}m ${targetDuration%60}s`);

        // Step 3: Send troops for each slot with exact carry for target duration
        for (let i = 0; i < freeSlots.length; i++) {
            const slotId = freeSlots[i];

            // Calculate exact carry needed for this slot to return at target duration
            const targetCarry = calcCarryForDuration(targetDuration, slotId);

            console.log(`[Norbi0nScavenger] Slot ${slotId}: Target carry = ${targetCarry}`);

            // Distribute troops to match target carry
            const troopsToSend = distribute(available, targetCarry, excludedUnits);
            const actualCarry = calcCarry(troopsToSend, []);

            if (actualCarry <= 0) {
                console.log(`[Norbi0nScavenger] Slot ${slotId}: No troops to send, skipping`);
                continue;
            }

            // Calculate actual duration (should be very close to targetDuration)
            const duration = calcDuration(actualCarry, slotId);
            const returnTime = serverTime + duration;

            console.log(`[Norbi0nScavenger] Slot ${slotId}:`);
            console.log(`  - Carry: ${actualCarry} (target: ${targetCarry})`);
            console.log(`  - Duration: ${Math.floor(duration/60)}m ${duration%60}s`);
            console.log(`  - Returns: ${new Date(returnTime * 1000).toLocaleString()}`);

            // Fill inputs
            fillInputs(troopsToSend);
            await sleep(300);

            // Click send
            if (clickSend(slotId)) {
                console.log(`  ✓ SENT`);

                results.push({
                    slotId,
                    troops: troopsToSend,
                    carry: actualCarry,
                    duration,
                    returnTime,
                    returnDate: new Date(returnTime * 1000).toLocaleString(),
                    success: true
                });

                returnTimes.push(returnTime);

                // Subtract used troops
                for (let u in troopsToSend) {
                    available[u] = (available[u] || 0) - troopsToSend[u];
                }

                clearInputs();

                // Random delay before next
                if (i < freeSlots.length - 1) {
                    const delay = randomDelay();
                    console.log(`  Waiting ${Math.round(delay)}ms...`);
                    await sleep(delay);
                }
            } else {
                console.log(`  ✗ FAILED - Button not found`);
                results.push({ slotId, success: false, error: 'Button not found' });
            }
        }

        // Calculate next run time (highest return = when ALL squads back)
        const successfulResults = results.filter(r => r.success);

        // FIXED: Only save if we actually sent squads
        if (successfulResults.length > 0) {
            const nextRunTime = Math.max(...returnTimes);
            const nextRunDate = new Date(nextRunTime * 1000).toLocaleString();

            // Save village data
            saveVillageData(villageId, {
                villageId,
                results: successfulResults,
                returnTimes,
                nextRunTime,
                nextRunDate,
                serverTimeAtSend: serverTime,
                sentAt: new Date(serverTime * 1000).toLocaleString()
            });

            console.log('========================================');
            console.log(`[Norbi0nScavenger] COMPLETE!`);
            console.log(`  Sent: ${successfulResults.length} squads`);
            console.log(`  Next run: ${nextRunDate}`);
            console.log('========================================');

            return {
                success: true,
                sent: successfulResults.length,
                results: successfulResults,
                returnTimes,
                nextRunTime,
                nextRunDate
            };
        } else {
            // No squads sent successfully - keep existing data
            console.log('[Norbi0nScavenger] No squads sent - keeping existing return times');
            const existingData = getVillageData(villageId);

            return {
                success: true,
                sent: 0,
                message: 'No squads sent (no troops or button issues)',
                nextRunTime: existingData?.nextRunTime || null,
                nextRunDate: existingData?.nextRunDate || null
            };
        }
    }

    // ============ PUBLIC API ============
    return {
        // Main function
        run,

        // Settings
        getSettings,
        updateSettings,

        // Data
        getVillageData,

        // Navigation
        isOnScavengePage,
        navigateToScavengePage: navigateTo,

        // Utilities
        getServerTime,

        // Constants
        DEFAULTS,
        UNIT_CARRY,
        LOOT_FACTORS
    };

})();

// Make globally available
window.Norbi0nScavenger = Norbi0nScavenger;
console.log('[Auto Builder] Norbi0nScavenger v2.2 embedded and ready');

// ============ INIT ============
function init() {
    // Check if we're on the daily bonus page
    if (isOnDailyBonusPage()) {
        console.log("[Auto Builder] On daily bonus page");
        initDailyRewardOnBonusPage();
        return; // Don't initialize the full widget on this page
    }

    // Check if we're on the scavenge page
    const isOnScavengePage = window.location.href.includes('screen=place') && window.location.href.includes('mode=scavenge');
    console.log("[Auto Builder] Scavenge page check:", {
        url: window.location.href,
        isScavengePage: isOnScavengePage
    });

    if (isOnScavengePage) {
        console.log("[Auto Builder] ✓ ON SCAVENGE PAGE - Will execute scavenger in 1 second...");
        // Wait a bit for page to fully load, then execute
        setTimeout(() => {
            console.log("[Auto Builder] Timeout fired! Calling executeScavengerOnPage()...");
            executeScavengerOnPage();
        }, 1000);
        return; // Don't initialize the full widget on this page
    }

    // Only initialize full widget on main page
    if (!isOnMainPage()) {
        console.log("[Auto Builder] Not on main page, skipping initialization");
        return;
    }

    // Install default template if not exists
    installDefaultTemplate();

    createWidget();
    updateUI();

    // Create Extra button next to quest button
    createExtraQuestButton();

    // Create Scav button next to Extra button
    createScavButton();

    // Setup visibility change listener for Wake Lock re-acquisition
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Auto-resume if was running
    const state = getVillageState();
    if (state.isRunning && state.activeTemplateId) {
        console.log("Auto-resuming template...");
        scriptInterval = setInterval(processQueue, 1000);
        // Re-acquire Wake Lock when auto-resuming
        acquireWakeLock();
    }

    // Start quest systems
    startQuestSystems();

    // Start paladin system (runs independently of builder) - DISABLED
    // startPaladinSystem();

    // Start scavenger auto-run system if enabled
    const settings = getSettings();
    if (settings.scavAutoRunEnabled) {
        console.log("[Auto Builder] Auto-resuming scavenger system...");
        startScavSystem();
    }

    // Check for daily reward collection
    checkAndCollectDailyReward();

    // Auto-unlock scavenger Slot 1 (if not already unlocked)
    setTimeout(() => {
        checkAndUnlockSlot1();
    }, 5000); // Wait 5 seconds after page load
}

// Start when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
