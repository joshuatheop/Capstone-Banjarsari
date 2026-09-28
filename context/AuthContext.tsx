'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { LOCAL_PREVIEW, type PreviewUser } from '@/lib/local-preview';

type Role = 'admin' | 'customer' | 'seller' | 'courier' | 'pelanggan' | null;

interface AuthContextType {
  user: Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL'> | null;
  role: Role;
  photoURL: string | null;
  displayName: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  photoURL: null,
  displayName: null,
  loading: true,
  logout: async () => {},
});

function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [role, setRole]               = useState<Role>(null);
  const [photoURL, setPhotoURL]       = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    let unsubsDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubsDoc) {
        unsubsDoc();
        unsubsDoc = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setDisplayName(firebaseUser.displayName);
        setPhotoURL(firebaseUser.photoURL);

        // Subscribe realtime ke Firestore users/{uid}
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubsDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setRole((data.role as Role) || 'pelanggan');
            if (data.photoURL) setPhotoURL(data.photoURL);
            if (data.displayName) setDisplayName(data.displayName);
          } else {
            setRole('pelanggan');
          }
          setLoading(false);
        }, (err) => {
          console.error('[AuthContext] Error listening to user doc:', err);
          setRole('pelanggan');
          setLoading(false);
        });
      } else {
        setUser(null);
        setRole(null);
        setPhotoURL(null);
        setDisplayName(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubsDoc) unsubsDoc();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    setPhotoURL(null);
    setDisplayName(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, photoURL, displayName, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PreviewUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch('/api/local/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => { if (active) setUser(data.user ?? null); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const logout = async () => {
    const response = await fetch('/api/local/session', { method: 'DELETE' });
    if (!response.ok) throw new Error('Gagal keluar. Coba lagi.');
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, role: user?.role ?? null, photoURL: null, displayName: user?.displayName ?? null, loading, logout }}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return LOCAL_PREVIEW ? <LocalAuthProvider>{children}</LocalAuthProvider> : <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}
