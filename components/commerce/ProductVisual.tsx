import { Laptop, Smartphone, Utensils, ShoppingBag, CupSoda, Package } from 'lucide-react';
import styles from './marketplace.module.css';
interface ProductVisualProps { id: string; name: string }
const ProductVisual = ({ id, name }: ProductVisualProps) => {
  if (id === 'p1' || id === 'p4' || id === 'p8') return <div className={`${styles.productVisual} ${styles.batikArt}`} aria-label={`Ilustrasi ${name}`} role="img"><div className={styles.batikCloth} /><small>ILUSTRASI PRODUK</small></div>;
  if (id === 'p2' || id === 'p5') return <div className={`${styles.productVisual} ${styles.foodArt}`} aria-label={`Ilustrasi ${name}`} role="img"><div className={styles.plate}><div className={id === 'p5' ? styles.rice : styles.tempe} /><span /></div><small>ILUSTRASI MENU</small></div>;
  const Icon = id === 's1' ? Smartphone : id === 's2' ? Laptop : id === 's3' ? Utensils : id === 'p6' ? CupSoda : id === 'p7' ? ShoppingBag : Package;
  return <div className={`${styles.productVisual} ${styles.otherArt}`} aria-label={`Ilustrasi ${name}`} role="img"><Icon size={70} strokeWidth={1.2} /><small>{id.startsWith('s') ? 'LAYANAN WARGA' : 'ILUSTRASI PRODUK'}</small></div>;
};
export default ProductVisual;
