import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* 🔥 FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyC-VYNAvS0oZaKBJsmxBIhfIqYCz2n8R18",
  authDomain: "baluflix-13303.firebaseapp.com",
  projectId: "baluflix-13303"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* 🔐 ADMIN EMAILS */
const ADMIN_EMAILS = [
  "admin@baluflix.com"
];

/* ======================
   FORM SUBMISSION HANDLER
====================== */
document.getElementById("loginForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("loginBtn");
    const error = document.getElementById("error");

    // Reset states
    error.style.display = "none";
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading"></span>Signing In...';

    // Validate admin email
    if (!ADMIN_EMAILS.includes(email)) {
      error.innerText = "Access denied. Admin privileges required.";
      error.style.display = "block";
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Sign In';
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success - redirect to admin panel
      window.location.href = "admin.html";
    } catch (err) {
      // Handle different error types
      let errorMessage = "Login failed. Please try again.";

      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
        case 'auth/user-not-found':
          errorMessage = "No account found with this email.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection.";
          break;
        default:
          errorMessage = err.message || errorMessage;
      }

      error.innerText = errorMessage;
      error.style.display = "block";
    } finally {
      // Reset button state
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Sign In';
    }
  });
