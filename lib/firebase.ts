import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9LZTALAdXmbnWFg4gnuoKTg7Kb618tg4",
  authDomain: "lastactof26.firebaseapp.com",
  projectId: "lastactof26",
  storageBucket: "lastactof26.firebasestorage.app",
  messagingSenderId: "910689670982",
  appId: "1:910689670982:web:6862e5e4fe96375880f747"
};

// Initialize Firebase (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

