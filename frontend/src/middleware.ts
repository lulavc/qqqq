import { NextResponse } from 'next/server'

// Export the middleware function
export function middleware() {
  // Simply pass through all requests
  return NextResponse.next()
}

// Configure which paths this middleware is run for
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
} 