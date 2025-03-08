import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";

import { 
    getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, 
    updateEmail, verifyBeforeUpdateEmail, reauthenticateWithCredential, 
    createUserWithEmailAndPassword, sendPasswordResetEmail, 
    sendEmailVerification, signOut, onAuthStateChanged, EmailAuthProvider 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import { 
    getFirestore, doc, setDoc, getDoc, updateDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export async function resetPassword(email) {
    if (!email) {
        return Promise.reject("❌ Please enter a valid email.");
    }

    try {
        await sendPasswordResetEmail(auth, email);
        return Promise.resolve("✅ Password reset email sent! Please check your inbox.");
    } catch (error) {
        console.error("🔥 Error:", error.message);
        return Promise.reject(error.message);
    }
}

export async function signInUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            throw new Error("❌ Please verify your email before logging in.");
        }

        console.log("✅ User signed in:", user.uid);
        localStorage.setItem('loggedInUserId', user.uid);
        return user;
    } catch (error) {
        console.error("🔥 Login error:", error.message);
        throw error;
    }
}

export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const userRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
            await setDoc(userRef, {
                userName: user.displayName,
                email: user.email,
                createdAt: Timestamp.now(),
                provider: "Google"
            });
        }

        console.log("✅ Google Sign-In Successful:", user.uid);
        localStorage.setItem('loggedInUserId', user.uid);
        return user;
    } catch (error) {
        console.error("🔥 Google Sign-In Error:", error.message);
        throw error;
    }
}

export function logoutUser() {
    signOut(auth)
        .then(() => {
            console.log("✅ User logged out");
            localStorage.removeItem('loggedInUserId');
            window.location.href = "/login";
        })
        .catch(error => {
            console.error("❌ Error logging out:", error.message);
        });
}

export { 
    auth, db, sendEmailVerification, updateDoc, getDoc, verifyBeforeUpdateEmail, 
    createUserWithEmailAndPassword, reauthenticateWithCredential, updateEmail, 
    onAuthStateChanged, setDoc, doc, Timestamp, EmailAuthProvider 
};
