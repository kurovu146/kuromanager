-- KuroManager schema
-- profiles: mở rộng auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('admin','member')),
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[A-Z0-9]{2,10}$'),
  name text not null,
  description text,
  lead_id uuid references public.profiles(id),
  issue_seq int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- sprints
create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  goal text,
  status text not null default 'planned' check (status in ('planned','active','completed')),
  start_date date,
  end_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- issues
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null unique,
  title text not null,
  description text,
  type text not null default 'task' check (type in ('story','task','bug')),
  status text not null default 'todo' check (status in ('todo','in_progress','in_review','done')),
  priority text not null default 'medium' check (priority in ('lowest','low','medium','high','highest')),
  story_points int check (story_points is null or story_points >= 0),
  assignee_id uuid references public.profiles(id),
  reporter_id uuid not null references public.profiles(id),
  sprint_id uuid references public.sprints(id) on delete set null,
  rank double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indexes
create index issues_board_idx on public.issues (project_id, sprint_id, status, rank);
create index issues_backlog_idx on public.issues (project_id) where sprint_id is null;
create index comments_issue_idx on public.comments (issue_id, created_at);
create index sprints_project_idx on public.sprints (project_id, status);
