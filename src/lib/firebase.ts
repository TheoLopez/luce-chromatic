import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { getAI } from "firebase/ai";

const firebaseConfig = {
    apiKey: "AIzaSyDiIA-wrUiXXBfTbYmnsva4FYPgA1lh2xw",
    authDomain: "luce-chromatic-app.firebaseapp.com",
    projectId: "luce-chromatic-app",
    storageBucket: "luce-chromatic-app.firebasestorage.app",
    messagingSenderId: "586272301330",
    appId: "1:586272301330:web:1b82800e08fef6b4d753cb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const vertexAI = getAI(app);
export const projectId = firebaseConfig.projectId;
export const apiKey = firebaseConfig.apiKey;
export const storageBucket = firebaseConfig.storageBucket;
