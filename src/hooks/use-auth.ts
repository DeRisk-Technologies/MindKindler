// src/hooks/use-auth.ts

import { useState, useEffect } from 'react';
import { User, getIdTokenResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface AuthUser extends User {
    role?: string;
    tenantId?: string;
    region?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
          const token = await getIdTokenResult(u);
          const extendedUser = u as AuthUser;
          extendedUser.role = token.claims.role as string;
          extendedUser.tenantId = token.claims.tenantId as string;
          extendedUser.region = token.claims.region as string;
          setUser(extendedUser);
      } else {
          setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}
