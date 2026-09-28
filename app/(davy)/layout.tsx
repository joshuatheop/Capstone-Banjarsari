import React from 'react';
import Navbar from "@/components/commerce/CommerceNav";
import Footer from "@/components/shared/Footer";
import { FavoritesProvider } from "@/context/FavoritesContext";
import "./davy-responsive.css";

export default function DavyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FavoritesProvider>
      <div className="davy-theme" style={{ minHeight: '100vh' }}>
        <div className="app-root">
          <Navbar />
          {children}
          <Footer />
        </div>
      </div>
    </FavoritesProvider>
  );
}
