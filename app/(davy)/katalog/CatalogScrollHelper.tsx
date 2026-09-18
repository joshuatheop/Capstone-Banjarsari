'use client';

import { useEffect } from 'react';

export default function CatalogScrollHelper({ query }: { query?: string }) {
  useEffect(() => {
    if (!query) return;

    // Smooth scroll down to catalog cards/content so the searched item is immediately visible
    const timer = setTimeout(() => {
      const target =
        document.querySelector('.fl-page-head') ||
        document.querySelector('.fl-toolbar') ||
        document.querySelector('.fl-content');

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  return null;
}
