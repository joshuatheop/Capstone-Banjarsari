import { CustomerProfileProvider } from '@/context/CustomerProfileContext';
import React from 'react';
import Navbar from "@/components/commerce/CommerceNav";
import Footer from "@/components/shared/Footer";
import { FavoritesProvider } from "@/context/FavoritesContext";
import "@/styles/legacy/responsive.css";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FavoritesProvider><CustomerProfileProvider>
      <div className="storefront-theme" style={{ minHeight: '100vh' }}>
        <div className="app-root">
          <Navbar />
          {children}
          <Footer />
        </div>
      </div>
    </CustomerProfileProvider></FavoritesProvider>
  );
}
