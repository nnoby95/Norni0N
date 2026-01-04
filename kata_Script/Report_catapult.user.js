// ==UserScript==
// @name         Report Catapult Auto-Attack
// @namespace    made by Norbi
// @description  Automated catapult/ram attacks from spy reports with worker tab
// @author       Norbi
// @version      1.1.0
// @include      https://*/game.php?village=*&screen=report*
// @include      https://*/game.php?village=*&screen=place*
// @include      https://*/game.php?village=*&screen=overview*
// @include      https://*/game.php?*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        // Target levels - attack if building is above these
        wallTargetLevel: 0,
        buildingTargetLevel: 1,

        // Building priority for catapult targeting (wall->barracks->main)
        buildingPriority: ['barracks', 'main', 'stable', 'garage', 'wall', 'smith', 'market'],

        // Maximum levels - target buildings above these levels
        // Main stays at 1, everything else goes to 0
        maxLevels: {
            main: 1,
            barracks: 0,
            stable: 0,
            garage: 0,
            wall: 0,
            smith: 20,
            market: 20
        },

        // Catapult escort troops (for building attacks)
        catapultEscort: {
            axe: 10,
            spy: 1
        },

        // Wall templates by wall level (includes ram count + escort)
        // Ram values are from official table, but can be customized
        // Uses highest defined level <= current wall level
        wallTemplates: {
            1: { ram: 2, axe: 5, spy: 1 },
            2: { ram: 4, axe: 10, spy: 1 },
            3: { ram: 7, axe: 15, spy: 1 },
            4: { ram: 10, axe: 20, spy: 1 },
            5: { ram: 14, axe: 25, spy: 1 },
            6: { ram: 19, axe: 30, spy: 1 },
            7: { ram: 24, axe: 35, spy: 1 },
            8: { ram: 30, axe: 40, spy: 1 },
            9: { ram: 37, axe: 45, spy: 1 },
            10: { ram: 45, axe: 50, spy: 1 },
            11: { ram: 55, axe: 60, spy: 1 },
            12: { ram: 65, axe: 70, spy: 1 },
            13: { ram: 77, axe: 80, spy: 1 },
            14: { ram: 91, axe: 90, spy: 1 },
            15: { ram: 106, axe: 100, spy: 1 },
            16: { ram: 124, axe: 120, spy: 1 },
            17: { ram: 143, axe: 140, spy: 1 },
            18: { ram: 166, axe: 160, spy: 1 },
            19: { ram: 191, axe: 180, spy: 1 },
            20: { ram: 219, axe: 200, spy: 1 }
        },

        // Rate limiting (ms)
        actionDelayMin: 500,
        actionDelayMax: 700,
        reportDelayMin: 800,
        reportDelayMax: 1200,

        // Auto settings
        autoAdvanceReport: true,
        autoAttack: false,
        debug: true,

        // Spirit mode: Send all building attacks in one batch (wall → barracks → main → others)
        // Default mode: Send one building type per report
        spiritMode: false
    };

    // Building name translations (Hungarian/English/German)
    const BUILDING_I18N = {
        'main': ['Főhadiszállás', 'Headquarters', 'Rathaus', 'Main'],
        'barracks': ['Barakk', 'Barracks', 'Kaserne'],
        'stable': ['Istálló', 'Stable', 'Stall'],
        'garage': ['Műhely', 'Workshop', 'Werkstatt', 'Garage'],
        'wall': ['Fal', 'Wall', 'Mauer'],
        'smith': ['Kovácsműhely', 'Smithy', 'Schmiede', 'Smith'],
        'market': ['Piac', 'Market', 'Marktplatz'],
        'wood': ['Fatelep', 'Timber camp', 'Holzfäller'],
        'stone': ['Agyagbánya', 'Clay pit', 'Lehmgrube'],
        'iron': ['Vasbánya', 'Iron mine', 'Eisenmine'],
        'farm': ['Tanya', 'Farm', 'Bauernhof'],
        'storage': ['Raktár', 'Storage', 'Speicher'],
        'hide': ['Rejtekhely', 'Hiding place', 'Versteck'],
        'place': ['Gyülekezőhely', 'Rally point', 'Versammlungsplatz'],
        'statue': ['Szobor', 'Statue', 'Statue'],
        'snob': ['Akadémia', 'Academy', 'Adelshof'],
        'church': ['Templom', 'Church', 'Kirche'],
        'watchtower': ['Őrtorony', 'Watchtower', 'Wachturm']
    };

    // ==================== SIEGE CALCULATOR ====================
    // Based on official Tribal Wars catapult train mechanics
    // IMPORTANT: Each attack can only reduce a building by 1 level!
    // Multiple levels require multiple attack waves.

    const SiegeCalculator = {
        // Official catapult requirements per level (for standard buildings)
        CATAPULT_TABLE: {
            30: 20, 29: 19, 28: 17, 27: 16, 26: 15, 25: 13,
            24: 12, 23: 11, 22: 11, 21: 10, 20: 9,  19: 8,
            18: 8,  17: 7,  16: 6,  15: 6,  14: 6,  13: 5,
            12: 5,  11: 4,  10: 4,  9: 4,   8: 4,   7: 3,
            6: 3,   5: 3,   4: 3,   3: 2,   2: 2,   1: 2
        },

        // Rams needed to break wall from level X to 0 (ONE attack, not waves!)
        // Official table from Tribal Wars
        RAMS_TO_ZERO: {
            1: 2,   2: 4,   3: 7,   4: 10,  5: 14,
            6: 19,  7: 24,  8: 30,  9: 37,  10: 45,
            11: 55, 12: 65, 13: 77, 14: 91, 15: 106,
            16: 124, 17: 143, 18: 166, 19: 191, 20: 219
        },

        // Building type multipliers
        BUILDING_MULTIPLIERS: {
            'main': 1.0, 'barracks': 1.0, 'stable': 1.0, 'garage': 1.0,
            'smith': 1.0, 'market': 1.0, 'statue': 1.0,
            'wood': 0.8, 'stone': 0.8, 'iron': 0.8,
            'farm': 0.8, 'storage': 0.8, 'hide': 0.8,
            'wall': 1.5, 'watchtower': 1.5,
            'church': 1.2, 'church_f': 1.2, 'snob': 2.0, 'place': 0
        },

        // Get catapults needed for ONE level reduction (one attack wave)
        catapultsForOneLevel: function(building, currentLevel) {
            if (currentLevel <= 0 || building === 'place') return 0;

            const baseCats = this.CATAPULT_TABLE[currentLevel] || 2;
            const multiplier = this.BUILDING_MULTIPLIERS[building] || 1.0;

            return Math.ceil(baseCats * multiplier);
        },

        // Get rams needed to break wall from current level to 0 (ONE attack!)
        ramsToBreakWall: function(currentWallLevel) {
            if (currentWallLevel <= 0) return 0;
            return this.RAMS_TO_ZERO[currentWallLevel] || 0;
        },

        // Calculate for a single attack
        // WALL: Breaks to 0 in ONE attack (all rams at once)
        // BUILDING: Reduces by 1 level per attack (wave system)
        calculateSingleAttack: function(building, currentLevel) {
            if (currentLevel <= 0) {
                return { unitsNeeded: 0, targetLevel: 0, message: 'Already at level 0' };
            }

            if (building === 'wall') {
                // WALL: Break to 0 in ONE attack!
                const ramsNeeded = this.ramsToBreakWall(currentLevel);
                log(`Ram calc: wall ${currentLevel} → 0 = ${ramsNeeded} rams (ONE attack)`);
                return {
                    type: 'ram',
                    building: 'wall',
                    currentLevel: currentLevel,
                    targetLevel: 0, // Always break to 0!
                    unitsNeeded: ramsNeeded
                };
            } else {
                // BUILDING: Reduce by 1 level per attack
                const targetLevel = currentLevel - 1;
                const catsNeeded = this.catapultsForOneLevel(building, currentLevel);
                log(`Catapult calc: ${building} ${currentLevel} → ${targetLevel} = ${catsNeeded} cats`);
                return {
                    type: 'catapult',
                    building: building,
                    currentLevel: currentLevel,
                    targetLevel: targetLevel,
                    unitsNeeded: catsNeeded
                };
            }
        },

        // Calculate total waves needed (for display purposes)
        // WALL: Always 1 wave (breaks to 0 at once)
        // BUILDING: Multiple waves (1 level per wave)
        calculateTotalWaves: function(building, currentLevel, targetLevel = 0) {
            if (currentLevel <= targetLevel) return { waves: 0, totalUnits: 0 };

            if (building === 'wall') {
                // Wall = 1 wave, all rams at once
                return {
                    waves: 1,
                    totalUnits: this.ramsToBreakWall(currentLevel)
                };
            } else {
                // Buildings = multiple waves
                let totalUnits = 0;
                const waves = currentLevel - targetLevel;

                for (let level = currentLevel; level > targetLevel; level--) {
                    totalUnits += this.catapultsForOneLevel(building, level);
                }

                return { waves: waves, totalUnits: totalUnits };
            }
        }
    };

    // ==================== UTILITY FUNCTIONS ====================

    function log(message, data = null) {
        if (CONFIG.debug) {
            if (data) {
                console.log('[ReportCatapult]', message, data);
            } else {
                console.log('[ReportCatapult]', message);
            }
        }
    }

    // Random delay between min and max milliseconds
    function randomDelay(min, max) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Action delay (500-700ms)
    function actionDelay() {
        return randomDelay(CONFIG.actionDelayMin, CONFIG.actionDelayMax);
    }

    // Report delay (800-1200ms)
    function reportDelay() {
        return randomDelay(CONFIG.reportDelayMin, CONFIG.reportDelayMax);
    }

    // ==================== BOT PROTECTION ====================

    // Check if bot protection captcha is present (DOM only, no server requests)
    function isBotProtectionActive() {
        const botElement = document.getElementById('botprotection_quest');
        return botElement !== null;
    }

    // Wait for bot protection to be solved (checks DOM every 20 seconds)
    // Returns immediately if no protection, otherwise waits until solved
    async function waitForBotProtection() {
        if (!isBotProtectionActive()) {
            return; // No protection, continue immediately
        }

        log('BOT PROTECTION DETECTED! Waiting...');
        if (typeof UI !== 'undefined') {
            UI.InfoMessage('Bot védelem észlelve - várakozás...');
        }

        // Wait and re-check DOM every 20 seconds (no server requests)
        while (isBotProtectionActive()) {
            log('Bot protection still present, checking again in 20 seconds...');
            await randomDelay(20000, 22000); // 20-22 seconds
        }

        log('Bot protection cleared! Continuing...');
        if (typeof UI !== 'undefined') {
            UI.SuccessMessage('Bot védelem eltűnt - folytatás!');
        }

        // Small delay after solving before continuing
        await randomDelay(1000, 2000);
    }

    // Load config from localStorage
    // Default ram values (official table)
    const DEFAULT_RAMS = {
        1: 2, 2: 4, 3: 7, 4: 10, 5: 14,
        6: 19, 7: 24, 8: 30, 9: 37, 10: 45,
        11: 55, 12: 65, 13: 77, 14: 91, 15: 106,
        16: 124, 17: 143, 18: 166, 19: 191, 20: 219
    };

    function loadConfig() {
        const saved = localStorage.getItem('report_catapult_config');
        if (saved) {
            try {
                const savedConfig = JSON.parse(saved);

                // Merge wallTemplates carefully - ensure ram values have defaults
                if (savedConfig.wallTemplates) {
                    for (let level = 1; level <= 20; level++) {
                        if (savedConfig.wallTemplates[level]) {
                            // Use saved ram if exists, otherwise use default
                            if (savedConfig.wallTemplates[level].ram === undefined) {
                                savedConfig.wallTemplates[level].ram = DEFAULT_RAMS[level];
                            }
                        } else {
                            // No saved template for this level, use defaults
                            savedConfig.wallTemplates[level] = {
                                ram: DEFAULT_RAMS[level],
                                axe: CONFIG.wallTemplates[level].axe,
                                spy: CONFIG.wallTemplates[level].spy
                            };
                        }
                    }
                }

                Object.assign(CONFIG, savedConfig);
                log('Config loaded', CONFIG);
            } catch(e) {
                log('Failed to load config:', e);
            }
        }
    }

    // Save config to localStorage
    function saveConfig() {
        try {
            localStorage.setItem('report_catapult_config', JSON.stringify(CONFIG));
            log('Config saved');
            if (typeof UI !== 'undefined') {
                UI.SuccessMessage('Beállítások mentve!');
            }
        } catch(e) {
            log('Failed to save config:', e);
        }
    }

    // ==================== WALL TEMPLATE LOOKUP ====================

    // Get the appropriate escort template for a wall level
    // Uses the highest defined level that is <= the current wall level
    function getWallTemplate(wallLevel) {
        if (wallLevel <= 0) return { axe: 0, spy: 0 };

        const templates = CONFIG.wallTemplates;
        const levels = Object.keys(templates).map(Number).sort((a, b) => a - b);

        let template = templates[1] || { axe: 5, spy: 1 }; // fallback

        for (const lvl of levels) {
            if (lvl <= wallLevel) {
                template = templates[lvl];
            } else {
                break;
            }
        }

        log(`Wall template for level ${wallLevel}:`, template);
        return { ...template }; // Return a copy
    }

    // ==================== COMMUNICATION LAYER ====================

    const Communication = {
        INSTRUCTION_KEY: 'report_catapult_instruction',
        WAVE_STATE_KEY: 'report_catapult_wave_state',
        NOTIFICATION_KEY: 'report_catapult_notification',

        // Send instruction to worker (includes all wave info)
        sendInstruction: function(instruction) {
            instruction.timestamp = Date.now();
            localStorage.setItem(this.INSTRUCTION_KEY, JSON.stringify(instruction));
            log('Instruction sent:', instruction);
        },

        // Get pending instruction
        getInstruction: function() {
            const data = localStorage.getItem(this.INSTRUCTION_KEY);
            if (!data) return null;

            try {
                const instruction = JSON.parse(data);
                // Ignore old instructions (> 5 minutes for multi-wave attacks)
                if (Date.now() - instruction.timestamp > 300000) {
                    this.clearInstruction();
                    return null;
                }
                return instruction;
            } catch(e) {
                return null;
            }
        },

        // Clear instruction
        clearInstruction: function() {
            localStorage.removeItem(this.INSTRUCTION_KEY);
        },

        // Wave state management (for multi-wave attacks)
        getWaveState: function() {
            const data = localStorage.getItem(this.WAVE_STATE_KEY);
            if (!data) return null;
            try {
                const state = JSON.parse(data);
                // Ignore old state (> 5 minutes)
                if (Date.now() - state.timestamp > 300000) {
                    this.clearWaveState();
                    return null;
                }
                return state;
            } catch(e) {
                return null;
            }
        },

        setWaveState: function(state) {
            state.timestamp = Date.now();
            localStorage.setItem(this.WAVE_STATE_KEY, JSON.stringify(state));
            log('Wave state set:', state);
        },

        clearWaveState: function() {
            localStorage.removeItem(this.WAVE_STATE_KEY);
        },

        // Notify master via localStorage (works across tabs)
        notifyMaster: function(message) {
            try {
                const notification = {
                    ...message,
                    timestamp: Date.now()
                };
                localStorage.setItem(this.NOTIFICATION_KEY, JSON.stringify(notification));
                log('Notified master via localStorage:', notification);
            } catch(e) {
                log('localStorage notification failed:', e);
            }
        },

        // Check for notification (called by master via polling)
        checkNotification: function() {
            const data = localStorage.getItem(this.NOTIFICATION_KEY);
            if (!data) return null;

            try {
                const notification = JSON.parse(data);
                // Only accept notifications from last 30 seconds
                if (Date.now() - notification.timestamp < 30000) {
                    localStorage.removeItem(this.NOTIFICATION_KEY);
                    return notification;
                } else {
                    localStorage.removeItem(this.NOTIFICATION_KEY);
                    return null;
                }
            } catch(e) {
                return null;
            }
        }
    };

    // ==================== REPORT PAGE LOGIC (MASTER) ====================

    const MasterController = {
        workerWindow: null,

        // Check if this is a spy report
        isSpyReport: function() {
            const leftBuildings = document.getElementById('attack_spy_buildings_left');
            const rightBuildings = document.getElementById('attack_spy_buildings_right');
            return !!(leftBuildings || rightBuildings);
        },

        // Check if target is a barbarian village
        // Barbarian = defender shows "---" (no player name)
        isBarbarian: function() {
            // Method 1: Check all th elements in defender info for "---"
            const defenderTable = document.querySelector('#attack_info_def');
            if (defenderTable) {
                const thElements = defenderTable.querySelectorAll('th');
                for (const th of thElements) {
                    const text = th.textContent.trim();
                    // "---" means no defender = barbarian village
                    if (text === '---') {
                        log('Barbarian detected: defender is ---');
                        return true;
                    }
                }
            }

            // Method 2: Check if there's no player link in defender section
            const defenderLink = document.querySelector('#attack_info_def a[href*="info_player"]');
            if (!defenderLink) {
                // No player link = likely barbarian
                // But verify it's not just missing data
                const defenderRow = document.querySelector('#attack_info_def tr');
                if (defenderRow) {
                    const rowText = defenderRow.textContent;
                    if (rowText.includes('---')) {
                        log('Barbarian detected: no player link and --- found');
                        return true;
                    }
                }
            }

            // Method 3: Check destination village name for "Barbár" or "Bonus"
            const destLink = document.querySelector('#attack_info_def a[href*="info_village"]');
            if (destLink) {
                const villageName = destLink.textContent.toLowerCase();
                if (villageName.includes('barbár') || villageName.includes('bónusz')) {
                    log('Barbarian detected: village name contains barbár/bónusz');
                    return true;
                }
            }

            log('Not detected as barbarian village');
            return false;
        },

        // Extract building levels from spy report
        extractBuildingLevels: function() {
            const levels = {};

            const leftTable = document.getElementById('attack_spy_buildings_left');
            const rightTable = document.getElementById('attack_spy_buildings_right');

            if (!leftTable && !rightTable) {
                log('No building tables found');
                return null;
            }

            [leftTable, rightTable].forEach(table => {
                if (!table) return;

                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const buildingName = cells[0].textContent.trim().toLowerCase();
                        const level = parseInt(cells[1].textContent.trim(), 10);

                        for (const [key, translations] of Object.entries(BUILDING_I18N)) {
                            for (const translation of translations) {
                                if (buildingName.includes(translation.toLowerCase())) {
                                    levels[key] = level;
                                    break;
                                }
                            }
                        }
                    }
                });
            });

            log('Extracted building levels:', levels);
            return levels;
        },

        // Extract target village coordinate
        extractCoordinate: function() {
            const coordRegex = /\d{3}\|\d{3}/;

            // Check defender info
            const defenderLink = document.querySelector('#attack_info_def a');
            if (defenderLink) {
                const match = defenderLink.textContent.match(coordRegex);
                if (match) return match[0];
            }

            // Fallback: check page content
            const content = document.body.textContent;
            const match = content.match(coordRegex);
            return match ? match[0] : null;
        },

        // Extract target village ID
        extractVillageId: function() {
            const defenderLink = document.querySelector('#attack_info_def a');
            if (defenderLink) {
                const href = defenderLink.getAttribute('href');
                const match = href.match(/id=(\d+)/);
                if (match) return match[1];
            }
            return null;
        },

        // Determine what attack is needed
        analyzeReport: function() {
            const levels = this.extractBuildingLevels();
            if (!levels) return null;

            const coordinate = this.extractCoordinate();
            const villageId = this.extractVillageId();

            if (!coordinate) {
                log('Could not extract coordinate');
                return null;
            }

            const result = {
                coordinate: coordinate,
                villageId: villageId,
                buildingLevels: levels,
                attacks: []
            };

            // SPIRIT MODE: Collect ALL buildings in one batch
            // DEFAULT MODE: Prioritize one building type at a time

            // PRIORITY 1: Check if wall needs rams
            // WALL: Breaks to 0 in ONE attack (not waves like catapults!)
            const wallLevel = levels.wall || 0;
            if (wallLevel > CONFIG.wallTargetLevel) {
                const attack = SiegeCalculator.calculateSingleAttack('wall', wallLevel);
                // Use wall template for escort based on wall level
                const wallEscort = getWallTemplate(wallLevel);
                result.attacks.push({
                    type: 'ram',
                    target: 'wall',
                    currentLevel: wallLevel,
                    targetLevel: 0, // Wall breaks to 0 in ONE attack!
                    finalTargetLevel: 0,
                    unitsNeeded: { ram: attack.unitsNeeded, ...wallEscort },
                    wavesRemaining: 1, // Always 1 wave for wall
                    totalUnitsForAll: attack.unitsNeeded
                });
                log('Wall attack added to queue');
            }

            // PRIORITY 2: Check BARRACKS
            const barracksLevel = levels.barracks || 0;
            const barracksMaxLevel = CONFIG.maxLevels.barracks || 0;
            if (barracksLevel > barracksMaxLevel) {
                const attack = SiegeCalculator.calculateSingleAttack('barracks', barracksLevel);
                const waveInfo = SiegeCalculator.calculateTotalWaves('barracks', barracksLevel, barracksMaxLevel);
                result.attacks.push({
                    type: 'catapult',
                    target: 'barracks',
                    currentLevel: barracksLevel,
                    targetLevel: attack.targetLevel,
                    finalTargetLevel: barracksMaxLevel,
                    unitsNeeded: { catapult: attack.unitsNeeded, ...CONFIG.catapultEscort },
                    wavesRemaining: waveInfo.waves,
                    totalUnitsForAll: waveInfo.totalUnits
                });
                log('Barracks attack added to queue');
            }

            // DEFAULT MODE: If wall OR barracks need attacks, return now (don't check main yet!)
            if (!CONFIG.spiritMode && result.attacks.length > 0) {
                log('DEFAULT MODE: Wall/Barracks attacks queued - main waits for next report');
                return result;
            }

            // PRIORITY 3: Check MAIN
            const mainLevel = levels.main || 0;
            const mainMaxLevel = CONFIG.maxLevels.main || 0;
            if (mainLevel > mainMaxLevel) {
                const attack = SiegeCalculator.calculateSingleAttack('main', mainLevel);
                const waveInfo = SiegeCalculator.calculateTotalWaves('main', mainLevel, mainMaxLevel);
                result.attacks.push({
                    type: 'catapult',
                    target: 'main',
                    currentLevel: mainLevel,
                    targetLevel: attack.targetLevel,
                    finalTargetLevel: mainMaxLevel,
                    unitsNeeded: { catapult: attack.unitsNeeded, ...CONFIG.catapultEscort },
                    wavesRemaining: waveInfo.waves,
                    totalUnitsForAll: waveInfo.totalUnits
                });
                log('Main attack added to queue');

                // DEFAULT MODE: Return after adding main
                if (!CONFIG.spiritMode) {
                    return result;
                }
            }

            // PRIORITY 4: Check other buildings
            for (const building of CONFIG.buildingPriority) {
                if (building === 'wall' || building === 'barracks' || building === 'main') continue; // Already handled above

                const currentLevel = levels[building] || 0;
                const maxLevel = CONFIG.maxLevels[building] || 0;

                if (currentLevel > maxLevel) {
                    const attack = SiegeCalculator.calculateSingleAttack(building, currentLevel);
                    const waveInfo = SiegeCalculator.calculateTotalWaves(building, currentLevel, maxLevel);
                    result.attacks.push({
                        type: 'catapult',
                        target: building,
                        currentLevel: currentLevel,
                        targetLevel: attack.targetLevel,
                        finalTargetLevel: maxLevel,
                        unitsNeeded: { catapult: attack.unitsNeeded, ...CONFIG.catapultEscort },
                        wavesRemaining: waveInfo.waves,
                        totalUnitsForAll: waveInfo.totalUnits
                    });

                    // DEFAULT MODE: Only target one building at a time
                    // SPIRIT MODE: Continue adding all buildings
                    if (!CONFIG.spiritMode) {
                        break;
                    }
                }
            }

            log('Report analysis:', result);
            return result;
        },

        // Open worker tab to rally point (reuse same tab)
        openWorkerWindow: function(targetVillageId) {
            const baseUrl = window.location.href.split('?')[0].replace('/game.php', '');
            const villageParam = new URLSearchParams(window.location.search).get('village');
            const rallyPointUrl = `${baseUrl}/game.php?village=${villageParam}&screen=place&target=${targetVillageId}`;

            log('Opening worker tab:', rallyPointUrl);

            // Use a named window to reuse the same tab
            // 'tw_catapult_worker' - always reuses the same tab
            this.workerWindow = window.open(rallyPointUrl, 'tw_catapult_worker');

            // Focus the worker tab
            if (this.workerWindow) {
                this.workerWindow.focus();
            }

            return this.workerWindow;
        },

        // Send attack via worker
        // DEFAULT MODE: Process one building at a time (attacks[0])
        // SPIRIT MODE: Process ALL buildings in one batch
        // WALL: ONE wave with all rams to break to 0
        // BUILDING: Multiple waves (1 level per wave, spy only on last)
        sendAttack: async function(attackInfo) {
            if (!attackInfo || attackInfo.attacks.length === 0) {
                log('No attacks needed');
                return false;
            }

            const waves = [];
            let targetBuilding = '';
            let attackType = '';

            // SPIRIT MODE: Process ALL attacks
            // DEFAULT MODE: Process only attacks[0]
            const attacksToProcess = CONFIG.spiritMode ? attackInfo.attacks : [attackInfo.attacks[0]];

            for (const attack of attacksToProcess) {
                // Track the type for the instruction (use first attack's type, or 'mixed' if different)
                if (!attackType) {
                    attackType = attack.type;
                    targetBuilding = attack.target;
                } else if (CONFIG.spiritMode) {
                    attackType = 'mixed';
                    targetBuilding = 'multiple';
                }

                if (attack.type === 'ram') {
                    // WALL: ONE wave with all rams to break to 0
                    const wallTemplate = getWallTemplate(attack.currentLevel);
                    // Ram count comes from template (customizable!)
                    const ramsNeeded = wallTemplate.ram || SiegeCalculator.ramsToBreakWall(attack.currentLevel);

                    waves.push({
                        waveNumber: waves.length + 1,
                        fromLevel: attack.currentLevel,
                        toLevel: 0,
                        targetBuilding: 'wall',
                        units: {
                            ram: ramsNeeded,
                            axe: wallTemplate.axe || 0,
                            spy: wallTemplate.spy || 0
                        }
                    });

                    log(`Wall attack: ${attack.currentLevel} → 0 with ${ramsNeeded} rams (ONE wave)`);

                } else {
                    // BUILDING: Multiple waves (1 level per wave)
                    let currentLevel = attack.currentLevel;
                    // Use nullish coalescing to handle finalTargetLevel = 0 correctly
                    const targetLevel = attack.finalTargetLevel ?? 1;

                    while (currentLevel > targetLevel) {
                        const waveAttack = SiegeCalculator.calculateSingleAttack(attack.target, currentLevel);
                        const escort = { ...CONFIG.catapultEscort };

                        // In SPIRIT MODE: Only send spy on the LAST wave of ALL attacks
                        // In DEFAULT MODE: Only send spy on the LAST wave of this building
                        const isLastWaveOfThisBuilding = (currentLevel - 1) === targetLevel;
                        const isLastAttack = attack === attacksToProcess[attacksToProcess.length - 1];
                        const isLastWave = isLastWaveOfThisBuilding && isLastAttack;

                        if (!isLastWave) {
                            escort.spy = 0;
                        }

                        waves.push({
                            waveNumber: waves.length + 1,
                            fromLevel: currentLevel,
                            toLevel: currentLevel - 1,
                            targetBuilding: attack.target,
                            units: { catapult: waveAttack.unitsNeeded, ...escort }
                        });
                        currentLevel--;
                    }

                    log(`Building attack: ${attack.target} ${attack.currentLevel} → ${targetLevel} (${attack.currentLevel - targetLevel} waves)`);
                }
            }

            if (CONFIG.spiritMode && attacksToProcess.length > 1) {
                log(`SPIRIT MODE: Combined ${attacksToProcess.length} buildings into ${waves.length} total waves`);
            }

            // Prepare instruction with ALL waves
            const instruction = {
                action: 'attack',
                coordinate: attackInfo.coordinate,
                villageId: attackInfo.villageId,
                attackType: attackType,
                targetBuilding: targetBuilding,
                totalWaves: waves.length,
                waves: waves,
                currentWave: 1
            };

            // Clear any old wave state and set fresh instruction
            Communication.clearWaveState();
            Communication.sendInstruction(instruction);

            // Set initial wave state
            Communication.setWaveState({
                villageId: attackInfo.villageId,
                coordinate: attackInfo.coordinate,
                targetBuilding: targetBuilding,
                attackType: attackType,
                currentWave: 1,
                totalWaves: waves.length,
                waves: waves
            });

            // Open worker tab
            this.openWorkerWindow(attackInfo.villageId);

            return true;
        },

        // Navigate to next report
        goToNextReport: async function() {
            await reportDelay();

            const nextLink = document.querySelector('#report-next');
            if (nextLink) {
                log('Navigating to next report');
                nextLink.click();
            } else {
                log('No next report found');
                UI.InfoMessage('Nincs több jelentés!');
            }
        },

        // Polling interval for localStorage notifications
        notificationPoller: null,

        // Start listening for worker notifications via storage event (instant) + polling (backup)
        startNotificationPolling: function() {
            if (this.notificationPoller) return;

            // Method 1: Storage event listener (instant, fires when other tab changes localStorage)
            window.addEventListener('storage', (event) => {
                if (event.key === Communication.NOTIFICATION_KEY && event.newValue) {
                    try {
                        const notification = JSON.parse(event.newValue);
                        log('Received notification via storage event:', notification);
                        localStorage.removeItem(Communication.NOTIFICATION_KEY);
                        this.processWorkerNotification(notification);
                    } catch(e) {
                        log('Error parsing storage event:', e);
                    }
                }
            });

            // Method 2: Polling backup (in case storage event missed)
            this.notificationPoller = setInterval(() => {
                const notification = Communication.checkNotification();
                if (notification) {
                    log('Received notification via polling:', notification);
                    this.processWorkerNotification(notification);
                }
            }, 200);

            log('Started notification listening (storage event + polling)');
        },

        // Stop polling
        stopNotificationPolling: function() {
            if (this.notificationPoller) {
                clearInterval(this.notificationPoller);
                this.notificationPoller = null;
            }
        },

        // Process notification from worker (from either postMessage or polling)
        processWorkerNotification: function(data) {
            if (data.action === 'attack_complete') {
                const waveInfo = data.totalWaves > 1 ? ` (${data.totalWaves} hullám)` : '';
                if (typeof UI !== 'undefined') {
                    UI.SuccessMessage(`Támadás elküldve: ${data.coordinate || ''}${waveInfo}`);
                }

                // Update button state to show completion
                const btn = document.getElementById('report_catapult_attack_btn');
                if (btn) {
                    btn.value = 'Kész!';
                    btn.disabled = false;
                    // Re-enable after a short delay
                    setTimeout(() => {
                        if (btn) {
                            btn.value = 'Támadás küldése';
                        }
                    }, 2000);
                }

                // Continue AUTO workflow
                if (CONFIG.autoAttack) {
                    setTimeout(() => {
                        // Check again in case user disabled AUTO during the delay
                        if (CONFIG.autoAttack) {
                            this.goToNextReport();
                        } else {
                            log('AUTO mode was disabled, stopping workflow');
                        }
                    }, 1500);
                }
            } else if (data.action === 'attack_failed') {
                // Show detailed message for not enough troops
                const message = data.message || data.reason || 'Ismeretlen hiba';
                if (typeof UI !== 'undefined') {
                    UI.ErrorMessage(message);
                }

                // Re-enable button
                const btn = document.getElementById('report_catapult_attack_btn');
                if (btn) {
                    btn.value = 'Hiba!';
                    btn.disabled = false;
                    setTimeout(() => {
                        if (btn) {
                            btn.value = 'Támadás küldése';
                        }
                    }, 2000);
                }

                // If not enough troops, still move to next report in auto mode
                // (can't attack this village now)
                if (CONFIG.autoAttack) {
                    setTimeout(() => {
                        // Check again in case user disabled AUTO during the delay
                        if (CONFIG.autoAttack) {
                            this.goToNextReport();
                        } else {
                            log('AUTO mode was disabled, stopping workflow');
                        }
                    }, 1500);
                }
            }
        },

        // Add UI panel to report page - between #attack_info_def and <h4>Kémkedés</h4>
        addReportUI: function() {
            if (document.getElementById('report_catapult_panel')) return;

            // Find the correct insertion point: after #attack_info_def, before <h4>Kémkedés</h4>
            const defenderTable = document.querySelector('#attack_info_def');
            const spyHeader = document.querySelector('h4'); // Kémkedés header

            if (!defenderTable) {
                log('Could not find #attack_info_def for UI placement');
                return;
            }

            const analysis = this.analyzeReport();
            const isBarbarian = this.isBarbarian();
            const isSpyReport = this.isSpyReport();

            // Build status text (no emojis)
            let statusText = '';
            let statusClass = '';
            let attackInfo = null;

            if (!isSpyReport) {
                statusText = 'Nem kém jelentés';
                statusClass = 'warn';
            } else if (!isBarbarian) {
                statusText = 'Nem barbár falu';
                statusClass = 'warn';
            } else if (analysis && analysis.attacks.length > 0) {
                attackInfo = analysis.attacks[0];

                // Icon helper functions with tooltips
                const unitIcon = (unit, size = 18) => `<img src="/graphic/unit/unit_${unit}.png" title="${unit}" style="vertical-align: middle; width: ${size}px; height: ${size}px;">`;
                const buildingIcon = (building, size = 20) => `<img src="/graphic/buildings/${building}.png" title="${building}" style="vertical-align: middle; width: ${size}px; height: ${size}px; cursor: help;">`;

                // Unit type
                const unitType = attackInfo.type === 'ram' ? 'ram' : 'catapult';
                const count = attackInfo.type === 'ram' ? attackInfo.unitsNeeded.ram : attackInfo.unitsNeeded.catapult;

                // Wave info
                const waveText = attackInfo.wavesRemaining > 1
                    ? `(Hullám 1/${attackInfo.wavesRemaining})`
                    : '';

                // Build escort with icons only
                // Use appropriate escort for display based on attack type
                const displayEscort = attackInfo.type === 'ram'
                    ? getWallTemplate(attackInfo.currentLevel)
                    : CONFIG.catapultEscort;
                const escortParts = Object.entries(displayEscort)
                    .filter(([u, c]) => c > 0)
                    .map(([u, c]) => `${unitIcon(u)} ${c}`);
                const escortHtml = escortParts.length > 0 ? escortParts.join(' ') : '';

                // Clean icon-based format (hover for names)
                statusText = `${unitIcon(unitType, 22)} (Hullám 1/${attackInfo.wavesRemaining})`;
                statusText += `<br>Cél: ${buildingIcon(attackInfo.target, 22)} (${attackInfo.currentLevel} &rarr; ${attackInfo.targetLevel})`;

                if (attackInfo.wavesRemaining > 1) {
                    statusText += `<br><small>Végső: ${attackInfo.finalTargetLevel} szint, össz: ${attackInfo.totalUnitsForAll} ${unitIcon(unitType)}</small>`;
                }

                if (escortHtml) {
                    statusText += `<br><small>Kíséret: ${escortHtml}</small>`;
                }
                statusClass = 'attack';
            } else {
                statusText = 'Nincs szükséges támadás';
                statusClass = 'ok';
            }

            // Create the UI panel with proper TW styling
            const panel = document.createElement('table');
            panel.id = 'report_catapult_panel';
            panel.className = 'vis';
            panel.style.cssText = 'width: 100%; margin: 10px 0; border: 1px solid #DED3B9;';

            // Mode indicator
            const modeText = CONFIG.spiritMode ? 'Spirit Mód' : 'Normál Mód';
            const modeColor = CONFIG.spiritMode ? '#ff9800' : '#2196f3';

            panel.innerHTML = `
                <tr>
                    <th style="text-align: left;">
                        Katapult / Faltörő Támadás
                        <span style="float: right; font-size: 11px; padding: 2px 6px; background: ${modeColor}; color: white; border-radius: 3px;">${modeText}</span>
                    </th>
                </tr>
                <tr>
                    <td id="report_catapult_status" class="report_catapult_${statusClass}" style="padding: 6px;">
                        ${statusText}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 6px; background-color: #f4e4bc; text-align: center;">
                        <input type="button" id="report_catapult_attack_btn" class="btn" value="Támadás küldése"
                            style="margin: 2px;" ${attackInfo ? '' : 'disabled'}>
                        <input type="button" id="report_catapult_next_btn" class="btn" value="Következő" style="margin: 2px;">
                        <input type="button" id="report_catapult_settings_btn" class="btn" value="Beállítások" style="margin: 2px;">
                        <input type="button" id="report_catapult_auto_btn" class="btn ${CONFIG.autoAttack ? 'btn-confirm-yes' : ''}"
                            value="${CONFIG.autoAttack ? 'AUTO ON' : 'AUTO OFF'}" style="margin: 2px;">
                    </td>
                </tr>
            `;

            // Add CSS styles
            if (!document.getElementById('report_catapult_styles')) {
                const style = document.createElement('style');
                style.id = 'report_catapult_styles';
                style.textContent = `
                    .report_catapult_ok { background-color: #d4edda; color: #155724; }
                    .report_catapult_warn { background-color: #fff3cd; color: #856404; }
                    .report_catapult_attack { background-color: #f8d7da; color: #721c24; }
                    #report_catapult_panel th {
                        background: url(/graphic/screen/tableheader_bg3.png) repeat-x scroll 0 0 #C1A264;
                        color: #603000;
                        padding: 4px 6px;
                    }
                    #report_catapult_auto_btn.btn-confirm-yes {
                        background: linear-gradient(to bottom, #0a0 0%, #070 100%);
                        color: white;
                    }
                `;
                document.head.appendChild(style);
            }

            // Insert panel after defender table, before spy header
            // Find the <br> after #attack_info_def or insert before h4
            let insertBefore = spyHeader;
            let parentNode = defenderTable.parentNode;

            // Try to find a br element between defender table and h4
            let sibling = defenderTable.nextSibling;
            while (sibling && sibling !== spyHeader) {
                if (sibling.nodeName === 'BR') {
                    insertBefore = sibling;
                    break;
                }
                sibling = sibling.nextSibling;
            }

            if (insertBefore) {
                parentNode.insertBefore(panel, insertBefore);
            } else {
                // Fallback: insert after defender table
                if (defenderTable.nextSibling) {
                    parentNode.insertBefore(panel, defenderTable.nextSibling);
                } else {
                    parentNode.appendChild(panel);
                }
            }

            // Attach event listeners
            document.getElementById('report_catapult_attack_btn').onclick = async () => {
                const btn = document.getElementById('report_catapult_attack_btn');
                btn.disabled = true;
                btn.value = 'Küldés...';
                await this.sendAttack(analysis);
            };

            document.getElementById('report_catapult_next_btn').onclick = () => {
                this.goToNextReport();
            };

            document.getElementById('report_catapult_settings_btn').onclick = () => {
                showSettings();
            };

            document.getElementById('report_catapult_auto_btn').onclick = () => {
                CONFIG.autoAttack = !CONFIG.autoAttack;
                saveConfig();
                const btn = document.getElementById('report_catapult_auto_btn');
                btn.value = CONFIG.autoAttack ? 'AUTO ON' : 'AUTO OFF';
                if (CONFIG.autoAttack) {
                    btn.classList.add('btn-confirm-yes');
                    this.runAutoWorkflow();
                } else {
                    btn.classList.remove('btn-confirm-yes');
                }
            };

            // Start polling for worker notifications via localStorage
            // (postMessage doesn't work reliably across tabs)
            this.startNotificationPolling();
        },

        // AUTO workflow: check conditions and process
        runAutoWorkflow: async function() {
            if (!CONFIG.autoAttack) {
                log('Auto mode disabled, stopping workflow');
                return;
            }

            const mode = CONFIG.spiritMode ? 'SPIRIT' : 'DEFAULT';
            log(`Running AUTO workflow in ${mode} mode...`);

            // Step 1: Check if we're on a report page
            if (!window.location.href.includes('screen=report') || !window.location.href.includes('view=')) {
                log('Not on a report view page');
                return;
            }

            // Step 2: Check if it's a spy/battle report
            const isSpyReport = this.isSpyReport();
            if (!isSpyReport) {
                log('Not a spy report, skipping to next');
                await this.goToNextReport();
                return;
            }

            // Step 3: Check if it's a barbarian village
            const isBarbarian = this.isBarbarian();
            if (!isBarbarian) {
                log('Not a barbarian village, skipping to next');
                await this.goToNextReport();
                return;
            }

            // Step 4: Analyze the report
            const analysis = this.analyzeReport();

            // Step 5: Check if we need to send an attack
            if (!analysis || analysis.attacks.length === 0) {
                log('No attack needed, moving to next report');
                await this.goToNextReport();
                return;
            }

            // Step 6: Send the attack
            log(`Attack needed, sending ${analysis.attacks.length} building(s) in ${mode} mode...`);
            const attackSent = await this.sendAttack(analysis);

            if (!attackSent) {
                log('Attack failed to send, moving to next');
                await this.goToNextReport();
            }
            // If attack was sent, the worker will notify us when ALL waves are done
            // processWorkerNotification will then call goToNextReport
        },

        // Navigate to next report with short delay
        goToNextReport: async function() {
            // Check for bot protection before navigating
            await waitForBotProtection();

            // Short delay 200-220ms as requested
            await randomDelay(200, 220);

            const nextLink = document.querySelector('#report-next') ||
                            document.querySelector('a[id="report-next"]');
            if (nextLink) {
                log('Navigating to next report');
                nextLink.click();
            } else {
                log('No next report found');
                CONFIG.autoAttack = false;
                saveConfig();
                if (typeof UI !== 'undefined') {
                    UI.InfoMessage('Nincs több jelentés! AUTO kikapcsolva.');
                }
            }
        },

        // Initialize master controller
        init: function() {
            log('Master controller initializing...');
            this.addReportUI();

            // Run AUTO workflow if enabled
            if (CONFIG.autoAttack) {
                setTimeout(() => this.runAutoWorkflow(), 500);
            }
        }
    };

    // ==================== RALLY POINT LOGIC (WORKER) ====================

    const WorkerController = {
        // Check if we have pending work (instruction or ongoing wave)
        hasPendingWork: function() {
            const waveState = Communication.getWaveState();
            const instruction = Communication.getInstruction();
            return (waveState && waveState.currentWave <= waveState.totalWaves) ||
                   (instruction && instruction.action === 'attack');
        },

        // Get current wave info
        getCurrentWave: function() {
            const waveState = Communication.getWaveState();
            if (!waveState || !waveState.waves) return null;

            const currentWaveIdx = waveState.currentWave - 1;
            if (currentWaveIdx >= waveState.waves.length) return null;

            // Each wave has its own targetBuilding - don't overwrite it!
            const wave = waveState.waves[currentWaveIdx];
            return {
                ...wave,
                coordinate: waveState.coordinate,
                attackType: waveState.attackType,
                villageId: waveState.villageId,
                currentWave: waveState.currentWave,
                totalWaves: waveState.totalWaves
            };
        },

        // Get available troops at rally point
        getAvailableTroops: function() {
            const troops = {};
            const unitInputs = document.querySelectorAll('.unitsInput');

            unitInputs.forEach(input => {
                const unitName = input.name;
                const available = parseInt(input.getAttribute('data-all-count')) || 0;
                troops[unitName] = available;
            });

            log('Available troops:', troops);
            return troops;
        },

        // Check if we have enough troops for the attack
        // Spy is OPTIONAL - if not available, attack proceeds without spy
        checkTroopAvailability: function(requiredUnits) {
            const available = this.getAvailableTroops();
            const missing = {};
            const adjusted = { ...requiredUnits }; // Copy to potentially adjust
            let hasEnough = true;

            for (const [unit, count] of Object.entries(requiredUnits)) {
                if (count > 0) {
                    const availableCount = available[unit] || 0;
                    if (availableCount < count) {
                        // SPY is optional - if not enough, set to 0 and continue
                        if (unit === 'spy') {
                            log(`Spy shortage: ${availableCount}/${count} - proceeding without spy`);
                            adjusted.spy = availableCount; // Use what we have (could be 0)
                        } else {
                            // Other units are required
                            missing[unit] = { required: count, available: availableCount, shortage: count - availableCount };
                            hasEnough = false;
                        }
                    }
                }
            }

            if (!hasEnough) {
                log('Not enough troops! Missing:', missing);
            }

            return { hasEnough, available, missing, adjusted };
        },

        // Fill the attack form for current wave
        fillAttackForm: async function(waveInfo) {
            log(`Filling attack form - Wave ${waveInfo.currentWave}/${waveInfo.totalWaves}:`, waveInfo);

            try {
                // Fill coordinates
                const [x, y] = waveInfo.coordinate.split('|');
                const xInput = document.querySelector('input[name="x"]');
                const yInput = document.querySelector('input[name="y"]');

                if (xInput && yInput) {
                    await actionDelay();
                    xInput.value = x;
                    await actionDelay();
                    yInput.value = y;
                }

                // Fill troops for this wave
                for (const [unit, count] of Object.entries(waveInfo.units)) {
                    if (count > 0) {
                        await actionDelay();
                        const input = document.getElementById('unit_input_' + unit);
                        if (input) {
                            input.value = count;
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            log(`Set ${unit} = ${count}`);
                        }
                    }
                }

                // Clear other units
                const otherUnits = ['spear', 'sword', 'archer', 'light', 'marcher', 'heavy', 'knight', 'snob'];
                for (const unit of otherUnits) {
                    if (!waveInfo.units[unit]) {
                        const input = document.getElementById('unit_input_' + unit);
                        if (input) input.value = 0;
                    }
                }

                // Store target building for confirmation screen
                localStorage.setItem('catapult_target_building', waveInfo.targetBuilding);

                return true;
            } catch(e) {
                log('Error filling form:', e);
                return false;
            }
        },

        // Click the attack button
        clickAttack: async function() {
            // Check for bot protection before clicking
            await waitForBotProtection();

            await actionDelay();

            const attackBtn = document.querySelector('input[name="attack"]') ||
                             document.getElementById('target_attack');

            if (attackBtn) {
                log('Clicking attack button');
                attackBtn.click();
                return true;
            }

            log('Attack button not found');
            return false;
        },

        // Handle confirmation screen (multi-wave aware)
        handleConfirmation: async function() {
            const targetBuilding = localStorage.getItem('catapult_target_building');
            const waveState = Communication.getWaveState();

            if (!waveState) {
                log('No wave state found on confirmation screen');
                return false;
            }

            log(`Confirming wave ${waveState.currentWave}/${waveState.totalWaves}`);

            // Select catapult target if needed
            if (targetBuilding && targetBuilding !== 'wall') {
                await actionDelay();

                const selectElement = document.querySelector('select[name="building"]') ||
                                     document.querySelector('#building');

                if (selectElement) {
                    const translations = BUILDING_I18N[targetBuilding] || [targetBuilding];

                    for (const option of selectElement.options) {
                        const optionText = option.textContent.toLowerCase().trim();
                        const optionValue = option.value.toLowerCase();

                        for (const translation of translations) {
                            if (optionText.includes(translation.toLowerCase()) ||
                                optionValue.includes(targetBuilding)) {
                                selectElement.value = option.value;
                                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                                log(`Selected catapult target: ${targetBuilding}`);
                                break;
                            }
                        }
                    }
                }
            }

            // Check for bot protection before confirming
            await waitForBotProtection();

            await actionDelay();

            const confirmBtn = document.getElementById('troop_confirm_submit') ||
                              document.querySelector('input[name="troop_confirm_submit"]');

            if (confirmBtn) {
                const isLastWave = waveState.currentWave >= waveState.totalWaves;

                if (isLastWave) {
                    // Last wave - clear everything and notify master
                    log('Last wave - notifying master');
                    Communication.clearInstruction();
                    Communication.clearWaveState();
                    localStorage.removeItem('catapult_target_building');

                    Communication.notifyMaster({
                        action: 'attack_complete',
                        coordinate: waveState.coordinate,
                        totalWaves: waveState.totalWaves
                    });
                } else {
                    // More waves to go - update wave state for next wave
                    log(`Wave ${waveState.currentWave} done, preparing wave ${waveState.currentWave + 1}`);

                    Communication.setWaveState({
                        ...waveState,
                        currentWave: waveState.currentWave + 1
                    });
                }

                log('Clicking confirm button');
                await actionDelay();
                confirmBtn.click();

                // After clicking, the game will redirect.
                // If not last wave, the checkRedirectNeeded() in init() will handle
                // redirecting back to rally point for the next wave.

                return true;
            }

            log('Confirm button not found');
            return false;
        },

        // Check if on confirmation screen
        isConfirmationScreen: function() {
            return window.location.href.includes('try=confirm') ||
                   document.getElementById('troop_confirm_submit') !== null;
        },

        // Process pending work
        processWork: async function() {
            // Check for ongoing wave state first
            const waveState = Communication.getWaveState();

            if (!waveState) {
                log('No wave state found');
                return;
            }

            log(`Processing wave ${waveState.currentWave}/${waveState.totalWaves}`);

            // If on confirmation screen, handle it
            if (this.isConfirmationScreen()) {
                await this.handleConfirmation();
                return;
            }

            // Get current wave info
            const waveInfo = this.getCurrentWave();
            if (!waveInfo) {
                log('Could not get current wave info');
                Communication.notifyMaster({
                    action: 'attack_failed',
                    reason: 'Could not get wave info'
                });
                Communication.clearWaveState();
                Communication.clearInstruction();
                return;
            }

            // CHECK TROOP AVAILABILITY FIRST
            const troopCheck = this.checkTroopAvailability(waveInfo.units);
            if (!troopCheck.hasEnough) {
                log('Not enough troops for attack!');

                // Build detailed message about missing troops
                const missingList = Object.entries(troopCheck.missing)
                    .map(([unit, info]) => `${unit}: ${info.available}/${info.required}`)
                    .join(', ');

                Communication.notifyMaster({
                    action: 'attack_failed',
                    reason: 'not_enough_troops',
                    missing: troopCheck.missing,
                    message: `Nincs elég csapat! Hiányzik: ${missingList}`
                });

                // Clear wave state so we don't keep retrying
                Communication.clearWaveState();
                Communication.clearInstruction();
                return;
            }

            // Use adjusted units (spy might be reduced if not available)
            waveInfo.units = troopCheck.adjusted;

            log('Troop check passed, filling form...');

            const filled = await this.fillAttackForm(waveInfo);
            if (!filled) {
                Communication.notifyMaster({
                    action: 'attack_failed',
                    reason: 'Could not fill form'
                });
                Communication.clearWaveState();
                Communication.clearInstruction();
                return;
            }

            await this.clickAttack();
        },

        // Check if we need to redirect to rally point for next wave
        checkRedirectNeeded: function() {
            const waveState = Communication.getWaveState();
            if (!waveState) return false;

            // If there are pending waves and we're NOT on the rally point form
            const isOnRallyPointForm = document.getElementById('unit_input_ram') !== null ||
                                       document.getElementById('unit_input_catapult') !== null;
            const isOnConfirmPage = this.isConfirmationScreen();

            if (!isOnRallyPointForm && !isOnConfirmPage && waveState.currentWave <= waveState.totalWaves) {
                // We're on some other page (success page?) but have pending waves
                // Redirect to rally point
                const baseUrl = window.location.href.split('?')[0].replace('/game.php', '');
                const villageParam = new URLSearchParams(window.location.search).get('village');
                const rallyPointUrl = `${baseUrl}/game.php?village=${villageParam}&screen=place&target=${waveState.villageId}`;
                log(`Redirecting to rally point for wave ${waveState.currentWave}/${waveState.totalWaves}`);
                window.location.href = rallyPointUrl;
                return true;
            }
            return false;
        },

        // Initialize worker controller
        init: function() {
            log('Worker controller initializing...');

            // First check if we need to redirect to rally point
            if (this.checkRedirectNeeded()) {
                return; // Will redirect, don't process further
            }

            // Check if there's pending work (wave state)
            if (this.hasPendingWork()) {
                const waveState = Communication.getWaveState();
                if (waveState) {
                    log(`Found pending work: Wave ${waveState.currentWave}/${waveState.totalWaves}`);
                }
                // Wait for page to fully load
                setTimeout(() => this.processWork(), 500);
            }
        }
    };

    // ==================== SETTINGS UI ====================

    function showSettings() {
        const buildingNames = {
            'main': 'Főhadiszállás',
            'barracks': 'Barakk',
            'stable': 'Istálló',
            'garage': 'Műhely',
            'wall': 'Fal',
            'smith': 'Kovácsműhely',
            'market': 'Piac'
        };

        const unitNames = {
            'axe': 'Bárdos',
            'spy': 'Felderítő',
            'ram': 'Faltörő',
            'catapult': 'Katapult'
        };

        // Get building/unit icons from game
        const getIcon = (type, name) => {
            const base = typeof image_base !== 'undefined' ? image_base : '/graphic/';
            if (type === 'building') {
                return `${base}buildings/${name}.png`;
            } else {
                return `${base}unit/unit_${name}.png`;
            }
        };

        // Generate wall template rows (levels 1-20)
        const wallTemplateRows = [];
        for (let level = 1; level <= 20; level++) {
            const template = CONFIG.wallTemplates[level] || { ram: 0, axe: 0, spy: 0 };
            wallTemplateRows.push(`
                <tr>
                    <td style="padding: 3px; background-color: #f4e4bc; text-align: center;">
                        <img src="${getIcon('building', 'wall')}" style="width: 16px; height: 16px; vertical-align: middle;">
                        <b>${level}</b>
                    </td>
                    <td style="padding: 3px; background-color: #fff5da;">
                        <img src="${getIcon('unit', 'ram')}" style="width: 14px; height: 14px; vertical-align: middle;">
                        <input type="number" id="wall_${level}_ram" value="${template.ram}" min="0" max="500" style="width: 45px; text-align: center;">
                    </td>
                    <td style="padding: 3px; background-color: #fff5da;">
                        <img src="${getIcon('unit', 'axe')}" style="width: 14px; height: 14px; vertical-align: middle;">
                        <input type="number" id="wall_${level}_axe" value="${template.axe}" min="0" max="1000" style="width: 45px; text-align: center;">
                    </td>
                    <td style="padding: 3px; background-color: #fff5da;">
                        <img src="${getIcon('unit', 'spy')}" style="width: 14px; height: 14px; vertical-align: middle;">
                        <input type="number" id="wall_${level}_spy" value="${template.spy}" min="0" max="100" style="width: 35px; text-align: center;">
                    </td>
                </tr>
            `);
        }

        const dialogHTML = `
            <div style="padding: 15px; min-width: 550px; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-top: 0;">Katapult / Faltörő Beállítások</h3>

                <table class="vis" style="width: 100%;">
                    <tr>
                        <th colspan="2">Épület Maximális Szintek</th>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 4px; font-size: 11px; color: #666; background: #fff5da;">
                            Ha az épület szintje magasabb ennél, támadás indul.
                        </td>
                    </tr>
                    ${Object.entries(CONFIG.maxLevels).map(([building, maxLevel]) => `
                        <tr>
                            <td style="padding: 4px; background-color: #f4e4bc;">
                                <img src="${getIcon('building', building)}" style="width: 18px; height: 18px; vertical-align: middle;">
                                ${buildingNames[building] || building}
                            </td>
                            <td style="padding: 4px; background-color: #fff5da; width: 80px;">
                                <input type="number" id="max_${building}" value="${maxLevel}" min="0" max="30"
                                       style="width: 50px; text-align: center;">
                            </td>
                        </tr>
                    `).join('')}
                </table>

                <table class="vis" style="width: 100%; margin-top: 10px;">
                    <tr>
                        <th colspan="2" style="cursor: pointer;" onclick="document.getElementById('catapult_escort_section').style.display = document.getElementById('catapult_escort_section').style.display === 'none' ? '' : 'none'; this.querySelector('.toggle').textContent = document.getElementById('catapult_escort_section').style.display === 'none' ? '▶' : '▼';">
                            <span class="toggle">▼</span> Katapult Kíséret
                        </th>
                    </tr>
                    <tbody id="catapult_escort_section">
                        <tr>
                            <td colspan="2" style="padding: 4px; font-size: 11px; color: #666; background: #fff5da;">
                                Kíséret épület támadásokhoz (katapult).
                            </td>
                        </tr>
                        ${Object.entries(CONFIG.catapultEscort).map(([unit, count]) => `
                            <tr>
                                <td style="padding: 4px; background-color: #f4e4bc;">
                                    <img src="${getIcon('unit', unit)}" style="width: 18px; height: 18px; vertical-align: middle;">
                                    ${unitNames[unit] || unit}
                                </td>
                                <td style="padding: 4px; background-color: #fff5da; width: 80px;">
                                    <input type="number" id="catapult_escort_${unit}" value="${count}" min="0" max="1000"
                                           style="width: 60px; text-align: center;">
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <table class="vis" style="width: 100%; margin-top: 10px;">
                    <tr>
                        <th colspan="4" style="cursor: pointer;" onclick="document.getElementById('wall_templates_section').style.display = document.getElementById('wall_templates_section').style.display === 'none' ? '' : 'none'; this.querySelector('.toggle').textContent = document.getElementById('wall_templates_section').style.display === 'none' ? '▶' : '▼';">
                            <span class="toggle">▼</span> Fal Sablonok (Faltörő + Kíséret)
                        </th>
                    </tr>
                    <tbody id="wall_templates_section">
                        <tr>
                            <td colspan="4" style="padding: 4px; font-size: 11px; color: #666; background: #fff5da;">
                                Faltörő támadások szintenként. Alapértelmezett értékek az hivatalos táblázatból.
                            </td>
                        </tr>
                        <tr style="background: #DED3B9;">
                            <td style="padding: 3px; text-align: center; font-weight: bold; width: 60px;">Szint</td>
                            <td style="padding: 3px; text-align: center; font-weight: bold;">Faltörő</td>
                            <td style="padding: 3px; text-align: center; font-weight: bold;">Bárdos</td>
                            <td style="padding: 3px; text-align: center; font-weight: bold;">Kém</td>
                        </tr>
                        ${wallTemplateRows.join('')}
                    </tbody>
                </table>

                <table class="vis" style="width: 100%; margin-top: 10px;">
                    <tr>
                        <th colspan="2">Időzítés</th>
                    </tr>
                    <tr>
                        <td style="padding: 4px; background-color: #f4e4bc;">Akció késleltetés (ms)</td>
                        <td style="padding: 4px; background-color: #fff5da;">
                            <input type="number" id="action_delay_min" value="${CONFIG.actionDelayMin}" min="100" max="2000" style="width: 50px;"> -
                            <input type="number" id="action_delay_max" value="${CONFIG.actionDelayMax}" min="100" max="2000" style="width: 50px;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; background-color: #f4e4bc;">Jelentés váltás (ms)</td>
                        <td style="padding: 4px; background-color: #fff5da;">
                            <input type="number" id="report_delay_min" value="${CONFIG.reportDelayMin}" min="100" max="3000" style="width: 50px;"> -
                            <input type="number" id="report_delay_max" value="${CONFIG.reportDelayMax}" min="100" max="3000" style="width: 50px;">
                        </td>
                    </tr>
                </table>

                <table class="vis" style="width: 100%; margin-top: 10px;">
                    <tr>
                        <th>Egyéb beállítások</th>
                    </tr>
                    <tr>
                        <td style="padding: 6px; background-color: #fff5da;">
                            <label style="display: block; margin-bottom: 5px; cursor: pointer;">
                                <input type="checkbox" id="spirit_mode" ${CONFIG.spiritMode ? 'checked' : ''}>
                                <strong>Spirit Mód</strong> - Minden épület egy jelentésből (fal → barakk → main → egyéb)
                            </label>
                            <label style="display: block; margin-bottom: 5px; cursor: pointer;">
                                <input type="checkbox" id="auto_advance" ${CONFIG.autoAdvanceReport ? 'checked' : ''}>
                                Automatikus következő jelentés
                            </label>
                            <label style="display: block; cursor: pointer;">
                                <input type="checkbox" id="debug_mode" ${CONFIG.debug ? 'checked' : ''}>
                                Debug mód (konzol log)
                            </label>
                        </td>
                    </tr>
                </table>

                <div style="margin-top: 15px; text-align: center;">
                    <input type="button" onclick="window.reportCatapultSaveSettings()" class="btn btn-confirm-yes" value="Mentés" style="margin-right: 5px;">
                    <input type="button" onclick="Dialog.close()" class="btn" value="Mégse">
                </div>
            </div>
        `;

        Dialog.show('report_catapult_settings', dialogHTML);
    }

    // Save settings handler
    window.reportCatapultSaveSettings = function() {
        // Update max levels
        Object.keys(CONFIG.maxLevels).forEach(building => {
            const input = document.getElementById('max_' + building);
            if (input) {
                CONFIG.maxLevels[building] = parseInt(input.value, 10) || 0;
            }
        });

        // Update catapult escort
        Object.keys(CONFIG.catapultEscort).forEach(unit => {
            const input = document.getElementById('catapult_escort_' + unit);
            if (input) {
                CONFIG.catapultEscort[unit] = parseInt(input.value, 10) || 0;
            }
        });

        // Update wall templates (levels 1-20)
        for (let level = 1; level <= 20; level++) {
            const ramInput = document.getElementById(`wall_${level}_ram`);
            const axeInput = document.getElementById(`wall_${level}_axe`);
            const spyInput = document.getElementById(`wall_${level}_spy`);
            if (ramInput && axeInput && spyInput) {
                CONFIG.wallTemplates[level] = {
                    ram: parseInt(ramInput.value, 10) || 0,
                    axe: parseInt(axeInput.value, 10) || 0,
                    spy: parseInt(spyInput.value, 10) || 0
                };
            }
        }

        // Update delays
        CONFIG.actionDelayMin = parseInt(document.getElementById('action_delay_min').value, 10) || 500;
        CONFIG.actionDelayMax = parseInt(document.getElementById('action_delay_max').value, 10) || 700;
        CONFIG.reportDelayMin = parseInt(document.getElementById('report_delay_min').value, 10) || 800;
        CONFIG.reportDelayMax = parseInt(document.getElementById('report_delay_max').value, 10) || 1200;

        // Update checkboxes
        CONFIG.spiritMode = document.getElementById('spirit_mode').checked;
        CONFIG.autoAdvanceReport = document.getElementById('auto_advance').checked;
        CONFIG.debug = document.getElementById('debug_mode').checked;

        saveConfig();
        Dialog.close();

        // Refresh page to apply changes
        location.reload();
    };

    // ==================== INITIALIZATION ====================

    function init() {
        loadConfig();

        const currentUrl = window.location.href;

        // FIRST: Check if there's pending wave work (runs on ANY page)
        // This handles redirect after attack confirmation
        const waveState = Communication.getWaveState();
        if (waveState && waveState.currentWave <= waveState.totalWaves) {
            log(`Found pending wave work: ${waveState.currentWave}/${waveState.totalWaves}`);
            WorkerController.init();
            return; // Worker will handle everything including redirects
        }

        // Normal initialization based on current page
        if (currentUrl.includes('screen=report')) {
            // On report screen - act as master
            MasterController.init();
        } else if (currentUrl.includes('screen=place')) {
            // On rally point - act as worker (might have new instruction)
            WorkerController.init();
        }

        log('Report Catapult script initialized');
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

