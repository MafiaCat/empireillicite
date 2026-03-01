const savedState = JSON.parse(localStorage.getItem('illicit-empire')) || {};
const state = {
    cash: savedState.cash || 100,
    lastFinanceUpdate: 0, // NEW: Throttling for finance
    seeds: savedState.seeds || 0,
    plants: savedState.plants || 0,
    stockGrams: savedState.stockGrams || 0,
    dealerCount: savedState.dealerCount || 0,
    weaponLevel: savedState.weaponLevel || 0,
    passiveIncome: savedState.passiveIncome || 0,
    // NOUVEAU SYSTÈME DE PROGRESSION
    productionLevel: savedState.productionLevel || 0,
    unlockedTerritories: savedState.unlockedTerritories || [],
    collectedTrophies: savedState.collectedTrophies || [],
    // --- NEW FEATURES PORT ---
    diamonds: savedState.diamonds || 50,
    chests: savedState.chests || 0,
    lab: savedState.lab || { yieldLevel: 0, spaceLevel: 0, speedLevel: 0, qualityLevel: 0 },
    quests: savedState.quests || { date: '', list: [] },
    bank: savedState.bank || 0,
    boosts: savedState.boosts || { doubleYieldUntil: 0 },
    specialRequest: savedState.specialRequest || { active: false },
    delivery: savedState.delivery || { active: false },
    // -------------------------
    activeBuilding: savedState.activeBuilding || {
        plants: 0,
        growing: 0,
        mature: 0,
        plantingQueue: 0,
        botanists: 0,
        lamps: 0
    },
    calendar: savedState.calendar || { day: 0, week: 1, time: 0, dayName: 'Lundi' },
    fleet: savedState.fleet || { dealer_pied: { count: 1 }, car: { count: 0 }, pickup: { count: 0 }, van: { count: 0 }, truck: { count: 0 }, plane: { count: 0 } },
    financialReport: savedState.financialReport || {
        currentWeek: { revenue: 0, expenses: 0 },
        lastWeek: { revenue: 0, expenses: 0 },
        currentDay: { revenue: 0, expenses: 0 },
        yesterday: { revenue: 0, expenses: 0 },
        lifetime: savedState.financialReport?.lifetime || { revenue: 0, expenses: 0 }
    },
    army: savedState.army || { sbire: 0, soldat: 0, veteran: 0, elite: 0 }, // NEW: Army
    uiStats: savedState.uiStats || { maxSalesPerSecond: 0, dealerSpeedPerSecond: 0, effectiveSellRate: 0 },
    assets: savedState.assets || {},
    plantLimit: savedState.plantLimit || 50,
    playerName: savedState.playerName || '',
    crypto: savedState.crypto || { btc: 0, eth: 0, doge: 0 },
    stocks: savedState.stocks || { tech: 0, pharma: 0, energy: 0 }, // NEW: Stocks
    cryptoAvgPrice: savedState.cryptoAvgPrice || { btc: 0, eth: 0, doge: 0 }, // NEW: Prix moyen d'achat crypto
    stocksAvgPrice: savedState.stocksAvgPrice || { tech: 0, pharma: 0, energy: 0 }, // NEW: Prix moyen d'achat stocks
    warehouses: savedState.warehouses || { small: 0, medium: 0, large: 0, mega: 0 }, // NEW: Entrepôts
    baseStorage: 100, // NEW: Stockage de base minimum (100g)
    totalProduction: savedState.totalProduction || 0, // NEW: Suivi production totale
    jobCooldownEnd: savedState.jobCooldownEnd || 0,
    propertyProgress: savedState.propertyProgress || {},
    plantingQueues: savedState.plantingQueues || {},
    dailyTransportUsed: savedState.dailyTransportUsed || 0,
    maxStock: savedState.maxStock || 100,  // NOUVEAU: Capacité de stockage (Base = Poches)
    achievements: savedState.achievements || { unlocked: [], points: 0, level: 1 }, // SYSTEME SUCCES
    inventory: savedState.inventory || { /* default items */ } // NOUVEAU: INVENTAIRE
};
const cryptoPrices = JSON.parse(localStorage.getItem('crypto-prices')) || {
    btc: 10000,
    eth: 1000,
    doge: 0.1
};
const cryptoHistory = JSON.parse(localStorage.getItem('crypto-history')) || {
    btc: Array(2000).fill(10000),
    eth: Array(2000).fill(1000),
    doge: Array(2000).fill(0.1)
};

// NEW: Stock Prices and History
const stockPrices = JSON.parse(localStorage.getItem('stock-prices')) || {
    tech: 100,
    pharma: 50,
    energy: 200
};
const stockHistory = JSON.parse(localStorage.getItem('stock-prices')) || {
    tech: Array(2000).fill(100),
    pharma: Array(2000).fill(50),
    energy: Array(2000).fill(200)
};
let marketPrice = 2.00;
function calculateMaxStock() {
    let total = state.baseStorage; // 100g de base

    // Stockage des entrepôts
    let warehouseStorage = 0;
    Object.keys(state.warehouses || {}).forEach(type => {
        warehouseStorage += state.warehouses[type] * WAREHOUSES[type].capacity;
    });

    // Stockage des lieux de production (Bonus basé sur le niveau)
    let productionStorage = (state.productionLevel || 0) * 50;

    total += warehouseStorage + productionStorage;

    // Stocker le breakdown pour affichage
    state.storageBreakdown = {
        base: state.baseStorage,
        warehouses: warehouseStorage,
        production: productionStorage,
        total: total
    };

    return total;
}
if (!state.assets.studio) {
    state.assets.studio = { owned: true, plants: 0, limit: 50, botanists: 0, lamps: 0, growing: 0, mature: 0, storage: 50 }; // +50g stockage intégré
}
if (!state.propertyProgress.studio) {
    state.propertyProgress.studio = {
        planting: 0,
        growing: 0,
        plantingActive: false,
        growingActive: false,
        plantingStart: 0,
        growingStart: 0,
        harvesting: 0,
        harvestProgress: 0,
        harvestingActive: false,
        harvestingStart: 0
    };
}
if (!state.plantingQueues.studio) {
    state.plantingQueues.studio = 0;
}

purchasableAssets.filter(a => a.type === 'plantLimit').forEach(asset => {
    if (state.assets[asset.id] && !state.assets[asset.id].botanists) {
        state.assets[asset.id].plants = state.assets[asset.id].plants || 0;
        state.assets[asset.id].limit = asset.bonus;
        state.assets[asset.id].botanists = 0;
        state.assets[asset.id].lamps = 0;
        state.assets[asset.id].growing = 0;
        state.assets[asset.id].mature = 0;
    }
    if (state.assets[asset.id] && !state.propertyProgress[asset.id]) {
        state.propertyProgress[asset.id] = {
            planting: 0,
            growing: 0,
            plantingActive: false,
            growingActive: false,
            plantingStart: 0,
            growingStart: 0,
            harvesting: 0,
            harvestProgress: 0,
            harvestingActive: false,
            harvestingStart: 0
        };
    }
    if (state.assets[asset.id] && !state.plantingQueues[asset.id]) {
        state.plantingQueues[asset.id] = 0;
    }
});

// Retro-compatibility: Give starting dealer_pied if missing
if (!state.fleet) {
    state.fleet = { dealer_pied: { count: 1 }, car: { count: 0 }, pickup: { count: 0 }, van: { count: 0 }, truck: { count: 0 }, plane: { count: 0 } };
} else if (!state.fleet.dealer_pied) {
    state.fleet.dealer_pied = { count: 1 };
}

let chartInstances = {};
function saveGame() {
    localStorage.setItem('illicit-empire', JSON.stringify(state));
}
