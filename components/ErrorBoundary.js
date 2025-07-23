'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service (if available)
    if (typeof window !== 'undefined' && window.reportError) {
      window.reportError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-gray-50 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
          <div className="mx-auto max-w-max">
            <main className="sm:flex">
              <div className="flex-shrink-0">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>
              </div>
              <div className="sm:ml-6">
                <div className="sm:border-l sm:border-gray-200 sm:pl-6">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                    Something went wrong
                  </h1>
                  <p className="mt-4 text-base leading-7 text-gray-600">
                    We apologize for the inconvenience. An error occurred while loading this page.
                  </p>
                  <div className="mt-8 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Reload page
                    </button>
                    <button
                      onClick={() => window.history.back()}
                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Go back
                    </button>
                  </div>
                </div>
                
                {isDevelopment && this.state.error && (
                  <div className="mt-8 sm:border-l sm:border-gray-200 sm:pl-6">
                    <h2 className="text-lg font-semibold text-red-600 mb-4">
                      Development Error Details:
                    </h2>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-medium text-red-800 mb-2">Error:</h3>
                      <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.error && this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-red-800 mb-2">Component Stack:</h3>
                        <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-48">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary(Component, errorFallback) {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;