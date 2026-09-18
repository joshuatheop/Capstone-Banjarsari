import React from 'react';

export default function TheoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theo-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  );
}
