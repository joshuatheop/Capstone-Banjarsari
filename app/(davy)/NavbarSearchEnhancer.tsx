'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function NavbarSearchEnhancer() {
  const searchParams = useSearchParams();
  const currentQuery = searchParams ? (searchParams.get('search') || searchParams.get('q') || '') : '';

  useEffect(() => {
    const handleSearch = (input: HTMLInputElement) => {
      const val = input.value.trim();
      if (val) {
        window.location.href = `/katalog?search=${encodeURIComponent(val)}`;
      }
    };

    // Find desktop & mobile search boxes in navbar
    const searchBoxes = document.querySelectorAll<HTMLElement>('.navbar-search-desktop, .mobile-drawer-search');
    const cleanupFns: (() => void)[] = [];

    searchBoxes.forEach((box) => {
      const input = box.querySelector<HTMLInputElement>('input');
      const icon = box.querySelector<SVGElement>('svg');

      if (input) {
        // Pre-fill input with current search query if present and not currently active
        if (currentQuery && document.activeElement !== input && !input.value) {
          input.value = currentQuery;
        }

        // Enable pressing Enter if somehow missed
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(input);
          }
        };
        input.addEventListener('keydown', onKeyDown);
        cleanupFns.push(() => input.removeEventListener('keydown', onKeyDown));
      }

      // Make search icon clickable
      if (icon && input) {
        icon.style.cursor = 'pointer';
        icon.setAttribute('role', 'button');
        icon.setAttribute('aria-label', 'Cari');

        const onIconClick = (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          handleSearch(input);
        };
        icon.addEventListener('click', onIconClick);
        cleanupFns.push(() => icon.removeEventListener('click', onIconClick));
      }
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [currentQuery]);

  return null;
}
