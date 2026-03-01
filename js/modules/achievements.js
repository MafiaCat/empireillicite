function getTitleForLevel(level) {
    // Return the title for the highest key <= level
    const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
    for (const k of keys) {
        if (level >= k) return LEVEL_TITLES[k];
    }
    return LEVEL_TITLES[1] || 'Débutant';
}
function checkAchievements() {
    if (!state.achievements || !state.achievements.unlocked) {
        state.achievements = { unlocked: [], points: 0, level: 1 };
    }

    let newUnlocks = [];

    ACHIEVEMENTS.forEach(achievement => {
        // Skip if already unlocked
        if (state.achievements.unlocked.includes(achievement.id)) return;

        // Check condition
        // Check condition dynamically
        let conditionMet = false;
        switch (achievement.type) {
            case 'cash':
                conditionMet = state.cash >= achievement.threshold;
                break;
            case 'totalProd':
                conditionMet = (state.totalProduction || 0) >= achievement.threshold;
                break;
            case 'totalSales':
                conditionMet = (state.financialReport.lifetime.revenue || 0) >= achievement.threshold;
                break;
            case 'level':
                conditionMet = (state.achievements.level || 1) >= achievement.threshold;
                break;
            case 'props':
                let propsCount = 0;
                Object.values(state.assets).forEach(a => {
                    if (a.owned) propsCount += (a.count || 1);
                });
                conditionMet = propsCount >= achievement.threshold;
                break;
            case 'luxury':
                let luxCount = 0;
                Object.keys(state.assets).forEach(id => {
                    const asset = state.assets[id];
                    if (asset.owned) {
                        const def = purchasableAssets.find(pa => pa.id === id);
                        if (def && ['art', 'jewelry', 'car', 'real-estate', 'luxury'].includes(def.type)) {
                            luxCount += (asset.count || 1);
                        }
                    }
                });
                conditionMet = luxCount >= achievement.threshold;
                break;
            default:
                console.warn('Unknown achievement type:', achievement.type);
        }

        if (conditionMet) {
            state.achievements.unlocked.push(achievement.id);
            state.achievements.points += achievement.points;
            newUnlocks.push(achievement);
        }
    });

    // Update level based on points
    const oldLevel = state.achievements.level || 1;
    const newLevel = Math.floor(state.achievements.points / 100) + 1;
    state.achievements.level = newLevel;

    // Show notifications for new unlocks
    newUnlocks.forEach(achievement => {
        showNotification(
            '🏆 Succès Débloqué !',
            `${achievement.name} - +${achievement.points} pts`,
            'achievement'
        );
    });

    // Level up notification
    if (newLevel > oldLevel) {
        // Award Chest
        state.chests = (state.chests || 0) + 1;

        const title = LEVEL_TITLES[newLevel] || `Niveau ${newLevel}`;
        showNotification(
            '⭐ LEVEL UP !',
            `Niveau ${newLevel} atteint ! +1 Coffre 🎁 ! Nouveau titre : ${title}`,
            'levelup'
        );
        if (typeof updateUI === 'function') updateUI();
    }

    // Render if tab is active
    if (document.getElementById('achievements')?.classList.contains('active') ||
        document.getElementById('profil')?.classList.contains('active')) {
        renderAchievements();
    }
}
function renderAchievements() {
    const container = document.getElementById('achievementsList');
    const mobileContainer = document.getElementById('mobileAchievementsList');

    if (!container && !mobileContainer) {
        console.error("No achievement containers found!");
        return;
    }

    // Update level displays
    const level = state.achievements?.level || 1;
    const points = state.achievements?.points || 0;
    const title = LEVEL_TITLES[level] || `Niveau ${level}`;
    const nextLevelPoints = level * 100;
    const currentLevelPoints = (level - 1) * 100;
    const progressToNext = points - currentLevelPoints;
    const pointsNeeded = nextLevelPoints - currentLevelPoints;
    const progressPercent = Math.min((progressToNext / pointsNeeded) * 100, 100);

    // Update all level displays
    ['playerLevel', 'mobileProfileLevel'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = level;
    });
    ['playerTitle', 'mobileProfileTitle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = title;
    });
    ['totalPoints', 'mobileProfileScore'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = points;
    });
    ['xpToNext'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = pointsNeeded - progressToNext;
    });
    ['nextLevelTarget'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = level + 1;
    });

    // Update progress bars
    ['levelProgressBar', 'mobileProfileProgressBar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.width = progressPercent + '%';
    });

    // Group achievements by category
    const categories = {};
    if (typeof ACHIEVEMENTS !== 'undefined') {
        ACHIEVEMENTS.forEach(achievement => {
            if (!categories[achievement.category]) {
                categories[achievement.category] = [];
            }
            categories[achievement.category].push(achievement);
        });
    }

    // Render achievements HTML
    let html = '';
    Object.keys(categories).forEach(category => {
        const achievements = categories[category];
        const unlockedInCategory = achievements.filter(a =>
            state.achievements.unlocked.includes(a.id)
        ).length;

        html += `
                        <div class="achievement-category" style="margin-bottom: 20px;">
                            <h3 style="color: var(--primary); margin-bottom: 10px;">
                                ${category} (${unlockedInCategory}/${achievements.length})
                            </h3>
                            <div class="grid two">
                    `;

        // Sort: unlocked first
        achievements.sort((a, b) => {
            const aUnlocked = state.achievements.unlocked.includes(a.id);
            const bUnlocked = state.achievements.unlocked.includes(b.id);
            if (aUnlocked && !bUnlocked) return -1;
            if (!aUnlocked && bUnlocked) return 1;
            return b.points - a.points;
        });

        achievements.forEach(achievement => {
            const unlocked = state.achievements.unlocked.includes(achievement.id);

            // Icon emoji based on category
            const categoryIcons = {
                'Fortune': '💰',
                'Production': '🌿',
                'Business': '🏢',
                'Trafic': '💼',
                'Collection': '💎',
                'Niveau': '⭐'
            };
            const categoryIcon = categoryIcons[achievement.category] || '🏆';

            html += `
                            <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}" 
                                style="
                                    position: relative;
                                    background: ${unlocked
                    ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'
                    : 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)'};
                                    padding: 20px;
                                    border-radius: 16px;
                                    border: 2px solid ${unlocked ? '#10b981' : '#d1d5db'};
                                    ${unlocked ? 'box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(16, 185, 129, 0.1);' : 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);'}
                                    ${unlocked ? '' : 'opacity: 0.7;'}
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    margin-bottom: 12px;
                                    overflow: hidden;
                                    cursor: ${unlocked ? 'default' : 'not-allowed'};
                                "
                                onmouseover="if(${unlocked}) { this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 32px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.15)'; }"
                                onmouseout="if(${unlocked}) { this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 24px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(16, 185, 129, 0.1)'; }"
                            >
                                ${unlocked ? `
                                    <div style="
                                        position: absolute;
                                        top: -20px;
                                        right: -20px;
                                        width: 80px;
                                        height: 80px;
                                        background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
                                        border-radius: 50%;
                                        pointer-events: none;
                                    "></div>
                                ` : ''}
                                
                                <div style="
                                    display: grid;
                                    grid-template-columns: 60px 1fr 140px;
                                    align-items: center;
                                    gap: 16px;
                                ">
                                    <!-- 1. ICON -->
                                    <div style="
                                        width: 48px;
                                        height: 48px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        background: ${unlocked
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'};
                                        border-radius: 12px;
                                        font-size: 24px;
                                        line-height: 1;
                                        box-shadow: ${unlocked
                    ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                    : '0 2px 6px rgba(0, 0, 0, 0.1)'};
                                        ${unlocked ? '' : 'filter: grayscale(100%); opacity: 0.5;'}
                                    ">
                                        ${unlocked ? categoryIcon : '🔒'}
                                    </div>
                                    
                                    <!-- 2. CONTENT (Title + Desc) -->
                                    <div style="min-width: 0;">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                                            <h4 style="
                                                margin: 0;
                                                font-size: 15px;
                                                font-weight: 700;
                                                color: ${unlocked ? '#065f46' : '#6b7280'};
                                                line-height: 1.3;
                                            ">
                                                ${achievement.name}
                                            </h4>
                                            <span style="
                                                background: ${unlocked
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                    : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'};
                                                color: white;
                                                padding: 3px 8px;
                                                border-radius: 12px;
                                                font-size: 10px;
                                                font-weight: 800;
                                                letter-spacing: 0.5px;
                                                box-shadow: ${unlocked
                    ? '0 2px 6px rgba(251, 191, 36, 0.3)'
                    : '0 1px 3px rgba(0, 0, 0, 0.1)'};
                                                text-transform: uppercase;
                                                white-space: nowrap;
                                            ">
                                                +${achievement.points} pts
                                            </span>
                                        </div>
                                        <p style="
                                            margin: 0;
                                            font-size: 13px;
                                            line-height: 1.4;
                                            color: ${unlocked ? '#047857' : '#9ca3af'};
                                        ">
                                            ${achievement.desc}
                                        </p>
                                    </div>

                                    <!-- 3. STATUS (Right Aligned) -->
                                    <div style="
                                        display: flex;
                                        align-items: center;
                                        justify-content: flex-end;
                                        gap: 8px;
                                        padding-left: ${unlocked ? '0' : '16px'};
                                        border-left: ${unlocked ? 'none' : '1px solid rgba(209, 213, 219, 0.5)'};
                                        height: 48px;
                                    ">
                                        ${unlocked ? '' : `
                                            <span style="font-size: 18px; line-height: 1;">🔒</span>
                                            <span style="
                                                font-size: 13px;
                                                font-weight: 700;
                                                text-transform: uppercase;
                                                letter-spacing: 0.5px;
                                                color: #9ca3af;
                                            ">
                                                Verrouillé
                                            </span>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `;
        });

        html += `
                            </div>
                        </div>
                            `;
    });

    if (container) container.innerHTML = html;
    if (mobileContainer) mobileContainer.innerHTML = html;
}


// Expose globally
window.checkAchievements = checkAchievements;
window.renderAchievements = renderAchievements;
