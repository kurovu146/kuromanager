import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { SUPABASE_KEY, SUPABASE_URL } from './env'

/**
 * Client service-role (BỎ QUA RLS) — CHỈ dùng server-side cho thao tác quản trị
 * (admin thêm user). Luôn kiểm tra người gọi là admin TRƯỚC khi dùng.
 * Service role key không bao giờ lộ ra client.
 */
export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Gọi từ Server Component — bỏ qua, proxy sẽ refresh session.
          }
        },
      },
    },
  )
}
