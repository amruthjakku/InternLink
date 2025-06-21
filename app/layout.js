import './globals.css';
import { SessionProvider } from './providers';

export const metadata = {
  title: 'Progress Tracker',
  description: 'Track intern progress using GitLab commits',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}