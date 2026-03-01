
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

function buyAsset(id) {
    // Redirect to new system if possible, or keep legacy for non-migrated items
    // For now, we disable legacy buy to prevent confusion
    console.log("Legacy buyAsset called for:", id);

    // If we want to keep it working for verification:
    if (typeof LUXURY === 'undefined') return;
    const i = LUXURY.find(x => x.id === id);

    if (i && state.cash >= i.price) {
        state.cash -= i.price;
        if (!state.assets) state.assets = {};
        state.assets[id] = (state.assets[id] || 0) + 1;

        showNotification("Luxe", `Nouvelle acquisition : ${i.name}`, "diamond");
        // Don't call renderLuxury() which clears the DOM
        if (typeof updateUI === 'function') updateUI();
        if (typeof renderMyCollections === 'function') renderMyCollections(); // Refresh new UI
    }
}

// Expose globally
window.renderLuxury = renderLuxury;
window.buyAsset = buyAsset;
