# 🚜 Norbi0N_Farming Module - Architecture Design

## 📋 Overview

**Module Name:** Norbi0N_Farming  
**Type:** 3rd Party Script Automation  
**Integration:** SZEM 4.6 Extension Module  
**Coordination:** Smart pause system with other modules

---

## 🏗️ Architecture Analysis - Current SZEM

### **Existing Modules & Coordination:**

```javascript
Module          | Uses Window | Conflicts With    | Pause Variable
----------------|-------------|-------------------|----------------
Farmoló (Farm)  | FARM_REF    | ALL               | FARM_PAUSE
VIJE            | VIJE_REF1/2 | None (read-only)  | VIJE_PAUSE
Építő           | EPIT_REF    | Farm (same vill)  | EPIT_PAUSE
Gyűjtő          | GYUJTO_REF  | Farm (same vill)  | GYUJTO_PAUSE
```

### **Global Pause Triggers:**

```javascript
ALL modules check:
if (BOT || {MODULE}_PAUSE || USER_ACTIVITY) {
    pause;  // Don't work
}
```

### **Event System:**

```javascript
// Farm sends event when resting:
sendCustomEvent('farm_pihen');

// Others can listen:
document.addEventListener('farm_pihen', () => {
    // React to farm resting
});
```

---

## 🎯 Norbi0N_Farming - Integration Design

### **Module Structure:**

```javascript
// Variables
var NORBI0N_FARM_LEPES = 0;
var NORBI0N_FARM_REF;
var NORBI0N_FARM_HIBA = 0;
var NORBI0N_FARM_PAUSE = true;
var NORBI0N_FARM_SCRIPT_URL = '';  // Your 3rd party script URL

// Data Model
var SZEM4_NORBI0N_FARM = {
    ENABLED_VILLAGES: {},  // villageId: true/false
    SCRIPT_SETTINGS: {},   // 3rd party script configuration
    OPTIONS: {
        checkInterval: 60000,  // How often to check villages
        autoStart: false       // Auto-start on script load
    }
};

// Motor
function szem4_norbi0n_farm_motor() {
    var nexttime = 500;
    
    if (BOT || NORBI0N_FARM_PAUSE || USER_ACTIVITY || isAnyModuleBusy()) {
        nexttime = 5000;
    } else {
        // YOUR LOGIC
    }
    
    worker.postMessage({'id': 'norbi0n_farm', 'time': nexttime});
}
```

---

## 🔗 Smart Coordination System

### **Problem: Avoid Conflicts**

Modules can't work on SAME village SIMULTANEOUSLY:
- ❌ Farm attacking from Village A + Builder opening Village A = CONFLICT!
- ❌ Gyűjtő scavenging Village B + Norbi0N_Farm farming from B = CONFLICT!

### **Solution: Smart Pause Detection**

```javascript
/**
 * Checks if any module is actively working
 * Returns true if should pause Norbi0N_Farming
 */
function isAnyModuleBusy() {
    // Check if Farm is actively attacking (not resting)
    if (!FARM_PAUSE && FARM_LEPES !== 0) {
        debug('Norbi0N_Farm', 'Pausing: Farm module is attacking');
        return true;
    }
    
    // Check if Builder is actively building (not waiting)
    if (!EPIT_PAUSE && EPIT_LEPES !== 0) {
        debug('Norbi0N_Farm', 'Pausing: Builder is working');
        return true;
    }
    
    // Check if Scavenger is running
    if (!GYUJTO_PAUSE && GYUJTO_STATE !== 0) {
        debug('Norbi0N_Farm', 'Pausing: Scavenger is working');
        return true;
    }
    
    return false; // All clear!
}
```

---

## 📊 Coordination Matrix

### **When Each Module Can Run:**

| Norbi0N_Farm Can Run When: | Condition |
|----------------------------|-----------|
| ✅ Farm is PAUSED | `FARM_PAUSE == true` |
| ✅ Farm is RESTING | `FARM_LEPES == 0` (waiting for work) |
| ✅ VIJE can always run | VIJE doesn't conflict (read-only) |
| ✅ Builder is IDLE | `EPIT_LEPES == 0` (waiting) |
| ✅ Scavenger is IDLE | `GYUJTO_STATE == 0` |
| ✅ No BOT protection | `BOT == false` |
| ✅ User not active | `USER_ACTIVITY == false` |

---

## 🔄 Motor Integration

### **1. Add to Worker (line ~100-108):**

```javascript
worker.onmessage = function(worker_message) {
    switch(worker_message.id) {
        case 'farm': szem4_farmolo_motor(); break;
        case 'vije': szem4_VIJE_motor(); break;
        case 'epit': szem4_EPITO_motor(); break;
        case 'adatok': szem4_ADAT_motor(); break;
        case 'gyujto': szem4_GYUJTO_motor(); break;
        case 'norbi0n_farm': szem4_norbi0n_farm_motor(); break;  // ADD THIS
        default: debug('worker','Ismeretlen ID', JSON.stringify(worker_message))
    }
};
```

### **2. Add Stop Timer Case:**

```javascript
if (e.data.id == 'stopTimer') {
    clearTimeout(self.TIMERS[e.data.value]);
    // Also for norbi0n_farm
}
```

---

## 🎮 3rd Party Script Integration

### **Pattern (from Gyűjtő):**

```javascript
// Step 1: Open page
NORBI0N_FARM_REF = window.open(url, windowId);

// Step 2: Check page loaded
if (isPageLoaded(NORBI0N_FARM_REF, villageId, 'screen=place')) {
    
    // Step 3: Load your 3rd party script
    NORBI0N_FARM_REF.$.getScript(NORBI0N_FARM_SCRIPT_URL);
    
    // Step 4: Wait for script to initialize
    // Check for your script's DOM elements
    
    // Step 5: Interact with script
    // Click buttons, set options, etc.
    
    // Step 6: Monitor completion
    // Check when done, then close/move to next village
}
```

---

## 📝 Recommended Flow

### **Norbi0N_Farm Motor States:**

```javascript
case 0: // Select next village to farm from
    - Check ENABLED_VILLAGES
    - Find village not currently being processed
    - Check isAnyModuleBusy() → pause if yes
    - Open village or reuse window
    → LEPES = 1

case 1: // Load 3rd party script
    - if (isPageLoaded(NORBI0N_FARM_REF, villId, 'screen=place'))
    - Load script: $.getScript(NORBI0N_FARM_SCRIPT_URL)
    → LEPES = 2

case 2: // Wait for script initialization
    - Check for script's DOM elements
    - Verify script is ready
    → LEPES = 3

case 3: // Configure & Start script
    - Set your script's options
    - Click "Start" or trigger farming
    → LEPES = 4

case 4: // Monitor script execution
    - Check if script is done
    - Collect results/stats
    - When done → LEPES = 0 (next village)
```

---

## 🔧 Configuration Options

### **Settings to Add:**

```javascript
SZEM4_NORBI0N_FARM = {
    ENABLED_VILLAGES: {
        '123|456': true,
        '789|012': true
    },
    
    SCRIPT_SETTINGS: {
        scriptUrl: 'https://your-script-url.js',
        autoReload: true,        // Reload script each village?
        waitAfterDone: 5000     // Wait 5s after script finishes
    },
    
    OPTIONS: {
        cycleInterval: 60000,    // Check each village every 60s
        pauseOnConflict: true,   // Auto-pause if other module active
        closeOnDone: false       // Keep window open or close?
    },
    
    COORDINATION: {
        pauseIfFarmActive: true,     // Pause if old Farm is running
        pauseIfBuilderActive: true,  // Pause if Builder is working
        pauseIfScavengerActive: true // Pause if Scavenger is running
    }
};
```

---

## 🎛️ UI Design

### **Menu Structure:**

```html
<table class="vis">
    <tr><th colspan="2">⚙️ Norbi0N_Farming Beállítások</th></tr>
    
    <tr>
        <td>3rd Party Script URL:</td>
        <td><input type="text" size="60" id="norbi0n_farm_url" 
                   placeholder="https://...your-script.js"></td>
    </tr>
    
    <tr>
        <td>Koordináció:</td>
        <td>
            <input type="checkbox" id="pause_if_farm"> Szünet ha Farm aktív<br>
            <input type="checkbox" id="pause_if_builder"> Szünet ha Építő aktív<br>
            <input type="checkbox" id="pause_if_scavenger"> Szünet ha Gyűjtő aktív
        </td>
    </tr>
    
    <tr><th colspan="2">📋 Aktív Faluk</th></tr>
</table>

<!-- Village list similar to Gyűjtő -->
<table class="vis" id="norbi0n_farm_villages">
    <tr>
        <th>Falu</th>
        <th>Pont</th>
        <th>Tanya</th>
        <th>Farmolás?</th>
        <th>Utolsó futás</th>
    </tr>
    <!-- Dynamic rows -->
</table>
```

---

## 🔄 Event-Based Coordination

### **Recommended Events:**

```javascript
// Norbi0N_Farm sends:
sendCustomEvent('norbi0n_farm_start', {villageId: xxx});
sendCustomEvent('norbi0n_farm_done', {villageId: xxx, attacks: 5});
sendCustomEvent('norbi0n_farm_pause');

// Other modules listen:
document.addEventListener('norbi0n_farm_start', (e) => {
    // Maybe Builder should pause on this village?
});
```

---

## 🎯 Conflict Resolution Strategy

### **Priority System (Recommended):**

```
PRIORITY 1: USER_ACTIVITY (highest)
  → Everything pauses
  
PRIORITY 2: BOT
  → Everything pauses
  
PRIORITY 3: Builder (EPIT)
  → Farm, Norbi0N_Farm pause
  → Why? Building is time-sensitive
  
PRIORITY 4: Scavenger (GYUJTO)
  → Farm, Norbi0N_Farm pause
  → Why? Scavenging uses units
  
PRIORITY 5: Old Farm OR Norbi0N_Farm
  → User chooses which one to run
  → Can't run simultaneously (both use rally point)
```

---

## 🚀 Implementation Steps

### **Phase 1: Basic Structure** (Day 1)
- [ ] Create module skeleton
- [ ] Add to worker
- [ ] Create basic UI
- [ ] Add pause button
- [ ] Test motor runs

### **Phase 2: 3rd Party Integration** (Day 2)
- [ ] Load your script via $.getScript()
- [ ] Detect script initialization
- [ ] Configure script settings
- [ ] Trigger script execution
- [ ] Monitor completion

### **Phase 3: Coordination** (Day 3)
- [ ] Implement isAnyModuleBusy()
- [ ] Add event listeners
- [ ] Test with Farm running
- [ ] Test with Builder running
- [ ] Test with Scavenger running

### **Phase 4: Polish** (Day 4)
- [ ] Add statistics
- [ ] Add error handling
- [ ] Add data persistence
- [ ] Add sounds
- [ ] Documentation

---

## 🛠️ Technical Requirements

### **What I Need From You:**

1. **3rd Party Script URL** - Where is your farming script?
2. **Script's DOM Elements** - What elements does it create?
3. **How to Start It** - Button click? Function call?
4. **How to Know It's Done** - DOM change? Time-based?
5. **Configuration** - What settings does it have?

### **What I'll Build:**

1. ✅ Complete motor with states
2. ✅ Village selection system
3. ✅ Smart coordination (pause when conflicts)
4. ✅ Event system integration
5. ✅ UI with settings
6. ✅ Data persistence
7. ✅ Error handling
8. ✅ Debug logging

---

## 📊 Example Integration (Gyűjtő Pattern)

```javascript
// Your module will follow this proven pattern:

case 0: // Select village
    Find next enabled village
    if (isAnyModuleBusy()) pause;
    Open village
    → LEPES = 1

case 1: // Load script
    NORBI0N_FARM_REF.$.getScript('YOUR_SCRIPT_URL');
    → LEPES = 2

case 2: // Wait & Configure
    Check script loaded
    Set script options
    → LEPES = 3

case 3: // Execute
    Click start button / Call function
    Monitor execution
    When done → LEPES = 0
```

---

## 🎮 User Experience

### **How It Will Work:**

1. User opens SZEM
2. Goes to "NORBI0N_FARMING" tab
3. Enters 3rd party script URL
4. Selects villages to farm from
5. Configures coordination (pause when builder active, etc.)
6. Clicks ▶️ to start
7. Module:
   - Runs your script on each village
   - Automatically pauses when other modules need the villages
   - Resumes when clear
   - Logs everything

---

## 🔒 Safety Features

### **Built-in Protection:**

- ✅ Bot protection (global)
- ✅ Storage warning detection
- ✅ Conflict detection with other modules
- ✅ Error recovery (retry logic)
- ✅ Emergency stop (closes windows)
- ✅ Data auto-save

---

## 💡 Next Steps

**Tell me:**

1. **What's your 3rd party farming script?**
   - URL or file location?
   - Is it already written or should I help create it?

2. **What's the farming strategy?**
   - Template-based?
   - AI-based?
   - List-based?

3. **How should it work?**
   - One village at a time?
   - Multiple villages parallel?
   - Cycle through all?

4. **Coordination preferences:**
   - Should it pause when Builder active?
   - Should it pause when old Farm active?
   - Should old Farm pause when this runs?

---

**I'm ready to build it! Share your script details and strategy!** 🚀

*This will be a professional integration, better than anything else out there!* 💎

