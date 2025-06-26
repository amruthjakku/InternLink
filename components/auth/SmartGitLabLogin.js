'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

/**
 * Smart GitLab Login Component
 * Handles OAuth sign-in with enhanced UX
 */
export function SmartGitLabLogin({ 
  callbackUrl = '/auth/onboarding',
  className = '',
  variant = 'primary',
  size = 'default',
  showIcon = true,
  children
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGitLabLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Initiating GitLab OAuth login...');
      
      const result = await signIn('gitlab', { 
        callbackUrl,
        redirect: true
      });
      
      // If we get here without redirect, there might be an error
      if (result?.error) {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ GitLab login error:', error);
      setError(error.message || 'Failed to sign in with GitLab');
      setIsLoading(false);
    }
  };

  // Button variants
  const variants = {
    primary: 'bg-orange-600 hover:bg-orange-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
    outline: 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50',
    minimal: 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
  };

  const sizes = {
    small: 'px-3 py-2 text-sm',
    default: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `;

  return (
    <div className="space-y-2">
      <button
        onClick={handleGitLabLogin}
        disabled={isLoading}
        className={baseClasses}
        type="button"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </>
        ) : (
          <>
            {showIcon && (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z"/>
              </svg>
            )}
            {children || 'Continue with GitLab'}
          </>
        )}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Sign-in Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-2">
                <button
                  onClick={() => setError(null)}
                  className="text-sm text-red-600 hover:text-red-500 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Preset variants for common use cases
 */
export function GitLabLoginButton(props) {
  return <SmartGitLabLogin variant="primary" size="default" {...props} />;
}

export function GitLabLoginButtonSecondary(props) {
  return <SmartGitLabLogin variant="secondary" size="default" {...props} />;
}

export function GitLabLoginButtonLarge(props) {
  return <SmartGitLabLogin variant="primary" size="large" {...props} />;
}

export function GitLabLoginLink(props) {
  return <SmartGitLabLogin variant="minimal" size="small" showIcon={false} {...props} />;
}