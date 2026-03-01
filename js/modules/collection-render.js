// ============================================
// COLLECTION RENDERING FUNCTIONS - PREMIUM UI
// ============================================
// This module provides specialized rendering for collection tabs (Cars, Art, Jewelry)
console.log(">>> COLLECTION-RENDER.JS v4 LOADED <<<");

// Helper function for DOM element selection
const elCollection = (id) => document.getElementById(id);

// ============================================
// CARS TAB - Dealership Theme
// ============================================
function renderCarsTab() {
    console.log("renderCarsTab called");
    const container = elCollection('carAssets');
    console.log("container carAssets:", container);
    if (!container) return;

    if (typeof purchasableAssets === 'undefined') {
        console.error("purchasableAssets is Undefined!");
        return;
    }

    const carAssets = purchasableAssets.filter(a => a.type === 'car');

    if (carAssets.length === 0) {
        container.innerHTML = '<p class="muted" style="text-align:center; padding:20px;">Aucune voiture disponible.</p>';
        return;
    }

    let html = '<div class="collection-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:20px; padding:10px;">';

    carAssets.forEach(asset => {
        const isOwned = state.assets && state.assets[asset.id];
        const canAfford = state.cash >= asset.price;

        // Determine tier for badge styling
        let tier = 'Economy';
        let tierColor = '#6b7280';
        if (asset.price >= 200000) { tier = 'Hypercar'; tierColor = '#ef4444'; }
        else if (asset.price >= 100000) { tier = 'Supercar'; tierColor = '#f59e0b'; }
        else if (asset.price >= 50000) { tier = 'Luxury'; tierColor = '#8b5cf6'; }
        else if (asset.price >= 20000) { tier = 'Premium'; tierColor = '#3b82f6'; }

        html += `
            <div class="car-dealership-card" style="
                background: linear-gradient(135deg, rgba(${tierColor === '#ef4444' ? '239,68,68' : tierColor === '#f59e0b' ? '245,158,11' : tierColor === '#8b5cf6' ? '139,92,246' : tierColor === '#3b82f6' ? '59,130,246' : '107,114,128'},0.05) 0%, transparent 100%);
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 20px;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                overflow: hidden;
                ${isOwned ? 'opacity: 0.6; border-color: var(--success);' : ''}
            " ${!isOwned ? `onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)';" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none';"` : ''}>
                
                ${isOwned ? '<div style="position:absolute; top:10px; right:10px; background:var(--success); color:white; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700;">✓ POSSÉDÉ</div>' : ''}
                
                <div style="font-size: 48px; text-align:center; margin-bottom:16px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1));">
                    ${asset.icon}
                </div>
                
                <h4 style="margin:0 0 8px 0; text-align:center; font-size:18px; font-weight:700; color:var(--text);">
                    ${asset.name}
                </h4>
                
                <div style="text-align:center; margin-bottom:16px;">
                    <span style="display:inline-block; padding:4px 12px; background:${tierColor}; color:white; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
                        ${tier}
                    </span>
                </div>
                
                <p style="margin:0 0 16px 0; text-align:center; font-size:13px; color:var(--muted); line-height:1.5; min-height:40px;">
                    ${asset.desc || ''}
                </p>
                
                <div style="padding:12px; background:var(--bg-secondary); border-radius:8px; margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px;">Prix</span>
                        <span style="font-size:18px; font-weight:700; color:${canAfford ? 'var(--primary)' : 'var(--danger)'};">
                            ${fmtCash(asset.price)}
                        </span>
                    </div>
                </div>
                
                ${!isOwned ? `
                    <button 
                        class="primary buy-asset-refined" 
                        onclick="buyAsset('${asset.id}', event)"
                        style="width:100%; padding:14px; font-weight:700; font-size:14px; ${!canAfford ? 'opacity:0.5; cursor:not-allowed;' : ''}"
                        ${!canAfford ? 'disabled' : ''}
                    >
                        ${canAfford ? '🏎️ Acheter' : '🔒 Fonds insuffisants'}
                    </button>
                ` : `
                    <div style="text-align:center; padding:14px; background:var(--success); color:white; border-radius:8px; font-weight:700;">
                        ✓ Dans votre garage
                    </div>
                `}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// ART TAB - Gallery Theme
// ============================================
function renderArtTab() {
    console.log("renderArtTab called");
    const container = elCollection('artAssets');
    console.log("container artAssets:", container);
    if (!container) return;

    if (typeof purchasableAssets === 'undefined') {
        console.error("purchasableAssets is Undefined!");
        return;
    }

    const artAssets = purchasableAssets.filter(a => a.type === 'art');

    if (artAssets.length === 0) {
        container.innerHTML = '<p class="muted" style="text-align:center; padding:20px;">Aucune œuvre disponible.</p>';
        return;
    }

    let html = '<div class="collection-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; padding:10px;">';

    artAssets.forEach(asset => {
        const isOwned = state.assets && state.assets[asset.id];
        const canAfford = state.cash >= asset.price;

        // Determine rarity
        let rarity = 'Print';
        let rarityColor = '#6b7280';
        if (asset.price >= 1000000) { rarity = 'Masterpiece'; rarityColor = '#f59e0b'; }
        else if (asset.price >= 50000) { rarity = 'Original'; rarityColor = '#8b5cf6'; }
        else if (asset.price >= 5000) { rarity = 'Limited'; rarityColor = '#3b82f6'; }

        html += `
            <div class="art-gallery-card" style="
                background: var(--bg);
                border: 2px solid var(--border);
                border-radius: 12px;
                padding: 16px;
                transition: all 0.3s ease;
                position: relative;
                ${isOwned ? 'opacity: 0.6; border-color: var(--success);' : ''}
            " ${!isOwned ? `onmouseenter="this.style.borderColor='var(--primary)'; this.style.transform='scale(1.02)';" onmouseleave="this.style.borderColor='var(--border)'; this.style.transform='scale(1)';"` : ''}>
                
                ${isOwned ? '<div style="position:absolute; top:12px; right:12px; background:var(--success); color:white; padding:4px 10px; border-radius:16px; font-size:10px; font-weight:700;">✓ COLLECTION</div>' : ''}
                
                <div style="
                    padding: 30px;
                    text-align: center;
                    margin-bottom: 16px;
                ">
                    <div style="font-size: 56px;">
                        ${asset.icon}
                    </div>
                </div>
                
                <h4 style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:var(--text); text-align:center;">
                    ${asset.name}
                </h4>
                
                <div style="text-align:center; margin-bottom:12px;">
                    <span style="display:inline-block; padding:3px 10px; background:${rarityColor}; color:white; border-radius:10px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
                        ${rarity}
                    </span>
                </div>
                
                <p style="margin:0 0 16px 0; text-align:center; font-size:12px; color:var(--muted); line-height:1.4; min-height:36px;">
                    ${asset.desc || ''}
                </p>
                
                <div style="padding:10px; background:var(--bg-secondary); border-radius:8px; margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:var(--muted); text-transform:uppercase;">Valeur</span>
                        <span style="font-size:16px; font-weight:700; color:${canAfford ? 'var(--primary)' : 'var(--danger)'};">
                            ${fmtCash(asset.price)}
                        </span>
                    </div>
                </div>
                
                ${!isOwned ? `
                    <button 
                        class="primary buy-asset-refined" 
                        onclick="buyAsset('${asset.id}', event)"
                        style="width:100%; padding:12px; font-weight:700; font-size:13px; ${!canAfford ? 'opacity:0.5; cursor:not-allowed;' : ''}"
                        ${!canAfford ? 'disabled' : ''}
                    >
                        ${canAfford ? '🎨 Acquérir' : '🔒 Fonds insuffisants'}
                    </button>
                ` : `
                    <div style="text-align:center; padding:12px; background:var(--success); color:white; border-radius:8px; font-weight:700; font-size:13px;">
                        ✓ Dans votre collection
                    </div>
                `}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// JEWELRY TAB - Luxury Showcase Theme (REDESIGNED)
// ============================================
function renderJewelryTab() {
    console.log("renderJewelryTab called");
    const container = elCollection('jewelryAssets');
    console.log("container jewelryAssets:", container);
    if (!container) return;

    if (typeof purchasableAssets === 'undefined') {
        console.error("purchasableAssets is Undefined!");
        return;
    }

    const jewelryAssets = purchasableAssets.filter(a => a.type === 'jewelry');

    if (jewelryAssets.length === 0) {
        container.innerHTML = '<p class="muted" style="text-align:center; padding:20px;">Aucun bijou disponible.</p>';
        return;
    }

    let html = '<div class="collection-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; padding:10px;">';

    jewelryAssets.forEach(asset => {
        const isOwned = state.assets && state.assets[asset.id];
        const canAfford = state.cash >= asset.price;

        // Determine luxury tier
        let luxTier = 'Standard';
        let tierColor = '#94a3b8';
        if (asset.price >= 500000) { luxTier = 'Royal'; tierColor = '#fbbf24'; }
        else if (asset.price >= 50000) { luxTier = 'Prestige'; tierColor = '#a78bfa'; }
        else if (asset.price >= 10000) { luxTier = 'Premium'; tierColor = '#60a5fa'; }

        html += `
            <div class="jewelry-display-card" style="
                background: var(--bg);
                border: 2px solid var(--border);
                border-radius: 12px;
                padding: 16px;
                transition: all 0.3s ease;
                position: relative;
                ${isOwned ? 'opacity: 0.6; border-color: var(--success);' : ''}
            " ${!isOwned ? `onmouseenter="this.style.borderColor='${tierColor}'; this.style.transform='scale(1.02)';" onmouseleave="this.style.borderColor='var(--border)'; this.style.transform='scale(1)';"` : ''}>
                
                ${isOwned ? '<div style="position:absolute; top:12px; right:12px; background:var(--success); color:white; padding:4px 10px; border-radius:16px; font-size:10px; font-weight:700;">✓ COFFRE</div>' : ''}
                
                <div style="
                    padding: 30px;
                    text-align: center;
                    margin-bottom: 16px;
                ">
                    <div style="font-size: 56px;">
                        ${asset.icon}
                    </div>
                </div>
                
                <h4 style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:var(--text); text-align:center;">
                    ${asset.name}
                </h4>
                
                <div style="text-align:center; margin-bottom:12px;">
                    <span style="display:inline-block; padding:3px 10px; background:${tierColor}; color:white; border-radius:10px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
                        ${luxTier}
                    </span>
                </div>
                
                <p style="margin:0 0 16px 0; text-align:center; font-size:12px; color:var(--muted); line-height:1.4; min-height:36px;">
                    ${asset.desc || ''}
                </p>
                
                <div style="padding:10px; background:var(--bg-secondary); border-radius:8px; margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:var(--muted); text-transform:uppercase;">Prix</span>
                        <span style="font-size:16px; font-weight:700; color:${canAfford ? 'var(--primary)' : 'var(--danger)'};">
                            ${fmtCash(asset.price)}
                        </span>
                    </div>
                </div>
                
                ${!isOwned ? `
                    <button 
                        class="primary buy-asset-refined" 
                        onclick="buyAsset('${asset.id}', event)"
                        style="width:100%; padding:12px; font-weight:700; font-size:13px; ${!canAfford ? 'opacity:0.5; cursor:not-allowed;' : ''}"
                        ${!canAfford ? 'disabled' : ''}
                    >
                        ${canAfford ? '💎 Acheter' : '🔒 Fonds insuffisants'}
                    </button>
                ` : `
                    <div style="text-align:center; padding:12px; background:var(--success); color:white; border-radius:8px; font-weight:700; font-size:13px;">
                        ✓ Dans votre coffre
                    </div>
                `}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// MY COLLECTIONS TAB - Enhanced Showcase
// ============================================
function renderMyCollections() {
    console.log("renderMyCollections called");
    const container = elCollection('ownedShopAssets');
    if (!container) return;

    if (typeof purchasableAssets === 'undefined') {
        console.error("purchasableAssets is Undefined!");
        return;
    }

    let ownedItems = [];

    if (state.assets) {
        Object.entries(state.assets).forEach(([id, data]) => {
            const asset = purchasableAssets.find(a => a.id === id);
            if (asset && (asset.type === 'car' || asset.type === 'art' || asset.type === 'jewelry')) {
                const count = typeof data === 'object' ? (data.count || 1) : data;
                if (count > 0) {
                    ownedItems.push({ ...asset, ownedCount: count });
                }
            }
        });
    }

    if (ownedItems.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <div style="font-size:64px; margin-bottom:20px; opacity:0.3;">🏛️</div>
                <h3 style="margin:0 0 10px 0; color:var(--text); opacity:0.7;">Collection Vide</h3>
                <p style="margin:0; color:var(--muted); font-size:14px;">Achetez des voitures, œuvres d'art ou bijoux pour commencer votre collection.</p>
            </div>
        `;
        return;
    }

    // Group by type
    const grouped = {
        car: ownedItems.filter(i => i.type === 'car'),
        art: ownedItems.filter(i => i.type === 'art'),
        jewelry: ownedItems.filter(i => i.type === 'jewelry')
    };

    let html = '<div style="padding:10px;">';

    // Summary cards
    html += `
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:30px;">
            <div style="padding:20px; background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius:12px; color:white; text-align:center;">
                <div style="font-size:32px; margin-bottom:8px;">🏎️</div>
                <div style="font-size:28px; font-weight:700; margin-bottom:4px;">${grouped.car.length}</div>
                <div style="font-size:12px; opacity:0.9; text-transform:uppercase; letter-spacing:0.5px;">Voitures</div>
            </div>
            <div style="padding:20px; background:linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius:12px; color:white; text-align:center;">
                <div style="font-size:32px; margin-bottom:8px;">🎨</div>
                <div style="font-size:28px; font-weight:700; margin-bottom:4px;">${grouped.art.length}</div>
                <div style="font-size:12px; opacity:0.9; text-transform:uppercase; letter-spacing:0.5px;">Œuvres d'Art</div>
            </div>
            <div style="padding:20px; background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius:12px; color:white; text-align:center;">
                <div style="font-size:32px; margin-bottom:8px;">💎</div>
                <div style="font-size:28px; font-weight:700; margin-bottom:4px;">${grouped.jewelry.length}</div>
                <div style="font-size:12px; opacity:0.9; text-transform:uppercase; letter-spacing:0.5px;">Bijoux</div>
            </div>
        </div>
    `;

    // All items grid
    html += '<h3 style="margin:0 0 16px 0; font-size:18px; color:var(--text);">📦 Toutes vos acquisitions</h3>';
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:16px;">';

    ownedItems.forEach(item => {
        const typeColor = item.type === 'car' ? '#3b82f6' : item.type === 'art' ? '#8b5cf6' : '#f59e0b';
        const typeLabel = item.type === 'car' ? 'Voiture' : item.type === 'art' ? 'Art' : 'Bijou';
        const totalValue = item.price * item.ownedCount;

        html += `
            <div style="
                background: var(--bg);
                border: 1px solid var(--border);
                border-left: 4px solid ${typeColor};
                border-radius: 10px;
                padding: 16px;
                transition: all 0.3s ease;
            " onmouseenter="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';" onmouseleave="this.style.transform='translateX(0)'; this.style.boxShadow='none';">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <div style="font-size:32px;">${item.icon}</div>
                    <div style="flex:1;">
                        <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:700; color:var(--text);">${item.name}</h4>
                        <div style="font-size:10px; color:${typeColor}; text-transform:uppercase; letter-spacing:0.5px; font-weight:700;">${typeLabel}</div>
                    </div>
                    ${item.ownedCount > 1 ? `<div style="background:${typeColor}; color:white; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700;">x${item.ownedCount}</div>` : ''}
                </div>
                <div style="font-size:11px; color:var(--muted); margin-bottom:8px; line-height:1.4;">${item.desc || ''}</div>
                <div style="padding:8px; background:var(--bg-secondary); border-radius:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:10px; color:var(--muted);">Valeur totale</span>
                        <span style="font-size:13px; font-weight:700; color:var(--primary);">${fmtCash(totalValue)}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div></div>';
    container.innerHTML = html;
}

// Expose functions globally
window.renderCarsTab = renderCarsTab;
window.renderArtTab = renderArtTab;
window.renderJewelryTab = renderJewelryTab;
window.renderMyCollections = renderMyCollections;
