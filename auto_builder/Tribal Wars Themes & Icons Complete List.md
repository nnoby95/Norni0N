Tribal Wars Themes & Icons Complete List
🎨 Graphic Base URL
https://dshu.innogamescdn.com/asset/fc339a06/graphic/
📁 Icon Categories
1. Buildings (buildings/)
All building icons (small versions):

main.png - Headquarters (Főhadiszállás)
barracks.png - Barracks (Barakk)
stable.png - Stable (Istálló)
workshop.png - Workshop
church.png - Church (Templom)
church_f.png - First Church (Első templom)
watchtower.png - Watchtower (Őrtorony)
academy.png - Academy
smith.png - Smithy (Kovácsműhely)
place.png - Rally Point (Gyülekezőhely)
statue.png - Statue (Szobor)
market.png - Market (Piac)
wood.png - Timber Camp (Fatelep)
stone.png - Clay Pit (Agyagbánya)
iron.png - Iron Mine (Vasbánya)
farm.png - Farm (Tanya)
storage.png - Warehouse (Raktár)
hide.png - Hiding Place (Rejtekhely)
wall.png - Wall (Fal)
snob.png - Noble (if available)
garage.png - Siege Workshop (if available)

2. Large Buildings (big_buildings/)
Large detailed building images for different levels:

main1.webp, main2.webp, main3.webp - Headquarters levels
barracks1.webp, barracks2.webp - Barracks levels
stable1.webp, stable2.webp - Stable levels
farm1.webp, farm2.webp - Farm levels
wood1.webp, wood2.webp - Timber Camp levels
stone1.webp, stone2.webp - Clay Pit levels
iron1.webp, iron2.webp - Iron Mine levels
wall1.webp, wall2.webp - Wall levels
market1.webp, market2.webp - Market levels
smith1.webp, smith2.webp - Smithy levels
storage1.webp, storage2.webp - Warehouse levels
Plus more for each building type

3. Units (unit/)
Military unit icons:

spear.png - Spearman
sword.png - Swordsman
axe.png - Axeman
archer.png - Archer
spy.png - Scout
light.png - Light Cavalry
marcher.png - Mounted Archer
heavy.png - Heavy Cavalry
ram.png - Ram
catapult.png - Catapult
snob.png - Noble
knight.png - Paladin/Knight
att.webp - Attack icon
def.webp - Defense icon

4. Resources (icons/)
Resource icons:

wood.png - Wood
stone.png - Clay
iron.png - Iron
res.png - Generic resources
pop.png - Population

5. Commands (command/)
Attack/support command icons:

attack.webp - Attack
support.webp - Support
return.webp - Return
other.webp - Other

6. Map Graphics (map/)
Map-related graphics:

map_new.png - Map icons
village.png - Village icons
target.png - Target markers
ghost.png - Abandoned villages

7. Flags (flags/)
Village flag graphics:

small/ - Small flag icons
medium/ - Medium flag icons
package1.webp - Flag packages
Different flag types numbered (1_1.webp, 1_2.webp, etc.)

8. Premium Items (items/)
Premium item icons:

3080.webp - War Commander
Various item IDs for premium features

9. Tribe/Quest Graphics (tribe/)
Quest and tribe-related graphics:

quest/ - Quest icons

build_goal.webp - Building goals
Quest reward icons


currency.png - Premium currency

10. Events (events/)
Event-specific graphics:

gift_winter/ - Winter event gifts
Seasonal event graphics

11. Awards (awards/)
Achievement and award icons
12. Relic System (relic_system/)
Treasure/relic icons:

relic_icon.webp - Relic icons

13. UI Icons (icons/)
Interface icons:

attack.png - Attack icon
def.png - Defense icon
mail.png - Mail icon
report.png - Report icon
Navigation and UI elements

14. Fortifications (fortifications/)
Wall and defense graphics
15. Overview (overview/)
Overview page graphics
16. Status Dots (dots/)
Status indicator dots (red, green, yellow)
🎭 Themes/Graphic Sets
Tribal Wars typically supports these graphic themes:

Default - Standard graphics
Classic - Original Tribal Wars look
High Resolution - HD graphics (WebP format)

The game automatically serves .webp format for modern browsers with fallback to .png
📌 Usage Examples
javascript// Building icon
const iconURL = `${image_base}buildings/main.png`;

// Large building image
const bigImageURL = `${image_base}big_buildings/main3.webp`;

// Unit icon
const unitURL = `${image_base}unit/spear.png`;

// Resource icon
const resourceURL = `${image_base}icons/wood.png`;


🔧 For Your Auto Builder
You can use these paths to display building progress visually:
javascriptfunction getBuildingIcon(buildingName) {
  const building = BuildingMain.buildings[buildingName];
  return `${image_base}${building.image}`;
}

function getLargeBuildingImage(buildingName) {
  const building = BuildingMain.buildings[buildingName];
  return `${image_base}big_buildings/${building.big_image}.webp`;
}


All icons are available at the base URL with both .png and .webp formats!i olso need te style, i mean colors and so on....hoppe you got the point!9 steps🎨 Tribal Wars Complete Design System & Style Guide
Color Palette
Primary Colors
css/* Main Background */
--body-bg: rgb(210, 192, 158);           /* #D2C09E - Beige/Tan */
--background-texture: url('background.jpg'); /* Stone/parchment texture */

/* Header Colors */
--header-bg: #7d1007;                    /* Dark crimson red */
--header-text: #FFFFFF;                  /* White */
--header-border: #4a0a04;                /* Darker red */

/* Content Boxes */
--content-box-bg: #FFF8E8;               /* Light cream */
--content-box-border: #7D510F;           /* Medium brown */
--content-box-shadow: rgba(0,0,0,0.2);   /* Subtle shadow */
Table Colors
css/* Table Headers */
--table-header-bg: #C1A264;              /* Gold/brown */
--table-header-text: #000000;            /* Black */

/* Table Rows (alternating) */
--table-row-light: #F4E4BC;              /* Light tan */
--table-row-dark: #DED3B9;               /* Medium tan */
--table-hover: #E5D7B7;                  /* Slightly darker on hover */
Button Colors
css/* Primary Buttons (Brown/Action) */
--btn-primary-bg: #654321;               /* Brown */
--btn-primary-hover: #7D510F;            /* Lighter brown */
--btn-primary-text: #FFFFFF;             /* White */
--btn-primary-border: #4a3214;           /* Dark brown */

/* Stop/Danger Buttons (Red) */
--btn-danger-bg: #C14747;                /* Red */
--btn-danger-hover: #D55555;             /* Lighter red */
--btn-danger-text: #FFFFFF;              /* White */

/* Action Buttons (Olive/Dark) */
--btn-action-bg: #736B55;                /* Dark olive */
--btn-action-hover: #8A8268;             /* Lighter olive */
--btn-action-text: #FFFFFF;              /* White */

/* Secondary Buttons */
--btn-secondary-bg: #DED3B9;             /* Light tan */
--btn-secondary-text: #000000;           /* Black */
--btn-secondary-border: #7D510F;         /* Brown */
Form Elements
css/* Input Fields */
--input-bg: #FFFFFF;                     /* White */
--input-border: #7D510F;                 /* Brown */
--input-text: #000000;                   /* Black */
--input-focus-border: #654321;           /* Darker brown */

/* Select/Dropdown */
--select-bg: #FFF8E8;                    /* Light cream */
--select-border: #7D510F;                /* Brown */
--select-text: #000000;                  /* Black */

/* Checkbox/Radio */
--checkbox-border: #7D510F;              /* Brown */
--checkbox-checked-bg: #654321;          /* Brown */
Status Colors
css/* Success */
--success-bg: #D4EDDA;                   /* Light green */
--success-text: #006600;                 /* Dark green */
--success-border: #28A745;               /* Green */

/* Error */
--error-bg: #F8D7DA;                     /* Light red */
--error-text: #CC0000;                   /* Dark red */
--error-border: #DC3545;                 /* Red */

/* Warning */
--warning-bg: #FFF3CD;                   /* Light yellow */
--warning-text: #856404;                 /* Dark yellow */
--warning-border: #FFC107;               /* Yellow */

/* Info */
--info-bg: #D1ECF1;                      /* Light blue */
--info-text: #0C5460;                    /* Dark teal */
--info-border: #17A2B8;                  /* Teal */
Progress/Status Colors
css/* Building Progress */
--progress-complete: #8BC34A;            /* Green - completed */
--progress-current: #FF6B00;             /* Orange - in progress */
--progress-pending: #FFB74D;             /* Light orange - pending */
--progress-unavailable: #999999;         /* Gray - cannot build */
Border Colors
css--border-light: #DED3B9;                 /* Light tan */
--border-medium: #7D510F;                /* Medium brown */
--border-dark: #654321;                  /* Dark brown */
--border-highlight: #C1A264;             /* Gold */
Text Colors
css--text-primary: #000000;                 /* Black */
--text-secondary: #666666;               /* Gray */
--text-light: #999999;                   /* Light gray */
--text-link: #FFFFFF;                    /* White (on dark backgrounds) */
--text-link-hover: #FFD700;              /* Gold */
--text-disabled: #CCCCCC;                /* Very light gray */
Typography
Font Family
cssfont-family: Verdana, Arial, sans-serif;
Font Sizes
css--font-size-xs: 10px;                    /* Small labels */
--font-size-sm: 11px;                    /* Secondary text */
--font-size-base: 12px;                  /* Body text */
--font-size-md: 13px;                    /* Emphasis */
--font-size-lg: 14px;                    /* Subheadings */
--font-size-xl: 16px;                    /* Main headings */
--font-size-xxl: 18px;                   /* Large headings */
Font Weights
css--font-weight-normal: 400;
--font-weight-bold: 700;
Line Heights
css--line-height-tight: 1.2;
--line-height-normal: 1.4;
--line-height-relaxed: 1.6;
Spacing System
css--spacing-xs: 2px;                       /* Tiny gaps */
--spacing-sm: 3px;                       /* Small spacing */
--spacing-md: 5px;                       /* Medium spacing */
--spacing-lg: 10px;                      /* Large spacing */
--spacing-xl: 15px;                      /* Extra large */
--spacing-xxl: 20px;                     /* Very large */
Border Radius
css--radius-none: 0px;                      /* Sharp corners */
--radius-sm: 3px;                        /* Slight rounding */
--radius-md: 5px;                        /* Medium rounding */
--radius-lg: 10px;                       /* Large rounding */
--radius-full: 50%;                      /* Circular */
Shadows
css--shadow-none: none;
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.15);
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.2);
--shadow-inset: inset 0 2px 4px rgba(0, 0, 0, 0.1);
Component Styles
Button Style Template
css.tribal-button {
  background: #654321;
  color: #FFFFFF;
  border: 1px solid #4a3214;
  border-radius: 5px;
  padding: 5px 15px;
  font-size: 12px;
  font-family: Verdana, Arial, sans-serif;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.tribal-button:hover {
  background: #7D510F;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
}

.tribal-button-danger {
  background: #C14747;
  border-color: #a03737;
}

.tribal-button-danger:hover {
  background: #D55555;
}
Content Box Template
css.tribal-box {
  background: #FFF8E8;
  border: 1px solid #7D510F;
  border-radius: 3px;
  padding: 10px;
  margin: 5px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
Table Template
css.tribal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.tribal-table thead {
  background: #C1A264;
  color: #000000;
  font-weight: bold;
}

.tribal-table tr:nth-child(even) {
  background: #F4E4BC;
}

.tribal-table tr:nth-child(odd) {
  background: #DED3B9;
}

.tribal-table td, .tribal-table th {
  padding: 5px;
  border: 1px solid #7D510F;
}
Input Field Template
css.tribal-input {
  background: #FFFFFF;
  border: 1px solid #7D510F;
  padding: 5px;
  font-size: 12px;
  font-family: Verdana, Arial, sans-serif;
  color: #000000;
}

.tribal-input:focus {
  border-color: #654321;
  outline: none;
  box-shadow: 0 0 3px rgba(101, 67, 33, 0.3);
}
Resource Icons Colors
css--wood-color: #8B4513;                   /* Brown */
--stone-color: #808080;                  /* Gray */
--iron-color: #4A4A4A;                   /* Dark gray */
--population-color: #FFD700;             /* Gold */
This complete design system matches the Tribal Wars medieval/parchment theme perfectly!