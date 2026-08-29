/**
 * VaultCraft Store - State Management & Storage Layer
 */
const STORAGE_KEY = 'vaultcraft_savings_data_v2';
const REQUESTS_KEY = 'vaultcraft_money_requests_v1';
const USER_PROFILE_KEY = 'vaultcraft_user_profile_v1';

const DEFAULT_PLANS = [];
const DEFAULT_TRANSACTIONS = [];

class Store {
  constructor() {
    this.plans = [];
    this.transactions = [];
    this.moneyRequests = [];
    this.userCode = '';
    this.userPin = '';
    this.currency = '$';
    this.theme = 'dark';
    this.loadState();
    this.loadUserProfile();
    this.loadMoneyRequests();
    this.initFirestoreSync();
  }

  generateUserCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  loadUserProfile() {
    try {
      const raw = localStorage.getItem(USER_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.userCode = parsed.userCode || this.generateUserCode();
      } else {
        this.userCode = this.generateUserCode();
        this.saveUserProfile();
      }
    } catch (e) {
      this.userCode = this.generateUserCode();
    }
    // The PIN is the same exact thing as the unique User Code (e.g. Fj38f)
    this.userPin = this.userCode;
  }

  saveUserProfile() {
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify({
        userCode: this.userCode
      }));
    } catch (e) {
      console.error('Error saving user profile:', e);
    }
  }

  setUserCode(newCode) {
    if (!newCode || !newCode.trim()) return false;
    this.userCode = newCode.trim();
    this.userPin = this.userCode;
    this.saveUserProfile();
    if (window.app && typeof window.app.updateUserCodeDisplay === 'function') {
      window.app.updateUserCodeDisplay();
      window.app.renderRequests();
    }
    return true;
  }

  verifyPin(pin) {
    if (!pin) return false;
    return pin.trim().toLowerCase() === (this.userCode || '').trim().toLowerCase();
  }

  loadMoneyRequests() {
    try {
      const raw = localStorage.getItem(REQUESTS_KEY);
      if (raw) {
        this.moneyRequests = JSON.parse(raw) || [];
      } else {
        this.moneyRequests = [];
      }
    } catch (e) {
      this.moneyRequests = [];
    }
  }

  saveMoneyRequests() {
    try {
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(this.moneyRequests));
    } catch (e) {
      console.error('Error saving money requests:', e);
    }
  }

  initFirestoreSync() {
    if (!window.db || this.firestoreSubscribed) return;
    try {
      this.firestoreSubscribed = true;
      window.db.collection('moneyRequests').onSnapshot((snapshot) => {
        const remoteRequests = [];
        snapshot.forEach((doc) => {
          remoteRequests.push(doc.data());
        });
        
        // Merge remote requests with local requests sorted by timestamp/createdAt
        const requestMap = new Map();
        (this.moneyRequests || []).forEach(r => { if (r && r.id) requestMap.set(r.id, r); });
        remoteRequests.forEach(r => { if (r && r.id) requestMap.set(r.id, r); });
        
        this.moneyRequests = Array.from(requestMap.values()).sort((a, b) => {
          return (b.timestamp || 0) - (a.timestamp || 0);
        });

        this.saveMoneyRequests();

        if (window.app && typeof window.app.renderRequests === 'function') {
          window.app.renderRequests();
        }
      }, (error) => {
        console.warn('Firestore moneyRequests sync info:', error.message);
      });
    } catch (e) {
      console.error('Error initializing Firestore sync:', e);
    }
  }

  createMoneyRequest(recipientCode, amount, goalId = '', note = '') {
    const timestamp = Date.now();
    const id = 'req_' + timestamp;
    const newRequest = {
      id,
      senderCode: (this.userCode || '').trim(),
      senderName: (window.currentUser && localStorage.getItem('vaultcraft_hide_account_name') !== 'true') 
        ? (window.currentUser.displayName || window.currentUser.email) 
        : 'Friend',
      recipientCode: recipientCode.trim(),
      amount: parseFloat(amount) || 0,
      goalId,
      note: note.trim() || 'Money Request',
      status: 'pending',
      timestamp,
      createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.moneyRequests.unshift(newRequest);
    this.saveMoneyRequests();

    if (window.db) {
      window.db.collection('moneyRequests').doc(id).set(newRequest).catch((err) => {
        console.error('Error writing money request to Firestore:', err);
      });
    }

    return newRequest;
  }

  getIncomingRequests() {
    const myCode = (this.userCode || '').trim().toLowerCase();
    if (!myCode) return [];
    return this.moneyRequests.filter(r => (r.recipientCode || '').trim().toLowerCase() === myCode);
  }

  getOutgoingRequests() {
    const myCode = (this.userCode || '').trim().toLowerCase();
    if (!myCode) return [];
    return this.moneyRequests.filter(r => (r.senderCode || '').trim().toLowerCase() === myCode);
  }

  updateRequestStatus(requestId, status) {
    const req = this.moneyRequests.find(r => r.id === requestId);
    if (req) {
      req.status = status;
      this.saveMoneyRequests();

      if (window.db) {
        window.db.collection('moneyRequests').doc(requestId).update({ status }).catch((err) => {
          console.error('Error updating money request status in Firestore:', err);
        });
      }

      return req;
    }
    return null;
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

        this.reconcilePlanBalances();
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

  reconcilePlanBalances() {
    this.plans.forEach(plan => {
      plan.targetAmount = parseFloat(plan.targetAmount) || 0;
      const planTxs = this.transactions.filter(t => t.planId === plan.id);
      const total = planTxs.reduce((sum, t) => {
        const amt = parseFloat(t.amount) || 0;
        return t.type === 'deposit' ? sum + amt : sum - amt;
      }, 0);
      plan.currentAmount = Math.max(0, total);
    });
  }

  clearAllData() {
    this.plans = [];
    this.transactions = [];
    this.saveState();
    try {
      localStorage.removeItem('vaultcraft_savings_data_v1');
      localStorage.removeItem('vaultcraft_savings_data_v2');
    } catch(e) {}
  }

  saveState() {
    try {
      this.reconcilePlanBalances();
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
    this.reconcilePlanBalances();
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
    const initialDeposit = parseFloat(planData.initialDeposit) || 0;

    const newPlan = {
      id,
      title: planData.title.trim(),
      category: planData.category || 'General',
      targetAmount: parseFloat(planData.targetAmount) || 0,
      currentAmount: 0,
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

    if (initialDeposit > 0) {
      this.addTransaction({
        planId: id,
        amount: initialDeposit,
        type: 'deposit',
        date: newPlan.startDate,
        note: 'Initial deposit upon goal creation'
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
        title: updatedData.title ? updatedData.title.trim() : this.plans[index].title,
        category: updatedData.category || this.plans[index].category,
        targetAmount: parseFloat(updatedData.targetAmount) || this.plans[index].targetAmount,
        targetDate: updatedData.targetDate || this.plans[index].targetDate,
        icon: updatedData.icon || this.plans[index].icon,
        color: updatedData.color || this.plans[index].color,
        gradient: this.getGradientForColor(updatedData.color || this.plans[index].color),
        description: updatedData.description !== undefined ? updatedData.description : this.plans[index].description
      };
      this.saveState();
      return this.plans[index];
    }
    return null;
  }

  deletePlan(id) {
    this.plans = this.plans.filter(p => p.id !== id);
    this.transactions = this.transactions.filter(t => t.planId !== id);
    this.reconcilePlanBalances();
    this.saveState();
  }

  // --- Transactions CRUD ---
  addTransaction(txData, autoSave = true) {
    const id = 'tx_' + Date.now();
    const amount = parseFloat(txData.amount) || 0;
    if (amount <= 0) return null;

    const type = txData.type || 'deposit';

    const newTx = {
      id,
      planId: txData.planId,
      amount: Math.abs(amount),
      type,
      date: txData.date || new Date().toISOString().split('T')[0],
      note: txData.note || (type === 'deposit' ? 'Deposit' : 'Withdrawal')
    };

    this.transactions.unshift(newTx);
    this.reconcilePlanBalances();

    if (autoSave) this.saveState();
    return newTx;
  }

  deleteTransaction(id) {
    const txIndex = this.transactions.findIndex(t => t.id === id);
    if (txIndex !== -1) {
      this.transactions.splice(txIndex, 1);
      this.reconcilePlanBalances();
      this.saveState();
    }
  }

  // --- Analytics & Calculated Totals ---
  getTotalSavings() {
    this.reconcilePlanBalances();
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
    const result = [];
    const now = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().slice(0, 7);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      const monthlyTotal = this.transactions
        .filter(t => t.type === 'deposit' && t.date.startsWith(monthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      result.push({ monthStr, label, amount: monthlyTotal });
    }
    return result;
  }

  getPlanAnalytics(plan) {
    const remaining = Math.max(0, plan.targetAmount - plan.currentAmount);
    const percent = plan.targetAmount > 0 ? Math.min(100, (plan.currentAmount / plan.targetAmount) * 100) : 0;

    const now = new Date();
    const target = new Date(plan.targetDate);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = 'on-track';
    if (percent >= 100) {
      status = 'completed';
    } else if (diffDays <= 0) {
      status = 'behind';
    }

    return {
      remaining,
      percent,
      diffDays: Math.max(0, diffDays),
      status
    };
  }

  autoAllocateBulkAmount(bulkAmount) {
    const activePlans = this.plans.filter(p => p.status === 'active' && p.currentAmount < p.targetAmount);
    if (activePlans.length === 0 || bulkAmount <= 0) return [];

    let totalScore = 0;
    const scoredPlans = activePlans.map(plan => {
      const remaining = plan.targetAmount - plan.currentAmount;
      const daysLeft = Math.max(1, Math.ceil((new Date(plan.targetDate) - new Date()) / (1000 * 60 * 60 * 24)));
      const score = (remaining / daysLeft);
      totalScore += score;
      return { plan, remaining, score };
    });

    return scoredPlans.map(item => {
      const rawAlloc = (item.score / totalScore) * bulkAmount;
      const allocated = Math.min(item.remaining, Math.round(rawAlloc));
      return {
        plan: item.plan,
        allocatedAmount: allocated
      };
    });
  }

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

  exportJSON() {
    const data = {
      plans: this.plans,
      transactions: this.transactions,
      userCode: this.userCode,
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
