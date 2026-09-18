'use client';

import Link from 'next/link';
import type { ProdukItem, ServiceItem } from '@/lib/firestore/types';

interface RankRowProps {
  rank: number;
  item: ProdukItem | ServiceItem;
  type: 'product' | 'service';
  businessName: string;
}

export default function RankRow({ rank, item, type, businessName }: RankRowProps) {
  const isProduct = type === 'product';
  const produk = isProduct ? (item as ProdukItem) : null;
  const jasa   = !isProduct ? (item as ServiceItem) : null;

  const id           = isProduct ? produk!.product_id : jasa!.service_id;
  const name         = isProduct ? produk!.product_name : jasa!.service_name;
  const thumbnailUrl = item.thumbnail_url;
  const categoryId   = item.category_id;
  const href         = isProduct ? `/produk/${id}` : `/layanan/${id}`;

  return (
    <Link href={href} className="fl-rank-row">
      <div className={`fl-rank-num rank-${rank}`}>
        {rank}
      </div>

      <div className="fl-rank-thumb">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt={name} className="fl-rank-img" />
        ) : (
          <div className="fl-rank-placeholder">
            <span>{categoryId ? categoryId.substring(0, 2) : 'Pal'}</span>
          </div>
        )}
      </div>

      <div className="fl-rank-info" style={{ flex: 1, minWidth: 0 }}>
        <h4 className="fl-rank-title">{name}</h4>
        <p className="fl-rank-business">{businessName}</p>
      </div>
    </Link>
  );
}
