
// Helper for element selection
const elTerritory = (id) => document.getElementById(id);

// --- TERRITORIES SYSTEM ---

function renderTerritories() {
    // Update army force display
    const armyForceEl = elTerritory('totalArmyForce');
    if (armyForceEl) {
        let totalForce = 0;
        if (state.army && typeof MERCENARIES !== 'undefined') {
            MERCENARIES.forEach(m => totalForce += (state.army[m.id] || 0) * m.force);
        }
        armyForceEl.textContent = fmtInt(totalForce);
    }

    // 1. Render Mercenary Shop with SEXY cards
    const mercContainer = elTerritory('mercenaryShop');
    if (mercContainer && typeof MERCENARIES !== 'undefined') {
        let html = '<div class="mercenary-list-sexy">';

        MERCENARIES.forEach(m => {
            const owned = state.army ? (state.army[m.id] || 0) : 0;
            const canBuy = state.cash >= m.price;

            html += `
                <div class="merc-card-sexy ${!canBuy ? 'locked' : ''}">
                    <div class="merc-card-left">
                        <div class="merc-icon-sexy">${m.icon}</div>
                        <div class="merc-info">
                            <div class="merc-name">${m.name}</div>
                            <div class="merc-force-display">
                                <span class="force-icon">⚔️</span>
                                <span class="force-value">+${m.force}</span>
                                <span class="force-label">Force</span>
                            </div>
                        </div>
                    </div>
                    <div class="merc-card-right">
                        <div class="merc-owned">
                            <div class="merc-owned-label">En service</div>
                            <div class="merc-owned-count">${owned}</div>
                        </div>
                        <button 
                            onclick="buyMerc('${m.id}')" 
                            class="merc-recruit-btn ${!canBuy ? 'locked' : ''}"
                            ${!canBuy ? 'disabled' : ''}
                        >
                            <span class="btn-icon">💰</span>
                            <span class="btn-text">Recruter</span>
                            <span class="btn-price">$${fmtInt(m.price)}</span>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        mercContainer.innerHTML = html;
    }

    // 2. Render War Map with SEXY territory card
    const nextB = typeof PRODUCTION_PATH !== 'undefined' ? PRODUCTION_PATH[state.productionLevel + 1] : null;
    const warDiv = elTerritory('warMapContainer');

    if (warDiv) {
        if (nextB && nextB.territory && (!state.unlockedTerritories || !state.unlockedTerritories.includes(nextB.territory))) {
            let myForce = 0;
            if (state.army && typeof MERCENARIES !== 'undefined') {
                MERCENARIES.forEach(m => myForce += (state.army[m.id] || 0) * m.force);
            }

            const winChance = Math.min(100, Math.floor((myForce / nextB.defense) * 100));
            const risk = winChance >= 100 ? 'VICTOIRE ASSURÉE' : (winChance > 50 ? 'RISQUE MODÉRÉ' : 'DANGER EXTRÊME');
            const riskColor = winChance >= 100 ? '#10b981' : (winChance > 50 ? '#f59e0b' : '#ef4444');
            const riskIcon = winChance >= 100 ? '🎯' : (winChance > 50 ? '⚠️' : '☠️');

            warDiv.innerHTML = `
                <div class="war-territory-card">
                    <div class="war-territory-header">
                        <div class="territory-flag">🏴‍☠️</div>
                        <div class="territory-info">
                            <div class="territory-label">Prochain Territoire</div>
                            <div class="territory-name">${nextB.territory}</div>
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
                                <div class="stat-value enemy">${fmtInt(nextB.defense)}</div>
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
                            <span style="font-weight:800;">${winChance}%</span>
                        </div>
                        <div class="victory-progress-bar">
                            <div class="victory-progress-fill" style="width:${Math.min(winChance, 100)}%; background:${riskColor};"></div>
                        </div>
                    </div>

                    <!-- Assault Button -->
                    <button class="assault-btn" onclick="attack('${nextB.territory}', ${nextB.defense})">
                        <span class="assault-icon">🩸</span>
                        <span class="assault-text">LANCER L'ASSAUT</span>
                        <span class="assault-arrow">→</span>
                    </button>
                </div>
            `;
        } else if (nextB && (!nextB.territory || (state.unlockedTerritories && state.unlockedTerritories.includes(nextB.territory)))) {
            warDiv.innerHTML = `
                <div class="war-map-secured">
                    <div class="secured-icon">✅</div>
                    <div class="secured-title">${nextB.territory || 'Territoire'}</div>
                    <div class="secured-badge">Territoire Sécurisé</div>
                    <div class="secured-text">Construisez le bâtiment pour débloquer la suite</div>
                </div>
            `;
        } else {
            warDiv.innerHTML = `
                <div class="war-map-empty">
                    <div class="war-empty-icon">🕊️</div>
                    <div class="war-empty-title">Zone Pacifiée</div>
                    <div class="war-empty-text">Pas de cible disponible</div>
                </div>
            `;
        }
    }
}

function buyMerc(id) {
    if (typeof MERCENARIES === 'undefined') return;
    const m = MERCENARIES.find(x => x.id === id);
    if (state.cash >= m.price) {
        state.cash -= m.price;
        if (!state.army) state.army = {};
        state.army[id] = (state.army[id] || 0) + 1;
        showNotification("Recrutement", `Vous avez recruté : ${m.name}`, "success");
        renderTerritories();
        updateUI();
    } else {
        showNotification("Fonds insuffisants", "Pas assez d'argent.", "error");
    }
}

function attack(name, def) {
    let force = 0;
    if (state.army && typeof MERCENARIES !== 'undefined') {
        MERCENARIES.forEach(m => force += (state.army[m.id] || 0) * m.force);
    }

    // Simple RNG based on force
    // online_viewer: force >= def || Math.random() * force > Math.random() * def
    // Let's keep it
    if (force >= def || (Math.random() * force) > (Math.random() * def)) {
        if (!state.territories) state.territories = [];
        if (!state.territories.includes(name)) {
            state.territories.push(name);
            state.xp = (state.xp || 0) + 1000; // Big XP reward

            showNotification("VICTOIRE !", `Territoire ${name} conquis ! +1000 XP`, "success");

            // Unlock building logic? handled in upgradeBuilding() usually
        }
    } else {
        showNotification("DÉFAITE...", "Vos troupes ont été repoussées.", "error");
    }

    renderTerritories();
    // renderProduction() might need update if it shows "Locked"
    if (typeof renderProduction === 'function') renderProduction();
    updateUI();
}

// Expose globally
window.renderTerritories = renderTerritories;
window.buyMerc = buyMerc;
window.attack = attack;
