// client/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-VYNAvS0oZaKBJsmxBIhfIqYCz2n8R18",
  authDomain: window.location.hostname === 'localhost' ? window.location.host : "baluflix-13303.firebaseapp.com",
  databaseURL: "https://baluflix-13303-default-rtdb.firebaseio.com",
  projectId: "baluflix-13303",
  storageBucket: "baluflix-13303.firebasestorage.app",
  messagingSenderId: "827330535550",
  appId: "1:827330535550:web:e56f2c6e2e863eb3aaf82f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
