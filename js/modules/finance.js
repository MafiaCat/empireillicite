const elFinance = (id) => document.getElementById(id);

// --- FINANCE & INVESTMENT SYSTEM ---
let cryptoCharts = {};
let stockCharts = {};

// OLD VERSION - Renamed to avoid conflict with new renderInvest() in investments.js
function renderFinanceOld() {
    // Bank
    if (elFinance('bankBalanceDisplay')) elFinance('bankBalanceDisplay').textContent = fmtCash(state.bank || 0);

    // Crypto & Stocks Portfolio Values
    updateFinanceDisplay();

    // Dealers & Armes display update
    if (elFinance('dealerCount')) elFinance('dealerCount').textContent = state.dealerCount || 0;
    if (elFinance('weaponLevel')) elFinance('weaponLevel').textContent = state.weaponLevel || 0;

    // Businesses
    const bizDiv = elFinance('businessList');
    if (bizDiv) {
        bizDiv.innerHTML = '';
        const businesses = typeof purchasableAssets !== 'undefined' ? purchasableAssets.filter(a => a.type === 'business') : [];

        businesses.forEach(b => {
            // Logic adaptation: state.businesses[b.id] tracks count
            const owned = state.businesses ? (state.businesses[b.id] || 0) : 0;
            // Price formula matches config logic or generic
            const cost = Math.floor(b.price * Math.pow(1.15, owned));
            const canBuy = state.cash >= cost;

            bizDiv.innerHTML += `
                <div class="invest-item-card" style="display:flex; justify-content:space-between; align-items:center; padding:20px; margin-bottom:12px; border-radius:16px; background:white; border:1px solid #e2e8f0; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
                    <div style="display:flex; align-items:center; gap:20px;">
                        <div style="font-size:32px; background:#f1f5f9; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:14px;">${b.icon}</div>
                        <div>
                            <h4 style="margin:0; font-size:18px;">${b.name} <span class="badge blue" style="margin-left:8px;">Niv. ${owned}</span></h4>
                            <div style="font-size:12px; color:#64748b; margin-top:4px;">Revenu: +$${fmtInt(owned * b.income)}/s</div>
                        </div>
                    </div>
                    <button class="${canBuy ? 'btn-premium-dark' : 'btn-disabled'}" style="margin:0; padding:12px 20px; font-weight:700;" onclick="buyBiz('${b.id}')">
                        Investir $${fmtInt(cost)}
                    </button>
                </div>`;
        });
    }

    // Real Estate
    const realDiv = elFinance('realEstateList');
    if (realDiv) {
        realDiv.innerHTML = '';
        if (!state.realEstate) state.realEstate = { parking: 0, studio: 0, immeuble: 0 };

        const realEstates = typeof purchasableAssets !== 'undefined' ? purchasableAssets.filter(a => a.type === 'rental' || a.type === 'real-estate') : [];

        realEstates.forEach(r => {
            const owned = state.realEstate[r.id] || 0;
            const cost = Math.floor(r.price * Math.pow(1.1, owned));
            const canBuy = state.cash >= cost;
            // Use income if available (rental), else 0 (real-estate might be just asset)
            const income = r.income || 0;
            const incomeText = income > 0 ? `Loyer: +$${fmtInt(owned * income)}/s` : 'Prestige';

            realDiv.innerHTML += `
                <div class="invest-item-card" style="display:flex; justify-content:space-between; align-items:center; padding:20px; margin-bottom:12px; border-radius:16px; background:white; border:1px solid #e2e8f0; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
                    <div style="display:flex; align-items:center; gap:20px;">
                        <div style="font-size:32px; background:#f1f5f9; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:14px;">${r.icon}</div>
                        <div>
                            <h4 style="margin:0; font-size:18px;">${r.name} <span class="badge green" style="margin-left:8px;">x${owned}</span></h4>
                            <div style="font-size:12px; color:#64748b; margin-top:4px;">${incomeText}</div>
                        </div>
                    </div>
                    <button class="${canBuy ? 'btn-premium-dark' : 'btn-disabled'}" style="margin:0; padding:12px 20px; font-weight:700;" onclick="buyRealEstate('${r.id}')">
                        Acheter $${fmtInt(cost)}
                    </button>
                </div>`;
        });
    }
}

function tradeStock(symbol, action) {
    if (typeof stockPrices === 'undefined') return;
    const price = stockPrices[symbol];

    // Robust input selection using data attribute
    // distinct from ID to avoid any capitalization/formatting issues
    let amountInput = document.querySelector(`input[data-stock-id="${symbol}"]`);

    // Fallback to ID if data attribute lookup fails (legacy compatibility)
    if (!amountInput) {
        amountInput = document.getElementById(`buy${symbol}Amount`);
    }

    if (!amountInput) {
        // Double fallback
        amountInput = document.getElementById(`buy${symbol.charAt(0).toUpperCase() + symbol.slice(1)}Amount`);
    }

    if (!amountInput) {
        console.error(`Input not found for stock: ${symbol}`);
        showNotification('⚠️ Erreur Technique', `Champ de saisie introuvable pour: ${symbol}`, 'error');
        return;
    }

    const amount = parseInt(amountInput.value);

    // Strict validation with DEBUG info
    if (isNaN(amount) || amount <= 0) {
        return showNotification('⚠️ Erreur Quantité', `Valeur lue: "${amountInput.value}" (ID: ${amountInput.id})`, 'warning');
    }

    const totalCost = amount * price;

    if (action === 'buy') {
        if (state.cash >= totalCost) {
            // Init stock state if missing
            if (!state.stocks) state.stocks = { tech: 0, pharma: 0, energy: 0 };
            if (!state.stocksAvgPrice) state.stocksAvgPrice = { tech: 0, pharma: 0, energy: 0 };

            const currentTotal = (state.stocks[symbol] || 0) * (state.stocksAvgPrice[symbol] || price);
            const newTotal = currentTotal + totalCost;
            const newQuantity = (state.stocks[symbol] || 0) + amount;

            state.cash -= totalCost;
            trackFinance(totalCost, 'expenses');
            state.stocks[symbol] = newQuantity;
            state.stocksAvgPrice[symbol] = newQuantity > 0 ? newTotal / newQuantity : 0;
            amountInput.value = '';
            showNotification('📈 Achat actions', `Acheté ${amount} actions ${symbol.toUpperCase()}`, 'success');
            updateUI();
        } else {
            showNotification('❌ Erreur', 'Pas assez de cash!', 'error');
        }
    } else {
        if (state.stocks && state.stocks[symbol] >= amount) {
            const revenue = amount * price;
            state.cash += revenue;
            trackFinance(revenue, 'revenue');
            state.stocks[symbol] -= amount;
            if (state.stocks[symbol] <= 0) {
                state.stocks[symbol] = 0;
                state.stocksAvgPrice[symbol] = 0;
            }
            amountInput.value = '';
            showNotification('💰 Vente actions', `Vendu ${amount} actions ${symbol.toUpperCase()}`, 'success');
            updateUI();
        } else {
            showNotification('❌ Erreur', 'Pas assez d\'actions!', 'error');
        }
    }
}

function tradeCrypto(symbol, action) {
    if (typeof cryptoPrices === 'undefined') return;
    const price = cryptoPrices[symbol];
    const inputId = action === 'buy' ? `${symbol}BuyAmount` : `${symbol}SellAmount`;
    const input = document.getElementById(inputId);
    if (!input) return;
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) return showNotification('⚠️ Attention', 'Montant invalide', 'warning');

    const totalCost = amount * price;

    if (action === 'buy') {
        if (state.cash >= totalCost) {
            state.cash -= totalCost;
            if (!state.crypto) state.crypto = { btc: 0, eth: 0, doge: 0 };
            if (!state.cryptoAvgPrice) state.cryptoAvgPrice = { btc: 0, eth: 0, doge: 0 };

            const currentTotal = state.crypto[symbol] * (state.cryptoAvgPrice[symbol] || price);
            const newTotal = currentTotal + totalCost;
            const newQuantity = state.crypto[symbol] + amount;

            state.crypto[symbol] = newQuantity;
            state.cryptoAvgPrice[symbol] = newTotal / newQuantity;

            input.value = '';
            showNotification('₿ Crypto', `Acheté ${amount} ${symbol.toUpperCase()}`, 'success');
            updateUI();
        } else {
            showNotification('❌ Erreur', 'Fonds insuffisants', 'error');
        }
    } else {
        if (state.crypto && state.crypto[symbol] >= amount) {
            const revenue = amount * price;
            state.cash += revenue;
            state.crypto[symbol] -= amount;
            if (state.crypto[symbol] === 0) state.cryptoAvgPrice[symbol] = 0;
            input.value = '';
            showNotification('₿ Crypto', `Vendu ${amount} ${symbol.toUpperCase()}`, 'success');
            updateUI();
        } else {
            showNotification('❌ Erreur', 'Pas assez de crypto', 'error');
        }
    }
}

function updateFinanceDisplay() {
    // Mises à jour des prix et possession Stocks
    let totalStockVal = 0;
    ['tech', 'pharma', 'energy'].forEach(s => {
        const p = stockPrices[s] || 0;
        const o = state.stocks ? (state.stocks[s] || 0) : 0;
        totalStockVal += o * p;

        if (elFinance(`stock${s.charAt(0).toUpperCase() + s.slice(1)}Price`)) elFinance(`stock${s.charAt(0).toUpperCase() + s.slice(1)}Price`).textContent = '$' + p.toFixed(2);
        if (elFinance(`${s}Holdings`)) elFinance(`${s}Holdings`).textContent = fmtInt(o);
        if (elFinance(`${s}Value`)) elFinance(`${s}Value`).textContent = '$' + (o * p).toFixed(2);

        // Gain/Loss display
        const glEl = elFinance(`${s}GainLoss`);
        if (glEl && o > 0 && state.stocksAvgPrice && state.stocksAvgPrice[s] > 0) {
            const avg = state.stocksAvgPrice[s];
            const perc = ((p - avg) / avg * 100);
            glEl.innerHTML = `<span style="color: ${perc >= 0 ? '#10b981' : '#ef4444'}; font-size: 11px;">(${perc >= 0 ? '+' : ''}${perc.toFixed(1)}%)</span>`;
        } else if (glEl) glEl.innerHTML = '';
    });
    if (elFinance('totalStockValue')) elFinance('totalStockValue').textContent = '$' + fmtInt(totalStockVal);

    // Mises à jour Crypto
    ['btc', 'eth', 'doge'].forEach(c => {
        const p = cryptoPrices[c] || 0;
        const o = state.crypto ? (state.crypto[c] || 0) : 0;

        if (elFinance(`${c}Price`)) elFinance(`${c}Price`).textContent = '$' + p.toFixed(2);
        if (elFinance(`${c}Holdings`)) elFinance(`${c}Holdings`).textContent = o.toFixed(4);
        if (elFinance(`${c}Value`)) elFinance(`${c}Value`).textContent = '$' + (o * p).toFixed(2);

        const glEl = elFinance(`${c}GainLoss`);
        if (glEl && o > 0 && state.cryptoAvgPrice && state.cryptoAvgPrice[c] > 0) {
            const avg = state.cryptoAvgPrice[c];
            const perc = ((p - avg) / avg * 100);
            glEl.innerHTML = `<span style="color: ${perc >= 0 ? '#10b981' : '#ef4444'}; font-size: 11px;">(${perc >= 0 ? '+' : ''}${perc.toFixed(1)}%)</span>`;
        } else if (glEl) glEl.innerHTML = '';
    });
}



function destroyCharts() {
    ['btc', 'eth', 'doge'].forEach(c => {
        if (cryptoCharts[c]) {
            try {
                if (typeof cryptoCharts[c].stop === 'function') cryptoCharts[c].stop();
                cryptoCharts[c].destroy();
            } catch (e) {
                console.warn(`Error destroying crypto chart ${c}`, e);
            }
            cryptoCharts[c] = null;
        }
    });

    ['tech', 'pharma', 'energy'].forEach(s => {
        if (stockCharts[s]) {
            try {
                if (typeof stockCharts[s].stop === 'function') stockCharts[s].stop();
                stockCharts[s].destroy();
            } catch (e) {
                console.warn(`Error destroying stock chart ${s}`, e);
            }
            stockCharts[s] = null;
        }
    });

    // NUCLEAR: Destroy ALL Chart.js instances in memory (catches any ghosts)
    if (typeof Chart !== 'undefined' && Chart.instances) {
        Object.keys(Chart.instances).forEach(id => {
            try { Chart.instances[id].destroy(); } catch (e) { }
        });
    }
}

function initCharts() {
    console.log("[Charts] initCharts() called");
    if (typeof Chart === 'undefined') {
        console.error("[Charts] Chart is undefined!");
        return;
    }
    console.log("[Charts] Chart.js is loaded");

    // Safety: ensure old charts are gone
    destroyCharts();

    // Validate data integrity (fix for 'reading skip' errors)
    // Upgraded constraint to support J/S/M timeframes (2000 max size)
    ['btc', 'eth', 'doge'].forEach(c => {
        if (!Array.isArray(cryptoHistory[c])) {
            cryptoHistory[c] = Array(2000).fill(cryptoPrices[c] || 100);
        } else if (cryptoHistory[c].length < 2000) {
            // Backfill array to 2000 size safely without resetting existing data
            const missing = 2000 - cryptoHistory[c].length;
            cryptoHistory[c] = Array(missing).fill(cryptoHistory[c][0]).concat(cryptoHistory[c]);
        }
    });

    ['tech', 'pharma', 'energy'].forEach(s => {
        if (!Array.isArray(stockHistory[s])) {
            stockHistory[s] = Array(2000).fill(stockPrices[s] || 100);
        } else if (stockHistory[s].length < 2000) {
            // Backfill array to 2000 size safely
            const missing = 2000 - stockHistory[s].length;
            stockHistory[s] = Array(missing).fill(stockHistory[s][0]).concat(stockHistory[s]);
        }
    });

    // Establish default chart periods if not in state
    if (!state.chartPeriods) {
        state.chartPeriods = {
            btc: 'J', eth: 'J', doge: 'J',
            tech: 'J', pharma: 'J', energy: 'J'
        };
    }

    // Initialize button states
    document.querySelectorAll('.chart-filters').forEach(group => {
        const target = group.dataset.target;
        const period = state.chartPeriods[target] || 'J';
        Array.from(group.children).forEach(btn => {
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    });

    // Small delay to ensure layout is computed
    requestAnimationFrame(() => {
        console.log("[Charts] Creating crypto charts...");
        // Create new crypto charts
        ['btc', 'eth', 'doge'].forEach(c => {
            const ctx = document.getElementById(c + 'Chart');
            console.log(`[Charts] Canvas for ${c}:`, !!ctx);
            if (ctx) {
                cryptoCharts[c] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: Array(60).fill(''),
                        datasets: [{
                            data: [...cryptoHistory[c]],
                            borderColor: '#10b981',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            tension: 0.3
                        }]
                    },
                    options: {
                        scales: { x: { display: false }, y: { display: false } },
                        legend: { display: false }, // Chart.js 2.x syntax
                        tooltips: { enabled: false }, // Chart.js 2.x syntax (plural)
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 0 },
                        hover: { mode: null }, // Disable hover interactions
                        events: [] // DISABLE ALL EVENTS
                    }
                });
            }
        });

        // Create new stock charts
        ['tech', 'pharma', 'energy'].forEach(s => {
            const ctx = document.getElementById(`stock${s.charAt(0).toUpperCase() + s.slice(1)}Chart`);
            if (ctx) {
                stockCharts[s] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: Array(60).fill(''),
                        datasets: [{
                            data: [...stockHistory[s]],
                            borderColor: '#3b82f6',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            tension: 0.3
                        }]
                    },
                    options: {
                        scales: { x: { display: false }, y: { display: false } },
                        legend: { display: false }, // Chart.js 2.x syntax
                        tooltips: { enabled: false }, // Chart.js 2.x syntax (plural)
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 0 },
                        hover: { mode: null }, // Disable hover interactions
                        events: [] // DISABLE ALL EVENTS
                    }
                });
            }
        });
    });
}

// Function to sample arrays down to max points
function sampleData(arr, mode) {
    let sliceLen = 144; // J (Day): 144 ticks (8 real hr equivalent assuming 144x10s is too short, but let's say 144)
    if (mode === 'S') sliceLen = 1008; // S (Week): 1008 ticks
    if (mode === 'M') sliceLen = 2000; // M (Month): 2000 ticks

    const slice = arr.slice(-sliceLen);
    const result = [];
    const maxPoints = 60; // Keep Chart.js performant

    if (slice.length <= maxPoints) return slice;

    // Subsample
    const step = slice.length / maxPoints;
    for (let i = 0; i < maxPoints; i++) {
        result.push(slice[Math.floor(i * step)]);
    }
    return result;
}

function updateCharts() {
    ['btc', 'eth', 'doge'].forEach(c => {
        const chart = cryptoCharts[c];
        if (chart && chart.canvas && document.body.contains(chart.canvas)) {
            if (chart.data && chart.data.datasets && chart.data.datasets[0]) {
                const period = state.chartPeriods[c] || 'J';
                const sampled = sampleData(cryptoHistory[c], period);

                chart.data.labels = Array(sampled.length).fill('');
                chart.data.datasets[0].data = sampled;
                try { chart.update({ duration: 0 }); } catch (e) { console.warn('Chart update ignored', e); }
            }
        }
    });
    ['tech', 'pharma', 'energy'].forEach(s => {
        const chart = stockCharts[s];
        if (chart && chart.canvas && document.body.contains(chart.canvas)) {
            if (chart.data && chart.data.datasets && chart.data.datasets[0]) {
                const period = state.chartPeriods[s] || 'J';
                const sampled = sampleData(stockHistory[s], period);

                chart.data.labels = Array(sampled.length).fill('');
                chart.data.datasets[0].data = sampled;
                try { chart.update({ duration: 0 }); } catch (e) { console.warn('Chart update ignored', e); }
            }
        }
    });
}

// Intercept chart filter clicks
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('chart-filter')) {
        const btn = e.target;
        const target = btn.parentElement.dataset.target;
        const period = btn.dataset.period;

        // Update state
        if (!state.chartPeriods) state.chartPeriods = {};
        state.chartPeriods[target] = period;

        // Update UI classes
        Array.from(btn.parentElement.children).forEach(child => child.classList.remove('active'));
        btn.classList.add('active');

        // Force instant chart update
        updateCharts();
    }
});

function updateCryptoPrices() {
    ['btc', 'eth', 'doge'].forEach(c => {
        const vol = c === 'doge' ? 0.03 : 0.01;
        cryptoPrices[c] *= (1 + (Math.random() - 0.5) * vol);
        cryptoPrices[c] = parseFloat(cryptoPrices[c].toFixed(2)); // Force 2 decimals
        cryptoHistory[c].shift();
        cryptoHistory[c].push(cryptoPrices[c]);
    });
    ['tech', 'pharma', 'energy'].forEach(s => {
        stockPrices[s] *= (1 + (Math.random() - 0.5) * 0.015);
        stockPrices[s] = parseFloat(stockPrices[s].toFixed(2)); // Force 2 decimals
        stockHistory[s].shift();
        stockHistory[s].push(stockPrices[s]);
    });
    localStorage.setItem('crypto-prices', JSON.stringify(cryptoPrices));
    localStorage.setItem('crypto-history', JSON.stringify(cryptoHistory));
    localStorage.setItem('stock-prices', JSON.stringify(stockPrices));
    localStorage.setItem('stock-history', JSON.stringify(stockHistory));
    updateFinanceDisplay();
    updateCharts();
}

function hireDealer() {
    const price = 1000 * (Math.pow(1.5, state.dealerCount || 0));
    if (state.cash >= price) {
        state.cash -= price;
        state.dealerCount = (state.dealerCount || 0) + 1;
        trackFinance(price, 'expenses');
        showNotification('🤝 Recrutement', 'Nouveau dealer recruté !', 'success');
        renderFinanceOld();
        updateUI();
    } else showNotification('❌ Erreur', `Prix: $${fmtCash(price)}`, 'error');
}

function buyWeapon() {
    const price = 5000 * (Math.pow(2, state.weaponLevel || 0));
    if (state.cash >= price) {
        state.cash -= price;
        state.weaponLevel = (state.weaponLevel || 0) + 1;
        trackFinance(price, 'expenses');
        showNotification('🔫 Armement', 'Armes améliorées !', 'success');
        renderFinanceOld();
        updateUI();
    } else showNotification('❌ Erreur', `Prix: $${fmtCash(price)}`, 'error');
}

function buyBiz(id, event) {
    const b = purchasableAssets.find(x => x.id === id);
    if (!b) return;

    // Legacy state support
    const ownedLegacy = (state.businesses || {})[id] || 0;

    // Modern state support
    if (!state.assets) state.assets = {};
    if (!state.assets[id]) state.assets[id] = { owned: false, count: 0 };
    const ownedModern = state.assets[id].count || 0;

    const owned = Math.max(ownedLegacy, ownedModern);
    const cost = Math.floor(b.price * Math.pow(1.15, owned));

    if (state.cash >= cost) {
        // --- ANIMATION INTERCEPTION ---
        if (event && event.currentTarget) {
            const btn = event.currentTarget;
            const card = btn.closest('.business-card') || btn.closest('.invest-card');
            if (card) {
                // 1. Button pulse
                btn.classList.add('golden-pulse-btn');
                btn.innerHTML = '✨ Transaction...';

                // 2. Card shockwave & pop
                card.classList.add('golden-shockwave-active');

                // 3. Inject shockwave circle
                const circle = document.createElement('div');
                circle.className = 'golden-shockwave-circle';
                card.appendChild(circle);

                // 4. Wait for animation to finish before actual purchase
                setTimeout(() => {
                    executeBuyBiz(id, b, owned, cost);
                    // Cleanup classes so it can be re-triggered
                    btn.classList.remove('golden-pulse-btn');
                    card.classList.remove('golden-shockwave-active');
                    if (circle.parentNode) circle.parentNode.removeChild(circle);
                }, 600);
                return; // Early return, purchase will happen in setTimeout
            }
        }

        // Fallback for no event/no card found
        executeBuyBiz(id, b, owned, cost);
    } else {
        showNotification("Fonds insuffisants", "Pas assez d'argent.", "error");
    }
}

function executeBuyBiz(id, b, owned, cost) {
    state.cash -= cost;

    // Update Legacy
    if (!state.businesses) state.businesses = {};
    state.businesses[id] = owned + 1;

    // Update Modern
    if (!state.assets[id]) state.assets[id] = {};
    state.assets[id].count = owned + 1;
    state.assets[id].owned = true;

    showNotification("Business", b.name, "success");
    if (typeof renderFinanceOld === 'function') renderFinanceOld();
    if (typeof renderPropertiesTab === 'function') renderPropertiesTab();
    if (typeof renderBusinessTab === 'function') renderBusinessTab();
    updateUI();
}

function buyRealEstate(id, event) {
    const r = purchasableAssets.find(x => x.id === id);
    if (!r) return;

    // Legacy state support
    const ownedLegacy = (state.realEstate || {})[id] || 0;

    // Modern state support
    if (!state.assets) state.assets = {};
    if (!state.assets[id]) state.assets[id] = { owned: false, count: 0 };
    const ownedModern = state.assets[id].count || 0;

    const owned = Math.max(ownedLegacy, ownedModern);
    const cost = Math.floor(r.price * Math.pow(1.1, owned)); // Formula from legacy

    if (state.cash >= cost) {
        // --- ANIMATION INTERCEPTION ---
        if (event && event.currentTarget) {
            const btn = event.currentTarget;
            const card = btn.closest('.rental-card') || btn.closest('.invest-card');
            if (card) {
                // 1. Button pulse
                btn.classList.add('golden-pulse-btn');
                btn.innerHTML = '✨ Transaction...';

                // 2. Card shockwave & pop
                card.classList.add('golden-shockwave-active');

                // 3. Inject shockwave circle
                const circle = document.createElement('div');
                circle.className = 'golden-shockwave-circle';
                card.appendChild(circle);

                // 4. Wait for animation to finish before actual purchase
                setTimeout(() => {
                    executeBuyRealEstate(id, r, owned, cost);
                    // Cleanup classes
                    btn.classList.remove('golden-pulse-btn');
                    card.classList.remove('golden-shockwave-active');
                    if (circle.parentNode) circle.parentNode.removeChild(circle);
                }, 600);
                return; // Early return, purchase will happen in setTimeout
            }
        }

        // Fallback for no event/no card found
        executeBuyRealEstate(id, r, owned, cost);
    } else {
        showNotification("Fonds insuffisants", "Pas assez d'argent.", "error");
    }
}

function executeBuyRealEstate(id, r, owned, cost) {
    state.cash -= cost;

    // Update Legacy
    if (!state.realEstate) state.realEstate = {};
    state.realEstate[id] = owned + 1;

    // Update Modern
    if (!state.assets[id]) state.assets[id] = {};
    state.assets[id].count = owned + 1;
    state.assets[id].owned = true;

    showNotification("Immobilier", r.name, "success");
    if (typeof renderFinanceOld === 'function') renderFinanceOld();
    if (typeof renderPropertiesTab === 'function') renderPropertiesTab();
    if (typeof renderRentalTab === 'function') renderRentalTab();
    updateUI();
}

function bankTransaction(action) {
    const val = parseFloat(elFinance('bankAmount').value);
    if (!val || val <= 0) return;
    if (action === 'deposit') {
        if (state.cash >= val) { state.cash -= val; state.bank = (state.bank || 0) + val; }
    } else {
        if ((state.bank || 0) >= val) { state.bank -= val; state.cash += val; }
    }
    renderFinanceOld(); updateUI();
}

// Global Expose
window.renderFinanceOld = renderFinanceOld;
window.tradeStock = tradeStock;
window.tradeCrypto = tradeCrypto;
window.updateCryptoPrices = updateCryptoPrices;
window.destroyCharts = destroyCharts;
window.initCharts = initCharts;
window.updateCharts = updateCharts;
window.hireDealer = hireDealer;
window.buyWeapon = buyWeapon;
window.buyBiz = buyBiz;
window.buyRealEstate = buyRealEstate;
window.bankTransaction = bankTransaction;
