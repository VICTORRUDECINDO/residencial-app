'use client';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import LockScreen from '@/components/LockScreen';
import Sidebar from '@/components/layout/Sidebar';

function AppGate({ children }: { children: React.ReactNode }) {
  const { isUnlocked } = useAuth();

  if (!isUnlocked) {
    return <LockScreen />;
  }

  return (
    <>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppGate>{children}</AppGate>
    </AuthProvider>
  );
}
