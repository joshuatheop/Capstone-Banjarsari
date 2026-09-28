'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Heart, Search, ShoppingCart, UserRound, Home, Grid2X2, ClipboardList } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './marketplace.module.css';
export default function CommerceNav() {
 const pathname=usePathname(); const {user,role}=useAuth(); const cart=useCart();
 const links=[['/','Beranda'],['/katalog','Semua produk'],['/makanan','Makanan & minuman'],['/jasa','Jasa'],['/bisnis','Toko warga']];
 const account=user?(role==='admin'?'/admin':'/profile'):'/login';
 return <><header className={styles.header}><div className={styles.topBar}><span>Belanja dekat, dukung usaha Banjarsari</span><Link href="/orders">Pesanan saya</Link></div><div className={styles.navMain}><Link className={styles.brand} href="/"><Image src="/Logo Palugada.png" width={36} height={36} alt=""/><span>PALUGADA<small>BANJARSARI</small></span></Link><form action="/katalog" className={styles.search} role="search"><input name="q" aria-label="Cari produk, makanan, atau jasa" placeholder="Cari produk, makanan, atau jasa…"/><button aria-label="Cari"><Search size={20}/></button></form><div className={styles.navTools}><Link href="/favorites" aria-label="Favorit"><Heart size={22}/></Link><Link href="/cart" aria-label={`Keranjang, ${cart.count} produk`}><ShoppingCart size={23}/>{cart.count>0&&<b className={styles.cartCount}>{cart.count}</b>}</Link><Link href={account}><UserRound size={22}/><span>{user?(role==='admin'?'Dashboard':'Akun saya'):'Masuk'}</span></Link></div></div><nav className={styles.navLinks} aria-label="Navigasi utama">{links.map(([href,label])=><Link key={href} href={href} aria-current={pathname===href?'page':undefined}>{label}</Link>)}</nav></header><nav className={styles.mobileBottom} aria-label="Navigasi bawah">{[{href:'/',label:'Beranda',icon:Home},{href:'/katalog',label:'Katalog',icon:Grid2X2},{href:'/cart',label:'Keranjang',icon:ShoppingCart},{href:'/orders',label:'Pesanan',icon:ClipboardList},{href:account,label:'Akun',icon:UserRound}].map(({href,label,icon:Icon})=><Link key={label} href={href} aria-current={pathname===href?'page':undefined}><Icon size={21}/>{label}</Link>)}</nav></>;
}