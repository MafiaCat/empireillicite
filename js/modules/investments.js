// Function renderShopInventory removed to prevent conflict with collection-render.js
function handleAssetPurchase(e) {
    const assetId = e.target.dataset.assetId;
    const asset = purchasableAssets.find(a => a.id === assetId);

    // Safety check: asset might not be found
    if (!asset) {
        console.error("Asset not found:", assetId);
        return;
    }

    const isMultiBuy = ['rental', 'business', 'real-estate'].includes(asset.type);

    // Initialize count if needed
    if (state.assets[assetId] && typeof state.assets[assetId].count === 'undefined') {
        state.assets[assetId].count = 1;
    }
    const currentCount = (state.assets[assetId] && state.assets[assetId].count) || 0;

    // Calculate Price
    let price = asset.price;
    if (isMultiBuy && currentCount > 0) {
        price = Math.floor(asset.price * Math.pow(1.2, currentCount));
    }

    if (state.cash >= price) {
        // Check existing ownership for non-multibuy
        if (!isMultiBuy && state.assets[assetId]) {
            showNotification('⚠️ Erreur', 'Vous avez déjà acheté cet asset!', 'warning');
            return;
        }

        state.cash -= price;
        trackFinance(price, 'expenses');

        if (!state.assets[assetId]) {
            // First purchase init
            state.assets[assetId] = { owned: true, count: 0, plants: 0, limit: asset.bonus, botanists: 0, lamps: 0, growing: 0, mature: 0 };
            // Init progress objects for production assets
            if (asset.type === 'plantLimit') {
                state.propertyProgress[assetId] = { planting: 0, growing: 0, plantingActive: false, growingActive: false, plantingStart: 0, growingStart: 0, harvesting: 0, harvestProgress: 0, harvestingActive: false, harvestingStart: 0 };
                state.plantingQueues[assetId] = 0;
                if (asset.type === 'passiveIncome') state.passiveIncome += asset.bonus;
            }
        }

        // Increment count
        state.assets[assetId].count = (state.assets[assetId].count || 0) + 1;
        const newCount = state.assets[assetId].count;

        showNotification('✅ Achat réussi!', `Vous avez acheté: ${asset.name} (Total: ${newCount})`, 'success');
        updateUI();
    } else {
        showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
    }
}
function handleStockTrade(symbol, action) {
    // Delegate to the robust tradeStock function in finance.js
    // (this function was duplicating broken logic with wrong input IDs)
    if (typeof tradeStock === 'function') {
        tradeStock(symbol, action);
    } else {
        showNotification('❌ Erreur', 'Fonction de trading non disponible', 'error');
    }
}

// Graph update handled by finance.js global function
// function updateCharts() { ... } REMOVED DUPLICATE

// ============================================
// INVESTMENT TABS - PREMIUM RENDERING
// ============================================

/**
 * Main render function for Investment tabs
 * Called when switching to finance/business tab
 */
function renderInvest() {
    // Render all sub-tabs so they're ready when user switches
    // Use safe checks in case functions aren't loaded yet
    if (typeof renderRentalTab === 'function') renderRentalTab();
    if (typeof renderBusinessTab === 'function') renderBusinessTab();
    if (typeof renderStockTab === 'function') renderStockTab();
    if (typeof renderCryptoTab === 'function') renderCryptoTab();
}

// Expose function globally
window.renderInvest = renderInvest;
