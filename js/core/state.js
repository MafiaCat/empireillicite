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
    propertyVault: savedState.propertyVault || 0,
    boosts: savedState.boosts || { doubleYieldUntil: 0 },
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
    state.lastSavedAt = Date.now(); // Track save time for offline progression
    localStorage.setItem('illicit-empire', JSON.stringify(state));
}

// ============================================
// OFFLINE PROGRESSION CATCH-UP
// ============================================
function applyOfflineProgression() {
    const lastSaved = savedState.lastSavedAt;
    if (!lastSaved) return;

    const now = Date.now();
    const elapsedMs = now - lastSaved;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    // Only apply if offline > 1 minute, cap at 7 days to avoid exploit
    if (elapsedHours < (1 / 60)) return;
    const cappedHours = Math.min(elapsedHours, 168); // 7 days max

    // Calculate weekly income from all owned properties & businesses
    let weeklyIncome = 0;
    if (typeof purchasableAssets !== 'undefined') {
        purchasableAssets.forEach(asset => {
            if (['rental', 'business', 'real-estate'].includes(asset.type) && asset.income) {
                const legacyCount = ((state.businesses || {})[asset.id]) || ((state.realEstate || {})[asset.id]) || 0;
                const modernCount = (state.assets && state.assets[asset.id]) ? (state.assets[asset.id].count || 0) : 0;
                const count = Math.max(legacyCount, modernCount);
                if (count > 0) weeklyIncome += asset.income * count;
            }
        });
    }

    // ==========================================
    // SEED PRODUCTION SIMULATION
    // ==========================================
    const building = state.activeBuilding;
    let harvestedGrams = 0;

    if (building && typeof PRODUCTION_PATH !== 'undefined' && typeof calculateMaxStock !== 'undefined') {
        const config = PRODUCTION_PATH[state.productionLevel];
        const capacity = config ? config.cap : 0;
        const maxStock = calculateMaxStock();

        const botanists = building.botanists || 0;
        const lamps = building.lamps || 0;

        // Only run simulation if we have capacity and (botanists OR stuff already in queue/growing)
        if (capacity > 0 && (botanists > 0 || building.plantingQueue > 0 || building.growing > 0 || building.mature > 0)) {

            let simSeconds = cappedHours * 3600;
            const dt = 1; // Simulate in 1-second ticks for accuracy

            const plantRate = 0.2 * (1 + botanists);
            const growRate = (1 / 10) * (1 + lamps * 0.2); // Base growth is 10 sec
            const harvestRate = 0.2 * (1 + botanists);

            while (simSeconds > 0) {
                // Determine bottlenecks to fast-forward if possible
                // For simplicity, we step 1 second at a time if stock isn't full
                if (state.stockGrams >= maxStock && building.mature > 0) break; // Stock full, can't harvest

                // 1. Planting
                if (botanists > 0) {
                    // Auto-add to queue if we have seeds
                    const spaceFree = capacity - ((building.plants || 0) + (building.growing || 0) + (building.mature || 0) + (building.plantingQueue || 0));
                    if (spaceFree > 0 && state.seeds > 0) {
                        const toPlant = Math.min(spaceFree, state.seeds);
                        building.plantingQueue = (building.plantingQueue || 0) + toPlant;
                        state.seeds -= toPlant;
                    }
                }

                if (building.plantingQueue > 0) {
                    const currentTotal = (building.plants || 0) + (building.growing || 0) + (building.mature || 0);
                    if (currentTotal < capacity) {
                        building.plantingAcc = (building.plantingAcc || 0) + plantRate;
                        while (building.plantingAcc >= 1 && building.plantingQueue > 0 && ((building.plants || 0) + (building.growing || 0) + (building.mature || 0) < capacity)) {
                            building.plantingQueue--;
                            building.growing = (building.growing || 0) + 1;
                            building.plantingAcc -= 1;
                        }
                    }
                }

                // 2. Growing
                if (building.growing > 0) {
                    const totalGrowAcc = building.growing * growRate;
                    building.growingAcc = (building.growingAcc || 0) + totalGrowAcc;
                    while (building.growingAcc >= 1 && building.growing > 0) {
                        building.growing--;
                        building.mature = (building.mature || 0) + 1;
                        building.growingAcc -= 1;
                    }
                }

                // 3. Harvesting
                if (building.mature > 0 && botanists > 0) {
                    if (state.stockGrams + 10 <= maxStock) {
                        building.harvestAcc = (building.harvestAcc || 0) + harvestRate;
                        while (building.harvestAcc >= 1 && building.mature > 0 && state.stockGrams + 10 <= maxStock) {
                            building.mature--;
                            state.stockGrams += 10;
                            harvestedGrams += 10;
                            // Update track stats
                            state.totalProduction = (state.totalProduction || 0) + 10;
                            building.harvestAcc -= 1;
                        }
                    }
                }

                // If nothing is queued, growing, or mature AND botanists didn't add seeds, we can abort the simulation to save CPU
                if (building.plantingQueue === 0 && building.growing === 0 && (building.mature === 0 || state.stockGrams >= maxStock) && (state.seeds === 0 || botanists === 0)) {
                    break;
                }

                simSeconds -= dt;
            }
        }
    }

    if (earned > 0 || harvestedGrams > 0) {
        state.propertyVault = (state.propertyVault || 0) + earned;
        const hours = Math.floor(cappedHours);
        const mins = Math.round((cappedHours - hours) * 60);
        const timeStr = hours > 0 ? `${hours}h${mins > 0 ? mins + 'm' : ''}` : `${mins}min`;

        let msg = `En ${timeStr}, vous avez accumulé:<br/>`;
        if (earned > 0) msg += `💵 <b>+${typeof fmtCash === 'function' ? fmtCash(earned) : earned}$</b> dans les coffres<br/>`;
        if (harvestedGrams > 0) msg += `📦 <b>+${typeof fmtMass === 'function' ? fmtMass(harvestedGrams) : harvestedGrams}g</b> de production<br/>`;

        // Delay to ensure UI is ready
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('😴 Retour au jeu', msg, 'success');
            }
            if (typeof updateUI === 'function') updateUI();
        }, 1500);
    }
}

// Run offline catch-up right away (purchasableAssets may not be loaded yet, so also call from game init)
if (typeof purchasableAssets !== 'undefined') {
    applyOfflineProgression();
}
