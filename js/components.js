/**
 * VaultCraft UI Components - View Renderer & Template Generator
 */
class UIComponents {
  // 1. Dashboard Overview Stats
  static renderSummaryCards(store) {
    const totalSavings = store.getTotalSavings();
    const totalTarget = store.getTotalTarget();
    const progressPct = store.getOverallProgress();
    const activePlansCount = store.getPlans('all', 'active').length;
    const monthlyData = store.getMonthlyContributions(2); // compare current month vs last month
    const currentMonthSaved = monthlyData[monthlyData.length - 1]?.amount || 0;
    const lastMonthSaved = monthlyData[monthlyData.length - 2]?.amount || 0;

    const velocityDiff = currentMonthSaved - lastMonthSaved;
    const velocityBadge = velocityDiff >= 0 
      ? `<span class="badge-positive">+${store.currency}${velocityDiff.toLocaleString()} this month</span>`
      : `<span class="badge-negative">-${store.currency}${Math.abs(velocityDiff).toLocaleString()} vs last month</span>`;

    return `
      <div class="summary-card" style="--card-accent: var(--grad-primary);">
        <div class="summary-card-header">
          <span>TOTAL SAVED 💰</span>
          <div class="summary-icon">
            <span style="font-size:1.2rem;">🐷</span>
          </div>
        </div>
        <div class="summary-value">${store.currency}${totalSavings.toLocaleString()}</div>
        <div class="summary-subtext">Overall target: ${store.currency}${totalTarget.toLocaleString()}</div>
      </div>

      <div class="summary-card" style="--card-accent: var(--grad-accent);">
        <div class="summary-card-header">
          <span>MY GOAL PROGRESS 🎯</span>
          <div class="summary-icon" style="color: var(--accent-purple);">
            <span style="font-size:1.2rem;">🏆</span>
          </div>
        </div>
        <div class="summary-value">${progressPct.toFixed(0)}%</div>
        <div class="summary-subtext">${activePlansCount} Active Savings Goals</div>
      </div>

      <div class="summary-card" style="--card-accent: var(--grad-amber);">
        <div class="summary-card-header">
          <span>SAVED THIS MONTH 📅</span>
          <div class="summary-icon" style="color: var(--accent-amber);">
            <span style="font-size:1.2rem;">🌟</span>
          </div>
        </div>
        <div class="summary-value">${store.currency}${currentMonthSaved.toLocaleString()}</div>
        <div class="summary-subtext">${velocityBadge}</div>
      </div>
    `;
  }

  // 2. Savings Plan Cards Grid
  static renderPlanCard(plan, store) {
    const analytics = store.getPlanAnalytics(plan);
    const currency = store.currency;

    let statusBadge = '';
    if (analytics.status === 'completed') {
      statusBadge = `<span class="badge-tag" style="background: rgba(6,182,212,0.15); color: var(--accent-cyan);">🎉 GOAL REACHED!</span>`;
    } else if (analytics.status === 'behind') {
      statusBadge = `<span class="badge-tag" style="background: rgba(245,158,11,0.15); color: var(--accent-amber);">🐢 Almost There</span>`;
    } else {
      statusBadge = `<span class="badge-tag" style="background: rgba(16,185,129,0.15); color: var(--accent-emerald);">🌟 Great Progress!</span>`;
    }

    return `
      <div class="plan-card" style="--plan-color: ${plan.color}; --plan-gradient: ${plan.gradient};">
        <div>
          <div class="plan-card-header">
            <div class="plan-icon-wrap">${plan.icon}</div>
            <div class="plan-actions-menu">
              ${statusBadge}
              <button class="btn btn-outline btn-icon-only btn-sm" onclick="app.openEditPlanModal('${plan.id}')" title="Edit Goal">
                ✏️
              </button>
              <button class="btn btn-outline btn-icon-only btn-sm" onclick="app.deletePlan('${plan.id}')" title="Delete Goal">
                🗑️
              </button>
            </div>
          </div>

          <div class="plan-meta">
            <h3 class="plan-title">${plan.title}</h3>
            <span class="plan-category">${plan.category} • Target Date: ${plan.targetDate}</span>
          </div>

          <div class="plan-progress-info">
            <span class="plan-current-val">${currency}${plan.currentAmount.toLocaleString()}</span>
            <span class="plan-target-val">of ${currency}${plan.targetAmount.toLocaleString()}</span>
          </div>

          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${analytics.percent}%;"></div>
          </div>
        </div>

        <div>
          <div class="plan-stats-footer" style="margin-bottom:0.75rem;">
            <span>${analytics.percent.toFixed(0)}% reached</span>
            <span>${analytics.diffDays} days left ⏳</span>
          </div>

          <!-- Quick Tap Deposit Buttons for Kids -->
          <div style="display:flex; gap:0.4rem; margin-bottom:0.75rem;">
            <button class="chip-btn" style="flex:1; text-align:center; padding:0.35rem 0;" onclick="app.quickAddDeposit('${plan.id}', 5)">+$5 🪙</button>
            <button class="chip-btn" style="flex:1; text-align:center; padding:0.35rem 0;" onclick="app.quickAddDeposit('${plan.id}', 10)">+$10 💵</button>
            <button class="chip-btn" style="flex:1; text-align:center; padding:0.35rem 0;" onclick="app.quickAddDeposit('${plan.id}', 20)">+$20 💵</button>
          </div>

          <div class="plan-card-footer">
            <button class="btn btn-primary btn-sm" onclick="app.openDepositModal('${plan.id}', 'deposit')">
              + Add Custom $
            </button>
            <button class="btn btn-outline btn-sm" onclick="app.openDepositModal('${plan.id}', 'withdrawal')">
              Take Out $
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Ledger Table
  static renderLedgerRows(transactions, store) {
    if (!transactions || transactions.length === 0) {
      return `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No savings records found yet. Click "+ Add Money" to add your first deposit! 💵
          </td>
        </tr>
      `;
    }

    return transactions.map(tx => {
      const plan = store.getPlanById(tx.planId);
      const isDeposit = tx.type === 'deposit';
      const typeBadge = isDeposit
        ? `<span class="tx-badge" style="background: rgba(16,185,129,0.15); color: var(--accent-emerald);">+ Added Money</span>`
        : `<span class="tx-badge" style="background: rgba(244,63,94,0.15); color: var(--accent-rose);">- Took Out</span>`;

      return `
        <tr>
          <td>${tx.date}</td>
          <td><strong>${plan ? plan.icon + ' ' + plan.title : 'General'}</strong></td>
          <td>${typeBadge}</td>
          <td class="tx-amount ${isDeposit ? 'tx-deposit' : 'tx-withdrawal'}">
            ${isDeposit ? '+' : '-'}${store.currency}${tx.amount.toLocaleString()}
          </td>
          <td style="color: var(--text-muted); font-size: 0.825rem;">${tx.note || '-'}</td>
          <td style="text-align: right;">
            <button class="btn btn-outline btn-sm btn-icon-only" onclick="app.deleteTransaction('${tx.id}')" title="Delete Record">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

window.UIComponents = UIComponents;
