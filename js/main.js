(() => {
    // Global Error Handler for User Debugging
    // Global Error Handler (Already defined in HTML, removing override or silencing)
    // window.onerror = function (msg, url, line, col, error) {
    //     console.warn("Ignored Error:", msg);
    //     return false;
    // };

    function gameLoop() {
        updateCalendar();

        // Throttled Finance Update (Every 3 seconds)
        const now = Date.now();
        if (now - state.lastFinanceUpdate > 3000) {
            updateFinance();
            state.lastFinanceUpdate = now;
        }

        // --- PASSIVE INCOME → VAULT (accumulates, player must collect) ---
        let totalPassive = 0;
        if (typeof purchasableAssets !== 'undefined') {
            purchasableAssets.forEach(asset => {
                if (asset.type === 'business' || asset.type === 'rental') {
                    const legacyCount = asset.type === 'business'
                        ? ((state.businesses && state.businesses[asset.id]) || 0)
                        : ((state.realEstate && state.realEstate[asset.id]) || 0);
                    const modernCount = (state.assets && state.assets[asset.id] && state.assets[asset.id].count) || 0;
                    const count = Math.max(legacyCount, modernCount);
                    // income is per-week (7 game days). We tick every 100ms real-time.
                    // Let's treat 1 game week = 60 real seconds → income / (60 * 10 ticks) per tick
                    totalPassive += (asset.income || 0) * count;
                }
            });
        }
        if (totalPassive > 0) {
            // Accumulate in vault at rate of 1 week-income per 60 real seconds
            const incomePerTick = totalPassive / (60 * 10);
            state.propertyVault = (state.propertyVault || 0) + incomePerTick;
        }

        // --- LOGIQUE TRANSPORT (Refactorisé) ---

        for (const [type, config] of Object.entries(VEHICLE_STATS)) {
            if (state.fleet[type]) {
                // 1. Process Loading
                // Removed: Loading logic handled instantly by the new bulk dispatch system.

                // 2. Process Active Trips
                if (state.fleet[type].activeTrips) {
                    const trips = state.fleet[type].activeTrips;
                    for (let i = trips.length - 1; i >= 0; i--) {
                        const trip = trips[i];
                        const now = Date.now();
                        const elapsed = now - trip.startTime;

                        if (!trip.paidAmount) trip.paidAmount = 0;

                        const progress = Math.min(1, elapsed / trip.duration);

                        if (progress >= 1) {
                            // Trip fini
                            trips.splice(i, 1);

                            if (!state.fleet[type].claimList) state.fleet[type].claimList = [];
                            state.fleet[type].claimList.push({
                                id: Date.now() + Math.random(),
                                amount: trip.amount,
                                count: trip.count || 1, // Store how many vehicles were in this trip
                                revenue: trip.amount * marketPrice
                            });

                            showNotification('🚚 Arrivée', `Livraison terminée, l'argent est prêt à être récolté!`, 'info');
                            updateFleetUI(); // Update avail counts
                        }
                    }
                }
            }
        }


        // Plantation automatique
        handleAutomaticPlanting();

        // Fluctuation du prix de marché SUPPRIMÉE
        // marketPrice += (Math.random() - 0.5) * 0.05;
        // marketPrice = Math.max(0.5, Math.min(5, marketPrice));
    }
    function updateFinance() {
        // --- BANK INTEREST (1% per minute) ---
        const lastBankTick = state.lastBankInterest || 0;
        const now = Date.now();
        if (now - lastBankTick > 60000 && state.bank > 0) {
            const interest = state.bank * 0.01;
            state.bank += interest;
            state.lastBankInterest = now;
            showNotification('🏦 Banque', `Intérêts perçus : +$${fmtInt(interest)}`, 'success');
        }

        updateCryptoPrices();
        // updateStockPrices(); // Merged into updateCryptoPrices
        updateCharts();


    }


    setInterval(saveGame, 10000); // Sauvegarde toutes les 10 secondes
    setInterval(updateCryptoPrices, 10000); // Prix crypto/actions toutes les 10 secondes
    setInterval(updateJobUI, 1000); // Cooldown job chaque seconde
    setInterval(checkAchievements, 2000); // Check succès toutes les 2sec
    setInterval(gameLoop, 100); // Game loop 10x par seconde
    setInterval(updateProgressBars, 100); // Barres de progression 10x par seconde
    setInterval(updateUI, 1000); // UI mise à jour chaque seconde
    const initGame = () => {
        try {
            console.log("Initializing game...");
            updateUI();
            renderAchievements(); // Init Achievements UI
        } catch (e) { console.error("Error in updateUI:", e); }

        try {
            updateFleetUI();
        } catch (e) { console.error("Error in updateFleetUI:", e); }

        try {
            // Territory map removed
        } catch (e) { console.error("Error in renderTerritoryMap:", e); }

        try {
            // Check if Chart is loaded
            if (typeof Chart !== 'undefined') {
                initCharts(); // Créer les graphiques
                updateCharts(); // Les mettre à jour
            } else {
                console.warn("Chart.js not loaded yet. Retrying in 1s...");
                setTimeout(() => {
                    if (typeof Chart !== 'undefined') {
                        initCharts();
                        updateCharts();
                    }
                }, 1000);
            }
        } catch (e) { console.error("Error in charts:", e); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
    // setInterval(updateDashboard, 1000); // Removed: Function does not exist, likely replaced by updateUI or built-in loop
    setInterval(checkAchievements, 2000);
})(); // Call setup
