import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkicy71PjUxRBuRFuedQ68nKi377qSGqw",
  authDomain: "ecommerce-banjarsari.firebaseapp.com",
  projectId: "ecommerce-banjarsari",
  storageBucket: "ecommerce-banjarsari.firebasestorage.app",
  messagingSenderId: "966137875672",
  appId: "1:966137875672:web:fde30ff1f609dfd0df9bad"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  const email = "admin2@bojongstore.com";
  const passwords = ["admin12345", "admin123", "admin1234", "bojongstore", "bojongstore123"];
  
  let user = null;
  for (const password of passwords) {
    try {
      console.log(`Mencoba login dengan password: ${password}...`);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      user = cred.user;
      console.log("Login sukses!");
      console.log("UID Pengguna:", user.uid);
      break;
    } catch (err) {
      console.log(`Gagal dengan password ${password}:`, err.code || err.message);
    }
  }

  if (!user) {
    console.log("Tidak dapat login dengan password bawaan/umum. Silakan periksa password Anda.");
    return;
  }

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      console.log("Dokumen Firestore ditemukan!");
      console.log("Data Dokumen:", snap.data());
    } else {
      console.log("Dokumen Firestore TIDAK ditemukan untuk UID:", user.uid);
    }
  } catch (err) {
    console.error("Gagal mengambil dokumen Firestore:", err);
  }
}

run();
