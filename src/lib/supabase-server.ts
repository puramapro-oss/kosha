import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { APP_SCHEMA } from './constants'

// Server client — Server Components + API routes + middleware (lit/écrit cookies)
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: APP_SCHEMA },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components peuvent throw — middleware refresh les cookies
          }
        },
      },
    }
  )
}
