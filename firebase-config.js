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

const API_BASE_URL = "https://my-first-production-e414.up.railway.app"; 
let SECRET_TOKEN = null;

async function preloadSecretToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-secret`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer secure-app-key", 
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch secret token");
        }

        const data = await response.json();
        SECRET_TOKEN = data.secret;
    } catch (error) {
        console.error("❌ Error fetching secret token:", error);
    }
}

async function loadEnv() {
    try {
        if (!SECRET_TOKEN) throw new Error("❌ SECRET_TOKEN belum terdefinisi!");

        const response = await fetch("https://firebase-worker.zahrinacandrakanti.workers.dev/", {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SECRET_TOKEN}` 
            }
        });

        if (!response.ok) {
            throw new Error(`❌ HTTP Error! Status: ${response.status}`);
        }

        const env = await response.json();
        
        if (!env.FIREBASE_API_KEY) {
            throw new Error("❌ FIREBASE_API_KEY tidak ditemukan dalam response!");
        }

        return env;
    } catch (error) {
        console.error("❌ Failed to load Firebase config from Cloudflare Worker:", error);
        return null;
    }
}

let auth, db, googleProvider, firebaseConfig;

(async () => {
    await preloadSecretToken(); 

    const env = await loadEnv();
    if (!env) {
        console.error("❌ Firebase config gagal dimuat. Pastikan API bekerja!");
        return;
    }

    firebaseConfig = {
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
        measurementId: env.FIREBASE_MEASUREMENT_ID
    };

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();

})();


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
