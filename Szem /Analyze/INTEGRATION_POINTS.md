# 🔧 Norbi0N_Farming - Integration Points in SZEM.js

## Where to Add Code in SZEM.js

---

### **1. Worker Message Handler** (Line ~100-108)

```javascript
worker.onmessage = function(worker_message) {
    switch(worker_message.id) {
        case 'farm': szem4_farmolo_motor(); break;
        case 'vije': szem4_VIJE_motor(); break;
        case 'epit': szem4_EPITO_motor(); break;
        case 'adatok': szem4_ADAT_motor(); break;
        case 'gyujto': szem4_GYUJTO_motor(); break;
        case 'norbi0n_farm': szem4_norbi0n_farm_motor(); break;  // ← ADD THIS
        default: debug('worker','Ismeretlen ID')
    }
};
```

---

### **2. Emergency Stop** (Line ~1344-1348)

```javascript
// Stop all worker timers
worker.postMessage({'id': 'stopTimer', 'value': 'farm'});
worker.postMessage({'id': 'stopTimer', 'value': 'vije'});
worker.postMessage({'id': 'stopTimer', 'value': 'epit'});
worker.postMessage({'id': 'stopTimer', 'value': 'adatok'});
worker.postMessage({'id': 'stopTimer', 'value': 'gyujto'});
worker.postMessage({'id': 'stopTimer', 'value': 'norbi0n_farm'});  // ← ADD THIS
```

---

### **3. Emergency Stop - Close Windows** (Line ~1324-1330)

```javascript
const refsToClose = [
    { ref: 'FARM_REF', name: 'Farmoló' },
    { ref: 'VIJE_REF1', name: 'Jelentés elemző 1' },
    { ref: 'VIJE_REF2', name: 'Jelentés elemző 2' },
    { ref: 'EPIT_REF', name: 'Építő' },
    { ref: 'GYUJTO_REF', name: 'Gyűjtő' },
    { ref: 'NORBI0N_FARM_REF', name: 'Norbi0N_Farming' }  // ← ADD THIS
];
```

---

### **4. Recovery - Restart Motors** (Line ~1476-1482)

```javascript
// Restart all motors
setTimeout(() => {
    szem4_farmolo_motor();
    szem4_VIJE_motor();
    szem4_EPITO_motor();
    szem4_GYUJTO_motor();
    szem4_norbi0n_farm_motor();  // ← ADD THIS
}, 1000);
```

---

### **5. Data Save** (Line ~3950-3960)

```javascript
function szem4_ADAT_saveNow(tipus) {
    switch (tipus) {
        case "farm":   localStorage.setItem(AZON+"_farm", JSON.stringify(SZEM4_FARM)); break;
        case "epit":   szem4_ADAT_epito_save(); break;
        case "vije":   localStorage.setItem(AZON+"_vije", JSON.stringify(SZEM4_VIJE)); break;
        case "sys":    localStorage.setItem(AZON+"_sys", JSON.stringify(SZEM4_SETTINGS)); break;
        case "gyujto": localStorage.setItem(AZON + '_gyujto', JSON.stringify(SZEM4_GYUJTO)); break;
        case "norbi0n_farm": localStorage.setItem(AZON+"_norbi0n_farm", JSON.stringify(SZEM4_NORBI0N_FARM)); break;  // ← ADD THIS
    }
}
```

---

### **6. Data Load** (Line ~3965-3990)

```javascript
function szem4_ADAT_loadNow(tipus) {
    switch (tipus) {
        // ... existing cases ...
        case "norbi0n_farm":  // ← ADD THIS
            SZEM4_NORBI0N_FARM = Object.assign({}, SZEM4_NORBI0N_FARM, dataObj);
            norbi0n_farm_rebuildDOM();
            break;
    }
}
```

---

### **7. Data Manager UI** (Line ~4220-4235)

Add new row to Adatmentő table:

```html
<tr>
    <td><input type="checkbox" name="norbi0n_farm" checked></td>
    <td>Norbi0N_Farming</td>
    <td></td>
    <td>'+szem4_ADAT_AddImageRow("norbi0n_farm")+'</td>
</tr>
```

---

### **8. Module Registration** (After Gyűjtő, around line ~4300)

```javascript
// Insert all your module code here:
// - Variables
// - Functions
// - Motor
// - UI registration (ujkieg)
// - Sounds (ujkieg_hang)
// - Start motor
```

---

## 📊 Integration Checklist

When integrating Norbi0N_Farming:

- [ ] Add to worker.onmessage (motor routing)
- [ ] Add to emergencyStopAll (window closing)
- [ ] Add to emergencyStopAll (timer stopping)
- [ ] Add to BotvedelemKi (motor restart)
- [ ] Add to szem4_ADAT_saveNow (data persistence)
- [ ] Add to szem4_ADAT_loadNow (data loading)
- [ ] Add to Adatmentő UI table (save/load buttons)
- [ ] Add module code after Gyűjtő section
- [ ] Register with ujkieg()
- [ ] Register sounds with ujkieg_hang()
- [ ] Start motor
- [ ] Update ALL_EXTENSION array (for auto-save)

---

## 🎨 Exact Locations

### **File: Szem /SZEM.js**

```
Line ~101    : worker.onmessage switch
Line ~1330   : emergencyStopAll - close windows
Line ~1347   : emergencyStopAll - stop timers
Line ~1478   : BotvedelemKi - restart motors
Line ~3950   : szem4_ADAT_saveNow switch
Line ~3975   : szem4_ADAT_loadNow switch
Line ~4230   : Adatmentő UI table
Line ~4300   : INSERT MODULE HERE (after Gyűjtő)
```

---

## 🔍 Reference Modules

### **For 3rd Party Integration:**
→ Study: **Gyűjtő** (line 4190-4330)
- Loads TwCheese script
- Waits for initialization
- Clicks buttons
- Monitors completion

### **For Village Management:**
→ Study: **Gyűjtő** UI (line 4300-4335)
- Village selection checkboxes
- Toggle functions
- Data persistence

### **For Window Reuse:**
→ Study: **Építő** (line 4057-4062)
- Window persistence
- Title updates
- Navigation reuse

---

## 🎯 Next Steps

**READY WHEN YOU ARE!**

Send me:
1. Your 3rd party script (URL or code)
2. How it works
3. Any special requirements

I'll integrate it **perfectly** into SZEM! 🚀

---

**Files Created:**
- `ARCHITECTURE_DESIGN.md` - Full technical design
- `MODULE_SKELETON.js` - Code template ready to customize
- `READY_TO_BUILD.md` - This file
- `INTEGRATION_POINTS.md` - Exact locations in SZEM.js

**Estimated time:** 30-60 minutes to full integration ⚡

**Your move!** What's your farming script? 😊

