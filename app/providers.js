'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { AuthProvider } from '../components/AuthProvider';
import useSocket from '../hooks/useSocket';

export function SessionProvider({ children }) {
  // Temporarily disable socket to prevent refresh issues
  // useSocket();
  return (
    <NextAuthSessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextAuthSessionProvider>
  );
}
