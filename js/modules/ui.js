function updateCalendar() {
    state.calendar.time += 1;
    if (state.calendar.time >= 1200) {
        state.calendar.time = 0;
        state.calendar.day++;
        state.dailyTransportUsed = 0; // RESET QUOTA TRANSPORT
        state.calendar.dayName = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][state.calendar.day % 7];

        // SHIFT DAILY FINANCES
        state.financialReport.yesterday = { ...state.financialReport.currentDay };
        state.financialReport.currentDay = { revenue: 0, expenses: 0 };

        if (state.calendar.day % 7 === 0) {
            state.calendar.week++;
            paySalaries();
            handleWeeklyUpdate();
        }
        updateUI();
    }
}

function paySalaries() {
    let totalSalary = 0;
    for (const [type, data] of Object.entries(state.fleet)) {
        if (data.count > 0 && VEHICLE_STATS[type]) {
            totalSalary += data.count * VEHICLE_STATS[type].salary;
        }
    }

    if (totalSalary > 0) {
        state.cash -= totalSalary;
        trackFinance(totalSalary, 'expenses');
        showNotification('💸 Salaires', `Payé $${fmtInt(totalSalary)} aux employés.`, 'warning');
    }
}

function handleWeeklyUpdate() {
    state.financialReport.lastWeek = { ...state.financialReport.currentWeek };
    state.financialReport.currentWeek = { revenue: 0, expenses: 0 };

    // Gestion Revenus Locatifs & Business
    let totalWeeklyIncome = 0;
    purchasableAssets.forEach(asset => {
        if ((asset.type === 'rental' || asset.type === 'business') && state.assets[asset.id] && state.assets[asset.id].owned) {
            const count = state.assets[asset.id].count || 1;
            totalWeeklyIncome += (asset.income * count);
        }
    });

    if (totalWeeklyIncome > 0) {
        state.cash += totalWeeklyIncome;
        trackFinance(totalWeeklyIncome, 'revenue');
        showNotification('💰 Revenus Hebdo', `Vos biens et entreprises ont rapporté $${fmtCash(totalWeeklyIncome)}`, 'success');
    }

    showNotification('📅 Nouvelle Semaine', `Semaine ${state.calendar.week} commence.`, 'info');
}
const notificationQueue = [];
let isNotificationShowing = false;

function showNotification(title, message, type = 'success') {
    notificationQueue.push({ title, message, type });
    processNotificationQueue();
}

function processNotificationQueue() {
    if (isNotificationShowing || notificationQueue.length === 0) return;

    const { title, message, type } = notificationQueue[0];
    isNotificationShowing = true;

    let container = document.getElementById('gameNotificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'gameNotificationContainer';
        document.body.appendChild(container);
    }

    // Style conteneur (fixe en haut à droite)
    container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none;";

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Styles
    let borderColor = '#10b981';
    let bgColor = 'white';
    if (type === 'error') borderColor = '#ef4444';
    else if (type === 'warning') borderColor = '#f59e0b';
    else if (type === 'info') borderColor = '#3b82f6';
    else if (type === 'achievement') { borderColor = '#8b5cf6'; bgColor = '#fdf4ff'; }
    else if (type === 'levelup') { borderColor = '#fbbf24'; bgColor = '#fffbeb'; }

    notification.style.cssText = `
                    pointer-events: auto; 
                    min-width: 300px; 
                    background: ${bgColor}; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
                    padding: 15px; 
                    border-left: 5px solid ${borderColor}; 
                    opacity: 0; 
                    transform: translateX(50px); 
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    font-family: inherit;
                    margin-bottom: 10px;
                `;

    notification.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 700; color: #1f2937;">${title}</h4>
                        <span class="close-btn" style="cursor: pointer; color: #9ca3af; font-size: 18px; line-height: 1;">&times;</span>
                    </div>
                    <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.4;">${message}</p>
                `;

    // Logique de fermeture
    const close = () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(50px)';
        setTimeout(() => {
            notification.remove();
            notificationQueue.shift(); // Retirer de la file
            isNotificationShowing = false;
            setTimeout(processNotificationQueue, 200); // Delai avant la suivante
        }, 300);
    };

    container.appendChild(notification);

    // Events
    notification.querySelector('.close-btn').onclick = () => {
        if (notification.timeout) clearTimeout(notification.timeout);
        close();
    };

    // Animation In
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });

    // Auto Remove
    notification.timeout = setTimeout(close, 4000);
}

function applyTheme() {
    if (state.theme === 'light') {
        document.body.classList.add('light-mode');
        if (document.getElementById('themeToggleBtn')) document.getElementById('themeToggleBtn').textContent = '🌙 Mode Sombre';
    } else {
        document.body.classList.remove('light-mode');
        if (document.getElementById('themeToggleBtn')) document.getElementById('themeToggleBtn').textContent = '☀️ Mode Clair';
    }
}
// --- NAVIGATION TABS ---

window.switchTab = function (tabId) {
    // Hide all panels
    const panels = document.querySelectorAll('.panel');
    panels.forEach(p => {
        p.classList.remove('active');
        // Mobile panels use display:none usually via CSS .panel:not(.active)
        // But let's be safe
    });

    // Deactivate all nav items
    document.querySelectorAll('.nav .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.bottom-nav .nav-item').forEach(t => t.classList.remove('active'));

    // Show target panel
    const panel = document.getElementById(tabId);
    if (panel) {
        panel.classList.add('active');
    }

    // Activate Desktop Tab
    const dTab = document.querySelector(`.nav .tab[data-tab="${tabId}"]`);
    if (dTab) dTab.classList.add('active');

    // Activate Mobile Tab
    const mTabs = document.querySelectorAll(`.bottom-nav .nav-item`);
    mTabs.forEach(t => {
        const onclick = t.getAttribute('onclick');
        if (onclick && onclick.includes(`'${tabId}'`)) {
            t.classList.add('active');
        }
    });

    // --- TRIGGER RENDERS ---
    if (tabId === 'finance' && typeof renderInvest === 'function') renderInvest();
    if (tabId === 'business' && typeof renderInvest === 'function') renderInvest();
    if (tabId === 'assets' && typeof renderLuxury === 'function') renderLuxury();
    if (tabId === 'territories' && typeof renderTerritories === 'function') renderTerritories();

    // Profil / Achievements
    if (tabId === 'profil') {
        if (typeof state !== 'undefined') {
            if (document.getElementById('heroCash')) document.getElementById('heroCash').textContent = fmtCash(state.cash);
            if (document.getElementById('heroScore')) document.getElementById('heroScore').textContent = fmtInt(state.achievements?.points || 0);
        }
    }
};


const updateUI = function () {
    window.updateDashboard = updateUI;

    // Initialize/Check Quests
    if (typeof checkDailyQuests === 'function') checkDailyQuests();
    if (typeof renderQuests === 'function') renderQuests(); // Added: Ensure quests are rendered


    // --- NEW DIAMOND UPDATE ---
    const diamondEl = document.getElementById('diamondAmount');
    if (diamondEl) diamondEl.textContent = state.diamonds !== undefined ? state.diamonds : 0;

    // Top bar diamond display
    const topDiamondEl = document.getElementById('topDiamondDisplay');
    if (topDiamondEl) topDiamondEl.textContent = state.diamonds !== undefined ? state.diamonds : 0;
    // --------------------------

    // Calculate Level Progress first
    const currentPts = state.achievements?.points || 0;
    const xpInLevel = currentPts % 100;
    const levelProgress = (xpInLevel / 100) * 100;
    const xpNeeded = 100 - xpInLevel;

    // --- Initial renders and syncs ---
    updateFleetUI();

    // HERO STATS
    const nextLevelXP = 100 * ((state.achievements?.level || 1) + 1);
    if (document.getElementById('heroLevel')) document.getElementById('heroLevel').textContent = state.achievements?.level || 1;
    if (document.getElementById('heroXpCurrent')) document.getElementById('heroXpCurrent').textContent = Math.floor(state.achievements?.points || 0);
    if (document.getElementById('heroXpFill')) document.getElementById('heroXpFill').style.width = Math.min(100, ((state.achievements?.points || 0) % 100)) + '%';
    if (document.getElementById('heroTitle')) document.getElementById('heroTitle').textContent = getTypeForLevel(state.achievements?.level || 1); // Use helper if available, or just level title

    if (document.getElementById('heroCash')) document.getElementById('heroCash').textContent = fmtCash(state.cash);
    if (document.getElementById('heroScore')) document.getElementById('heroScore').textContent = fmtInt(state.achievements?.points || 0);
    if (document.getElementById('heroTerritories')) document.getElementById('heroTerritories').textContent = state.territories?.length || 0;

    // CHEST UI
    const chestCard = document.getElementById('chestCard');
    if (chestCard) {
        if (state.chests > 0) {
            chestCard.style.display = 'block';
            const titleEl = document.getElementById('chestTitle');
            if (titleEl) titleEl.textContent = `${state.chests} Coffre${state.chests > 1 ? 's' : ''} Mystère${state.chests > 1 ? 's' : ''} !`;
        } else {
            chestCard.style.display = 'none';
        }
    }

    // NEW: Update Production Tab if active
    if (typeof renderProduction === 'function' && document.getElementById('sub-production') && document.getElementById('sub-production').style.display !== 'none') {
        renderProduction();
    }

    if (document.getElementById('cashDisplay')) document.getElementById('cashDisplay').textContent = fmtCash(state.cash);
    if (document.getElementById('walletAmount')) document.getElementById('walletAmount').textContent = fmtCash(state.cash); // Sync wallet
    if (document.getElementById('stockDisplay')) document.getElementById('stockDisplay').textContent = fmtMass(state.stockGrams);
    if (document.getElementById('dealerCount')) document.getElementById('dealerCount').textContent = state.dealerCount;
    if (document.getElementById('weaponLevel')) document.getElementById('weaponLevel').textContent = state.weaponLevel;
    if (document.getElementById('marketPrice')) document.getElementById('marketPrice').textContent = fmt(marketPrice);

    // Sales Tab - Potential Profit
    if (el('potentialProfit')) {
        const profit = state.stockGrams * marketPrice;
        el('potentialProfit').textContent = fmtCash(profit);
    }

    // Sales Tab - Fleet Summary
    if (el('fleet-stats-summary')) {
        let totalInTransit = 0;
        Object.values(state.fleet).forEach(f => {
            if (f.activeTrips) {
                f.activeTrips.forEach(t => totalInTransit += (t.amount * marketPrice));
            }
        });
        el('fleet-stats-summary').textContent = totalInTransit > 0 ?
            `Revenu en transit: ${fmtCash(totalInTransit)}` :
            "Aucune livraison en cours";
    }

    if (el('playerName')) el('playerName').value = state.playerName;

    if (el('seedCount')) {
        const studio = state.assets.studio;
        const autoActive = (studio && studio.botanists > 0) || Object.values(state.assets).some(a => a.botanists > 0);
        if (state.seeds > 0) {
            el('seedCount').textContent = state.seeds;
            el('seedCount').style.color = '';
        } else {
            el('seedCount').textContent = autoActive ? "0 (Auto)" : "0";
            el('seedCount').style.color = autoActive ? "#4ade80" : "";
        }

        // DYNAMIC MAX SEED PRICE CALCULATION
        const maxAffordableBtn = document.querySelector('#buySeedMax .pcard-buy-price');
        if (maxAffordableBtn) {
            const seedPrice = 10; // Hardcoded default seed price
            const maxAffordable = Math.floor(state.cash / seedPrice);
            if (maxAffordable > 0) {
                maxAffordableBtn.textContent = fmtCash(maxAffordable * seedPrice);
            } else {
                maxAffordableBtn.textContent = '$0';
            }
        }
    }

    if (el('sidebarDayName')) el('sidebarDayName').textContent = state.calendar.dayName || 'Lundi';
    if (el('sidebarDayNum')) el('sidebarDayNum').textContent = `Jour ${state.calendar.day + 1}`;

    const dayProgress = (state.calendar.time / 1200) * 100;
    if (el('sidebarDayProgress')) el('sidebarDayProgress').style.width = `${dayProgress}%`;

    // Dashboard stats
    if (el('dashCash')) el('dashCash').textContent = fmtCash(state.cash);
    if (el('dashPlants')) el('dashPlants').textContent = state.plants;
    if (el('dashStock')) el('dashStock').textContent = fmtMass(state.stockGrams);
    if (el('dashDealers')) el('dashDealers').textContent = state.dealerCount;
    if (el('dashSeeds')) el('dashSeeds').textContent = state.seeds;

    // === MOBILE TOP BAR SYNC ===
    if (el('topCashDisplay')) el('topCashDisplay').textContent = fmtCash(state.cash);
    if (el('topStockDisplay')) el('topStockDisplay').textContent = fmtMass(state.stockGrams);
    if (el('topLevelDisplay')) el('topLevelDisplay').textContent = `Nv.${state.achievements.level}`;
    if (el('topTitleDisplay')) el('topTitleDisplay').textContent = getTitleForLevel(state.achievements.level);

    // Sidebar & Mobile Profile Sync (New Purple Card)
    if (el('mobileProfileLevel')) el('mobileProfileLevel').textContent = state.achievements.level;
    if (el('mobileProfileTitle')) el('mobileProfileTitle').textContent = getTitleForLevel(state.achievements.level);
    if (el('mobileProfileScore')) el('mobileProfileScore').textContent = currentPts;
    if (el('mobileProfileProgressBar')) el('mobileProfileProgressBar').style.width = `${levelProgress}%`;

    if (el('mobileProfileXP')) el('mobileProfileXP').textContent = xpInLevel;
    if (el('mobileProfileNextTarget')) el('mobileProfileNextTarget').textContent = `${xpNeeded} XP`;
    if (el('mobileProfileNextLevel')) el('mobileProfileNextLevel').textContent = state.achievements.level + 1;


    // === DASHBOARD SPECIFIC ELEMENTS ===
    if (document.getElementById('dashboard')) {
        // HERO SECTION
        if (el('heroTitle')) el('heroTitle').textContent = getTitleForLevel(state.achievements.level);
        if (el('heroLevel')) el('heroLevel').textContent = state.achievements.level;
        if (el('heroXpCurrent')) el('heroXpCurrent').textContent = currentPts;
        if (el('heroXpFill')) el('heroXpFill').style.width = `${levelProgress}%`;
        if (el('heroCash')) el('heroCash').textContent = fmtCash(state.cash);
        if (el('heroScore')) el('heroScore').textContent = currentPts;
        if (el('heroTerritories')) el('heroTerritories').textContent = state.unlockedTerritories?.length || 1;

        // Hero Quote
        const quotes = {
            1: '"Votre empire commence ici..."',
            5: '"Les rues reconnaissent votre nom"',
            10: '"Votre influence grandit"',
            20: '"Vous contrôlez le territoire"',
            30: '"Un empire respectable"',
            40: '"Votre légende s\'écrit"',
            50: '"Personne ne vous arrêtera"',
            60: '"Vous êtes une légende vivante"'
        };
        const closestQuote = Object.keys(quotes).reverse().find(l => state.achievements.level >= parseInt(l));
        if (el('heroQuote')) el('heroQuote').textContent = quotes[closestQuote] || quotes[1];

        // QUICK STATS
        if (el('quickCash')) el('quickCash').textContent = fmtCash(state.cash);

        // Production & Fleet
        const building = state.activeBuilding;
        const totalPlants = building ? (building.plants || 0) + (building.growing || 0) + (building.mature || 0) : 0;
        if (el('plantsActive')) el('plantsActive').textContent = totalPlants;
        if (el('productionStatus')) el('productionStatus').textContent = totalPlants > 0 ? 'En cours' : 'Inactif';

        let activeDeliveries = 0;
        if (state.vehicles) {
            Object.values(state.vehicles).forEach(v => {
                if (v.status === 'delivering') activeDeliveries++;
            });
        }
        if (el('fleetActive')) el('fleetActive').textContent = activeDeliveries;
        if (el('fleetStatus')) el('fleetStatus').textContent = activeDeliveries > 0 ? 'Actives' : '—';

        // EMPIRE OVERVIEW
        if (el('activeProperties')) el('activeProperties').textContent = state.activeBuilding ? 1 : 0;

        const maxStock = calculateMaxStock();
        const stockPercent = maxStock > 0 ? Math.min((state.stockGrams / maxStock) * 100, 100) : 0;
        if (el('storageFill')) el('storageFill').style.width = stockPercent + '%';
        if (el('storageUsed')) el('storageUsed').textContent = Math.floor(state.stockGrams);
        if (el('storageMax')) el('storageMax').textContent = maxStock;
        if (el('efficiency')) el('efficiency').textContent = '100%';

        if (el('empireDealers')) el('empireDealers').textContent = state.dealerCount;
        const weaponPowerPercent = Math.min((state.weaponLevel / 10) * 100, 100);
        if (el('weaponPower')) el('weaponPower').style.width = weaponPowerPercent + '%';
        if (el('empireWeapons')) el('empireWeapons').textContent = state.weaponLevel;
        if (el('empireTerritoriesCount')) el('empireTerritoriesCount').textContent = state.unlockedTerritories?.length || 1;

        // Finance
        const revenuePerMin = state.dealerCount * 10 * 60; // Simplified
        if (el('revenuePerMin')) el('revenuePerMin').textContent = fmtCash(revenuePerMin);
        if (el('passiveIncome')) el('passiveIncome').textContent = fmtCash(revenuePerMin * 60 * 24 * 7);

        const weekProfit = (state.financialReport?.currentWeek?.revenue || 0) - (state.financialReport?.currentWeek?.expenses || 0);
        if (el('weeklyProfit')) {
            el('weeklyProfit').textContent = fmtCash(weekProfit);
            el('weeklyProfit').className = 'value ' + (weekProfit >= 0 ? 'success' : 'warning');
        }

        // Portfolio
        let portfolioValue = 0;
        if (state.crypto) {
            Object.keys(state.crypto).forEach(cId => {
                const amount = state.crypto[cId] || 0;
                // Need current price - can't get it easily here without global access? 
                // Prices are global: cryptoPrices
                if (typeof cryptoPrices !== 'undefined' && cryptoPrices[cId]) {
                    portfolioValue += amount * cryptoPrices[cId];
                }
            });
        }
        if (el('portfolioValue')) el('portfolioValue').textContent = fmtCash(portfolioValue);

        // ACHIEVEMENTS SHOWCASE
        const recentAchievements = state.achievements?.unlocked?.slice(-3) || [];
        const achievementsContainer = el('recentAchievements');
        if (achievementsContainer) {
            if (recentAchievements.length > 0) {
                let achievementsHtml = '';
                recentAchievements.forEach(achId => {
                    const ach = ACHIEVEMENTS.find(a => a.id === achId);
                    if (ach) {
                        achievementsHtml += `
                                        <div style="flex: 1; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1)); 
                                            padding: 12px; border-radius: 12px; border: 2px solid #10b981; min-width: 140px;">
                                            <div style="font-size: 20px; margin-bottom: 4px;">✅</div>
                                            <div style="font-size: 12px; font-weight: 700; color: #10b981; margin-bottom: 2px;">${ach.name}</div>
                                            <div style="font-size: 11px; color: #6b7280;">+${ach.points} pts</div>
                                        </div>
                                    `;
                    }
                });
                achievementsContainer.innerHTML = achievementsHtml;
            } else {
                achievementsContainer.innerHTML = '<div class="achievement-placeholder">Aucun succès récent</div>';
            }
        }

        // QUICK ACTIONS BAR
        const quickActionsBar = el('quickActionsBar');
        if (quickActionsBar) {
            let actionsHtml = '';
            // Buttons "Planter" and "Vendre Stock" were removed at user request.
            if (maxStock > 0 && stockPercent > 80) {
                actionsHtml += `<button onclick="switchTab('plantation'); switchSubTab('plantation','sub-stockage')" class="action-btn-blue">📦 Agrandir Stock</button>`;
            }
            quickActionsBar.innerHTML = actionsHtml || '<p style="text-align:center;color:#9ca3af;font-size:13px;">Aucune action rapide</p>';
        }
    }

    // Removed old simple profileTitleDisplay if it existed
    if (el('profileTitleDisplay')) el('profileTitleDisplay').textContent = `Rang : ${getTitleForLevel(state.achievements.level)}`;

    // Simplified Day Name (e.g., "Lundi")
    if (el('topDayName')) el('topDayName').textContent = (state.calendar.dayName || 'Lundi');
    // Remove Week/Day count from header to keep it clean if requested, or keep short "J.5"
    // User asked for "Day Name only" in one part, but "Progress Bar" for day. 
    // Let's keep Day Name.
    if (el('topDayDisplay')) el('topDayDisplay').textContent = state.calendar.dayName || 'Lundi';

    // LEVEL PROGRESS BAR (Green)
    const topLevelBar = el('topLevelBar');
    if (topLevelBar) {
        topLevelBar.style.width = `${levelProgress}%`;
    }

    // DAY PROGRESS BAR (Blue)
    // Day duration is 1200 ticks (2 mins). state.calendar.time goes from 0 to 1200.
    const dayProgressPct = (state.calendar.time / 1200) * 100;
    const topDayBar = el('topDayBar');
    if (topDayBar) {
        topDayBar.style.width = `${dayProgressPct}%`;
    }

    // Mise à jour Bilan Financier Dashboard
    const updateRow = (pfx, data) => {
        const r = data?.revenue || 0;
        const e = data?.expenses || 0;
        const t = r - e;
        if (el('dash' + pfx + 'Sales')) el('dash' + pfx + 'Sales').textContent = fmtCash(r);
        if (el('dash' + pfx + 'Expenses')) el('dash' + pfx + 'Expenses').textContent = fmtCash(e);
        const tEl = el('dash' + pfx + 'Total');
        if (tEl) {
            tEl.textContent = fmtCash(t);
            tEl.style.color = t >= 0 ? 'var(--success)' : 'var(--danger)';
        }
    };

    updateRow('Hier', state.financialReport?.yesterday);
    updateRow('Week', state.financialReport?.currentWeek);
    updateRow('Life', state.financialReport?.lifetime);

    // NEW: Update Owned Properties (Real Estate)
    // Legacy property rendering removed. Handled by invest-render.js renderPropertiesTab().

    // Calcul des totaux
    let totalPlantLimit = 0;
    let totalPlanting = 0;
    let totalGrowing = 0;
    let totalHarvesting = 0;

    const building = state.activeBuilding;
    const config = PRODUCTION_PATH[state.productionLevel];
    const nextConfig = PRODUCTION_PATH[state.productionLevel + 1];

    // Variables for global stats (if used below loop)
    // Sync totals for dashboard
    totalPlantLimit = config ? config.cap : 0;
    totalPlanting = (building.plants || 0) + (building.plantingQueue || 0);
    totalGrowing = building.growing || 0;
    totalHarvesting = building.mature || 0;

    state.plantLimit = totalPlantLimit;
    // el('plantCount').textContent = `${ state.plants } / ${state.plantLimit}`; / / Supprimé
    if (el('plantStockDisplay')) el('plantStockDisplay').textContent = fmtMass(state.stockGrams);
    if (el('totalPlanting')) el('totalPlanting').textContent = totalPlanting;
    if (el('totalGrowing')) el('totalGrowing').textContent = totalGrowing;
    if (el('totalHarvesting')) el('totalHarvesting').textContent = totalHarvesting;

    // Dashboard properties
    const dashPropDiv = el('dashboardProperties');
    if (dashPropDiv) {
        dashPropDiv.innerHTML = '';
        const allProps = ['studio', ...purchasableAssets.filter(a => a.type === 'plantLimit' && state.assets[a.id]).map(a => a.id)];
        allProps.forEach(propId => {
            const prop = state.assets[propId];
            if (!prop) return; // SKIP IF MISSING (Prevents crash)

            const propInfo = purchasableAssets.find(a => a.id === propId) || { name: 'Petit Studio', icon: '🏠' };
            const plantingQueue = state.plantingQueues ? (state.plantingQueues[propId] || 0) : 0; // Safe access

            dashPropDiv.innerHTML += `
                    <div style="padding: 8px; margin: 4px 0; background: var(--bg); border-radius: 8px;">
                        ${propInfo.icon} <strong>${propInfo.name}</strong>:
                        ${prop.mature || 0}/${prop.limit || 0} mûrs,
                        ${prop.growing || 0} en croissance,
                        ${(prop.plants || 0) + plantingQueue} en plantation
                    </div>
                `;
        });
    }

    // Mise à jour des biens disponibles à l'achat
    if (el('plantAssets')) el('plantAssets').innerHTML = '';
    // if (el('carAssets')) el('carAssets').innerHTML = ''; // HANDLED BY COLLECTION-RENDER.JS
    // if (el('artAssets')) el('artAssets').innerHTML = ''; // HANDLED BY COLLECTION-RENDER.JS
    // if (el('jewelryAssets')) el('jewelryAssets').innerHTML = ''; // HANDLED BY COLLECTION-RENDER.JS
    // if (el('ownedShopAssets')) el('ownedShopAssets').innerHTML = ''; // HANDLED BY COLLECTION-RENDER.JS
    // if (el('rentalAssets')) el('rentalAssets').innerHTML = ''; // HANDLED BY INVEST-RENDER.JS
    // if (el('businessAssets')) el('businessAssets').innerHTML = ''; // HANDLED BY INVEST-RENDER.JS
    if (el('storageGrid')) el('storageGrid').innerHTML = ''; // NEW: Clear storage

    purchasableAssets.forEach(asset => {
        try {
            // SKIP NEW INVESTMENT AND COLLECTION TYPES
            if (asset.type === 'rental' || asset.type === 'business' || asset.type === 'car' || asset.type === 'art' || asset.type === 'jewelry') return;

            // Logic for displaying assets in shop
            // NEW: Added 'storage' to isMultiBuy so they always show up (for upgrades)
            const isMultiBuy = ['real-estate', 'storage'].includes(asset.type);
            const isOwned = !!state.assets[asset.id];

            // Show if NOT owned OR if it IS multi-buy compatible
            if (!isOwned || isMultiBuy) {

                // Calculate Dynamic Price
                let currentPrice = asset.price;
                let count = 0;
                if (isOwned && state.assets[asset.id]) {
                    count = state.assets[asset.id].count || 1; // Default to 1 if owned but count undefined
                    // Migration fix on the fly
                    if (typeof state.assets[asset.id].count === 'undefined') state.assets[asset.id].count = 1;

                    if (isMultiBuy) {
                        currentPrice = Math.floor(asset.price * Math.pow(1.2, count));
                    }
                }

                const assetCard = document.createElement('div');
                assetCard.className = 'asset-card-refined'; // Use a new class for refined style

                let bonusHtml = '';
                if (asset.type === 'plantLimit') {
                    bonusHtml = `<span class="badge-spec green">📦 Capacité: +${asset.bonus}</span>`;
                } else if (asset.type === 'deliverySpeed') {
                    bonusHtml = `<span class="badge-spec blue">⚡ Vitesse: +${asset.bonus * 100}%</span>`;
                } else if (asset.type === 'credibility') {
                    bonusHtml = `<span class="badge-spec blue">🤝 Crédibilité: +${asset.bonus * 100}%</span>`;
                } else if (asset.type === 'avoidInvestigation') {
                    bonusHtml = `<span class="badge-spec blue">🛡️ Discrétion: +${asset.bonus * 100}%</span>`;
                } else if (asset.type === 'salesBonus') {
                    bonusHtml = `<span class="badge-spec green">💰 Bonus Vente: +${asset.bonus * 100}%</span>`;
                } else if (asset.type === 'rental' || asset.type === 'business') {
                    bonusHtml = `<span class="badge-spec green">📈 Revenu: ${fmtCash(asset.income)}/sem</span>`;
                } else if (asset.type === 'storage') {
                    bonusHtml = `<span class="badge-spec green">📦 Capacité: +${fmtMass(asset.bonus)}</span>`;
                }

                let ownedBadge = '';
                if (isOwned) {
                    if (isMultiBuy) ownedBadge = `<span class="badge-owned">Possédé: ${count}</span>`;
                    else ownedBadge = `<span class="badge-owned">Possédé</span>`;
                }

                assetCard.innerHTML = `
                                <div class="asset-card-header">
                                    <div class="asset-icon-box">${asset.icon}</div>
                                    <div class="asset-info-box">
                                        <h4>${asset.name}</h4>
                                        <div class="asset-badges">
                                            ${bonusHtml}
                                            <span class="badge-spec red">💸 Prix: ${fmt(currentPrice)}</span>
                                            ${ownedBadge}
                                        </div>
                                    </div>
                                </div>
                                <div class="asset-card-body">
                                    ${asset.desc ? `<p class="asset-desc">${asset.desc}</p>` : ''}
                                    <button class="primary buy-asset-refined" data-asset-id="${asset.id}">INVESTIR</button>
                                </div>
                            `;
                if (asset.type === 'plantLimit') {
                    if (!isOwned && el('plantAssets')) el('plantAssets').appendChild(assetCard);
                } else if (asset.type === 'car') {
                    if (!isOwned && el('carAssets')) el('carAssets').appendChild(assetCard);
                } else if (asset.type === 'art') {
                    if (!isOwned && el('artAssets')) el('artAssets').appendChild(assetCard);
                } else if (asset.type === 'jewelry') {
                    if (!isOwned && el('jewelryAssets')) el('jewelryAssets').appendChild(assetCard);
                } else if (asset.type === 'real-estate' || asset.type === 'rental') {
                    const rentalContainer = el('rentalAssets');
                    // if (rentalContainer) rentalContainer.appendChild(assetCard); // HANDLED BY INVEST-RENDER
                } else if (asset.type === 'business') {
                    const businessContainer = el('businessAssets');
                    // if (businessContainer) businessContainer.appendChild(assetCard); // HANDLED BY INVEST-RENDER
                } else if (asset.type === 'storage') {
                    const storageContainer = el('storageGrid');
                    if (storageContainer) storageContainer.appendChild(assetCard);
                }
            }
        } catch (e) {
            console.error("Error rendering asset:", asset, e);
        }
    });

    attachEventListeners();

    // Mise à jour des Stocks (Bourse)
    if (el('stockTechPrice')) el('stockTechPrice').textContent = fmtCrypto(stockPrices.tech);
    if (el('stockPharmaPrice')) el('stockPharmaPrice').textContent = fmtCrypto(stockPrices.pharma);
    if (el('stockEnergyPrice')) el('stockEnergyPrice').textContent = fmtCrypto(stockPrices.energy);

    if (el('stockTechChange')) {
        el('stockTechChange').textContent = ((stockPrices.tech - stockHistory.tech[0]) / stockHistory.tech[0] * 100).toFixed(2) + '%';
    }

    if (el('ownedTech')) el('ownedTech').textContent = state.stocks.tech;
    if (el('ownedPharma')) el('ownedPharma').textContent = state.stocks.pharma;
    if (el('ownedEnergy')) el('ownedEnergy').textContent = state.stocks.energy;

    const totalStockValue = (state.stocks.tech * stockPrices.tech) +
        (state.stocks.pharma * stockPrices.pharma) +
        (state.stocks.energy * stockPrices.energy);
    if (el('totalStockValue')) el('totalStockValue').textContent = fmtCash(totalStockValue);


    // Mise à jour des cryptos
    if (el('btcPrice')) el('btcPrice').textContent = fmtCrypto(cryptoPrices.btc);
    if (el('ethPrice')) el('ethPrice').textContent = fmtCrypto(cryptoPrices.eth);
    if (el('dogePrice')) el('dogePrice').textContent = fmtCrypto(cryptoPrices.doge);

    if (el('btcOwned')) el('btcOwned').textContent = state.crypto.btc.toFixed(4);
    if (el('ethOwned')) el('ethOwned').textContent = state.crypto.eth.toFixed(4);
    if (el('dogeOwned')) el('dogeOwned').textContent = state.crypto.doge.toFixed(4);

    // Valeurs des cryptos
    if (el('btcValue')) el('btcValue').textContent = fmtCash(state.crypto.btc * cryptoPrices.btc);
    if (el('ethValue')) el('ethValue').textContent = fmtCash(state.crypto.eth * cryptoPrices.eth);
    if (el('dogeValue')) el('dogeValue').textContent = fmtCash(state.crypto.doge * cryptoPrices.doge);

    const totalCryptoValue = (state.crypto.btc * cryptoPrices.btc) +
        (state.crypto.eth * cryptoPrices.eth) +
        (state.crypto.doge * cryptoPrices.doge);
    if (el('totalCryptoValue')) el('totalCryptoValue').textContent = fmtCash(totalCryptoValue);

    updateProgressBars();
    updateJobUI();
    if (typeof updateVaultDisplay === 'function') updateVaultDisplay();
    // renderShopInventory(); // REMOVED - Handled by renderMyCollections in collection-render.js
}


function getTitleForLevel(level) {
    const titles = [
        "Petite Frappe", "Délinquant", "Dealer de quartier", "Grossiste", "Baron local",
        "Seigneur de guerre", "Parrain", "Empereur de l'ombre", "Légende Vivante"
    ];
    return titles[Math.min(level - 1, titles.length - 1)];
}

function attachEventListeners() {
    document.querySelectorAll('.buy-asset').forEach(button => {
        button.onclick = handleAssetPurchase;
    });
    document.querySelectorAll('.plant-seed-btn').forEach(button => {
        button.onclick = handlePlantSeed;
    });
    document.querySelectorAll('.plant-seed-btn-10').forEach(button => {
        button.onclick = handlePlantSeed10;
    });
    document.querySelectorAll('.plant-seed-btn-max').forEach(button => {
        button.onclick = handlePlantSeedMax;
    });
    // Harvest buttons removed in linear progression (Automatic harvesting)
    document.querySelectorAll('.hire-botanist').forEach(button => {
        button.onclick = handleHireBotanist;
    });
    document.querySelectorAll('.buy-lamp').forEach(button => {
        button.onclick = handleBuyLamp;
    });
    // NEW: Stock Listeners
    document.querySelectorAll('.buy-stock').forEach(btn => {
        btn.onclick = (e) => handleStockTrade(e.target.dataset.stock, 'buy');
    });
    document.querySelectorAll('.sell-stock').forEach(btn => {
        btn.onclick = (e) => handleStockTrade(e.target.dataset.stock, 'sell');
    });
}
function updateJobUI() {
    const btn = document.getElementById('jobBtn');
    const badge = document.getElementById('jobStatusBadge');
    const timer = document.getElementById('jobCooldownTimer');
    const bar = document.getElementById('jobCooldownBar');

    if (!btn) return;

    const now = Date.now();
    const cooldown = state.jobCooldownEnd || 0;

    if (now >= cooldown) {
        // AVAILABLE
        btn.disabled = false;
        btn.classList.remove('btn-disabled');
        btn.style.opacity = '1';
        btn.style.flexDirection = 'row'; // Force row layout
        btn.innerHTML = `
            <span style="font-size:24px;">🍕</span>
            <span style="font-size:16px; font-weight:bold;">Livrer une pizza</span>`;

        if (badge) {
            badge.textContent = "DISPONIBLE";
            badge.style.background = "rgba(34, 197, 94, 0.15)";
            badge.style.color = "#4ade80";
            badge.style.borderColor = "rgba(34, 197, 94, 0.3)";
        }
        if (timer) timer.textContent = "Prêt";
        if (bar) bar.style.width = "100%";

    } else {
        // ON COOLDOWN
        btn.disabled = true;
        btn.classList.add('btn-disabled');
        btn.style.opacity = '0.5';

        const remaining = Math.ceil((cooldown - now) / 1000);
        btn.innerHTML = `
            <span style="font-size:24px;">⏳</span>
            <span style="font-size:16px; font-weight:bold;">En cours (${remaining}s)</span>`;

        if (badge) {
            badge.textContent = "EN PAUSE";
            badge.style.background = "rgba(245, 158, 11, 0.15)";
            badge.style.color = "#fbbf24";
            badge.style.borderColor = "rgba(245, 158, 11, 0.3)";
        }
        if (timer) timer.textContent = `${remaining}s`;

        if (bar) {
            // 60s total duration
            const progress = Math.max(0, 100 - ((remaining / 60) * 100));
            bar.style.width = `${progress}%`;
        }
    }
}
function showSeedGainAnimation(amount, buttonId) {
    const button = el(buttonId);
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const animation = document.createElement('div');
    animation.className = 'seed-gain-animation';
    animation.textContent = `+${amount} 🌱`;
    animation.style.left = `${rect.left + rect.width / 2}px`;
    animation.style.top = `${rect.top}px`;
    document.body.appendChild(animation);

    setTimeout(() => animation.remove(), 1000);
}
if (el('hireDealer')) {
    el('hireDealer').onclick = () => {
        if (state.cash >= 1000) {
            state.dealerCount++;
            state.cash -= 1000;
            trackFinance(1000, 'expenses');
            showNotification('✅ Embauche réussie!', 'Un dealer a été embauché!', 'success');
            updateUI();
        } else {
            showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
        }
    };
}

if (el('buyWeapon')) {
    el('buyWeapon').onclick = () => {
        if (state.cash >= 2000) {
            state.weaponLevel++;
            state.cash -= 2000;
            trackFinance(2000, 'expenses');
            showNotification('✅ Achat réussi!', 'Armes achetées! Dealers plus efficaces!', 'success');
            updateUI();
        } else {
            showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
        }
    };
}

// Gestion des cryptos
document.querySelectorAll('.buy-crypto').forEach(button => {
    button.onclick = () => {
        const crypto = button.dataset.crypto;
        const price = cryptoPrices[crypto];
        const qtyInput = el(crypto + 'BuyAmount');
        const qty = parseFloat(qtyInput.value) || 0;

        if (qty <= 0) {
            showNotification('⚠️ Attention', 'Veuillez entrer une quantité valide.', 'warning');
            return;
        }

        const totalCost = qty * price;
        if (state.cash >= totalCost) {
            // Calculer nouveau prix moyen pondéré
            const currentTotal = state.crypto[crypto] * (state.cryptoAvgPrice[crypto] || price);
            const newTotal = currentTotal + totalCost;
            const newQuantity = state.crypto[crypto] + qty;

            state.cash -= totalCost;
            trackFinance(totalCost, 'expenses');
            state.crypto[crypto] = newQuantity;
            state.cryptoAvgPrice[crypto] = newTotal / newQuantity; // Prix moyen pondéré
            qtyInput.value = '';
            showNotification('✅ Achat crypto!', `Acheté ${qty.toFixed(4)} ${crypto.toUpperCase()}`, 'success');
            updateUI();
        } else {
            showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
        }
    };
});

document.querySelectorAll('.sell-crypto').forEach(button => {
    button.onclick = () => {
        const crypto = button.dataset.crypto;
        const qtyInput = el(crypto + 'SellAmount');
        const qty = parseFloat(qtyInput.value) || 0;

        if (state.crypto[crypto] >= qty && qty > 0) {
            const price = cryptoPrices[crypto];
            const revenue = qty * price;
            state.cash += revenue;
            trackFinance(revenue, 'revenue');
            state.crypto[crypto] -= qty;
            // Si on vend tout, réinitialiser le prix moyen
            if (state.crypto[crypto] < 0.0001) {
                state.crypto[crypto] = 0;
                state.cryptoAvgPrice[crypto] = 0;
            }
            qtyInput.value = '';
            showNotification('💰 Vente crypto!', `Vendu ${qty.toFixed(4)} ${crypto.toUpperCase()} pour ${fmtCash(revenue)}`, 'success');
            updateUI();
        } else {
            showNotification('❌ Erreur', "Pas assez de crypto à vendre!", 'error');
        }
    };
});

if (el('jobBtn')) {
    el('jobBtn').onclick = () => {
        const now = Date.now();
        if (now >= state.jobCooldownEnd) {
            const gain = Math.floor(Math.random() * 101) + 50;
            state.cash += gain;
            trackFinance(gain, 'revenue');
            state.jobCooldownEnd = Date.now() + 60000; // 60s cooldown

            if (typeof updateQuestProgress === 'function') {
                updateQuestProgress('job', 1);
                updateQuestProgress('earn', gain);
            }

            showNotification('Travail terminé', `Vous avez gagné $${gain}`, 'success');
            updateUI();
        }
    };
}

if (el('adminBtn')) {
    el('adminBtn').onclick = () => {
        state.cash += 1000000;
        showNotification('💰 Admin', 'Vous avez reçu $1,000,000!', 'success');
        updateUI();
    };
}

if (el('cheatDiamondBtn')) {
    el('cheatDiamondBtn').onclick = () => {
        state.diamonds = (state.diamonds || 0) + 100;
        showNotification('💎 Cheat', '+100 Diamants ajoutés !', 'achievement');
        updateUI();
    };
}

if (el('saveBtn')) {
    el('saveBtn').onclick = () => {
        if (el('playerName')) state.playerName = el('playerName').value;
        saveGame();
        showNotification('✅ Sauvegarde', 'Partie sauvegardée!', 'success');
    };
}

if (el('resetBtn')) {
    el('resetBtn').onclick = () => {
        if (confirm('Réinitialiser la partie ? Cette action est irréversible!')) {
            localStorage.removeItem('illicit-empire');
            localStorage.removeItem('crypto-prices');
            localStorage.removeItem('crypto-history');
            showNotification('🔄 Reset', 'Partie réinitialisée! Rechargement...', 'warning');
            setTimeout(() => location.reload(), 1000);
        }
    };
}
const tabs = document.querySelectorAll('.tab');
window.switchTab = function (tabId) {
    // Redirection for merged tabs
    if (tabId === 'immobilier' || tabId === 'finance') tabId = 'business';

    // Update Desktop Sidebar
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const desktopTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (desktopTab) desktopTab.classList.add('active');

    // Update Mobile Bottom Nav
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    const navItems = document.querySelectorAll('.nav-item');
    const tabMap = {
        'dashboard': 0,
        'plantation': 1,
        'business': 2,
        'assets': 3,
        'profil': 4,
        'achievements': 4 // Link achievements to the same mobile tab as profil
    };
    if (navItems[tabMap[tabId]] !== undefined) {
        navItems[tabMap[tabId]].classList.add('active');
    }

    // Switch Panels
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    } else {
        console.error("Tab target not found:", tabId);
    }

    // Adjust layout if needed
    // if (tabId === 'assets') renderShopInventory(); // REMOVED - Handled by collection-render.js
    if (tabId === 'dashboard' && typeof updateChart === 'function') updateChart();
    if (tabId === 'business' && typeof updateCharts === 'function') {
        setTimeout(() => updateCharts(), 100);
    }
    if (tabId === 'achievements' || tabId === 'profil') {
        setTimeout(() => renderAchievements(), 50);
    }
};

// Sidebar Tabs (Desktop)
document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => window.switchTab(t.dataset.tab);
});
window.switchSubTab = function (parentId, subTabId) {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    // Hide all sub-panels in this parent
    const panels = parent.querySelectorAll('.sub-panel');
    panels.forEach(p => p.style.display = 'none');

    // Show target sub-panel
    const target = document.getElementById(subTabId);
    if (target) target.style.display = 'block';

    // Mettre à jour Active State
    const subNav = parent.querySelector('.sub-nav');
    if (subNav) {
        const navItems = subNav.querySelectorAll('.sub-nav-item');
        navItems.forEach(item => {
            const onclick = item.getAttribute('onclick');
            if (onclick && onclick.includes(subTabId)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Trigger specific renders based on parentId and subTabId
    if (parentId === 'business') {
        if (typeof renderInvest === 'function') renderInvest();
        if (subTabId === 'sub-properties' && typeof renderPropertiesTab === 'function') renderPropertiesTab();
    }
    if (parentId === 'assets') {
        // Collections tab renders
        if (subTabId === 'sub-my-collections' && typeof renderMyCollections === 'function') renderMyCollections();
        if (subTabId === 'sub-cars' && typeof renderCarsTab === 'function') renderCarsTab();
        if (subTabId === 'sub-art' && typeof renderArtTab === 'function') renderArtTab();
        if (subTabId === 'sub-jewelry' && typeof renderJewelryTab === 'function') renderJewelryTab();
    }
};

// Initialize Default Sub-tabs
document.addEventListener('DOMContentLoaded', () => {
    switchSubTab('plantation', 'sub-boulot');
    switchSubTab('assets', 'sub-my-collections');
    switchSubTab('business', 'sub-properties');
});


// Duplicate function removed

function updateProgressBars() {
    // Update vehicle loading bars
    // This is handled in updateFleetUI for now, but we can refine here if needed.
    // For now, let's keep it empty or simple.
}

window.updateJobUI = updateJobUI;
window.updateProgressBars = updateProgressBars;
window.renderStorageTab = function () {
    if (!state) return;
    const maxStorage = calculateMaxStock();
    const currentStock = state.stockGrams;
    const fillPercentage = Math.min((currentStock / maxStorage) * 100, 100);

    // 1. Hero Section
    if (document.getElementById('storageCurrent')) document.getElementById('storageCurrent').textContent = fmtMass(currentStock);
    if (document.getElementById('storageMax')) document.getElementById('storageMax').textContent = fmtMass(maxStorage);

    const bar = document.getElementById('storageBar');
    if (bar) {
        bar.style.width = fillPercentage + '%';
        if (fillPercentage > 90) bar.style.background = 'linear-gradient(90deg, #f43f5e, #e11d48)'; // Red warning
        else bar.style.background = 'linear-gradient(90deg, #06b6d4, #3b82f6)'; // Cyan-Blue
    }
    if (document.getElementById('storageFillText')) document.getElementById('storageFillText').textContent = fillPercentage.toFixed(0) + '%';
};

// ==========================================
// INVENTORY SYSTEM LOGIC
// ==========================================

window.openInventory = function () {
    const modal = document.getElementById('inventoryModal');
    if (modal) {
        modal.style.display = ''; // Strip old HTML inline styles
        renderInventory();
        modal.classList.add('show');
    }
};

window.closeInventory = function () {
    const modal = document.getElementById('inventoryModal');
    if (modal) {
        modal.classList.remove('show');
    }
};

window.openLabo = function () {
    const modal = document.getElementById('laboModal');
    if (modal) {
        modal.style.display = ''; // Strip old HTML inline styles
        renderLabo();
        modal.classList.add('show');
    }
};

window.closeLabo = function () {
    const modal = document.getElementById('laboModal');
    if (modal) {
        modal.classList.remove('show');
    }
};

window.renderInventory = function () {
    const grid = document.getElementById('inventoryGrid');
    const emptyDisplay = document.getElementById('inventoryEmpty');
    if (!grid || !emptyDisplay) return;

    grid.innerHTML = '';
    let hasItems = false;

    // Iterate through state.inventory
    for (const [itemId, count] of Object.entries(state.inventory)) {
        if (count > 0 && ITEMS_DATABASE[itemId]) {
            hasItems = true;
            const item = ITEMS_DATABASE[itemId];

            const card = document.createElement('div');
            card.className = 'inventory-item-card';
            card.innerHTML = `
                <div class="inventory-icon-wrapper">
                    ${item.icon}
                    <div class="inventory-item-count">${count}</div>
                </div>
                <div class="inventory-item-name">${item.name}</div>
                <div class="inventory-item-desc">${item.desc}</div>
                <button class="btn-inventory-use" onclick="useItem('${itemId}')">Utiliser</button>
            `;
            grid.appendChild(card);
        }
    }

    if (hasItems) {
        grid.style.display = 'grid';
        emptyDisplay.style.display = 'none';
    } else {
        grid.style.display = 'none';
        emptyDisplay.style.display = 'block';
    }
};

window.useItem = function (itemId) {
    if (!state.inventory[itemId] || state.inventory[itemId] <= 0) return;

    // Apply item effects
    if (itemId === 'premium_seeds') {
        if (state.activeBuilding.plants < state.plantLimit) {
            const added = Math.min(10, state.plantLimit - state.activeBuilding.plants);
            state.activeBuilding.plants += added;
            state.activeBuilding.mature += added; // Instant mature
            showNotification('🌟 Graines Magiques', `+${added} plants prêts à récolter !`, 'success');
            if (typeof renderProduction === 'function') renderProduction();
        } else {
            showNotification('❌ Erreur', 'Votre lieu de production est plein.', 'error');
            return; // don't consume item
        }
    } else if (itemId === 'clean_money') {
        state.cash += 5000;
        trackFinance(5000, 'revenue');
        showNotification('💵 Billet Sale', '+5000$ blanchis avec succès !', 'success');
        updateUI();
    }

    // Consume item
    state.inventory[itemId]--;
    renderInventory(); // Refresh modal
};
