-- Tạo issue: sinh key (project.key + seq tăng atomic) + rank cuối danh sách đích.
create or replace function public.create_issue(
  p_project_id uuid,
  p_title text,
  p_type text,
  p_priority text,
  p_description text default null,
  p_story_points int default null,
  p_assignee_id uuid default null,
  p_sprint_id uuid default null
) returns public.issues
language plpgsql security definer set search_path = public as $$
declare
  v_seq int;
  v_projkey text;
  v_key text;
  v_rank double precision;
  v_issue public.issues;
begin
  if not public.is_member() then
    raise exception 'Không có quyền tạo issue';
  end if;

  update public.projects set issue_seq = issue_seq + 1
    where id = p_project_id
    returning issue_seq, key into v_seq, v_projkey;
  if v_projkey is null then
    raise exception 'Project không tồn tại';
  end if;

  v_key := v_projkey || '-' || v_seq;

  select coalesce(max(rank), 0) + 1024 into v_rank
    from public.issues
    where project_id = p_project_id
      and sprint_id is not distinct from p_sprint_id;

  insert into public.issues(
    project_id, key, title, description, type, priority,
    story_points, assignee_id, reporter_id, sprint_id, rank, status
  ) values (
    p_project_id, v_key, p_title, p_description, p_type, p_priority,
    p_story_points, p_assignee_id, auth.uid(), p_sprint_id, v_rank, 'todo'
  ) returning * into v_issue;

  return v_issue;
end $$;

-- Bắt đầu sprint: chuyển planned → active (DB partial unique index chặn 2 active/project).
create or replace function public.start_sprint(p_sprint_id uuid)
returns public.sprints
language plpgsql security definer set search_path = public as $$
declare
  v_sprint public.sprints;
begin
  if not public.is_member() then
    raise exception 'Không có quyền';
  end if;
  update public.sprints
    set status = 'active', start_date = coalesce(start_date, current_date)
    where id = p_sprint_id and status = 'planned'
    returning * into v_sprint;
  if v_sprint.id is null then
    raise exception 'Sprint không ở trạng thái planned hoặc đã có sprint active';
  end if;
  return v_sprint;
end $$;

-- Hoàn tất sprint: active → completed. Issue chưa done → trả về backlog (sprint_id = null).
create or replace function public.complete_sprint(p_sprint_id uuid)
returns public.sprints
language plpgsql security definer set search_path = public as $$
declare
  v_sprint public.sprints;
begin
  if not public.is_member() then
    raise exception 'Không có quyền';
  end if;
  update public.issues
    set sprint_id = null
    where sprint_id = p_sprint_id and status <> 'done';
  update public.sprints
    set status = 'completed', completed_at = now()
    where id = p_sprint_id and status = 'active'
    returning * into v_sprint;
  if v_sprint.id is null then
    raise exception 'Sprint không ở trạng thái active';
  end if;
  return v_sprint;
end $$;

grant execute on function public.create_issue(uuid,text,text,text,text,int,uuid,uuid) to authenticated;
grant execute on function public.start_sprint(uuid) to authenticated;
grant execute on function public.complete_sprint(uuid) to authenticated;
