import Link from 'next/link';
import Image from 'next/image';
import { Icons } from './Icons';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          {/* Brand Column */}
          <div className="footer-brand">
            {/* Partner Logos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  src="/logo-banjarsari.png"
                  alt="Kelurahan Banjarsari"
                  width={40}
                  height={48}
                  style={{ objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>

            <h3>PALUGADA</h3>
            <p>
              Platform katalog digital UMKM Kelurahan Banjarsari. Menghubungkan warga dan memajukan ekonomi lokal
            </p>
          </div>

          {/* Links Column */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: 16 }}>
              Jelajahi
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Produk UMKM', href: '/katalog?type=product' },
                { label: 'Layanan Jasa', href: '/katalog?type=service' },
                { label: 'Profil UMKM', href: '/bisnis' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, transition: 'color 0.15s' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: 16 }}>
              Informasi
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Website Desa', href: '#' },
                { label: 'Hubungi Kami', href: '' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, transition: 'color 0.15s' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            © {year} PALUGADA · Kelurahan Banjarsari
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            Dikembangkan oleh tim Telkom University
            <Image
              src="/logotelkom.png"
              alt="Telkom University"
              width={30}
              height={30}
              style={{ objectFit: 'contain', display: 'block', opacity: 0.7 }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
