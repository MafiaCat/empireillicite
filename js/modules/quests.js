
// Helper for element selection
// Helper for element selection
// const el = (id) => document.getElementById(id); // Removed: Already global in utils.js

// --- DAILY QUESTS SYSTEM ---

function checkDailyQuests() {
    const today = new Date().toDateString();
    if (state.quests.date !== today) {
        state.quests.date = today;
        state.quests.list = [];
        // QUEST_TYPES is in config.js
        let shuffled = [...QUEST_TYPES].sort(() => 0.5 - Math.random()).slice(0, 3);
        shuffled.forEach(q => {
            // Scale target with level?
            // In online_viewer_net: let mult = Math.max(1, state.level + 1);
            // Here we use productionLevel or similar? Let's use productionLevel for now or just 1 if not applicable
            let mult = Math.max(1, (state.productionLevel || 0) + 1);

            state.quests.list.push({
                id: q.id,
                desc: q.desc.replace('{target}', fmtInt(q.base * mult)),
                target: q.base * mult,
                progress: 0,
                reward: q.reward,
                completed: false
            });
        });
        showNotification("📅 Quêtes du jour", "Nouvelles missions disponibles !", "info");
    }
}

function resetDailyQuests() {
    if ((state.diamonds || 0) < 10) {
        showNotification("Diamants Insuffisants", "Il vous faut 10 💎 pour actualiser les quêtes.", "error");
        return;
    }

    // Deduct diamonds
    state.diamonds -= 10;

    // Force new quests by clearing the date
    state.quests.date = "";
    checkDailyQuests();

    // Update the UI
    renderQuests();
    updateUI();

    // Use the same purple achievement color for consistency
    showNotification("Quêtes Actualisées", "-10 💎", "achievement");
}

function updateQuestProgress(type, amount) {
    if (!state.quests || !state.quests.list) return;
    state.quests.list.forEach(q => {
        if (q.id === type && !q.completed) {
            q.progress += amount;
            if (q.progress > q.target) q.progress = q.target;

            // Check instant completion (notify user?)
            if (q.progress >= q.target) {
                // Optional: notify "Quest Ready!"
            }
        }
    });
}

function renderQuests() {
    const container = document.getElementById('questsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!state.quests.list || state.quests.list.length === 0) {
        container.innerHTML = '<div class="text-muted" style="text-align:center; padding:10px;">Aucune quête active</div>';
        return;
    }

    state.quests.list.forEach((q, index) => {
        const isDone = q.progress >= q.target;
        const canClaim = isDone && !q.completed;
        const claimed = q.completed;

        let btnHtml = '';
        if (claimed) {
            btnHtml = `<span class="badge green">Terminé</span>`;
        } else if (canClaim) {
            btnHtml = `<button class="btn-diamond" style="margin:0; padding:6px 12px; font-size:11px; width:auto;" onclick="claimQuest(${index})">Réclamer 💎${q.reward}</button>`;
        } else {
            btnHtml = `<span style="font-size:11px; color:var(--text-muted);">${fmtInt(q.progress)} / ${fmtInt(q.target)}</span>`;
        }

        const progressPct = Math.min(100, (q.progress / q.target) * 100);

        // Using existing styles or inline for now as per online_viewer_net
        container.innerHTML += `
            <div class="card" style="padding:12px; margin-bottom:8px; display:flex; flex-direction:column; gap:8px; opacity: ${claimed ? 0.5 : 1}; ${claimed ? 'filter:grayscale(1);' : ''}">

                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <b style="font-size:12px;">${q.desc}</b>
                    ${btnHtml}
                </div>
                ${!claimed ? `
                <div class="progress-container" style="margin:0; height:6px;">
                    <div class="progress-fill" style="width:${progressPct}%; background:#3b82f6;"></div>
                </div>` : ''}
            </div>`;
    });
}

function claimQuest(index) {
    const q = state.quests.list[index];
    if (q && q.progress >= q.target && !q.completed) {
        q.completed = true;
        state.diamonds = (state.diamonds || 0) + q.reward;
        showNotification(`Quête terminée`, `+${q.reward} 💎`, "achievement"); // Use 'achievement' type for purple color
        updateUI();
        renderQuests();
    }
}

// --- CHESTS & LOOT ---

let pendingLoot = null;

function openChest() {
    if (state.chests > 0) {
        state.chests--;
        const r = Math.random();

        // Loot Table
        if (r < 0.5) {
            // Cash + Small Diamond Drop
            const gain = Math.floor(1000 * (state.productionLevel || 1) * (Math.random() + 0.5));
            const bonusDiams = Math.floor(Math.random() * 3) + 1; // 1 to 3 diamonds
            pendingLoot = {
                type: 'cash_and_diamond',
                value: gain,
                bonusDiams: bonusDiams,
                icon: '🎁',
                text: `+$${fmtInt(gain)} & +${bonusDiams} 💎`
            };
        } else if (r < 0.8) {
            // Pure Diamond Drop
            const diams = Math.floor(Math.random() * 8) + 3;
            pendingLoot = { type: 'diamond', value: diams, icon: '💎', text: '+' + diams + ' Diamants' };
        } else {
            // Boost Drop
            pendingLoot = { type: 'boost', value: 15, icon: '🔥', text: 'Boost x2 (15min)' };
        }

        // Show modal UI
        const modal = document.getElementById('chestModal');
        if (modal) {
            modal.style.display = 'flex';
            const iconAnim = document.getElementById('chestIconAnim');
            const revealDiv = document.getElementById('lootReveal');
            const desc = document.getElementById('lootDesc');

            if (iconAnim) {
                iconAnim.className = 'chest-icon-anim shake';
                iconAnim.textContent = '🎁';
            }
            if (revealDiv) revealDiv.style.display = 'none';

            // Reveal after 1.5s
            setTimeout(() => {
                if (iconAnim) {
                    iconAnim.className = 'chest-icon-anim pop';
                    iconAnim.textContent = pendingLoot.icon;
                    if (typeof triggerConfetti === 'function') triggerConfetti();
                }
                if (desc) {
                    desc.textContent = pendingLoot.text;
                    if (pendingLoot.type === 'diamond') desc.style.color = '#a855f7';
                    else if (pendingLoot.type === 'cash_and_diamond') desc.style.color = '#22c55e';
                    else desc.style.color = '#f97316';
                }
                if (revealDiv) revealDiv.style.display = 'block';
            }, 1500);
        }

        updateUI();
    } else {
        showNotification("Pas de coffre", "Vous n'avez aucun coffre à ouvrir.", "error");
    }
}

function claimLoot(multiplier, diamondCost, isAd) {
    if (!pendingLoot) return;

    if (diamondCost > 0) {
        if ((state.diamonds || 0) < diamondCost) {
            showNotification("Pas assez de diamants !", "Il vous faut plus de diamants.", "error");
            return;
        }
        state.diamonds -= diamondCost;
    }

    if (isAd) {
        showNotification("Publicité", "Simulation de visionnage de pub...", "info");
        setTimeout(() => { applyLoot(multiplier); }, 2000);
        const modal = document.getElementById('chestModal');
        if (modal) modal.style.display = 'none';
        return;
    }

    applyLoot(multiplier);
}

function applyLoot(multiplier) {
    const finalValue = pendingLoot.value * multiplier;

    if (pendingLoot.type === 'cash') { // Legacy fallback just in case
        state.cash += finalValue;
        updateQuestProgress('earn', finalValue);
        showNotification("Gain récupéré", `+$${fmtInt(finalValue)}`, "success");
    } else if (pendingLoot.type === 'cash_and_diamond') {
        state.cash += finalValue;
        const finalDiams = pendingLoot.bonusDiams * multiplier;
        state.diamonds = (state.diamonds || 0) + finalDiams;
        updateQuestProgress('earn', finalValue);
        showNotification("Gain récupéré", `+$${fmtInt(finalValue)} et +${finalDiams} 💎`, "success");
    } else if (pendingLoot.type === 'diamond') {
        state.diamonds = (state.diamonds || 0) + finalValue;
        showNotification("Gain récupéré", `+${finalValue} 💎`, "achievement");
    } else if (pendingLoot.type === 'boost') {
        const currentBoost = Math.max(Date.now(), state.boosts.doubleYieldUntil || 0);
        state.boosts.doubleYieldUntil = currentBoost + (finalValue * 60 * 1000);
        showNotification("Boost activé", `Rendement x2 (${finalValue}min)`, "info");
    }

    pendingLoot = null;
    const modal = document.getElementById('chestModal');
    if (modal) modal.style.display = 'none';

    updateUI();
}

// Expose functions globally for HTML onclicks
window.claimQuest = claimQuest;
window.openChest = openChest;
window.claimLoot = claimLoot;
window.resetDailyQuests = resetDailyQuests;
