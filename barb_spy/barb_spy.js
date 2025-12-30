// ==UserScript==
// @name         Barb_Spy
// @namespace    Original Logic by -Sam, fixed and remade by Norbi
// @version      2.1
// @description  Barbarian village spy sender for Tribal Wars
// @author       -Sam and Norbi
// @include      https://*/game.php?village=*&screen=map*
// @run-at       document-idle
// ==/UserScript==
var kemlelo = {};
var minPoints = 26;
var maxPoints = 12154;
var radius = 30;
var csoporthossz = 50;
kemlelo.minPoints = minPoints;
kemlelo.maxPoints = maxPoints;
kemlelo.radius = radius;
kemlelo.csoporthossz = csoporthossz;
var currentVillage = game_data.village.coord;
if(localStorage.getItem("Sam_kemlelo") === null || localStorage.getItem("Sam_kemlelo") === "NaN" ){ localStorage.setItem("Sam_kemlelo", JSON.stringify(kemlelo));}
else {kemlelo = JSON.parse(localStorage.getItem("Sam_kemlelo"));}
///////////////////////////////////////////////////////
var coords = [];
var sereg = {};
async function find_barb(){
    var nearest_coordi = barb_finder();
    async function barb_finder(){
        var villages = [];
        var barbarians = [];
        var filteredByRadiusBarbs;
        var barbariansWithDistance = [];
        var map_barb;
        var this_world = game_data.world;
        var this_player = game_data.player.name;
        var this_worldmap_localstorage = "map_data" + this_player +this_world;

        fetchVillagesData();

        async function fetchVillagesData() {
            $.get('map/village.txt', function (data) {
                villages = CSVToArray(data);
            })
                .done(function () {
                findBarbarianVillages();
            })
        }

        async function findBarbarianVillages() {
            villages.forEach((village) => {
                if (village[4] == '0') {
                    barbarians.push(village);
                }
            });
            await filterBarbs();
        }

        async function filterBarbs() {

            // Filter by min and max points
            var filteredBarbs = barbarians.filter((barbarian) => {
                return barbarian[5] >= minPoints && barbarian[5] <= maxPoints;
            });

            // Filter by radius
            filteredByRadiusBarbs = filteredBarbs.filter((barbarian) => {
                var barbCoord = barbarian[2] + '|' + barbarian[3];
                var distance = calculateDistance(currentVillage, barbCoord);
                if (distance <= radius) {
                    return barbarian;
                }
            });
            await generateBarbariansTable(filteredByRadiusBarbs, currentVillage);

            // Group villages by distance ranges (every 10 units)
            var numGroups = Math.ceil(radius / 10);
            var groupedCoords = [];

            // Initialize empty arrays for each distance group
            for (let i = 0; i < numGroups; i++) {
                groupedCoords.push([]);
            }

            // Sort villages into groups based on their distance
            for (let i = 0; i < barbariansWithDistance.length; i++) {
                var village = barbariansWithDistance[i];
                var distance = parseFloat(village[7]); // distance is at index 7
                var groupIndex = Math.floor(distance / 10);

                // Make sure we don't exceed array bounds (for edge case where distance = radius exactly)
                if (groupIndex >= numGroups) {
                    groupIndex = numGroups - 1;
                }

                var map_barb_x = +village[2];
                var map_barb_y = +village[3];
                var map_barb_coord = map_barb_x + "|" + map_barb_y;
                groupedCoords[groupIndex].push(map_barb_coord);
            }

            // Remove empty groups and store the distance range info
            coords = [];
            window.coordsDistanceRanges = [];
            for (let i = 0; i < groupedCoords.length; i++) {
                if (groupedCoords[i].length > 0) {
                    coords.push(groupedCoords[i]);
                    window.coordsDistanceRanges.push({
                        min: i * 10,
                        max: (i + 1) * 10,
                        count: groupedCoords[i].length
                    });
                }
            }
            createInput();
            createSettings();
        }
        // line up barbs by distance
        function generateBarbariansTable(barbs, currentVillage) {
            barbs.forEach((barb) => {
                var barbCoord = barb[2] + '|' + barb[3];
                var distance = calculateDistance(currentVillage, barbCoord);
                barbariansWithDistance.push([...barb, distance]);
            });

            barbariansWithDistance.sort((a, b) => {
                return a[7] - b[7];
            });
        }
        // Helper: Calculate distance between 2 villages
        function calculateDistance(from, to) {
            var [x1, y1] = from.split('|');
            var [x2, y2] = to.split('|');
            var deltaX = Math.abs(x1 - x2);
            var deltaY = Math.abs(y1 - y2);
            let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            distance = distance.toFixed(2);
            return distance;
        }
        // Helper: Get Villages Coords Array
        function getVillageCoord(villages) {
            var villageCoords = [];
            villages.forEach((village) => {
                villageCoords.push(village[2] + '|' + village[3]);
            });
            return villageCoords;
        }
        //Helper: Convert CSV data into Array
        function CSVToArray(strData, strDelimiter) {
            strDelimiter = strDelimiter || ',';
            var objPattern = new RegExp(
                '(\\' + strDelimiter + '|\\r?\\n|\\r|^)' + '(?:"([^"]*(?:""[^"]*)*)"|' + '([^"\\' + strDelimiter + '\\r\\n]*))',
                'gi'
            );
            var arrData = [[]];
            var arrMatches = null;
            while ((arrMatches = objPattern.exec(strData))) {
                var strMatchedDelimiter = arrMatches[1];
                if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
                    arrData.push([]);
                }
                var strMatchedValue;

                if (arrMatches[2]) {
                    strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
                } else {
                    strMatchedValue = arrMatches[3];
                }
                arrData[arrData.length - 1].push(strMatchedValue);
            }
            return arrData;
        }
    }
}
for (let i=0; i<game_data.units.length; i++){
    var unnit = game_data.units[i];
    if (unnit === "spear"){sereg.spear = "";}
    if (unnit === "sword"){sereg.sword = "";}
    if (unnit === "axe"){sereg.axe = ""}
    if (unnit === "archer"){sereg.archer = ""}
    if (unnit === "spy"){sereg.spy = ""}
    if (unnit === "light"){sereg.light = ""}
    if (unnit === "marcher"){sereg.marcher = ""}
    if (unnit === "heavy"){sereg.heavy = ""}
    if (unnit === "ram"){sereg.ram = ""}
    if (unnit === "catapult"){sereg.catapult = ""}
    if (unnit === "knight"){sereg.knight = ""}
    if (unnit === "snob"){sereg.snob = ""}
}
sereg.spy = 1;

// Bot protection check
function checkBotProtection() {
    var botElement = document.getElementById('botprotection_quest');
    return botElement !== null;
}

async function start_spy(group){
    var innen_tamad = +game_data.village.id;
    var ezt_tamad_coordd = [...coords[group]]; // Make a copy to track progress
    var totalToSend = ezt_tamad_coordd.length;
    var sentCount = 0;
    var delay = Math.floor((Math.random()*70)+220);
    var groupStopped = false; // Track if group was stopped due to error

    // Update progress display
    updateProgress(0, totalToSend);

    setTimeout(tamad_setup, delay);
    async function tamad_setup(){
        // Check for bot protection BEFORE each spy send
        if (checkBotProtection()) {
            groupStopped = true;
            UI.ErrorMessage("Bot védelem észlelve! Kémküldés leállítva.");
            console.error("Bot protection detected - stopping spy sends");

            var statusEl = document.getElementById('spy-status');
            if (statusEl) {
                statusEl.textContent = 'Bot védelem észlelve!';
                statusEl.className = 'spy-status error';
            }
            return;
        }

        if (ezt_tamad_coordd.length > 0 && !groupStopped){
            var ezt_tamad_coord = ezt_tamad_coordd[0];
            console.log(ezt_tamad_coord)
            console.log(+ezt_tamad_coord.split("|")[0], +ezt_tamad_coord.split("|")[1])
            var ezt_tamad_x = +ezt_tamad_coord.split("|")[0];
            var ezt_tamad_y = +ezt_tamad_coord.split("|")[1];

            // Pass callback to handle errors
            attack(ezt_tamad_x, ezt_tamad_y, sereg, "main", function(success, error) {
                if (!success && error) {
                    // Error occurred - stop this group
                    groupStopped = true;
                    ezt_tamad_coordd.length = 0;
                    UI.ErrorMessage("Csoport leállítva: " + error);
                    console.error("Group stopped due to error:", error);

                    // Update status to show error
                    var statusEl = document.getElementById('spy-status');
                    if (statusEl) {
                        statusEl.textContent = 'Leállítva: ' + error;
                        statusEl.className = 'spy-status error';
                    }
                } else if (success) {
                    // Success - continue
                    ezt_tamad_coordd.shift();
                    sentCount++;
                    updateProgress(sentCount, totalToSend);

                    var delay = Math.floor((Math.random()*70)+220);
                    setTimeout(tamad_setup, delay);
                }
            });
        }
        else if (groupStopped) {
            UI.InfoMessage("Támadások leállítva - nincs elég egység!");
        }
        else {
            UI.SuccessMessage("Minden támadás kiküldve!");
            updateProgress(totalToSend, totalToSend);
        }
    }
}
async function attack(x, y, sereg, building, callback) {
    var xa = x;
    var ya = y;
    var attackCallback = callback || function() {}; // Default empty callback

    // FIXED: More robust key retrieval with error handling
    async function getKey() {
        $.get("game.php?village=" + game_data.village.id + "&screen=place", function(response) {
            var parser = new DOMParser();
            var dom = parser.parseFromString(response, "text/html");

            // FIXED: Try multiple selectors for the form
            var form = dom.getElementById("command-data-form") || dom.querySelector('form[action*="place"]');
            if (!form) {
                console.error("Attack form not found!");
                attackCallback(false, "Attack form not found!");
                return;
            }

            // FIXED: More robust key/value extraction
            var keyInput = form.querySelector('input[type="hidden"]');
            var key = keyInput ? keyInput.getAttribute("name") : null;
            var value = keyInput ? keyInput.value : null;

            // FIXED: Fallback to finding attack button name
            var attack_name = dom.getElementById("target_attack") ? dom.getElementById("target_attack").value : "attack";

            if (key && value) {
                prep_attack(key, value, attack_name);
            } else {
                console.error("Could not extract form key/value");
                attackCallback(false, "Could not extract form data");
            }
        }).fail(function(error) {
            console.error("Failed to load rally point:", error);
            attackCallback(false, "Failed to load rally point");
        });
    }
    getKey();

    async function prep_attack(key,value) {
        var keya = key;
        var valuea = value;
        if(sereg.spear !== undefined){if(sereg.spear === 0){sereg.spear = "";}}
        if(sereg.sword !== undefined){if(sereg.sword === 0){sereg.sword = "";}}
        if(sereg.axe !== undefined){if(sereg.axe === 0){sereg.axe = "";}}
        if(sereg.archer !== undefined){if(sereg.archer === 0){sereg.archer = "";}}
        if(sereg.spy !== undefined){if(sereg.spy === 0){sereg.spy = "";}}
        if(sereg.light !== undefined){if(sereg.light === 0){sereg.light = "";}}
        if(sereg.marcher !== undefined){if(sereg.marcher === 0){sereg.marcher = "";}}
        if(sereg.heavy !== undefined){if(sereg.heavy === 0){sereg.heavy = "";}}
        if(sereg.ram !== undefined){if(sereg.ram === 0){sereg.ram = "";}}
        if(sereg.catapult !== undefined){if(sereg.catapult === 0){sereg.catapult = "";}}
        if(sereg.knight !== undefined){if(sereg.knight === 0){sereg.knight = "";}}
        if(sereg.snob !== undefined){if(sereg.snob === 0){sereg.snob = "";}}

        // Form data for entering the attack dialog
        var data = [];
        data.push({ name: "" + key, value: "" + value});
        data.push({ name: "template_id", value: "" });
        data.push({ name: "source_village", value: "" + game_data.village.id });
        if(sereg.spear !== undefined){data.push({ name: "spear", value: "" + sereg.spear });}
        if(sereg.sword !== undefined){data.push({ name: "sword", value: "" + sereg.sword });}
        if(sereg.axe !== undefined){data.push({ name: "axe", value: "" + sereg.axe });}
        if(sereg.archer !== undefined){data.push({ name: "archer", value: "" + sereg.archer });}
        if(sereg.spy !== undefined){data.push({ name: "spy", value: "" + sereg.spy });}
        if(sereg.light !== undefined){data.push({ name: "light", value: "" + sereg.light });}
        if(sereg.marcher !== undefined){data.push({ name: "marcher", value: "" + sereg.marcher });}
        if(sereg.heavy !== undefined){data.push({ name: "heavy", value: "" + sereg.heavy });}
        if(sereg.ram !== undefined){data.push({ name: "ram", value: "" + sereg.ram });}
        if(sereg.catapult !== undefined){data.push({ name: "catapult", value: "" + sereg.catapult });}
        if(sereg.knight !== undefined){data.push({ name: "knight", value: "" + sereg.knight });}
        if(sereg.snob !== undefined){data.push({ name: "snob", value: "" + sereg.snob });}
        data.push({ name: "x", value: "" + xa });
        data.push({ name: "y", value: "" + ya });
        data.push({ name: "input", value: "" });
        data.push({ name: "attack", value: "l"});

        TribalWars.post("place", {ajax: "confirm"}, data, function(response) {
            // FIXED: Check for errors in dialog response
            var hasError = false;
            var errorMessage = "";

            if (response && response.error) {
                hasError = true;
                errorMessage = response.error;
            }

            // Check dialog content for error messages
            if (response && response.dialog) {
                var dialogText = response.dialog;

                // Check for "not enough troops" error
                if (dialogText.includes('Nem áll rendelkezésre elegendő egység') ||
                    dialogText.includes('error_box') ||
                    dialogText.includes('Nincs elegendő')) {
                    hasError = true;
                    errorMessage = "Nincs elegendő egység!";
                }

                // If no error and has confirmation hash, proceed
                if (!hasError && dialogText.includes('name="ch" value="')) {
                    var ch = dialogText.split('name="ch" value="')[1].split('" />')[0];
                    sendAttack(ch, sereg);
                } else if (!hasError) {
                    errorMessage = "Confirmation hash not found!";
                    hasError = true;
                }
            }

            if (hasError) {
                UI.ErrorMessage(errorMessage);
                console.error("Attack prep failed:", errorMessage);
                attackCallback(false, errorMessage); // Report error
            }
        });
    }

    async function sendAttack(ch,sereg) {
        if(sereg.spear !== undefined){if(sereg.spear === ""){sereg.spear = 0;}}
        if(sereg.sword !== undefined){if(sereg.sword === ""){sereg.sword = 0;}}
        if(sereg.axe !== undefined){if(sereg.axe === ""){sereg.axe = 0;}}
        if(sereg.archer !== undefined){if(sereg.archer === ""){sereg.archer = 0;}}
        if(sereg.spy !== undefined){if(sereg.spy === ""){sereg.spy = 0;}}
        if(sereg.light !== undefined){if(sereg.light === ""){sereg.light = 0;}}
        if(sereg.marcher !== undefined){if(sereg.marcher === ""){sereg.marcher = 0;}}
        if(sereg.heavy !== undefined){if(sereg.heavy === ""){sereg.heavy = 0;}}
        if(sereg.ram !== undefined){if(sereg.ram === ""){sereg.ram = 0;}}
        if(sereg.catapult !== undefined){if(sereg.catapult === ""){sereg.catapult = 0;}}
        if(sereg.knight !== undefined){if(sereg.knight === ""){sereg.knight = 0;}}
        if(sereg.snob !== undefined){if(sereg.snob === ""){sereg.snob = 0;}}

        // Form data to confirm attack, needs to be duplicated due to different order (ban prevention)
        var data = [];
        data.push({ name: "attack", value: "" + true});
        data.push({ name: "ch", value: "" + ch });
        data.push({ name: "cb", value: "troop_confirm_submit" });
        data.push({ name: "x", value: "" + xa });
        data.push({ name: "y", value: "" + ya });
        data.push({ name: "source_village", value: "" + game_data.village.id });
        data.push({ name: "village", value: "" + game_data.village.id });
        data.push({ name: "attack_name", value: "" });
        if(sereg.spear !== undefined){data.push({ name: "spear", value: "" + sereg.spear });}
        if(sereg.sword !== undefined){data.push({ name: "sword", value: "" + sereg.sword });}
        if(sereg.axe !== undefined){data.push({ name: "axe", value: "" + sereg.axe });}
        if(sereg.archer !== undefined){data.push({ name: "archer", value: "" + sereg.archer });}
        if(sereg.spy !== undefined){data.push({ name: "spy", value: "" + sereg.spy });}
        if(sereg.light !== undefined){data.push({ name: "light", value: "" + sereg.light });}
        if(sereg.marcher !== undefined){data.push({ name: "marcher", value: "" + sereg.marcher });}
        if(sereg.heavy !== undefined){data.push({ name: "heavy", value: "" + sereg.heavy });}
        if(sereg.ram !== undefined){data.push({ name: "ram", value: "" + sereg.ram });}
        if(sereg.catapult !== undefined){data.push({ name: "catapult", value: "" + sereg.catapult });}
        if(sereg.knight !== undefined){data.push({ name: "knight", value: "" + sereg.knight });}
        if(sereg.snob !== undefined){data.push({ name: "snob", value: "" + sereg.snob });}
        data.push({ name: "building", value: "main" });
        data.push({ name: "h", value: "" + game_data.csrf}); // FIXED: Always include CSRF token

        TribalWars.post("place", {ajaxaction: "popup_command"}, data, function(response) {
            // FIXED: Check for error messages in response
            var hasError = false;
            var errorMessage = "";

            // Check for "not enough troops" error message
            if (response && response.error) {
                hasError = true;
                errorMessage = response.error;
            }

            // Check in message field too
            if (response && response.message) {
                var msgText = typeof response.message === 'string' ? response.message : '';
                if (msgText.includes('Nem áll rendelkezésre elegendő egység') ||
                    msgText.includes('not enough units') ||
                    msgText.includes('nincs elegendő')) {
                    hasError = true;
                    errorMessage = "Nincs elegendő egység a támadáshoz!";
                }
            }

            if (hasError) {
                UI.ErrorMessage(errorMessage || "Hiba történt a támadás során!");
                console.error("Attack failed:", errorMessage);
                attackCallback(false, errorMessage); // Report error
            } else if (response.message && response.message.length > 0) {
                UI.SuccessMessage("Támadás sikeresen elküldve!");
                attackCallback(true); // Report success
            } else {
                console.error("Attack confirmation failed", response);
                attackCallback(false, "Confirmation failed");
            }
        });
    }
}
// ============== TRIBAL WARS STYLED UI ==============

// Inject CSS styles
function injectStyles() {
    var css = `
        /* Blend into TW native style - no extra borders */
        #spy-table {
            width: 100%;
            border-spacing: 0;
            border-collapse: collapse;
        }

        #spy-table th {
            background-color: #c1a264;
            font-weight: bold;
            padding: 3px;
            text-align: left;
            cursor: pointer;
        }

        #spy-table th:hover {
            background-color: #d1b274;
        }

        #spy-table .spy-toggle-arrow {
            float: right;
            transition: transform 0.2s;
        }

        #spy-table .spy-toggle-arrow.collapsed {
            transform: rotate(-90deg);
        }

        #spy-table td {
            padding: 2px 3px;
        }

        /* Form rows - native style */
        .spy-row {
            background-color: #f4e4bc;
        }

        .spy-row:nth-child(even) {
            background-color: #ded3b9;
        }

        .spy-row td {
            padding: 3px 5px;
            font-size: 11px;
        }

        .spy-row label {
            display: inline-block;
            width: 75px;
        }

        /* Input fields - native TW style */
        .spy-input {
            width: 55px;
            padding: 1px 3px;
            font-size: 11px;
            border: 1px solid #7d510f;
            background: #fff;
        }

        /* Generate button - TW native button style */
        #spy-generate {
            margin: 3px 0;
            padding: 2px 8px;
            font-size: 11px;
            cursor: pointer;
        }

        /* Distance group buttons */
        #spy-groups-container {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            padding: 3px 0;
        }

        .spy-group-btn {
            flex: 1;
            min-width: 45px;
            padding: 3px 5px;
            font-size: 10px;
            text-align: center;
            cursor: pointer;
            background: #d5d1c5;
            border: 1px solid #7d510f;
        }

        .spy-group-btn:hover {
            background: #c5c1b5;
        }

        .spy-group-btn.active {
            background: #ff8c00;
            color: white;
            border-color: #cc6600;
        }

        /* Progress bar - simple native style */
        #spy-progress-section {
            display: none;
            padding: 3px 5px;
            background: #ded3b9;
        }

        #spy-progress-section.active {
            display: block;
        }

        #spy-progress-bar-outer {
            background: #fff;
            border: 1px solid #7d510f;
            height: 12px;
            margin: 2px 0;
        }

        #spy-progress-bar {
            background: #8bc34a;
            height: 100%;
            width: 0%;
            transition: width 0.2s;
            font-size: 9px;
            color: white;
            text-align: center;
            line-height: 12px;
        }

        #spy-status {
            font-size: 10px;
            text-align: center;
            color: #666;
        }

        #spy-status.success {
            color: #006600;
        }

        #spy-status.error {
            color: #cc0000;
        }

        #spy-total-count {
            font-size: 10px;
            padding: 2px 5px;
            text-align: center;
            background: #ded3b9;
        }

        /* Hidden state for collapsible content */
        #spy-content.hidden {
            display: none;
        }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

// Create the panel between Search and Quick Commands tables
function createPanel() {
    // Find the map_search table (Keresés)
    var searchTable = document.getElementById('map_search');

    // Find the Quick Commands table (Gyors parancsok)
    var quickCommandsTable = null;
    var allTables = document.querySelectorAll('table.vis');
    for (var i = 0; i < allTables.length; i++) {
        var th = allTables[i].querySelector('th');
        if (th && th.textContent.includes('Gyors parancsok')) {
            quickCommandsTable = allTables[i];
            break;
        }
    }

    // Create our spy table
    var spyTable = document.createElement('table');
    spyTable.id = 'spy-table';
    spyTable.className = 'vis';
    spyTable.style.width = '100%';

    spyTable.innerHTML = `
        <thead>
            <tr>
                <th id="spy-header">Barbár kémlelő <span class="spy-toggle-arrow">▼</span></th>
            </tr>
        </thead>
        <tbody id="spy-content">
            <tr class="spy-row">
                <td>
                    <label>Min. pont:</label>
                    <input type="number" id="spy-min-points" class="spy-input" value="${kemlelo.minPoints}">
                </td>
            </tr>
            <tr class="spy-row">
                <td>
                    <label>Max. pont:</label>
                    <input type="number" id="spy-max-points" class="spy-input" value="${kemlelo.maxPoints}">
                </td>
            </tr>
            <tr class="spy-row">
                <td>
                    <label>Távolság:</label>
                    <input type="number" id="spy-radius" class="spy-input" value="${kemlelo.radius}">
                </td>
            </tr>
            <tr class="spy-row">
                <td style="text-align:center;">
                    <input type="button" id="spy-generate" class="btn" value="Lista generálása">
                </td>
            </tr>
            <tr class="spy-row">
                <td>
                    <div id="spy-groups-container">
                        <span style="color:#666;font-size:10px;">Kattints a gombra</span>
                    </div>
                </td>
            </tr>
            <tr class="spy-row">
                <td id="spy-total-count"></td>
            </tr>
            <tr>
                <td id="spy-progress-section">
                    <div id="spy-progress-bar-outer">
                        <div id="spy-progress-bar">0%</div>
                    </div>
                    <div id="spy-status">Várakozás...</div>
                </td>
            </tr>
        </tbody>
    `;

    // Insert after search table (before quick commands)
    if (searchTable && searchTable.parentNode) {
        searchTable.parentNode.insertBefore(spyTable, searchTable.nextSibling);
    } else if (quickCommandsTable && quickCommandsTable.parentNode) {
        // Fallback: insert before quick commands
        quickCommandsTable.parentNode.insertBefore(spyTable, quickCommandsTable);
    } else {
        // Last fallback: try to find the right column and append there
        var rightColumn = document.getElementById('rightcolumn') || document.querySelector('td[valign="top"]:last-child');
        if (rightColumn) {
            rightColumn.appendChild(spyTable);
        } else {
            document.body.appendChild(spyTable);
        }
    }

    // Add some spacing
    spyTable.style.marginTop = '5px';

    // Toggle collapse on header click
    document.getElementById('spy-header').addEventListener('click', function() {
        var content = document.getElementById('spy-content');
        var arrow = this.querySelector('.spy-toggle-arrow');
        content.classList.toggle('hidden');
        arrow.classList.toggle('collapsed');
    });

    // Generate button click
    document.getElementById('spy-generate').addEventListener('click', function(e) {
        e.stopPropagation();
        minPoints = +document.getElementById('spy-min-points').value;
        maxPoints = +document.getElementById('spy-max-points').value;
        radius = +document.getElementById('spy-radius').value;

        kemlelo.minPoints = minPoints;
        kemlelo.maxPoints = maxPoints;
        kemlelo.radius = radius;
        localStorage.setItem("Sam_kemlelo", JSON.stringify(kemlelo));

        find_barb();
    });

    // Prevent header collapse when clicking inputs
    document.querySelectorAll('#spy-content input').forEach(function(input) {
        input.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
}

// Update the groups display
function createInput() {
    var container = document.getElementById('spy-groups-container');
    if (!container) return;

    var html = '';
    var totalVillages = 0;

    for (let i = 0; i < coords.length; i++) {
        var rangeInfo = window.coordsDistanceRanges[i];
        var distanceLabel = rangeInfo.min + "-" + rangeInfo.max;
        var villageCount = rangeInfo.count;
        totalVillages += villageCount;

        html += `<button class="spy-group-btn" data-group="${i}">
            ${distanceLabel}<br><small>${villageCount} falu</small>
        </button>`;
    }

    if (coords.length === 0) {
        html = '<div style="color: #CC0000; font-size: 10px; padding: 8px; text-align: center; width: 100%;">Nem találtam barbár falut!</div>';
    }

    container.innerHTML = html;

    // Update total count
    var totalCountEl = document.getElementById('spy-total-count');
    if (totalCountEl && totalVillages > 0) {
        totalCountEl.innerHTML = `<strong>Összesen:</strong> ${totalVillages} barbár falu`;
    } else if (totalCountEl) {
        totalCountEl.innerHTML = '';
    }

    load_buttons();
}

function load_buttons() {
    var buttons = document.querySelectorAll('.spy-group-btn');
    buttons.forEach(function(btn, i) {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            buttons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            // Show progress section
            var progressEl = document.getElementById('spy-progress-section');
            if (progressEl) progressEl.classList.add('active');

            // Reset progress
            updateProgress(0, coords[i].length);

            start_spy(i);
        });
    });
}

// Update progress bar
function updateProgress(current, total) {
    var progressBar = document.getElementById('spy-progress-bar');
    var statusEl = document.getElementById('spy-status');

    if (progressBar && statusEl) {
        var percent = total > 0 ? Math.round((current / total) * 100) : 0;
        progressBar.style.width = percent + '%';
        progressBar.textContent = percent + '%';
        statusEl.textContent = `Kémlelés: ${current} / ${total}`;
        statusEl.className = 'spy-status';

        if (current === total && total > 0) {
            statusEl.textContent = 'Minden kém kiküldve!';
            statusEl.className = 'spy-status success';
        }
    }
}

// Legacy function - no longer needed, panel is created at startup
function createSettings() {
    // Panel already exists (created at initialization), do nothing
    // This function is kept for backwards compatibility
}

// Track progress in start_spy
var spyProgress = { current: 0, total: 0 };

// Initialize
injectStyles();
createPanel();