import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";

import SECRET_TOKEN from "./secrets.js";
import { 
    getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, 
    updateEmail, verifyBeforeUpdateEmail, reauthenticateWithCredential, 
    createUserWithEmailAndPassword, sendPasswordResetEmail, 
    sendEmailVerification, signOut, onAuthStateChanged, EmailAuthProvider 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import { 
    getFirestore, doc, setDoc, getDoc, updateDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// ✅ Fungsi untuk memuat `firebaseConfig` dari `env.js`
async function loadEnv() {
    try {
        const response = await fetch("https://firebase-worker.zahrinacandrakanti.workers.dev/", {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SECRET_TOKEN}` // 🔥 Ganti dengan token yang valid
            }
        });

        if (!response.ok) {
            throw new Error(`❌ HTTP Error! Status: ${response.status}`);
        }

        const env = await response.json();
        
        // Debug: Cek apakah data diterima dengan benar
        console.log("✅ Firebase Config Loaded Securely:", env);

        if (!env.FIREBASE_API_KEY) {
            throw new Error("❌ FIREBASE_API_KEY tidak ditemukan dalam response!");
        }

        return env;
    } catch (error) {
        console.error("❌ Failed to load Firebase config from Cloudflare Worker:", error);
        return null;
    }
}


// ✅ Variabel global untuk Firebase
let auth, db, googleProvider, firebaseConfig;

// ✅ Tunggu `firebaseConfig` sebelum inisialisasi Firebase
(async () => {
    const env = await loadEnv();

    firebaseConfig = {
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
        measurementId: env.FIREBASE_MEASUREMENT_ID
    };

    console.log("✅ Firebase Config:", firebaseConfig);
    console.log("✅ Debug - Firebase Config yang digunakan:", firebaseConfig);

    // ✅ Inisialisasi Firebase setelah `firebaseConfig` tersedia
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
})();

// ✅ Fungsi Reset Password
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

// ✅ Fungsi Sign In User
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

// ✅ Fungsi Sign In dengan Google
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

// ✅ Fungsi Logout
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

// ✅ Ekspor variabel dan fungsi yang sudah diinisialisasi
export { 
    auth, db, sendEmailVerification, updateDoc, getDoc, verifyBeforeUpdateEmail, 
    createUserWithEmailAndPassword, reauthenticateWithCredential, updateEmail, 
    onAuthStateChanged, setDoc, doc, Timestamp, EmailAuthProvider 
};
