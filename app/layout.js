import './globals.css';
import { SessionProvider } from './providers';
import ErrorBoundary from '../components/ErrorBoundary';

export const metadata = {
  title: 'Progress Tracker',
  description: 'Track intern progress using GitLab commits',
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <ErrorBoundary>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}