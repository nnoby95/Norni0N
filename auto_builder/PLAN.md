# Template-Based Auto Builder - Implementation Plan

## Overview
Extend the existing auto-builder script to support **sequential build templates**. Templates define the **exact build order** step-by-step, allowing strategic interleaving of buildings (e.g., upgrade farm before next barracks to have enough population).

## Core Concept: Sequential Build Order

**NOT "build to target level"** - instead, each template item is ONE upgrade action processed in order.

Example template:
```
main 2;barracks 1;smith 1;barracks 2;farm 3;storage 4;farm 5;barracks 3
```

This means:
1. Build main to level 2
2. Build barracks to level 1
3. Build smith to level 1
4. Build barracks to level 2 (strategic: after smith!)
5. Build farm to level 3 (need population for troops)
6. Build storage to level 4
7. Build farm to level 5
8. Build barracks to level 3
... and so on

**Why this matters:** You can interleave buildings strategically - farm upgrades between barracks levels to ensure population, storage before expensive buildings, etc.

## Key Features

### 1. Template Management System
- **Create templates**: Define exact build sequence step-by-step
- **Save templates**: Store in localStorage with a name
- **Load templates**: Select and apply saved templates
- **Delete templates**: Remove unwanted templates
- **Export templates**: Copy to clipboard (both text and JSON formats)
- **Import templates**: Paste and load templates

### 2. Template Format
**Text format (user-friendly):**
```
main 2;barracks 1;smith 1;barracks 2;farm 3;storage 4;farm 5
```
Each item = one upgrade to that specific level, processed in exact order.

**JSON format (with metadata):**
```json
{
  "name": "Early Game Rush",
  "template": "main 2;barracks 1;smith 1;barracks 2;farm 3",
  "created": "2024-01-15"
}
```

### 3. Building Level Detection
Use `BuildingMain.buildings` to get current building levels:
```javascript
// Get current level of a building
const currentLevel = BuildingMain.buildings['smith'].level;
```

### 4. Sequential Queue Processing
When processing template item "barracks 2":
1. Check current barracks level via `BuildingMain.buildings['barracks'].level`
2. If level >= 2: **silently skip** to next template item (already done)
3. If level < 2: Build barracks (one upgrade toward level 2)
4. After successful build, move to next template item

## Data Structures

### Template Storage (localStorage)
```javascript
{
  "autoBuilderTemplates": {
    "template_id_1": {
      "name": "Early Game",
      "sequence": [
        { "building": "main", "level": 2 },
        { "building": "barracks", "level": 1 },
        { "building": "smith", "level": 1 },
        { "building": "barracks", "level": 2 },
        { "building": "farm", "level": 3 },
        { "building": "storage", "level": 4 }
      ],
      "created": "2024-01-15"
    }
  }
}
```

### Active Template State (per village)
```javascript
{
  "autoBuilderState": {
    "village_123": {
      "activeTemplateId": "template_id_1",
      "currentIndex": 3,  // Currently at step 3 (barracks 2)
      "isRunning": true
    }
  }
}
```

## UI Design (Native TW Style)

**Key Principle:** Use Tribal Wars native CSS classes for seamless integration:
- `btn` - Standard TW buttons
- `vis` - Standard TW table style
- `vis_item` - Table rows
- `widget` / `widget-content` - Panel containers
- Standard TW colors and fonts

### Template Panel (TW Widget Style)
Uses native TW widget styling to look like part of the game.

```html
<div id="autoBuilderWidget" class="widget">
  <div class="widget-head">
    <span class="widget-title">Auto Builder Templates</span>
  </div>
  <div class="widget-content">
    <!-- Template selector row -->
    <table class="vis" width="100%">
      <tr>
        <td>Template:</td>
        <td><select class="input-box">...</select></td>
        <td>
          <a class="btn">New</a>
          <a class="btn">Import</a>
          <a class="btn">Export</a>
        </td>
      </tr>
    </table>

    <!-- Progress display -->
    <table class="vis" width="100%">
      <tr class="row_a">
        <td>Progress: 5/12</td>
        <td>Current: Smithy (2 → 3)</td>
      </tr>
    </table>

    <!-- Queue display (scrollable) - shows sequential order -->
    <div style="max-height:200px;overflow-y:auto">
      <table class="vis" width="100%">
        <tr class="row_a"><td>✓</td><td>1.</td><td>Main 2</td></tr>
        <tr class="row_b"><td>✓</td><td>2.</td><td>Barracks 1</td></tr>
        <tr class="row_a"><td>✓</td><td>3.</td><td>Smithy 1</td></tr>
        <tr class="row_b" style="background:#ffe"><td>→</td><td>4.</td><td>Barracks 2</td></tr>
        <tr class="row_a"><td>○</td><td>5.</td><td>Farm 3</td></tr>
        <tr class="row_b"><td>○</td><td>6.</td><td>Storage 4</td></tr>
        <tr class="row_a"><td>○</td><td>7.</td><td>Farm 5</td></tr>
      </table>
    </div>

    <!-- Control buttons -->
    <a id="startBtn" class="btn btn-confirm-yes">Start</a>
  </div>
</div>
```

### Template Editor (TW Popup Style)
Uses TW's built-in popup/dialog styling.

```html
<div class="popup_box" style="width:500px">
  <div class="popup_box_header">Create Template</div>
  <div class="popup_box_content">
    <table class="vis" width="100%">
      <tr>
        <td>Name:</td>
        <td><input type="text" class="input-box" style="width:200px"></td>
      </tr>
      <tr>
        <td colspan="2">
          Template string:<br>
          <textarea class="input-box" style="width:100%;height:60px"
                    placeholder="smith 3;barracks 5;timber 2"></textarea>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <hr>
          Or add one by one:
        </td>
      </tr>
      <tr>
        <td>
          <select class="input-box">...</select>
          <input type="number" class="input-box" style="width:40px" value="1">
          <a class="btn">Add</a>
        </td>
      </tr>
    </table>

    <!-- Preview list -->
    <div style="max-height:150px;overflow-y:auto">
      <table class="vis" width="100%">
        <tr class="row_a"><td>1.</td><td>Smithy</td><td>→ 3</td><td><a>✕</a></td></tr>
        <tr class="row_b"><td>2.</td><td>Barracks</td><td>→ 5</td><td><a>✕</a></td></tr>
      </table>
    </div>
  </div>
  <div class="popup_box_footer">
    <a class="btn popup_box_close">Cancel</a>
    <a class="btn btn-confirm-yes">Save</a>
  </div>
</div>
```

## Building Name Mapping
```javascript
const BUILDING_MAP = {
  // Internal ID: Display Name
  "main": "Headquarters",
  "barracks": "Barracks",
  "stable": "Stable",
  "garage": "Workshop",
  "watchtower": "Watchtower",
  "smith": "Smithy",
  "market": "Market",
  "wood": "Timber Camp",
  "timber": "Timber Camp",  // alias
  "stone": "Clay Pit",
  "clay": "Clay Pit",       // alias
  "iron": "Iron Mine",
  "farm": "Farm",
  "storage": "Warehouse",
  "hide": "Hiding Place",
  "wall": "Wall",
  "church": "Church",
  "church_f": "First Church",
  "snob": "Academy",
  "statue": "Statue"
};
```

## Implementation Steps (Simple & Clean)

### Phase 1: Core Functions
1. Template parser: `"smith 3;barracks 5"` → `[{building, level}, ...]`
2. Level checker: `getBuildingLevel(id)` using `BuildingMain.buildings`
3. localStorage helpers for templates

### Phase 2: UI Components
4. Main widget panel (TW widget style)
5. Template selector dropdown
6. Template editor popup (TW popup style)
7. Progress display

### Phase 3: Build Logic
8. Expand template to queue (handle level gaps)
9. Process queue with level checking
10. Silent skip for completed buildings
11. **Auto-resume on page reload**

### Phase 4: Import/Export
12. Text format: copy/paste simple strings
13. JSON format: includes template name

## Technical Notes

### Getting Building Levels
```javascript
function getBuildingLevel(buildingId) {
  if (BuildingMain && BuildingMain.buildings && BuildingMain.buildings[buildingId]) {
    return BuildingMain.buildings[buildingId].level;
  }
  return 0; // Building not available or not built
}
```

### Processing Sequential Template
```javascript
function processNextStep() {
  const state = getVillageState();
  const template = getTemplate(state.activeTemplateId);

  // Find next incomplete step
  while (state.currentIndex < template.sequence.length) {
    const step = template.sequence[state.currentIndex];
    const currentLevel = getBuildingLevel(step.building);

    if (currentLevel >= step.level) {
      // Already done, skip to next
      state.currentIndex++;
      saveVillageState(state);
      continue;
    }

    // Need to build this
    return step;
  }

  // Template complete!
  return null;
}
```

### Checking if Step is Complete
```javascript
function isStepComplete(building, level) {
  return getBuildingLevel(building) >= level;
}
```

## Auto-Resume Behavior
On page load:
1. Check if there's an active template for this village
2. If yes, automatically continue from saved position
3. Re-check building levels (in case user built manually)
4. Skip any completed steps, continue from first incomplete
5. Start building automatically if script was running

## Code Organization
Keep it simple - single file, organized sections:
```javascript
// ==UserScript==
// ... metadata ...
// ==/UserScript==

"use strict";

// ============ CONSTANTS ============
const BUILDINGS = { ... };

// ============ STATE ============
let state = { ... };

// ============ TEMPLATE FUNCTIONS ============
function parseTemplate(str) { ... }
function saveTemplate(name, template) { ... }

// ============ BUILDING FUNCTIONS ============
function getBuildingLevel(id) { ... }
function canBuild(id) { ... }

// ============ UI FUNCTIONS ============
function createWidget() { ... }
function showTemplateEditor() { ... }

// ============ MAIN LOGIC ============
function processQueue() { ... }

// ============ INIT ============
init();
```

## Compatibility
- Maintains backward compatibility with existing queue system
- Templates work alongside manual queue additions
- Stored separately from existing buildingObject
