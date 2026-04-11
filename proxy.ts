import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // 1. If user is not logged in
  if (!user && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url)) // Or /auth depending on your setup
  }

  // 2. If user is logged in
  if (user && path.startsWith('/dashboard')) {
    // Fetch role from app_users table directly using email
    const { data: appUser } = await supabase
      .from('app_users')
      .select('role')
      .eq('email', user.email)
      .maybeSingle()

    // Enforce EMPLOYEE fallback if record missing
    const role = appUser?.role || 'EMPLOYEE'

    // Root dashboard redirect to specific dashboard based on role
    if (path === '/dashboard') {
      if (role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      } else if (role === 'MANAGER') {
        return NextResponse.redirect(new URL('/dashboard/manager', request.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard/employee', request.url))
      }
    }

    // Security: Prevent accessing other dashboards
    if (path.startsWith('/dashboard/admin') && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (path.startsWith('/dashboard/manager') && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Employee tries accessing admin or manager routes (already handled above natively)
    if (path.startsWith('/dashboard/employee') && role !== 'EMPLOYEE' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Optional: redirect logged-in users away from auth login screens
  if (user && (path === '/login' || path === '/auth')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Protect ALL routes except static files, icon, and specific extensions
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
