/**
 * VaultCraft Store - State Management & Storage Layer
 */
const STORAGE_KEY = 'vaultcraft_savings_data_v1';

const DEFAULT_PLANS = [
  {
    id: 'plan_1',
    title: 'Emergency Fund',
    category: 'Safety',
    targetAmount: 10000,
    currentAmount: 6450,
    targetDate: '2026-12-31',
    startDate: '2026-01-01',
    icon: '🛡️',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    description: '3 to 6 months of essential living expenses.',
    recurringGoal: 250, // per month
    status: 'active'
  },
  {
    id: 'plan_2',
    title: 'Tokyo & Kyoto Trip',
    category: 'Travel',
    targetAmount: 4500,
    currentAmount: 3100,
    targetDate: '2026-10-15',
    startDate: '2026-02-10',
    icon: '✈️',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    description: 'Flights, accommodations, and ramen budget!',
    recurringGoal: 300,
    status: 'active'
  },
  {
    id: 'plan_3',
    title: 'M3 MacBook Pro',
    category: 'Tech',
    targetAmount: 2400,
    currentAmount: 1950,
    targetDate: '2026-09-30',
    startDate: '2026-04-01',
    icon: '💻',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
    description: 'Workstation upgrade for high-performance development.',
    recurringGoal: 200,
    status: 'active'
  },
  {
    id: 'plan_4',
    title: 'House Down Payment',
    category: 'Real Estate',
    targetAmount: 35000,
    currentAmount: 12800,
    targetDate: '2028-06-30',
    startDate: '2025-06-01',
    icon: '🏡',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    description: 'Long-term savings fund for first home deposit.',
    recurringGoal: 500,
    status: 'active'
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx_101',
    planId: 'plan_1',
    amount: 500,
    type: 'deposit',
    date: '2026-08-20',
    note: 'Bi-weekly paycheck contribution'
  },
  {
    id: 'tx_102',
    planId: 'plan_2',
    amount: 300,
    type: 'deposit',
    date: '2026-08-15',
    note: 'Vacation savings deposit'
  },
  {
    id: 'tx_103',
    planId: 'plan_3',
    amount: 250,
    type: 'deposit',
    date: '2026-08-10',
    note: 'MacBook goal deposit'
  },
  {
    id: 'tx_104',
    planId: 'plan_4',
    amount: 800,
    type: 'deposit',
    date: '2026-08-01',
    note: 'Monthly house fund deposit'
  },
  {
    id: 'tx_105',
    planId: 'plan_1',
    amount: 150,
    type: 'deposit',
    date: '2026-07-28',
    note: 'Side project earnings bonus'
  }
];

class Store {
  constructor() {
    this.plans = [];
    this.transactions = [];
    this.currency = '$';
    this.theme = 'dark';
    this.loadState();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.plans = parsed.plans || DEFAULT_PLANS;
        this.transactions = parsed.transactions || DEFAULT_TRANSACTIONS;
        this.currency = parsed.currency || '$';
        this.theme = parsed.theme || 'dark';
      } else {
        this.plans = DEFAULT_PLANS;
        this.transactions = DEFAULT_TRANSACTIONS;
        this.saveState();
      }
    } catch (e) {
      console.error('Failed to load from LocalStorage:', e);
      this.plans = DEFAULT_PLANS;
      this.transactions = DEFAULT_TRANSACTIONS;
    }
  }

  saveState() {
    try {
      const data = {
        plans: this.plans,
        transactions: this.transactions,
        currency: this.currency,
        theme: this.theme
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to LocalStorage:', e);
    }
  }

  // --- Plans CRUD ---
  getPlans(filterCategory = 'all', statusFilter = 'active') {
    return this.plans.filter(p => {
      const matchesCat = filterCategory === 'all' || p.category.toLowerCase() === filterCategory.toLowerCase();
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesCat && matchesStatus;
    });
  }

  getPlanById(id) {
    return this.plans.find(p => p.id === id);
  }

  addPlan(planData) {
    const id = 'plan_' + Date.now();
    const newPlan = {
      id,
      title: planData.title,
      category: planData.category || 'General',
      targetAmount: parseFloat(planData.targetAmount) || 0,
      currentAmount: parseFloat(planData.initialDeposit) || 0,
      targetDate: planData.targetDate,
      startDate: new Date().toISOString().split('T')[0],
      icon: planData.icon || '🎯',
      color: planData.color || '#10b981',
      gradient: this.getGradientForColor(planData.color || '#10b981'),
      description: planData.description || '',
      recurringGoal: parseFloat(planData.recurringGoal) || 0,
      status: 'active'
    };

    this.plans.unshift(newPlan);

    // Record initial deposit as a transaction if > 0
    if (newPlan.currentAmount > 0) {
      this.addTransaction({
        planId: id,
        amount: newPlan.currentAmount,
        type: 'deposit',
        date: newPlan.startDate,
        note: 'Initial deposit upon plan creation'
      }, false);
    }

    this.saveState();
    return newPlan;
  }

  updatePlan(id, updatedData) {
    const index = this.plans.findIndex(p => p.id === id);
    if (index !== -1) {
      this.plans[index] = {
        ...this.plans[index],
        ...updatedData,
        targetAmount: parseFloat(updatedData.targetAmount) || this.plans[index].targetAmount,
        recurringGoal: parseFloat(updatedData.recurringGoal) || this.plans[index].recurringGoal
      };
      this.saveState();
      return this.plans[index];
    }
    return null;
  }

  deletePlan(id) {
    this.plans = this.plans.filter(p => p.id !== id);
    this.transactions = this.transactions.filter(t => t.planId !== id);
    this.saveState();
  }

  // --- Transactions CRUD ---
  addTransaction(txData, autoSave = true) {
    const id = 'tx_' + Date.now();
    const amount = parseFloat(txData.amount) || 0;
    const type = txData.type || 'deposit'; // 'deposit' or 'withdrawal'

    const newTx = {
      id,
      planId: txData.planId,
      amount: Math.abs(amount),
      type,
      date: txData.date || new Date().toISOString().split('T')[0],
      note: txData.note || (type === 'deposit' ? 'Savings Deposit' : 'Withdrawal')
    };

    this.transactions.unshift(newTx);

    // Update plan's current amount
    const plan = this.getPlanById(txData.planId);
    if (plan) {
      if (type === 'deposit') {
        plan.currentAmount += newTx.amount;
      } else {
        plan.currentAmount = Math.max(0, plan.currentAmount - newTx.amount);
      }
    }

    if (autoSave) this.saveState();
    return newTx;
  }

  deleteTransaction(id) {
    const txIndex = this.transactions.findIndex(t => t.id === id);
    if (txIndex !== -1) {
      const tx = this.transactions[txIndex];
      const plan = this.getPlanById(tx.planId);
      if (plan) {
        if (tx.type === 'deposit') {
          plan.currentAmount = Math.max(0, plan.currentAmount - tx.amount);
        } else {
          plan.currentAmount += tx.amount;
        }
      }
      this.transactions.splice(txIndex, 1);
      this.saveState();
    }
  }

  // --- Analytics & Calculated Totals ---
  getTotalSavings() {
    return this.plans.reduce((sum, p) => sum + p.currentAmount, 0);
  }

  getTotalTarget() {
    return this.plans.reduce((sum, p) => sum + p.targetAmount, 0);
  }

  getOverallProgress() {
    const totalTarget = this.getTotalTarget();
    if (totalTarget === 0) return 0;
    return Math.min(100, (this.getTotalSavings() / totalTarget) * 100);
  }

  getMonthlyContributions(monthsCount = 6) {
    // Generate last N months data
    const result = [];
    const now = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      const monthlyTotal = this.transactions
        .filter(t => t.type === 'deposit' && t.date.startsWith(monthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      result.push({ monthStr, label, amount: monthlyTotal });
    }
    return result;
  }

  // Calculate saving velocity and projected completion date
  getPlanAnalytics(plan) {
    const remaining = Math.max(0, plan.targetAmount - plan.currentAmount);
    const percent = Math.min(100, (plan.currentAmount / plan.targetAmount) * 100);

    const now = new Date();
    const target = new Date(plan.targetDate);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculate historical monthly velocity for this plan
    const planTxs = this.transactions.filter(t => t.planId === plan.id && t.type === 'deposit');
    let avgMonthlyDeposit = plan.recurringGoal || 100;
    
    if (planTxs.length > 1) {
      const totalDeposited = planTxs.reduce((sum, t) => sum + t.amount, 0);
      avgMonthlyDeposit = totalDeposited / Math.max(1, (planTxs.length / 2));
    }

    const monthsToGoal = avgMonthlyDeposit > 0 ? (remaining / avgMonthlyDeposit) : 999;
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + Math.ceil(monthsToGoal));

    let status = 'on-track';
    if (percent >= 100) {
      status = 'completed';
    } else if (diffDays <= 0 || projectedDate > target) {
      status = 'behind';
    }

    return {
      remaining,
      percent,
      diffDays: Math.max(0, diffDays),
      avgMonthlyDeposit,
      projectedDate: projectedDate.toISOString().split('T')[0],
      status
    };
  }

  // Bulk Auto Allocation helper algorithm
  autoAllocateBulkAmount(bulkAmount) {
    const activePlans = this.plans.filter(p => p.status === 'active' && p.currentAmount < p.targetAmount);
    if (activePlans.length === 0) return [];

    // Score plans by urgency (closest target date) and remaining gap percentage
    let totalScore = 0;
    const scoredPlans = activePlans.map(plan => {
      const remaining = plan.targetAmount - plan.currentAmount;
      const daysLeft = Math.max(1, Math.ceil((new Date(plan.targetDate) - new Date()) / (1000 * 60 * 60 * 24)));
      // Urgency score: higher if fewer days left & higher remaining gap
      const score = (remaining / daysLeft);
      totalScore += score;
      return { plan, remaining, score };
    });

    return scoredPlans.map(item => {
      const allocated = Math.min(item.remaining, Math.round((item.score / totalScore) * bulkAmount));
      return {
        plan: item.plan,
        allocatedAmount: allocated
      };
    });
  }

  // --- Helper Helpers ---
  getGradientForColor(color) {
    const gradients = {
      '#10b981': 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
      '#3b82f6': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      '#8b5cf6': 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
      '#f59e0b': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      '#f43f5e': 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    };
    return gradients[color] || `linear-gradient(135deg, ${color} 0%, #3b82f6 100%)`;
  }

  // --- Export & Import Data ---
  exportJSON() {
    const data = {
      plans: this.plans,
      transactions: this.transactions,
      currency: this.currency,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultcraft_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportCSV() {
    let csv = 'Transaction ID,Plan Title,Category,Type,Amount,Date,Note\n';
    this.transactions.forEach(t => {
      const plan = this.getPlanById(t.planId);
      const planTitle = plan ? `"${plan.title.replace(/"/g, '""')}"` : 'General';
      const category = plan ? `"${plan.category.replace(/"/g, '""')}"` : 'General';
      const note = `"${(t.note || '').replace(/"/g, '""')}"`;
      csv += `${t.id},${planTitle},${category},${t.type},${t.amount},${t.date},${note}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultcraft_savings_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.plans) && Array.isArray(parsed.transactions)) {
        this.plans = parsed.plans;
        this.transactions = parsed.transactions;
        if (parsed.currency) this.currency = parsed.currency;
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON format', e);
    }
    return false;
  }
}

window.store = new Store();
