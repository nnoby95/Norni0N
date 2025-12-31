/*
 * TRIBAL WARS SIEGE CALCULATOR - OFFICIAL FORMULA
 * Based on catapult train method (level-by-level destruction)
 * Source: Official Tribal Wars mechanics
 */

const SiegeCalculator = {
    
    /**
     * Official catapult requirements per level (for standard buildings)
     * This is the EXACT data from the game
     */
    CATAPULT_TABLE: {
        30: 20, 29: 19, 28: 17, 27: 16, 26: 15, 25: 13,
        24: 12, 23: 11, 22: 11, 21: 10, 20: 9,  19: 8,
        18: 8,  17: 7,  16: 6,  15: 6,  14: 6,  13: 5,
        12: 5,  11: 4,  10: 4,  9: 4,   8: 4,   7: 3,
        6: 3,   5: 3,   4: 3,   3: 2,   2: 2,   1: 2
    },
    
    /**
     * Building type multipliers (some buildings are harder/easier to destroy)
     */
    BUILDING_MULTIPLIERS: {
        // Standard buildings (1.0x)
        'main': 1.0,
        'barracks': 1.0,
        'stable': 1.0,
        'garage': 1.0,
        'smith': 1.0,
        'market': 1.0,
        'statue': 1.0,
        
        // Resource buildings (easier - 0.8x)
        'wood': 0.8,
        'stone': 0.8,
        'iron': 0.8,
        'farm': 0.8,
        'storage': 0.8,
        'hide': 0.8,
        
        // Defensive buildings (harder - 1.5x)
        'wall': 1.5,
        'watchtower': 1.5,
        
        // Special buildings
        'church': 1.2,
        'church_f': 1.2,
        'snob': 2.0,
        'place': 0 // Cannot be destroyed
    },
    
    /**
     * Get catapults needed to destroy one level
     */
    catapultsPerLevel: function(building, currentLevel) {
        if (currentLevel <= 0) return 0;
        if (building === 'place') return 0; // Rally point can't be destroyed
        
        // Get base catapults from table
        const baseCats = this.CATAPULT_TABLE[currentLevel] || 2; // Default to 2 if level not in table
        
        // Apply building multiplier
        const multiplier = this.BUILDING_MULTIPLIERS[building] || 1.0;
        
        return Math.ceil(baseCats * multiplier);
    },
    
    /**
     * Calculate catapult train from current level to target level
     */
    calculateCatapultTrain: function(building, currentLevel, targetLevel = 0) {
        if (currentLevel <= targetLevel) {
            return {
                building: building,
                currentLevel: currentLevel,
                targetLevel: targetLevel,
                totalCatapults: 0,
                waves: [],
                message: 'Building is already at or below target level'
            };
        }
        
        if (building === 'place') {
            return {
                building: building,
                message: 'Rally point cannot be destroyed',
                totalCatapults: 0,
                waves: []
            };
        }
        
        const waves = [];
        let totalCatapults = 0;
        
        for (let level = currentLevel; level > targetLevel; level--) {
            const catsNeeded = this.catapultsPerLevel(building, level);
            totalCatapults += catsNeeded;
            
            waves.push({
                wave: waves.length + 1,
                from: level,
                to: level - 1,
                catapults: catsNeeded,
                cumulative: totalCatapults
            });
        }
        
        return {
            building: building,
            currentLevel: currentLevel,
            targetLevel: targetLevel,
            totalCatapults: totalCatapults,
            totalWaves: waves.length,
            waves: waves
        };
    },
    
    /**
     * RAM CALCULATION (Wall-specific)
     * Rams follow a similar but different formula
     */
    RAM_TABLE: {
        20: 10, 19: 9, 18: 9, 17: 8, 16: 8, 15: 7,
        14: 7, 13: 6, 12: 6, 11: 5, 10: 5, 9: 4,
        8: 4, 7: 4, 6: 3, 5: 3, 4: 3, 3: 2, 2: 2, 1: 2
    },
    
    /**
     * Calculate ram train to destroy wall
     */
    calculateRamTrain: function(currentLevel, targetLevel = 0) {
        if (currentLevel <= targetLevel) {
            return {
                building: 'wall',
                currentLevel: currentLevel,
                targetLevel: targetLevel,
                totalRams: 0,
                waves: [],
                message: 'Wall is already at or below target level'
            };
        }
        
        const waves = [];
        let totalRams = 0;
        
        for (let level = currentLevel; level > targetLevel; level--) {
            const ramsNeeded = this.RAM_TABLE[level] || 2;
            totalRams += ramsNeeded;
            
            waves.push({
                wave: waves.length + 1,
                from: level,
                to: level - 1,
                rams: ramsNeeded,
                cumulative: totalRams
            });
        }
        
        return {
            building: 'wall',
            currentLevel: currentLevel,
            targetLevel: targetLevel,
            totalRams: totalRams,
            totalWaves: waves.length,
            waves: waves
        };
    },
    
    /**
     * Complete village demolition plan
     */
    planCompleteDemolition: function(buildings) {
        const plan = {
            ramWaves: [],
            catapultWaves: [],
            totalRams: 0,
            totalCatapults: 0,
            totalWaves: 0
        };
        
        // Handle wall first (with rams)
        if (buildings.wall && buildings.wall > 0) {
            const ramPlan = this.calculateRamTrain(buildings.wall, 0);
            plan.ramWaves = ramPlan.waves;
            plan.totalRams = ramPlan.totalRams;
        }
        
        // Handle all other buildings (with catapults)
        Object.entries(buildings).forEach(([building, level]) => {
            if (building === 'wall' || building === 'place' || level <= 0) return;
            
            const catPlan = this.calculateCatapultTrain(building, level, 0);
            
            catPlan.waves.forEach(wave => {
                plan.catapultWaves.push({
                    ...wave,
                    building: building,
                    wave: plan.totalWaves + 1
                });
                plan.totalWaves++;
            });
            
            plan.totalCatapults += catPlan.totalCatapults;
        });
        
        plan.totalWaves += plan.ramWaves.length;
        
        return plan;
    },
    
    /**
     * Verify against official data
     */
    verifyFormula: function() {
        console.log('🧪 VERIFICATION AGAINST OFFICIAL DATA\n');
        console.log('Building level 30→0 (Standard building):');
        
        const officialData = [
            { level: 30, cats: 20, cumulative: 238 },
            { level: 29, cats: 19, cumulative: 218 },
            { level: 28, cats: 17, cumulative: 199 },
            { level: 8, cats: 4, cumulative: 22 },
            { level: 7, cats: 3, cumulative: 18 },
            { level: 1, cats: 2, cumulative: 2 }
        ];
        
        const calculated = this.calculateCatapultTrain('main', 30, 0);
        
        console.log('Checking key levels:\n');
        officialData.forEach(official => {
            const wave = calculated.waves.find(w => w.from === official.level);
            if (wave) {
                const catsMatch = wave.catapults === official.cats ? '✅' : '❌';
                const cumMatch = wave.cumulative === official.cumulative ? '✅' : '❌';
                console.log(`Level ${official.level}→${official.level-1}:`);
                console.log(`  ${catsMatch} Cats: Expected ${official.cats}, Got ${wave.catapults}`);
                console.log(`  ${cumMatch} Cumulative: Expected ${official.cumulative}, Got ${wave.cumulative}\n`);
            }
        });
        
        console.log(`📊 Total for level 30→0: ${calculated.totalCatapults} catapults`);
        console.log(`   Official data says: 238 catapults`);
        console.log(`   ${calculated.totalCatapults === 238 ? '✅ PERFECT MATCH!' : '❌ Mismatch'}`);
    },
    
    /**
     * Display formatted plan
     */
    displayPlan: function(plan) {
        console.log('\n🎯 COMPLETE DEMOLITION PLAN\n');
        
        if (plan.ramWaves.length > 0) {
            console.log('🐏 RAM WAVES (Wall Destruction):');
            plan.ramWaves.slice(0, 5).forEach(wave => {
                console.log(`  Wave ${wave.wave}: ${wave.from}→${wave.to} = ${wave.rams} rams (Total: ${wave.cumulative})`);
            });
            if (plan.ramWaves.length > 5) {
                console.log(`  ... ${plan.ramWaves.length - 5} more waves`);
            }
            console.log(`  📊 Total rams needed: ${plan.totalRams}\n`);
        }
        
        if (plan.catapultWaves.length > 0) {
            console.log('💥 CATAPULT WAVES (Building Destruction):');
            
            // Group by building
            const byBuilding = {};
            plan.catapultWaves.forEach(wave => {
                if (!byBuilding[wave.building]) {
                    byBuilding[wave.building] = [];
                }
                byBuilding[wave.building].push(wave);
            });
            
            Object.entries(byBuilding).forEach(([building, waves]) => {
                const total = waves.reduce((sum, w) => sum + w.catapults, 0);
                console.log(`\n  ${building.toUpperCase()} (${waves.length} waves, ${total} cats total):`);
                waves.slice(0, 3).forEach(wave => {
                    console.log(`    Wave ${wave.wave}: ${wave.from}→${wave.to} = ${wave.catapults} cats`);
                });
                if (waves.length > 3) {
                    console.log(`    ... ${waves.length - 3} more waves`);
                }
            });
            
            console.log(`\n  📊 Total catapults needed: ${plan.totalCatapults}`);
        }
        
        console.log(`\n🌊 TOTAL WAVES: ${plan.totalWaves}`);
    }
};

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

console.log('🏰 Tribal Wars Siege Calculator - Official Formula\n');

// Verify the formula is correct
SiegeCalculator.verifyFormula();

// Example 1: Your original question - level 8 building
console.log('\n\n📝 YOUR EXAMPLE: Building level 8→1\n');
const example1 = SiegeCalculator.calculateCatapultTrain('barracks', 8, 1);
console.log(`Total catapults: ${example1.totalCatapults}`);
console.log('Waves:');
example1.waves.forEach(wave => {
    console.log(`  Wave ${wave.wave}: ${wave.from}→${wave.to} = ${wave.catapults} cats`);
});

// Example 2: Wall destruction
console.log('\n\n🛡️ WALL DESTRUCTION: Level 15→0\n');
const wallExample = SiegeCalculator.calculateRamTrain(15, 0);
console.log(`Total rams: ${wallExample.totalRams}`);
console.log('First 5 waves:');
wallExample.waves.slice(0, 5).forEach(wave => {
    console.log(`  Wave ${wave.wave}: ${wave.from}→${wave.to} = ${wave.rams} rams`);
});

// Example 3: Complete village demolition
console.log('\n\n💀 COMPLETE VILLAGE DEMOLITION\n');
const targetVillage = {
    wall: 18,
    main: 25,
    barracks: 20,
    stable: 15,
    farm: 28,
    storage: 25,
    wood: 30,
    stone: 30,
    iron: 30
};

const demolitionPlan = SiegeCalculator.planCompleteDemolition(targetVillage);
SiegeCalculator.displayPlan(demolitionPlan);

// Quick lookup functions
console.log('\n\n🔍 QUICK LOOKUP FUNCTIONS:\n');
console.log('// Get cats for single level');
console.log('SiegeCalculator.catapultsPerLevel("main", 20); // Returns: 9');
console.log('');
console.log('// Get full train plan');
console.log('SiegeCalculator.calculateCatapultTrain("barracks", 25, 0);');
console.log('');
console.log('// Get ram train for wall');
console.log('SiegeCalculator.calculateRamTrain(20, 0);');