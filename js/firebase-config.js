/**
 * VaultCraft Firebase Authentication & Google Sign-In Integration
 */

// Firebase Project Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4QGocLJ3Ibk3s9qFaQLOQziuNkUOKlZQ",
  authDomain: "savenest-app-2026.firebaseapp.com",
  projectId: "savenest-app-2026",
  storageBucket: "savenest-app-2026.firebasestorage.app",
  messagingSenderId: "823368458610",
  appId: "1:823368458610:web:892907edc99d282434bdeb"
};

let auth = null;
let googleProvider = null;

function initFirebaseAuth() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded.');
    return;
  }

  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
    } catch (e) {
      console.error('Firebase initialization error:', e);
    }
  }

  try {
    auth = firebase.auth();
    googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');

    // Observe auth state changes
    auth.onAuthStateChanged((user) => {
      window.currentUser = user;
      if (window.app && typeof window.app.onAuthStateChanged === 'function') {
        window.app.onAuthStateChanged(user);
      }
    });
  } catch (e) {
    console.error('Error setting up Firebase Auth:', e);
  }
}

async function signInWithGoogle() {
  if (window.store && window.store.isUserCapReached()) {
    if (window.app) {
      window.app.showToast('🚫 User Limit Reached: VaultCraft has reached its 2,000 (2k) user limit! No more new users can sign in.', 'error');
    }
    return;
  }

  if (!auth) {
    if (window.app) {
      window.app.showToast('⚠️ Firebase is initializing or configuration is needed.', 'warning');
    } else {
      console.warn('Firebase configuration needed.');
    }
    return;
  }

  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    if (window.app) {
      window.app.showToast(`Signed in as ${user.displayName || user.email}`, 'success');
    }
    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    if (error.code === 'auth/unauthorized-domain') {
      if (window.app) {
        window.app.showToast('⚠️ Unauthorized Domain: Add domain in Firebase Console > Auth Settings.', 'warning');
      }
    } else if (error.code !== 'auth/popup-closed-by-user') {
      if (window.app) {
        window.app.showToast(`❌ Sign-in Error: ${error.message}`, 'error');
      }
    }
  }
}

async function signOutUser() {
  if (!auth) return;
  try {
    await auth.signOut();
    if (window.app) {
      window.app.showToast('Signed out successfully.');
    }
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
}

window.initFirebaseAuth = initFirebaseAuth;
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
