DSUtil = {
    mineBaseProd: 1,
    speed: 1.6,
    buildConf: null,
    bonusProd: 1,
    // 1.2 for 20% more
    datalvl: false,
    checklvl(lvl, type) {
        return parseInt(lvl != null ? lvl : type && this.datalvl ? game_data.village.buildings[type] : null)
    },

    getStorage(lvl) {
        let storage_values = [813, 1000, 1229, 1512, 1859, 2285, 2810, 3454, 4247, 5222, 6420, 7893, 9705, 11932, 14670, 18037, 22177, 27266, 33523, 41217, 50675, 62305, 76604, 94184, 115798, 142373, 175047, 215219, 264611, 325337, 400000]
        return storage_values[this.checklvl(lvl, 'storage')]
        //return Math.round(1000 * Math.pow(1.2294934, this.checklvl(lvl, 'storage') - 1))
    },
    getFarm(lvl) {
        let farm_values = [205, 240, 281, 330, 386, 453, 531, 622, 729, 855, 1002, 1175, 1377, 1614, 1891, 2217, 2598, 3046, 3570, 4184, 4904, 5748, 6737, 7897, 9256, 10849, 12716, 14904, 17470, 20476, 24000]
        return farm_values[this.checklvl(lvl, 'farm')]
        //return Math.round(240 * Math.pow(1.17210245334, this.checklvl(lvl, 'farm') - 1))
    },

    getMarket(lvl) {
        let marketTradesmen = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 19, 26, 35, 46, 59, 74, 91, 110, 131, 154, 179, 206, 235]
        return marketTradesmen[this.checklvl(lvl, 'market')]
    },
    getResProduction(lvl, type) {
        //return Math.round(parseFloat(this.mineBaseProd * 30) * parseFloat(this.speed) * Math.pow(1.163118, (this.checklvl(lvl, 'type') - 1)) * (type && game_data.village.bonus != null && game_data.village.bonus[type] != null && this.bonusProd == null ? game_data.village.bonus[type] : this.bonusProd != null ? this.bonusProd : 1))
        return Math.round(parseFloat(this.mineBaseProd * 30) * parseFloat(this.speed) * Math.pow(1.163118, (this.checklvl(lvl, 'type') - 1)) * (this.bonusProd != null ? this.bonusProd : 1))
    },
    hqFactor(lvl) {
        return Math.pow(1.05, (-this.checklvl(lvl, 'main')))
    },
    buildCost(building, lvl, res) {
        if (res == null || typeof res == 'undefined') {
            return [this.buildCost(building, lvl, 'wood'), this.buildCost(building, lvl, 'stone'), this.buildCost(building, lvl, 'iron')]
        }
        return Math.round((this.buildConf[building][res]) * (Math.pow(this.buildConf[building][res + '_factor'], (parseInt(lvl) - 1))))
    },
    buildCostSum(building, lvl) {
        return this.buildCost(building, lvl, 'wood') + this.buildCost(building, lvl, 'stone') + this.buildCost(building, lvl, 'iron')
    },
    buildTime(building, lvl, hqlvl) {
        let min_times = [0.076531875, 0.008575, 0.1611688357125, 0.49997092217822, 0.95648692484371, 1.507915906133, 2.1583894342689, 2.9234350042923, 3.8258560762261, 4.8929653630626, 6.1578892138254, 7.6590657112219, 9.4433064708667, 11.564692858728, 14.087747339219, 17.087827532738, 20.656815089182, 24.899818499248, 29.943903177098, 35.937391973395, 43.057125537371, 51.513283593952, 61.553558650789, 73.469813455449, 87.609924818161, 104.38073172038, 124.27318094664, 147.85747137631, 175.8153675657, 208.94719428012]
        let build_time = this.buildConf[building]['build_time'] / this.speed
        let hq_factor = this.hqFactor(hqlvl)
        let calculated_time = hq_factor * build_time * (min_times[lvl - 1])
        return Math.round(calculated_time)
    },
    //unfinisched
    buidlTimeCostache(build_time, building_level, hq_level) {
        let constantLvl={
    1:1,
    2:1,
    3:0.112292,
    4:0.289555,
    5:0.46113,
    6:0.606372,
    7:0.723059,
    8:0.815935,
    9:0.889947,
    10:0.948408,
    11:0.994718,
    12:1.031,
    13:1.059231,
    14:1.080939,
    15:1.09729,
    16:1.109156,
    17:1.117308,
    18:1.122392,
    19:1.124817,
    20:1.124917,
    21:1.123181,
    22:1.119778,
    23:1.114984,
    24:1.109038,
    25:1.102077,
    26:1.0942,
    27:1.085601,
    28:1.076369,
    29:1.066566,
    30:1.056291,
}


        let buildTime = build_time * Math.pow(1.2, (building_level -1)) * Math.pow(1.05, -hq_level) * constantLvl[building_level]
return buildTime
    }
    convertSecToTimeString(sec) {
        let time = ''
        let hours = Math.floor(sec / 3600)
        let mins = Math.floor((sec - 3600 * hours) / 60)
        let secs = Math.floor((sec - 3600 * hours - 60 * mins))
        time += hours + ":"
        time += mins < 10 ? "0" + mins : mins
        time += ":"
        time += secs < 10 ? "0" + secs : secs
        return time
    },
    convertTimeStringToSec(time) {
        var time_array = time.split(':')
        var sec = 0
        time_array.forEach((e,i,array)=>{
            sec += parseInt(e) * Math.pow(60, array.length - i - 1)
        }
        )
        return sec
    },
    popUsed(buildingType, level) {
        let building = this.buildConf[buildingType]
        level = parseInt(level)
        if (typeof building === 'undefined' || level === 0) {
            return 0;
        }
        return Math.round(building.pop * building.pop_factor ** (parseInt(level) - 1));
    },
    popUsedVillage(buildings) {
        let sum = 0
        for (let building of Object.keys(buildings)) {
            sum += this.popUsed(building, buildings[building])
        }
        return sum;
    },
    pointsVillage(buildings) {
        let sum = 0
        for (let building of Object.keys(buildings)) {
            let index = parseInt(buildings[building]) - 1
            if (index >= 0) {
                sum += this.buildingPoints[building].slice(0, index + 1).reduce((a,b)=>a + b)
            }
        }
        return sum;
    },
    getBuildingObj(type, lvl, hqlvl) {
        let building = {
            id: type + '|' + (parseInt(lvl)) + '|' + hqlvl,
            name: type,
            wood: DSUtil.buildCost(type, lvl, "wood"),
            stone: DSUtil.buildCost(type, lvl, "stone"),
            iron: DSUtil.buildCost(type, lvl, "iron"),
            sumCost: 0,
            time: DSUtil.buildTime(type, lvl, hqlvl),
            lvl: lvl,
            hqlvl: hqlvl,
            timePassed: 0,
            timesReduced: 0,
            cheap: false,
            pop: DSUtil.popUsed(type, lvl) - DSUtil.popUsed(type, lvl - 1),
            cWood: 0,
            cStone: 0,
            cIron: 0,
            cCost: 0,
        }
        building.sumCost = (building.wood + building.stone + building.iron)
        building.cWood = Math.round(building.wood * 0.8)
        building.cStone = Math.round(building.stone * 0.8)
        building.cIron = Math.round(building.iron * 0.8)
        building.cCost = (building.cWood + building.cStone + building.cIron)

        //simVillage dependent Calculations
        building.isEnough = simVillage.wood >= building.wood && simVillage.stone >= building.stone && simVillage.iron >= building.iron
        building.isCEnough = simVillage.wood >= building.cWood && simVillage.stone >= building.cStone && simVillage.iron >= building.cIron
        building.isPop = simVillage.pop_max() >= building.pop + simVillage.pop()
        building.isStorage = simVillage.storage_max()>=Math.max(building.wood,building.stone,building.iron)
        building.isCStorage = simVillage.storage_max()>=Math.max(building.cWood,building.cStone,building.cIron)

        return building
    },
    buildingReqirementsMet(buildings, type) {
        switch (type) {
        case "barracks":
            return (buildings["main"] >= 3)
        case "stable":
            return (buildings["main"] >= 10 && buildings["barracks"] >= 5 && buildings["smith"] >= 5)
        case "garage":
            return (buildings["main"] >= 10 && buildings["smith"] >= 10)
        case "snob":
            return (buildings["main"] >= 20 && buildings["market"] >= 10 && buildings["smith"] >= 20)
        case "smith":
            return (buildings["main"] >= 5 && buildings["barracks"] >= 1)
        case "market":
            return (buildings["main"] >= 3 && buildings["storage"] >= 2)
        case "wall":
            return (buildings["barracks"] >= 1)
        case "main":
        case "wood":
        case "stone":
        case "iron":
        case "farm":
        case "storage":
        case "hide":
        default:
            return true
        }
    },
    buildingPoints: {
        'main': [10, 2, 2, 3, 4, 4, 5, 6, 7, 9, 10, 12, 15, 18, 21, 26, 31, 37, 44, 53, 64, 77, 92, 110, 133, 159, 191, 229, 274, 330],
        'barracks': [16, 3, 4, 5, 5, 7, 8, 9, 12, 14, 16, 20, 24, 28, 34, 42, 49, 59, 71, 85, 102, 123, 147, 177, 212],
        'stable': [20, 4, 5, 6, 6, 9, 10, 12, 14, 17, 21, 25, 29, 36, 43, 51, 62, 74, 88, 107],
        'garage': [24, 5, 6, 6, 9, 10, 12, 14, 17, 21, 25, 29, 36, 43, 51],
        'church': [10, 2, 2],
        'church_f': [10],
        'snob': [512, 102, 123],
        'smith': [19, 4, 4, 6, 6, 8, 10, 11, 14, 16, 20, 23, 28, 34, 41, 49, 58, 71, 84, 101],
        'place': [0],
        'statue': [24],
        'market': [10, 2, 2, 3, 4, 4, 5, 6, 7, 9, 10, 12, 15, 18, 21, 26, 31, 37, 44, 53, 64, 77, 92, 110, 133, 159, 191, 229, 274, 330],
        'wood': [6, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165, 198],
        'stone': [6, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165, 198],
        'iron': [6, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165, 198],
        'farm': [5, 1, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165],
        'storage': [6, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165, 198],
        'hide': [5, 1, 1, 2, 1, 2, 3, 3, 3, 5],
        'wall': [8, 2, 2, 2, 3, 3, 4, 5, 5, 7, 9, 9, 12, 15, 17, 20, 25, 29, 36, 43],
        'watchtower': [42, 8, 10, 13, 14, 18, 20, 25, 31, 36, 43, 52, 62, 75, 90, 108, 130, 155, 186, 224]
    },
    buildConf: {
        "main": {
            "max_level": "30",
            "min_level": "1",
            "wood": "90",
            "stone": "80",
            "iron": "70",
            "pop": "5",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "900",
            "build_time_factor": "1.2"
        },
        "barracks": {
            "max_level": "25",
            "min_level": "0",
            "wood": "200",
            "stone": "170",
            "iron": "90",
            "pop": "7",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "1800",
            "build_time_factor": "1.2"
        },
        "stable": {
            "max_level": "20",
            "min_level": "0",
            "wood": "270",
            "stone": "240",
            "iron": "260",
            "pop": "8",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "6000",
            "build_time_factor": "1.2"
        },
        "garage": {
            "max_level": "15",
            "min_level": "0",
            "wood": "300",
            "stone": "240",
            "iron": "260",
            "pop": "8",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "6000",
            "build_time_factor": "1.2"
        },
        "church": {
            "max_level": "3",
            "min_level": "0",
            "wood": "16000",
            "stone": "20000",
            "iron": "5000",
            "pop": "5000",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.55",
            "build_time": "184980",
            "build_time_factor": "1.2"
        },
        "church_f": {
            "max_level": "1",
            "min_level": "0",
            "wood": "160",
            "stone": "200",
            "iron": "50",
            "pop": "5",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.55",
            "build_time": "8160",
            "build_time_factor": "1.2"
        },
        "watchtower": {
            "max_level": "20",
            "min_level": "0",
            "wood": "12000",
            "stone": "14000",
            "iron": "10000",
            "pop": "500",
            "wood_factor": "1.17",
            "stone_factor": "1.17",
            "iron_factor": "1.18",
            "pop_factor": "1.18",
            "build_time": "13200",
            "build_time_factor": "1.2"
        },
        "snob": {
            "max_level": "1",
            "min_level": "0",
            "wood": "15000",
            "stone": "25000",
            "iron": "10000",
            "pop": "80",
            "wood_factor": "2",
            "stone_factor": "2",
            "iron_factor": "2",
            "pop_factor": "1.17",
            "build_time": "586800",
            "build_time_factor": "1.2"
        },
        "smith": {
            "max_level": "20",
            "min_level": "0",
            "wood": "220",
            "stone": "180",
            "iron": "240",
            "pop": "20",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "6000",
            "build_time_factor": "1.2"
        },
        "place": {
            "max_level": "1",
            "min_level": "0",
            "wood": "10",
            "stone": "40",
            "iron": "30",
            "pop": "0",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "10860",
            "build_time_factor": "1.2"
        },
        "statue": {
            "max_level": "1",
            "min_level": "0",
            "wood": "220",
            "stone": "220",
            "iron": "220",
            "pop": "10",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "1500",
            "build_time_factor": "1.2"
        },
        "market": {
            "max_level": "25",
            "min_level": "0",
            "wood": "100",
            "stone": "100",
            "iron": "100",
            "pop": "20",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "2700",
            "build_time_factor": "1.2"
        },
        "wood": {
            "max_level": "30",
            "min_level": "0",
            "wood": "50",
            "stone": "60",
            "iron": "40",
            "pop": "5",
            "wood_factor": "1.25",
            "stone_factor": "1.275",
            "iron_factor": "1.245",
            "pop_factor": "1.155",
            "build_time": "900",
            "build_time_factor": "1.2"
        },
        "stone": {
            "max_level": "30",
            "min_level": "0",
            "wood": "65",
            "stone": "50",
            "iron": "40",
            "pop": "10",
            "wood_factor": "1.27",
            "stone_factor": "1.265",
            "iron_factor": "1.24",
            "pop_factor": "1.14",
            "build_time": "900",
            "build_time_factor": "1.2"
        },
        "iron": {
            "max_level": "30",
            "min_level": "0",
            "wood": "75",
            "stone": "65",
            "iron": "70",
            "pop": "10",
            "wood_factor": "1.252",
            "stone_factor": "1.275",
            "iron_factor": "1.24",
            "pop_factor": "1.17",
            "build_time": "1080",
            "build_time_factor": "1.2"
        },
        "farm": {
            "max_level": "30",
            "min_level": "1",
            "wood": "45",
            "stone": "40",
            "iron": "30",
            "pop": "0",
            "wood_factor": "1.3",
            "stone_factor": "1.32",
            "iron_factor": "1.29",
            "pop_factor": "1",
            "build_time": "1200",
            "build_time_factor": "1.2"
        },
        "storage": {
            "max_level": "30",
            "min_level": "1",
            "wood": "60",
            "stone": "50",
            "iron": "40",
            "pop": "0",
            "wood_factor": "1.265",
            "stone_factor": "1.27",
            "iron_factor": "1.245",
            "pop_factor": "1.15",
            "build_time": "1020",
            "build_time_factor": "1.2"
        },
        "hide": {
            "max_level": "10",
            "min_level": "0",
            "wood": "50",
            "stone": "60",
            "iron": "50",
            "pop": "2",
            "wood_factor": "1.25",
            "stone_factor": "1.25",
            "iron_factor": "1.25",
            "pop_factor": "1.17",
            "build_time": "1800",
            "build_time_factor": "1.2"
        },
        "wall": {
            "max_level": "20",
            "min_level": "0",
            "wood": "50",
            "stone": "100",
            "iron": "20",
            "pop": "5",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "3600",
            "build_time_factor": "1.2"
        }
    }

}