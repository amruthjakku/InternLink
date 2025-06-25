'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { AuthProvider } from '../components/AuthProvider';

export function SessionProvider({ children }) {
  return (
    <NextAuthSessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextAuthSessionProvider>
  );
}