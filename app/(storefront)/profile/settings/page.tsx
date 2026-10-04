import Link from 'next/link';
import styles from '@/components/accounts/accounts.module.css';
export default function Page() { return <main className={styles.page}><h1>Settings akun</h1><p>Kelola profil, alamat, dan status usaha dari akun yang sama.</p><div className={styles.actions}><Link className={styles.primary} href="/profile/addresses">Profil & alamat</Link><Link className={styles.secondary} href="/profile/seller-application">Pengajuan / status toko</Link><Link className={styles.secondary} href="/profile">Pengaturan lainnya</Link></div></main>; }
