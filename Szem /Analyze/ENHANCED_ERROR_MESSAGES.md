# 🏗️ Enhanced Builder Error Messages

## Overview
Comprehensive bilingual (Hungarian/English) error messages for the Builder (Építő) module with detailed diagnostic information.

---

## 🎯 What Was Added

### **1. Building Already at Max Level**
```
❌ ${building} már maximális szinten (30)! / ${building} already at max level (30)! 
Építési lista frissítése szükséges. / Update build list needed.
```
- **Color:** Red
- **Retry:** 5 minutes
- **Cause:** Building reached level 30
- **Action:** Remove from build list

---

### **2. Page Not Fully Loaded**
```
⚠️ Oldal nem töltődött be teljesen. / Page not fully loaded. 
Újrapróbálás... / Retrying...
```
- **Color:** Yellow
- **Retry:** 10 seconds
- **Cause:** Buildings div not found
- **Action:** Wait for page to load

---

### **3. Prerequisite Missing**
```
⚠️ ${building} előfeltétele hiányzik! / ${building} prerequisite missing! 
Ellenőrizd a listát. / Check your list.
```
- **Color:** Yellow
- **Retry:** 2 minutes
- **Cause:** Building requires another building first
- **Action:** Build prerequisites first

---

### **4. Build Button Not Found**
```
❌ ${building} építési gomb nem található! / ${building} build button not found! 
Esetleg nem létező épület? / Invalid building ID?
```
- **Color:** Red
- **Retry:** 5 minutes
- **Cause:** Invalid building ID in list
- **Action:** Check building list syntax

---

### **5. Build Queue Full**
```
✅ Építkezési sor megtelt (2/3). / Build queue full (2/3). 
Hátralévő építési idő: HH:MM
```
- **Color:** Default (no error)
- **Retry:** When first building finishes
- **Cause:** Normal operation
- **Action:** Wait

---

### **6. Building at Maximum (Alternative Detection)**
```
❌ ${building} elérte a maximumot! / ${building} reached maximum! 
Töröld a listából. / Remove from list.
```
- **Color:** Red
- **Retry:** 5 minutes
- **Cause:** Game reports building is maxed
- **Action:** Remove from list

---

### **7. Not Enough Points**
```
⚠️ Nem elég pontod ehhez az épülethez! / Not enough points for this building! ${building}
```
- **Color:** Yellow
- **Retry:** 2 minutes
- **Cause:** Village points too low
- **Action:** Wait for village to grow

---

### **8. Building Row Not Found on Page**
```
❌ ${building} sor nem található az oldalon! / ${building} row not found on page! 
Érvénytelen épület ID? / Invalid building ID?
```
- **Color:** Red
- **Retry:** 5 minutes
- **Cause:** Building doesn't exist in game
- **Action:** Fix building list

---

### **9. Unknown Reason (Button Hidden)**
```
❓ ${building} nem építhető (ismeretlen ok). / ${building} cannot be built (unknown reason). 
Gomb rejtett de sor nem telt. / Button hidden but queue not full.
```
- **Color:** Yellow
- **Retry:** 30 seconds
- **Cause:** Rare edge case
- **Action:** Debug log shows details

---

### **10. Critical Error (Exception)**
```
💥 Kritikus hiba / Critical error: ${error_message}
```
- **Color:** Red
- **Retry:** 2 minutes
- **Cause:** JavaScript exception
- **Action:** Check Debug log

---

### **11. Resource Shortage (Enhanced)**
```
⚠️ Nyersanyag hiány! / Resource shortage! ${building}
Hiányzik/Missing: 🪵 1234, 🧱 567, ⚒️ 890
Hátralévő építési idő: HH:MM
```
- **Color:** Yellow
- **Retry:** Smart (min 20s, max 60s)
- **Cause:** Not enough resources
- **Action:** Shows exactly what's missing
- **New:** Shows individual resource deficits

---

### **12. Farm Maxed (Cannot Continue)**
```
❌ Tanya megtelt (30), építés nem folytatható! / Farm maxed (30), cannot continue building!
```
- **Color:** Red
- **Retry:** 2 minutes
- **Cause:** Farm at level 30, needs population
- **Action:** Cannot build further

---

### **13. Farm Building (Waiting)**
```
⏳ Tanya megtelt, de már építés alatt... / Farm full, but already building...
```
- **Color:** Yellow
- **Retry:** 2 minutes
- **Cause:** Farm upgrade in queue
- **Action:** Wait for completion

---

### **14. Village Completed**
```
🎉 ${village_name} (XXX|YYY) falu teljesen felépült és törlődött a listából / 
Village fully built and removed from list
```
- **Sound:** "falu_kesz"
- **Action:** Village removed from builder list
- **Logged:** In Napló

---

## 📊 Error Color Coding

| Color | Meaning | Examples |
|-------|---------|----------|
| **Red** | Critical - Manual intervention needed | Max level, Invalid building, Critical error |
| **Yellow** | Warning - Will retry automatically | Resource shortage, Prerequisites, Page loading |
| **Default** | Normal operation | Queue full, Building in progress |

---

## 🔍 Debug Logging

Every error now logs to Debug console with details:
```javascript
debug('szem4_EPITO_IntettiBuild', 'Building wood is maxed at level 30');
debug('szem4_EPITO_IntettiBuild', 'Build button for smith not found in DOM');
debug('szem4_EPITO_IntettiBuild', 'Resource shortage for barracks. Missing: 🪵 123, 🧱 456');
```

---

## 🎯 Smart Retry Times

| Error Type | Retry Time | Reason |
|------------|------------|--------|
| Max level | 5 minutes | Needs manual list update |
| Page loading | 10 seconds | Quick retry |
| Prerequisites | 2 minutes | Might need other builds first |
| Invalid building | 5 minutes | Serious config error |
| Queue full | Dynamic | Based on build time |
| Resource shortage | 20-60 sec | Smart based on build time |
| Unknown error | 30 seconds | Investigate quickly |
| Critical error | 2 minutes | Give time to stabilize |

---

## 🆚 Before vs After

### **Before:**
```
Info: Ismeretlen hiba. 00:00
```
**Result:** User has no idea what's wrong

### **After:**
```
Info: ❌ barracks már maximális szinten (30)! / barracks already at max level (30)! 
Építési lista frissítése szükséges. / Update build list needed.
```
**Result:** User knows exactly what to do

---

## 🧪 Testing

### Test Each Error:

1. **Max Level:** Add `main 31` to build list
2. **Page Loading:** Set very fast motor speed
3. **Prerequisites:** Add `snob 1` to new village
4. **Invalid Building:** Add `fakebuilding 10` to list
5. **Queue Full:** Normal operation with 2 buildings
6. **Resource Shortage:** Build expensive building in poor village
7. **Farm Maxed:** Village with farm 30 and no population
8. **Village Complete:** Empty building list

---

## 💡 Benefits

✅ **User knows what's wrong immediately**
✅ **Bilingual support** (Hungarian + English)
✅ **Emojis** for quick visual recognition
✅ **Detailed debug logs** for troubleshooting
✅ **Smart retry times** - don't waste resources
✅ **Actionable messages** - tells user what to do
✅ **Better diagnostics** - easier to debug issues

---

## 🔮 Future Improvements

Possible additions:
- 📊 Statistics: How many times each error occurred
- 🔔 Notifications: Alert on critical errors
- 🤖 Auto-fix: Automatically remove maxed buildings from list
- 📝 Suggestions: "Consider building X first"
- 🎨 Color-coded village rows based on status

---

*Last Updated: 2025-10-05*
*SZEM Version: v4.6 Build 23.11.13 + Enhanced Errors*

