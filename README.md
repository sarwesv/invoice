<<<<<<< HEAD
# invoice
Invoice application
=======
# VaultCraft 🛡️ - GitHub Pages Savings Planner & Tracker

VaultCraft is a modern, high-aesthetic web tool for creating target savings plans, logging savings contributions, tracking progress milestones, and projecting long-term interest gains. It is built as a zero-dependency static web application designed specifically to deploy effortlessly to **GitHub Pages**.

![VaultCraft Showcase](https://img.shields.io/badge/GitHub%20Pages-Ready-10b981?style=for-the-badge&logo=github)

---

## 🌟 Key Features

1. **Target Savings Goals Management**:
   - Create, edit, pause, and track savings goals (e.g. Emergency Fund, Travel, Tech Upgrades, Real Estate).
   - Set target completion dates, custom icons/emojis, category tags, and color themes.
   - Smart velocity status indicators (⚡ On Track, ⚠️ Behind Target, 🎉 Completed).

2. **Savings Logging & Ledger**:
   - Quick log deposit/withdrawal modal.
   - Filterable & searchable transaction ledger table.
   - Export ledger data directly to CSV for Excel/Google Sheets.

3. **Visual Analytics & Charts**:
   - **Savings Velocity Trend**: Smooth SVG line chart with area gradients tracking 6-month growth.
   - **Category Distribution**: Interactive Donut chart displaying goal allocation percentages.

4. **Financial Calculators & Automation**:
   - **Smart Auto-Allocator**: Automatically splits a bulk deposit (e.g. paycheck bonus) across active goals based on urgency and target date.
   - **Compound Interest Calculator**: Forecast long-term savings growth with custom interest rates and timeline sliders.

5. **GitHub Pages Ready & Local Storage Persistence**:
   - Offline-first LocalStorage auto-save.
   - Full JSON Export & Import backup mechanism.
   - Light & Dark mode support.

---

## 🚀 How to Deploy on GitHub Pages

Because VaultCraft relies solely on standard web standards (HTML5, CSS3, ES6 JavaScript), you can publish it to GitHub Pages in 3 quick steps:

### Step 1: Push code to a GitHub Repository
```bash
git init
git add .
git commit -m "Initial VaultCraft deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vaultcraft-savings.git
git push -u origin main
```

### Step 2: Configure GitHub Pages Settings
1. Open your repository on GitHub.
2. Go to **Settings** → **Pages** (under Code and automation).
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`
   - **Branch**: Select `main` and folder `/ (root)`
4. Click **Save**.

### Step 3: Access your Live Savings Tool!
After 1-2 minutes, GitHub will publish your app at:
`https://YOUR_USERNAME.github.io/vaultcraft-savings/`

---

## 💻 Running Locally

Simply double-click `index.html` to open it directly in any web browser, or serve it using Python/VSCode Live Server:

```bash
python3 -m http.server 8000
```
Open `http://localhost:8000` in your browser.
>>>>>>> ae8853d (Add VaultCraft Savings Planner & Tracker for GitHub Pages)
