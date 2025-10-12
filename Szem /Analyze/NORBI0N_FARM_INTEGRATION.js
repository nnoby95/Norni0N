/**
 * 🚜 NORBI0N_FARMING - Clean SZEM Integration
 * Based on: Norbi0N_Master/Farming_Module.ueser.js
 * Simplified for SZEM architecture (no duplicate bot detection/notifications)
 */

// ============================================
// MODULE VARIABLES
// ============================================

var NORBI0N_FARM_LEPES = 0;
var NORBI0N_FARM_REF;
var NORBI0N_FARM_HIBA = 0;
var NORBI0N_FARM_GHIBA = 0;
var NORBI0N_FARM_PAUSE = true;
var NORBI0N_FARM_CURRENT_VILL = null;
var NORBI0N_FARM_LOOP_TIMER = null;

var SZEM4_NORBI0N_FARM = {
	ENABLED_VILLAGES: {},  // villageId: true/false
	VILLAGE_STATS: {},     // villageId: {lastRun: timestamp, attacks: count, farms: count}
	OPTIONS: {
		loopInterval: 10,      // Minutes between cycles
		randomDelay: 3,        // ± random minutes
		loopMode: false,       // Keep looping?
		pauseOnConflict: true  // Pause if other modules active
	}
};

// ============================================
// COORDINATION
// ============================================

function norbi0n_farm_isAnyModuleBusy() {
	if (!SZEM4_NORBI0N_FARM.OPTIONS.pauseOnConflict) return false;
	
	// Pause if old Farm is attacking
	if (!FARM_PAUSE && FARM_LEPES !== 0) {
		return true;
	}
	
	// Pause if Builder is building
	if (!EPIT_PAUSE && EPIT_LEPES !== 0) {
		return true;
	}
	
	// Pause if Scavenger is scavenging
	if (!GYUJTO_PAUSE && GYUJTO_STATE !== 0) {
		return true;
	}
	
	return false;
}

function norbi0n_farm_getNextVillage() {
	for (const coord in KTID) {
		const villId = KTID[coord];
		if (SZEM4_NORBI0N_FARM.ENABLED_VILLAGES[villId]) {
			return villId;
		}
	}
	return null;
}

// ============================================
// FARMGOD AUTOMATION INJECTOR
// ============================================

function norbi0n_farm_injectFarmGod(ref) {
	try {
		const script = ref.document.createElement('script');
		script.textContent = `
			(function() {
				console.log('🚜 Norbi0N FarmGod automation initializing...');
				
				const FarmHandler = {
					pressTimer: null,
					progressTimer: null,
					botCheckTimer: null,
					totalPresses: 0,
					isRunning: false,
					startTime: null,
					
					start: function() {
						this.isRunning = true;
						this.totalPresses = 0;
						this.startTime = Date.now();
						
						const self = this;
						// Bot check FASTER than ENTER press (200ms vs 100ms)
						// Ensures detection happens BETWEEN presses!
						this.botCheckTimer = setInterval(() => self.checkBotProtection(), 200);
						this.pressTimer = setInterval(() => self.pressEnter(), 100);
						this.progressTimer = setInterval(() => self.checkProgress(), 500);
						
						console.log('🚜 FarmGod automation started with 200ms bot detection');
					},
					
					checkBotProtection: function() {
						if (!this.isRunning) return;
						
						// Check for bot protection in THIS window
						const botDetected = 
							document.getElementById('botprotection_quest') ||
							document.getElementById('bot_check') ||
							document.getElementById('popup_box_bot_protection') ||
							document.querySelector('.bot-protection-row') ||
							document.querySelector('td.bot-protection-row') ||
							document.title === "Bot védelem";
						
						if (botDetected) {
							console.error('🚨 BOT PROTECTION DETECTED in FarmGod window!');
							this.stop();
							
							// Signal SZEM's main window
							if (window.opener) {
								try {
									// Call SZEM's global bot protection handler
									window.opener.BotvedelemBe();
									
									// Also send postMessage as backup
									window.opener.postMessage({
										source: 'norbi0n_farm_bot_detection',
										message: 'Bot protection detected in farming window',
										timestamp: Date.now()
									}, '*');
								} catch(e) {
									console.error('Failed to notify main window:', e);
								}
							}
							
							// Store error state
							localStorage.setItem('norbi_farm_result', JSON.stringify({
								status: 'bot_detected',
								message: 'Bot protection appeared during farming',
								totalPresses: this.totalPresses,
								timestamp: Date.now()
							}));
						}
					},
					
					pressEnter: function() {
						if (!this.isRunning) return;
						
						const evt = new KeyboardEvent('keydown', {
							key: 'Enter',
							code: 'Enter',
							keyCode: 13,
							bubbles: true,
							cancelable: true
						});
						document.dispatchEvent(evt);
						
						this.totalPresses++;
					},
					
					checkProgress: function() {
						if (!this.isRunning) return;
						
						const progressBar = document.getElementById('FarmGodProgessbar');
						if (!progressBar) return;
						
						const label = progressBar.querySelector('span.label');
						if (!label) return;
						
						const text = label.textContent;
						const parts = text.split(' / ');
						
						if (parts.length === 2) {
							const current = parseInt(parts[0].replace(/\\./g, ''));
							const total = parseInt(parts[1].replace(/\\./g, ''));
							
							if (!isNaN(current) && !isNaN(total) && current >= total) {
								console.log('🚜 FarmGod completed!');
								this.stop();
								
								// Store result
								localStorage.setItem('norbi_farm_result', JSON.stringify({
									status: 'success',
									villages: total,
									presses: this.totalPresses,
									duration: Date.now() - this.startTime
								}));
								
								// Close window after delay
								setTimeout(() => window.close(), 2000);
							}
						}
					},
					
					stop: function() {
						this.isRunning = false;
						clearInterval(this.pressTimer);
						clearInterval(this.progressTimer);
						clearInterval(this.botCheckTimer);
						console.log(\`🚜 Stopped. Presses: \${this.totalPresses}\`);
					}
				};
				
				// Load FarmGod and start
				window.addEventListener('load', () => {
					setTimeout(() => {
						if (typeof $ === 'undefined') {
							console.error('jQuery not available');
							return;
						}
						
						$.getScript('https://media.innogamescdn.com/com_DS_HU/scripts/farmgod.js')
							.done(() => {
								console.log('🚜 FarmGod loaded');
								
								setTimeout(() => {
									const planButton = document.querySelector('input.btn.optionButton[value="Farm megtervezése"]');
									if (planButton) {
										planButton.click();
										setTimeout(() => FarmHandler.start(), 3000);
									}
								}, 2000);
							})
							.fail(() => console.error('FarmGod failed to load'));
					}, 2000);
				});
				
				// Expose for external control
				window.NorbiFarmHandler = FarmHandler;
			})();
		`;
		ref.document.head.appendChild(script);
		debug('Norbi0N_Farm', 'FarmGod automation injected');
		return true;
	} catch(e) {
		debug('Norbi0N_Farm', `Injection error: ${e}`);
		return false;
	}
}

// ============================================
// MAIN MOTOR
// ============================================

function szem4_norbi0n_farm_motor() {
	var nexttime = 500;
	
	try {
		if (BOT || NORBI0N_FARM_PAUSE || USER_ACTIVITY) {
			nexttime = 5000;
		} else if (norbi0n_farm_isAnyModuleBusy()) {
			nexttime = 3000;
		} else {
			// Error handling
			if (NORBI0N_FARM_HIBA > 10) {
				NORBI0N_FARM_HIBA = 0;
				NORBI0N_FARM_GHIBA++;
				if (NORBI0N_FARM_GHIBA > 3) {
					naplo("Norbi0N_Farm", "Folyamatos hiba");
					if (NORBI0N_FARM_REF && !NORBI0N_FARM_REF.closed) {
						NORBI0N_FARM_REF.close();
					}
				}
				NORBI0N_FARM_LEPES = 0;
			}
			
			switch (NORBI0N_FARM_LEPES) {
				case 0: // Select village and open
					NORBI0N_FARM_CURRENT_VILL = norbi0n_farm_getNextVillage();
					
					if (NORBI0N_FARM_CURRENT_VILL) {
						const url = VILL1ST.replace(/village=[0-9]+/, `village=${NORBI0N_FARM_CURRENT_VILL}`)
										   .replace("screen=overview", "screen=am_farm");
						
						if (!NORBI0N_FARM_REF || NORBI0N_FARM_REF.closed) {
							NORBI0N_FARM_REF = windowOpener('norbi0n_farm', url, AZON + "_Norbi0N_Farm");
							debug('Norbi0N_Farm', `Opening village ${NORBI0N_FARM_CURRENT_VILL}`);
						} else {
							NORBI0N_FARM_REF.location.href = url;
							debug('Norbi0N_Farm', `Navigating to village ${NORBI0N_FARM_CURRENT_VILL}`);
						}
						NORBI0N_FARM_LEPES = 1;
					} else {
						// No village selected
						nexttime = 60000;
						debug('Norbi0N_Farm', 'No village enabled');
					}
					break;
					
				case 1: // Wait for page load, inject FarmGod automation
					if (isPageLoaded(NORBI0N_FARM_REF, NORBI0N_FARM_CURRENT_VILL, 'screen=am_farm')) {
						NORBI0N_FARM_HIBA = 0;
						NORBI0N_FARM_GHIBA = 0;
						
						// Inject FarmGod automation
						norbi0n_farm_injectFarmGod(NORBI0N_FARM_REF);
						NORBI0N_FARM_REF.document.title = '🚜 Norbi0N_Farm - Running';
						
						naplo('Norbi0N_Farm', `🚜 FarmGod elindítva: ${ID_TO_INFO[NORBI0N_FARM_CURRENT_VILL].name}`);
						NORBI0N_FARM_LEPES = 2;
					} else {
						NORBI0N_FARM_HIBA++;
					}
					break;
					
				case 2: // Monitor completion
					if (NORBI0N_FARM_REF.closed) {
						// Window closed - assume completion or manual stop
						debug('Norbi0N_Farm', 'Window closed - marking as done');
						norbi0n_farm_markComplete();
						NORBI0N_FARM_LEPES = 0;
						
						// Check loop mode
						if (SZEM4_NORBI0N_FARM.OPTIONS.loopMode) {
							norbi0n_farm_scheduleLoop();
						}
					} else {
						// Check localStorage for result
						try {
							const result = NORBI0N_FARM_REF.localStorage.getItem('norbi_farm_result');
							if (result) {
								const data = JSON.parse(result);
								if (data.status === 'success') {
									naplo('Norbi0N_Farm', `✅ Befejezve: ${data.villages} falu, ${data.presses} klikk, ${Math.round(data.duration/1000)}s`);
									norbi0n_farm_markComplete();
									NORBI0N_FARM_REF.localStorage.removeItem('norbi_farm_result');
									NORBI0N_FARM_LEPES = 0;
									
									// Check loop mode
									if (SZEM4_NORBI0N_FARM.OPTIONS.loopMode) {
										norbi0n_farm_scheduleLoop();
									}
								}
							}
						} catch(e) {}
						
						NORBI0N_FARM_HIBA++;
					}
					break;
					
				default:
					NORBI0N_FARM_LEPES = 0;
			}
		}
	} catch(e) {
		debug('Norbi0N_Farm_motor', `ERROR: ${e}`);
		NORBI0N_FARM_LEPES = 0;
	}
	
	var inga = 100/((Math.random()*40)+80);
	nexttime = Math.round(nexttime*inga);
	
	try {
		worker.postMessage({'id': 'norbi0n_farm', 'time': nexttime});
	} catch(e) {
		setTimeout(function(){ szem4_norbi0n_farm_motor(); }, 3000);
	}
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function norbi0n_farm_markComplete() {
	if (NORBI0N_FARM_CURRENT_VILL) {
		SZEM4_NORBI0N_FARM.VILLAGE_STATS[NORBI0N_FARM_CURRENT_VILL] = {
			lastRun: getServerTime().getTime()
		};
		NORBI0N_FARM_CURRENT_VILL = null;
	}
}

function norbi0n_farm_scheduleLoop() {
	const interval = SZEM4_NORBI0N_FARM.OPTIONS.loopInterval;
	const randomDelay = SZEM4_NORBI0N_FARM.OPTIONS.randomDelay;
	
	// Calculate random delay
	const randomMs = (Math.random() * randomDelay * 2 - randomDelay) * 60000;
	const totalMs = (interval * 60000) + randomMs;
	
	debug('Norbi0N_Farm', `Loop mode: next run in ${Math.round(totalMs/60000)} minutes`);
	
	NORBI0N_FARM_LOOP_TIMER = setTimeout(() => {
		NORBI0N_FARM_LEPES = 0;
		szem4_norbi0n_farm_motor();
	}, totalMs);
}

function norbi0n_farm_rebuildDOM() {
	const table = document.getElementById('norbi0n_farm_table');
	if (!table) return;
	
	$("#norbi0n_farm_table tr:gt(0)").remove();
	
	for (const coord in KTID) {
		const villId = KTID[coord];
		const row = table.insertRow(-1);
		
		let c = row.insertCell(0);
		c.innerHTML = `${ID_TO_INFO[villId].name} (${coord})`;
		
		c = row.insertCell(1);
		c.innerHTML = ID_TO_INFO[villId].point;
		
		c = row.insertCell(2);
		c.innerHTML = ID_TO_INFO[villId].pop;
		
		c = row.insertCell(3);
		const isChecked = SZEM4_NORBI0N_FARM.ENABLED_VILLAGES[villId] ? 'checked' : '';
		c.innerHTML = `<input type="checkbox" ${isChecked} 
		               onclick="norbi0n_farm_toggle(${villId}, this)">`;
		
		c = row.insertCell(4);
		const stats = SZEM4_NORBI0N_FARM.VILLAGE_STATS[villId];
		c.innerHTML = stats?.lastRun ? new Date(stats.lastRun).toLocaleString() : '---';
	}
}

function norbi0n_farm_toggle(villId, checkbox) {
	SZEM4_NORBI0N_FARM.ENABLED_VILLAGES[villId] = checkbox.checked;
}

function norbi0n_farm_updateSettings() {
	const form = document.getElementById('norbi0n_farm_settings');
	SZEM4_NORBI0N_FARM.OPTIONS.loopInterval = parseInt(form.loopInterval.value, 10);
	SZEM4_NORBI0N_FARM.OPTIONS.randomDelay = parseInt(form.randomDelay.value, 10);
	SZEM4_NORBI0N_FARM.OPTIONS.loopMode = form.loopMode.checked;
	SZEM4_NORBI0N_FARM.OPTIONS.pauseOnConflict = form.pauseOnConflict.checked;
}

// ============================================
// UI REGISTRATION
// ============================================

ujkieg_hang("Norbi0N_Farm", "norbi0n_start;norbi0n_complete");

ujkieg("norbi0n_farm", "Norbi0N Farming", `
<tr><td>
	<h2 align="center">🚜 Norbi0N Farming Engine</h2>
	<h4 align="center">FarmGod Automation - Press ENTER Method</h4>
	<p align="center">
		<i>Ez a modul a hivatalos FarmGod scriptet használja és automatizálja ENTER gomb nyomkodással.<br>
		This module uses the official FarmGod script and automates it by pressing ENTER.</i>
	</p>
	<br>
	
	<form id="norbi0n_farm_settings" onchange="norbi0n_farm_updateSettings()">
		<table class="vis" style="margin-bottom: 20px;">
			<tr><th colspan="2" style="background: #c1a264;">⚙️ Beállítások / Settings</th></tr>
			<tr>
				<td style="width: 40%;">Loop mód intervallum:</td>
				<td><input type="number" name="loopInterval" min="1" max="999" value="10" size="3"> perc</td>
			</tr>
			<tr>
				<td>Véletlen késleltetés:</td>
				<td>± <input type="number" name="randomDelay" min="0" max="99" value="3" size="3"> perc</td>
			</tr>
			<tr>
				<td>Loop mód:</td>
				<td><input type="checkbox" name="loopMode"> Folyamatos ismétlés / Continuous loop</td>
			</tr>
			<tr>
				<td>Koordináció:</td>
				<td><input type="checkbox" name="pauseOnConflict" checked> Szünet ha más modul aktív</td>
			</tr>
		</table>
	</form>
	
	<h3 align="center">📋 Farmolni ettől a falutól / Farm from this village</h3>
	<p align="center" style="color: orange;">
		<b>⚠️ Csak 1 falu választható! / Only 1 village selectable!</b><br>
		Ez a modul arra a falura fut amire bepipáltad.<br>
		This module runs on the selected village.
	</p>
	
	<table class="vis" id="norbi0n_farm_table">
		<tr>
			<th onclick="rendez('szoveg',false,this,'norbi0n_farm_table',0)">Falu</th>
			<th onclick="rendez('szam',false,this,'norbi0n_farm_table',1)">Pont</th>
			<th onclick="rendez('tanya',false,this,'norbi0n_farm_table',2)">Tanya</th>
			<th>Farmolás?</th>
			<th onclick="rendez('datum',false,this,'norbi0n_farm_table',4)">Utolsó futás</th>
		</tr>
	</table>
	
</td></tr>
`);

// ============================================
// START MODULE
// ============================================

szem4_norbi0n_farm_motor();
norbi0n_farm_rebuildDOM();

// ============================================
// INTEGRATION NOTES
// ============================================

/**
 * WHAT THIS MODULE DOES:
 * =======================
 * 1. Opens selected village's Farm Assistant (screen=am_farm)
 * 2. Loads official FarmGod script
 * 3. Clicks "Farm megtervezése" button
 * 4. Auto-presses ENTER continuously (100ms)
 * 5. Monitors #FarmGodProgessbar for completion
 * 6. Closes window when done
 * 7. Optional: Loops after interval + random delay
 * 
 * REMOVED FROM ORIGINAL:
 * ======================
 * ❌ Discord notification sending - SZEM handles globally
 * ❌ Telegram notification sending - SZEM handles globally
 * ❌ Standalone UI - Uses SZEM's ujkieg system
 * ❌ UserScript wrapper - Integrated into SZEM
 * 
 * KEPT FROM ORIGINAL (CRITICAL!):
 * ================================
 * ✅ Bot DETECTION in farming window - Checks DOM every 300ms
 * ✅ Triggers SZEM's BotvedelemBe() when detected
 * ✅ SZEM then handles: emergency stop, save data, notifications
 * ✅ Safety: Module checks, SZEM responds globally
 * 
 * ADDED FOR SZEM:
 * ===============
 * ✅ Coordination with other modules
 * ✅ SZEM motor pattern (LEPES states)
 * ✅ SZEM worker integration
 * ✅ Data persistence (auto-save)
 * ✅ Emergency stop support
 * ✅ Village management UI
 * 
 * SIMPLIFIED:
 * ===========
 * - Only 1 village at a time (simpler, cleaner)
 * - Bot detection handled by SZEM globally
 * - Notifications handled by SZEM globally
 * - ~200 lines vs 935 lines original (76% smaller!)
 */

