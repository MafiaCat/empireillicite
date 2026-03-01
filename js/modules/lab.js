
// Helper for element selection
const elLab = (id) => document.getElementById(id);

// --- LAB SYSTEM ---

function renderLabo() {
    const costYield = 1000 * Math.pow(2, state.lab.yieldLevel);
    const costSpace = 2000 * Math.pow(2, state.lab.spaceLevel);
    const costSpeed = 1500 * Math.pow(2.5, state.lab.speedLevel || 0);
    const costQuality = 3000 * Math.pow(3, state.lab.qualityLevel || 0);

    // Update level displays
    if (elLab('labYieldLevel')) elLab('labYieldLevel').textContent = 'Niveau ' + state.lab.yieldLevel;
    if (elLab('labSpaceLevel')) elLab('labSpaceLevel').textContent = 'Niveau ' + state.lab.spaceLevel;
    if (elLab('labSpeedLevel')) elLab('labSpeedLevel').textContent = 'Niveau ' + (state.lab.speedLevel || 0);
    if (elLab('labQualityLevel')) elLab('labQualityLevel').textContent = 'Niveau ' + (state.lab.qualityLevel || 0);

    // Update progress bars (visual representation of level progress)
    const maxLevel = 10; // Arbitrary max for visual purposes
    if (elLab('labYieldProgress')) {
        const yieldPercent = Math.min((state.lab.yieldLevel / maxLevel) * 100, 100);
        elLab('labYieldProgress').style.width = yieldPercent + '%';
    }
    if (elLab('labSpaceProgress')) {
        const spacePercent = Math.min((state.lab.spaceLevel / maxLevel) * 100, 100);
        elLab('labSpaceProgress').style.width = spacePercent + '%';
    }
    if (elLab('labSpeedProgress')) {
        const speedPercent = Math.min(((state.lab.speedLevel || 0) / maxLevel) * 100, 100);
        elLab('labSpeedProgress').style.width = speedPercent + '%';
    }
    if (elLab('labQualityProgress')) {
        const qualityPercent = Math.min(((state.lab.qualityLevel || 0) / maxLevel) * 100, 100);
        elLab('labQualityProgress').style.width = qualityPercent + '%';
    }

    const checkAffordable = (cost, btnId, label) => {
        const btn = elLab(btnId);
        if (btn) {
            btn.className = state.cash >= cost ? 'lab-research-btn' : 'lab-research-btn btn-disabled';
            btn.textContent = `${label} ($${fmtInt(cost)})`;
            btn.onclick = () => upgradeLab(btnId.replace('btnUpgrade', '').toLowerCase()); // e.g. 'Yield' -> 'yield'
        }
    };

    checkAffordable(costYield, 'btnUpgradeYield', 'Rechercher');
    checkAffordable(costSpace, 'btnUpgradeSpace', 'Rechercher');
    checkAffordable(costSpeed, 'btnUpgradeSpeed', 'Rechercher');
    checkAffordable(costQuality, 'btnUpgradeQuality', 'Rechercher');

    // Enhanced boost status display
    const isDouble = Date.now() < (state.boosts.doubleYieldUntil || 0);
    const boostStatus = elLab('activeBoostStatus');
    if (boostStatus) {
        boostStatus.style.display = isDouble ? 'block' : 'none';
        if (isDouble) {
            const mins = Math.ceil(((state.boosts.doubleYieldUntil || 0) - Date.now()) / 60000);
            boostStatus.innerHTML = `<div style="font-size:20px; margin-bottom:8px;">🔥</div><b>RENDEMENT x2 ACTIF</b><div style="font-size:12px; margin-top:4px; opacity:0.9;">${mins} minute${mins > 1 ? 's' : ''} restante${mins > 1 ? 's' : ''}</div>`;
        }
    }
}

function upgradeLab(type) {
    // type is passed as 'yield', 'space', 'speed', 'quality' (lowercase)
    // But my button onclick setup above might need adjustment or hardcoded onclicks in HTML
    let cost = 0;

    if (type === 'yield') {
        cost = 1000 * Math.pow(2, state.lab.yieldLevel);
        if (state.cash >= cost) { state.cash -= cost; state.lab.yieldLevel++; showNotification("Laboratoire", "Génétique améliorée !", "success"); }
        else showNotification("Fonds insuffisants", "Pas assez d'argent.", "error");
    }
    else if (type === 'space') {
        cost = 2000 * Math.pow(2, state.lab.spaceLevel);
        if (state.cash >= cost) { state.cash -= cost; state.lab.spaceLevel++; showNotification("Laboratoire", "Espace optimisé !", "success"); }
        else showNotification("Fonds insuffisants", "Pas assez d'argent.", "error");
    }
    else if (type === 'speed') {
        cost = 1500 * Math.pow(2.5, state.lab.speedLevel || 0);
        if (state.cash >= cost) { state.cash -= cost; state.lab.speedLevel = (state.lab.speedLevel || 0) + 1; showNotification("Laboratoire", "Croissance accélérée !", "success"); }
        else showNotification("Fonds insuffisants", "Pas assez d'argent.", "error");
    }
    else if (type === 'quality') {
        cost = 3000 * Math.pow(3, state.lab.qualityLevel || 0);
        if (state.cash >= cost) { state.cash -= cost; state.lab.qualityLevel = (state.lab.qualityLevel || 0) + 1; showNotification("Laboratoire", "Qualité augmentée !", "success"); }
        else showNotification("Fonds insuffisants", "Pas assez d'argent.", "error");
    }

    renderLabo();
    updateUI();
}

function buyConsumable(type) {
    if (type === 'insta_grow') {
        if (state.building.status !== 'growing' && state.building.status !== 'planting') {
            showNotification("Erreur", "L'usine doit être en production !", "error");
            return;
        }
        if ((state.diamonds || 0) >= 10) {
            state.diamonds -= 10;
            state.building.progress = 100;
            state.building.status = 'ready';
            showNotification("⚡ Pousse Instantanée !", "-10 Diamants", "diamond");
            renderProduction();
            updateUI();
        } else {
            showNotification("Pas assez de diamants", "Il vous faut 10 diamants.", "error");
        }
    } else if (type === 'double_yield') {
        if ((state.diamonds || 0) >= 50) {
            state.diamonds -= 50;
            state.boosts.doubleYieldUntil = Date.now() + (30 * 60 * 1000);
            showNotification("🔥 Rendement x2", "Activé pour 30min ! (-50 Diamants)", "diamond");
            renderLabo();
            updateUI();
        } else {
            showNotification("Pas assez de diamants", "Il vous faut 50 diamants.", "error");
        }
    } else if (type === 'cash_briefcase') {
        if ((state.diamonds || 0) >= 20) {
            state.diamonds -= 20;
            const scalingFactor = Math.max(1, state.productionLevel || 1) * Math.max(1, state.level || 1);
            const cashGain = Math.floor(5000 * scalingFactor * (Math.random() + 0.8));
            state.cash += cashGain;
            showNotification("💼 Mallette d'Argent", `+${fmtInt(cashGain)}$ récupérés !`, "success");
            updateUI();
        } else {
            showNotification("Pas assez de diamants", "Il vous faut 20 diamants.", "error");
        }
    } else if (type === 'premium_briefcase') {
        if ((state.diamonds || 0) >= 60) {
            state.diamonds -= 60;
            const scalingFactor = Math.max(1, state.productionLevel || 1) * Math.max(1, state.level || 1);
            const cashGain = Math.floor(15000 * scalingFactor * (Math.random() + 0.8));
            state.cash += cashGain;

            // Random item roll
            const r = Math.random();
            let itemText = "";
            if (r < 0.4) {
                // 40% chance: 1 hour double yield
                state.boosts.doubleYieldUntil = Math.max(Date.now(), state.boosts.doubleYieldUntil || 0) + (60 * 60 * 1000);
                itemText = "🔥 Boost x2 (1h)";
            } else if (r < 0.8) {
                // 40% chance: Instant Grow
                if (state.building && (state.building.status === 'growing' || state.building.status === 'planting')) {
                    state.building.progress = 100;
                    state.building.status = 'ready';
                }
                itemText = "⚡ Engrais Miracle (Instantané)";
            } else {
                // 20% chance: Diamond refund/jackpot
                const diams = Math.floor(Math.random() * 20) + 10;
                state.diamonds += diams;
                itemText = `💎 +${diams} Diamants`;
            }

            showNotification("🧰 Mallette Premium", `+${fmtInt(cashGain)}$ \n ${itemText}`, "achievement");
            renderProduction();
            renderLabo();
            updateUI();
        } else {
            showNotification("Pas assez de diamants", "Il vous faut 60 diamants.", "error");
        }
    }
}

// Expose globally
window.renderLabo = renderLabo;
window.upgradeLab = upgradeLab;
window.buyConsumable = buyConsumable;
