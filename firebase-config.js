// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlKtGQE9Odl_Dj1xwMEczqr5O46yIoWvQ",
  authDomain: "vidul-bio-mass.firebaseapp.com",
  projectId: "vidul-bio-mass",
  storageBucket: "vidul-bio-mass.firebasestorage.app",
  messagingSenderId: "907765287948",
  appId: "1:907765287948:web:5ccbfdf4a25bd37a8d7229"
};


// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Export for use in other files
window.firebaseApp = app;
window.firestoreDB = db;
window.firebaseAuth = auth;