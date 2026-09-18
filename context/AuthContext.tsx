'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Role = 'admin' | 'pelanggan' | null;

interface AuthContextType {
  user: User | null;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
