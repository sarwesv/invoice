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
    document.addEventListener('DOMContentLoaded', () => {
      this.bindEvents();
      this.applyTheme(window.store.theme);
      this.render();
    });
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

    const allocForm = document.getElementById('allocForm');
    if (allocForm) {
      allocForm.addEventListener('submit', (e) => this.handleAutoAllocSubmit(e));
    }

    const compoundForm = document.getElementById('compoundForm');
    if (compoundForm) {
      compoundForm.addEventListener('input', () => this.calculateCompoundInterest());
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
    if (this.currentTab === 'dashboard') {
      this.renderDashboard();
    } else if (this.currentTab === 'plans') {
      this.renderPlans();
    } else if (this.currentTab === 'ledger') {
      this.renderLedger();
    } else if (this.currentTab === 'tools') {
      this.calculateCompoundInterest();
    }
  }

  renderSummary() {
    const summaryContainer = document.getElementById('summaryCardsContainer');
    if (summaryContainer) {
      summaryContainer.innerHTML = UIComponents.renderSummaryCards(window.store);
    }
  }

  renderDashboard() {
    // Render Plans preview grid
    const plansPreview = document.getElementById('dashboardPlansContainer');
    if (plansPreview) {
      const activePlans = window.store.getPlans('all', 'active').slice(0, 3);
      if (activePlans.length === 0) {
        plansPreview.innerHTML = `<div class="empty-state"><p class="empty-title">No Active Plans</p><button class="btn btn-primary btn-sm" onclick="app.openNewPlanModal()">+ Create Plan</button></div>`;
      } else {
        plansPreview.innerHTML = activePlans.map(p => UIComponents.renderPlanCard(p, window.store)).join('');
      }
    }

    // Render Charts
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
          <p class="empty-title">No Savings Plans Found</p>
          <p style="font-size:0.85rem; margin-bottom:1rem;">Start setting up your target savings goals now.</p>
          <button class="btn btn-primary" onclick="app.openNewPlanModal()">+ Create New Goal Plan</button>
        </div>
      `;
    } else {
      grid.innerHTML = plans.map(p => UIComponents.renderPlanCard(p, window.store)).join('');
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

    // Populate plan filter select dropdown if needed
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
    document.querySelectorAll('.filter-bar .chip-btn').forEach(btn => {
      if (btn.getAttribute('data-cat') === category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
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
    document.getElementById('planInitialInput').value = plan.currentAmount;
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

  deletePlan(planId) {
    if (confirm('Are you sure you want to delete this savings plan? Associated log transactions will also be removed.')) {
      window.store.deletePlan(planId);
      this.showToast('Plan deleted.');
      this.render();
    }
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
      this.showToast('Please select a target plan!');
      return;
    }

    window.store.addTransaction(txData);
    document.getElementById('txModal').close();
    this.showToast(txData.type === 'deposit' ? 'Deposit logged successfully!' : 'Withdrawal logged.');
    this.render();
  }

  deleteTransaction(txId) {
    if (confirm('Delete this savings record?')) {
      window.store.deleteTransaction(txId);
      this.showToast('Transaction removed.');
      this.render();
    }
  }

  openAutoAllocModal() {
    document.getElementById('allocAmountInput').value = '500';
    this.calculateAutoAlloc();
    document.getElementById('allocModal').showModal();
  }

  calculateAutoAlloc() {
    const amount = parseFloat(document.getElementById('allocAmountInput')?.value) || 0;
    const allocations = window.store.autoAllocateBulkAmount(amount);
    const container = document.getElementById('allocResultsContainer');

    if (allocations.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">No active incomplete plans available for allocation.</p>`;
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
          note: 'Smart Auto-Allocation deposit'
        });
      }
    });

    document.getElementById('allocModal').close();
    this.showToast('Bulk savings allocated across goals!');
    this.render();
  }

  calculateCompoundInterest() {
    const principal = parseFloat(document.getElementById('compoundPrincipal')?.value) || 1000;
    const monthlyDep = parseFloat(document.getElementById('compoundMonthly')?.value) || 200;
    const ratePct = parseFloat(document.getElementById('compoundRate')?.value) || 7;
    const years = parseInt(document.getElementById('compoundYears')?.value) || 10;

    const r = ratePct / 100 / 12;
    const n = years * 12;
    let balance = principal;
    let totalDeposited = principal;

    for (let i = 0; i < n; i++) {
      balance = (balance + monthlyDep) * (1 + r);
      totalDeposited += monthlyDep;
    }

    const interestEarned = balance - totalDeposited;

    const resVal = document.getElementById('compoundTotalVal');
    const resDep = document.getElementById('compoundTotalDeposited');
    const resInt = document.getElementById('compoundTotalInterest');

    if (resVal) resVal.textContent = `${window.store.currency}${Math.round(balance).toLocaleString()}`;
    if (resDep) resDep.textContent = `${window.store.currency}${Math.round(totalDeposited).toLocaleString()}`;
    if (resInt) resInt.textContent = `${window.store.currency}${Math.round(interestEarned).toLocaleString()}`;
  }

  openGitHubPagesModal() {
    document.getElementById('ghPagesModal').showModal();
  }

  openBackupModal() {
    document.getElementById('backupModal').showModal();
  }

  importJSONFile(inputEl) {
    const file = inputEl.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = window.store.importJSON(e.target.result);
        if (success) {
          this.showToast('Backup restored successfully!');
          document.getElementById('backupModal').close();
          this.render();
        } else {
          alert('Failed to import JSON file. Please ensure it is a valid VaultCraft backup file.');
        }
      };
      reader.readAsText(file);
    }
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

window.app = new App();
