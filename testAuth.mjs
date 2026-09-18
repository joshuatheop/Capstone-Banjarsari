import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkicy71PjUxRBuRFuedQ68nKi377qSGqw",
  authDomain: "ecommerce-banjarsari.firebaseapp.com",
  projectId: "ecommerce-banjarsari",
  storageBucket: "ecommerce-banjarsari.firebasestorage.app",
  messagingSenderId: "966137875672",
  appId: "1:966137875672:web:fde30ff1f609dfd0df9bad"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    console.log("Membaca koleksi 'users'...");
    const querySnapshot = await getDocs(collection(db, "users"));
    console.log("Berhasil membaca! Jumlah dokumen:", querySnapshot.size);
    querySnapshot.forEach((doc) => {
      console.log(`ID: ${doc.id} =>`, doc.data());
    });
  } catch (error) {
    console.error("Gagal membaca koleksi 'users':", error);
  }
}

run();
