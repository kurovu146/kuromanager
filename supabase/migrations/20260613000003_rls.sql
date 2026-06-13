-- helpers
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid())
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- bật RLS
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.projects enable row level security;
alter table public.sprints enable row level security;
alter table public.issues enable row level security;
alter table public.comments enable row level security;

-- profiles: member đọc tất cả; tự sửa hồ sơ mình hoặc admin sửa (role bị guard_role_change kiểm soát)
create policy profiles_select on public.profiles for select using (public.is_member());
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- invitations: chỉ admin
create policy invitations_admin_all on public.invitations for all
  using (public.is_admin()) with check (public.is_admin());

-- projects
create policy projects_select on public.projects for select using (public.is_member());
create policy projects_member_insert on public.projects for insert with check (public.is_member());
create policy projects_member_update on public.projects for update using (public.is_member());
create policy projects_admin_delete on public.projects for delete using (public.is_admin());

-- sprints
create policy sprints_select on public.sprints for select using (public.is_member());
create policy sprints_member_write on public.sprints for all
  using (public.is_member()) with check (public.is_member());

-- issues
create policy issues_select on public.issues for select using (public.is_member());
create policy issues_member_insert on public.issues for insert with check (public.is_member());
create policy issues_member_update on public.issues for update using (public.is_member());
create policy issues_delete on public.issues for delete
  using (reporter_id = auth.uid() or public.is_admin());

-- comments
create policy comments_select on public.comments for select using (public.is_member());
create policy comments_insert on public.comments for insert with check (author_id = auth.uid());
create policy comments_update_own on public.comments for update using (author_id = auth.uid());
create policy comments_delete on public.comments for delete
  using (author_id = auth.uid() or public.is_admin());
