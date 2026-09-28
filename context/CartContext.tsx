'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { CartLine } from '@/lib/commerce/types';
import { useAuth } from './AuthContext';
interface CartContextValue { items: CartLine[]; count: number; ready: boolean; add: (id: string, quantity?: number) => void; update: (id: string, quantity: number) => void; clear: () => void }
const CartContext = createContext<CartContextValue | null>(null);
const read = (key: string): CartLine[] => { try { const items = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(items) ? items.filter((i) => i && typeof i.productId === 'string' && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 99) : []; } catch { return []; } };
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]), [loadedKey, setLoadedKey] = useState('');
  const key = `palugada-cart:${user?.uid ?? 'guest'}`;
  useEffect(() => {
    const load = () => { setItems(read(key)); setLoadedKey(key); };
    const timer = setTimeout(load, 0); window.addEventListener('storage', load);
    return () => { clearTimeout(timer); window.removeEventListener('storage', load); };
  }, [key]);
  const save = (next: CartLine[]) => { localStorage.setItem(key, JSON.stringify(next)); setItems(next); };
  const add = (id: string, quantity = 1) => { const next = read(key); const existing = next.find((line) => line.productId === id); if (existing) existing.quantity = Math.min(99, existing.quantity + quantity); else next.push({ productId: id, quantity }); save(next); };
  const update = (id: string, quantity: number) => save(read(key).map((line) => line.productId === id ? { ...line, quantity: Math.max(0, Math.min(99, quantity)) } : line).filter((line) => line.quantity > 0));
  return <CartContext.Provider value={{ items, count: items.reduce((sum, line) => sum + line.quantity, 0), ready: loadedKey === key && !loading, add, update, clear: () => save([]) }}>{children}</CartContext.Provider>;
};
export const useCart = () => { const value = useContext(CartContext); if (!value) throw new Error('CartProvider belum tersedia'); return value; };
