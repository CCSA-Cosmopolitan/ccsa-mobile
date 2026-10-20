// Firebase service - Simple and reliable initialization
import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  getReactNativePersistence, 
  EmailAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAN03PmR3dfs2WSyI5VzqtAeIe9GomMC44",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "ccsa-mobile.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "ccsa-mobile",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "ccsa-mobile.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "37035927999",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:37035927999:web:e07c672650c0909f9f190a",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-B33V1SJXB5"
};

console.log('🔥 Firebase Config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId
});

/** @type {any} */
let app = null;
/** @type {any} */
let auth = null;
/** @type {any} */
let db = null;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');

  // Initialize Auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('✅ Firebase auth initialized');

  // Initialize Firestore
  db = getFirestore(app);
  console.log('✅ Firestore initialized');

  // Add authentication methods to auth object
  auth.signInWithEmailAndPassword = (email, password) => signInWithEmailAndPassword(auth, email, password);
  auth.createUserWithEmailAndPassword = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  // Note: signOut is already available on auth object - don't override it
  auth.sendPasswordResetEmail = (email) => sendPasswordResetEmail(auth, email);
  auth.updateProfile = (user, profile) => updateProfile(user, profile);
  auth.updatePassword = (user, password) => updatePassword(user, password);
  auth.reauthenticateWithCredential = (user, credential) => reauthenticateWithCredential(user, credential);
  // Note: onAuthStateChanged is already available on the auth object, don't override it
  auth.EmailAuthProvider = EmailAuthProvider;

  console.log('✅ Firebase auth methods attached');

} catch (error) {
  console.error('🚨 Firebase initialization failed:', error);
  throw error;
}

console.log('🔥 Auth object status:', {
  exists: !!auth,
  hasSignIn: !!auth.signInWithEmailAndPassword,
  hasCreateUser: !!auth.createUserWithEmailAndPassword,
  hasSignOut: !!auth.signOut,
  hasOnAuthStateChanged: !!auth.onAuthStateChanged,
  currentUser: auth.currentUser
});

export { auth, db };
export default app;

