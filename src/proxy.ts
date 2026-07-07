import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Let the Landing page, logo, static paths and favicon bypass auth
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/verify';

  const isLandingPage = pathname === '/';

  // Do not intercept static assets, images or standard api endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    isLandingPage
  ) {
    return NextResponse.next();
  }

  const payload = token ? await verifyToken(token) : null;

  // Redirect to login if token is missing or invalid
  if (!payload) {
    if (!isAuthPage) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Redirect logged in users away from login/signup pages
  if (isAuthPage) {
    let target = '/';
    if (payload.role === 'STARTUP') target = '/startup';
    else if (payload.role === 'ADMIN') target = '/admin';
    else if (payload.role === 'INSTITUTION') target = '/institution';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Dashboard route restrictions
  if (pathname.startsWith('/startup') && payload.role !== 'STARTUP') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/institution') && payload.role !== 'INSTITUTION') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
