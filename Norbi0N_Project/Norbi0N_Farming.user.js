
// ==UserScript==
// @name         Norbi0N Farm Engine v2.0
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Advanced farming automation for Tribal Wars with bot protection and loop mode
// @author       Norbi0N
// @match        https://*.klanhaboru.hu/game.php*
// @match        https://*.tribalwars.net/game.php*
// @match        https://*.die-staemme.de/game.php*
// @match        https://*.tribalwars.*/game.php*
// @icon         https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_icon_27x27.png
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @connect      discord.com
// @connect      api.telegram.org
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-farm-engine.meta.js
// @downloadURL  https://raw.githubusercontent.com/nnoby95/Norni0N/main/norbi-farm-engine.user.js
// ==/UserScript==

(function() {
    'use strict';

    // =============================================================================
    // SAFE CODE INJECTION - NO EVAL()
    // =============================================================================
    
    const SafeInjector = {
        injectFarmHandler: function(targetWindow) {
            if (!targetWindow || targetWindow.closed) {
                console.error('Target window not available');
                return false;
            }
            
            try {
                const script = targetWindow.document.createElement('script');
                script.textContent = this.getFarmHandlerCode();
                targetWindow.document.head.appendChild(script);
                console.log('Farm handler injected via script element');
                return true;
            } catch (error) {
                console.error('Injection failed:', error);
                return false;
            }
        },
        
        getFarmHandlerCode: function() {
            return `
                (function() {
                    console.log('Farm handler initialized via safe injection');
                    
                    const FarmHandler = {
                        pressTimer: null,
                        progressTimer: null,
                        botDetectionTimer: null,
                        totalPresses: 0,
                        isRunning: false,
                        startTime: null,
                        
                        startFarming: function() {
                            console.log('Starting continuous farming...');
                            this.isRunning = true;
                            this.totalPresses = 0;
                            this.startTime = Date.now();
                            
                            const self = this;
                            this.pressTimer = setInterval(() => self.pressEnter(), 100);
                            this.progressTimer = setInterval(() => self.monitorProgress(), 100);
                            this.botDetectionTimer = setInterval(() => self.checkBotProtection(), 80);
                        },
                        
                        pressEnter: function() {
                            if (!this.isRunning) return;
                            
                            const createKeyEvent = (type) => new KeyboardEvent(type, {
                                key: 'Enter',
                                code: 'Enter',
                                keyCode: 13,
                                which: 13,
                                bubbles: true,
                                cancelable: true
                            });
                            
                            document.dispatchEvent(createKeyEvent('keydown'));
                            document.dispatchEvent(createKeyEvent('keyup'));
                            
                            if (document.activeElement) {
                                document.activeElement.dispatchEvent(createKeyEvent('keydown'));
                                document.activeElement.dispatchEvent(createKeyEvent('keyup'));
                            }
                            
                            this.totalPresses++;
                            if (this.totalPresses % 50 === 0) {
                                console.log(\`Enter pressed \${this.totalPresses} times\`);
                            }
                        },
                        
                        monitorProgress: function() {
                            if (!this.isRunning) return;
                            
                            const progressBar = document.getElementById('FarmGodProgessbar');
                            if (!progressBar) return;
                            
                            const labelSpan = progressBar.querySelector('span.label');
                            if (!labelSpan) return;
                            
                            const cleanText = labelSpan.innerText || labelSpan.textContent;
                            const parts = cleanText.split(' / ');
                            
                            if (parts.length !== 2) return;
                            
                            let currentStr = parts[0].trim().replace(/\\./g, '');
                            let totalStr = parts[1].trim().replace(/\\./g, '');
                            
                            const current = parseInt(currentStr);
                            const total = parseInt(totalStr);
                            
                            if (isNaN(current) || isNaN(total)) return;
                            
                            const percentage = total > 0 ? (current / total) * 100 : 0;
                            
                            if (current >= total) {
                                console.log('Farming completed!');
                                this.stopFarming();
                                
                                const durationMs = Date.now() - this.startTime;
                                const minutes = Math.floor(durationMs / 60000);
                                const seconds = Math.floor((durationMs % 60000) / 1000);
                                
                                localStorage.setItem('norbi_farm_result', JSON.stringify({
                                    status: 'success',
                                    message: 'Farming completed successfully',
                                    villages: total,
                                    totalPresses: this.totalPresses,
                                    finalProgress: cleanText,
                                    timeMinutes: minutes,
                                    timeSeconds: seconds,
                                    timestamp: Date.now()
                                }));
                                
                                setTimeout(() => window.close(), 3000);
                            }
                        },
                        
                        checkBotProtection: function() {
                            if (!this.isRunning) return;
                            
                            // FARM TAB DETECTION: Check ONLY botprotection_quest
                            const botElement = document.getElementById('botprotection_quest');
                            
                            if (botElement) {
                                console.log('BOT PROTECTION DETECTED IN FARM TAB!');
                                this.stopFarming();
                                
                                if (window.opener) {
                                    window.opener.postMessage({
                                        source: 'norbi_farm_bot_detection',
                                        message: 'Bot detected while farming - farming stopped',
                                        detectionMethod: 'botprotection_quest',
                                        totalPresses: this.totalPresses,
                                        timestamp: Date.now()
                                    }, '*');
                                }
                                
                                localStorage.setItem('norbi_farm_result', JSON.stringify({
                                    status: 'error',
                                    message: 'Bot detected while farming',
                                    error: 'Bot protection quest appeared',
                                    totalPresses: this.totalPresses,
                                    timestamp: Date.now()
                                }));
                            }
                        },
                        
                        stopFarming: function() {
                            this.isRunning = false;
                            clearInterval(this.pressTimer);
                            clearInterval(this.progressTimer);
                            clearInterval(this.botDetectionTimer);
                            console.log(\`Stopped. Total presses: \${this.totalPresses}\`);
                        }
                    };
                    
                    setTimeout(() => {
                        if (typeof window.$ === 'undefined') {
                            console.error('jQuery not available');
                            return;
                        }
                        
                        window.$.getScript('https://media.innogamescdn.com/com_DS_HU/scripts/farmgod.js')
                            .done(() => {
                                console.log('FarmGod loaded');
                                
                                setTimeout(() => {
                                    const planButton = document.querySelector('input.btn.optionButton[value="Farm megtervezése"]');
                                    if (planButton) {
                                        planButton.click();
                                        setTimeout(() => FarmHandler.startFarming(), 3000);
                                    } else {
                                        console.error('Farm button not found');
                                    }
                                }, 2000);
                            })
                            .fail(() => console.error('FarmGod failed to load'));
                    }, 3000);
                })();
            `;
        }
    };

    // =============================================================================
    // MAIN ENGINE
    // =============================================================================
    
    const NorbiFarmEngine = {
        isRunning: false,
        farmTab: null,
        loopEnabled: false,
        loopTimer: null,
        botDetectionTimer: null,
        uiVisible: false,
        settings: {
            loopInterval: 10,
            randomDelayRange: 3,
            discordWebhookUrl: '',
            telegramBotToken: '',
            telegramChatId: '',
            notificationsEnabled: true
        },
        
        init: function() {
            this.loadSettings();
            this.createToggleButton();
            // this.createUI(); // REMOVED - UI created on first click
            this.setupMessageListener();
            this.renameTab();
            this.startBotDetection();
            console.log('Norbi0N Farm Engine initialized (userscript version)');
        },
        
        renameTab: function() {
            document.title = 'Norbi0n - ' + document.title;
        },
        
        createToggleButton: function() {
            const existing = document.getElementById('norbi-toggle-btn');
            if (existing) existing.remove();
            
            const buttonHTML = `
                <div class="quest opened norbi-farm-toggle" 
                     id="norbi-toggle-btn"
                     style="background-size: 26px; 
                            background-image: url('https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/norbi0n_icon_27x27.png');
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
                        FARM
                    </div>
                </div>
            `;
            
            const questlog = document.getElementById('questlog_new');
            if (questlog) {
                questlog.insertAdjacentHTML('beforeend', buttonHTML);
                
                const button = document.getElementById('norbi-toggle-btn');
                const self = this;
                
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.toggleUI();
                });
                
                button.addEventListener('mouseenter', function() {
                    this.style.opacity = '0.8';
                });
                
                button.addEventListener('mouseleave', function() {
                    this.style.opacity = '1';
                });
                
                console.log('Toggle button created in questlog');
            } else {
                console.warn('Questlog not found, button not created');
            }
        },
        
        toggleUI: function() {
            let engineUI = document.getElementById('norbi-farm-engine');
            
            // If UI doesn't exist yet, create it
            if (!engineUI) {
                this.createUI();
                engineUI = document.getElementById('norbi-farm-engine');
            }
            
            const button = document.getElementById('norbi-toggle-btn');
            if (!engineUI) return;
            
            this.uiVisible = !this.uiVisible;
            
            if (this.uiVisible) {
                engineUI.style.display = 'block';
                button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
                this.log('UI opened');
            } else {
                engineUI.style.display = 'none';
                button.style.backgroundColor = '';
                this.log('UI minimized');
            }
        },
        
        createUI: function() {
            const engineHTML = `
                <div id="norbi-farm-engine" style="
                    position: fixed; 
                    top: 10px; 
                    right: 10px; 
                    width: 450px; 
                    background: #f4e4bc; 
                    border: 3px outset #7d510f; 
                    border-radius: 8px; 
                    padding: 0; 
                    z-index: 9999; 
                    font-family: Verdana, Arial, sans-serif; 
                    font-size: 11px; 
                    box-shadow: 3px 3px 8px rgba(0,0,0,0.4);
                    display: none;">
                    
                    <div style="background: linear-gradient(to bottom, #c1a264, #a08751); 
                               padding: 12px; 
                               border-bottom: 2px solid #603000; 
                               font-weight: bold; 
                               text-align: center; 
                               font-size: 14px; 
                               color: #2c1810; 
                               text-shadow: 1px 1px 1px rgba(255,255,255,0.3); 
                               border-radius: 5px 5px 0 0;
                               display: flex;
                               justify-content: space-between;
                               align-items: center;">
                        <span style="flex: 1;">Norbi0N Farm Engine v2.0</span>
                        <button id="norbi-minimize-btn" 
                                style="background: rgba(255,255,255,0.2); 
                                       border: 1px solid #603000; 
                                       border-radius: 3px; 
                                       width: 24px; 
                                       height: 24px; 
                                       cursor: pointer; 
                                       font-weight: bold; 
                                       color: #2c1810;
                                       padding: 0;
                                       line-height: 1;">
                            ×
                        </button>
                    </div>
                    
                    <div style="padding: 15px;">
                        <table class="vis" style="width: 100%; margin-bottom: 15px;">
                            <tr><th colspan="2" style="background: #c1a264; text-align: center;">Status</th></tr>
                            <tr><td style="width: 30%; font-weight: bold;">Engine:</td><td><span id="engine-status" style="font-weight: bold; color: #2c7d32;">Ready</span></td></tr>
                            <tr><td style="font-weight: bold;">Village:</td><td><span style="color: #1976d2;">${unsafeWindow.game_data.village.id}</span></td></tr>
                            <tr><td style="font-weight: bold;">Loop Mode:</td><td><span id="loop-status" style="font-weight: bold; color: #d32f2f;">Disabled</span></td></tr>
                        </table>
                        
                        <table class="vis" style="width: 100%; margin-bottom: 15px;">
                            <tr><th colspan="2" style="background: #c1a264; text-align: center;">Settings</th></tr>
                            <tr>
                                <td style="width: 35%; font-weight: bold; vertical-align: middle;">Loop Interval:</td>
                                <td><input id="loop-interval" type="number" min="1" max="999" value="10" style="width: 70px; padding: 4px; border: 1px solid #603000; font-size: 11px; text-align: center;"> minutes</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; vertical-align: middle;">Random Delay:</td>
                                <td>± <input id="random-delay" type="number" min="0" max="99" value="3" style="width: 50px; padding: 4px; border: 1px solid #603000; font-size: 11px; text-align: center;"> minutes</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; vertical-align: middle;">Loop Mode:</td>
                                <td><label style="font-weight: bold;"><input type="checkbox" id="enable-loop" style="margin-right: 8px;"> Enable Loop Mode</label></td>
                            </tr>
                        </table>
                        
                        <table class="vis" style="width: 100%; margin-bottom: 15px;">
                            <tr><th colspan="2" style="background: #c1a264; text-align: center;">Bot Protection Alerts</th></tr>
                            <tr>
                                <td style="font-weight: bold; vertical-align: middle;">Notifications:</td>
                                <td><label style="font-weight: bold;"><input type="checkbox" id="enable-notifications" style="margin-right: 8px;"> Enable Notifications</label></td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; vertical-align: middle;">Discord Webhook:</td>
                                <td><input id="discord-webhook" type="text" placeholder="https://discord.com/api/webhooks/..." style="width: 100%; padding: 4px; border: 1px solid #603000; font-size: 10px;"></td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; vertical-align: middle;">Telegram Token:</td>
                                <td><input id="telegram-token" type="text" placeholder="123456:ABC-DEF..." style="width: 100%; padding: 4px; border: 1px solid #603000; font-size: 10px;"></td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; vertical-align: middle;">Telegram Chat ID:</td>
                                <td><input id="telegram-chat-id" type="text" placeholder="123456789" style="width: 100%; padding: 4px; border: 1px solid #603000; font-size: 10px;"></td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; vertical-align: middle;">Test Notifications:</td>
                                <td>
                                    <div style="display: flex; gap: 4px;">
                                        <input id="test-discord-btn" class="btn" type="button" value="Test Discord" style="flex: 1; padding: 4px 8px; font-size: 10px;">
                                        <input id="test-telegram-btn" class="btn" type="button" value="Test Telegram" style="flex: 1; padding: 4px 8px; font-size: 10px;">
                                    </div>
                                </td>
                            </tr>
                        </table>
                        
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <input id="start-farm-btn" class="btn" type="button" value="Start Farming" style="flex: 1; padding: 8px 12px; font-size: 11px;">
                            <input id="stop-loop-btn" class="btn" type="button" value="Stop Loop" style="flex: 1; padding: 8px 12px; font-size: 11px; opacity: 0.5;" disabled>
                        </div>
                        <input id="save-settings-btn" class="btn" type="button" value="Save Settings" style="width: 100%; padding: 8px 12px; font-size: 11px; margin-bottom: 15px;">
                        
                        <table class="vis" style="width: 100%;">
                            <tr><th style="background: #c1a264; text-align: center;">Activity Log</th></tr>
                            <tr><td style="padding: 0;">
                                <div id="farm-log" style="padding: 8px; background: #fff; height: 150px; overflow-y: auto; font-size: 10px; border: 1px inset #ccc; margin: 4px; font-family: monospace;"></div>
                            </td></tr>
                        </table>
                    </div>
                </div>
            `;
            
            const existing = document.getElementById('norbi-farm-engine');
            if (existing) existing.remove();
            
            document.body.insertAdjacentHTML('beforeend', engineHTML);
            
            const minimizeBtn = document.getElementById('norbi-minimize-btn');
            if (minimizeBtn) {
                const self = this;
                minimizeBtn.addEventListener('click', function() {
                    self.toggleUI();
                });
            }
            
            this.bindEvents();
            this.populateUISettings();
            this.updateLoopStatus();
        },
        
        bindEvents: function() {
            const self = this;
            
            document.getElementById('start-farm-btn').addEventListener('click', () => self.startFarming());
            document.getElementById('stop-loop-btn').addEventListener('click', () => self.stopLoop());
            document.getElementById('save-settings-btn').addEventListener('click', () => self.saveSettings());
            document.getElementById('enable-loop').addEventListener('change', () => self.updateLoopStatus());
            document.getElementById('test-discord-btn').addEventListener('click', () => self.testDiscordNotification());
            document.getElementById('test-telegram-btn').addEventListener('click', () => self.testTelegramNotification());
        },
        
        startFarming: function() {
            if (this.isRunning) {
                this.log('Already running!');
                return;
            }
            
            this.isRunning = true;
            this.updateStatus('Opening farm tab...');
            this.log('Starting farm process');
            
            const currentHost = window.location.hostname;
            const farmUrl = `https://${currentHost}/game.php?village=${unsafeWindow.game_data.village.id}&screen=am_farm`;
            
            this.log('Opening farm tab: ' + farmUrl);
            this.farmTab = window.open(farmUrl, '_blank');
            
            const self = this;
            setTimeout(() => {
                if (!self.farmTab || self.farmTab.closed) {
                    self.log('Failed to open farm tab');
                    self.resetEngine();
                    return;
                }
                
                const success = SafeInjector.injectFarmHandler(self.farmTab);
                if (success) {
                    self.log('Farm handler injected successfully');
                    self.monitorFarmTab();
                } else {
                    self.log('Failed to inject farm handler');
                    self.resetEngine();
                }
            }, 4000);
        },
        
        monitorFarmTab: function() {
            const self = this;
            const checkInterval = setInterval(() => {
                if (self.farmTab && self.farmTab.closed) {
                    clearInterval(checkInterval);
                    self.resetEngine();
                    self.log('Farm tab closed');
                    return;
                }
                
                const result = localStorage.getItem('norbi_farm_result');
                if (result) {
                    clearInterval(checkInterval);
                    const data = JSON.parse(result);
                    self.handleFarmResult(data);
                    localStorage.removeItem('norbi_farm_result');
                }
            }, 1000);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                if (self.isRunning) {
                    self.log('Farm process timed out');
                    self.resetEngine();
                }
            }, 5 * 60 * 1000);
        },
        
        handleFarmResult: function(data) {
            if (data.status === 'success') {
                const timeMsg = data.timeMinutes > 0 ? 
                    `${data.timeMinutes} min ${data.timeSeconds} sec` : 
                    `${data.timeSeconds} sec`;
                
                this.log('=== FARMING COMPLETED ===');
                this.log(`Villages farmed: ${data.villages}`);
                this.log(`Total farming time: ${timeMsg}`);
                this.log(`Enter key presses: ${data.totalPresses}`);
                this.log(`Completed at: ${new Date().toLocaleTimeString()}`);
                this.updateStatus(`Completed: ${data.villages} villages in ${timeMsg}`);
            } else {
                this.log(`Farm failed: ${data.message}`);
                this.updateStatus(`Farm failed: ${data.error}`);
                
                if (data.error === 'Bot protection quest appeared') {
                    this.log('=== BOT PROTECTION DETECTED ===');
                    this.log('Farming stopped immediately for safety!');
                    this.sendNotifications('Bot protection detected during farming', 'Farm tab detection');
                }
            }
            
            this.resetEngine();
        },
        
        resetEngine: function() {
            this.isRunning = false;
            this.farmTab = null;
            this.updateStatus('Ready');
            
            if (this.loopEnabled) {
                this.scheduleNextRun();
            }
        },
        
        scheduleNextRun: function() {
            if (!this.loopEnabled) return;
            
            const baseDelay = this.settings.loopInterval;
            const randomRange = this.settings.randomDelayRange;
            const randomOffset = (Math.random() * 2 - 1) * randomRange;
            const totalDelay = Math.max(1, baseDelay + randomOffset);
            
            this.log(`Next farming session: ${baseDelay}min ${randomOffset >= 0 ? '+' : ''}${randomOffset.toFixed(1)}min = ${totalDelay.toFixed(1)} minutes`);
            this.updateStatus(`Waiting ${Math.round(totalDelay)} min for next run`);
            
            const self = this;
            this.loopTimer = setTimeout(() => {
                if (self.loopEnabled) {
                    self.log('Starting scheduled farming session...');
                    self.startFarming();
                }
            }, totalDelay * 60000);
        },
        
        stopLoop: function() {
            this.loopEnabled = false;
            if (this.loopTimer) {
                clearTimeout(this.loopTimer);
                this.loopTimer = null;
            }
            document.getElementById('enable-loop').checked = false;
            this.updateLoopStatus();
            this.updateStatus('Ready');
            this.log('Loop mode disabled - no more scheduled runs');
            this.saveSettings();
        },
        
        startBotDetection: function() {
            const self = this;
            // MAIN PAGE DETECTION: Check every 200ms
            this.botDetectionTimer = setInterval(() => {
                // Check TWO conditions (either one triggers response)
                const botElement = document.getElementById('botprotection_quest');
                const botRow = document.querySelector('td.bot-protection-row');
                const hasBotVedelem = botRow && botRow.textContent.includes('Bot védelem');
                
                if (botElement || hasBotVedelem) {
                    let detectionMethod = '';
                    if (botElement) detectionMethod += 'botprotection_quest ';
                    if (hasBotVedelem) detectionMethod += 'td.bot-protection-row[Bot védelem] ';
                    
                    self.log('=== BOT PROTECTION DETECTED ON MAIN PAGE ===');
                    self.log('Detection method(s): ' + detectionMethod.trim());
                    
                    if (self.loopEnabled) {
                        self.log('Bot protection detected on main page! Loop mode stopped for safety');
                        
                        // Set loopEnabled = false
                        self.loopEnabled = false;
                        
                        // Clear loopTimer if exists
                        if (self.loopTimer) {
                            clearTimeout(self.loopTimer);
                            self.loopTimer = null;
                        }
                        
                        // Update UI checkbox (enable-loop) to unchecked
                        document.getElementById('enable-loop').checked = false;
                        
                        // Call updateLoopStatus() to update UI
                        self.updateLoopStatus();
                        
                        // Update status
                        self.updateStatus('Bot Protection Detected - Loop Stopped');
                        
                        // Call saveSettings() to persist disabled state
                        self.saveSettings();
                        
                        // Send notifications with main page message
                        self.sendNotifications('Bot protection detected on main page - loop stopped', detectionMethod.trim());
                        
                        self.log('Please solve bot protection manually');
                    }
                }
            }, 200); // 200ms interval for main page detection
        },
        
        sendNotifications: function(message, method) {
            if (!this.settings.notificationsEnabled) return;
            
            if (this.settings.discordWebhookUrl) {
                this.sendDiscord(message, method);
            }
            
            if (this.settings.telegramBotToken && this.settings.telegramChatId) {
                this.sendTelegram(message, method);
            }
        },
        
        sendDiscord: function(message, method) {
            const payload = {
                embeds: [{
                    title: "🚨 BOT PROTECTION DETECTED",
                    description: message,
                    color: 15158332, // Red
                    fields: [
                        { name: "🎯 Detection", value: method, inline: true },
                        { name: "🏰 Village", value: unsafeWindow.game_data.village.id.toString(), inline: true },
                        { name: "⏰ Time", value: new Date().toLocaleString(), inline: true }
                    ],
                    footer: { text: "Norbi0N Farm Engine v2.0" }
                }]
            };
            
            GM_xmlhttpRequest({
                method: 'POST',
                url: this.settings.discordWebhookUrl,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(payload),
                onload: () => this.log('Discord notification sent'),
                onerror: (e) => this.log('Discord notification failed')
            });
        },
        
        sendTelegram: function(message, method) {
            // Send 15 messages with 500ms delay between each
            const text = `🚨 BOT PROTECTION DETECTED\n\n${message}\n\nMethod: ${method}\nVillage: ${unsafeWindow.game_data.village.id}\nTime: ${new Date().toLocaleString()}`;
            
            for (let i = 1; i <= 15; i++) {
                setTimeout(() => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `https://api.telegram.org/bot${this.settings.telegramBotToken}/sendMessage`,
                        headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify({
                            chat_id: this.settings.telegramChatId,
                            text: `🚨 ALERT #${i}/15\n\n${text}`,
                            parse_mode: 'Markdown'
                        }),
                        onload: () => console.log(`Telegram #${i} sent`),
                        onerror: () => console.log(`Telegram #${i} failed`)
                    });
                }, (i - 1) * 500); // 500ms delay between each message
            }
        },
        
        testDiscordNotification: function() {
            if (!this.settings.notificationsEnabled) {
                this.log('Notifications are disabled! Enable them first.');
                return;
            }
            
            if (!this.settings.discordWebhookUrl) {
                this.log('Discord webhook URL not configured!');
                return;
            }
            
            this.log('Sending Discord test notification...');
            
            const payload = {
                embeds: [{
                    title: "DISCORD TEST NOTIFICATION",
                    description: "This is a test notification from your Norbi0N Farm Engine!",
                    color: 3447003,
                    fields: [
                        { name: "Status", value: "Test Successful", inline: true },
                        { name: "Village", value: unsafeWindow.game_data.village.id.toString(), inline: true },
                        { name: "Time", value: new Date().toLocaleString(), inline: true }
                    ],
                    footer: { text: "Norbi0N Farm Engine v2.0 [TEST MODE]" }
                }]
            };
            
            const self = this;
            GM_xmlhttpRequest({
                method: 'POST',
                url: this.settings.discordWebhookUrl,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(payload),
                onload: () => self.log('Discord test notification sent successfully!'),
                onerror: () => self.log('Discord test failed')
            });
        },
        
        testTelegramNotification: function() {
            if (!this.settings.notificationsEnabled) {
                this.log('Notifications are disabled! Enable them first.');
                return;
            }
            
            if (!this.settings.telegramBotToken || !this.settings.telegramChatId) {
                this.log('Telegram not configured!');
                return;
            }
            
            this.log('Sending Telegram test notification (3 messages)...');
            
            const text = `*TELEGRAM TEST NOTIFICATION*\n\nThis is a test notification from your Norbi0N Farm Engine!\n\nVillage: ${unsafeWindow.game_data.village.id}\nTime: ${new Date().toLocaleString()}\n\nTest successful!`;
            
            const self = this;
            for (let i = 1; i <= 3; i++) {
                setTimeout(() => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `https://api.telegram.org/bot${self.settings.telegramBotToken}/sendMessage`,
                        headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify({
                            chat_id: self.settings.telegramChatId,
                            text: `TEST MESSAGE #${i}/3\n\n${text}`,
                            parse_mode: 'Markdown'
                        }),
                        onload: () => self.log(`Telegram test message #${i} sent successfully!`),
                        onerror: () => self.log(`Telegram test #${i} failed`)
                    });
                }, (i - 1) * 1000);
            }
        },
        
        loadSettings: function() {
            const saved = GM_getValue('norbi_settings');
            if (saved) {
                try {
                    this.settings = Object.assign(this.settings, JSON.parse(saved));
                    this.loopEnabled = GM_getValue('norbi_loop_enabled', false);
                    this.uiVisible = GM_getValue('norbi_ui_visible', false);
                } catch (e) {
                    console.error('Failed to load settings:', e);
                }
            }
        },
        
        populateUISettings: function() {
            // Populate UI elements with loaded settings (only when UI exists)
            if (document.getElementById('loop-interval')) {
                document.getElementById('loop-interval').value = this.settings.loopInterval;
                document.getElementById('random-delay').value = this.settings.randomDelayRange;
                document.getElementById('enable-notifications').checked = this.settings.notificationsEnabled;
                document.getElementById('discord-webhook').value = this.settings.discordWebhookUrl;
                document.getElementById('telegram-token').value = this.settings.telegramBotToken;
                document.getElementById('telegram-chat-id').value = this.settings.telegramChatId;
                document.getElementById('enable-loop').checked = this.loopEnabled;
            }
        },
        
        saveSettings: function() {
            this.settings.loopInterval = parseInt(document.getElementById('loop-interval').value) || 10;
            this.settings.randomDelayRange = parseInt(document.getElementById('random-delay').value) || 3;
            this.settings.notificationsEnabled = document.getElementById('enable-notifications').checked;
            this.settings.discordWebhookUrl = document.getElementById('discord-webhook').value.trim();
            this.settings.telegramBotToken = document.getElementById('telegram-token').value.trim();
            this.settings.telegramChatId = document.getElementById('telegram-chat-id').value.trim();
            this.loopEnabled = document.getElementById('enable-loop').checked;
            
            GM_setValue('norbi_settings', JSON.stringify(this.settings));
            GM_setValue('norbi_loop_enabled', this.loopEnabled);
            GM_setValue('norbi_ui_visible', this.uiVisible);
            
            this.log('Settings saved successfully');
            this.log('Loop Interval: ' + this.settings.loopInterval + ' minutes');
            this.log('Random Delay: ±' + this.settings.randomDelayRange + ' minutes');
            this.log('Loop Mode: ' + (this.loopEnabled ? 'Enabled' : 'Disabled'));
            this.log('Notifications: ' + (this.settings.notificationsEnabled ? 'Enabled' : 'Disabled'));
            
            this.updateLoopStatus();
        },
        
        updateLoopStatus: function() {
            const status = document.getElementById('loop-status');
            const stopBtn = document.getElementById('stop-loop-btn');
            
            if (this.loopEnabled) {
                status.textContent = 'Enabled';
                status.style.color = '#2c7d32';
                stopBtn.disabled = false;
                stopBtn.style.opacity = '1';
            } else {
                status.textContent = 'Disabled';
                status.style.color = '#d32f2f';
                stopBtn.disabled = true;
                stopBtn.style.opacity = '0.5';
            }
        },
        
        updateStatus: function(status) {
            const el = document.getElementById('engine-status');
            if (el) el.textContent = status;
        },
        
        log: function(message) {
            const logEl = document.getElementById('farm-log');
            if (logEl) {
                const time = new Date().toLocaleTimeString();
                logEl.innerHTML += `<div>[${time}] ${message}</div>`;
                logEl.scrollTop = logEl.scrollHeight;
            }
            console.log('[Norbi Farm]', message);
        },
        
        setupMessageListener: function() {
            const self = this;
            // ENGINE TAB MESSAGE LISTENER: Listen for postMessage events from farm tab
            window.addEventListener('message', (event) => {
                if (event.data && event.data.source === 'norbi_farm_bot_detection') {
                    // Received bot detection from farm tab
                    self.log('=== BOT PROTECTION DETECTED IN FARM TAB ===');
                    self.log('Message: ' + event.data.message);
                    
                    // Send notifications with farm-specific message
                    self.sendNotifications(
                        'Bot detected while farming - farming stopped',
                        event.data.detectionMethod
                    );
                }
            });
        }
    };

    // =============================================================================
    // AUTO-INITIALIZATION
    // =============================================================================
    
    function initializeScript() {
        const isFarmPage = window.location.href.includes('screen=am_farm');
        
        if (!isFarmPage) {
            NorbiFarmEngine.init();
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        initializeScript();
    }

})();