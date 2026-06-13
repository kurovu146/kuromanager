-- Xem trước lời mời (bỏ qua RLS chỉ-admin để trang /invite/[token] đọc được)
create or replace function public.invite_preview(p_token text)
returns table(email text, status text, expired boolean)
language sql security definer set search_path = public as $$
  select email, status, (expires_at <= now()) as expired
  from public.invitations where token = p_token
$$;

-- Chấp nhận lời mời: set role cho profile vừa tạo + đánh dấu invitation accepted.
-- Gọi sau khi user đăng ký bằng token. Security definer + bypass guard role.
create or replace function public.accept_invite(p_token text, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  inv public.invitations;
begin
  select * into inv from public.invitations
   where token = p_token and status = 'pending' and expires_at > now()
   for update;
  if not found then
    raise exception 'Lời mời không hợp lệ hoặc đã hết hạn';
  end if;

  perform set_config('app.bypass_role_guard', 'on', true);
  update public.profiles set role = inv.role where id = p_user_id;
  update public.invitations set status = 'accepted' where id = inv.id;
end $$;

-- Cho phép anon/authenticated gọi 2 RPC trên
grant execute on function public.invite_preview(text) to anon, authenticated;
grant execute on function public.accept_invite(text, uuid) to anon, authenticated;
