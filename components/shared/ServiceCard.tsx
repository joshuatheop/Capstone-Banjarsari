'use client';

import Link from 'next/link';
import type { ServiceItem } from '@/lib/firestore/types';
import { getServicePriceDisplay } from '@/lib/firestore/types';

interface ServiceCardProps {
  service: ServiceItem;
  businessName: string;
  categoryName?: string;
}

const ServiceCard = ({ service, businessName, categoryName }: ServiceCardProps) => {
  const displayCategory = categoryName || service.category_id;
  const priceDisplay = getServicePriceDisplay(service);

  return (
    <Link href={`/layanan/${service.service_id}`} className="fl-card">
      {/* Thumbnail */}
      <div className="fl-card-thumb">
        {service.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={service.thumbnail_url} alt={service.service_name} className="fl-card-img" />
        ) : (
          <div className="fl-card-placeholder">
            <span>{displayCategory}</span>
          </div>
        )}
        <div className="fl-card-service-badge">JASA</div>
      </div>

      {/* Body */}
      <div className="fl-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="fl-card-brand">{businessName}</div>
        </div>
        <div className="fl-card-name">{service.service_name}</div>
        <div className="fl-card-meta">
          <span className="fl-card-cat">{displayCategory}</span>
        </div>
        <div className="fl-card-price">{priceDisplay}</div>
      </div>
    </Link>
  );
};

export default ServiceCard;
