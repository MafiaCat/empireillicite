// ============================================
// INVESTMENT RENDERING FUNCTIONS - PREMIUM UI
// ============================================
// This module provides modern rendering functions for investment tabs
console.log(">>> INVEST-RENDER.JS v4 LOADED <<<");

// Helper function for DOM element selection - Renamed to avoid global conflict
const elInvest = (id) => document.getElementById(id);

// Shared vault collect function, exposed globally
window.collectPropertyVault = function (event) {
    const amount = Math.floor(state.propertyVault || 0);
    if (amount <= 0) {
        showNotification('🏦 Coffre-fort', 'Le coffre est vide !', 'info');
        return;
    }
    state.cash += amount;
    state.propertyVault = (state.propertyVault || 0) - amount;
    showNotification('💰 Coffre récupéré', `+${fmtCash(amount)} ajouté à votre portefeuille !`, 'success');

    // Trigger gold coin rain animation from the button
    const btn = event && event.currentTarget ? event.currentTarget : (event && event.target ? event.target : null);
    if (btn && typeof triggerGoldRain === 'function') {
        triggerGoldRain(btn);
    }

    updateUI();
    // Refresh tabs if displayed
    if (typeof renderBusinessTab === 'function') renderBusinessTab();
    if (typeof renderRentalTab === 'function') renderRentalTab();
    if (typeof renderPropertiesTab === 'function') renderPropertiesTab();
};

/**
 * Render Locatif (Rental Properties) Tab
 */
function renderRentalTab() {
    console.log("renderRentalTab called");
    const container = elInvest('rentalAssets');
    console.log("container rentalAssets:", container);
    if (!container) return;

    if (typeof purchasableAssets === 'undefined') {
        console.error("purchasableAssets is Undefined!");
        return;
    }

    // Calculate portfolio stats
    let totalProperties = 0;
    let weeklyIncome = 0;

    purchasableAssets.forEach(asset => {
        if (asset.type === 'rental') {
            const legacyCount = (state.realEstate && state.realEstate[asset.id]) ? state.realEstate[asset.id] : 0;
            const modernCount = (state.assets && state.assets[asset.id] && state.assets[asset.id].count) ? state.assets[asset.id].count : 0;
            const count = Math.max(legacyCount, modernCount);
            if (count > 0) {
                totalProperties += count;
                weeklyIncome += (asset.income || 0) * count;
            }
        }
    });

    // Portfolio Summary Card
    let html = `
        <div class="invest-portfolio-summary rental-card">
            <h3>🏢 Portefeuille Immobilier</h3>
            <div class="invest-portfolio-grid">
                <div class="invest-stat-box">
                    <div class="invest-stat-label">Propriétés</div>
                    <div class="invest-stat-value">${totalProperties}</div>
                </div>
                <div class="invest-stat-box">
                    <div class="invest-stat-label">Revenu/Semaine</div>
                    <div class="invest-stat-value">${fmtCash(weeklyIncome)}</div>
                </div>
            </div>
            <div class="property-vault-card">
                <div class="property-vault-left">
                    <span class="property-vault-icon">🏦</span>
                    <div>
                        <div class="property-vault-label">Coffre-fort</div>
                        <div class="property-vault-amount" id="vaultAmountRental">${fmtCash(Math.floor(state.propertyVault || 0))}</div>
                    </div>
                </div>
                <button class="property-vault-btn" onclick="collectPropertyVault(event)">
                    💵 Récupérer
                </button>
            </div>
        </div>
    `;

    // Available Properties Cards
    const rentalAssets = purchasableAssets.filter(a => a.type === 'rental');

    if (rentalAssets.length === 0) {
        html += '<p class="muted" style="text-align:center; padding:40px;">Aucune propriété disponible.</p>';
    } else {
        html += '<div class="grid two">';

        rentalAssets.forEach(asset => {
            const legacyCount = (state.realEstate && state.realEstate[asset.id]) ? state.realEstate[asset.id] : 0;
            const modernCount = (state.assets && state.assets[asset.id] && state.assets[asset.id].count) ? state.assets[asset.id].count : 0;
            const count = Math.max(legacyCount, modernCount);

            const currentPrice = count > 0
                ? Math.floor(asset.price * Math.pow(1.1, count))
                : asset.price;
            const canAfford = state.cash >= currentPrice;
            const roi = asset.price > 0 ? ((asset.income * 52) / asset.price * 100).toFixed(1) : 0;

            html += `
                <div class="invest-card rental-card">
                    ${count > 0 ? `<div class="invest-card-badge invest-card-owned">Possédé: ${count}</div>` : ''}
                    <div class="invest-card-header">
                        <div class="invest-card-icon">${asset.icon}</div>
                        <div class="invest-card-info">
                            <div class="invest-card-name">${asset.name}</div>
                            <div class="invest-card-desc">${asset.desc || 'Investissement locatif'}</div>
                        </div>
                    </div>
                    <div class="invest-card-stats">
                        <div class="invest-stat-item">
                            <div class="invest-stat-item-label">Revenu/Sem</div>
                            <div class="invest-stat-item-value">${fmtCash(asset.income)}</div>
                        </div>
                        <div class="invest-stat-item">
                            <div class="invest-stat-item-label">ROI Annuel</div>
                            <div class="invest-stat-item-value">${roi}%</div>
                        </div>
                    </div>
                    <button 
                        class="primary buy-asset-refined" 
                        onclick="buyRealEstate('${asset.id}', event)"
                        style="width:100%; padding:14px; font-weight:700; ${!canAfford ? 'opacity:0.5; cursor:not-allowed;' : ''}"
                        ${!canAfford ? 'disabled' : ''}
                    >
                        <span style="font-size:16px;">💰</span> Acheter ${fmtCash(currentPrice)}
                    </button>
                </div>
            `;
        });

        html += '</div>';
    }

    const mainEl = document.querySelector('main');
    const scrollPos = mainEl ? mainEl.scrollTop : 0;

    container.innerHTML = html;

    if (mainEl) mainEl.scrollTop = scrollPos;
}

/**
 * Render Business Tab
 */
function renderBusinessTab() {
    console.log("renderBusinessTab called");
    const container = elInvest('businessAssets');
    console.log("container businessAssets:", container);
    if (!container) return;

    // Calculate portfolio stats
    let totalBusinesses = 0;
    let weeklyRevenue = 0;

    purchasableAssets.forEach(asset => {
        if (asset.type === 'business') {
            const legacyCount = (state.businesses && state.businesses[asset.id]) ? state.businesses[asset.id] : 0;
            const modernCount = (state.assets && state.assets[asset.id] && state.assets[asset.id].count) ? state.assets[asset.id].count : 0;
            const count = Math.max(legacyCount, modernCount);
            if (count > 0) {
                totalBusinesses += count;
                weeklyRevenue += (asset.income || 0) * count;
            }
        }
    });

    // Portfolio Summary Card
    let html = `
        <div class="invest-portfolio-summary business-card">
            <h3>🏭 Portefeuille Business</h3>
            <div class="invest-portfolio-grid">
                <div class="invest-stat-box">
                    <div class="invest-stat-label">Entreprises</div>
                    <div class="invest-stat-value">${totalBusinesses}</div>
                </div>
                <div class="invest-stat-box">
                    <div class="invest-stat-label">Revenu/Semaine</div>
                    <div class="invest-stat-value">${fmtCash(weeklyRevenue)}</div>
                </div>
            </div>
            <div class="property-vault-card">
                <div class="property-vault-left">
                    <span class="property-vault-icon">🏦</span>
                    <div>
                        <div class="property-vault-label">Coffre-fort</div>
                        <div class="property-vault-amount" id="vaultAmountBusiness">${fmtCash(Math.floor(state.propertyVault || 0))}</div>
                    </div>
                </div>
                <button class="property-vault-btn" onclick="collectPropertyVault(event)">
                    💵 Récupérer
                </button>
            </div>
        </div>
    `;

    // Available Businesses Cards
    const businessAssets = purchasableAssets.filter(a => a.type === 'business');

    if (businessAssets.length === 0) {
        html += '<p class="muted" style="text-align:center; padding:40px;">Aucune entreprise disponible.</p>';
    } else {
        html += '<div class="grid two">';

        businessAssets.forEach(asset => {
            const legacyCount = (state.businesses && state.businesses[asset.id]) ? state.businesses[asset.id] : 0;
            const modernCount = (state.assets && state.assets[asset.id] && state.assets[asset.id].count) ? state.assets[asset.id].count : 0;
            const count = Math.max(legacyCount, modernCount);

            const currentPrice = count > 0
                ? Math.floor(asset.price * Math.pow(1.2, count))
                : asset.price;
            const canAfford = state.cash >= currentPrice;
            const roi = asset.price > 0 ? ((asset.income * 52) / asset.price * 100).toFixed(1) : 0;

            html += `
                <div class="invest-card business-card">
                    ${count > 0 ? `<div class="invest-card-badge invest-card-owned">Possédé: ${count}</div>` : ''}
                    <div class="invest-card-header">
                        <div class="invest-card-icon">${asset.icon}</div>
                        <div class="invest-card-info">
                            <div class="invest-card-name">${asset.name}</div>
                            <div class="invest-card-desc">${asset.desc || 'Entreprise lucrative'}</div>
                        </div>
                    </div>
                    <div class="invest-card-stats">
                        <div class="invest-stat-item">
                            <div class="invest-stat-item-label">Revenu/Sem</div>
                            <div class="invest-stat-item-value">${fmtCash(asset.income)}</div>
                        </div>
                        <div class="invest-stat-item">
                            <div class="invest-stat-item-label">ROI Annuel</div>
                            <div class="invest-stat-item-value">${roi}%</div>
                        </div>
                    </div>
                    <button 
                        class="primary buy-asset-refined" 
                        onclick="buyBiz('${asset.id}')"
                        style="width:100%; padding:14px; font-weight:700; ${!canAfford ? 'opacity:0.5; cursor:not-allowed;' : ''}"
                        ${!canAfford ? 'disabled' : ''}
                    >
                        <span style="font-size:16px;">💼</span> Acheter ${fmtCash(currentPrice)}
                    </button>
                </div>
            `;
        });

        html += '</div>';
    }

    const mainEl = document.querySelector('main');
    const scrollPos = mainEl ? mainEl.scrollTop : 0;

    container.innerHTML = html;

    if (mainEl) mainEl.scrollTop = scrollPos;
}

/**
 * Render Stocks (Bourse) Tab with modern trading cards
 */
function renderStockTab() {
    const gridContainer = document.querySelector('#sub-stock .grid.two');
    if (!gridContainer) return;

    // Calculate total portfolio value
    const totalValue = (state.stocks.tech * stockPrices.tech) +
        (state.stocks.pharma * stockPrices.pharma) +
        (state.stocks.energy * stockPrices.energy);

    // Calculate total profit/loss
    let totalGainLoss = 0;
    ['tech', 'pharma', 'energy'].forEach(stock => {
        if (state.stocks[stock] > 0 && state.stocksAvgPrice && state.stocksAvgPrice[stock] > 0) {
            const avgPrice = state.stocksAvgPrice[stock];
            const currentPrice = stockPrices[stock];
            totalGainLoss += (currentPrice - avgPrice) * state.stocks[stock];
        }
    });

    const stocksData = [
        { id: 'tech', name: 'Tech Corp', ticker: 'TECH', icon: '💻' },
        { id: 'pharma', name: 'Pharma Inc', ticker: 'PHAR', icon: '💊' },
        { id: 'energy', name: 'Energy Global', ticker: 'ENRG', icon: '⚡' }
    ];

    // Insert Portfolio Summary before grid
    let summaryHtml = `
        <div class="invest-portfolio-summary stock-card" style="margin-bottom:20px;">
            <h3>📈 Portefeuille Bourse</h3>
            <div class="invest-portfolio-grid">
                <div class="invest-stat-box">
                    <div class="invest-stat-label">Valeur Totale</div>
                    <div class="invest-stat-value">${fmtCash(totalValue)}</div>
                </div>
                <div class="invest-stat-box">
                    <div class="invest-stat-label">P/L Aujourd'hui</div>
                    <div class="invest-stat-value" style="color: ${totalGainLoss >= 0 ? '#10b981' : '#ef4444'}">
                        ${totalGainLoss >= 0 ? '+' : ''}${fmtCash(totalGainLoss)}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove any existing summary
    const existingSummary = gridContainer.parentElement.querySelector('.invest-portfolio-summary');
    if (existingSummary) existingSummary.remove();

    // Insert summary before grid
    gridContainer.insertAdjacentHTML('beforebegin', summaryHtml);

    // Clear and rebuild grid with modern cards
    let html = '';

    stocksData.forEach(stock => {
        const price = stockPrices[stock.id];
        const holdings = state.stocks[stock.id] || 0;
        const holdingsValue = holdings * price;
        const avgPrice = state.stocksAvgPrice && state.stocksAvgPrice[stock.id] ? state.stocksAvgPrice[stock.id] : price;
        const gainLoss = holdings > 0 && avgPrice > 0 ? (price - avgPrice) * holdings : 0;
        const gainLossPercent = avgPrice > 0 ? ((price - avgPrice) / avgPrice * 100).toFixed(2) : 0;
        const isProfit = gainLoss >= 0;

        html += `
            <div class="trading-card-modern stock-card">
                <div class="trading-card-header">
                    <div class="trading-symbol">
                        <div class="trading-icon">${stock.icon}</div>
                        <div class="trading-name">
                            <h4>${stock.name}</h4>
                            <div class="trading-ticker">${stock.ticker}</div>
                        </div>
                    </div>
                    <div class="trading-price-box">
                        <div class="trading-price" id="stock${stock.name.split(' ')[0]}Price">$${price.toFixed(2)}</div>
                    </div>
                </div>

                <div class="enhanced-chart-container" style="
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 16px 0;
                    border: 1px solid rgba(59, 130, 246, 0.1);
                    box-shadow: inset 0 2px 8px rgba(59, 130, 246, 0.08);
                    height: 140px;
                    position: relative;
                ">
                    <canvas id="stock${stock.name.split(' ')[0]}Chart" class="spark" style="width: 100% !important; height: 100% !important;"></canvas>
                    <div class="chart-filters" data-target="${stock.id}">
                        <button class="chart-filter ${state.chartPeriods && state.chartPeriods[stock.id] === 'J' ? 'active' : (!state.chartPeriods ? 'active' : '')}" data-period="J">J</button>
                        <button class="chart-filter ${state.chartPeriods && state.chartPeriods[stock.id] === 'S' ? 'active' : ''}" data-period="S">S</button>
                        <button class="chart-filter ${state.chartPeriods && state.chartPeriods[stock.id] === 'M' ? 'active' : ''}" data-period="M">M</button>
                    </div>
                </div>

                <div class="holdings-display">
                    <div class="holdings-item">
                        <div class="holdings-label">Actions</div>
                        <div class="holdings-value" id="${stock.id}Holdings">${holdings}</div>
                    </div>
                    <div class="holdings-item">
                        <div class="holdings-label">Valeur</div>
                        <div class="holdings-value" id="${stock.id}Value">${fmtCash(holdingsValue)}</div>
                    </div>
                </div>

                ${holdings > 0 && avgPrice > 0 ? `
                    <div class="profit-loss-indicator ${isProfit ? 'profit' : 'loss'}" id="${stock.id}GainLoss">
                        ${isProfit ? '📈' : '📉'} ${isProfit ? 'Profit' : 'Perte'}: ${isProfit ? '+' : ''}${fmtCash(gainLoss)} (${gainLossPercent}%)
                    </div>
                ` : `<div id="${stock.id}GainLoss" style="display:none;"></div>`}

                <div class="trading-controls">
                    <input type="number" 
                           id="buy${stock.id}Amount" 
                           data-stock-id="${stock.id}" 
                           placeholder="Quantité d'actions" 
                           min="1" 
                           step="1"
                           class="trading-input">
                    <div class="trade-buttons">
                        <button class="trade-btn trade-btn-buy buy-stock" onclick="tradeStock('${stock.id}', 'buy')" data-stock="${stock.id}">
                            📈 Acheter
                        </button>
                        <button class="trade-btn trade-btn-sell sell-stock" onclick="tradeStock('${stock.id}', 'sell')" data-stock="${stock.id}" ${holdings === 0 ? 'disabled' : ''}>
                            📉 Vendre
                        </button>
                    </div>
                </div>
                <input type="number" id="sell${stock.name.split(' ')[0]}Amount" style="display:none;">
            </div>
        `;
    });

    // Destroy ANY existing charts before wiping the DOM to prevent ghost events
    if (typeof destroyCharts === 'function') destroyCharts();

    const mainEl = document.querySelector('main');
    const scrollPos = mainEl ? mainEl.scrollTop : 0;

    gridContainer.innerHTML = html;

    if (mainEl) mainEl.scrollTop = scrollPos;

    // Initialize charts after DOM is ready
    setTimeout(() => {
        if (typeof initCharts === 'function') {
            initCharts();
        }
    }, 100);
}

/**
 * Render Crypto Tab with modern trading cards
 */
function renderCryptoTab() {
    const container = document.querySelector('#sub-crypto .category-frame');
    if (!container) return;

    // Calculate total portfolio value
    const totalValue = (state.crypto.btc * cryptoPrices.btc) +
        (state.crypto.eth * cryptoPrices.eth) +
        (state.crypto.doge * cryptoPrices.doge);

    // Calculate total profit/loss
    let totalGainLoss = 0;
    ['btc', 'eth', 'doge'].forEach(crypto => {
        if (state.crypto[crypto] > 0 && state.cryptoAvgPrice && state.cryptoAvgPrice[crypto] > 0) {
            const avgPrice = state.cryptoAvgPrice[crypto];
            const currentPrice = cryptoPrices[crypto];
            totalGainLoss += (currentPrice - avgPrice) * state.crypto[crypto];
        }
    });

    const cryptosData = [
        { id: 'btc', name: 'Bitcoin', ticker: 'BTC', icon: '₿' },
        { id: 'eth', name: 'Ethereum', ticker: 'ETH', icon: '⟠' },
        { id: 'doge', name: 'Dogecoin', ticker: 'DOGE', icon: '🐶' }
    ];

    let html = `
        <div class="category-header">
            <h3>₿ Cryptomonnaies</h3>
        </div>
        <div class="invest-portfolio-summary crypto-portfolio-summary" style="margin-bottom:20px;">
            <h3>₿ Portefeuille Crypto</h3>
            <div class="invest-portfolio-grid">
                <div class="invest-stat-box">
                    <div class="invest-stat-label">Valeur Totale</div>
                    <div class="invest-stat-value">${fmtCash(totalValue)}</div>
                </div>
                <div class="invest-stat-box">
                    <div class="invest-stat-label">P/L 24h</div>
                    <div class="invest-stat-value" style="color: ${totalGainLoss >= 0 ? '#10b981' : '#ef4444'}">
                        ${totalGainLoss >= 0 ? '+' : ''}${fmtCash(totalGainLoss)}
                    </div>
                </div>
            </div>
        </div>
        <div class="grid two">
    `;

    cryptosData.forEach(crypto => {
        const price = cryptoPrices[crypto.id];
        const holdings = state.crypto[crypto.id] || 0;
        const holdingsValue = holdings * price;
        const avgPrice = state.cryptoAvgPrice && state.cryptoAvgPrice[crypto.id] ? state.cryptoAvgPrice[crypto.id] : price;
        const gainLoss = holdings > 0 && avgPrice > 0 ? (price - avgPrice) * holdings : 0;
        const gainLossPercent = avgPrice > 0 ? ((price - avgPrice) / avgPrice * 100).toFixed(2) : 0;
        const isProfit = gainLoss >= 0;

        // Quick buy amounts
        const quickAmounts = crypto.id === 'btc' ? [0.01, 0.1, 1] :
            crypto.id === 'eth' ? [0.1, 1, 10] :
                [100, 1000, 10000];

        html += `
            <div class="trading-card-modern crypto-card">
                <div class="trading-card-header">
                    <div class="trading-symbol">
                        <div class="trading-icon">${crypto.icon}</div>
                        <div class="trading-name">
                            <h4>${crypto.name}</h4>
                            <div class="trading-ticker">${crypto.ticker}</div>
                        </div>
                    </div>
                    <div class="trading-price-box">
                        <div class="trading-price" id="${crypto.id}Price">$${price.toFixed(2)}</div>
                    </div>
                </div>

                <div class="enhanced-chart-container" style="
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 16px 0;
                    border: 1px solid rgba(16, 185, 129, 0.1);
                    box-shadow: inset 0 2px 8px rgba(16, 185, 129, 0.08);
                    height: 140px;
                    position: relative;
                ">
                    <canvas id="${crypto.id}Chart" class="spark" style="width: 100% !important; height: 100% !important;"></canvas>
                    <div class="chart-filters" data-target="${crypto.id}">
                        <button class="chart-filter ${state.chartPeriods && state.chartPeriods[crypto.id] === 'J' ? 'active' : (!state.chartPeriods ? 'active' : '')}" data-period="J">J</button>
                        <button class="chart-filter ${state.chartPeriods && state.chartPeriods[crypto.id] === 'S' ? 'active' : ''}" data-period="S">S</button>
                        <button class="chart-filter ${state.chartPeriods && state.chartPeriods[crypto.id] === 'M' ? 'active' : ''}" data-period="M">M</button>
                    </div>
                </div>

                <div class="holdings-display">
                    <div class="holdings-item">
                        <div class="holdings-label">Holdings</div>
                        <div class="holdings-value">
                            <span id="${crypto.id}Holdings">${holdings.toFixed(4)}</span> ${crypto.ticker}
                        </div>
                        <div class="holdings-subtext" id="${crypto.id}Value">${fmtCash(holdingsValue)}</div>
                    </div>
                </div>

                ${holdings > 0 && avgPrice > 0 ? `
                    <div class="profit-loss-indicator ${isProfit ? 'profit' : 'loss'}" id="${crypto.id}GainLoss">
                        ${isProfit ? '🚀' : '📉'} ${isProfit ? 'Profit' : 'Perte'}: ${isProfit ? '+' : ''}${fmtCash(gainLoss)} (${gainLossPercent}%)
                    </div>
                ` : '<div id="${crypto.id}GainLoss" style="display:none;"></div>'}

                <div class="quick-buy-buttons">
                    ${quickAmounts.map(amt => `
                        <button class="quick-buy-btn" onclick="document.getElementById('buy${crypto.name}Amount').value = '${amt}'">
                            ${amt} ${crypto.ticker}
                        </button>
                    `).join('')}
                </div>

                <div class="trading-controls">
                    <input type="number" 
                           id="buy${crypto.name}Amount" 
                           placeholder="Quantité" 
                           min="0.0001" 
                           step="0.0001"
                           class="trading-input">
                    <div class="trade-buttons">
                        <button class="trade-btn trade-btn-buy buy-crypto" onclick="tradeCrypto('${crypto.id}', 'buy')" data-crypto="${crypto.id}">
                            💰 Acheter
                        </button>
                        <button class="trade-btn trade-btn-sell sell-crypto" onclick="tradeCrypto('${crypto.id}', 'sell')" data-crypto="${crypto.id}" ${holdings === 0 ? 'disabled' : ''}>
                            💸 Vendre
                        </button>
                    </div>
                </div>
                <input type="number" id="sell${crypto.name}Amount" style="display:none;">
            </div>
        `;
    });

    html += '</div>';

    const mainEl = document.querySelector('main');
    const scrollPos = mainEl ? mainEl.scrollTop : 0;

    container.innerHTML = html;

    if (mainEl) mainEl.scrollTop = scrollPos;

    // Initialize charts after DOM is ready
    setTimeout(() => {
        if (typeof initCharts === 'function') {
            initCharts();
        }
    }, 100);
}

// Expose functions globally
window.renderRentalTab = renderRentalTab;
window.renderBusinessTab = renderBusinessTab;
window.renderStockTab = renderStockTab;
window.renderCryptoTab = renderCryptoTab;

// ============================================
// PROPERTIES TAB - Owned Assets Showcase
// ============================================
function renderPropertiesTab() {
    console.log('renderPropertiesTab called');
    const container = elInvest('myPropertiesSection');
    if (!container) return;

    if (typeof purchasableAssets === 'undefined') {
        console.error('purchasableAssets is Undefined!');
        return;
    }

    let ownedProperties = [];
    const combinedAssets = {};

    if (state.businesses) {
        Object.entries(state.businesses).forEach(([id, count]) => {
            combinedAssets[id] = count;
        });
    }
    if (state.realEstate) {
        Object.entries(state.realEstate).forEach(([id, count]) => {
            if (!combinedAssets[id]) combinedAssets[id] = 0;
            combinedAssets[id] = Math.max(combinedAssets[id], count);
        });
    }

    if (state.assets) {
        Object.entries(state.assets).forEach(([id, data]) => {
            if (!combinedAssets[id]) combinedAssets[id] = 0;
            const count = typeof data === 'object' ? (data.count || 1) : 1;
            combinedAssets[id] = Math.max(combinedAssets[id], count);
        });
    }

    Object.entries(combinedAssets).forEach(([id, count]) => {
        const asset = purchasableAssets.find(a => a.id === id);
        if (asset && ['real-estate', 'rental', 'business'].includes(asset.type) && count > 0) {
            ownedProperties.push({ ...asset, ownedCount: count });
        }
    });
    console.log("Owned Properties found:", ownedProperties);

    if (ownedProperties.length === 0) {
        container.innerHTML = `
            <div style='text-align:center; padding:60px 20px;'>
                <div style='font-size:64px; margin-bottom:20px; opacity:0.3;'>🏠</div>
                <h3 style='margin:0 0 10px 0; color:var(--text); opacity:0.7;'>Aucune Propriété</h3>
                <p style='margin:0; color:var(--muted); font-size:14px;'>Acquérez des propriétés immobilières pour les voir ici.</p>
            </div>
        `;
        return;
    }

    const totalValue = ownedProperties.reduce((sum, p) => sum + (p.price * p.ownedCount), 0);
    const totalCount = ownedProperties.reduce((sum, p) => sum + p.ownedCount, 0);
    const totalWeeklyIncome = ownedProperties.reduce((sum, p) => sum + ((p.income || 0) * p.ownedCount), 0);
    const totalDailyIncome = totalWeeklyIncome / 7;

    let html = '<div style="padding:10px; box-sizing:border-box; width:100%; max-width:100%;">';
    html += `
        <div style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: white; box-shadow: 0 8px 24px rgba(0,0,0,0.2);'>
            <h3 style='margin:0 0 16px 0; font-size:20px; font-weight:700;'>🏠 Portfolio Immobilier</h3>
            <div style='display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;'>
                <div><div style='font-size:12px; opacity:0.7; margin-bottom:4px;'>Propriétés</div><div style='font-size:28px; font-weight:700;'>`+ totalCount + `</div></div>
                <div><div style='font-size:12px; opacity:0.7; margin-bottom:4px;'>Valeur Totale</div><div style='font-size:28px; font-weight:700; color:#22c55e;'>`+ fmtCash(totalValue) + `</div></div>
                <div><div style='font-size:12px; opacity:0.7; margin-bottom:4px;'>Revenu/Jour</div><div style='font-size:28px; font-weight:700; color:#fde047;'>`+ fmtCash(totalDailyIncome) + `</div></div>
                <div><div style='font-size:12px; opacity:0.7; margin-bottom:4px;'>Revenu/Semaine</div><div style='font-size:28px; font-weight:700; color:#fde047;'>`+ fmtCash(totalWeeklyIncome) + `</div></div>
            </div>
            <div class="property-vault-card" style="margin-top:16px;">
                <div class="property-vault-left">
                    <span class="property-vault-icon">🏦</span>
                    <div>
                        <div class="property-vault-label" style="color:rgba(255,255,255,0.7);">Coffre-fort</div>
                        <div class="property-vault-amount" id="vaultAmountProperties" style="color:#fde047;">${fmtCash(Math.floor(state.propertyVault || 0))}</div>
                    </div>
                </div>
                <button class="property-vault-btn" onclick="collectPropertyVault(event)">
                    💵 Récupérer
                </button>
            </div>
        </div>
    `;

    html += '<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:16px; box-sizing:border-box; width:100%;">';
    ownedProperties.forEach(property => {
        const totalPropertyValue = property.price * property.ownedCount;
        html += `
            <div style='background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; position: relative;' onmouseenter='this.style.transform=\"translateY(-4px)\"; this.style.boxShadow=\"0 8px 20px rgba(0,0,0,0.12)\";' onmouseleave='this.style.transform=\"translateY(0)\"; this.style.boxShadow=\"none\";'>
                `+ (property.ownedCount > 1 ? `<div style='position:absolute; top:12px; right:12px; background:var(--primary); color:white; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:700;'>x` + property.ownedCount + `</div>` : '') + `
                <div style='font-size:48px; text-align:center; margin-bottom:16px;'>`+ property.icon + `</div>
                <h4 style='margin:0 0 8px 0; text-align:center; font-size:17px; font-weight:700;'>`+ property.name + `</h4>
                <p style='margin:0 0 16px 0; text-align:center; font-size:12px; color:var(--muted);'>`+ (property.desc || '') + `</p>
                <div style='border-top: 1px solid var(--border); padding-top:16px;'>
                    <div style='display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;'>
                        <div style='text-align:center; padding:10px; background:var(--bg-secondary); border-radius:8px;'>
                            <div style='font-size:10px; color:var(--muted); margin-bottom:4px;'>Prix Unit.</div>
                            <div style='font-size:14px; font-weight:700; color:var(--primary);'>`+ fmtCash(property.price) + `</div>
                        </div>
                        <div style='text-align:center; padding:10px; background:var(--success); border-radius:8px; color:white;'>
                            <div style='font-size:10px; opacity:0.9; margin-bottom:4px;'>Valeur</div>
                            <div style='font-size:14px; font-weight:700;'>`+ fmtCash(totalPropertyValue) + `</div>
                        </div>
                    </div>
                    <div style='text-align:center; padding:12px; background:var(--bg-secondary); border-radius:8px; font-size:11px; color:var(--success); font-weight:700;'>✓ POSSÉDÉ</div>
                </div>
            </div>
        `;
    });
    html += '</div></div>';
    const mainEl = document.querySelector('main');
    const scrollPos = mainEl ? mainEl.scrollTop : 0;

    container.innerHTML = html;

    if (mainEl) mainEl.scrollTop = scrollPos;
}

window.renderPropertiesTab = renderPropertiesTab;
