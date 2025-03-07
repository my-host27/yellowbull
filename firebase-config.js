
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";


import { firebaseConfig } from "./config.js";




const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        console.log("🔍 Checking user auth state...");

        if (user) {
            console.log("✅ User found:", user.uid);
            document.getElementById("userInfo").innerHTML = `Welcome, your UID is: <b>${user.uid}</b>`;
        } else {
            console.log("❌ No user found, redirecting to login...");
            window.location.href = "/login";
        }
    });
}

export function logoutUser() {
    signOut(auth)
        .then(() => {
            console.log("✅ User logged out");
            window.location.href = "/login";
        })
        .catch(error => {
            console.error("❌ Error logging out:", error.message);
        });
}

export { auth, db, sendEmailVerification, updateDoc, getDoc, createUserWithEmailAndPassword, signOut, onAuthStateChanged, setDoc, doc, Timestamp };
