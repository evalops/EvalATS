import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
])

export default clerkMiddleware((auth, req) => {
  const { userId, sessionId } = auth()

  // If user is signed in and trying to access sign-in/sign-up pages, redirect to home
  if (userId && sessionId) {
    if (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // If it's a public route, allow access
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // For protected routes, check authentication
  if (!userId) {
    // Store the original URL to redirect back after login
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}