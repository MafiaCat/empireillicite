
// Helper for element selection
const elAsset = (id) => document.getElementById(id);

// --- ASSETS & LUXURY SYSTEM ---

function renderLuxury() {
    console.log("renderLuxury called - DISABLED in favor of collection-render.js");
    return; // DISABLED

    /* LEGACY CODE DISABLED
    const grid = elAsset('luxuryShop');
    const owned = elAsset('ownedShopAssets');

    if (!grid || !owned) return;

    grid.innerHTML = '';
    owned.innerHTML = '';

    if (typeof LUXURY !== 'undefined') {
        LUXURY.forEach(i => {
            const canBuy = state.cash >= i.price;

            grid.innerHTML += `
                <div class="card" style="text-align:center; padding:15px; display:flex; flex-direction:column; align-items:center; opacity: ${canBuy ? 1 : 0.7}">
                    <div style="font-size:32px; margin-bottom:10px;">${i.icon}</div>
                    <b style="margin-bottom:5px;">${i.name}</b>
                    <div style="font-size:11px; color:var(--muted); margin-bottom:10px;">Prestige +${i.price / 100}</div>
                    <button class="${canBuy ? 'btn-premium-primary' : 'btn-disabled'}" style="width:100%; font-size:12px;" onclick="buyAsset('${i.id}')">
                        Acheter $${fmtInt(i.price)}
                    </button>
                </div>`;
        });

        // Render Owned
        let has = false;
        if (state.assets) {
            Object.entries(state.assets).forEach(([id, c]) => {
                const item = LUXURY.find(x => x.id === id);
                if (item && c > 0) {
                    has = true;
                    // Grouped display
                    owned.innerHTML += `
                        <div class="card" style="padding:10px; display:flex; align-items:center; gap:10px;">
                            <span style="font-size:20px;">${item.icon}</span>
                            <span style="flex:1; font-weight:600;">${item.name}</span>
                            <span class="badge blue">x${c}</span>
                        </div>`;
                }
            });
        }

        if (!has) owned.innerHTML = '<div class="text-muted" style="text-align:center; padding:20px;">Votre collection est vide.</div>';
    }
    */
}

function buyAsset(id, event) {
    if (typeof purchasableAssets === 'undefined') return;
    const i = purchasableAssets.find(x => x.id === id);

    if (i && state.cash >= i.price) {
        // --- ANIMATION INTERCEPTION ---
        if (event && event.currentTarget) {
            const btn = event.currentTarget;

            // 1. Button pulse & rectangle border
            btn.classList.add('golden-pulse-btn');
            btn.innerHTML = '✨ Transaction...';

            // 2. Wait for animation to finish before showing "Approuvé"
            setTimeout(() => {
                btn.classList.remove('golden-pulse-btn');
                btn.classList.add('approved-pulse-btn');
                btn.innerHTML = '✅ Approuvé';

                // Trigger celebratory confetti burst from button 🎊
                if (typeof triggerConfetti === 'function') triggerConfetti(btn);

                // 3. Execute purchase after showing approved state (extended to 1400ms)
                setTimeout(() => {
                    executeBuyAsset(id, i);
                    btn.classList.remove('approved-pulse-btn');
                }, 1400);
            }, 500);
            return;
        }

        // Fallback
        executeBuyAsset(id, i);
    } else {
        showNotification("Fonds insuffisants", "Pas assez d'argent.", "error");
    }
}

function executeBuyAsset(id, i) {
    state.cash -= i.price;
    if (!state.assets) state.assets = {};
    if (!state.assets[id]) state.assets[id] = { owned: false, count: 0 };

    // Most collections are unique, but we increment count just in case
    state.assets[id].count = (state.assets[id].count || 0) + 1;
    state.assets[id].owned = true;

    showNotification("Collection", `Nouvelle acquisition : ${i.name}`, "diamond");

    if (typeof updateUI === 'function') updateUI();
    if (typeof renderMyCollections === 'function') renderMyCollections();
    if (i.type === 'car' && typeof renderCarsTab === 'function') renderCarsTab();
    if (i.type === 'art' && typeof renderArtTab === 'function') renderArtTab();
    if (i.type === 'jewelry' && typeof renderJewelryTab === 'function') renderJewelryTab();
}

// Expose globally
window.renderLuxury = renderLuxury;
window.buyAsset = buyAsset;
