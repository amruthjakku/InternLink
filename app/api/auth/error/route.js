import { NextResponse } from 'next/server';

/**
 * GET /api/auth/error
 * Handles authentication errors and provides error information
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  
  // Get additional error details if available
  const errorDescription = searchParams.get('error_description');
  const errorUri = searchParams.get('error_uri');
  
  console.log('Auth Error Debug:', { 
    error, 
    errorDescription, 
    errorUri,
    allParams: Object.fromEntries(searchParams.entries())
  });
  
  let errorMessage = 'An unknown authentication error occurred';
  let errorCode = 'unknown';
  let errorDetails = errorDescription || '';
  
  switch (error) {
    case 'AccessDenied':
      errorMessage = 'Authentication failed - please try again';
      errorCode = 'access_denied';
      break;
    case 'OAuthSignin':
      errorMessage = 'Error starting the GitLab sign in process';
      errorCode = 'oauth_signin';
      break;
    case 'OAuthCallback':
      errorMessage = 'Error processing the GitLab authentication response';
      errorCode = 'oauth_callback';
      break;
    case 'OAuthCreateAccount':
      errorMessage = 'Error creating your account from GitLab profile';
      errorCode = 'oauth_create_account';
      break;
    case 'EmailCreateAccount':
      errorMessage = 'Error creating your account with email';
      errorCode = 'email_create_account';
      break;
    case 'Callback':
      errorMessage = 'Error during the authentication callback process';
      errorCode = 'callback';
      break;
    case 'Configuration':
      errorMessage = 'There was a problem with the authentication configuration';
      errorCode = 'configuration';
      break;
    case 'Verification':
      errorMessage = 'Unable to verify your GitLab account';
      errorCode = 'verification';
      break;
    case 'Default':
    default:
      errorMessage = 'An unexpected error occurred during authentication';
      errorCode = 'default';
  }
  
  // Redirect to the error page with the error information
  return NextResponse.json({
    error: true,
    code: errorCode,
    message: errorMessage,
    details: errorDetails,
    originalError: error,
    redirectTo: `/auth/error?error=${error || 'Default'}`
  });
}