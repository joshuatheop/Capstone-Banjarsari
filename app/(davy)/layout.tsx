import React, { Suspense } from 'react';
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { FavoritesProvider } from "@/context/FavoritesContext";
import NavbarSearchEnhancer from "./NavbarSearchEnhancer";
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
          <Suspense fallback={null}>
            <NavbarSearchEnhancer />
          </Suspense>
          <Navbar />
          {children}
          <Footer />
        </div>
      </div>
    </FavoritesProvider>
  );
}