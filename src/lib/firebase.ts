import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration - This is the SAME project as your bridge.py uses
const firebaseConfig = {
  apiKey: "AIzaSyBw-hgPKkxVRJ0BhEva7YFwGUxaZoTkBko",
  authDomain: "agrorakshakapp.firebaseapp.com",
  databaseURL: "https://agrorakshak-8f739-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agrorakshakapp",
  storageBucket: "agrorakshakapp.firebasestorage.app",
  messagingSenderId: "112259185009",
  appId: "1:112259185009:web:21bc4d5f279db15a471ed0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app,database };