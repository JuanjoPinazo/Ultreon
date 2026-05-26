// proxy.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh token if expired
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Handle static files / API routes / favicon
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path === '/favicon.ico' ||
    path.includes('.')
  ) {
    return supabaseResponse;
  }

  // If already at login, and we have a user, redirect them to their dashboard
  if (path === '/login') {
    if (user) {
      // Fetch role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();
      
      if (profile?.is_active) {
        const redirectUrl = profile.role === 'admin' ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    }
    return supabaseResponse;
  }

  // Protected routes matcher (dashboard, admin, registry, root)
  const isProtected = path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/registry') || path === '/';

  if (isProtected) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist, is null, or inactive, redirect to login
    if (!profile || !profile.is_active) {
      const response = NextResponse.redirect(new URL('/login?error=inactive', request.url));
      return response;
    }

    // Admin-only protection
    if (path.startsWith('/admin') && profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Root redirect
    if (path === '/') {
      const redirectUrl = profile.role === 'admin' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
