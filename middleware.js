import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and public assets
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/static-signin') ||
    pathname.startsWith('/dashboard-redirect')
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
  

  

  
  // Role-based access control
  if (token) {
    // Admin routes
    if (pathname.startsWith('/admin') && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Tech Lead routes (accessible by Tech Leads and POCs)
    if (pathname.startsWith('/tech-lead') && !['admin', 'Tech Lead', 'POC'].includes(token.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // POC routes (accessible by POCs and admins)
    if (pathname.startsWith('/poc') && !['admin', 'POC'].includes(token.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // AI Developer Intern routes (accessible by AI Developer Interns, Tech Leads, and POCs for supervision)
    if (pathname.startsWith('/ai-developer-intern') && !['admin', 'Tech Lead', 'POC', 'AI Developer Intern'].includes(token.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};