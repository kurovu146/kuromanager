-- updated_at tự động
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger issues_set_updated_at before update on public.issues
  for each row execute function public.set_updated_at();
create trigger comments_set_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

-- mỗi project tối đa 1 sprint active
create unique index sprints_one_active_per_project
  on public.sprints (project_id) where status = 'active';

-- LƯU Ý BẢO MẬT: KHÔNG tự tạo profile khi có user mới trong auth.users.
-- App là invite-only: profile (và role) chỉ được tạo qua accept_invite (email khớp lời mời)
-- hoặc seed admin. Nếu auto-tạo profile từ raw_user_meta_data, attacker có thể gọi
-- supabase.auth.signUp({ data: { role: 'admin' } }) bằng anon key → tự cấp quyền admin.
-- User signup không qua invite sẽ KHÔNG có profile → is_member() = false → không truy cập được gì.

-- chặn member tự đổi role; chỉ admin (hoặc context bypass của accept_invite) được đổi
create or replace function public.guard_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    if coalesce(current_setting('app.bypass_role_guard', true), '') <> 'on'
       and not public.is_admin() then
      raise exception 'Chỉ admin được đổi vai trò';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_role_change();
