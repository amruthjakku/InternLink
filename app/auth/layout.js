import { SessionProvider } from '../providers';

export default function AuthLayout({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}