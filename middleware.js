import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and public assets
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

  // Get the user's session token
  const token = await getToken({ req: request });
  
  // If there's no token and the user is trying to access a protected route
  if (!token && pathname !== '/') {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // If the user is inactive, redirect to error page
  if (token?.isActive === false) {
    const url = new URL('/auth/error', request.url);
    url.searchParams.set('error', 'AccessDenied');
    return NextResponse.redirect(url);
  }
  
  // If the user has a pending role, redirect to registration
  if (token?.role === 'pending' && !pathname.startsWith('/registration')) {
    return NextResponse.redirect(new URL('/registration', request.url));
  }
  
  // Role-based access control
  if (token) {
    // Admin routes
    if (pathname.startsWith('/admin') && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Mentor routes
    if (pathname.startsWith('/mentor') && !['admin', 'mentor'].includes(token.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Intern routes
    if (pathname.startsWith('/intern') && !['admin', 'mentor', 'intern'].includes(token.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};