# Known Bugs / Ismert Hibák

## BUG #1: Wall + Main NOT Sent Together (OPEN)

### Description / Leírás
When both wall and main need attacks, only the WALL is processed. Main must wait for the next spy report.

Ha mind a fal, mind a főhadiszállás támadást igényel, csak a FAL kerül feldolgozásra. A főhadiszállás a következő kémjelentésre vár.

### Location / Hely
`sendAttack()` function, line ~700

```javascript
const attack = attackInfo.attacks[0]; // Process one target at a time
```

### Current Behavior / Jelenlegi viselkedés
- `analyzeReport()` correctly adds BOTH wall and main to `attacks[]` array
- BUT `sendAttack()` only processes `attacks[0]` (the first one = wall)
- Main attack is ignored in the current session

### Example / Példa
**Report:** wall=10, main=5, barracks=3

**Expected (user wants):**
- Wave 1: 45 rams → wall (10→0)
- Wave 2: catapults → main (5→4)
- Wave 3: catapults → main (4→3)
- Wave 4: catapults → main (3→2)
- Wave 5: catapults → main (2→1) + spy

**Actual (current behavior):**
- Wave 1: 45 rams → wall (10→0)
- DONE - script goes to next report
- Main is NOT attacked!

### Workaround / Megoldás
After the wall attack completes and you get a new spy report, the script will then attack main (since wall is now 0).

### Fix Required / Javítás szükséges
Modify `sendAttack()` to process ALL attacks in the `attacks[]` array, not just `attacks[0]`.

This requires:
1. Building a combined wave list from all attacks
2. Sending wall waves first, then main waves
3. Only notifying master after ALL waves are complete

### Priority / Prioritás
**MEDIUM** - Script still works, just requires an extra spy report cycle.

---

## Fixed Bugs / Javított hibák

### BUG #2: Spy Required Even When None Available (FIXED)
**Fixed in:** v1.1.1

Spy is now OPTIONAL. If no spy available, attack proceeds without spy.

### BUG #3: Barracks Target Level Was 1 Instead of 0 (FIXED)
**Fixed in:** v1.1.1

Changed `maxLevels.barracks` from 1 to 0. Now barracks is destroyed completely.

---

*Last updated: 2025-01-XX*
