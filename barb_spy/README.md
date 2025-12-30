# Barb_Spy - User Manual / Felhasználói kézikönyv

---

## English

### Description
Barb_Spy is a Tribal Wars userscript that automatically sends spies to barbarian villages within a specified radius. It groups villages by distance for easier management.

### Installation
1. Install Tampermonkey (Chrome) or Greasemonkey (Firefox)
2. Create a new script and paste the contents of `barb_spy.js`
3. Save and enable the script
4. Navigate to the Map screen in Tribal Wars

### Usage
1. Open the **Map** screen in Tribal Wars
2. Find the **Barbár kémlelő** panel (between Search and Quick Commands)
3. Set your parameters:
   - **Min. pont**: Minimum village points to target
   - **Max. pont**: Maximum village points to target
   - **Távolság**: Search radius from your village
4. Click **Lista generálása** (Generate List)
5. Distance group buttons will appear (0-10, 10-20, 20-30, etc.)
6. Click a group button to start sending spies to that distance range

### Features
- Groups barbarian villages by distance ranges (every 10 fields)
- Progress bar shows sending status
- Bot protection detection - automatically stops if captcha appears
- Stops automatically when out of spies
- Settings saved to localStorage

### Safety
- Speed: 220-290ms between sends (human-like)
- Bot protection check before each send
- Automatic stop on errors

---

## Magyar

### Leírás
A Barb_Spy egy Tribal Wars userscript, amely automatikusan kémeket küld a barbár falvakba egy megadott sugarú körön belül. A falvakat távolság szerint csoportosítja.

### Telepítés
1. Telepítsd a Tampermonkey (Chrome) vagy Greasemonkey (Firefox) bővítményt
2. Hozz létre új scriptet és másold be a `barb_spy.js` tartalmát
3. Mentsd el és engedélyezd a scriptet
4. Navigálj a Térkép képernyőre a Tribal Wars-ban

### Használat
1. Nyisd meg a **Térkép** képernyőt
2. Keresd meg a **Barbár kémlelő** panelt (Keresés és Gyors parancsok között)
3. Állítsd be a paramétereket:
   - **Min. pont**: Minimum falupontszám
   - **Max. pont**: Maximum falupontszám
   - **Távolság**: Keresési sugár a faludtól
4. Kattints a **Lista generálása** gombra
5. Megjelennek a távolság csoportok (0-10, 10-20, 20-30, stb.)
6. Kattints egy csoport gombra a kémek küldésének indításához

### Funkciók
- Barbár falvak csoportosítása távolság szerint (10 mezőnként)
- Folyamatjelző mutatja a küldés állapotát
- Bot védelem észlelés - automatikusan leáll ha captcha jelenik meg
- Automatikus leállás ha elfogytak a kémek
- Beállítások mentése localStorage-ba

### Biztonság
- Sebesség: 220-290ms küldések között (emberszerű)
- Bot védelem ellenőrzés minden küldés előtt
- Automatikus leállás hiba esetén

---

**Authors / Szerzők:** -Sam and Norbi

**Version / Verzió:** 2.1
