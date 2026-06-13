-- Xem trước lời mời (bỏ qua RLS chỉ-admin để trang /invite/[token] đọc được)
create or replace function public.invite_preview(p_token text)
returns table(email text, status text, expired boolean)
language sql security definer set search_path = public as $$
  select email, status, (expires_at <= now()) as expired
  from public.invitations where token = p_token
$$;

-- Chấp nhận lời mời: TẠO profile cho user đang đăng nhập với role của lời mời.
-- Bảo mật: dùng auth.uid() (KHÔNG nhận user_id từ client) + bắt buộc email user khớp
-- email lời mời → không thể nhận lời mời của người khác / leo thang quyền.
create or replace function public.accept_invite(p_token text)
returns void language plpgsql security definer set search_path = public as $$
declare
  inv public.invitations;
  v_email text;
  v_name text;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  select email, coalesce(raw_user_meta_data->>'full_name', split_part(email,'@',1))
    into v_email, v_name
    from auth.users where id = v_uid;

  select * into inv from public.invitations
   where token = p_token and status = 'pending' and expires_at > now()
   for update;
  if not found then
    raise exception 'Lời mời không hợp lệ hoặc đã hết hạn';
  end if;

  if lower(inv.email) <> lower(v_email) then
    raise exception 'Email không khớp lời mời';
  end if;

  perform set_config('app.bypass_role_guard', 'on', true);
  insert into public.profiles (id, email, full_name, role)
    values (v_uid, v_email, v_name, inv.role)
    on conflict (id) do update set role = excluded.role;

  update public.invitations set status = 'accepted' where id = inv.id;
end $$;

grant execute on function public.invite_preview(text) to anon, authenticated;
grant execute on function public.accept_invite(text) to authenticated;
