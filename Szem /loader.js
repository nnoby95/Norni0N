/*
 * TRIBAL WARS SETTINGS LOADER
 * ===========================
 * Backup and restore your Tribal Wars localStorage settings
 * Version: 1.0.0
 * Author: NorbiOn Systems
 * 
 * FEATURES:
 * - One-click settings restore
 * - Backup current settings before loading
 * - Safety checks to prevent data loss
 * - Clean UI with status messages
 */

(function() {
    'use strict';

    // =============================================================================
    // YOUR DEFAULT SETTINGS (Edit this if needed)
    // =============================================================================
    
    const DEFAULT_SETTINGS = {
        "twcheese.userConfig": "{\"props\":{\"ASS\":{\"troopsAssigner\":{\"mode\":\"addict\",\"allowedOptionIds\":[1,2,3,4],\"targetDurationSeconds\":7200,\"troops\":{\"spear\":{\"maySend\":true,\"reserved\":0},\"sword\":{\"maySend\":true,\"reserved\":0},\"axe\":{\"maySend\":true,\"reserved\":0},\"archer\":{\"maySend\":true,\"reserved\":0},\"light\":{\"maySend\":true,\"reserved\":0},\"marcher\":{\"maySend\":true,\"reserved\":0},\"heavy\":{\"maySend\":true,\"reserved\":0},\"knight\":{\"maySend\":false,\"reserved\":0}},\"troopOrder\":[[\"axe\",\"light\",\"marcher\"],[\"spear\",\"sword\",\"archer\"],[\"heavy\"],[\"knight\"]]}}}}",
        
        "1587117_hu98S0_sys": "{\"selectedProfile\":1,\"profile1\":{\"wallp_left\":\"https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/TW3.webp\",\"wallp_left_vid\":\"-\",\"wallp_left_mirror\":true,\"wallp_right\":\"https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/TW4.webp\",\"wallp_right_vid\":\"-\",\"wallp_right_mirror\":false,\"content_bgcolor\":\"#d2c09e url('https://dshu.innogamescdn.com/asset/ae6c0149/graphic/background/bg-image.webp')\",\"content_fontcolor\":\"#000\",\"content_border\":\"#8B4513\",\"content_shadow\":\"0 0 12px black\",\"frame_width\":\"1024\",\"table_bgcolor\":\"-\",\"table_color\":\"-\",\"table_head_bgcolor\":\"-\",\"table_head_color\":\"-\"},\"profile2\":{},\"profile3\":{},\"profile4\":{},\"altbot\":false,\"altboturl\":\"http://www.youtube.com/watch?v=k2a30--j37Q\",\"naplobejegyzes\":true,\"bot2\":true,\"farmolas\":true,\"bejovo\":true,\"epites\":true,\"falu_kesz\":true,\"kritikus_hiba\":true,\"norbi0n_start\":true,\"norbi0n_complete\":true,\"wallp_left\":\"https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/TW3.webp\",\"wallp_left_vid\":\"-\",\"wallp_left_mirror\":true,\"wallp_right\":\"https://raw.githubusercontent.com/nnoby95/Norni0N/main/Assets/TW4.webp\",\"wallp_right_vid\":\"-\",\"wallp_right_mirror\":false,\"content_bgcolor\":\"#d2c09e url('https://dshu.innogamescdn.com/asset/ae6c0149/graphic/background/bg-image.webp')\",\"content_fontcolor\":\"#000\",\"content_border\":\"#8B4513\",\"content_shadow\":\"0 0 12px black\",\"frame_width\":\"1024\",\"table_bgcolor\":\"-\",\"table_color\":\"-\",\"table_head_bgcolor\":\"-\",\"table_head_color\":\"-\"}",
        
        "1587117_hu98S0_epit_autofinish": "{\"enabled\":true}",
        
        "1587117_hu98S0_epit_forcefarm": "{\"enabled\":true,\"threshold\":10}",
        
        "twcheese.gameConfig": "{\"props\":{\"speed\":1.6,\"unit_speed\":0.625,\"moral\":2,\"premium\":{\"free_Premium\":1,\"free_Premium_intervals\":500,\"AccountManager\":1,\"AccountManager_Premium_needed\":1,\"ItemNameColor\":1,\"free_AccountManager\":1,\"free_AccountManager_intervals\":10,\"BuildTimeReduction\":1,\"BuildTimeReduction_percentage\":50,\"BuildInstant\":1,\"BuildInstant_free\":1,\"BuildCostReduction\":1,\"FarmAssistent\":1,\"MerchantBonus\":null,\"ProductionBonus\":1,\"NoblemanSlot\":null,\"MerchantExchange\":1,\"MerchantExchange_ratio\":1,\"PremiumExchange\":1,\"KnightBookImprove\":1,\"KnightBookDowngrade\":1,\"KnightBookReroll\":1,\"KnightRespec\":1,\"KnightRecruitTime\":1,\"KnightRecruitInstant\":1,\"KnightReviveTime\":1,\"KnightReviveInstant\":1,\"KnightTrainingCost\":1,\"KnightTrainingTime\":1,\"KnightTrainingInstant\":1,\"DailyBonusUnlock\":1,\"ScavengingSquadLoot\":1,\"PremiumEventFeatures\":1,\"PremiumRelicFeatures\":1,\"VillageSkin\":1},\"awards\":{\"available\":1,\"milestones_available\":1,\"AwardDailyKillsAttacker_lead_time\":30,\"AwardDailyKillsDefender_lead_time\":30,\"AwardDailyKillsSupporter_lead_time\":30,\"AwardDailyLootResources_lead_time\":30,\"AwardDailyScavengeResources_lead_time\":30,\"AwardDailyLootVillages_lead_time\":30,\"AwardDailyVillageCount_lead_time\":60,\"AwardHighscoreCont_lead_time\":60,\"AwardHighscoreGlobal_lead_time\":60},\"build\":{\"destroy\":1},\"misc\":{\"kill_ranking\":2,\"tutorial\":5,\"trade_cancel_time\":300},\"commands\":{\"millis_arrival\":1,\"attack_gap\":75,\"support_gap\":75,\"command_cancel_time\":600},\"newbie\":{\"days\":4,\"ratio_days\":60,\"ratio\":20,\"removeNewbieVillages\":1},\"game\":{\"buildtime_formula\":2,\"knight\":3,\"knight_new_items\":null,\"knight_archer_bonus\":1,\"archer\":1,\"tech\":2,\"farm_limit\":null,\"church\":null,\"watchtower\":1,\"stronghold\":null,\"fake_limit\":null,\"barbarian_rise\":0.003,\"barbarian_shrink\":null,\"barbarian_max_points\":4000,\"scavenging\":1,\"hauls\":1,\"hauls_base\":1000,\"hauls_max\":100000,\"base_production\":30,\"event\":null,\"suppress_events\":null,\"relics\":1},\"buildings\":{\"custom_main\":-1,\"custom_farm\":-1,\"custom_storage\":-1,\"custom_place\":-1,\"custom_barracks\":-1,\"custom_church\":-1,\"custom_smith\":-1,\"custom_wood\":-1,\"custom_stone\":-1,\"custom_iron\":-1,\"custom_market\":-1,\"custom_stable\":-1,\"custom_wall\":-1,\"custom_garage\":-1,\"custom_hide\":-1,\"custom_snob\":-1,\"custom_statue\":-1,\"custom_watchtower\":-1},\"snob\":{\"gold\":1,\"cheap_rebuild\":null,\"rise\":2,\"max_dist\":150,\"factor\":1,\"coin_wood\":28000,\"coin_stone\":30000,\"coin_iron\":25000,\"no_barb_conquer\":null},\"ally\":{\"no_harm\":null,\"no_other_support\":null,\"no_other_support_type\":null,\"allytime_support\":null,\"allytime_support_type\":null,\"no_leave\":null,\"no_join\":null,\"limit\":35,\"fixed_allies\":null,\"fixed_allies_randomized\":null,\"wars_member_requirement\":5,\"wars_points_requirement\":15000,\"wars_autoaccept_days\":7,\"auto_lock_tribes\":null,\"auto_lock_dominance_percentage\":null,\"auto_lock_days\":null,\"levels\":1,\"xp_requirements\":null},\"coord\":{\"map_size\":1000,\"func\":4,\"empty_villages\":90,\"bonus_villages\":30,\"inner\":1892,\"select_start\":1,\"village_move_wait\":336,\"noble_restart\":1,\"start_villages\":1},\"sitter\":{\"allow\":1,\"illegal_time\":48,\"max_sitting\":3},\"sleep\":{\"active\":null,\"delay\":60,\"min\":6,\"max\":10,\"min_awake\":12,\"max_awake\":36,\"warn_time\":10},\"night\":{\"active\":1,\"start_hour\":null,\"end_hour\":8,\"def_factor\":2,\"duration\":14},\"mood\":{\"loss_max\":35,\"loss_min\":20,\"load\":1},\"win\":{\"check\":3,\"give_prizes\":1},\"points_villages_win\":{\"points\":null,\"villages\":null,\"hours\":null},\"dominance_win\":{\"status\":null,\"domination_warning\":45,\"world_age_warning\":80,\"domination_endgame\":65,\"world_age_endgame\":180,\"holding_period_days\":14,\"domination_reached_at\":null,\"victory_reached_at\":null},\"runes_win\":{\"spawning_delay\":90,\"spawn_villages_per_continent\":25,\"win_percentage\":60,\"hold_time\":14,\"disable_morale\":null},\"siege_win\":{\"villages\":36,\"required_points\":162000,\"check_days\":7,\"minimum_world_age\":140,\"reduction_percentage\":12,\"reduction_max_percentage\":85,\"disable_morale\":null},\"casual\":{\"transfer_to\":null,\"attack_block\":null,\"attack_block_max\":1.2,\"block_noble\":null,\"disabled_restart_deadline\":48,\"automation_version\":1,\"automation_start_after\":null,\"automation_change_interval\":null,\"limit_inventory_transfer\":1}},\"timeUpdated\":1768246495614}",
        
        "twcheese.troopConfig": "{\"props\":{\"spear\":{\"build_time\":637.5,\"pop\":1,\"speed\":18,\"attack\":10,\"defense\":15,\"defense_cavalry\":45,\"defense_archer\":20,\"carry\":25},\"sword\":{\"build_time\":937.5,\"pop\":1,\"speed\":22,\"attack\":25,\"defense\":50,\"defense_cavalry\":15,\"defense_archer\":40,\"carry\":15},\"axe\":{\"build_time\":825,\"pop\":1,\"speed\":18,\"attack\":40,\"defense\":10,\"defense_cavalry\":5,\"defense_archer\":10,\"carry\":10},\"archer\":{\"build_time\":1125,\"pop\":1,\"speed\":18,\"attack\":15,\"defense\":50,\"defense_cavalry\":40,\"defense_archer\":5,\"carry\":10},\"spy\":{\"build_time\":562.5,\"pop\":2,\"speed\":9,\"attack\":null,\"defense\":2,\"defense_cavalry\":1,\"defense_archer\":2,\"carry\":null},\"light\":{\"build_time\":1125,\"pop\":4,\"speed\":10,\"attack\":130,\"defense\":30,\"defense_cavalry\":40,\"defense_archer\":30,\"carry\":80},\"marcher\":{\"build_time\":1687.5,\"pop\":5,\"speed\":10,\"attack\":120,\"defense\":40,\"defense_cavalry\":30,\"defense_archer\":50,\"carry\":50},\"heavy\":{\"build_time\":2250,\"pop\":6,\"speed\":11,\"attack\":150,\"defense\":200,\"defense_cavalry\":80,\"defense_archer\":180,\"carry\":50},\"ram\":{\"build_time\":3000,\"pop\":5,\"speed\":30,\"attack\":2,\"defense\":20,\"defense_cavalry\":50,\"defense_archer\":20,\"carry\":null},\"catapult\":{\"build_time\":4500,\"pop\":8,\"speed\":30,\"attack\":100,\"defense\":100,\"defense_cavalry\":50,\"defense_archer\":100,\"carry\":null},\"knight\":{\"build_time\":13500,\"pop\":10,\"speed\":10,\"attack\":150,\"defense\":250,\"defense_cavalry\":400,\"defense_archer\":150,\"carry\":100},\"snob\":{\"build_time\":11250,\"pop\":100,\"speed\":35,\"attack\":30,\"defense\":100,\"defense_cavalry\":50,\"defense_archer\":100,\"carry\":null}},\"timeUpdated\":1768246495616}",
        
        "1587117_hu98S0_farm": "{\"ALL_UNIT_MOVEMENT\":{},\"ALL_SPY_MOVEMENTS\":{},\"DOMINFO_FARMS\":{},\"DOMINFO_FROM\":{},\"OPTIONS\":{}}",
        
        "1587117_hu98S0_norbi0n_farm": "{\"OPTIONS\":{\"loopInterval\":10,\"randomDelay\":3,\"loopMode\":false},\"STATS\":{\"lastRun\":0,\"totalRuns\":0}}",
        
        "1587117_hu98S0_daily_reward": "{\"lastCollectedDate\":\"2026-01-12\",\"enabled\":true,\"scheduledTime\":\"00:38\"}",
        
        "confirmation_skipping_preferences": "{\"flag_multi_upgrade\":0,\"flag_single_upgrade\":0,\"confirmation_box_place_call_selected_all\":0}",
        
        "1587117_hu98S0_gyujto": "{\"3480\":true,\"settings\":{\"strategy\":\"max\"}}",
        
        "1587117_hu98S0_vije": "{\"ALL_VIJE_SAVED\":{},\"i18ns\":{\"main\":\"Főhadiszállás\",\"barracks\":\"Barakk\",\"stable\":\"Istálló\",\"garage\":\"Műhely\",\"smith\":\"Kovácsműhely\",\"market\":\"Piac\",\"wood\":\"Fatelep\",\"stone\":\"Agyagbánya\",\"iron\":\"Vasbánya\",\"farm\":\"Tanya\",\"wall\":\"Fal\",\"isdelete\":false,\"isRelicMode\":false},\"ELEMZETT\":[]}",
        
        "1587117_hu98S0_recruitment": "{\"OPTIONS\":{\"checkInterval\":46,\"randomDelay\":2,\"resourceBudget\":60,\"buildingDist\":{\"barracks\":50,\"stable\":30,\"garage\":20},\"maxUnits\":{\"barracks\":0,\"stable\":0,\"garage\":0},\"loopMode\":true},\"TEMPLATES\":[{\"id\":1768246457165,\"name\":\"g\",\"units\":{\"spear\":1500,\"spy\":300}}],\"ACTIVE_TEMPLATE\":{\"id\":1768246457165,\"name\":\"g\",\"units\":{\"spear\":1500,\"spy\":300}},\"CURRENT_PLAN\":{\"spear\":3},\"ROTATION\":{\"barracks\":0,\"stable\":0,\"garage\":0},\"STATS\":{\"lastRun\":1768246468214,\"totalRuns\":1,\"totalRecruits\":1,\"errors\":0}}",
        
        "szem_norbi0n_szem_features": "{\"acc_settings\":{\"enabled\":false,\"name\":\"🎯 Quest Arrows Toggle\",\"description\":\"Toggle quest arrows on/off in account settings (one-click action)\"},\"clan_settings\":{\"enabled\":false,\"name\":\"👥 Clan Share Settings\",\"description\":\"Enable all 8 clan sharing options in account settings (one-click action)\"},\"daily_reward\":{\"enabled\":true,\"name\":\"🎁 Daily Reward Collector\",\"description\":\"Auto-collect daily rewards randomly between 00:10 and 03:00\"}}",
        
        "twcheese.buildingConfig": "{\"props\":{\"main\":{\"max_level\":30,\"min_level\":1,\"wood\":90,\"stone\":80,\"iron\":70,\"pop\":5,\"wood_factor\":1.26,\"stone_factor\":1.275,\"iron_factor\":1.26,\"pop_factor\":1.17,\"build_time\":562.5,\"build_time_factor\":1.2},\"barracks\":{\"max_level\":25,\"min_level\":null,\"wood\":200,\"stone\":170,\"iron\":90,\"pop\":7,\"wood_factor\":1.26,\"stone_factor\":1.28,\"iron_factor\":1.26,\"pop_factor\":1.17,\"build_time\":1125,\"build_time_factor\":1.2},\"stable\":{\"max_level\":20,\"min_level\":null,\"wood\":270,\"stone\":240,\"iron\":260,\"pop\":8,\"wood_factor\":1.26,\"stone_factor\":1.28,\"iron_factor\":1.26,\"pop_factor\":1.17,\"build_time\":3750,\"build_time_factor\":1.2},\"garage\":{\"max_level\":15,\"min_level\":null,\"wood\":300,\"stone\":240,\"iron\":260,\"pop\":8,\"wood_factor\":1.26,\"stone_factor\":1.28,\"iron_factor\":1.26,\"pop_factor\":1.17,\"build_time\":3750,\"build_time_factor\":1.2},\"watchtower\":{\"max_level\":20,\"min_level\":null,\"wood\":12000,\"stone\":14000,\"iron\":10000,\"pop\":500,\"wood_factor\":1.17,\"stone_factor\":1.17,\"iron_factor\":1.18,\"pop_factor\":1.18,\"build_time\":8250,\"build_time_factor\":1.2},\"snob\":{\"max_level\":1,\"min_level\":null,\"wood\":15000,\"stone\":25000,\"iron\":10000,\"pop\":80,\"wood_factor\":2,\"stone_factor\":2,\"iron_factor\":2,\"pop_factor\":1.17,\"build_time\":366750,\"build_time_factor\":1.2},\"smith\":{\"max_level\":20,\"min_level\":null,\"wood\":220,\"stone\":180,\"iron\":240,\"pop\":20,\"wood_factor\":1.26,\"stone_factor\":1.275,\"iron_factor\":1.26,\"pop_factor\":1.17,\"build_time\":3750,\"build_time_factor\":1.2},\"place\":{\"max_level\":1,\"min_level\":null,\"wood\":10,\"stone\":40,\"iron\":30,\"pop\":null,\"wood_factor\":1.26,\"stone_factor\":1.275,\"iron_factor\":1.26,\"pop_factor\":1.17,\"build_time\":6787.5,\"build_time_factor\":1.2},\"statue\":{\"max_level\":1,\"min_level\":null,\"wood\":220,\"stone\":220,\"iron\":220,\"pop\":10,\"wood_factor\":1.26,\"stone_factor\":1.275,\"iron_factor\":1.26,\"pop_factor\":1.17,\"build_time\":937.5,\"build_time_factor\":1.2},\"market\":{\"max_level\":25,\"min_level\":null,\"wood\":100,\"stone\":100,\"iron\":100,\"pop\":20,\"wood_factor\":1.26,\"stone_factor\":1.275,\"iron_factor\":1.26,\"pop_factor\":1.17,\"build_time\":1687.5,\"build_time_factor\":1.2},\"wood\":{\"max_level\":30,\"min_level\":null,\"wood\":50,\"stone\":60,\"iron\":40,\"pop\":5,\"wood_factor\":1.25,\"stone_factor\":1.275,\"iron_factor\":1.245,\"pop_factor\":1.155,\"build_time\":562.5,\"build_time_factor\":1.2},\"stone\":{\"max_level\":30,\"min_level\":null,\"wood\":65,\"stone\":50,\"iron\":40,\"pop\":10,\"wood_factor\":1.27,\"stone_factor\":1.265,\"iron_factor\":1.24,\"pop_factor\":1.14,\"build_time\":562.5,\"build_time_factor\":1.2},\"iron\":{\"max_level\":30,\"min_level\":null,\"wood\":75,\"stone\":65,\"iron\":70,\"pop\":10,\"wood_factor\":1.252,\"stone_factor\":1.275,\"iron_factor\":1.24,\"pop_factor\":1.17,\"build_time\":675,\"build_time_factor\":1.2},\"farm\":{\"max_level\":30,\"min_level\":1,\"wood\":45,\"stone\":40,\"iron\":30,\"pop\":null,\"wood_factor\":1.3,\"stone_factor\":1.32,\"iron_factor\":1.29,\"pop_factor\":1,\"build_time\":750,\"build_time_factor\":1.2},\"storage\":{\"max_level\":30,\"min_level\":1,\"wood\":60,\"stone\":50,\"iron\":40,\"pop\":null,\"wood_factor\":1.265,\"stone_factor\":1.27,\"iron_factor\":1.245,\"pop_factor\":1.15,\"build_time\":637.5,\"build_time_factor\":1.2},\"hide\":{\"max_level\":10,\"min_level\":null,\"wood\":50,\"stone\":60,\"iron\":50,\"pop\":2,\"wood_factor\":1.25,\"stone_factor\":1.25,\"iron_factor\":1.25,\"pop_factor\":1.17,\"build_time\":1125,\"build_time_factor\":1.2},\"wall\":{\"max_level\":20,\"min_level\":null,\"wood\":50,\"stone\":100,\"iron\":20,\"pop\":5,\"wood_factor\":1.26,\"stone_factor\":1.275,\"iron_factor\":1.26,\"pop_factor\":1.17,\"build_time\":2250,\"build_time_factor\":1.2}},\"timeUpdated\":1768246495618}"
    };

    // =============================================================================
    // CORE FUNCTIONS
    // =============================================================================

    /**
     * Load default settings into localStorage
     */
    function loadDefaultSettings() {
        console.log('🔄 Loading default settings...');
        
        let loaded = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
            try {
                localStorage.setItem(key, value);
                loaded++;
                console.log(`✅ Loaded: ${key}`);
            } catch (error) {
                console.error(`❌ Failed to load ${key}:`, error);
                errors++;
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`  ✅ Loaded: ${loaded}`);
        console.log(`  ⚠️ Errors: ${errors}`);
        
        return { loaded, skipped, errors };
    }

    /**
     * Create backup of current localStorage
     */
    function backupCurrentSettings() {
        console.log('💾 Creating backup of current settings...');
        
        const backup = {};
        const timestamp = new Date().toISOString();
        
        // Backup all localStorage items
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backup[key] = localStorage.getItem(key);
        }
        
        // Save to special backup key
        const backupKey = `tw_settings_backup_${timestamp}`;
        try {
            localStorage.setItem(backupKey, JSON.stringify(backup));
            console.log(`✅ Backup saved as: ${backupKey}`);
            return backupKey;
        } catch (error) {
            console.error('❌ Failed to create backup:', error);
            return null;
        }
    }

    /**
     * Export current settings to console (for copying)
     */
    function exportCurrentSettings() {
        console.log('📤 Exporting current settings...');
        
        const settings = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            settings[key] = localStorage.getItem(key);
        }
        
        const settingsJSON = JSON.stringify(settings, null, 2);
        console.log('\n📋 Copy this to save your settings:\n');
        console.log(settingsJSON);
        
        // Copy to clipboard if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(settingsJSON).then(() => {
                console.log('\n✅ Settings copied to clipboard!');
            }).catch(() => {
                console.log('\n⚠️ Could not copy to clipboard automatically');
            });
        }
        
        return settings;
    }

    /**
     * List all backups
     */
    function listBackups() {
        console.log('📋 Available backups:');
        
        const backups = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('tw_settings_backup_')) {
                const timestamp = key.replace('tw_settings_backup_', '');
                const date = new Date(timestamp);
                backups.push({ key, date, dateString: date.toLocaleString() });
            }
        }
        
        if (backups.length === 0) {
            console.log('  ℹ️ No backups found');
        } else {
            backups.sort((a, b) => b.date - a.date);
            backups.forEach((backup, index) => {
                console.log(`  ${index + 1}. ${backup.dateString} (${backup.key})`);
            });
        }
        
        return backups;
    }

    /**
     * Restore from backup
     */
    function restoreFromBackup(backupKey) {
        console.log(`🔄 Restoring from backup: ${backupKey}...`);
        
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                console.error('❌ Backup not found!');
                return false;
            }
            
            const backup = JSON.parse(backupData);
            let restored = 0;
            
            for (const [key, value] of Object.entries(backup)) {
                if (!key.startsWith('tw_settings_backup_')) {
                    localStorage.setItem(key, value);
                    restored++;
                }
            }
            
            console.log(`✅ Restored ${restored} settings from backup!`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to restore backup:', error);
            return false;
        }
    }

    // =============================================================================
    // UI CREATION
    // =============================================================================

    function createUI() {
        // Check if UI already exists
        if (document.getElementById('tw-settings-loader')) {
            console.log('⚠️ Settings Loader UI already exists');
            return;
        }

        const uiHTML = `
            <div id="tw-settings-loader" style="
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 99999;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: 3px solid #fff;
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                width: 320px;
                font-family: Arial, sans-serif;
                color: #fff;
            ">
                <div style="margin-bottom: 15px; text-align: center;">
                    <h3 style="margin: 0; font-size: 18px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                        ⚙️ Settings Loader
                    </h3>
                    <small style="opacity: 0.9;">NorbiOn Systems v1.0</small>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <button id="tw-load-settings" style="
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 10px;
                        background: #10b981;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: all 0.3s;
                    ">
                        🚀 Load Default Settings
                    </button>
                    
                    <button id="tw-backup-settings" style="
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 10px;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: all 0.3s;
                    ">
                        💾 Backup Current Settings
                    </button>
                    
                    <button id="tw-export-settings" style="
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 10px;
                        background: #f59e0b;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: all 0.3s;
                    ">
                        📤 Export Settings
                    </button>
                    
                    <button id="tw-list-backups" style="
                        width: 100%;
                        padding: 12px;
                        background: #8b5cf6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: all 0.3s;
                    ">
                        📋 List Backups
                    </button>
                </div>
                
                <div id="tw-loader-status" style="
                    background: rgba(0,0,0,0.2);
                    padding: 10px;
                    border-radius: 8px;
                    min-height: 60px;
                    font-size: 13px;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <span style="opacity: 0.8;">Ready to load settings! 🎮</span>
                </div>
                
                <button id="tw-close-loader" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    font-size: 18px;
                    line-height: 1;
                ">×</button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', uiHTML);

        // Add hover effects
        const buttons = document.querySelectorAll('#tw-settings-loader button');
        buttons.forEach(btn => {
            if (btn.id !== 'tw-close-loader') {
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
                });
                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'none';
                });
            }
        });

        // Attach event listeners
        attachEventListeners();
    }

    function attachEventListeners() {
        const statusDiv = document.getElementById('tw-loader-status');

        // Load settings button
        document.getElementById('tw-load-settings').addEventListener('click', function() {
            if (confirm('⚠️ This will overwrite your current settings!\n\n💡 Tip: Click "Backup Current Settings" first!\n\nContinue?')) {
                statusDiv.innerHTML = '<span>🔄 Loading settings...</span>';
                
                setTimeout(() => {
                    const result = loadDefaultSettings();
                    statusDiv.innerHTML = `
                        <div style="text-align: left;">
                            <div style="font-weight: bold; margin-bottom: 5px;">✅ Settings Loaded!</div>
                            <div style="font-size: 12px;">
                                • Loaded: ${result.loaded}<br>
                                • Errors: ${result.errors}<br>
                                <span style="color: #fbbf24;">⚠️ Refresh page to apply!</span>
                            </div>
                        </div>
                    `;
                    
                    setTimeout(() => {
                        if (confirm('Settings loaded! Refresh page now?')) {
                            location.reload();
                        }
                    }, 2000);
                }, 100);
            }
        });

        // Backup button
        document.getElementById('tw-backup-settings').addEventListener('click', function() {
            statusDiv.innerHTML = '<span>💾 Creating backup...</span>';
            
            setTimeout(() => {
                const backupKey = backupCurrentSettings();
                if (backupKey) {
                    statusDiv.innerHTML = `
                        <div style="text-align: left; font-size: 12px;">
                            <div style="font-weight: bold; margin-bottom: 5px;">✅ Backup Created!</div>
                            <div style="opacity: 0.9;">
                                Saved as:<br>
                                <code style="font-size: 10px;">${backupKey}</code>
                            </div>
                        </div>
                    `;
                } else {
                    statusDiv.innerHTML = '<span>❌ Backup failed!</span>';
                }
            }, 100);
        });

        // Export button
        document.getElementById('tw-export-settings').addEventListener('click', function() {
            statusDiv.innerHTML = '<span>📤 Exporting...</span>';
            
            setTimeout(() => {
                exportCurrentSettings();
                statusDiv.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-weight: bold; margin-bottom: 5px;">✅ Exported!</div>
                        <div style="font-size: 12px;">
                            Check console (F12)<br>
                            Settings copied to clipboard!
                        </div>
                    </div>
                `;
            }, 100);
        });

        // List backups button
        document.getElementById('tw-list-backups').addEventListener('click', function() {
            const backups = listBackups();
            
            if (backups.length === 0) {
                statusDiv.innerHTML = '<span>ℹ️ No backups found</span>';
            } else {
                const backupList = backups.map((b, i) => 
                    `<div style="font-size: 11px; margin: 3px 0;">${i + 1}. ${b.dateString}</div>`
                ).join('');
                
                statusDiv.innerHTML = `
                    <div style="text-align: left; max-height: 150px; overflow-y: auto; width: 100%;">
                        <div style="font-weight: bold; margin-bottom: 5px;">📋 Backups:</div>
                        ${backupList}
                        <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                            Check console for restore commands
                        </div>
                    </div>
                `;
            }
        });

        // Close button
        document.getElementById('tw-close-loader').addEventListener('click', function() {
            document.getElementById('tw-settings-loader').remove();
        });

        // Make draggable
        makeDraggable(document.getElementById('tw-settings-loader'));
    }

    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (e.target.tagName === 'BUTTON') return;
            
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.right = "auto";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    console.log('🎮 Tribal Wars Settings Loader v1.0.0');
    console.log('');
    console.log('📋 Available Commands:');
    console.log('  • loadDefaultSettings() - Load default settings');
    console.log('  • backupCurrentSettings() - Create backup');
    console.log('  • exportCurrentSettings() - Export to console');
    console.log('  • listBackups() - Show all backups');
    console.log('  • restoreFromBackup(key) - Restore from backup');
    console.log('');

    // Create UI
    createUI();

    // Expose functions globally for console access
    window.TWSettings = {
        load: loadDefaultSettings,
        backup: backupCurrentSettings,
        export: exportCurrentSettings,
        listBackups: listBackups,
        restore: restoreFromBackup
    };

    console.log('✅ Settings Loader ready! Look for the UI in the top-right corner!');

})();
