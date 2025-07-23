import { SessionProvider } from '../providers';

export default function DashboardLayout({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}