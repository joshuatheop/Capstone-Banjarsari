import { Laptop, Smartphone, Utensils, Package } from 'lucide-react';
import styles from './marketplace.module.css';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
/** Generated demo imagery; seller photographs take precedence. */
export default function ProductVisual({ id, name }: { id: string; name: string }) {
  const index = LOCAL_PREVIEW && /^p[1-8]$/.test(id) ? Number(id.slice(1)) - 1 : -1;
  if (index >= 0) return <div className={`${styles.productVisual} ${styles.productAtlas}`} role="img" aria-label={`Ilustrasi contoh ${name}`} style={{ backgroundPosition: `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100}%` }} />;
  const Icon = id === 's1' ? Smartphone : id === 's2' ? Laptop : id === 's3' ? Utensils : Package;
  return <div className={`${styles.productVisual} ${styles.otherArt}`} role="img" aria-label={`Ilustrasi ${name}`}><Icon size={64} strokeWidth={1.4} /></div>;
}
