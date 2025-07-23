'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { AuthProvider } from '../components/AuthProvider';
import useSocket from '../hooks/useSocket';

export function SessionProvider({ children }) {
  // Socket PERMANENTLY disabled to prevent auto-refresh
  return (
    <NextAuthSessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextAuthSessionProvider>
  );
}
