// ==UserScript==
// @name         Norbi0N Master Control Panel
// @version      1.0.0
// @description  Unified control panel for all Norbi0N automation engines
// @author       Norbi0N
// @match        https://*.tribalwars.net/game.php*
// @match        https://*.klanhaboru.hu/game.php*
// @icon         https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_icon_27x27.png
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      discord.com
// @connect      api.telegram.org
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-master-control.meta.js
// @downloadURL  https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-master-control.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    // =========================================================================
    // MASTER CONFIGURATION
    // =========================================================================
    
    let MASTER_CONFIG = {
        modules: {
            farm: { enabled: false, loaded: false },
            builder: { enabled: false, loaded: false },
            recruiter: { enabled: false, loaded: false },
            scavenger: { enabled: false, loaded: false }
        },
        uiVisible: false,
        notifications: {
            discord: {
                webhookUrl: '',
                enabled: false
            },
            telegram: {
                botToken: '',
                chatId: '',
                enabled: false,
                messageCount: 1  // How many messages to send (1 second delay between each)
            }
        }
    };
    
    // Load saved config with backwards compatibility
    const saved = GM_getValue('master_control_config');
    if (saved) {
        try {
            const savedConfig = JSON.parse(saved);
            
            // Merge with default config to ensure all fields exist
            MASTER_CONFIG.modules = savedConfig.modules || MASTER_CONFIG.modules;
            MASTER_CONFIG.uiVisible = savedConfig.uiVisible || false;
            
            // Handle backwards compatibility for notifications
            if (savedConfig.notifications) {
                // Discord settings
                if (savedConfig.notifications.discord) {
                    MASTER_CONFIG.notifications.discord = {
                        webhookUrl: savedConfig.notifications.discord.webhookUrl || '',
                        enabled: savedConfig.notifications.discord.enabled || false
                    };
                }
                
                // Telegram settings
                if (savedConfig.notifications.telegram) {
                    MASTER_CONFIG.notifications.telegram = {
                        botToken: savedConfig.notifications.telegram.botToken || '',
                        chatId: savedConfig.notifications.telegram.chatId || '',
                        enabled: savedConfig.notifications.telegram.enabled || false,
                        messageCount: savedConfig.notifications.telegram.messageCount || 1
                    };
                }
            }
            
            log('Configuration loaded successfully');
            log(`Discord enabled: ${MASTER_CONFIG.notifications.discord.enabled}`);
            log(`Telegram enabled: ${MASTER_CONFIG.notifications.telegram.enabled}`);
        } catch (e) {
            log(`Failed to load config: ${e.message}`);
        }
    }
    
    function saveMasterConfig() {
        GM_setValue('master_control_config', JSON.stringify(MASTER_CONFIG));
    }
    
    function log(msg) {
        console.log(`[Master Control] ${msg}`);
    }
    
    // =========================================================================
    // BOT PROTECTION DETECTION - EMERGENCY STOP SYSTEM
    // =========================================================================
    
    let botProtectionDetected = false;
    let botDetectionInterval = null;
    
    function detectBotProtection() {
        let isDetected = false;
        let method = '';
        
        // Method 1: Direct ID check
        const botElement = document.getElementById('botprotection_quest');
        if (botElement) {
            isDetected = true;
            method = 'direct-id';
        }
        
        // Method 2: Check quest elements for bot protection text
        if (!isDetected) {
            const questElements = document.querySelectorAll('div.quest, div.quest_new, .popup_box, .popup_content');
            for (let element of questElements) {
                const text = element.textContent.toLowerCase();
                if (text.includes('bot protection') ||
                    text.includes('bot védelem') ||
                    text.includes('botvédelem') ||
                    text.includes('játék folytatása előtt') ||
                    text.includes('botvédelmi ellenőrzés') ||
                    text.includes('kezdd meg a botvédelem ellenőrzését')) {
                    isDetected = true;
                    method = 'quest-text';
                    break;
                }
            }
        }
        
        // Method 3: Check entire page text for specific keywords
        if (!isDetected) {
            const pageText = document.body.textContent.toLowerCase();
            const keywords = [
                'bot protection check must be passed',
                'begin bot protection check',
                'át kell esned egy botvédelmi ellenőrzésen'
            ];
            
            for (let keyword of keywords) {
                if (pageText.includes(keyword)) {
                    isDetected = true;
                    method = 'page-text';
                    break;
                }
            }
        }
        
        // Method 4: Check for bot-protection CSS class or row
        if (!isDetected) {
            const botRow = document.querySelector('td.bot-protection-row, .bot-protection-row');
            if (botRow) {
                isDetected = true;
                method = 'css-class';
            }
        }
        
        return { isDetected, method };
    }
    
    function handleBotProtectionDetected(method) {
        if (botProtectionDetected) return; // Already handled
        
        botProtectionDetected = true;
        
        // Update bot protection flag for modules to check
        if (typeof window !== 'undefined' && window.Norbi0N_QueueSystem) {
            window.Norbi0N_QueueSystem.botProtectionDetected = true;
        }
        
        log('🚨 =============================================');
        log('🚨 BOT PROTECTION DETECTED!');
        log(`🚨 Detection method: ${method}`);
        log('🚨 EMERGENCY STOP: All modules paused!');
        log('🚨 =============================================');
        
        // Stop all modules by disabling them
        for (let moduleName in MASTER_CONFIG.modules) {
            if (MASTER_CONFIG.modules[moduleName].enabled) {
                MASTER_CONFIG.modules[moduleName].enabled = false;
                log(`🛑 Stopped: ${moduleName}`);
            }
        }
        saveMasterConfig();
        
        // Clear the task queue
        TASK_QUEUE.currentTask = null;
        TASK_QUEUE.queue = [];
        TASK_QUEUE.locked = false;
        TASK_QUEUE.updateQueueUI();
        
        // Update Master UI
        updateMasterUI();
        
        // Show prominent alert
        alert('🚨 BOT PROTECTION DETECTED!\n\n' +
              '⚠️ All modules have been STOPPED for your safety.\n\n' +
              '📝 Please solve the captcha manually.\n' +
              '🔄 After solving, refresh the page to continue.\n\n' +
              `Detection method: ${method}`);
        
        // Stop bot detection interval
        if (botDetectionInterval) {
            clearInterval(botDetectionInterval);
            botDetectionInterval = null;
        }
        
        // Update queue status to show emergency stop
        const queueStatus = document.getElementById('queueStatus');
        if (queueStatus) {
            queueStatus.innerHTML = `
                <strong style="color: #f44336;">🚨 EMERGENCY STOP</strong><br>
                <span style="font-size: 10px; color: #ff9800;">Bot protection detected - solve captcha and refresh</span>
            `;
        }
        
        // Send notifications to Discord and Telegram
        sendBotProtectionNotifications(method);
    }
    
    function startBotProtectionMonitoring() {
        log('🛡️ Bot Protection Monitoring started (checking every 200ms)');
        
        botDetectionInterval = setInterval(() => {
            const result = detectBotProtection();
            
            if (result.isDetected) {
                handleBotProtectionDetected(result.method);
            }
        }, 200); // Check every 200ms
    }
    
    // =========================================================================
    // NOTIFICATION SYSTEM - DISCORD & TELEGRAM
    // =========================================================================
    
    async function sendDiscordNotification(method) {
        if (!MASTER_CONFIG.notifications.discord.enabled || !MASTER_CONFIG.notifications.discord.webhookUrl) {
            log('Discord notifications disabled or webhook URL not set');
            return;
        }
        
        const webhookUrl = MASTER_CONFIG.notifications.discord.webhookUrl;
        
        const message = {
            embeds: [{
                title: '🚨 BOT PROTECTION DETECTED!',
                description: '⚠️ All automation modules have been stopped for safety.',
                color: 15158332, // Red color
                fields: [
                    {
                        name: '🔍 Detection Method',
                        value: method,
                        inline: true
                    },
                    {
                        name: '⏰ Time',
                        value: new Date().toLocaleString(),
                        inline: true
                    },
                    {
                        name: '📝 Action Required',
                        value: 'Solve the captcha manually and refresh the page',
                        inline: false
                    }
                ],
                footer: {
                    text: 'Norbi0N Master Control Panel'
                },
                timestamp: new Date().toISOString()
            }]
        };
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            });
            
            if (response.ok) {
                log('✅ Discord notification sent successfully');
            } else {
                log(`❌ Discord notification failed: ${response.status}`);
            }
        } catch (error) {
            log(`❌ Discord notification error: ${error.message}`);
        }
    }
    
    async function sendTelegramNotification(method) {
        if (!MASTER_CONFIG.notifications.telegram.enabled || 
            !MASTER_CONFIG.notifications.telegram.botToken || 
            !MASTER_CONFIG.notifications.telegram.chatId) {
            log('Telegram notifications disabled or credentials not set');
            return;
        }
        
        const botToken = MASTER_CONFIG.notifications.telegram.botToken;
        const chatId = MASTER_CONFIG.notifications.telegram.chatId;
        const messageCount = MASTER_CONFIG.notifications.telegram.messageCount || 1;
        
        const messageText = `🚨 *BOT PROTECTION DETECTED!*\n\n` +
                          `⚠️ All automation modules have been stopped for safety.\n\n` +
                          `🔍 *Detection Method:* ${method}\n` +
                          `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
                          `📝 *Action Required:*\n` +
                          `Solve the captcha manually and refresh the page.\n\n` +
                          `🛡️ Norbi0N Master Control Panel`;
        
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        log(`📱 Sending ${messageCount} Telegram notification(s)...`);
        
        // Send multiple messages with 1 second delay between each
        for (let i = 0; i < messageCount; i++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: messageText,
                        parse_mode: 'Markdown'
                    })
                });
                
                if (response.ok) {
                    log(`✅ Telegram notification ${i + 1}/${messageCount} sent successfully`);
                } else {
                    log(`❌ Telegram notification ${i + 1}/${messageCount} failed: ${response.status}`);
                }
            } catch (error) {
                log(`❌ Telegram notification ${i + 1}/${messageCount} error: ${error.message}`);
            }
            
            // Wait 1 second before sending next message (except for the last one)
            if (i < messageCount - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    async function sendBotProtectionNotifications(method) {
        log('📢 Sending bot protection notifications...');
        
        // Send to Discord (no delay)
        if (MASTER_CONFIG.notifications.discord.enabled) {
            await sendDiscordNotification(method);
        }
        
        // Send to Telegram (with configurable message count)
        if (MASTER_CONFIG.notifications.telegram.enabled) {
            await sendTelegramNotification(method);
        }
    }
    
    // =========================================================================
    // QUEUE SYSTEM - PRIORITY TASK SCHEDULER
    // =========================================================================
    
    const TASK_PRIORITIES = {
        farm: 1,       // Highest priority
        scavenger: 2,
        builder: 3,
        recruiter: 4   // Lowest priority
    };
    
    const TASK_QUEUE = {
        currentTask: null,      // Currently executing task
        queue: [],              // Waiting tasks
        locked: false,          // Is system locked?
        
        // Request permission to run
        async requestSlot(moduleName, taskCallback) {
            log(`[QUEUE] ${moduleName} requesting slot...`);
            
            const task = {
                module: moduleName,
                priority: TASK_PRIORITIES[moduleName],
                callback: taskCallback,
                timestamp: Date.now()
            };
            
            // If no task is running, execute immediately
            if (!this.currentTask && !this.locked) {
                this.executeTask(task);
                return true;
            }
            
            // Check if current task has higher priority
            if (this.currentTask && this.currentTask.priority < task.priority) {
                log(`[QUEUE] ${moduleName} added to queue (${this.currentTask.module} is running with higher priority)`);
                this.addToQueue(task);
                return false;
            }
            
            // Add to queue and wait
            log(`[QUEUE] ${moduleName} added to queue (system busy)`);
            this.addToQueue(task);
            return false;
        },
        
        // Add task to queue (sorted by priority)
        addToQueue(task) {
            this.queue.push(task);
            
            // Sort by priority (lower number = higher priority)
            this.queue.sort((a, b) => {
                if (a.priority === b.priority) {
                    return a.timestamp - b.timestamp; // FIFO for same priority
                }
                return a.priority - b.priority;
            });
            
            log(`[QUEUE] Queue updated: [${this.queue.map(t => t.module).join(', ')}]`);
            this.updateQueueUI();
        },
        
        // Execute a task
        async executeTask(task) {
            this.currentTask = task;
            this.locked = true;
            
            log(`[QUEUE] ▶️ Executing: ${task.module} (Priority ${task.priority})`);
            this.updateQueueUI();
            
            try {
                // Execute the module's work
                if (task.callback && typeof task.callback === 'function') {
                    await task.callback();
                }
                
                log(`[QUEUE] ✅ ${task.module} completed`);
            } catch (error) {
                log(`[QUEUE] ❌ ${task.module} failed: ${error.message}`);
                console.error(error);
            }
            
            // Task finished - unlock
            this.releaseSlot(task.module);
        },
        
        // Release the slot and process next task
        releaseSlot(moduleName) {
            log(`[QUEUE] ${moduleName} releasing slot`);
            
            this.currentTask = null;
            this.locked = false;
            
            // Process next task in queue
            if (this.queue.length > 0) {
                const nextTask = this.queue.shift();
                log(`[QUEUE] Processing next task: ${nextTask.module}`);
                this.executeTask(nextTask);
            } else {
                log(`[QUEUE] Queue empty - system idle`);
                this.updateQueueUI();
            }
        },
        
        // Get current queue status
        getStatus() {
            return {
                currentTask: this.currentTask ? this.currentTask.module : null,
                queueLength: this.queue.length,
                waitingModules: this.queue.map(t => t.module)
            };
        },
        
        // Update UI to show queue status
        updateQueueUI() {
            const queueStatus = document.getElementById('queueStatus');
            if (!queueStatus) return;
            
            const status = this.getStatus();
            
            if (status.currentTask) {
                queueStatus.innerHTML = `
                    <strong style="color: #4caf50;">▶️ Running:</strong> ${status.currentTask}<br>
                    <strong style="color: #ff9800;">⏳ Queue:</strong> ${status.queueLength > 0 ? status.waitingModules.join(', ') : 'Empty'}
                `;
            } else {
                queueStatus.innerHTML = `
                    <strong style="color: #999;">⏸️ System Idle</strong><br>
                    <span style="font-size: 10px;">No modules running</span>
                `;
            }
        }
    };
    
    // Expose queue system to page context for modules to use
    if (typeof window !== 'undefined') {
        window.Norbi0N_QueueSystem = {
            requestSlot: (moduleName, callback) => TASK_QUEUE.requestSlot(moduleName, callback),
            releaseSlot: (moduleName) => TASK_QUEUE.releaseSlot(moduleName),
            getStatus: () => TASK_QUEUE.getStatus()
        };
    }
    
    // =========================================================================
    // GM API BRIDGE - Share GM functions with loaded modules
    // =========================================================================
    
    // CRITICAL: Create bridge IMMEDIATELY in unsafeWindow (page context)
    // This ensures ALL injected scripts can access it
    const setupGMBridge = () => {
        const bridgeCode = `
            (function() {
                console.log('[Master Control] Setting up GM API Bridge in page context...');
                
                // Store original functions if they exist
                const originalGM = {
                    getValue: window.GM_getValue,
                    setValue: window.GM_setValue,
                    deleteValue: window.GM_deleteValue,
                    xmlhttpRequest: window.GM_xmlhttpRequest
                };
                
                // Create the bridge in page context
                window.GM_API_BRIDGE = {
                    getValue: function(key, defaultValue) {
                        try {
                            const value = localStorage.getItem('gm_' + key);
                            return value !== null ? JSON.parse(value) : defaultValue;
                        } catch (e) {
                            return defaultValue;
                        }
                    },
                    setValue: function(key, value) {
                        try {
                            localStorage.setItem('gm_' + key, JSON.stringify(value));
                        } catch (e) {
                            console.error('GM_setValue failed:', e);
                        }
                    },
                    deleteValue: function(key) {
                        try {
                            localStorage.removeItem('gm_' + key);
                        } catch (e) {
                            console.error('GM_deleteValue failed:', e);
                        }
                    },
                    xmlhttpRequest: function(details) {
                        console.warn('GM_xmlhttpRequest called but not fully supported in bridge mode');
                        // Fallback to fetch
                        fetch(details.url, {
                            method: details.method || 'GET',
                            headers: details.headers,
                            body: details.data
                        }).then(response => response.text())
                          .then(data => {
                              if (details.onload) details.onload({responseText: data});
                          })
                          .catch(error => {
                              if (details.onerror) details.onerror(error);
                          });
                    }
                };
                
                // Also make GM functions available globally
                window.GM_getValue = window.GM_API_BRIDGE.getValue;
                window.GM_setValue = window.GM_API_BRIDGE.setValue;
                window.GM_deleteValue = window.GM_API_BRIDGE.deleteValue;
                window.GM_xmlhttpRequest = window.GM_API_BRIDGE.xmlhttpRequest;
                
                // Initialize Queue System in page context
                window.Norbi0N_QueueSystem = {
                    queue: [],
                    currentTask: null,
                    locked: false,
                    botProtectionDetected: false,  // Shared bot protection flag
                    
                    priorities: {
                        farm: 1,
                        scavenger: 2,
                        builder: 3,
                        recruiter: 4
                    },
                    
                    requestSlot: async function(moduleName, callback) {
                        console.log(\`[QUEUE] \${moduleName} requesting slot...\`);
                        
                        const task = {
                            module: moduleName,
                            priority: this.priorities[moduleName] || 99,
                            callback: callback,
                            timestamp: Date.now()
                        };
                        
                        // If no task is running, execute immediately
                        if (!this.currentTask && !this.locked) {
                            await this.executeTask(task);
                            return true;
                        }
                        
                        // Add to queue
                        console.log(\`[QUEUE] \${moduleName} added to queue (system busy)\`);
                        this.addToQueue(task);
                        return false;
                    },
                    
                    addToQueue: function(task) {
                        this.queue.push(task);
                        
                        // Sort by priority
                        this.queue.sort((a, b) => {
                            if (a.priority === b.priority) {
                                return a.timestamp - b.timestamp;
                            }
                            return a.priority - b.priority;
                        });
                        
                        console.log(\`[QUEUE] Queue updated: [\${this.queue.map(t => t.module).join(', ')}]\`);
                        this.updateQueueUI();
                    },
                    
                    executeTask: async function(task) {
                        this.currentTask = task;
                        this.locked = true;
                        
                        console.log(\`[QUEUE] ▶️ Executing: \${task.module} (Priority \${task.priority})\`);
                        this.updateQueueUI();
                        
                        try {
                            if (task.callback && typeof task.callback === 'function') {
                                await task.callback();
                            }
                            console.log(\`[QUEUE] ✅ \${task.module} completed\`);
                        } catch (error) {
                            console.error(\`[QUEUE] ❌ \${task.module} failed:\`, error);
                        }
                        
                        this.releaseSlot(task.module);
                    },
                    
                    releaseSlot: function(moduleName) {
                        console.log(\`[QUEUE] \${moduleName} releasing slot\`);
                        
                        this.currentTask = null;
                        this.locked = false;
                        
                        if (this.queue.length > 0) {
                            const nextTask = this.queue.shift();
                            console.log(\`[QUEUE] Processing next task: \${nextTask.module}\`);
                            this.executeTask(nextTask);
                        } else {
                            console.log(\`[QUEUE] Queue empty - system idle\`);
                            this.updateQueueUI();
                        }
                    },
                    
                    getStatus: function() {
                        return {
                            currentTask: this.currentTask ? this.currentTask.module : null,
                            queueLength: this.queue.length,
                            waitingModules: this.queue.map(t => t.module)
                        };
                    },
                    
                    updateQueueUI: function() {
                        const queueStatus = document.getElementById('queueStatus');
                        if (!queueStatus) return;
                        
                        const status = this.getStatus();
                        
                        if (status.currentTask) {
                            queueStatus.innerHTML = \`
                                <strong style="color: #4caf50;">▶️ Running:</strong> \${status.currentTask}<br>
                                <strong style="color: #ff9800;">⏳ Queue:</strong> \${status.queueLength > 0 ? status.waitingModules.join(', ') : 'Empty'}
                            \`;
                        } else {
                            queueStatus.innerHTML = \`
                                <strong style="color: #999;">⏸️ System Idle</strong><br>
                                <span style="font-size: 10px;">No modules running</span>
                            \`;
                        }
                    }
                };
                
                console.log('[Master Control] ✅ GM API Bridge + Queue System ready in page context');
            })();
        `;
        
        const script = document.createElement('script');
        script.textContent = bridgeCode;
        script.setAttribute('data-gm-bridge', 'true');
        document.documentElement.appendChild(script);
    };
    
    // Setup bridge immediately
    setupGMBridge();
    
    // =========================================================================
    // MODULE LOADER - DYNAMIC SCRIPT INJECTION
    // =========================================================================
    
    const MODULE_URLS = {
        farm: 'https://raw.githubusercontent.com/nnoby95/Norni0N/main/Norbi0N_Master/Farming_Module.ueser.js',
        builder: 'https://raw.githubusercontent.com/nnoby95/Norni0N/main/Norbi0N_Master/Builder_Module.user.js',
        recruiter: 'https://raw.githubusercontent.com/nnoby95/Norni0N/main/Norbi0N_Master/Recruit_Module.user.js',
        scavenger: 'https://raw.githubusercontent.com/nnoby95/Norni0N/main/Norbi0N_Master/Scav_Module.user.js'
    };
    
    async function loadModule(moduleName) {
        if (MASTER_CONFIG.modules[moduleName].loaded) {
            log(`${moduleName} already loaded - skipping duplicate load`);
            return true;
        }
    
        log(`Loading ${moduleName} module...`);
        
        // Show loading indicator on module card
        const statusSpan = document.querySelector(`.module-status[data-module="${moduleName}"]`);
        if (statusSpan) {
            statusSpan.textContent = 'LOADING...';
            statusSpan.style.background = '#ff9800';
        }
    
        try {
            const response = await fetch(MODULE_URLS[moduleName]);
            let scriptContent = await response.text();
            
            // Remove userscript headers to prevent conflicts
            scriptContent = scriptContent.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\n\n/g, '');
            
            // CRITICAL FIX: Replace unsafeWindow with window (it's already in page context)
            scriptContent = scriptContent.replace(/unsafeWindow\./g, 'window.');
            scriptContent = scriptContent.replace(/unsafeWindow/g, 'window');
            
            // Wrap in IIFE for isolation
            scriptContent = `(function() {
                'use strict';
                console.log('[${moduleName.toUpperCase()}] Module initializing...');
                try {
                    ${scriptContent}
                    console.log('[${moduleName.toUpperCase()}] ✅ Module loaded successfully!');
                } catch (error) {
                    console.error('[${moduleName.toUpperCase()}] ❌ Module error:', error);
                    throw error;
                }
            })();`;
            
            // Create script element
            const script = document.createElement('script');
            script.textContent = scriptContent;
            script.setAttribute('data-module', moduleName);
            script.setAttribute('data-loaded-at', Date.now());
            document.documentElement.appendChild(script);
            
            // Wait for module to initialize
            await new Promise(r => setTimeout(r, 1500));
            
            MASTER_CONFIG.modules[moduleName].loaded = true;
            MASTER_CONFIG.modules[moduleName].enabled = true;
            saveMasterConfig();
            
            log(`✅ ${moduleName} loaded and saved to config`);
            
            // Update UI
            if (statusSpan) {
                statusSpan.textContent = 'ACTIVE';
                statusSpan.style.background = '#4caf50';
            }
            
            return true;
            
        } catch (error) {
            log(`❌ Failed to load ${moduleName}: ${error.message}`);
            console.error(`[Master Control] ${moduleName} load error:`, error);
            UI.ErrorMessage(`Failed to load ${moduleName} module: ${error.message}`);
            
            // Reset status
            if (statusSpan) {
                statusSpan.textContent = 'ERROR';
                statusSpan.style.background = '#f44336';
            }
            
            return false;
        }
    }
    
    async function unloadModule(moduleName) {
        const script = document.querySelector(`script[data-module="${moduleName}"]`);
        if (script) {
            script.remove();
            MASTER_CONFIG.modules[moduleName].loaded = false;
            saveMasterConfig();
            log(`${moduleName} unloaded (page refresh recommended)`);
        }
    }
    
    // =========================================================================
    // QUEST BAR TOGGLE BUTTON
    // =========================================================================
    
    function createMasterToggle() {
        const existing = document.getElementById('master-toggle-btn');
        if (existing) existing.remove();
        
        const buttonHTML = `
            <div class="quest opened master-toggle" 
                 id="master-toggle-btn"
                 style="background-size: 26px; 
                        background-image: url('https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_icon_27x27.png');
                        cursor: pointer;
                        position: relative;
                        border: 2px solid #ffd700;">
                <div class="quest_progress" style="width: 0%;"></div>
                <div style="position: absolute; 
                           bottom: 2px; 
                           right: 2px; 
                           background: rgba(0,0,0,0.8); 
                           color: #ffd700; 
                           font-size: 8px; 
                           padding: 1px 3px; 
                           border-radius: 2px; 
                           font-weight: bold;">
                    MASTER
                </div>
            </div>
        `;
        
        const questlog = document.getElementById('questlog_new');
        if (questlog) {
            questlog.insertAdjacentHTML('beforeend', buttonHTML);
            
            const button = document.getElementById('master-toggle-btn');
            
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleMasterUI();
            });
            
            button.addEventListener('mouseenter', function() {
                this.style.opacity = '0.8';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.opacity = '1';
            });
            
            log('Master toggle button created');
        }
    }
    
    function toggleMasterUI() {
        let masterUI = document.getElementById('masterControlPanel');
        
        if (!masterUI) {
            createMasterUI();
            masterUI = document.getElementById('masterControlPanel');
        }
        
        const button = document.getElementById('master-toggle-btn');
        if (!masterUI) return;
        
        MASTER_CONFIG.uiVisible = !MASTER_CONFIG.uiVisible;
        
        if (MASTER_CONFIG.uiVisible) {
            masterUI.style.display = 'block';
            if (button) button.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
        } else {
            masterUI.style.display = 'none';
            if (button) button.style.backgroundColor = '';
        }
        
        saveMasterConfig();
    }
    
    // =========================================================================
    // MASTER CONTROL UI
    // =========================================================================
    
    function createMasterUI() {
        const html = `
        <div id="masterControlPanel" style="
            position: fixed;
            top: 80px;
            right: 20px;
            width: 420px;
            max-height: 85vh;
            background: linear-gradient(to bottom, #f4e4bc, #e8d9b5);
            border: 3px solid #7d510f;
            border-radius: 10px;
            padding: 0;
            z-index: 99999;
            font-family: Verdana, Arial, sans-serif;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            display: none;
            overflow: hidden;
        ">
            <!-- HEADER -->
            <div style="
                background: linear-gradient(to bottom, #c1a264, #b09456);
                padding: 12px 15px;
                border-radius: 7px 7px 0 0;
                border-bottom: 2px solid #7d510f;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <h3 style="margin: 0; color: #3d2817; text-shadow: 0 1px 0 rgba(255,255,255,0.3); font-size: 15px; font-weight: bold;">
                        Norbi0N Master Control
                    </h3>
                    <small style="color: #5a3d1a; font-weight: 600; font-size: 10px;">v1.0 - Unified Engine Manager</small>
                </div>
                <button id="master-minimize-btn" 
                        style="background: rgba(255,255,255,0.3); 
                               border: 1px solid #603000; 
                               border-radius: 3px; 
                               width: 24px; 
                               height: 24px; 
                               cursor: pointer; 
                               font-weight: bold; 
                               color: #603000;
                               padding: 0;
                               line-height: 1;
                               font-size: 18px;
                               transition: all 0.2s;">
                    ×
                </button>
            </div>
            
            <!-- SCROLLABLE CONTENT -->
            <div style="
                max-height: calc(85vh - 50px);
                overflow-y: auto;
                overflow-x: hidden;
                padding: 12px;
                background: #f8f4e8;
            ">
            
                <!-- MODULE GRID -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    
                    <!-- FARM ENGINE -->
                    <div class="module-card" data-module="farm" style="
                        background: linear-gradient(135deg, #0f3443 0%, #1a5570 100%);
                        border: 2px solid #2a9d8f;
                        border-radius: 8px;
                        padding: 12px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                    ">
                        <div style="text-align: center; margin-bottom: 8px;">
                            <img src="https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_icon_27x27.png" 
                                 style="width: 32px; height: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                        </div>
                        <div style="color: #fff; font-weight: bold; font-size: 13px; text-align: center; margin-bottom: 4px;">
                            Farm Engine
                        </div>
                        <div style="text-align: center;">
                            <span class="module-status" data-module="farm" style="
                                display: inline-block;
                                padding: 3px 10px;
                                background: #d32f2f;
                                color: white;
                                font-size: 10px;
                                border-radius: 10px;
                                font-weight: bold;
                            ">INACTIVE</span>
                        </div>
                    </div>
                    
                    <!-- BUILDER ENGINE -->
                    <div class="module-card" data-module="builder" style="
                        background: linear-gradient(135deg, #3d2314 0%, #5a3825 100%);
                        border: 2px solid #d4a574;
                        border-radius: 8px;
                        padding: 12px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                    ">
                        <div style="text-align: center; margin-bottom: 8px;">
                            <img src="https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_builder_27x27.png" 
                                 style="width: 32px; height: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                        </div>
                        <div style="color: #fff; font-weight: bold; font-size: 13px; text-align: center; margin-bottom: 4px;">
                            Builder Engine
                        </div>
                        <div style="text-align: center;">
                            <span class="module-status" data-module="builder" style="
                                display: inline-block;
                                padding: 3px 10px;
                                background: #d32f2f;
                                color: white;
                                font-size: 10px;
                                border-radius: 10px;
                                font-weight: bold;
                            ">INACTIVE</span>
                        </div>
                    </div>
                    
                    <!-- RECRUITER ENGINE -->
                    <div class="module-card" data-module="recruiter" style="
                        background: linear-gradient(135deg, #4a1c1c 0%, #6b2929 100%);
                        border: 2px solid #e74c3c;
                        border-radius: 8px;
                        padding: 12px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                    ">
                        <div style="text-align: center; margin-bottom: 8px;">
                            <img src="https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/Norbi0n_Recruit_27x27.png" 
                                 style="width: 32px; height: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                        </div>
                        <div style="color: #fff; font-weight: bold; font-size: 13px; text-align: center; margin-bottom: 4px;">
                            Recruiter Engine
                        </div>
                        <div style="text-align: center;">
                            <span class="module-status" data-module="recruiter" style="
                                display: inline-block;
                                padding: 3px 10px;
                                background: #d32f2f;
                                color: white;
                                font-size: 10px;
                                border-radius: 10px;
                                font-weight: bold;
                            ">INACTIVE</span>
                        </div>
                    </div>
                    
                    <!-- SCAVENGER ENGINE -->
                    <div class="module-card" data-module="scavenger" style="
                        background: linear-gradient(135deg, #1f3a1f 0%, #2d5a2d 100%);
                        border: 2px solid #4caf50;
                        border-radius: 8px;
                        padding: 12px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                    ">
                        <div style="text-align: center; margin-bottom: 8px;">
                            <img src="https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_scav_27x27.png" 
                                 style="width: 32px; height: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                        </div>
                        <div style="color: #fff; font-weight: bold; font-size: 13px; text-align: center; margin-bottom: 4px;">
                            Scavenger Engine
                        </div>
                        <div style="text-align: center;">
                            <span class="module-status" data-module="scavenger" style="
                                display: inline-block;
                                padding: 3px 10px;
                                background: #d32f2f;
                                color: white;
                                font-size: 10px;
                                border-radius: 10px;
                                font-weight: bold;
                            ">INACTIVE</span>
                        </div>
                    </div>
                </div>
                
                <!-- GLOBAL CONTROLS -->
                <div style="background: #fff5da; padding: 10px; border-radius: 5px; border: 1px solid #d4b98a; margin-bottom: 12px;">
                    <h4 style="margin: 0 0 8px 0; color: #7d510f; font-size: 11px; font-weight: bold;">
                        GLOBAL CONTROLS
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
                        <button id="enableAllModules" style="
                            padding: 8px;
                            background: linear-gradient(to bottom, #71ad3e, #5a8d3d);
                            color: white;
                            font-weight: bold;
                            border: 1px solid #3a5a1d;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 10px;
                            text-shadow: 0 1px 0 rgba(0,0,0,0.5);
                            transition: all 0.2s;
                        ">Enable All</button>
                        <button id="disableAllModules" style="
                            padding: 8px;
                            background: linear-gradient(to bottom, #c1443b, #a53931);
                            color: white;
                            font-weight: bold;
                            border: 1px solid #7a1a14;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 10px;
                            text-shadow: 0 1px 0 rgba(0,0,0,0.5);
                            transition: all 0.2s;
                        ">Disable All</button>
                    </div>
                    <button id="forceReloadModules" style="
                        width: 100%;
                        padding: 8px;
                        background: linear-gradient(to bottom, #c1a264, #b09456);
                        color: #3d2817;
                        font-weight: bold;
                        border: 1px solid #7d510f;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 10px;
                        transition: all 0.2s;
                    ">Force Reload All</button>
                </div>
                
                <!-- STATUS SUMMARY -->
                <div style="background: #fff5da; padding: 8px 10px; border-radius: 5px; border: 1px solid #d4b98a; font-size: 10px; color: #5a3d1a;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Active Modules:</span>
                        <span id="activeModulesCount" style="color: #71ad3e; font-weight: bold;">0/4</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>System Status:</span>
                        <span id="systemStatus" style="color: #7d510f; font-weight: bold;">Ready</span>
                    </div>
                </div>
                
                <!-- QUEUE STATUS -->
                <div style="background: #fff5da; padding: 10px; border-radius: 5px; border: 1px solid #d4b98a; font-size: 10px; color: #5a3d1a; margin-top: 10px;">
                    <h4 style="margin: 0 0 6px 0; color: #7d510f; font-size: 11px; font-weight: bold;">
                        TASK QUEUE
                    </h4>
                    <div id="queueStatus" style="color: #5a3d1a;">
                        <strong style="color: #7d510f;">System Idle</strong><br>
                        <span style="font-size: 9px; color: #8b6f47;">No modules running</span>
                    </div>
                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #d4b98a; font-size: 9px; color: #8b6f47;">
                        <strong>Priorities:</strong> Farm(1) → Scav(2) → Builder(3) → Recruit(4)
                    </div>
                </div>
                
                <!-- NOTIFICATION SETTINGS - COLLAPSIBLE -->
                <div style="background: #fff5da; padding: 8px 12px; border-radius: 5px; border: 1px solid #d4b98a; margin-top: 10px;">
                    <div id="notifications-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
                        <h4 style="margin: 0; color: #7d510f; font-size: 11px; font-weight: bold;">
                            BOT PROTECTION ALERTS
                        </h4>
                        <span id="notifications-toggle" style="color: #7d510f; font-size: 14px; font-weight: bold; transition: transform 0.3s;">▼</span>
                    </div>
                    
                    <div id="notifications-content" style="display: none; margin-top: 8px; font-size: 10px;">
                        <!-- Discord Settings -->
                        <div style="margin-bottom: 6px; padding: 6px 8px; background: #f4e4bc; border-radius: 4px; border: 1px solid #d4b98a;">
                            <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;">
                                <input type="checkbox" id="discord-enabled" style="margin-right: 6px;">
                                <span style="font-weight: bold; color: #7d510f; font-size: 10px;">Discord</span>
                            </label>
                            <input type="text" id="discord-webhook" placeholder="Webhook URL" style="
                                width: calc(100% - 10px);
                                padding: 4px;
                                background: white;
                                border: 1px solid #c1a264;
                                border-radius: 3px;
                                color: #5a3d1a;
                                font-size: 9px;
                            ">
                        </div>
                        
                        <!-- Telegram Settings -->
                        <div style="padding: 6px 8px; background: #f4e4bc; border-radius: 4px; border: 1px solid #d4b98a; margin-bottom: 6px;">
                            <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;">
                                <input type="checkbox" id="telegram-enabled" style="margin-right: 6px;">
                                <span style="font-weight: bold; color: #7d510f; font-size: 10px;">Telegram</span>
                            </label>
                            <input type="text" id="telegram-token" placeholder="Bot Token" style="
                                width: calc(100% - 10px);
                                padding: 4px;
                                background: white;
                                border: 1px solid #c1a264;
                                border-radius: 3px;
                                color: #5a3d1a;
                                font-size: 9px;
                                margin-bottom: 3px;
                            ">
                            <input type="text" id="telegram-chatid" placeholder="Chat ID" style="
                                width: calc(100% - 10px);
                                padding: 4px;
                                background: white;
                                border: 1px solid #c1a264;
                                border-radius: 3px;
                                color: #5a3d1a;
                                font-size: 9px;
                                margin-bottom: 3px;
                            ">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <label style="color: #7d510f; font-size: 9px;">Message count:</label>
                                <input type="number" id="telegram-count" min="1" max="100" value="1" style="
                                    width: 50px;
                                    padding: 3px;
                                    background: white;
                                    border: 1px solid #c1a264;
                                    border-radius: 3px;
                                    color: #5a3d1a;
                                    font-size: 9px;
                                ">
                                <span style="color: #8b6f47; font-size: 8px;">(1s delay)</span>
                            </div>
                        </div>
                        
                        <button id="save-notifications-btn" style="
                            width: 100%;
                            padding: 6px;
                            background: linear-gradient(to bottom, #71ad3e, #5a8d3d);
                            color: #fff;
                            font-weight: bold;
                            border: 1px solid #3a5a1d;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 10px;
                            text-shadow: 0 1px 0 rgba(0,0,0,0.5);
                            transition: all 0.2s;
                        ">Save Settings</button>
                    </div>
                </div>
                
                <!-- INFO PANEL -->
                <div style="margin-top: 10px; padding: 8px 10px; background: #f4e4bc; border: 1px solid #d4b98a; border-radius: 5px; font-size: 9px; color: #7d510f; line-height: 1.4;">
                    <strong>How it works:</strong><br>
                    Click on any module card to enable/disable it. Enabled modules will load their individual control panels. Use global controls to manage all modules at once.
                </div>
            </div>
        </div>
        
        <style>
            /* Scrollbar Styling - Tribal Wars Style */
            #masterControlPanel ::-webkit-scrollbar {
                width: 10px;
            }
            
            #masterControlPanel ::-webkit-scrollbar-track {
                background: #e8d9b5;
                border-radius: 5px;
                border: 1px solid #d4b98a;
            }
            
            #masterControlPanel ::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #c1a264, #b09456);
                border-radius: 5px;
                border: 1px solid #7d510f;
            }
            
            #masterControlPanel ::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, #d4a574, #c1a264);
            }
            
            .module-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(125,81,15,0.4) !important;
            }
            
            .module-card.active {
                border-color: #7d510f !important;
                box-shadow: 0 0 12px rgba(125,81,15,0.5) !important;
            }
            
            #enableAllModules:hover,
            #disableAllModules:hover,
            #forceReloadModules:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            
            #save-notifications-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            
            #master-minimize-btn:hover {
                background: rgba(255,255,255,0.5) !important;
            }
        </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Bind events
        bindMasterEvents();
        
        // Initial update
        updateMasterUI();
    }
    
    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================
    
    function bindMasterEvents() {
        // Minimize button
        document.getElementById('master-minimize-btn')?.addEventListener('click', toggleMasterUI);
        
        // Module cards
        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', async function() {
                const moduleName = this.getAttribute('data-module');
                await toggleModule(moduleName);
            });
        });
        
        // Global controls
        document.getElementById('enableAllModules')?.addEventListener('click', async () => {
            for (let moduleName of ['farm', 'builder', 'recruiter', 'scavenger']) {
                if (!MASTER_CONFIG.modules[moduleName].enabled) {
                    await toggleModule(moduleName);
                    await new Promise(r => setTimeout(r, 500)); // Stagger loading
                }
            }
            UI.SuccessMessage('All modules enabled!');
        });
        
        document.getElementById('disableAllModules')?.addEventListener('click', () => {
            for (let moduleName of ['farm', 'builder', 'recruiter', 'scavenger']) {
                if (MASTER_CONFIG.modules[moduleName].enabled) {
                    toggleModule(moduleName);
                }
            }
            UI.InfoMessage('All modules disabled - refresh page to fully unload');
        });
        
        document.getElementById('forceReloadModules')?.addEventListener('click', async () => {
            UI.InfoMessage('Force reloading all modules...');
            
            // Remove all loaded module scripts
            document.querySelectorAll('script[data-module]').forEach(script => {
                script.remove();
            });
            
            // Reset loaded flags
            for (let moduleName in MASTER_CONFIG.modules) {
                MASTER_CONFIG.modules[moduleName].loaded = false;
            }
            saveMasterConfig();
            
            // Reload enabled modules
            for (let moduleName in MASTER_CONFIG.modules) {
                if (MASTER_CONFIG.modules[moduleName].enabled) {
                    await loadModule(moduleName);
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            
            UI.SuccessMessage('All modules reloaded! Check quest bar.');
            log('🔄 Force reload complete');
        });
        
        // Notification settings save button
        document.getElementById('save-notifications-btn')?.addEventListener('click', saveNotificationSettings);
        
        // Notification section toggle
        document.getElementById('notifications-header')?.addEventListener('click', toggleNotificationsSection);
        
        // Load existing notification settings
        loadNotificationSettings();
    }
    
    function toggleNotificationsSection() {
        const content = document.getElementById('notifications-content');
        const toggle = document.getElementById('notifications-toggle');
        
        if (content && toggle) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggle.style.transform = 'rotate(180deg)';
                toggle.textContent = '▲';
            } else {
                content.style.display = 'none';
                toggle.style.transform = 'rotate(0deg)';
                toggle.textContent = '▼';
            }
        }
    }
    
    function saveNotificationSettings() {
        // Discord settings
        MASTER_CONFIG.notifications.discord.enabled = document.getElementById('discord-enabled')?.checked || false;
        MASTER_CONFIG.notifications.discord.webhookUrl = document.getElementById('discord-webhook')?.value || '';
        
        // Telegram settings
        MASTER_CONFIG.notifications.telegram.enabled = document.getElementById('telegram-enabled')?.checked || false;
        MASTER_CONFIG.notifications.telegram.botToken = document.getElementById('telegram-token')?.value || '';
        MASTER_CONFIG.notifications.telegram.chatId = document.getElementById('telegram-chatid')?.value || '';
        MASTER_CONFIG.notifications.telegram.messageCount = parseInt(document.getElementById('telegram-count')?.value) || 1;
        
        // Save to storage
        saveMasterConfig();
        
        // Verify it was saved
        const verification = GM_getValue('master_control_config');
        if (verification) {
            const verified = JSON.parse(verification);
            log('Notification settings saved successfully');
            log(`Discord: ${verified.notifications.discord.enabled ? 'Enabled' : 'Disabled'} - ${verified.notifications.discord.webhookUrl ? 'Webhook set' : 'No webhook'}`);
            log(`Telegram: ${verified.notifications.telegram.enabled ? 'Enabled' : 'Disabled'} - ${verified.notifications.telegram.botToken ? 'Token set' : 'No token'} (${verified.notifications.telegram.messageCount} messages)`);
            
            UI.SuccessMessage('Notification settings saved! Will persist after refresh.');
        } else {
            log('Warning: Failed to verify saved settings');
            UI.ErrorMessage('Failed to save notification settings!');
        }
    }
    
    function loadNotificationSettings() {
        log('Loading notification settings from config...');
        
        // Discord settings
        const discordEnabled = document.getElementById('discord-enabled');
        const discordWebhook = document.getElementById('discord-webhook');
        
        if (discordEnabled) {
            discordEnabled.checked = MASTER_CONFIG.notifications.discord.enabled;
            log(`Discord enabled: ${discordEnabled.checked}`);
        }
        if (discordWebhook) {
            discordWebhook.value = MASTER_CONFIG.notifications.discord.webhookUrl;
            log(`Discord webhook: ${discordWebhook.value ? 'Set (' + discordWebhook.value.substring(0, 30) + '...)' : 'Not set'}`);
        }
        
        // Telegram settings
        const telegramEnabled = document.getElementById('telegram-enabled');
        const telegramToken = document.getElementById('telegram-token');
        const telegramChatId = document.getElementById('telegram-chatid');
        const telegramCount = document.getElementById('telegram-count');
        
        if (telegramEnabled) {
            telegramEnabled.checked = MASTER_CONFIG.notifications.telegram.enabled;
            log(`Telegram enabled: ${telegramEnabled.checked}`);
        }
        if (telegramToken) {
            telegramToken.value = MASTER_CONFIG.notifications.telegram.botToken;
            log(`Telegram token: ${telegramToken.value ? 'Set' : 'Not set'}`);
        }
        if (telegramChatId) {
            telegramChatId.value = MASTER_CONFIG.notifications.telegram.chatId;
            log(`Telegram chat ID: ${telegramChatId.value || 'Not set'}`);
        }
        if (telegramCount) {
            telegramCount.value = MASTER_CONFIG.notifications.telegram.messageCount;
            log(`Telegram message count: ${telegramCount.value}`);
        }
        
        log('Notification settings loaded successfully');
    }
    
    async function toggleModule(moduleName) {
        const isCurrentlyEnabled = MASTER_CONFIG.modules[moduleName].enabled;
        
        if (isCurrentlyEnabled) {
            // DISABLE
            MASTER_CONFIG.modules[moduleName].enabled = false;
            saveMasterConfig();
            log(`${moduleName} disabled`);
            UI.InfoMessage(`${moduleName} disabled (refresh recommended)`);
        } else {
            // ENABLE
            const loaded = await loadModule(moduleName);
            if (loaded) {
                MASTER_CONFIG.modules[moduleName].enabled = true;
                saveMasterConfig();
                log(`${moduleName} enabled`);
                UI.SuccessMessage(`${moduleName} enabled! Check for its icon in quest bar.`);
            }
        }
        
        updateMasterUI();
    }
    
    function updateMasterUI() {
        let activeCount = 0;
        
        for (let moduleName in MASTER_CONFIG.modules) {
            const module = MASTER_CONFIG.modules[moduleName];
            const card = document.querySelector(`.module-card[data-module="${moduleName}"]`);
            const status = document.querySelector(`.module-status[data-module="${moduleName}"]`);
            
            if (card && status) {
                if (module.enabled) {
                    card.classList.add('active');
                    status.textContent = 'ACTIVE';
                    status.style.background = '#4caf50';
                    activeCount++;
                } else {
                    card.classList.remove('active');
                    status.textContent = 'INACTIVE';
                    status.style.background = '#d32f2f';
                }
            }
        }
        
        // Update summary
        const activeCountEl = document.getElementById('activeModulesCount');
        const systemStatusEl = document.getElementById('systemStatus');
        
        if (activeCountEl) {
            activeCountEl.textContent = `${activeCount}/4`;
            activeCountEl.style.color = activeCount > 0 ? '#4caf50' : '#999';
        }
        
        if (systemStatusEl) {
            if (activeCount === 0) {
                systemStatusEl.textContent = 'Idle';
                systemStatusEl.style.color = '#999';
            } else if (activeCount === 4) {
                systemStatusEl.textContent = 'Full Power!';
                systemStatusEl.style.color = '#ffd700';
            } else {
                systemStatusEl.textContent = 'Active';
                systemStatusEl.style.color = '#4caf50';
            }
        }
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async function init() {
        log('Master Control Panel initializing...');
        log(`Current config: ${JSON.stringify(MASTER_CONFIG.modules)}`);
        
        // Start bot protection monitoring
        startBotProtectionMonitoring();
        
        // Create toggle button
        createMasterToggle();
        
        // Restore UI visibility
        if (MASTER_CONFIG.uiVisible) {
            createMasterUI();
            const masterUI = document.getElementById('masterControlPanel');
            if (masterUI) {
                masterUI.style.display = 'block';
                const button = document.getElementById('master-toggle-btn');
                if (button) button.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
            }
        }
        
        // AUTO-LOAD ENABLED MODULES ON PAGE LOAD
        const enabledModules = [];
        for (let moduleName in MASTER_CONFIG.modules) {
            const module = MASTER_CONFIG.modules[moduleName];
            log(`Checking ${moduleName}: enabled=${module.enabled}, loaded=${module.loaded}`);
            
            if (module.enabled) {
                enabledModules.push(moduleName);
                // Reset loaded flag to force reload
                MASTER_CONFIG.modules[moduleName].loaded = false;
            }
        }
        
        if (enabledModules.length > 0) {
            log(`🔄 Auto-loading ${enabledModules.length} enabled modules: ${enabledModules.join(', ')}`);
            
            // Wait for page to be fully ready
            await new Promise(r => setTimeout(r, 1000));
            
            // Load modules with stagger to prevent conflicts
            for (let moduleName of enabledModules) {
                log(`📦 Loading ${moduleName}...`);
                try {
                    await loadModule(moduleName);
                    log(`✅ ${moduleName} load complete`);
                } catch (error) {
                    log(`❌ ${moduleName} load failed: ${error.message}`);
                }
                await new Promise(r => setTimeout(r, 500)); // 500ms delay between loads
            }
            
            log('✅ All enabled modules loaded!');
        } else {
            log('ℹ️ No modules enabled for auto-load');
        }
        
        log('Master Control Panel initialized ✨');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Page already loaded - run immediately
        setTimeout(init, 100);
    }
    
    })();