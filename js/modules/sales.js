function getMaxVehicles(type) {
    const level = state.productionLevel || 0;
    if (type === 'dealer_pied') return Infinity;
    if (type === 'car') return Infinity;
    if (type === 'pickup') return level >= 3 ? Infinity : 0;
    if (type === 'van') return level >= 5 ? Infinity : 0;
    if (type === 'truck') return level >= 7 ? Infinity : 0;
    if (type === 'plane') return level >= 8 ? Infinity : 0;
    return 0;
}


function getVehiclePrice(type) {
    const config = VEHICLE_STATS[type];
    if (!config) return Infinity;

    // Base price overrides. Dealer starts at $100 logically, but player gets 1 free.
    const basePrice = (type === 'dealer_pied' && config.price === 0) ? 100 : config.price;
    const count = state.fleet[type] ? state.fleet[type].count : 0;

    // Increase price by 15% per unit already owned
    return Math.floor(basePrice * Math.pow(1.15, count));
}

function handleBuyFleet(type) {
    const config = VEHICLE_STATS[type];
    if (!config) return;

    // Check Specific Limit
    const current = state.fleet[type] ? state.fleet[type].count : 0;
    const max = getMaxVehicles(type);

    if (current >= max) {
        if (max === 0) {
            showNotification('🔒 Bloqué', `Véhicule verrouillé. Achetez la propriété requise !`, 'error');
        } else {
            const nextProp = type === 'car' ? "(Local, Appart...)" : "";
            showNotification('❌ Garage Plein', `Limite atteinte pour ce véhicule (${max}). ${nextProp}`, 'error');
        }
        return;
    }

    const currentPrice = getVehiclePrice(type);

    if (state.cash >= currentPrice) {
        state.cash -= currentPrice;
        trackFinance(currentPrice, 'expenses');
        if (!state.fleet[type]) state.fleet[type] = { count: 0, activeTrips: [] };
        state.fleet[type].count++;
        if (!state.fleet[type].activeTrips) state.fleet[type].activeTrips = []; // Init if missing

        showNotification('🚗 Achat', `Vous avez acheté: ${config.name}!`, 'success');
        updateFleetUI();
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
    }
}

// Avoid rebuilding the UI while the user is dragging the slider
if (typeof window.isDraggingSlider === 'undefined') {
    window.isDraggingSlider = false;
    document.addEventListener('mousedown', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('fleet-slider')) {
            window.isDraggingSlider = true;
        }
    });
    document.addEventListener('mouseup', () => { window.isDraggingSlider = false; });
    document.addEventListener('touchstart', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('fleet-slider')) {
            window.isDraggingSlider = true;
        }
    });
    document.addEventListener('touchend', () => { window.isDraggingSlider = false; });
}

function updateFleetUI() {
    if (window.isDraggingSlider) return; // Wait until player drops the slider

    const shop = el('fleetShop');
    if (!shop) return;

    // Capture current slider values to prevent reset during polling
    const sliderStates = {};
    shop.querySelectorAll('.fleet-slider').forEach(slider => {
        const type = slider.id.replace('dispatch-slider-', '');
        sliderStates[type] = slider.value;
    });

    shop.innerHTML = '';

    for (const [type, config] of Object.entries(VEHICLE_STATS)) {
        // Ensure state exists
        if (!state.fleet[type]) state.fleet[type] = { count: 0, activeTrips: [], loadingList: [], readyList: [] };
        const fleetState = state.fleet[type];
        // Ensure arrays
        if (!fleetState.activeTrips) fleetState.activeTrips = [];
        if (!fleetState.loadingList) fleetState.loadingList = [];
        if (!fleetState.readyList) fleetState.readyList = [];
        if (!fleetState.claimList) fleetState.claimList = [];

        const count = fleetState.count;

        // Requirements Logic
        const max = getMaxVehicles(type);
        const locked = max === 0;
        let reqText = "";
        if (type === 'car') {
            if (count >= max && max < 3) reqText = "Augmenter la capacité en achetant le Local Abandonné et le Petit Appartement.";
        } else if (locked) {
            if (type === 'pickup') reqText = "Nécessite la Maison avec jardin";
            if (type === 'van') reqText = "Nécessite le Corps de Ferme Caché";
            if (type === 'truck') reqText = "Nécessite la Grosse Ferme Cachée";
            if (type === 'plane') reqText = "Nécessite l'Exploitation Géante";
        }

        const card = document.createElement('div');
        card.className = 'sales-card'; // UPDATED CLASS TO MATCH LIGHT THEME

        // Buy Button Logic
        const currentPrice = getVehiclePrice(type);
        const buyBtnClass = (locked || count >= max) ? 'disabled' : (state.cash >= currentPrice ? 'primary' : 'disabled');
        let buyBtnText = `Acheter ($${fmtInt(currentPrice)})`;
        if (locked) buyBtnText = "Verrouillé";
        else if (count >= max) buyBtnText = "Max Atteint";

        // Build Rows List: [Active, Claimable, Idle Slider]
        let rowsHtml = '';

        // --- IDLE VEHICLES SLIDER SECTION ---
        // Active vehicles in transit
        let activeVehiclesCount = 0;
        fleetState.activeTrips.forEach(trip => { activeVehiclesCount += (trip.count || 1); });

        // Vehicles waiting to be claimed
        let claimableVehiclesCount = 0;
        fleetState.claimList.forEach(claim => { claimableVehiclesCount += (claim.count || 1); });

        const idleCount = count - activeVehiclesCount - claimableVehiclesCount;

        if (idleCount > 0) {
            let initialSliderValue = sliderStates[type] || "0";
            if (parseInt(initialSliderValue) > idleCount) {
                initialSliderValue = idleCount.toString();
            }

            rowsHtml += `
                <div class="fleet-dispatch-panel">
                    <div class="fleet-idle-label">
                        <span>🚗 Véhicules à envoyer</span>
                        <span class="fleet-idle-count" id="selected-count-${type}">${initialSliderValue}</span>
                    </div>
                    <input type="range" id="dispatch-slider-${type}" min="0" max="${idleCount}" value="${initialSliderValue}" class="fleet-slider">
                    <div class="fleet-stats-row">
                        <div class="fleet-stat-box">
                            <span class="fleet-stat-label">📦 Stock max à transporter</span>
                            <span class="fleet-stat-value green" id="dispatch-cap-${type}">0 g</span>
                        </div>
                        <div class="fleet-stat-box">
                            <span class="fleet-stat-label">⛽ Coût Transit total</span>
                            <span class="fleet-stat-value red" id="dispatch-cost-${type}">$0</span>
                        </div>
                    </div>
                    <button id="dispatch-btn-${type}" class="fleet-dispatch-btn" disabled>🚀 Envoyer (0)</button>
                </div>
            `;
        } else if (count > 0) {
            rowsHtml += `<div class="fleet-empty-msg">⏳ Tous les véhicules sont actuellement en service ou en attente de récolte.</div>`;
        }

        // Active Trips
        fleetState.activeTrips.forEach((trip) => {
            const now = Date.now();
            const elapsed = now - trip.startTime;
            const progress = Math.min(100, (elapsed / trip.duration) * 100).toFixed(0);
            const tripCountText = (trip.count && trip.count > 1) ? `${trip.count}× ` : '';

            rowsHtml += `
                <div class="fleet-trip-row in-transit">
                    <div class="fleet-trip-icon">${config.icon}</div>
                    <div class="fleet-trip-body">
                        <div class="fleet-trip-label">🚚 ${tripCountText}En Transit</div>
                        <div class="fleet-trip-progress">
                            <div class="fleet-trip-progress-fill" style="width: ${progress}%;"></div>
                        </div>
                        <div class="fleet-trip-percent">${progress}% — ${fmtMass(trip.amount)} en route</div>
                    </div>
                </div>
            `;
        });

        // Claimable Trips
        fleetState.claimList.forEach((claim, idx) => {
            const claimCountText = (claim.count && claim.count > 1) ? `${claim.count}× ` : '';
            rowsHtml += `
                <div class="fleet-trip-row claimable">
                    <div class="fleet-trip-icon">${config.icon}</div>
                    <div class="fleet-trip-body">
                        <div class="fleet-trip-label green">✅ ${claimCountText}Livraison Terminée</div>
                        <div class="fleet-trip-percent">Prêt à récolter !</div>
                    </div>
                    <button class="fleet-claim-btn btn-claim-slot" data-type="${type}" data-idx="${idx}">💰 Récolter $${fmtInt(claim.revenue)}</button>
                </div>
            `;
        });

        if (count === 0 && !locked) {
            rowsHtml = `<div class="fleet-empty-msg">Stockage logistique vide. Achetez un véhicule pour commencer.</div>`;
        } else if (locked) {
            rowsHtml = `<div class="fleet-locked-msg">🔒 ${reqText}</div>`;
        }

        const canBuy = !locked && state.cash >= config.price;
        card.innerHTML = `
            <div class="fleet-header">
                <div class="fleet-vehicle-info">
                    <div class="fleet-vehicle-icon-wrap">${config.icon}</div>
                    <div>
                        <h4 class="fleet-vehicle-name">${config.name} <span>(${count})</span></h4>
                        <div class="fleet-badges">
                            <span class="fleet-badge green">📦 Capacité: ${fmtMass(config.capacity)}</span>
                            <span class="fleet-badge red">⛽ Coût Transit: ${fmtCash(config.tripCost)}</span>
                        </div>
                    </div>
                </div>
                ${!locked ? `<button class="fleet-buy-btn btn-buy-fleet" ${!canBuy ? 'disabled' : ''}>${buyBtnText}</button>` : ''}
            </div>
            <div class="fleet-rows">
                ${rowsHtml}
            </div>
        `;



        // Attach Events
        if (buyBtnClass !== 'disabled') {
            const btn = card.querySelector('.btn-buy-fleet');
            if (btn) btn.onclick = () => handleBuyFleet(type);
        }

        // Attach Slider Events
        const slider = card.querySelector(`#dispatch-slider-${type}`);
        const dispatchBtn = card.querySelector(`#dispatch-btn-${type}`);
        if (slider && dispatchBtn) {
            slider.addEventListener('input', (e) => {
                const selectedCount = parseInt(e.target.value);
                const totalCap = selectedCount * config.capacity;
                const totalCost = selectedCount * config.tripCost;

                const selectedEl = card.querySelector(`#selected-count-${type}`);
                if (selectedEl) selectedEl.textContent = selectedCount;

                const capEl = card.querySelector(`#dispatch-cap-${type}`);
                if (capEl) capEl.textContent = fmtMass(totalCap);

                const costEl = card.querySelector(`#dispatch-cost-${type}`);
                if (costEl) costEl.textContent = `$${fmtInt(totalCost)}`;

                // Dispatch Button Logic
                const canAfford = state.cash >= totalCost;
                const hasStock = state.stockGrams > 0;

                if (selectedCount > 0 && canAfford && hasStock) {
                    dispatchBtn.disabled = false;
                    dispatchBtn.textContent = `🚀 Envoyer (${selectedCount})`;
                } else {
                    dispatchBtn.disabled = true;
                    if (selectedCount === 0) {
                        dispatchBtn.textContent = `🚀 Envoyer (0)`;
                    } else if (!hasStock) {
                        dispatchBtn.textContent = `❌ Pas de stock`;
                    } else if (!canAfford) {
                        dispatchBtn.textContent = `❌ Pas assez cash`;
                    }
                }
            });

            dispatchBtn.addEventListener('click', () => {
                const selectedCount = parseInt(slider.value);
                if (selectedCount > 0) {
                    handleBulkDispatch(type, selectedCount);
                }
            });

            // Trigger input event to initialize dynamic values
            slider.dispatchEvent(new Event('input'));
        }

        card.querySelectorAll('.btn-claim-slot').forEach(btn => {
            const idx = parseInt(btn.dataset.idx);
            btn.onclick = () => handleClaimDelivery(type, idx);
        });

        shop.appendChild(card);
    }
}

function handleClaimDelivery(type, index) {
    const fleetState = state.fleet[type];
    if (!fleetState || !fleetState.claimList || !fleetState.claimList[index]) return;

    const claim = fleetState.claimList[index];

    // Add revenue
    state.cash += claim.revenue;
    trackFinance(claim.revenue, 'revenue');

    if (typeof updateQuestProgress === 'function') {
        updateQuestProgress('earn', claim.revenue);
        updateQuestProgress('deliver', 1);
    }

    // Remove from claim list
    fleetState.claimList.splice(index, 1);

    showNotification('💰 Récolte', `Vous avez récolté $${fmtInt(claim.revenue)}`, 'success');
    updateFleetUI();
    updateUI();
}

function handleBulkDispatch(type, count) {
    const config = VEHICLE_STATS[type];
    if (!config || count <= 0) return;

    const fleetState = state.fleet[type];
    if (!fleetState) return;

    // Check availability
    let activeVehiclesCount = 0;
    if (fleetState.activeTrips) fleetState.activeTrips.forEach(t => activeVehiclesCount += (t.count || 1));

    let claimVehiclesCount = 0;
    if (fleetState.claimList) fleetState.claimList.forEach(c => claimVehiclesCount += (c.count || 1));

    const idleCount = fleetState.count - activeVehiclesCount - claimVehiclesCount;

    if (count > idleCount) {
        showNotification('❌ Erreur', 'Pas assez de véhicules disponibles!', 'error');
        return;
    }

    const totalCapacity = count * config.capacity;
    const totalCost = count * config.tripCost;

    if (state.cash < totalCost) {
        showNotification('❌ Erreur', 'Pas assez de cash pour la livraison!', 'error');
        return;
    }

    if (state.stockGrams <= 0) {
        showNotification('❌ Erreur', 'Aucun stock à charger!', 'error');
        return;
    }

    const loadAmount = Math.min(state.stockGrams, totalCapacity);

    // Execute Bulk Dispatch
    state.cash -= totalCost;
    state.stockGrams -= loadAmount;
    trackFinance(totalCost, 'expenses');

    if (!fleetState.activeTrips) fleetState.activeTrips = [];
    fleetState.activeTrips.push({
        id: Date.now() + Math.random(),
        count: count,
        startTime: Date.now(),
        duration: config.duration * 1000,
        amount: loadAmount,
        paidAmount: 0 // Legacy field, kept if accessed elsewhere
    });

    showNotification('🚚 Départ', `${count} ${config.name}(s) en route avec ${fmtMass(loadAmount)}!`, 'success');
    updateFleetUI();
    updateUI();
}
function renderTerritoryMap() {
    const container = el('territorySelector');
    if (!container) return;
    container.innerHTML = '';

    const territories = [
        { id: 'quartier', name: 'Quartier', price: 0, cap: 100 },
        { id: 'ville', name: 'Ville', price: 50000, cap: 100000 },
        { id: 'region', name: 'Région', price: 200000, cap: 1000000 },
        { id: 'pays', name: 'Pays', price: 1000000, cap: 100000000 },
        { id: 'international', name: 'International', price: 5000000, cap: 9000000000 }
    ];

    territories.forEach(t => {
        const isUnlocked = state.unlockedTerritories.includes(t.id);
        const card = document.createElement('div');
        card.className = 'card territory-card ' + (isUnlocked ? 'unlocked' : 'locked');
        card.style.borderLeft = isUnlocked ? '4px solid green' : '4px solid red';
        card.style.padding = '10px';
        card.style.marginBottom = '10px';

        card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center">
                            <div>
                                <h4>${t.name} ${isUnlocked ? '✅' : '🔒'}</h4>
                                <p>Clients Max: ${fmtInt(t.cap)}</p>
                            </div>
                            <div style="text-align:right">
                                <p>${t.price === 0 ? 'Gratuit' : '$' + fmtInt(t.price)}</p>
                                ${!isUnlocked ? `<button class="btn-unlock">Débloquer</button>` : ''}
                            </div>
                        </div>
                     `;

        if (!isUnlocked) {
            const btn = card.querySelector('.btn-unlock');
            if (btn) btn.onclick = () => {
                if (state.cash >= t.price) {
                    state.cash -= t.price;
                    state.unlockedTerritories.push(t.id);
                    showNotification('🗺️ Expansion', `Territoire débloqué: ${t.name}`, 'success');
                    renderTerritoryMap();
                    updateUI();
                } else {
                    showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
                }
            };
        }
        container.appendChild(card);
    });
}
function setupSalesListeners() {
    const sellBtn = document.getElementById('sellBtn');
    const sellAllBtn = document.getElementById('sellAllBtn');

    if (sellBtn) sellBtn.onclick = () => {
        const amountInput = document.getElementById('sellAmount');
        const amount = parseInt(amountInput.value) || 0;
        if (amount > 0) sellProduct(amount);
    };

    if (sellAllBtn) sellAllBtn.onclick = () => sellProduct(state.stockGrams);
}

function sellProduct(amount) {
    if (state.stockGrams >= amount) {
        const revenue = amount * marketPrice;
        state.stockGrams -= amount;
        state.cash += revenue;
        trackFinance(revenue, 'revenue');

        // QUEST HOOKS
        if (typeof updateQuestProgress === 'function') {
            updateQuestProgress('earn', revenue);
            // Sales count as delivery if manual? Or just earn?
            // Let's count generic sales as 'deliver' too for gameplay flow
            updateQuestProgress('deliver', 1);
        }

        showNotification('💰 Vente', `Vendu ${fmtMass(amount)} pour $${fmtCash(revenue)}`, 'success');
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez de stock !', 'error');
    }
}

// Global expose
window.setupSalesListeners = setupSalesListeners;
window.sellProduct = sellProduct;


// MARKET PRICE STABILIZATION
// setInterval(() => {
//     const variation = (Math.random() - 0.5) * 0.2; // +/- 0.1
//     marketPrice = Math.max(0.5, marketPrice + variation);
//     if (typeof updateUI === 'function') updateUI();
// }, 5000); // Every 5 seconds
