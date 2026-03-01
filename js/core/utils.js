const fmt = n => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtCrypto = n => `$${n.toLocaleString()}`;

function fmtCash(num) {
    if (num >= 1000000000) {
        return `$${(num / 1000000000).toFixed(1)}Md`;
    }
    if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `$${(num / 1000).toFixed(1)}k`;
    }
    return `$${num.toFixed(2)}`;
}

function fmtMass(grams) {
    if (grams >= 1000000) return (grams / 1000000).toFixed(2) + ' t';
    if (grams >= 1000) return (grams / 1000).toFixed(2) + ' kg';
    return grams.toFixed(1) + ' g';
}

const el = id => document.getElementById(id);
function trackFinance(amount, type) {
    if (!state.financialReport.currentDay) state.financialReport.currentDay = { revenue: 0, expenses: 0 };
    if (!state.financialReport.currentWeek) state.financialReport.currentWeek = { revenue: 0, expenses: 0 };
    if (!state.financialReport.lifetime) state.financialReport.lifetime = { revenue: 0, expenses: 0 };

    state.financialReport.currentDay[type] += amount;
    state.financialReport.currentWeek[type] += amount;
    state.financialReport.lifetime[type] += amount;
}
const fmtInt = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Global Exposure
window.fmt = fmt;
window.fmtCrypto = fmtCrypto;
window.fmtCash = fmtCash;
window.fmtMass = fmtMass;
window.el = el;
window.trackFinance = trackFinance;
window.fmtInt = fmtInt;

// Helper to get title for level (was missing)
window.getTypeForLevel = function (level) {
    if (level < 5) return "Petite Frappe";
    if (level < 10) return "Dealer de Quartier";
    if (level < 20) return "Grossiste Local";
    if (level < 50) return "Parrain";
    return "Kingpin";
};

// Layout jump prevention helper for innerHTML replacement
window.safeSetInnerHTML = function (container, html) {
    if (!container) return;
    const currentHeight = container.getBoundingClientRect().height;
    if (currentHeight > 0) {
        container.style.minHeight = currentHeight + 'px';
    }
    container.innerHTML = html;

    // Give the browser time to paint the new content before releasing the height lock
    setTimeout(() => {
        container.style.minHeight = '';
    }, 50);
};

window.triggerConfetti = function () {
    const colors = ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    for (let i = 0; i < 100; i++) {
        const confetto = document.createElement('div');
        confetto.style.position = 'absolute';
        confetto.style.width = Math.random() * 10 + 5 + 'px';
        confetto.style.height = Math.random() * 5 + 5 + 'px';
        confetto.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetto.style.left = Math.random() * 100 + 'vw';
        confetto.style.top = -10 + 'px';
        confetto.style.opacity = Math.random();
        confetto.style.transform = `rotate(${Math.random() * 360}deg)`;

        const duration = Math.random() * 3 + 2;
        confetto.style.transition = `top ${duration}s ease-out, transform ${duration}s linear, opacity ${duration}s ease-in`;
        container.appendChild(confetto);

        setTimeout(() => {
            confetto.style.top = '110vh';
            confetto.style.transform = `rotate(${Math.random() * 360 + 720}deg)`;
            confetto.style.opacity = '0';
        }, 100);
    }

    setTimeout(() => {
        container.remove();
    }, 5000);
};
