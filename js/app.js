/**
 * VaultCraft App - Main Controller & Event Dispatcher
 */
class App {
  constructor() {
    this.currentTab = 'dashboard';
    this.categoryFilter = 'all';
    this.selectedPlanColor = '#10b981';
    this.init();
  }

  init() {
    this.startTime = Date.now();
    document.addEventListener('DOMContentLoaded', () => {
      this.bindEvents();
      this.applyTheme(window.store.theme);
      this.updateUserCodeDisplay();
      if (typeof window.initFirebaseAuth === 'function') {
        window.initFirebaseAuth();
      }
      this.render();

      setTimeout(() => {
        this.hideSplashScreen();
      }, 3500);
    });
  }

  hideSplashScreen() {
    const elapsed = Date.now() - (this.startTime || Date.now());
    const minDuration = 3500;
    const delay = Math.max(0, minDuration - elapsed);

    setTimeout(() => {
      const splash = document.getElementById('splashScreen');
      if (splash && !this.splashHidden) {
        this.splashHidden = true;
        splash.classList.add('fade-out');
        setTimeout(() => {
          splash.style.display = 'none';
        }, 500);
      }
    }, delay);
  }

  updateUserCodeDisplay() {
    const el = document.getElementById('userCodeVal');
    const bannerEl = document.getElementById('codeBannerVal');
    if (window.store) {
      if (el) el.textContent = window.store.userCode;
      if (bannerEl) bannerEl.textContent = window.store.userCode;
    }
  }

  copyUserCode() {
    if (!window.store) return;
    const code = window.store.userCode;
    navigator.clipboard.writeText(code).then(() => {
      this.showToast(`Copied code: ${code}`);
    }).catch(() => {
      this.showToast(`User Code: ${code}`);
    });
  }

  editUserCode() {
    if (!window.store) return;
    const currentCode = window.store.userCode;
    const input = prompt('Set your custom User Code (e.g. Fj38f):', currentCode);
    if (input !== null && input.trim() !== '') {
      const clean = input.trim();
      window.store.setUserCode(clean);
      this.showToast(`User Code updated to: ${clean}`, 'success');
      this.updateUserCodeDisplay();
      this.renderRequests();
    }
  }

  toggleAccountNamePrivacy() {
    const current = localStorage.getItem('vaultcraft_hide_account_name') === 'true';
    const nextState = !current;
    localStorage.setItem('vaultcraft_hide_account_name', nextState ? 'true' : 'false');
    this.showToast(nextState ? 'Account name hidden (Privacy Mode ON) 🙈' : 'Account name visible 👁️', 'info');
    if (window.currentUser) {
      this.onAuthStateChanged(window.currentUser);
    }
  }

  onAuthStateChanged(user) {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    const authContainer = document.getElementById('authContainer');

    this.updateUserCodeDisplay();
    this.hideSplashScreen();

    if (user) {
      if (loginScreen) loginScreen.style.display = 'none';
      if (appContainer) appContainer.style.display = 'grid';

      if (authContainer) {
        const photoURL = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%2310b981%22/><text x=%2250%22 y=%2262%22 font-size=%2245%22 text-anchor=%22middle%22 fill=%22white%22 font-family=%22sans-serif%22 font-weight=%22bold%22>👤</text></svg>';

        authContainer.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.5rem; background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <img src="${photoURL}" alt="Account" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
            <div style="flex:1; overflow:hidden;">
              <div style="font-size:0.8rem; font-weight:700; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">Account</div>
              <div style="font-size:0.68rem; color:var(--accent-emerald); font-weight:600;">Signed In</div>
            </div>
            <button class="btn btn-outline btn-sm btn-icon-only" onclick="signOutUser()" title="Sign Out">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        `;
      }
      this.render();
    } else {
      if (loginScreen) loginScreen.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'none';

      if (authContainer) {
        authContainer.innerHTML = `
          <button class="btn btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="signInWithGoogle()" id="googleSignInBtn">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            <span>Sign in with Google</span>
          </button>
        `;
      }
    }
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const newTheme = window.store.theme === 'dark' ? 'light' : 'dark';
        window.store.theme = newTheme;
        window.store.saveState();
        this.applyTheme(newTheme);
      });
    }

    // Modal Forms Submit Listeners
    const planForm = document.getElementById('planForm');
    if (planForm) {
      planForm.addEventListener('submit', (e) => this.handlePlanFormSubmit(e));
    }

    const txForm = document.getElementById('txForm');
    if (txForm) {
      txForm.addEventListener('submit', (e) => this.handleTxFormSubmit(e));
    }

    const requestMoneyForm = document.getElementById('requestMoneyForm');
    if (requestMoneyForm) {
      requestMoneyForm.addEventListener('submit', (e) => this.handleRequestMoneySubmit(e));
    }

    const allocForm = document.getElementById('allocForm');
    if (allocForm) {
      allocForm.addEventListener('submit', (e) => this.handleAutoAllocSubmit(e));
    }

    const goalCalcForm = document.getElementById('goalCalcForm');
    if (goalCalcForm) {
      goalCalcForm.addEventListener('input', () => this.calculateGoalPlanner());
    }

    // Color picker swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedPlanColor = e.target.getAttribute('data-color');
      });
    });

    // Search and filter ledger
    const ledgerSearch = document.getElementById('ledgerSearch');
    if (ledgerSearch) {
      ledgerSearch.addEventListener('input', () => this.renderLedger());
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    if (themeIcon && themeText) {
      if (theme === 'light') {
        themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
        themeText.textContent = 'Light Mode';
      } else {
        themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        themeText.textContent = 'Dark Mode';
      }
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    const activeTabEl = document.getElementById(`tab-${tab}`);
    if (activeTabEl) {
      activeTabEl.style.display = 'block';
    }

    this.render();
  }

  render() {
    this.renderSummary();
    this.updateUserCodeDisplay();
    if (this.currentTab === 'dashboard') {
      this.renderDashboard();
    } else if (this.currentTab === 'plans') {
      this.renderPlans();
    } else if (this.currentTab === 'requests') {
      this.renderRequests();
    } else if (this.currentTab === 'ledger') {
      this.renderLedger();
    } else if (this.currentTab === 'tools') {
      this.calculateGoalPlanner();
    }
  }

  renderSummary() {
    const summaryContainer = document.getElementById('summaryCardsContainer');
    if (summaryContainer) {
      summaryContainer.innerHTML = UIComponents.renderSummaryCards(window.store);
    }
  }

  renderDashboard() {
    const plansPreview = document.getElementById('dashboardPlansContainer');
    if (plansPreview) {
      const activePlans = window.store.getPlans('all', 'active').slice(0, 3);
      if (activePlans.length === 0) {
        plansPreview.innerHTML = `<div class="empty-state"><p class="empty-title">No Active Goals</p><button class="btn btn-primary btn-sm" onclick="app.openNewPlanModal()">+ Create Goal</button></div>`;
      } else {
        plansPreview.innerHTML = activePlans.map(p => UIComponents.renderPlanCard(p, window.store)).join('');
      }
    }

    setTimeout(() => {
      const monthlyData = window.store.getMonthlyContributions(6);
      ChartsEngine.renderTrendChart('savingsTrendChart', monthlyData, window.store.currency);
      ChartsEngine.renderDonutChart('categoryDonutChart', window.store.plans, window.store.currency);
    }, 50);
  }

  renderPlans() {
    const grid = document.getElementById('allPlansGrid');
    if (!grid) return;

    const plans = window.store.getPlans(this.categoryFilter);
    if (plans.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🎯</div>
          <p class="empty-title">No Savings Goals Found</p>
          <p style="font-size:0.85rem; margin-bottom:1rem;">Start setting up your target goals now.</p>
          <button class="btn btn-primary" onclick="app.openNewPlanModal()">+ Create New Goal</button>
        </div>
      `;
    } else {
      grid.innerHTML = plans.map(p => UIComponents.renderPlanCard(p, window.store)).join('');
    }
  }

  renderRequests() {
    const incomingContainer = document.getElementById('incomingRequestsContainer');
    const outgoingContainer = document.getElementById('outgoingRequestsContainer');

    if (incomingContainer) {
      incomingContainer.innerHTML = UIComponents.renderIncomingRequests(window.store.getIncomingRequests(), window.store);
    }
    if (outgoingContainer) {
      outgoingContainer.innerHTML = UIComponents.renderOutgoingRequests(window.store.getOutgoingRequests(), window.store);
    }
  }

  renderLedger() {
    const tbody = document.getElementById('ledgerTableBody');
    if (!tbody) return;

    const search = (document.getElementById('ledgerSearch')?.value || '').toLowerCase();
    const planFilter = document.getElementById('ledgerPlanFilter')?.value || 'all';

    let txs = window.store.transactions;
    if (planFilter !== 'all') {
      txs = txs.filter(t => t.planId === planFilter);
    }
    if (search) {
      txs = txs.filter(t => {
        const plan = window.store.getPlanById(t.planId);
        const titleMatch = plan && plan.title.toLowerCase().includes(search);
        const noteMatch = (t.note || '').toLowerCase().includes(search);
        return titleMatch || noteMatch;
      });
    }

    tbody.innerHTML = UIComponents.renderLedgerRows(txs, window.store);

    const planFilterSelect = document.getElementById('ledgerPlanFilter');
    if (planFilterSelect && planFilterSelect.options.length <= 1) {
      window.store.plans.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.icon} ${p.title}`;
        planFilterSelect.appendChild(opt);
      });
    }
  }

  filterPlans(category) {
    this.categoryFilter = category;
    this.renderPlans();
  }

  // --- Modals & Actions ---
  openNewPlanModal() {
    document.getElementById('planModalTitle').textContent = 'Create New Savings Goal';
    document.getElementById('planIdInput').value = '';
    document.getElementById('planTitleInput').value = '';
    document.getElementById('planCategoryInput').value = 'General';
    document.getElementById('planTargetInput').value = '';
    document.getElementById('planInitialInput').value = '';
    const initGrp = document.getElementById('planInitialGroup');
    if (initGrp) initGrp.style.display = 'block';
    document.getElementById('planTargetDateInput').value = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('planIconInput').value = '🎯';
    document.getElementById('planDescriptionInput').value = '';
    document.getElementById('planModal').showModal();
  }

  openEditPlanModal(planId) {
    const plan = window.store.getPlanById(planId);
    if (!plan) return;

    document.getElementById('planModalTitle').textContent = 'Edit Savings Goal';
    document.getElementById('planIdInput').value = plan.id;
    document.getElementById('planTitleInput').value = plan.title;
    document.getElementById('planCategoryInput').value = plan.category;
    document.getElementById('planTargetInput').value = plan.targetAmount;
    const initGrp = document.getElementById('planInitialGroup');
    if (initGrp) initGrp.style.display = 'none';
    document.getElementById('planTargetDateInput').value = plan.targetDate;
    document.getElementById('planIconInput').value = plan.icon;
    document.getElementById('planDescriptionInput').value = plan.description || '';
    document.getElementById('planModal').showModal();
  }

  handlePlanFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('planIdInput').value;
    const data = {
      title: document.getElementById('planTitleInput').value,
      category: document.getElementById('planCategoryInput').value,
      targetAmount: document.getElementById('planTargetInput').value,
      initialDeposit: document.getElementById('planInitialInput').value,
      targetDate: document.getElementById('planTargetDateInput').value,
      icon: document.getElementById('planIconInput').value || '🎯',
      color: this.selectedPlanColor,
      description: document.getElementById('planDescriptionInput').value
    };

    if (id) {
      window.store.updatePlan(id, data);
      this.showToast('Savings plan updated successfully!');
    } else {
      window.store.addPlan(data);
      this.showToast('New savings plan created!');
    }

    document.getElementById('planModal').close();
    this.render();
  }

  resetAllData() {
    this.showConfirm('Clear All Workspace Data', 'Are you sure you want to clear all savings goals and history? This will start with a clean, empty workspace.', () => {
      window.store.clearAllData();
      this.showToast('All saved goals cleared.', 'info');
      this.render();
    });
  }

  deletePlan(planId) {
    this.showConfirm('Delete Goal Plan', 'Are you sure you want to delete this savings plan? Associated log entries will also be removed.', () => {
      window.store.deletePlan(planId);
      this.showToast('Goal deleted.', 'info');
      this.render();
    });
  }

  quickAddDeposit(planId, amount) {
    const plan = window.store.getPlanById(planId);
    if (!plan) return;

    window.store.addTransaction({
      planId,
      amount,
      type: 'deposit',
      date: new Date().toISOString().split('T')[0],
      note: `Quick deposit +$${amount}`
    });

    this.showToast(`Added $${amount} to ${plan.title}! 🎉`, 'success');
    this.render();
  }

  openDepositModal(planId = '', type = 'deposit') {
    const select = document.getElementById('txPlanSelect');
    select.innerHTML = window.store.plans.map(p => `<option value="${p.id}" ${p.id === planId ? 'selected' : ''}>${p.icon} ${p.title} (${window.store.currency}${p.currentAmount.toLocaleString()})</option>`).join('');

    document.getElementById('txTypeSelect').value = type;
    document.getElementById('txAmountInput').value = '';
    document.getElementById('txDateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('txNoteInput').value = '';
    document.getElementById('txModal').showModal();
  }

  handleTxFormSubmit(e) {
    e.preventDefault();
    const txData = {
      planId: document.getElementById('txPlanSelect').value,
      type: document.getElementById('txTypeSelect').value,
      amount: document.getElementById('txAmountInput').value,
      date: document.getElementById('txDateInput').value,
      note: document.getElementById('txNoteInput').value
    };

    if (!txData.planId) {
      this.showToast('Please select a target plan!', 'warning');
      return;
    }

    window.store.addTransaction(txData);
    document.getElementById('txModal').close();
    this.showToast(txData.type === 'deposit' ? 'Deposit logged successfully! 🎉' : 'Withdrawal logged.', 'success');
    this.render();
  }

  deleteTransaction(txId) {
    this.showConfirm('Delete Record', 'Are you sure you want to delete this savings record?', () => {
      window.store.deleteTransaction(txId);
      this.showToast('Record removed.', 'info');
      this.render();
    });
  }

  // --- Money Requests Modals & Handlers ---
  openRequestMoneyModal() {
    document.getElementById('reqRecipientCodeInput').value = '';
    document.getElementById('reqAmountInput').value = '';
    document.getElementById('reqNoteInput').value = '';
    document.getElementById('reqPinInput').value = '';
    document.getElementById('requestMoneyModal').showModal();
  }

  handleRequestMoneySubmit(e) {
    e.preventDefault();
    const recipientCode = document.getElementById('reqRecipientCodeInput').value.trim();
    const amount = parseFloat(document.getElementById('reqAmountInput').value) || 0;
    const note = document.getElementById('reqNoteInput').value;
    const pin = document.getElementById('reqPinInput').value.trim();

    if (recipientCode.toLowerCase() === window.store.userCode.toLowerCase()) {
      this.showToast('⚠️ You cannot send a money request to your own User Code!', 'warning');
      return;
    }

    if (!window.store.verifyPin(pin)) {
      this.showToast(`❌ Incorrect PIN! Your PIN is your Code: ${window.store.userCode}`, 'error');
      return;
    }

    if (amount <= 0) {
      this.showToast('⚠️ Please enter a valid request amount.', 'warning');
      return;
    }

    window.store.createMoneyRequest(recipientCode, amount, '', note);
    document.getElementById('requestMoneyModal').close();
    this.showToast(`Request for $${amount} sent to code ${recipientCode}!`);
    this.switchTab('requests');
  }

  updateMoneyRequestStatus(requestId, status) {
    const req = window.store.updateRequestStatus(requestId, status);
    if (req) {
      this.showToast(`Request from ${req.senderName} ${status}.`);
      this.renderRequests();
    }
  }

  openAutoAllocModal() {
    document.getElementById('allocAmountInput').value = '50';
    this.calculateAutoAlloc();
    document.getElementById('allocModal').showModal();
  }

  calculateAutoAlloc() {
    const amount = parseFloat(document.getElementById('allocAmountInput')?.value) || 0;
    const allocations = window.store.autoAllocateBulkAmount(amount);
    const container = document.getElementById('allocResultsContainer');

    if (allocations.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">No active goals available for allocation.</p>`;
      return;
    }

    container.innerHTML = allocations.map(item => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.8rem; background:var(--bg-tertiary); border-radius:var(--radius-md); margin-bottom:0.5rem;">
        <div>
          <strong>${item.plan.icon} ${item.plan.title}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">Target: ${window.store.currency}${item.plan.targetAmount.toLocaleString()}</div>
        </div>
        <div style="font-family:var(--font-mono); font-weight:700; color:var(--accent-emerald);">
          +${window.store.currency}${item.allocatedAmount.toLocaleString()}
        </div>
      </div>
    `).join('');
  }

  handleAutoAllocSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('allocAmountInput').value) || 0;
    const allocations = window.store.autoAllocateBulkAmount(amount);

    allocations.forEach(item => {
      if (item.allocatedAmount > 0) {
        window.store.addTransaction({
          planId: item.plan.id,
          amount: item.allocatedAmount,
          type: 'deposit',
          date: new Date().toISOString().split('T')[0],
          note: 'Auto-Allocation deposit'
        });
      }
    });

    document.getElementById('allocModal').close();
    this.showToast('Deposit split across goals!');
    this.render();
  }

  calculateGoalPlanner() {
    const goalAmount = parseFloat(document.getElementById('calcGoalTarget')?.value) || 0;
    const savedAlready = parseFloat(document.getElementById('calcAlreadySaved')?.value) || 0;
    const timeVal = parseFloat(document.getElementById('calcTimeVal')?.value) || 1;
    const timeUnit = (document.getElementById('calcTimeUnit')?.value || 'months').toLowerCase();

    const remaining = Math.max(0, goalAmount - savedAlready);

    const resultsGrid = document.getElementById('calcResultsGrid');
    const resSummary = document.getElementById('calcSummaryMessage');
    const curr = window.store ? window.store.currency : '$';

    if (!resultsGrid || !resSummary) return;

    if (remaining <= 0) {
      resultsGrid.innerHTML = `
        <div style="grid-column: 1 / -1;">
          <div style="font-size:1.6rem; font-weight:800; color:var(--accent-emerald);">🎉 Goal Complete!</div>
          <div style="font-size:0.875rem; color:var(--text-muted);">You already have enough saved to reach this goal.</div>
        </div>
      `;
      resSummary.innerHTML = `🎉 You already have <strong>${curr}${savedAlready.toLocaleString()}</strong> saved for this goal!`;
      return;
    }

    const unitSingle = timeVal === 1 ? timeUnit.replace(/s$/, '') : timeUnit;

    if (timeUnit === 'days') {
      const days = Math.max(1, timeVal);
      const dailyNeeded = remaining / days;

      resultsGrid.innerHTML = `
        <div style="grid-column: 1 / -1;">
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">DAILY AMOUNT NEEDED</span>
          <div style="font-size:1.8rem; font-weight:800; font-family:var(--font-mono); color:var(--accent-emerald);">${curr}${dailyNeeded.toFixed(2)} / day</div>
        </div>
      `;

      resSummary.innerHTML = `🎯 To reach your <strong>${curr}${remaining.toLocaleString()}</strong> goal in <strong>${timeVal} ${unitSingle}</strong>, save <strong>${curr}${dailyNeeded.toFixed(2)} each day</strong>! 🚀`;

    } else if (timeUnit === 'weeks') {
      const weeks = Math.max(1, timeVal);
      const days = weeks * 7;
      const weeklyNeeded = remaining / weeks;
      const dailyNeeded = remaining / days;

      resultsGrid.innerHTML = `
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">WEEKLY NEEDED</span>
          <div style="font-size:1.5rem; font-weight:800; font-family:var(--font-mono); color:var(--accent-purple);">${curr}${weeklyNeeded.toFixed(2)} / wk</div>
        </div>
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">DAILY NEEDED</span>
          <div style="font-size:1.5rem; font-weight:800; font-family:var(--font-mono); color:var(--accent-emerald);">${curr}${dailyNeeded.toFixed(2)} / day</div>
        </div>
      `;

      if (timeVal === 1) {
        resSummary.innerHTML = `🎯 To reach your <strong>${curr}${remaining.toLocaleString()}</strong> goal in <strong>1 week</strong>, save <strong>${curr}${weeklyNeeded.toFixed(2)} this week</strong> (or <strong>${curr}${dailyNeeded.toFixed(2)} each day</strong>)! 🚀`;
      } else {
        resSummary.innerHTML = `🎯 To reach your <strong>${curr}${remaining.toLocaleString()}</strong> goal in <strong>${timeVal} weeks</strong>, save <strong>${curr}${weeklyNeeded.toFixed(2)} each week</strong> (or <strong>${curr}${dailyNeeded.toFixed(2)} each day</strong>)! 🚀`;
      }

    } else {
      // months
      const months = Math.max(1, timeVal);
      const weeks = months * 4.333;
      const days = months * 30.417;

      const monthlyNeeded = remaining / months;
      const weeklyNeeded = remaining / weeks;
      const dailyNeeded = remaining / days;

      resultsGrid.innerHTML = `
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">MONTHLY NEEDED</span>
          <div style="font-size:1.4rem; font-weight:800; font-family:var(--font-mono); color:var(--accent-amber);">${curr}${monthlyNeeded.toFixed(2)} / mo</div>
        </div>
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">WEEKLY NEEDED</span>
          <div style="font-size:1.4rem; font-weight:800; font-family:var(--font-mono); color:var(--accent-purple);">${curr}${weeklyNeeded.toFixed(2)} / wk</div>
        </div>
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">DAILY NEEDED</span>
          <div style="font-size:1.4rem; font-weight:800; font-family:var(--font-mono); color:var(--accent-emerald);">${curr}${dailyNeeded.toFixed(2)} / day</div>
        </div>
      `;

      if (timeVal === 1) {
        resSummary.innerHTML = `🎯 To reach your <strong>${curr}${remaining.toLocaleString()}</strong> goal in <strong>1 month</strong>, save <strong>${curr}${monthlyNeeded.toFixed(2)} this month</strong> (or <strong>${curr}${weeklyNeeded.toFixed(2)} each week</strong>)! 🚀`;
      } else {
        resSummary.innerHTML = `🎯 To reach your <strong>${curr}${remaining.toLocaleString()}</strong> goal in <strong>${timeVal} months</strong>, save <strong>${curr}${monthlyNeeded.toFixed(2)} each month</strong> (or <strong>${curr}${weeklyNeeded.toFixed(2)} each week</strong>)! 🚀`;
      }
    }
  }

  showConfirm(title, message, onConfirmCallback) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const bodyEl = document.getElementById('confirmModalBody');
    const actionBtn = document.getElementById('confirmModalActionBtn');

    const closeModal = () => {
      if (!modal) return;
      try {
        if (modal.hasAttribute('open')) modal.close();
      } catch (e) {
        modal.removeAttribute('open');
      }
    };

    if (!modal || typeof modal.showModal !== 'function') {
      if (window.confirm(`${title ? title + ':\n' : ''}${message}`)) {
        if (typeof onConfirmCallback === 'function') onConfirmCallback();
      }
      return;
    }

    if (titleEl) titleEl.textContent = title || 'Confirm Action';
    if (bodyEl) bodyEl.textContent = message;

    const newBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newBtn, actionBtn);

    newBtn.onclick = (e) => {
      e.preventDefault();
      closeModal();
      setTimeout(() => {
        if (typeof onConfirmCallback === 'function') {
          onConfirmCallback();
        }
      }, 30);
    };

    modal.onclick = (e) => {
      const rect = modal.getBoundingClientRect();
      const isInside = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
      if (!isInside) {
        closeModal();
      }
    };

    try {
      modal.showModal();
    } catch(err) {
      if (window.confirm(`${title ? title + ':\n' : ''}${message}`)) {
        closeModal();
        if (typeof onConfirmCallback === 'function') onConfirmCallback();
      }
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let strokeColor = '#10b981';
    let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

    if (type === 'warning') {
      strokeColor = '#f59e0b';
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else if (type === 'error') {
      strokeColor = '#f43f5e';
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'info') {
      strokeColor = '#6366f1';
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

window.app = new App();

// Safe fallback override for window.alert
window.alert = function(msg) {
  if (window.app && typeof window.app.showToast === 'function') {
    window.app.showToast(msg, 'warning');
  } else {
    console.warn('Alert:', msg);
  }
};
