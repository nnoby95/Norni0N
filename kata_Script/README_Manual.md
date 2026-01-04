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

#### Priority System

The script follows a strict priority order:

| Priority | Target | Unit | Behavior |
|----------|--------|------|----------|
| 1 | **Wall** | Rams | Destroys wall to level 0 in ONE attack |
| 2 | **Barracks** | Catapults | Reduces to level 0 (sent together with wall!) |
| 3 | **Main (HQ)** | Catapults | Reduces to target level (default: 1) |
| 4 | **Other buildings** | Catapults | Only checked when Wall=0 AND Barracks=0 AND Main≤1 |

**Important:** Wall and Barracks are ALWAYS processed together in the same session. Main is only attacked when Wall=0 AND Barracks=0. Other buildings (stable, garage, etc.) are only attacked after Wall, Barracks and Main are done.

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

### AUTO Mode

When AUTO is enabled:
1. Script analyzes current report
2. If barbarian + needs attack → sends attack
3. After attack complete → moves to next report
4. Repeats until no more reports or troops run out

**Note:** AUTO only works on barbarian villages with spy data.

### Example Scenarios

#### Scenario 1: Wall=10, Main=5, Barracks=3
```
Wave 1: 45 rams → wall (10→0)
Wave 2: 2 catapults → barracks (3→2)
Wave 3: 2 catapults → barracks (2→1)
Wave 4: 2 catapults → barracks (1→0) + spy
[DONE - Next report]
```
Main is NOT attacked yet (will be handled on next spy report when wall=0 AND barracks=0).

#### Scenario 2: Wall=0, Main=5, Barracks=0
```
Wave 1: 9 catapults → main (5→4)
Wave 2: 8 catapults → main (4→3)
Wave 3: 8 catapults → main (3→2)
Wave 4: 7 catapults → main (2→1) + spy
[DONE - Next report]
```

#### Scenario 3: Wall=0, Main=1, Barracks=3
```
Wave 1: 2 catapults → barracks (3→2)
Wave 2: 2 catapults → barracks (2→1)
Wave 3: 2 catapults → barracks (1→0) + spy
[DONE - Next report]
```
Main is already at target level (1), so only barracks is attacked.

#### Scenario 4: Wall=0, Main=1, Barracks=0
```
No attack needed - move to next report
```

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Panel not showing | Make sure you're on a spy report of a barbarian village |
| "Nem barbár falu" | Script only attacks barbarian villages |
| "Nincs elég csapat" | Not enough troops - script moves to next report |
| Attacks not sending | Check if worker tab opens correctly |

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

#### Prioritási Rendszer

A script szigorú prioritási sorrendet követ:

| Prioritás | Célpont | Egység | Viselkedés |
|-----------|---------|--------|------------|
| 1 | **Fal** | Faltörő | Lerombolja a falat 0 szintre EGY támadással |
| 2 | **Barakk** | Katapult | Csökkenti 0 szintre (együtt küldve a fallal!) |
| 3 | **Főhadiszállás** | Katapult | Csökkenti a cél szintre (alapértelmezett: 1) |
| 4 | **Többi épület** | Katapult | Csak ha Fal=0 ÉS Barakk=0 ÉS Főhadi≤1 |

**Fontos:** A Fal és Barakk MINDIG együtt kerül feldolgozásra ugyanabban a munkamenetben. A Főhadiszállás csak akkor támadható, ha Fal=0 ÉS Barakk=0. A többi épület (istálló, műhely, stb.) csak a Fal, Barakk és Főhadi után támadható.

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

### AUTO Mód

Amikor az AUTO engedélyezve van:
1. Script elemzi az aktuális jelentést
2. Ha barbár + támadás szükséges → küldi a támadást
3. Támadás befejezése után → következő jelentésre lép
4. Ismétli amíg van jelentés vagy elfogy a csapat

**Megjegyzés:** Az AUTO csak barbár falvakon működik kémadatokkal.

### Példa Forgatókönyvek

#### 1. Forgatókönyv: Fal=10, Főhadi=5, Barakk=3
```
1. hullám: 45 faltörő → fal (10→0)
2. hullám: 2 katapult → barakk (3→2)
3. hullám: 2 katapult → barakk (2→1)
4. hullám: 2 katapult → barakk (1→0) + kém
[KÉSZ - Következő jelentés]
```
A főhadi MÉG NEM kerül támadásra (következő kémjelentésnél lesz kezelve, amikor fal=0 ÉS barakk=0).

#### 2. Forgatókönyv: Fal=0, Főhadi=5, Barakk=0
```
1. hullám: 9 katapult → főhadi (5→4)
2. hullám: 8 katapult → főhadi (4→3)
3. hullám: 8 katapult → főhadi (3→2)
4. hullám: 7 katapult → főhadi (2→1) + kém
[KÉSZ - Következő jelentés]
```

#### 3. Forgatókönyv: Fal=0, Főhadi=1, Barakk=3
```
1. hullám: 2 katapult → barakk (3→2)
2. hullám: 2 katapult → barakk (2→1)
3. hullám: 2 katapult → barakk (1→0) + kém
[KÉSZ - Következő jelentés]
```
A főhadi már a cél szinten van (1), így csak a barakk kerül támadásra.

#### 4. Forgatókönyv: Fal=0, Főhadi=1, Barakk=0
```
Nincs szükséges támadás - következő jelentésre lép
```

### Hibaelhárítás

| Probléma | Megoldás |
|----------|----------|
| Panel nem jelenik meg | Győződj meg róla, hogy barbár falu kémjelentésén vagy |
| "Nem barbár falu" | A script csak barbár falvakat támad |
| "Nincs elég csapat" | Nincs elég egység - script következő jelentésre lép |
| Támadások nem indulnak | Ellenőrizd, hogy a munkafül megfelelően nyílik-e |

---

## Version History / Verzió Történet

- **v1.1.0** - Priority system update: Wall + Main processed together, other buildings only after both are done
- **v1.0.0** - Initial release with basic catapult/ram automation

---

*Made by Norbi*
