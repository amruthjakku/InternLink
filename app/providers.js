'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { AuthProvider } from '../components/AuthProvider';
import useSocket from '../hooks/useSocket';

export function SessionProvider({ children }) {
  useSocket();
  return (
    <NextAuthSessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextAuthSessionProvider>
  );
}
