// Đọc cấu hình Supabase, chấp nhận cả tên key mới (publishable) lẫn cũ (anon).
// Local dùng anon JWT; cloud (Supabase mới) dùng publishable key `sb_publishable_...`.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
