'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  isUnlocked: boolean;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  storedPin: string | null;
  recoveryEmail: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isUnlocked: false,
  unlock: async () => false,
  lock: () => {},
  storedPin: null,
  recoveryEmail: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPin();
  }, []);

  const fetchPin = async () => {
    try {
      const { data } = await (supabase.from('configuracion') as any)
        .select('password_hash, email')
        .eq('id', 1)
        .maybeSingle() as { data: { password_hash: string; email: string | null } | null };

      if (data) {
        setStoredPin(data.password_hash);
        setRecoveryEmail(data.email);
      } else {
        // No config row exists yet — default PIN is 123456
        setStoredPin('123456');
        setRecoveryEmail(null);
      }
    } catch {
      setStoredPin('123456');
    } finally {
      setLoading(false);
    }
  };

  const unlock = async (pin: string): Promise<boolean> => {
    if (pin === storedPin) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lock = () => {
    setIsUnlocked(false);
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1A1A2E',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#22C55E',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isUnlocked, unlock, lock, storedPin, recoveryEmail }}>
      {children}
    </AuthContext.Provider>
  );
}
