import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { APP_SCHEMA } from '@/lib/constants'

const PUBLIC_PATHS = [
  '/', '/pricing', '/how-it-works', '/ecosystem',
  '/impact-mondial', '/rituels-publics', '/status', '/changelog',
  '/privacy', '/terms', '/legal', '/offline', '/login', '/signup',
  '/mentions-legales', '/politique-confidentialite', '/cgv', '/cgu',
  '/aide', '/contact', '/accessibilite', '/forgot-password',
  '/manifeste',
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/i/')) return true              // lien influenceur
  if (pathname.startsWith('/share/')) return true          // partage public
  if (pathname.startsWith('/cagnottes/')) return true      // cagnottes publiques (lecture)
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/auth/')) return true
  if (pathname.startsWith('/.well-known/')) return true
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|json|xml|txt|wav|mp3|ogg|m4a|flac)$/)) return true
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt' || pathname === '/manifest.json') return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: APP_SCHEMA },
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Logged user trying to reach login/signup → redirect dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Anonymous trying private route → redirect login with next
  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
