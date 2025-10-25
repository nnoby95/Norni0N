/*
 * AUTO RECRUITMENT SYSTEM FOR TRIBAL WARS
 * Version: 1.0.0
 * Author: Norbi0N
 * Description: Automated troop recruitment system with template-based goals
 * 
 * Features:
 * - Template-based recruitment (save/load/switch templates)
 * - Smart resource distribution across buildings
 * - Rotation system for incomplete units
 * - Continuous monitoring and auto-refill
 * - Customizable check intervals with randomization
 * - Collapsible UI sections for space efficiency
 */

// ============================================================================
// SCRIPT CONFIGURATION
// ============================================================================

var AutoRecruitConfig = {
    name: 'Auto Recruitment System',
    version: '1.0.0',
    author: 'Norbi0N',
    storageKey: 'autoRecruit_',
    
    // Building types
    buildings: {
        BARRACKS: 'barracks',
        STABLE: 'stable',
        GARAGE: 'garage'
    },
    
    // Maximum units per cycle
    maxUnitsPerCycle: {
        barracks: 20,
        stable: 10,
        garage: 5
    },
    
    // Unit to building mapping
    unitBuilding: {
        spear: 'barracks',
        sword: 'barracks',
        axe: 'barracks',
        archer: 'barracks',
        spy: 'stable',
        light: 'stable',
        marcher: 'stable',
        heavy: 'stable',
        ram: 'garage',
        catapult: 'garage'
    }
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

var AutoRecruitState = {
    isRunning: false,
    isPaused: false,
    currentTemplate: null,
    templates: [],
    workerTab: null,
    checkInterval: null,
    lastCheckTime: 0,
    nextCheckTime: 0,
    currentRotation: {
        barracks: 0,
        stable: 0,
        garage: 0
    },
    statistics: {
        totalChecks: 0,
        totalRecruitments: 0,
        lastRecruitmentTime: null,
        errors: 0
    },
    uiCollapsed: {
        main: false,
        templates: false,
        settings: false,
        controls: false,
        statistics: false
    }
};

// ============================================================================
// STORAGE MANAGEMENT
// ============================================================================

var AutoRecruitStorage = {
    // Save data to localStorage
    save: function(key, data) {
        try {
            const fullKey = AutoRecruitConfig.storageKey + game_data.village.id + '_' + key;
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('[AutoRecruit] Storage save error:', e);
            return false;
        }
    },
    
    // Load data from localStorage
    load: function(key, defaultValue = null) {
        try {
            const fullKey = AutoRecruitConfig.storageKey + game_data.village.id + '_' + key;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('[AutoRecruit] Storage load error:', e);
            return defaultValue;
        }
    },
    
    // Delete data from localStorage
    remove: function(key) {
        try {
            const fullKey = AutoRecruitConfig.storageKey + game_data.village.id + '_' + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (e) {
            console.error('[AutoRecruit] Storage remove error:', e);
            return false;
        }
    },
    
    // Save all templates
    saveTemplates: function(templates) {
        return this.save('templates', templates);
    },
    
    // Load all templates
    loadTemplates: function() {
        return this.load('templates', []);
    },
    
    // Save settings
    saveSettings: function(settings) {
        return this.save('settings', settings);
    },
    
    // Load settings
    loadSettings: function() {
        return this.load('settings', {
            checkIntervalMinutes: 5,
            randomizationSeconds: 60,
            resourceBudgetPercent: 60,
            buildingDistribution: {
                barracks: 50,
                stable: 30,
                garage: 20
            },
            activeTemplateId: null
        });
    }
};

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

var TemplateManager = {
    // Create new template
    createTemplate: function(name, units = {}) {
        return {
            id: Date.now(),
            name: name,
            units: units, // { spear: 200, axe: 200, spy: 50, ... }
            createdAt: new Date().toISOString(),
            lastUsed: null
        };
    },
    
    // Add template to list
    addTemplate: function(template) {
        AutoRecruitState.templates.push(template);
        AutoRecruitStorage.saveTemplates(AutoRecruitState.templates);
        return template;
    },
    
    // Update template
    updateTemplate: function(templateId, updates) {
        const index = AutoRecruitState.templates.findIndex(t => t.id === templateId);
        if (index !== -1) {
            AutoRecruitState.templates[index] = {
                ...AutoRecruitState.templates[index],
                ...updates
            };
            AutoRecruitStorage.saveTemplates(AutoRecruitState.templates);
            return true;
        }
        return false;
    },
    
    // Delete template
    deleteTemplate: function(templateId) {
        AutoRecruitState.templates = AutoRecruitState.templates.filter(t => t.id !== templateId);
        AutoRecruitStorage.saveTemplates(AutoRecruitState.templates);
        return true;
    },
    
    // Get template by ID
    getTemplate: function(templateId) {
        return AutoRecruitState.templates.find(t => t.id === templateId);
    },
    
    // Set active template
    setActiveTemplate: function(templateId) {
        const template = this.getTemplate(templateId);
        if (template) {
            AutoRecruitState.currentTemplate = template;
            template.lastUsed = new Date().toISOString();
            
            const settings = AutoRecruitStorage.loadSettings();
            settings.activeTemplateId = templateId;
            AutoRecruitStorage.saveSettings(settings);
            
            this.updateTemplate(templateId, { lastUsed: template.lastUsed });
            return true;
        }
        return false;
    },
    
    // Load templates from storage
    loadTemplates: function() {
        AutoRecruitState.templates = AutoRecruitStorage.loadTemplates();
        
        // Set active template if exists
        const settings = AutoRecruitStorage.loadSettings();
        if (settings.activeTemplateId) {
            const template = this.getTemplate(settings.activeTemplateId);
            if (template) {
                AutoRecruitState.currentTemplate = template;
            }
        }
    }
};

// ============================================================================
// DATA EXTRACTION (Worker Tab)
// ============================================================================

var DataExtractor = {
    // Extract resources from page
    extractResources: function(doc = document) {
        return {
            wood: parseInt(doc.getElementById('wood')?.textContent || 0),
            stone: parseInt(doc.getElementById('stone')?.textContent || 0),
            iron: parseInt(doc.getElementById('iron')?.textContent || 0)
        };
    },
    
    // Extract population data
    extractPopulation: function(doc = document) {
        const current = parseInt(doc.getElementById('pop_current_label')?.textContent || 0);
        const max = parseInt(doc.getElementById('pop_max_label')?.textContent || 0);
        return {
            current: current,
            max: max,
            available: max - current
        };
    },
    
    // Extract training queue
    extractQueue: function(doc = document) {
        const queue = [];
        const queueRows = doc.querySelectorAll('table tbody tr.lit');
        
        queueRows.forEach(row => {
            const unitSprite = row.querySelector('.unit_sprite');
            if (unitSprite) {
                const classList = Array.from(unitSprite.classList);
                const unitType = classList.find(c => c !== 'unit_sprite' && c !== 'unit_sprite_smaller');
                
                const quantityText = row.querySelector('td.lit-item')?.textContent || '';
                const quantityMatch = quantityText.match(/(\d+)/);
                const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;
                
                if (unitType && quantity > 0) {
                    queue.push({
                        unitType: unitType,
                        quantity: quantity
                    });
                }
            }
        });
        
        return queue;
    },
    
    // Extract total troops (in village / total)
    extractTroops: function(doc = document) {
        const troops = {};
        const unitRows = doc.querySelectorAll('table.vis tbody tr.row_a, table.vis tbody tr.row_b');
        
        unitRows.forEach(row => {
            const unitLink = row.querySelector('.unit_link');
            if (unitLink) {
                const unitType = unitLink.getAttribute('data-unit');
                const troopCountCell = row.querySelectorAll('td')[2];
                
                if (troopCountCell) {
                    const countText = troopCountCell.textContent.trim();
                    const match = countText.match(/(\d+)\/(\d+)/);
                    
                    if (match) {
                        troops[unitType] = {
                            inVillage: parseInt(match[1]),
                            total: parseInt(match[2])
                        };
                    }
                }
            }
        });
        
        return troops;
    },
    
    // Extract unit costs
    extractUnitCosts: function(doc = document) {
        const costs = {};
        const unitRows = doc.querySelectorAll('table.vis tbody tr.row_a, table.vis tbody tr.row_b');
        
        unitRows.forEach(row => {
            const unitLink = row.querySelector('.unit_link');
            if (unitLink) {
                const unitType = unitLink.getAttribute('data-unit');
                
                const woodCost = parseInt(doc.getElementById(unitType + '_0_cost_wood')?.textContent || 0);
                const stoneCost = parseInt(doc.getElementById(unitType + '_0_cost_stone')?.textContent || 0);
                const ironCost = parseInt(doc.getElementById(unitType + '_0_cost_iron')?.textContent || 0);
                const popCost = parseInt(doc.getElementById(unitType + '_0_cost_pop')?.textContent || 0);
                
                costs[unitType] = {
                    wood: woodCost,
                    stone: stoneCost,
                    iron: ironCost,
                    pop: popCost
                };
            }
        });
        
        return costs;
    },
    
    // Extract all data at once
    extractAllData: function(doc = document) {
        return {
            resources: this.extractResources(doc),
            population: this.extractPopulation(doc),
            queue: this.extractQueue(doc),
            troops: this.extractTroops(doc),
            unitCosts: this.extractUnitCosts(doc)
        };
    }
};

// ============================================================================
// RECRUITMENT CALCULATOR
// ============================================================================

var RecruitmentCalculator = {
    // Calculate units needed based on template
    calculateNeeded: function(template, currentTroops) {
        const needed = {};
        
        for (const [unitType, goalAmount] of Object.entries(template.units)) {
            const currentAmount = currentTroops[unitType]?.inVillage || 0;
            const difference = goalAmount - currentAmount;
            
            if (difference > 0) {
                needed[unitType] = difference;
            }
        }
        
        return needed;
    },
    
    // Group units by building
    groupByBuilding: function(units) {
        const grouped = {
            barracks: [],
            stable: [],
            garage: []
        };
        
        for (const unitType of units) {
            const building = AutoRecruitConfig.unitBuilding[unitType];
            if (building && grouped[building]) {
                grouped[building].push(unitType);
            }
        }
        
        return grouped;
    },
    
    // Get next unit in rotation for a building
    getNextUnit: function(building, availableUnits) {
        const rotation = AutoRecruitState.currentRotation[building] || 0;
        const units = availableUnits[building] || [];
        
        if (units.length === 0) return null;
        
        const nextUnit = units[rotation % units.length];
        AutoRecruitState.currentRotation[building] = (rotation + 1) % units.length;
        
        return nextUnit;
    },
    
    // Calculate how many units can be recruited with available resources
    calculateAffordable: function(unitType, resources, population, unitCosts) {
        const cost = unitCosts[unitType];
        if (!cost) return 0;
        
        const affordableByWood = Math.floor(resources.wood / cost.wood);
        const affordableByStone = Math.floor(resources.stone / cost.stone);
        const affordableByIron = Math.floor(resources.iron / cost.iron);
        const affordableByPop = Math.floor(population.available / cost.pop);
        
        return Math.min(affordableByWood, affordableByStone, affordableByIron, affordableByPop);
    },
    
    // Calculate recruitment plan
    calculateRecruitmentPlan: function(gameData, settings) {
        const template = AutoRecruitState.currentTemplate;
        if (!template) return null;
        
        // Calculate what's needed
        const needed = this.calculateNeeded(template, gameData.troops);
        const neededUnits = Object.keys(needed);
        
        if (neededUnits.length === 0) {
            return { unitsToRecruit: {}, message: 'Template complete' };
        }
        
        // Group by building
        const groupedUnits = this.groupByBuilding(neededUnits);
        
        // Calculate available budget
        const totalBudget = {
            wood: Math.floor(gameData.resources.wood * (settings.resourceBudgetPercent / 100)),
            stone: Math.floor(gameData.resources.stone * (settings.resourceBudgetPercent / 100)),
            iron: Math.floor(gameData.resources.iron * (settings.resourceBudgetPercent / 100))
        };
        
        // Distribute budget across buildings
        const buildingBudgets = {};
        for (const [building, percent] of Object.entries(settings.buildingDistribution)) {
            buildingBudgets[building] = {
                wood: Math.floor(totalBudget.wood * (percent / 100)),
                stone: Math.floor(totalBudget.stone * (percent / 100)),
                iron: Math.floor(totalBudget.iron * (percent / 100))
            };
        }
        
        // Calculate recruitment for each building
        const unitsToRecruit = {};
        
        for (const building of ['barracks', 'stable', 'garage']) {
            if (groupedUnits[building].length === 0) continue;
            
            // Get next unit in rotation
            const unitType = this.getNextUnit(building, groupedUnits);
            if (!unitType) continue;
            
            // Calculate how many we can afford
            const affordable = this.calculateAffordable(
                unitType,
                buildingBudgets[building],
                gameData.population,
                gameData.unitCosts
            );
            
            // Apply building maximum limit
            const maxPerCycle = AutoRecruitConfig.maxUnitsPerCycle[building];
            const amount = Math.min(affordable, maxPerCycle, needed[unitType]);
            
            if (amount > 0) {
                unitsToRecruit[unitType] = amount;
            }
        }
        
        return {
            unitsToRecruit: unitsToRecruit,
            message: Object.keys(unitsToRecruit).length > 0 ? 'Recruitment planned' : 'Insufficient resources'
        };
    }
};

// ============================================================================
// WORKER TAB CONTROLLER
// ============================================================================

var WorkerController = {
    // Open worker tab
    openWorkerTab: function() {
        const url = `/game.php?village=${game_data.village.id}&screen=train`;
        AutoRecruitState.workerTab = window.open(url, '_blank');
        
        return new Promise((resolve, reject) => {
            if (!AutoRecruitState.workerTab) {
                reject(new Error('Failed to open worker tab'));
                return;
            }
            
            // Wait for tab to load
            setTimeout(() => {
                resolve(AutoRecruitState.workerTab);
            }, 3000);
        });
    },
    
    // Execute recruitment in worker tab
    executeRecruitment: function(unitsToRecruit) {
        return new Promise((resolve, reject) => {
            try {
                const workerTab = AutoRecruitState.workerTab;
                if (!workerTab || workerTab.closed) {
                    reject(new Error('Worker tab not available'));
                    return;
                }
                
                const doc = workerTab.document;
                const form = doc.getElementById('train_form');
                
                if (!form) {
                    reject(new Error('Training form not found'));
                    return;
                }
                
                // Fill in unit quantities
                let filledAny = false;
                for (const [unitType, quantity] of Object.entries(unitsToRecruit)) {
                    const input = doc.getElementById(unitType + '_0');
                    if (input) {
                        input.value = quantity;
                        filledAny = true;
                    }
                }
                
                if (!filledAny) {
                    reject(new Error('No units could be filled'));
                    return;
                }
                
                // Submit form
                setTimeout(() => {
                    form.submit();
                    
                    // Close worker tab after submission
                    setTimeout(() => {
                        if (workerTab && !workerTab.closed) {
                            workerTab.close();
                        }
                        AutoRecruitState.workerTab = null;
                        resolve(unitsToRecruit);
                    }, 2000);
                }, 500);
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Main recruitment process
    performRecruitment: async function() {
        try {
            console.log('[AutoRecruit] Starting recruitment process...');
            
            // Open worker tab
            const workerTab = await this.openWorkerTab();
            
            // Extract game data
            const gameData = DataExtractor.extractAllData(workerTab.document);
            console.log('[AutoRecruit] Extracted data:', gameData);
            
            // Calculate recruitment plan
            const settings = AutoRecruitStorage.loadSettings();
            const plan = RecruitmentCalculator.calculateRecruitmentPlan(gameData, settings);
            console.log('[AutoRecruit] Recruitment plan:', plan);
            
            // Execute recruitment if needed
            if (Object.keys(plan.unitsToRecruit).length > 0) {
                await this.executeRecruitment(plan.unitsToRecruit);
                
                // Update statistics
                AutoRecruitState.statistics.totalRecruitments++;
                AutoRecruitState.statistics.lastRecruitmentTime = new Date().toISOString();
                
                console.log('[AutoRecruit] Recruitment successful:', plan.unitsToRecruit);
                UI.SuccessMessage('Recruitment completed successfully');
                
                return { success: true, recruited: plan.unitsToRecruit };
            } else {
                // Close worker tab if no recruitment needed
                if (workerTab && !workerTab.closed) {
                    workerTab.close();
                }
                AutoRecruitState.workerTab = null;
                
                console.log('[AutoRecruit] No recruitment needed:', plan.message);
                return { success: true, recruited: {}, message: plan.message };
            }
            
        } catch (error) {
            console.error('[AutoRecruit] Recruitment error:', error);
            AutoRecruitState.statistics.errors++;
            
            // Clean up worker tab on error
            if (AutoRecruitState.workerTab && !AutoRecruitState.workerTab.closed) {
                AutoRecruitState.workerTab.close();
            }
            AutoRecruitState.workerTab = null;
            
            UI.ErrorMessage('Recruitment failed: ' + error.message);
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// MAIN ENGINE
// ============================================================================

var AutoRecruitEngine = {
    // Start the engine
    start: function() {
        if (AutoRecruitState.isRunning) {
            UI.InfoMessage('Auto recruitment is already running');
            return;
        }
        
        if (!AutoRecruitState.currentTemplate) {
            UI.ErrorMessage('Please select a template first');
            return;
        }
        
        AutoRecruitState.isRunning = true;
        AutoRecruitState.isPaused = false;
        
        console.log('[AutoRecruit] Engine started');
        UI.SuccessMessage('Auto recruitment started');
        
        // Start the check loop
        this.scheduleNextCheck();
        
        // Update UI
        this.updateUI();
    },
    
    // Stop the engine
    stop: function() {
        AutoRecruitState.isRunning = false;
        
        if (AutoRecruitState.checkInterval) {
            clearTimeout(AutoRecruitState.checkInterval);
            AutoRecruitState.checkInterval = null;
        }
        
        // Close worker tab if open
        if (AutoRecruitState.workerTab && !AutoRecruitState.workerTab.closed) {
            AutoRecruitState.workerTab.close();
        }
        AutoRecruitState.workerTab = null;
        
        console.log('[AutoRecruit] Engine stopped');
        UI.InfoMessage('Auto recruitment stopped');
        
        // Update UI
        this.updateUI();
    },
    
    // Pause the engine
    pause: function() {
        AutoRecruitState.isPaused = true;
        UI.InfoMessage('Auto recruitment paused');
        this.updateUI();
    },
    
    // Resume the engine
    resume: function() {
        AutoRecruitState.isPaused = false;
        UI.SuccessMessage('Auto recruitment resumed');
        this.updateUI();
    },
    
    // Schedule next check
    scheduleNextCheck: function() {
        if (!AutoRecruitState.isRunning) return;
        
        const settings = AutoRecruitStorage.loadSettings();
        const baseInterval = settings.checkIntervalMinutes * 60 * 1000; // Convert to milliseconds
        const randomization = Math.floor(Math.random() * settings.randomizationSeconds * 1000);
        const totalInterval = baseInterval + randomization;
        
        AutoRecruitState.nextCheckTime = Date.now() + totalInterval;
        
        console.log(`[AutoRecruit] Next check in ${Math.round(totalInterval / 1000)} seconds`);
        
        AutoRecruitState.checkInterval = setTimeout(() => {
            this.performCheck();
        }, totalInterval);
    },
    
    // Perform a check cycle
    performCheck: async function() {
        if (!AutoRecruitState.isRunning || AutoRecruitState.isPaused) {
            this.scheduleNextCheck();
            return;
        }
        
        console.log('[AutoRecruit] Performing check cycle...');
        AutoRecruitState.statistics.totalChecks++;
        AutoRecruitState.lastCheckTime = Date.now();
        
        // Update UI
        this.updateUI();
        
        // Perform recruitment
        await WorkerController.performRecruitment();
        
        // Schedule next check
        this.scheduleNextCheck();
    },
    
    // Update UI with current status
    updateUI: function() {
        // Update status display
        const statusElement = document.getElementById('autoRecruit_status');
        if (statusElement) {
            if (AutoRecruitState.isRunning) {
                if (AutoRecruitState.isPaused) {
                    statusElement.textContent = 'Paused';
                    statusElement.className = 'paused';
                } else {
                    statusElement.textContent = 'Running';
                    statusElement.className = 'running';
                }
            } else {
                statusElement.textContent = 'Stopped';
                statusElement.className = 'stopped';
            }
        }
        
        // Update countdown visibility
        const countdownContainer = document.getElementById('autoRecruit_countdown_container');
        if (countdownContainer) {
            if (AutoRecruitState.isRunning && !AutoRecruitState.isPaused) {
                countdownContainer.style.display = 'flex';
            } else {
                countdownContainer.style.display = 'none';
            }
        }
    },
    
    // Update countdown timer
    updateCountdown: function() {
        if (!AutoRecruitState.isRunning || AutoRecruitState.isPaused) {
            return;
        }
        
        const countdownElement = document.getElementById('autoRecruit_countdown');
        if (!countdownElement) return;
        
        const now = Date.now();
        const remaining = Math.max(0, AutoRecruitState.nextCheckTime - now);
        
        if (remaining === 0) {
            countdownElement.textContent = 'Checking...';
            return;
        }
        
        const seconds = Math.floor(remaining / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        const displayHours = hours;
        const displayMinutes = minutes % 60;
        const displaySeconds = seconds % 60;
        
        const parts = [];
        if (displayHours > 0) parts.push(`${displayHours}h`);
        if (displayMinutes > 0) parts.push(`${displayMinutes}m`);
        parts.push(`${displaySeconds}s`);
        
        countdownElement.textContent = parts.join(' ');
    },
    
    // Toggle section collapse
    toggleSection: function(sectionName) {
        const content = document.getElementById('section_' + sectionName);
        const button = document.querySelector(`[data-section="${sectionName}"]`);
        
        if (!content || !button) return;
        
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            content.classList.remove('collapsed');
            button.textContent = '−';
            AutoRecruitState.uiCollapsed[sectionName] = false;
        } else {
            content.classList.add('collapsed');
            button.textContent = '+';
            AutoRecruitState.uiCollapsed[sectionName] = true;
        }
    },
    
    // Toggle main container
    toggleMain: function() {
        const content = document.getElementById('autoRecruit_mainContent');
        const button = document.getElementById('autoRecruit_toggleMain');
        
        if (!content || !button) return;
        
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            content.classList.remove('collapsed');
            button.textContent = '−';
            AutoRecruitState.uiCollapsed.main = false;
        } else {
            content.classList.add('collapsed');
            button.textContent = '+';
            AutoRecruitState.uiCollapsed.main = true;
        }
    }
};

// ============================================================================
// UI BUILDER
// ============================================================================

var UIBuilder = {
    // Build main interface with collapsible sections
    buildMainUI: function() {
        const mainDiv = document.createElement('div');
        mainDiv.id = 'autoRecruitMain';
        mainDiv.className = 'auto-recruit-container';
        
        mainDiv.innerHTML = `
            <div class="auto-recruit-header">
                <h2>${AutoRecruitConfig.name} v${AutoRecruitConfig.version}</h2>
                <button id="autoRecruit_toggleMain" class="toggle-btn" title="Minimize/Maximize">−</button>
            </div>
            
            <div id="autoRecruit_mainContent" class="auto-recruit-body">
                <div class="auto-recruit-status-bar">
                    <div class="status-item">
                        <strong>Status:</strong> <span id="autoRecruit_status">Stopped</span>
                    </div>
                    <div class="status-item" id="autoRecruit_countdown_container" style="display: none;">
                        <strong>Next check in:</strong> <span id="autoRecruit_countdown">--</span>
                    </div>
                </div>
                
                <div class="auto-recruit-section">
                    <div class="section-header">
                        <h3>Templates</h3>
                        <button class="toggle-btn" data-section="templates">−</button>
                    </div>
                    <div class="section-content" id="section_templates">
                        <div id="autoRecruit_templateList"></div>
                        <button id="autoRecruit_newTemplate" class="btn">Create New Template</button>
                    </div>
                </div>
                
                <div class="auto-recruit-section">
                    <div class="section-header">
                        <h3>Settings</h3>
                        <button class="toggle-btn" data-section="settings">−</button>
                    </div>
                    <div class="section-content" id="section_settings">
                        <div class="auto-recruit-settings">
                            <div class="settings-row">
                                <label>
                                    <span class="label-text">Check Interval (minutes):</span>
                                    <input type="number" id="autoRecruit_checkInterval" min="1" max="60" value="5">
                                </label>
                            </div>
                            
                            <div class="settings-row">
                                <label>
                                    <span class="label-text">Randomization (seconds):</span>
                                    <input type="number" id="autoRecruit_randomization" min="0" max="300" value="60">
                                </label>
                            </div>
                            
                            <div class="settings-row">
                                <label>
                                    <span class="label-text">Resource Budget (%):</span>
                                    <input type="number" id="autoRecruit_resourceBudget" min="1" max="100" value="60">
                                </label>
                            </div>
                            
                            <h4>Building Distribution</h4>
                            
                            <div class="settings-row">
                                <label>
                                    <span class="label-text">Barracks (%):</span>
                                    <input type="number" id="autoRecruit_barracksPercent" min="0" max="100" value="50">
                                </label>
                            </div>
                            
                            <div class="settings-row">
                                <label>
                                    <span class="label-text">Stable (%):</span>
                                    <input type="number" id="autoRecruit_stablePercent" min="0" max="100" value="30">
                                </label>
                            </div>
                            
                            <div class="settings-row">
                                <label>
                                    <span class="label-text">Garage (%):</span>
                                    <input type="number" id="autoRecruit_garagePercent" min="0" max="100" value="20">
                                </label>
                            </div>
                            
                            <button id="autoRecruit_saveSettings" class="btn">Save Settings</button>
                        </div>
                    </div>
                </div>
                
                <div class="auto-recruit-section">
                    <div class="section-header">
                        <h3>Controls</h3>
                        <button class="toggle-btn" data-section="controls">−</button>
                    </div>
                    <div class="section-content" id="section_controls">
                        <div class="auto-recruit-controls">
                            <button id="autoRecruit_start" class="btn btn-confirm-yes">Start</button>
                            <button id="autoRecruit_pause" class="btn">Pause</button>
                            <button id="autoRecruit_stop" class="btn btn-cancel">Stop</button>
                        </div>
                    </div>
                </div>
                
                <div class="auto-recruit-section">
                    <div class="section-header">
                        <h3>Statistics</h3>
                        <button class="toggle-btn" data-section="statistics">−</button>
                    </div>
                    <div class="section-content" id="section_statistics">
                        <div id="autoRecruit_statistics">
                            <div class="stat-row">
                                <span class="stat-label">Total Checks:</span>
                                <span class="stat-value" id="stat_checks">0</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Total Recruitments:</span>
                                <span class="stat-value" id="stat_recruitments">0</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Last Recruitment:</span>
                                <span class="stat-value" id="stat_lastRecruit">Never</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Errors:</span>
                                <span class="stat-value" id="stat_errors">0</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="auto-recruit-footer">
                    <small>Created by ${AutoRecruitConfig.author}</small>
                </div>
            </div>
            
            <style>
                .auto-recruit-container {
                    background: #f4e4bc;
                    border: 2px solid #7d510f;
                    border-radius: 8px;
                    margin: 20px 0;
                    max-width: 900px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .auto-recruit-header {
                    background: linear-gradient(to bottom, #c1a264, #9d8653);
                    border-bottom: 2px solid #7d510f;
                    padding: 12px 15px;
                    border-radius: 6px 6px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .auto-recruit-header h2 {
                    margin: 0;
                    color: #fff;
                    font-size: 18px;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                }
                
                .toggle-btn {
                    background: #7d510f;
                    color: #fff;
                    border: 1px solid #5a3a0a;
                    border-radius: 3px;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    line-height: 1;
                    padding: 0;
                    transition: all 0.2s;
                }
                
                .toggle-btn:hover {
                    background: #5a3a0a;
                }
                
                .auto-recruit-body {
                    padding: 15px;
                    transition: max-height 0.3s ease;
                    overflow: hidden;
                }
                
                .auto-recruit-body.collapsed {
                    max-height: 0;
                    padding: 0 15px;
                }
                
                .auto-recruit-status-bar {
                    background: #fff;
                    border: 1px solid #c1a264;
                    border-radius: 4px;
                    padding: 10px 15px;
                    margin-bottom: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                
                .status-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .status-item strong {
                    color: #7d510f;
                }
                
                #autoRecruit_status {
                    padding: 3px 10px;
                    border-radius: 3px;
                    font-weight: bold;
                }
                
                #autoRecruit_status.running {
                    background: #90EE90;
                    color: #006400;
                }
                
                #autoRecruit_status.paused {
                    background: #FFD700;
                    color: #8B4513;
                }
                
                #autoRecruit_status.stopped {
                    background: #FFB6C1;
                    color: #8B0000;
                }
                
                #autoRecruit_countdown {
                    font-family: monospace;
                    font-weight: bold;
                    color: #7d510f;
                }
                
                .auto-recruit-section {
                    background: #fff;
                    border: 1px solid #c1a264;
                    border-radius: 4px;
                    margin-bottom: 10px;
                    overflow: hidden;
                }
                
                .section-header {
                    background: linear-gradient(to bottom, #e8d4a0, #d4c088);
                    padding: 8px 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    border-bottom: 1px solid #c1a264;
                }
                
                .section-header h3 {
                    margin: 0;
                    color: #7d510f;
                    font-size: 16px;
                }
                
                .section-content {
                    padding: 15px;
                    transition: max-height 0.3s ease, padding 0.3s ease;
                    overflow: hidden;
                }
                
                .section-content.collapsed {
                    max-height: 0;
                    padding: 0 15px;
                    border-bottom: none;
                }
                
                .auto-recruit-settings .settings-row {
                    margin-bottom: 12px;
                }
                
                .auto-recruit-settings label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                }
                
                .auto-recruit-settings .label-text {
                    color: #5a3a0a;
                }
                
                .auto-recruit-settings input {
                    width: 100px;
                    padding: 5px 10px;
                    border: 1px solid #c1a264;
                    border-radius: 3px;
                    font-size: 14px;
                }
                
                .auto-recruit-settings h4 {
                    margin: 15px 0 10px 0;
                    padding-top: 10px;
                    color: #7d510f;
                    border-top: 1px solid #e0e0e0;
                    font-size: 14px;
                }
                
                .auto-recruit-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .auto-recruit-controls button {
                    flex: 1;
                    padding: 10px;
                    font-weight: bold;
                }
                
                #autoRecruit_templateList {
                    margin-bottom: 15px;
                    min-height: 50px;
                    max-height: 300px;
                    overflow-y: auto;
                }
                
                .template-item {
                    background: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 10px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                }
                
                .template-item:hover {
                    background: #f0f0f0;
                }
                
                .template-item.active {
                    background: #d4e4bc;
                    border-color: #7d8f0f;
                    box-shadow: 0 0 0 2px rgba(125, 143, 15, 0.2);
                }
                
                .template-item-name {
                    font-weight: 600;
                    flex-grow: 1;
                    color: #5a3a0a;
                }
                
                .template-item-actions {
                    display: flex;
                    gap: 5px;
                }
                
                .template-item-actions .btn {
                    padding: 4px 10px;
                    font-size: 12px;
                }
                
                #autoRecruit_statistics .stat-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                #autoRecruit_statistics .stat-row:last-child {
                    border-bottom: none;
                }
                
                .stat-label {
                    color: #5a3a0a;
                    font-weight: 600;
                }
                
                .stat-value {
                    color: #7d510f;
                    font-weight: bold;
                }
                
                .auto-recruit-footer {
                    text-align: center;
                    padding: 10px;
                    border-top: 1px solid #c1a264;
                    color: #7d510f;
                    font-style: italic;
                }
            </style>
        `;
        
        return mainDiv;
    },
    
    // Render template list
    renderTemplateList: function() {
        const container = document.getElementById('autoRecruit_templateList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (AutoRecruitState.templates.length === 0) {
            container.innerHTML = '<p style="color: #999; font-style: italic;">No templates created yet</p>';
            return;
        }
        
        AutoRecruitState.templates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'template-item';
            if (AutoRecruitState.currentTemplate && AutoRecruitState.currentTemplate.id === template.id) {
                item.classList.add('active');
            }
            
            const unitCount = Object.keys(template.units).length;
            const totalUnits = Object.values(template.units).reduce((sum, val) => sum + val, 0);
            
            item.innerHTML = `
                <div class="template-item-name">
                    ${template.name}
                    <small style="color: #666;"> (${unitCount} types, ${totalUnits} total)</small>
                </div>
                <div class="template-item-actions">
                    <button class="btn btn-template-select" data-id="${template.id}">Select</button>
                    <button class="btn btn-template-edit" data-id="${template.id}">Edit</button>
                    <button class="btn btn-cancel btn-template-delete" data-id="${template.id}">Delete</button>
                </div>
            `;
            
            container.appendChild(item);
        });
        
        // Attach event listeners
        this.attachTemplateListeners();
    },
    
    // Attach event listeners to template buttons
    attachTemplateListeners: function() {
        // Select template
        document.querySelectorAll('.btn-template-select').forEach(btn => {
            btn.addEventListener('click', function() {
                const templateId = parseInt(this.getAttribute('data-id'));
                TemplateManager.setActiveTemplate(templateId);
                UIBuilder.renderTemplateList();
                UI.SuccessMessage('Template activated');
            });
        });
        
        // Edit template
        document.querySelectorAll('.btn-template-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const templateId = parseInt(this.getAttribute('data-id'));
                UIBuilder.showTemplateEditor(templateId);
            });
        });
        
        // Delete template
        document.querySelectorAll('.btn-template-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const templateId = parseInt(this.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this template?')) {
                    TemplateManager.deleteTemplate(templateId);
                    UIBuilder.renderTemplateList();
                    UI.SuccessMessage('Template deleted');
                }
            });
        });
    },
    
    // Show template editor dialog
    showTemplateEditor: function(templateId = null) {
        const isEdit = templateId !== null;
        const template = isEdit ? TemplateManager.getTemplate(templateId) : null;
        
        const unitTypes = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult'];
        
        let unitInputs = '';
        unitTypes.forEach(unitType => {
            const currentValue = template ? (template.units[unitType] || 0) : 0;
            unitInputs += `
                <label>
                    ${unitType.charAt(0).toUpperCase() + unitType.slice(1)}:
                    <input type="number" class="template-unit-input" data-unit="${unitType}" min="0" value="${currentValue}">
                </label>
            `;
        });
        
        const dialog = `
            <div id="templateEditorDialog" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border: 2px solid #7d510f;
                border-radius: 8px;
                padding: 20px;
                z-index: 10000;
                min-width: 400px;
                max-width: 600px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            ">
                <h3 style="margin-top: 0;">${isEdit ? 'Edit Template' : 'Create New Template'}</h3>
                
                <label style="display: block; margin-bottom: 15px;">
                    Template Name:
                    <input type="text" id="templateName" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #c1a264; border-radius: 3px;" value="${template ? template.name : ''}">
                </label>
                
                <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 15px; border-radius: 3px;">
                    <h4 style="margin-top: 0;">Unit Goals</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${unitInputs}
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="templateSave" class="btn btn-confirm-yes">Save</button>
                    <button id="templateCancel" class="btn btn-cancel">Cancel</button>
                </div>
            </div>
            
            <div id="templateEditorOverlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            "></div>
            
            <style>
                #templateEditorDialog label {
                    display: block;
                    margin-bottom: 10px;
                    font-weight: 600;
                }
                
                #templateEditorDialog input[type="number"] {
                    width: 100%;
                    padding: 4px 8px;
                    border: 1px solid #c1a264;
                    border-radius: 3px;
                    margin-top: 3px;
                }
            </style>
        `;
        
        // Insert dialog
        const dialogContainer = document.createElement('div');
        dialogContainer.innerHTML = dialog;
        document.body.appendChild(dialogContainer);
        
        // Event listeners
        document.getElementById('templateSave').addEventListener('click', function() {
            const name = document.getElementById('templateName').value.trim();
            if (!name) {
                UI.ErrorMessage('Please enter a template name');
                return;
            }
            
            const units = {};
            document.querySelectorAll('.template-unit-input').forEach(input => {
                const unitType = input.getAttribute('data-unit');
                const value = parseInt(input.value) || 0;
                if (value > 0) {
                    units[unitType] = value;
                }
            });
            
            if (Object.keys(units).length === 0) {
                UI.ErrorMessage('Please set at least one unit goal');
                return;
            }
            
            if (isEdit) {
                TemplateManager.updateTemplate(templateId, { name: name, units: units });
                UI.SuccessMessage('Template updated');
            } else {
                const newTemplate = TemplateManager.createTemplate(name, units);
                TemplateManager.addTemplate(newTemplate);
                UI.SuccessMessage('Template created');
            }
            
            UIBuilder.renderTemplateList();
            dialogContainer.remove();
        });
        
        document.getElementById('templateCancel').addEventListener('click', function() {
            dialogContainer.remove();
        });
        
        document.getElementById('templateEditorOverlay').addEventListener('click', function() {
            dialogContainer.remove();
        });
    },
    
    // Load settings into UI
    loadSettingsToUI: function() {
        const settings = AutoRecruitStorage.loadSettings();
        
        document.getElementById('autoRecruit_checkInterval').value = settings.checkIntervalMinutes;
        document.getElementById('autoRecruit_randomization').value = settings.randomizationSeconds;
        document.getElementById('autoRecruit_resourceBudget').value = settings.resourceBudgetPercent;
        document.getElementById('autoRecruit_barracksPercent').value = settings.buildingDistribution.barracks;
        document.getElementById('autoRecruit_stablePercent').value = settings.buildingDistribution.stable;
        document.getElementById('autoRecruit_garagePercent').value = settings.buildingDistribution.garage;
    },
    
    // Save settings from UI
    saveSettingsFromUI: function() {
        const settings = {
            checkIntervalMinutes: parseInt(document.getElementById('autoRecruit_checkInterval').value),
            randomizationSeconds: parseInt(document.getElementById('autoRecruit_randomization').value),
            resourceBudgetPercent: parseInt(document.getElementById('autoRecruit_resourceBudget').value),
            buildingDistribution: {
                barracks: parseInt(document.getElementById('autoRecruit_barracksPercent').value),
                stable: parseInt(document.getElementById('autoRecruit_stablePercent').value),
                garage: parseInt(document.getElementById('autoRecruit_garagePercent').value)
            },
            activeTemplateId: AutoRecruitState.currentTemplate ? AutoRecruitState.currentTemplate.id : null
        };
        
        // Validate building distribution
        const total = settings.buildingDistribution.barracks + 
                      settings.buildingDistribution.stable + 
                      settings.buildingDistribution.garage;
        
        if (total !== 100) {
            UI.ErrorMessage('Building distribution must total 100%');
            return false;
        }
        
        AutoRecruitStorage.saveSettings(settings);
        UI.SuccessMessage('Settings saved');
        return true;
    },
    
    // Update statistics display
    updateStatistics: function() {
        document.getElementById('stat_checks').textContent = AutoRecruitState.statistics.totalChecks;
        document.getElementById('stat_recruitments').textContent = AutoRecruitState.statistics.totalRecruitments;
        document.getElementById('stat_lastRecruit').textContent = 
            AutoRecruitState.statistics.lastRecruitmentTime ? 
            new Date(AutoRecruitState.statistics.lastRecruitmentTime).toLocaleString() : 
            'Never';
        document.getElementById('stat_errors').textContent = AutoRecruitState.statistics.errors;
    },
    
    // Initialize UI and attach all event listeners
    initialize: function() {
        // Rename document title
        document.title = 'Norbi0N_rec';
        
        // Build and insert main UI
        const mainUI = this.buildMainUI();
        const contentContainer = document.getElementById('contentContainer');
        if (contentContainer) {
            contentContainer.insertBefore(mainUI, contentContainer.firstChild);
        }
        
        // Load templates
        TemplateManager.loadTemplates();
        this.renderTemplateList();
        
        // Load settings
        this.loadSettingsToUI();
        
        // Update statistics
        this.updateStatistics();
        
        // Update UI status
        AutoRecruitEngine.updateUI();
        
        // Attach main toggle button
        document.getElementById('autoRecruit_toggleMain').addEventListener('click', () => {
            AutoRecruitEngine.toggleMain();
        });
        
        // Attach section toggle buttons
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const button = header.querySelector('.toggle-btn');
                if (button && e.target !== button) {
                    button.click();
                }
            });
        });
        
        document.querySelectorAll('.section-header .toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const section = btn.getAttribute('data-section');
                AutoRecruitEngine.toggleSection(section);
            });
        });
        
        // Attach template button
        document.getElementById('autoRecruit_newTemplate').addEventListener('click', () => {
            this.showTemplateEditor();
        });
        
        // Attach settings button
        document.getElementById('autoRecruit_saveSettings').addEventListener('click', () => {
            this.saveSettingsFromUI();
        });
        
        // Attach control buttons
        document.getElementById('autoRecruit_start').addEventListener('click', () => {
            AutoRecruitEngine.start();
        });
        
        document.getElementById('autoRecruit_pause').addEventListener('click', () => {
            if (AutoRecruitState.isPaused) {
                AutoRecruitEngine.resume();
            } else {
                AutoRecruitEngine.pause();
            }
        });
        
        document.getElementById('autoRecruit_stop').addEventListener('click', () => {
            AutoRecruitEngine.stop();
        });
        
        // Set up periodic statistics and countdown update
        setInterval(() => {
            this.updateStatistics();
            AutoRecruitEngine.updateCountdown();
        }, 1000); // Update every second
        
        console.log('[AutoRecruit] UI initialized');
        UI.SuccessMessage('Auto Recruitment System loaded successfully');
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

(function() {
    console.log('[AutoRecruit] Script loaded');
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            UIBuilder.initialize();
        });
    } else {
        UIBuilder.initialize();
    }
})();
