/**
 * VaultCraft Firebase Authentication & Google Sign-In Integration
 */

// Firebase Project Configuration
// Replace with your project details from Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
  if (!auth) {
    alert('Firebase is initializing or configuration is needed. Please check firebase-config.js.');
    return;
  }

  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    if (window.app) {
      window.app.showToast(`Signed in as ${user.displayName || user.email}`);
    }
    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    if (error.code === 'auth/unauthorized-domain') {
      alert('Unauthorized Domain: Please add your domain (e.g. localhost or sarwesv.github.io) to Authorized Domains in Firebase Console > Authentication > Settings.');
    } else if (error.code !== 'auth/popup-closed-by-user') {
      alert(`Sign-in Error: ${error.message}`);
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
