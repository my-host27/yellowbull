// File: firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

import { firebaseConfig } from "./config.js";

// **Inisialisasi Firebase**
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// **Fungsi Cek Status Login User**
export function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        console.log("🔍 Checking user auth state..."); // Debugging

        if (user) {
            console.log("✅ User found:", user.uid); // Log UID di console
            document.getElementById("userInfo").innerHTML = `Welcome, your UID is: <b>${user.uid}</b>`;
        } else {
            console.log("❌ No user found, redirecting to login...");
            window.location.href = "/login.html";
        }
    });
}

// **Fungsi Logout User**
export function logoutUser() {
    signOut(auth)
        .then(() => {
            console.log("✅ User logged out");
            window.location.href = "/login.html";
        })
        .catch(error => {
            console.error("❌ Error logging out:", error.message);
        });
}

// **Ekspor Firebase dan Fungsinya**
export { auth, db, createUserWithEmailAndPassword, signOut, onAuthStateChanged, setDoc, doc, Timestamp };
