-- Bật realtime cho issues & comments (board tự cập nhật, comment trực tiếp).
alter publication supabase_realtime add table public.issues;
alter publication supabase_realtime add table public.comments;
