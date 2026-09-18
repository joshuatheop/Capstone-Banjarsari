'use client';

import Link from 'next/link';
import type { ProdukItem } from '@/lib/firestore/types';

interface ProductCardProps {
  product: ProdukItem;
  businessName: string;
  categoryName?: string;
}

const formatPrice = (price: number) => {
  const formatted = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
};

const ProductCard = ({ product, businessName, categoryName }: ProductCardProps) => {
  const displayCategory = categoryName || product.category_id;

  return (
    <Link href={`/produk/${product.product_id}`} className="fl-card">
      {/* Thumbnail */}
      <div className="fl-card-thumb">
        {product.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnail_url} alt={product.product_name} className="fl-card-img" />
        ) : (
          <div className="fl-card-placeholder">
            <span>{displayCategory}</span>
          </div>
        )}
        <div className="fl-card-hot-badge">
          <span>⚡ TERPOPULER</span>
        </div>
      </div>

      {/* Body */}
      <div className="fl-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="fl-card-brand">{businessName}</div>
        </div>
        <div className="fl-card-name">{product.product_name}</div>
        <div className="fl-card-meta">
          <span className="fl-card-cat">{displayCategory}</span>
        </div>
        <div className="fl-card-price">{formatPrice(product.product_price)}</div>
      </div>
    </Link>
  );
};

export default ProductCard;
