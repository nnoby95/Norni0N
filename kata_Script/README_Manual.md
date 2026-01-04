# Report Catapult Auto-Attack - User Manual / Felhasználói Kézikönyv

---

## English Version

### Overview

This Tampermonkey/Greasemonkey script automates catapult and ram attacks from spy reports in Tribal Wars. It analyzes spy reports, calculates the required siege units, and sends attacks automatically.

### Installation

1. Install Tampermonkey (Chrome) or Greasemonkey (Firefox)
2. Create a new script and paste the code from `Report_catapult.user.js`
3. Save and enable the script
4. Navigate to any Tribal Wars spy report

### How It Works

#### Two Operating Modes

The script has **two modes** that determine how buildings are attacked:

##### Normal Mode (Default)
One building type per spy report - safer and more controlled:
- Report 1: Wall + Barracks (if needed)
- Report 2: Main (only if Wall=0 AND Barracks=0)
- Report 3+: Other buildings (only after Wall, Barracks, Main done)

##### Spirit Mode
All buildings from ONE spy report - aggressive, sends all attacks in one batch:
- ONE report processes: Wall → Barracks → Main → Other buildings
- All waves sent sequentially without waiting for new spy data
- Faster but uses more troops (no updated intel between waves)

**Enable Spirit Mode** in Settings → "Spirit Mód" checkbox

##### Mode Comparison

| Feature | Normal Mode | Spirit Mode |
|---------|-------------|-------------|
| Reports needed | Multiple (safer) | One (faster) |
| Intel updates | New spy between phases | Uses initial spy only |
| Troop efficiency | Better (updated info) | Lower (may overkill) |
| Speed | Slower | Much faster |
| Best for | Precision attacks | Mass farming |

#### Priority System

Both modes follow the same priority order:

| Priority | Target | Unit | Behavior |
|----------|--------|------|----------|
| 1 | **Wall** | Rams | Destroys wall to level 0 in ONE attack |
| 2 | **Barracks** | Catapults | Reduces to configured level (default: 0) |
| 3 | **Main (HQ)** | Catapults | Reduces to configured level (default: 1) |
| 4 | **Other buildings** | Catapults | Stable, Garage, etc. (configurable) |

**Difference:**
- **Normal Mode:** Stops after Wall+Barracks, waits for next report for Main
- **Spirit Mode:** Continues to Main and other buildings from same report

#### Attack Mechanics

- **Rams (Wall):** One attack destroys the wall completely (e.g., wall level 10 → 0)
- **Catapults (Buildings):** One wave reduces building by 1 level (e.g., main 5→4→3→2→1 = 4 waves)

### User Interface

When you open a spy report of a **barbarian village**, a panel appears with:

- **Status:** Shows what attack is needed (target, levels, waves)
- **"Támadás küldése" (Send Attack):** Sends the calculated attack
- **"Következő" (Next):** Go to next report
- **"Beállítások" (Settings):** Open configuration
- **"AUTO ON/OFF":** Toggle automatic mode

### Settings

Click "Beállítások" to configure:

#### Building Maximum Levels
Set the target level for each building. The script attacks if the building is **above** this level.

| Setting | Default | Meaning |
|---------|---------|---------|
| Main | 1 | Attack if main > 1 |
| Barracks | 0 | Attack if barracks > 0 |
| Stable | 0 | Attack if stable > 0 |
| Garage | 0 | Attack if garage > 0 |
| Wall | 0 | Attack if wall > 0 |
| Smith | 20 | Never attack (max is 20) |
| Market | 20 | Never attack (max is 20) |

#### Catapult Escort
Units sent with catapult attacks:
- **Axe:** Default 10
- **Spy:** Default 1 (only on last wave)

#### Wall Templates
Customize rams and escort for each wall level (1-20). Default values are from official Tribal Wars tables.

#### Timing
- **Action delay:** 500-700ms between actions
- **Report delay:** 800-1200ms between reports

#### Other Settings
- **Spirit Mód:** Enable to send all building attacks from one report (Wall → Barracks → Main → Others in one batch)
- **Auto advance:** Automatically move to next report after attack
- **Debug mode:** Enable console logging for troubleshooting

### AUTO Mode

When AUTO is enabled:
1. Script analyzes current report
2. If barbarian + needs attack → sends attack
3. After attack complete → moves to next report
4. Repeats until no more reports or troops run out

**Note:** AUTO only works on barbarian villages with spy data.

### Example Scenarios

#### Normal Mode Examples

**Scenario 1: Wall=10, Main=5, Barracks=3**
```
Report #1:
  Wave 1: 45 rams → wall (10→0)
  Wave 2: 2 catapults → barracks (3→2)
  Wave 3: 2 catapults → barracks (2→1)
  Wave 4: 2 catapults → barracks (1→0) + spy
  [DONE - Next report]

Report #2 (after new spy):
  Wave 1: 9 catapults → main (5→4)
  Wave 2: 8 catapults → main (4→3)
  Wave 3: 8 catapults → main (3→2)
  Wave 4: 7 catapults → main (2→1) + spy
  [DONE]
```
Normal Mode waits for new spy data between Wall/Barracks and Main.

**Scenario 2: Wall=0, Main=1, Barracks=3**
```
Wave 1: 2 catapults → barracks (3→2)
Wave 2: 2 catapults → barracks (2→1)
Wave 3: 2 catapults → barracks (1→0) + spy
[DONE - Next report]
```
Main is already at target level (1), so only barracks is attacked.

#### Spirit Mode Examples

**Scenario 1: Wall=3, Main=4, Barracks=2**
```
ONE REPORT - All waves:
  Wave 1: 7 rams → wall (3→0)           [RAM WAVE]
  Wave 2: 2 catapults → barracks (2→1)  [CATAPULT]
  Wave 3: 2 catapults → barracks (1→0)  [CATAPULT]
  Wave 4: 8 catapults → main (4→3)      [CATAPULT]
  Wave 5: 8 catapults → main (3→2)      [CATAPULT]
  Wave 6: 7 catapults → main (2→1) + spy [CATAPULT - last wave]
  [DONE - 6 total waves from ONE report]
```
Spirit Mode sends everything in one batch without waiting for new spy data.

**Scenario 2: Wall=5, Main=3, Barracks=4, Stable=2**
```
ONE REPORT - All buildings:
  Wave 1: 14 rams → wall (5→0)
  Wave 2: 2 catapults → barracks (4→3)
  Wave 3: 2 catapults → barracks (3→2)
  Wave 4: 2 catapults → barracks (2→1)
  Wave 5: 2 catapults → barracks (1→0)
  Wave 6: 8 catapults → main (3→2)
  Wave 7: 7 catapults → main (2→1)
  Wave 8: 2 catapults → stable (2→1)
  Wave 9: 2 catapults → stable (1→0) + spy
  [DONE - 9 total waves]
```
Processes Wall → Barracks → Main → Stable all from one spy report.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Panel not showing | Make sure you're on a spy report of a barbarian village |
| "Nem barbár falu" | Script only attacks barbarian villages |
| "Nincs elég csapat" | Not enough troops - script moves to next report |
| Attacks not sending | Check if worker tab opens correctly |
| Spirit Mode sends too many waves | This is normal - Spirit Mode sends all attacks from one report without updated intel |
| AUTO won't stop | Click AUTO OFF button - fix implemented in v1.2.0 |
| Wrong building targeted | Fixed in v1.2.0 - each wave now targets correct building |

---

## Magyar Verzió

### Áttekintés

Ez a Tampermonkey/Greasemonkey script automatizálja a katapult és faltörő támadásokat kémjelentésekből a Törzsi Háborúban. Elemzi a kémjelentéseket, kiszámítja a szükséges ostromegységeket, és automatikusan küldi a támadásokat.

### Telepítés

1. Telepítsd a Tampermonkey-t (Chrome) vagy Greasemonkey-t (Firefox)
2. Hozz létre új scriptet és illeszd be a `Report_catapult.user.js` kódját
3. Mentsd el és engedélyezd a scriptet
4. Navigálj bármelyik Törzsi Háború kémjelentéshez

### Működési Elv

#### Két Működési Mód

A scriptnek **két módja** van, amelyek meghatározzák hogyan támadja az épületeket:

##### Normál Mód (Alapértelmezett)
Egy épülettípus kémjelentésenként - biztonságosabb és kontrolláltabb:
- 1. jelentés: Fal + Barakk (ha szükséges)
- 2. jelentés: Főhadiszállás (csak ha Fal=0 ÉS Barakk=0)
- 3.+ jelentés: Egyéb épületek (csak a Fal, Barakk, Főhadi után)

##### Spirit Mód
Minden épület EGY kémjelentésből - agresszív, minden támadást egy csomagban küld:
- EGY jelentés feldolgozza: Fal → Barakk → Főhadi → Egyéb épületek
- Minden hullám egymás után küldve, új kémadatra való várakozás nélkül
- Gyorsabb, de több csapatot használ (nincs frissített intel a hullámok között)

**Spirit Mód Engedélyezése:** Beállítások → "Spirit Mód" jelölőnégyzet

##### Mód Összehasonlítás

| Jellemző | Normál Mód | Spirit Mód |
|----------|------------|------------|
| Szükséges jelentések | Több (biztonságosabb) | Egy (gyorsabb) |
| Intel frissítések | Új kém fázisok között | Csak kezdeti kém |
| Csapat hatékonyság | Jobb (frissített info) | Alacsonyabb (túlzás) |
| Sebesség | Lassabb | Sokkal gyorsabb |
| Legjobb erre | Precíz támadások | Tömeges farmolás |

#### Prioritási Rendszer

Mindkét mód ugyanazt a prioritási sorrendet követi:

| Prioritás | Célpont | Egység | Viselkedés |
|-----------|---------|--------|------------|
| 1 | **Fal** | Faltörő | Lerombolja a falat 0 szintre EGY támadással |
| 2 | **Barakk** | Katapult | Csökkenti a beállított szintre (alapértelmezett: 0) |
| 3 | **Főhadiszállás** | Katapult | Csökkenti a beállított szintre (alapértelmezett: 1) |
| 4 | **Többi épület** | Katapult | Istálló, Műhely, stb. (beállítható) |

**Különbség:**
- **Normál Mód:** Fal+Barakk után megáll, következő jelentésre vár a Főhadinál
- **Spirit Mód:** Folytatja a Főhadival és egyéb épületekkel ugyanabból a jelentésből

#### Támadási Mechanika

- **Faltörő (Fal):** Egy támadás teljesen lerombolja a falat (pl. fal 10 → 0)
- **Katapult (Épületek):** Egy hullám 1 szinttel csökkenti az épületet (pl. főhadi 5→4→3→2→1 = 4 hullám)

### Felhasználói Felület

Amikor megnyitsz egy **barbár falu** kémjelentését, megjelenik egy panel:

- **Státusz:** Mutatja milyen támadás szükséges (célpont, szintek, hullámok)
- **"Támadás küldése":** Elküldi a kiszámított támadást
- **"Következő":** Következő jelentésre ugrik
- **"Beállítások":** Konfiguráció megnyitása
- **"AUTO ON/OFF":** Automatikus mód kapcsolása

### Beállítások

Kattints a "Beállítások" gombra a konfiguráláshoz:

#### Épület Maximális Szintek
Állítsd be a cél szintet minden épülethez. A script támad, ha az épület **e fölött** a szint fölött van.

| Beállítás | Alapértelmezett | Jelentés |
|-----------|-----------------|----------|
| Főhadiszállás | 1 | Támad ha főhadi > 1 |
| Barakk | 0 | Támad ha barakk > 0 |
| Istálló | 0 | Támad ha istálló > 0 |
| Műhely | 0 | Támad ha műhely > 0 |
| Fal | 0 | Támad ha fal > 0 |
| Kovácsműhely | 20 | Sosem támad (max 20) |
| Piac | 20 | Sosem támad (max 20) |

#### Katapult Kíséret
Katapult támadásokkal küldött egységek:
- **Bárdos:** Alapértelmezett 10
- **Felderítő:** Alapértelmezett 1 (csak az utolsó hullámnál)

#### Fal Sablonok
Testreszabható faltörő és kíséret minden fal szinthez (1-20). Az alapértelmezett értékek a hivatalos Törzsi Háború táblázatból származnak.

#### Időzítés
- **Akció késleltetés:** 500-700ms akciók között
- **Jelentés késleltetés:** 800-1200ms jelentések között

#### Egyéb Beállítások
- **Spirit Mód:** Engedélyezd az összes épület támadásának küldését egy jelentésből (Fal → Barakk → Főhadi → Egyéb egy csomagban)
- **Automatikus következő jelentés:** Automatikus lépés a következő jelentésre támadás után
- **Debug mód:** Konzol naplózás engedélyezése hibaelhárításhoz

### AUTO Mód

Amikor az AUTO engedélyezve van:
1. Script elemzi az aktuális jelentést
2. Ha barbár + támadás szükséges → küldi a támadást
3. Támadás befejezése után → következő jelentésre lép
4. Ismétli amíg van jelentés vagy elfogy a csapat

**Megjegyzés:** Az AUTO csak barbár falvakon működik kémadatokkal.

### Példa Forgatókönyvek

#### Normál Mód Példák

**1. Forgatókönyv: Fal=10, Főhadi=5, Barakk=3**
```
Jelentés #1:
  1. hullám: 45 faltörő → fal (10→0)
  2. hullám: 2 katapult → barakk (3→2)
  3. hullám: 2 katapult → barakk (2→1)
  4. hullám: 2 katapult → barakk (1→0) + kém
  [KÉSZ - Következő jelentés]

Jelentés #2 (új kém után):
  1. hullám: 9 katapult → főhadi (5→4)
  2. hullám: 8 katapult → főhadi (4→3)
  3. hullám: 8 katapult → főhadi (3→2)
  4. hullám: 7 katapult → főhadi (2→1) + kém
  [KÉSZ]
```
Normál Mód vár új kémadatra a Fal/Barakk és Főhadi között.

**2. Forgatókönyv: Fal=0, Főhadi=1, Barakk=3**
```
1. hullám: 2 katapult → barakk (3→2)
2. hullám: 2 katapult → barakk (2→1)
3. hullám: 2 katapult → barakk (1→0) + kém
[KÉSZ - Következő jelentés]
```
A főhadi már a cél szinten van (1), így csak a barakk kerül támadásra.

#### Spirit Mód Példák

**1. Forgatókönyv: Fal=3, Főhadi=4, Barakk=2**
```
EGY JELENTÉS - Minden hullám:
  1. hullám: 7 faltörő → fal (3→0)           [FALTÖRŐ]
  2. hullám: 2 katapult → barakk (2→1)       [KATAPULT]
  3. hullám: 2 katapult → barakk (1→0)       [KATAPULT]
  4. hullám: 8 katapult → főhadi (4→3)       [KATAPULT]
  5. hullám: 8 katapult → főhadi (3→2)       [KATAPULT]
  6. hullám: 7 katapult → főhadi (2→1) + kém [KATAPULT - utolsó]
  [KÉSZ - 6 hullám összesen EGY jelentésből]
```
Spirit Mód mindent egy csomagban küld, új kémadatra való várakozás nélkül.

**2. Forgatókönyv: Fal=5, Főhadi=3, Barakk=4, Istálló=2**
```
EGY JELENTÉS - Minden épület:
  1. hullám: 14 faltörő → fal (5→0)
  2. hullám: 2 katapult → barakk (4→3)
  3. hullám: 2 katapult → barakk (3→2)
  4. hullám: 2 katapult → barakk (2→1)
  5. hullám: 2 katapult → barakk (1→0)
  6. hullám: 8 katapult → főhadi (3→2)
  7. hullám: 7 katapult → főhadi (2→1)
  8. hullám: 2 katapult → istálló (2→1)
  9. hullám: 2 katapult → istálló (1→0) + kém
  [KÉSZ - 9 hullám összesen]
```
Feldolgozza Fal → Barakk → Főhadi → Istálló mind egy kémjelentésből.

### Hibaelhárítás

| Probléma | Megoldás |
|----------|----------|
| Panel nem jelenik meg | Győződj meg róla, hogy barbár falu kémjelentésén vagy |
| "Nem barbár falu" | A script csak barbár falvakat támad |
| "Nincs elég csapat" | Nincs elég egység - script következő jelentésre lép |
| Támadások nem indulnak | Ellenőrizd, hogy a munkafül megfelelően nyílik-e |
| Spirit Mód túl sok hullámot küld | Ez normális - Spirit Mód minden támadást küld egy jelentésből frissített intel nélkül |
| AUTO nem áll le | Kattints az AUTO OFF gombra - javítva v1.2.0-ban |
| Rossz épületet támad | Javítva v1.2.0-ban - minden hullám a helyes épületet támadja |

---

## Version History / Verzió Történet

- **v1.2.0** (2026-01-04) - Spirit Mode implementation
  - Added Spirit Mode: Send all building attacks from ONE spy report (Wall → Barracks → Main → Others)
  - Normal Mode (default): One building type per report for safer, controlled attacks
  - Fixed AUTO mode stop functionality - properly stops when disabled
  - Fixed barracks level 0 targeting (was sending only 3 waves for level 4 instead of 4)
  - Fixed wave targeting bug where all waves targeted same building
  - Added mode indicator badge in UI (orange for Spirit, blue for Normal)
  - Improved button state management ("Küldés..." → "Kész!" → "Támadás küldése")

- **v1.1.0** - Priority system update: Wall + Barracks processed together, Main only after both done
- **v1.0.0** - Initial release with basic catapult/ram automation

---

*Made by Norbi*
