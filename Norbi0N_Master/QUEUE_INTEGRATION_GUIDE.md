# 🎯 Queue System Integration Guide

## Overview

The Master Control Panel provides a **Priority-Based Queue System** to prevent module conflicts. Only ONE module can work at a time.

---

## 🎨 Priority Levels

```javascript
Farm:      Priority 1  (Highest - always goes first)
Scavenger: Priority 2
Builder:   Priority 3
Recruiter: Priority 4  (Lowest)
```

---

## 📝 How to Integrate in Your Module

### Step 1: Check if Queue System is Available

```javascript
function isQueueSystemAvailable() {
    return typeof window.Norbi0N_QueueSystem !== 'undefined';
}
```

### Step 2: Request Slot Before Working

**IMPORTANT:** Always request permission before doing any work!

```javascript
async function doWork() {
    // Check if queue system is available
    if (!isQueueSystemAvailable()) {
        console.warn('[MODULE] Queue system not available - proceeding anyway');
        // Do your work directly (fallback mode)
        await performTask();
        return;
    }
    
    // Request slot from queue system
    const moduleName = 'farm'; // or 'scavenger', 'builder', 'recruiter'
    
    await window.Norbi0N_QueueSystem.requestSlot(moduleName, async () => {
        console.log(`[${moduleName.toUpperCase()}] Starting work...`);
        
        // DO YOUR WORK HERE
        await performTask();
        
        console.log(`[${moduleName.toUpperCase()}] Work completed!`);
        // Slot will be released automatically after callback finishes
    });
}

async function performTask() {
    // Your actual work logic here
    // Example: farming loop, recruiting troops, building, etc.
}
```

---

## 🔄 Example: Farm Module Integration

```javascript
async function startFarmingLoop() {
    // Request slot from Master Control
    await window.Norbi0N_QueueSystem.requestSlot('farm', async () => {
        console.log('[FARM] Starting farming sequence...');
        
        // Navigate to farm assistant
        window.location.href = '/game.php?screen=am_farm';
        
        // Wait for page load
        await new Promise(r => setTimeout(r, 2000));
        
        // Start farming
        const startButton = document.querySelector('#start_button');
        if (startButton) {
            startButton.click();
            console.log('[FARM] Farming started!');
        }
        
        // Wait for farming to complete (e.g., 3 minutes)
        await new Promise(r => setTimeout(r, 180000));
        
        console.log('[FARM] Farming sequence complete!');
        // Slot released automatically
    });
}
```

---

## 🗺️ Example: Scavenger Module Integration

```javascript
async function startScavenging() {
    await window.Norbi0N_QueueSystem.requestSlot('scavenger', async () => {
        console.log('[SCAVENGER] Starting scavenging...');
        
        // Navigate to scavenging page
        window.location.href = '/game.php?screen=place&mode=scavenge';
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Send scavenging missions
        const scavButtons = document.querySelectorAll('.scavenge-option-button');
        scavButtons.forEach(btn => btn.click());
        
        console.log('[SCAVENGER] Scavenging complete!');
        // Slot released automatically
    });
}
```

---

## ⏱️ What Happens When Modules Overlap?

### Scenario: Farm is running, Scavenger wants to start

```
Timeline:
00:00 - Farm requests slot ✅ GRANTED (starts immediately)
00:00 - Farm is working... 
00:30 - Scavenger requests slot ⏳ QUEUED (farm has priority 1 vs scavenger priority 2)
03:00 - Farm completes work ✅
03:00 - Scavenger automatically starts ✅
```

**Result:** No conflicts! Scavenger waits ~3 minutes, then executes.

---

## 🚀 Best Practices

### ✅ DO:
- Always request slot before starting work
- Keep work duration reasonable (< 5 minutes per cycle)
- Release slot by completing callback function
- Handle errors gracefully inside callback

### ❌ DON'T:
- Start work without requesting slot
- Leave infinite loops running inside callback
- Assume you have exclusive access without queue
- Forget to await the callback completion

---

## 🔍 Checking Queue Status

```javascript
// Get current queue status
const status = window.Norbi0N_QueueSystem.getStatus();

console.log('Current task:', status.currentTask);      // e.g., 'farm'
console.log('Queue length:', status.queueLength);      // e.g., 2
console.log('Waiting modules:', status.waitingModules); // e.g., ['scavenger', 'builder']
```

---

## 🎬 Real-World Example: Complete Module Loop

```javascript
// In your module's main loop
async function mainLoop() {
    while (isModuleEnabled) {
        // Request slot
        await window.Norbi0N_QueueSystem.requestSlot('farm', async () => {
            console.log('[FARM] My turn! Starting work...');
            
            // Do work
            await farmVillages();
            
            console.log('[FARM] Work done!');
        });
        
        // Wait before next cycle (e.g., 30 minutes)
        await new Promise(r => setTimeout(r, 1800000));
    }
}

async function farmVillages() {
    // Your farming logic here
    console.log('Farming villages...');
    await new Promise(r => setTimeout(r, 3000)); // Simulate work
}
```

---

## 🛠️ Testing Your Integration

1. **Enable your module** from Master Control Panel
2. **Open browser console** (F12)
3. **Look for queue messages**:
   ```
   [QUEUE] farm requesting slot...
   [QUEUE] ▶️ Executing: farm (Priority 1)
   [FARM] Starting work...
   [FARM] Work done!
   [QUEUE] ✅ farm completed
   [QUEUE] farm releasing slot
   [QUEUE] Queue empty - system idle
   ```

4. **Check the Queue Status UI** in Master Control Panel:
   - Shows currently running module
   - Shows waiting modules
   - Updates in real-time

---

## ❓ FAQ

**Q: What if I don't use the queue system?**  
A: Your module will work, but may conflict with others if they run simultaneously.

**Q: Can I skip the queue for urgent tasks?**  
A: No. The priority system ensures fairness. Use a higher priority module for urgent work.

**Q: What happens if my callback throws an error?**  
A: The queue system catches it, logs it, and releases the slot automatically.

**Q: How long can my task run?**  
A: Keep it under 5 minutes per cycle. Long tasks block other modules.

---

## 🎉 Summary

1. **Always request slot** before working
2. **Do work inside callback** function
3. **Let queue handle** coordination
4. **Check console** for queue messages
5. **Monitor Queue Status** in Master Control Panel

**The queue system ensures smooth, conflict-free automation!** 🚀

