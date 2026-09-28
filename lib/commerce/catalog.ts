import { mockProducts } from '../firestore/mock-data';

// Sample catalogue. Local product IDs and prices remain the single checkout authority.
export const previewProducts = [
  ...mockProducts,
  { ...mockProducts[1], product_id: 'p5', product_name: 'Nasi Ayam Sambal Ijo', product_price: 22000, slug: 'nasi-ayam-sambal-ijo', product_description: 'Nasi hangat, ayam goreng, sambal ijo, dan lalapan. Satu porsi makan siang rumahan.', clickCount: 125 },
  { ...mockProducts[1], product_id: 'p6', product_name: 'Es Teh Lemon Segar', product_price: 8000, slug: 'es-teh-lemon', product_description: 'Teh segar dengan irisan lemon, disajikan dingin. Pilihan minuman dari dapur warga.', clickCount: 78 },
  { ...mockProducts[0], product_id: 'p7', product_name: 'Tas Belanja Anyaman', product_price: 65000, slug: 'tas-anyaman', product_description: 'Tas anyaman serbaguna untuk belanja harian. Dibuat oleh pengrajin lokal.', clickCount: 84 },
  { ...mockProducts[0], product_id: 'p8', product_name: 'Dompet Batik Banjarsari', product_price: 35000, slug: 'dompet-batik', product_description: 'Dompet kecil bermotif batik untuk uang dan kartu. Ringkas untuk dibawa sehari-hari.', clickCount: 72 },
];
export const initialStock = Object.fromEntries(previewProducts.map((p) => [p.product_id, ['p2', 'p5', 'p6'].includes(p.product_id) ? 30 : 20]));
