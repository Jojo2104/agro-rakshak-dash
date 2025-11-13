import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration - This is the SAME project as your bridge.py uses
const firebaseConfig = {
  apiKey: "AIzaSyB0bGAI398tSHiplyNVlfs-Pbv_S3blVWE",
  authDomain: "agrorakshak-project.firebaseapp.com",
  databaseURL: "https://agrorakshak-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agrorakshak-project",
  storageBucket: "agrorakshak-project.firebasestorage.app",
  messagingSenderId: "1051851958973",
  appId: "1:1051851958973:web:c96dcf3c142485078625d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app,database };