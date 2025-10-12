# 🎯 How to Add Norbi0N_Farming to SZEM.js

## ✅ What I Created

**File:** `NORBI0N_FARM_INTEGRATION.js`

**What it does:**
- ✅ Uses your FarmGod automation logic
- ✅ Removed duplicate bot detection (SZEM has it)
- ✅ Removed duplicate notifications (SZEM has it)
- ✅ Added SZEM motor pattern
- ✅ Added coordination with other modules
- ✅ **76% smaller!** (200 lines vs 935 lines)

---

## 📋 Step-by-Step Integration

### **Step 1: Add to Worker** (Line ~101-108)

Find this:
```javascript
worker.onmessage = function(worker_message) {
    switch(worker_message.id) {
        case 'gyujto': szem4_GYUJTO_motor(); break;
```

Add AFTER 'gyujto':
```javascript
        case 'norbi0n_farm': szem4_norbi0n_farm_motor(); break;
```

---

### **Step 2: Add to Emergency Stop** (Line ~1344-1348)

Find this:
```javascript
worker.postMessage({'id': 'stopTimer', 'value': 'gyujto'});
```

Add AFTER:
```javascript
worker.postMessage({'id': 'stopTimer', 'value': 'norbi0n_farm'});
```

---

### **Step 3: Add Window to Close List** (Line ~1329)

Find this:
```javascript
{ ref: 'GYUJTO_REF', name: 'Gyűjtő' }
```

Add AFTER:
```javascript
{ ref: 'NORBI0N_FARM_REF', name: 'Norbi0N Farming' }
```

---

### **Step 4: Add to Recovery Restart** (Line ~1481)

Find this:
```javascript
szem4_GYUJTO_motor();
```

Add AFTER:
```javascript
szem4_norbi0n_farm_motor();
```

---

### **Step 5: Insert Module Code** (After Gyűjtő, ~Line 4335)

Find this:
```javascript
szem4_GYUJTO_motor();
```

After this section, copy-paste ENTIRE content of:
**`NORBI0N_FARM_INTEGRATION.js`**

---

### **Step 6: Add to Data Save** (Line ~3960)

Find this:
```javascript
case "gyujto": localStorage.setItem(AZON + '_gyujto', JSON.stringify(SZEM4_GYUJTO)); break;
```

Add AFTER:
```javascript
case "norbi0n_farm": localStorage.setItem(AZON + '_norbi0n_farm', JSON.stringify(SZEM4_NORBI0N_FARM)); break;
```

---

### **Step 7: Add to Data Load** (Line ~3988)

Find this:
```javascript
case "gyujto":
    SZEM4_GYUJTO = Object.assign({}, SZEM4_GYUJTO, dataObj);
    rebuildDOM_gyujto();
    break;
```

Add AFTER:
```javascript
case "norbi0n_farm":
    SZEM4_NORBI0N_FARM = Object.assign({}, SZEM4_NORBI0N_FARM, dataObj);
    norbi0n_farm_rebuildDOM();
    break;
```

---

### **Step 8: Add to Data Manager UI** (Line ~4233)

Find this:
```javascript
<tr><td><input type="checkbox" name="gyujto" checked></td><td>Gyűjtögető</td><td></td><td>'+szem4_ADAT_AddImageRow("gyujto")+'</td></tr>
```

Add AFTER:
```javascript
<tr><td><input type="checkbox" name="norbi0n_farm" checked></td><td>Norbi0N Farming</td><td></td><td>'+szem4_ADAT_AddImageRow("norbi0n_farm")+'</td></tr>
```

---

### **Step 9: Add to Extension List** (OPTIONAL)

If there's an ALL_EXTENSION array, add:
```javascript
ALL_EXTENSION.push('norbi0n_farm');
```

---

## 📝 Complete Files to Integrate

**Main file:** `NORBI0N_FARM_INTEGRATION.js` (~200 lines)

**Contains:**
- Variables
- Coordination function
- FarmGod injection function  
- Main motor (3 states)
- Helper functions
- UI registration
- Motor start

---

## 🎯 What It Will Do

### **User Experience:**

1. User opens SZEM
2. New tab: **"NORBI0N FARMING"**
3. User:
   - Sets loop interval (10 minutes)
   - Sets random delay (±3 minutes)
   - Enables loop mode (checkbox)
   - Selects 1 village from list
   - Clicks ▶️ Start (in kiegs menu)

4. SZEM:
   - Opens village's Farm Assistant
   - Loads FarmGod script
   - Auto-presses ENTER
   - Monitors progress bar
   - When done: Closes window
   - If loop mode: Waits 10±3 minutes, repeats

5. Coordination:
   - If Builder starts → Pauses Norbi0N_Farm
   - If old Farm starts → Pauses Norbi0N_Farm
   - When they finish → Resumes

---

## 🚀 Ready to Integrate?

**Say "GO"** and I'll:
1. Add all 9 integration points to SZEM.js
2. Test for syntax errors
3. Commit with detailed message
4. Push to GitHub

**Estimated time:** 10 minutes ⚡

---

## 📊 Comparison

| Original Module | SZEM Integration | Change |
|-----------------|------------------|--------|
| 935 lines | ~200 lines | ⬇️ 76% smaller |
| Separate bot detection | Uses SZEM's | ✅ No duplication |
| Separate notifications | Uses SZEM's | ✅ No duplication |
| Standalone UI | SZEM's ujkieg | ✅ Consistent |
| Multiple villages | 1 village (cleaner) | ✅ Simpler |
| Independent script | SZEM module | ✅ Integrated |

---

**Files organized in:** `Szem /Analyze/`
- Architecture docs ✅
- Integration code ✅
- Instructions ✅

**Ready when you are!** 🎯

