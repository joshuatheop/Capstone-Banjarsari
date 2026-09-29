import Link from 'next/link';
import { Leaf } from 'lucide-react';
import styles from './Footer.module.css';
export default function Footer() {
  return <footer className={styles.footer}><div><Link href="/" className={styles.brand}><Leaf size={24}/>Palugada</Link><p>Dari Banjarsari untuk semua kebutuhanmu.</p><nav aria-label="Informasi Palugada"><Link href="/bisnis">Toko warga</Link><Link href="/jasa">Jasa</Link><Link href="/orders">Pesanan</Link><Link href="/profile">Akun & bantuan</Link></nav><small>© {new Date().getFullYear()} PALUGADA · Banjarsari, Garut</small></div></footer>;
}
