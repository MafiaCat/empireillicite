function startHarvesting(assetId) {
    const asset = state.assets[assetId];
    if (asset && asset.maturePlants > 0 && !asset.isHarvesting) {
        asset.isHarvesting = true;
        asset.harvestProgress = 0;
    }
}

function updateHarvestingBars() {
    if (!state.assets) return;
    for (const [id, asset] of Object.entries(state.assets)) {
        if (asset.isHarvesting) {
            const speed = 10 * (1 + (asset.botanists || 0) * 0.5);
            asset.harvestProgress += speed;
            if (asset.harvestProgress >= 100) {
                asset.harvestProgress = 0;
                asset.maturePlants--;
                state.stockGrams += 10;
                state.totalProduction += 10; // Track Total Production
                if (typeof updateQuestProgress === 'function') updateQuestProgress('harvest', 10); // NEW: Quest Hook
                if (asset.maturePlants <= 0) asset.isHarvesting = false;
            }
        }
    }
}
function addToPlantingQueue(propertyId, count = 1) {
    // propertyId is ignored in new system, we always use activeBuilding
    const building = state.activeBuilding;
    const config = PRODUCTION_PATH[state.productionLevel];
    // Safety check
    if (!building) return;

    // Calculate current total load
    const currentTotal = (building.plants || 0) + (building.growing || 0) + (building.mature || 0) + (building.plantingQueue || 0);
    const capacity = config.cap;

    let planted = 0;
    for (let i = 0; i < count; i++) {
        if (state.seeds > 0 && currentTotal + planted < capacity) {
            building.plantingQueue = (building.plantingQueue || 0) + 1;
            state.seeds--;
            planted++;
        } else {
            break;
        }
    }

    if (planted > 0) {
        // Planting is queued; updateProgressBars() will process it automatically
    }
    return planted;
}
window.addToPlantingQueue = addToPlantingQueue; // EXPOSE GLOBALLY

window.buyUpgrade = function (type) {
    const building = state.activeBuilding;
    if (!building) return;

    let cost = 0;
    if (type === 'botanist') cost = 2000;
    if (type === 'lamp') cost = 3000;

    if (state.cash >= cost) {
        state.cash -= cost;
        trackFinance(cost, 'expenses');
        if (type === 'botanist') building.botanists = (building.botanists || 0) + 1;
        if (type === 'lamp') building.lamps = (building.lamps || 0) + 1;
        showNotification('🔧 Amélioration', `Amélioration ${type} achetée !`, 'success');
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
    }
};

window.renderProduction = function () {
    const nextContainer = document.getElementById('nextBuildingContainer');

    const currentLevel = state.productionLevel;
    const currentConfig = PRODUCTION_PATH[currentLevel];
    const nextConfig = PRODUCTION_PATH[currentLevel + 1];

    if (currentConfig) {
        const building = state.activeBuilding || {};
        const activePlants = (building.plants || 0) + (building.growing || 0) + (building.mature || 0) + (building.plantingQueue || 0);
        const botanists = building.botanists || 0;
        const lamps = building.lamps || 0;
        const plantHarvestSpeed = 100 * (1 + botanists);
        const growthSpeed = 100 * (1 + (lamps * 0.2));
        const globalSpeed = Math.round((plantHarvestSpeed + growthSpeed) / 2);
        const growingTime = (10 / (1 + lamps * 0.2)).toFixed(1);

        // Update hero banner
        const nameEl = document.getElementById('productionBuildingName');
        if (nameEl) nameEl.textContent = currentConfig.name;

        const iconEl = document.getElementById('productionBuildingIcon');
        if (iconEl && currentConfig.icon) {
            iconEl.textContent = currentConfig.icon;
        }

        // Calculate Max Seed Price dynamically
        const seedPrice = 10;
        const maxAffordableBtn = document.querySelector('#buySeedMax .pcard-buy-price');
        if (maxAffordableBtn) {
            const maxAffordable = Math.floor(state.cash / seedPrice);
            if (maxAffordable > 0) {
                maxAffordableBtn.textContent = fmtCash(maxAffordable * seedPrice);
            } else {
                maxAffordableBtn.textContent = '$0';
            }
        }

        const plantsEl = document.getElementById('statActivePlantsValue');
        if (plantsEl) plantsEl.textContent = activePlants + ' / ' + currentConfig.cap;

        // Update resource strip
        const stockEl = document.getElementById('statStockProducedValue');
        if (stockEl) stockEl.textContent = fmtMass(state.totalProduction || 0);

        const effEl = document.getElementById('statEfficiencyValue');
        if (effEl) effEl.textContent = globalSpeed + '%';

        // Update staff cards
        const botEl = document.getElementById('active-botanists');
        if (botEl) botEl.textContent = botanists;

        const lampEl = document.getElementById('active-lamps');
        if (lampEl) lampEl.textContent = lamps;

        // Update capacity display in plant section
        const capEl = document.getElementById('active-building-capacity');
        if (capEl) capEl.textContent = activePlants + ' / ' + currentConfig.cap;

        // Update queue display
        const queueEl = document.getElementById('queue-display');
        if (queueEl) queueEl.textContent = building.plantingQueue || 0;
    }

    // Next Building Expansion
    if (nextContainer) {
        if (!nextConfig) {
            nextContainer.innerHTML = `<p class="success" style="padding:20px; background:#f0fdf4; border-radius:12px; border:1px solid #86efac;">🏆 Niveau Maximum Atteint !</p>`;
            return;
        }

        const isTerritoryUnlocked = !nextConfig.territory || state.unlockedTerritories.includes(nextConfig.territory);
        const canAfford = state.cash >= nextConfig.price;
        const btnLabel = isTerritoryUnlocked
            ? `🚚 Déménager & Améliorer ($${fmtCash(nextConfig.price)})`
            : `⚠️ TERRITOIRE "${nextConfig.territory.toUpperCase()}" REQUIS !`;

        nextContainer.innerHTML = `
            <div style="
                background: white;
                border: ${isTerritoryUnlocked ? '2px solid #10b981' : '2px dashed #94a3b8'};
                border-radius: 12px;
                padding: 20px;
                opacity: ${isTerritoryUnlocked ? '1' : '0.8'};
            ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div>
                        <h4 style="font-size:16px; margin:0; color:#0f172a;">${nextConfig.name}</h4>
                        <p style="font-size:13px; color:#64748b; margin:2px 0;">Prochain Local</p>
                    </div>
                    <div style="text-align:right;">
                        <span class="badge" style="background:#dcfce7; color:#166534; font-size:0.8rem;">Cap: ${fmtInt(nextConfig.cap)}</span>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div style="background:#f8fafc; padding:8px; border-radius:6px; text-align:center;">
                        <span style="font-size:0.75rem; color:#64748b;">DÉFENSE</span>
                        <div style="font-weight:bold; color:#0f172a;">${fmtInt(nextConfig.defense)}</div>
                    </div>
                    <div style="background:#f8fafc; padding:8px; border-radius:6px; text-align:center;">
                        <span style="font-size:0.75rem; color:#64748b;">PRIX</span>
                        <div style="font-weight:bold; color:#0f172a;">$${fmtCash(nextConfig.price)}</div>
                    </div>
                </div>
                <button class="primary"
                    style="width:100%; padding:15px; font-weight:bold; ${!isTerritoryUnlocked || !canAfford ? 'background:#cbd5e1; cursor:not-allowed; color:#dc2626; font-size:16px; border:2px solid #dc2626;' : 'background:#10b981; box-shadow:0 4px 10px rgba(16, 185, 129, 0.3);'}"
                    onclick="moveAndUpgrade()"
                    ${(!isTerritoryUnlocked || !canAfford) ? 'disabled' : ''}>
                    ${btnLabel}
                </button>
                ${!isTerritoryUnlocked ? `<p style="font-size:12px; margin-top:10px; color:#dc2626; text-align:center;">🚫 Zone Hostile : Conquérez le territoire d'abord.</p>` : ''}
            </div>
        `;
    }
};

window.updateProgressBars = function () {
    const now = Date.now();
    const deltaTime = 100;
    const seconds = deltaTime / 1000;

    // Active Building Logic
    const building = state.activeBuilding;
    const config = PRODUCTION_PATH[state.productionLevel]; // Get static stats (cap)

    if (!building) return;

    // Initial Limit Check to sync data if needed
    const capacity = config.cap;

    // === PHASE 1: PLANTATION ===
    const plantingSpeed = 0.2 * (1 + (building.botanists || 0));

    if (building.plantingQueue > 0) {
        const currentTotal = (building.plants || 0) + (building.growing || 0) + (building.mature || 0); // Exclude queue for space check? No, physical space.

        if (currentTotal < capacity) {
            building.plantingActive = true;
            building.plantingAcc = (building.plantingAcc || 0) + (plantingSpeed * seconds);
            building.planting = Math.min(building.plantingAcc * 100, 100);

            while (building.plantingAcc >= 1) {
                if (building.plantingQueue > 0 && currentTotal < capacity) {
                    building.plantingQueue--;
                    building.growing = (building.growing || 0) + 1;
                    building.plantingAcc -= 1;
                    building.planting = 0;
                } else {
                    break;
                }
            }
        } else {
            building.plantingActive = false;
            building.planting = 0;
            building.plantingAcc = 0;
        }
    } else {
        building.plantingActive = false;
        building.planting = 0;
        building.plantingAcc = 0;
    }

    // === PHASE 2: CROISSANCE ===
    const growingCount = building.growing || 0;
    const growthTime = 10;
    const growthSpeedBase = 1 / growthTime;
    const lampBonus = 1 + ((building.lamps || 0) * 0.2);

    if (growingCount > 0) {
        building.growingActive = true;
        const totalGrowthRate = growingCount * growthSpeedBase * lampBonus;
        building.growingAcc = (building.growingAcc || 0) + (totalGrowthRate * seconds);

        building.growingProgress = Math.min(building.growingAcc * 100, 100); // Visual naming

        while (building.growingAcc >= 1) {
            if (building.growing > 0) {
                building.growing--;
                building.mature = (building.mature || 0) + 1;
                building.growingAcc -= 1;
                building.growingProgress = 0;
                // updateTotalMaturePlants(); // No longer needed global logic
            } else {
                break;
            }
        }
    } else {
        building.growingActive = false;
        building.growingProgress = 0;
        building.growingAcc = 0;
    }

    // === PHASE 3: RÉCOLTE ===
    const harvestSpeed = 0.2 * (1 + (building.botanists || 0));
    const maxStock = calculateMaxStock();

    if (building.mature > 0) {
        if (state.stockGrams + 10 <= maxStock) {
            building.harvestingActive = true;
            building.harvestAcc = (building.harvestAcc || 0) + (harvestSpeed * seconds);
            building.harvesting = Math.min(building.harvestAcc * 100, 100);

            while (building.harvestAcc >= 1) {
                if (building.mature > 0) {
                    if (state.stockGrams + 10 <= maxStock) {
                        building.mature--;
                        state.stockGrams += 10;
                        state.totalProduction += 10;
                        building.harvestAcc -= 1;
                        building.harvesting = 0;
                        showSeedGainAnimation(10, `active-building-harvest-progress`); // Will need new ID
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
        } else {
            // Stock Full
            building.harvestingActive = false;
            building.harvesting = 0;
            // Update UI label for Full not handled here directly, done in render/updateUI
        }
    } else {
        building.harvestingActive = false;
        building.harvesting = 0;
        building.harvestAcc = 0;
    }

    // Update Visuals (Direct DOM manipulation for smoothness)
    const pBar = el('active-building-planting-progress');
    const gBar = el('active-building-growing-progress');
    const hBar = el('active-building-harvesting-progress');

    if (pBar) { pBar.style.width = `${building.planting}%`; pBar.style.opacity = building.plantingActive ? 1 : 0.3; }
    if (gBar) { gBar.style.width = `${building.growingProgress}%`; gBar.style.opacity = building.growingActive ? 1 : 0.3; }
    if (hBar) { hBar.style.width = `${building.harvesting}%`; hBar.style.opacity = building.harvestingActive ? 1 : 0.3; }

    // Update Text Counts Dynamic
    if (el('active-building-planting-count')) el('active-building-planting-count').innerHTML = `${building.plantingQueue} <small class="muted">(${plantingSpeed.toFixed(1)}/s)</small>`;
    if (el('active-building-growing-count')) el('active-building-growing-count').innerHTML = `${building.growing} <small class="muted">(${(growingCount * growthSpeedBase * lampBonus * 60).toFixed(1)}/m)</small>`;

    const harvestLabel = el('active-building-harvesting-count');
    if (harvestLabel) {
        if (state.stockGrams + 10 > maxStock && building.mature > 0) {
            harvestLabel.innerHTML = `${building.mature} <small style="color:var(--danger)">Stockage plein</small>`;
        } else {
            harvestLabel.innerHTML = `${building.mature} <small class="muted">(${harvestSpeed.toFixed(1)}/s)</small>`;
        }
    }

    if (el('active-building-capacity')) el('active-building-capacity').textContent = `${(building.plants || 0) + (building.growing || 0) + (building.mature || 0) + (building.plantingQueue || 0)} / ${capacity}`;
}

function highlightBar(bar) {
    bar.style.backgroundColor = '#fbbf24';
    setTimeout(() => bar.style.backgroundColor = '', 200);
}

function updateTotalMaturePlants() {
    // SINGLE ACTIVE BUILDING
    state.plants = state.activeBuilding ? state.activeBuilding.mature : 0;
}

function handleAutomaticPlanting() {
    const building = state.activeBuilding;
    const config = PRODUCTION_PATH[state.productionLevel];

    if (building && typeof building.botanists === 'number' && building.botanists > 0 && state.seeds > 0) {
        // Check if planting is already active for this property
        if (!building.plantingActive) {
            // Simplified active check.
            // Actually, we don't start it here, addToPlantingQueue uses plantingQueue.

            const capacity = config.cap;
            const currentTotal = (building.plants || 0) + (building.growing || 0) + (building.mature || 0) + (building.plantingQueue || 0);

            if (currentTotal < capacity) {
                addToPlantingQueue('active', 1); // 1 seed per cycle? or as much as necessary?
                // Original logic: addToPlantingQueue 1

                // Also show visual feedback on seed count?
            }
        }
    }
}

// Supprimé: Fonction de récolte manuelle (harvestProperty)





function handleUnlockTerritory(tid) {
    const t = territories[tid];
    if (!t || state.unlockedTerritories.includes(tid)) return;

    // Check requirements
    if (t.vehicle && t.requiredVehicles) {
        if (!state.fleet[t.vehicle] || state.fleet[t.vehicle].count < t.requiredVehicles) {
            const vName = VEHICLE_STATS[t.vehicle]?.name || t.vehicle;
            showNotification('⚠️ Prérequis', `Vous avez besoin de ${t.requiredVehicles} ${vName} pour accéder à ce marché !`, 'warning');
            return;
        }
    }

    if (state.cash >= t.cost) {
        state.cash -= t.cost;
        trackFinance(t.cost, 'expenses');
        state.unlockedTerritories.push(tid);
        showNotification('🗺️ Territoire débloqué', `${t.name} : Marché maintenant accessible !`, 'success');
        renderTerritoryMap();
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
    }
}
function calculateArmyForce() {
    let force = 0;
    if (state.army) {
        MERCENARIES.forEach(m => {
            force += (state.army[m.id] || 0) * m.force;
        });
    }
    return force;
}

window.renderTerritories = function () {
    // 1. Render Mercenary Shop with SEXY cards
    const mercShop = document.getElementById('mercenaryShop');
    if (mercShop) {
        let html = '<div class="mercenary-list-sexy">';

        MERCENARIES.forEach(merc => {
            const count = state.army[merc.id] || 0;
            const canAfford = state.cash >= merc.price;

            html += `
                <div class="merc-card-sexy ${!canAfford ? 'locked' : ''}">
                    <div class="merc-card-left">
                        <div class="merc-icon-sexy">${merc.icon}</div>
                        <div class="merc-info">
                            <div class="merc-name">${merc.name}</div>
                            <div class="merc-force-display">
                                <span class="force-icon">⚔️</span>
                                <span class="force-value">+${merc.force}</span>
                                <span class="force-label">Force</span>
                            </div>
                        </div>
                    </div>
                    <div class="merc-card-right">
                        <div class="merc-owned">
                            <div class="merc-owned-label">En service</div>
                            <div class="merc-owned-count">${count}</div>
                        </div>
                        <button 
                            onclick="buyMercenary('${merc.id}')" 
                            class="merc-recruit-btn ${!canAfford ? 'locked' : ''}"
                            ${!canAfford ? 'disabled' : ''}
                        >
                            <span class="btn-icon">💰</span>
                            <span class="btn-text">Recruter</span>
                            <span class="btn-price">$${fmtInt(merc.price)}</span>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        mercShop.innerHTML = html;
    }

    // 2. Render Army Force
    if (document.getElementById('totalArmyForce')) document.getElementById('totalArmyForce').textContent = fmtInt(calculateArmyForce()) + ' ⚔️';

    // 2. Render War Map
    const mapContainer = document.getElementById('warMapContainer');
    if (mapContainer) {
        mapContainer.innerHTML = '';
        const nextConfig = PRODUCTION_PATH[state.productionLevel + 1];

        if (!nextConfig) {
            mapContainer.innerHTML = `
                <div class="war-map-empty">
                    <div class="war-empty-icon">🏆</div>
                    <div class="war-empty-title">Monde Conquis !</div>
                    <div class="war-empty-text">Tous les territoires sont sous votre contrôle</div>
                </div>
            `;
            return;
        }

        if (!nextConfig.territory) {
            mapContainer.innerHTML = `
                <div class="war-map-empty">
                    <div class="war-empty-icon">🕊️</div>
                    <div class="war-empty-title">Zone Pacifiée</div>
                    <div class="war-empty-text">Aucun conflit détecté pour le moment</div>
                </div>
            `;
            return;
        }

        const territoryName = nextConfig.territory;
        const defense = nextConfig.defense;
        const isUnlocked = state.unlockedTerritories.includes(territoryName);

        if (isUnlocked) {
            mapContainer.innerHTML = `
                <div class="war-map-secured">
                    <div class="secured-icon">✅</div>
                    <div class="secured-title">${territoryName}</div>
                    <div class="secured-badge">Territoire Sécurisé</div>
                    <div class="secured-text">La voie est libre pour votre expansion</div>
                </div>
            `;
        } else {
            const myForce = calculateArmyForce();
            const successChance = Math.min(100, (myForce / defense) * 100);
            const risk = successChance >= 100 ? 'VICTOIRE ASSURÉE' : (successChance > 50 ? 'RISQUE MODÉRÉ' : 'DANGER EXTRÊME');
            const riskColor = successChance >= 100 ? '#10b981' : (successChance > 50 ? '#f59e0b' : '#ef4444');
            const riskIcon = successChance >= 100 ? '🎯' : (successChance > 50 ? '⚠️' : '☠️');

            mapContainer.innerHTML = `
                <div class="war-territory-card">
                    <div class="war-territory-header">
                        <div class="territory-flag">🏴‍☠️</div>
                        <div class="territory-info">
                            <div class="territory-label">Prochain Territoire</div>
                            <div class="territory-name">${territoryName}</div>
                        </div>
                        <div class="territory-threat">
                            <div class="threat-badge" style="background: ${riskColor};">
                                <span style="margin-right:4px;">${riskIcon}</span>${risk}
                            </div>
                        </div>
                    </div>

                    <!-- Stats Comparison -->
                    <div class="war-stats-grid">
                        <div class="war-stat-enemy">
                            <div class="stat-icon">🛡️</div>
                            <div class="stat-content">
                                <div class="stat-label">Défense Ennemie</div>
                                <div class="stat-value enemy">${fmtInt(defense)}</div>
                            </div>
                        </div>
                        <div class="war-stat-versus">VS</div>
                        <div class="war-stat-player">
                            <div class="stat-icon">⚔️</div>
                            <div class="stat-content">
                                <div class="stat-label">Votre Force</div>
                                <div class="stat-value player">${fmtInt(myForce)}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Victory Progress Bar -->
                    <div class="victory-progress-container">
                        <div class="victory-progress-label">
                            <span>Probabilité de Victoire</span>
                            <span style="font-weight:800;">${successChance.toFixed(0)}%</span>
                        </div>
                        <div class="victory-progress-bar">
                            <div class="victory-progress-fill" style="width:${Math.min(successChance, 100)}%; background:${riskColor};"></div>
                        </div>
                    </div>

                    <!-- Assault Button -->
                    <button class="assault-btn" onclick="attackTerritory()">
                        <span class="assault-icon">🩸</span>
                        <span class="assault-text">LANCER L'ASSAUT</span>
                        <span class="assault-arrow">→</span>
                    </button>
                </div>
            `;
        }
    }
}

window.buyMercenary = function (type) {
    const merc = MERCENARIES.find(m => m.id === type);
    if (!merc) return;

    if (state.cash >= merc.price) {
        state.cash -= merc.price;
        trackFinance(merc.price, 'expenses');
        if (!state.army) state.army = {};
        state.army[type] = (state.army[type] || 0) + 1;
        showNotification('🪖 Recrutement', `${merc.name} a rejoint vos rangs.`, 'success');
        renderTerritories();
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez d\'argent !', 'error');
    }
};

window.attackTerritory = function () {
    const nextConfig = PRODUCTION_PATH[state.productionLevel + 1];
    if (!nextConfig || !nextConfig.territory) return;

    const territoryName = nextConfig.territory;
    const defense = nextConfig.defense;
    const myForce = calculateArmyForce();

    if (myForce >= defense) {
        // WIN
        if (!state.unlockedTerritories.includes(territoryName)) {
            state.unlockedTerritories.push(territoryName);
            showNotification('⚔️ VICTOIRE ÉCLATANTE', `Le territoire "${territoryName}" a été conquis !`, 'success');
            triggerConfetti();
            renderTerritories();
            renderProduction();
            saveGame();
        }
    } else {
        // LOSS
        let losses = 0;
        Object.keys(state.army).forEach(key => {
            const count = state.army[key];
            if (count > 0) {
                const lost = Math.ceil(count * (0.1 + Math.random() * 0.2));
                state.army[key] = Math.max(0, count - lost);
                losses += lost;
            }
        });

        showNotification('💀 DÉFAITE SANGLANTE', `L'attaque a échoué. Vous avez perdu ${losses} hommes.`, 'error');
        renderTerritories();
        updateUI();
    }
};




window.moveAndUpgrade = function () {
    const nextConfig = PRODUCTION_PATH[state.productionLevel + 1];
    if (!nextConfig) return;

    if (state.cash < nextConfig.price) {
        showNotification('💸 Pas assez d\'argent', `Il faut ${fmtCash(nextConfig.price)} pour déménager.`, 'warning');
        return;
    }

    state.cash -= nextConfig.price;
    const currentConfig = PRODUCTION_PATH[state.productionLevel];
    if (currentConfig.trophy) {
        state.collectedTrophies.push({
            name: currentConfig.trophy,
            date: Date.now(),
            from: currentConfig.name
        });
        showNotification('🏆 Trophée Gagné', `Vous avez emporté "${currentConfig.trophy}" !`, 'achievement');
    }

    state.productionLevel++;
    // Reset active building state on move
    state.activeBuilding = {
        plants: 0,
        growing: 0,
        mature: 0,
        plantingQueue: 0,
        botanists: 0,
        lamps: 0
    };

    showNotification('🚚 Déménagement Terminé', `Bienvenue dans : ${nextConfig.name}`, 'levelup');
    saveGame();
    renderProduction();
    renderTerritories();
    if (typeof updateUI === 'function') updateUI();
};
function handlePlantSeed(e) {
    const assetId = e.target.dataset.assetId;
    const planted = addToPlantingQueue(assetId, 1);

    if (planted > 0) {
        const button = e.target;
        const rect = button.getBoundingClientRect();
        const animation = document.createElement('div');
        animation.className = 'planting-animation';
        animation.textContent = '🌱 Planté!';
        animation.style.left = `${rect.left + rect.width / 2}px`;
        animation.style.top = `${rect.top}px`;
        document.body.appendChild(animation);
        setTimeout(() => animation.remove(), 1000);
        updateUI();
    } else {
        showNotification('⚠️ Attention', 'Pas assez de graines ou capacité atteinte!', 'warning');
    }
}

function handlePlantSeed10(e) {
    const assetId = e.target.dataset.assetId;
    const planted = addToPlantingQueue(assetId, 10);

    if (planted > 0) {
        const button = e.target;
        const rect = button.getBoundingClientRect();
        const animation = document.createElement('div');
        animation.className = 'planting-animation';
        animation.textContent = `🌱 ${planted} plantées!`;
        animation.style.left = `${rect.left + rect.width / 2}px`;
        animation.style.top = `${rect.top}px`;
        document.body.appendChild(animation);
        setTimeout(() => animation.remove(), 1000);
        updateUI();
    } else {
        showNotification('⚠️ Attention', 'Pas assez de graines ou capacité atteinte!', 'warning');
    }
}

function handlePlantSeedMax(e) {
    const assetId = e.target.dataset.assetId;
    // Try to plant as many as possible (limited by seeds and capacity via addToPlantingQueue logic if implemented, 
    // but since addToPlantingQueue logic isn't fully visible, we trust it or cap by seeds)
    // Assuming addToPlantingQueue handles capacity check, we pass state.seeds.
    // However, to be cleaner, we should calculate max needed.
    // But simplified: plant all available seeds.
    const planted = addToPlantingQueue(assetId, state.seeds);

    if (planted > 0) {
        const button = e.target;
        const rect = button.getBoundingClientRect();
        const animation = document.createElement('div');
        animation.className = 'planting-animation';
        animation.textContent = `🌱 +${planted}`;
        animation.style.left = `${rect.left + rect.width / 2}px`;
        animation.style.top = `${rect.top}px`;
        document.body.appendChild(animation);
        setTimeout(() => animation.remove(), 1000);
        updateUI();
    } else {
        showNotification('⚠️ Attention', 'Pas assez de graines ou capacité atteinte!', 'warning');
    }
}

function handleHireBotanist(e) {
    const assetId = e.target.dataset.assetId;
    if (state.cash >= 2000) {
        state.cash -= 2000;
        trackFinance(2000, 'expenses');
        state.assets[assetId].botanists++;
        showNotification('✅ Embauche réussie!', 'Un botaniste a été embauché. Plantation automatique activée!', 'success');
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez de cash pour embaucher un botaniste!', 'error');
    }
}

function handleBuyLamp(e) {
    const assetId = e.target.dataset.assetId;
    if (state.cash >= 3000) {
        state.cash -= 3000;
        trackFinance(3000, 'expenses');
        state.assets[assetId].lamps++;
        showNotification('✅ Achat réussi!', 'Lampe UV installée! Production augmentée!', 'success');
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez de cash pour acheter une lampe UV!', 'error');
    }
    // function renderStorageTab() { ... } // MOVED TO UI.JS WHERE IT BELONGS
    // if (fillPercentage > 90) bar.style.background = 'linear-gradient(90deg, #f43f5e, #e11d48)'; // Red warning
    // else bar.style.background = 'linear-gradient(90deg, #06b6d4, #3b82f6)'; // Cyan-Blue
    // }
    // if (document.getElementById('storageFillText')) document.getElementById('storageFillText').textContent = fillPercentage.toFixed(0) + '%';

    // 2. Breakdown Stats
    // const breakdown = state.storageBreakdown || { base: 100, warehouses: 0, production: 0 };
    // if (document.getElementById('statBase')) document.getElementById('statBase').textContent = fmtInt(breakdown.base) + 'g';
    // if (document.getElementById('statWarehouses')) document.getElementById('statWarehouses').textContent = fmtInt(breakdown.warehouses) + 'g';
    // if (document.getElementById('statProduction')) document.getElementById('statProduction').textContent = fmtInt(breakdown.production) + 'g';

    // 3. Render Infrastructure Grid
    // renderStorageGrid();
    // }

    function renderStorageGrid() {
        const grid = document.getElementById('storageGrid');
        if (!grid) return;

        let html = '';
        Object.keys(WAREHOUSES).forEach(type => {
            const config = WAREHOUSES[type];
            const count = state.warehouses[type] || 0;
            const canAfford = state.cash >= config.price;
            const btnColor = canAfford ? '#4f46e5' : '#94a3b8';

            html += `
                        <div class="storage-card">
                            <div style="font-size: 14px; color: #64748b; text-align:right; margin-bottom: -10px;">
                                Possédé(s): <span style="color:#0f172a; font-weight:bold;">${count}</span>
                            </div>
                            
                            <div style="margin: 20px 0 10px 0;">
                                <div class="storage-icon">${config.icon}</div>
                                <h4 style="margin:0; color:#1e293b; font-size: 1.1rem;">${config.name}</h4>
                            </div>

                            <div style="margin-bottom: 20px;">
                                <div style="color: #10b981; font-weight: 700; font-size: 0.9rem; background: #ecfdf5; display: inline-block; padding: 4px 12px; border-radius: 20px;">
                                    +${fmtInt(config.capacity)}g Capacité
                                </div>
                            </div>

                            <button 
                                onclick="buyWarehouse('${type}')"
                                ${canAfford ? '' : 'disabled'}
                                style="
                                    width: 100%;
                                    background-color: ${btnColor};
                                    color: white;
                                    border: none;
                                    padding: 12px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                                    transition: background 0.2s;
                                    font-size: 0.95rem;
                                "
                                onmouseover="this.style.backgroundColor = '${canAfford ? '#4338ca' : '#94a3b8'}'"
                                onmouseout="this.style.backgroundColor = '${btnColor}'"
                            >
                                Acheter $${fmtCash(config.price)}
                            </button>
                        </div>
                     `;
        });
        grid.innerHTML = html;
    }

    function buyWarehouse(type) {
        const config = WAREHOUSES[type];

        if (state.cash >= config.price) {
            state.cash -= config.price;
            trackFinance(config.price, 'expenses');
            state.warehouses[type]++;

            showNotification('✅ Achat entrepôt', `${config.name} acheté ! +${config.capacity}g de capacité`, 'success');
            renderStorageTab();
            updateUI();
        } else {
            showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
        }
    }

    // Expose globally for onclick events
    window.buyWarehouse = buyWarehouse;
    window.renderStorageTab = renderStorageTab;
}

window.plantAllSeeds = function () {
    const building = state.activeBuilding;
    const config = PRODUCTION_PATH[state.productionLevel];

    if (!building || !config) return;

    const capacity = config.cap;
    const currentTotal = (building.plants || 0) + (building.growing || 0) + (building.mature || 0) + (building.plantingQueue || 0);

    const space = capacity - currentTotal;
    if (space <= 0) {
        showNotification('🌱 Plantation', 'Pas de place !', 'warning');
        return;
    }

    const toPlant = Math.min(space, state.seeds);
    if (toPlant > 0) {
        addToPlantingQueue('active', toPlant);
        showNotification('🌱 Plantation', `${toPlant} graines ajoutées à la plantation !`, 'success');
    } else {
        showNotification('🌱 Plantation', 'Pas assez de graines !', 'warning');
    }

    updateDashboard();
};

// Schedule automatic rendering (every 1s)
setInterval(renderStorageTab, 1000);

// ── SEED PURCHASE FUNCTIONS (called via inline onclick in HTML) ──
window.buySeed = function (amount) {
    const cost = amount * 10;
    if (state.cash >= cost) {
        state.seeds += amount;
        state.cash -= cost;
        if (typeof trackFinance === 'function') trackFinance(cost, 'expenses');
        if (amount === 1) {
            showNotification('🌾 Graine achetée', '+1 graine !', 'success');
        } else {
            const maxSeeds = amount === -1 ? Math.floor(state.cash / 10) : amount;
            showNotification('🌾 Graines achetées', `+${maxSeeds} graines !`, 'success');
        }
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez de cash !', 'error');
    }
};

window.buySeedMax = function () {
    const maxSeeds = Math.floor(state.cash / 10);
    if (maxSeeds > 0) {
        const cost = maxSeeds * 10;
        state.seeds += maxSeeds;
        state.cash -= cost;
        if (typeof trackFinance === 'function') trackFinance(cost, 'expenses');
        showNotification('🌾 Graines achetées', `+${maxSeeds} graines !`, 'success');
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez de cash !', 'error');
    }
};

window.handleAutomaticPlanting = function () {
    // Logic for auto-planting (e.g. if botanists are present)
    const building = state.activeBuilding;
    if (!building) return;

    // Check availability of botanists
    const botanistCount = building.botanists || 0;
    if (botanistCount > 0) {
        // Simple logic: plant 1 seed per tick per botanist? 
        // Or check a cooldown?
        // For now, let's just try to plant if there is space and seeds.
        // Assuming 1 botanist plants 1 seed per second (loop is 100ms -> 0.1 ?)
        // Let's make it simpler: constant small chance or rate.

        // Actually, let's reuse plantAllSeeds logic but scaled?
        // No, plantAllSeeds fills everything.
        // Auto-planting usually plants one by one.

        // Logic:
        if (state.seeds > 0) {
            const config = PRODUCTION_PATH[state.productionLevel];
            if (!config) return;
            const capacity = config.cap;
            const currentTotal = (building.plants || 0) + (building.growing || 0) + (building.mature || 0) + (building.plantingQueue || 0);

            if (currentTotal < capacity) {
                // Plant 1 seed
                addToPlantingQueue('active', 1);
            }
        }
    }
};
