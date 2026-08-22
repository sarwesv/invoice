# VaultCraft 🛡️ - Savings Planner & Tracker

VaultCraft is a modern web application for creating target savings goals, logging contributions, tracking progress milestones, and projecting long-term savings growth.

---

## 🌟 Key Features

1. **Target Savings Goals**: Create, edit, and track savings goals with target amounts, target dates, and custom icons.
2. **Transaction History**: Simple deposit and withdrawal logging with CSV export.
3. **Firebase & Google Sign-In Integration**: Authenticates users securely using Google Sign-In.
4. **Visual Analytics & Charts**: Custom SVG line and donut charts showing savings momentum over time.
5. **Calculators**: Compound savings calculator and bulk deposit auto-allocator.

---

## 🔥 Setting Up Firebase & Google Sign-In

To enable Google Sign-In for your deployment:

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. **Enable Google Authentication**:
   - Go to **Build** → **Authentication** → **Sign-in method**.
   - Click **Google**, enable it, select a support email, and click **Save**.
3. **Add Authorized Domains**:
   - Under **Authentication** → **Settings** → **Authorized domains**, add:
     - `localhost` (for local development)
     - `sarwesv.github.io` (for GitHub Pages deployment)
4. **Copy Web App Config**:
   - Go to **Project Settings** (gear icon) → **General** → **Your apps** → **Web App**.
   - Copy the `firebaseConfig` object and paste it into `js/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 💻 Running Locally

Simply serve the directory using Python or VSCode Live Server:

```bash
python3 -m http.server 8085
```
Open `http://localhost:8085` in your browser.
