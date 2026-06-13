# KuroManager M1 — Nền tảng (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền tảng KuroManager: scaffold Next.js + Supabase, schema + RLS đầy đủ, auth email/password, mời thành viên qua email, CRUD project, trang quản lý thành viên.

**Architecture:** Next.js 16 App Router (Server Components + Server Actions) gọi Supabase qua `@supabase/ssr`. Postgres giữ bất biến nghiệp vụ bằng trigger + RLS. UI lấy dữ liệu qua hook trong `src/lib/queries/` (bọc TanStack Query) — UI không gọi Supabase trực tiếp. Logic thuần (`rank.ts`) tách khỏi I/O, test bằng Vitest.

**Tech Stack:** Next.js 16, TypeScript (strict), Tailwind, shadcn/ui, @supabase/ssr + supabase-js v2, TanStack Query v5, react-hook-form, zod, sonner, Vitest.

> **Tham chiếu spec:** `docs/superpowers/specs/2026-06-13-kuromanager-design.md` (mục 4 schema, 6 RLS, 7 routes, 8 kiến trúc).

---

## Cấu trúc file M1

| File | Trách nhiệm |
|------|-------------|
| `src/lib/supabase/client.ts` | Supabase client phía browser |
| `src/lib/supabase/server.ts` | Supabase client phía server (đọc cookie) |
| `src/lib/supabase/middleware.ts` | Refresh session trong middleware |
| `src/middleware.ts` | Auth guard route |
| `src/lib/validation/auth.ts` | zod schema login/signup |
| `src/lib/validation/project.ts` | zod schema tạo project |
| `src/lib/validation/invite.ts` | zod schema mời thành viên |
| `src/lib/rank.ts` | `computeRank()` — thuần (dùng cho M2) |
| `src/lib/queries/projects.ts` | hook `useProjects`, `useCreateProject` |
| `src/lib/queries/members.ts` | hook `useMembers`, `useInviteMember` |
| `src/lib/providers.tsx` | QueryClientProvider + Toaster |
| `src/app/login/page.tsx` | trang đăng nhập |
| `src/app/signup/page.tsx` | trang đăng ký (kèm token mời) |
| `src/app/invite/[token]/page.tsx` | nhận lời mời |
| `src/app/(app)/projects/page.tsx` | danh sách + tạo project |
| `src/app/(app)/settings/members/page.tsx` | quản lý thành viên (admin) |
| `src/app/auth/actions.ts` | server actions: signUp, signIn, signOut |
| `src/app/projects/actions.ts` | server actions: createProject, archiveProject |
| `src/app/members/actions.ts` | server actions: inviteMember, acceptInvite, updateRole, removeMember |
| `db/migrations/0001_init.sql` | schema toàn bộ bảng + index |
| `db/migrations/0002_triggers.sql` | trigger updated_at, tạo profile, partial unique sprint |
| `db/policies/0003_rls.sql` | helper is_member/is_admin + policies |
| `db/functions/0004_accept_invite.sql` | RPC accept invite (security definer) |

---

## Task 1: Scaffold Next.js vào thư mục hiện có

**Files:**
- Create: toàn bộ scaffold Next.js trong repo `kuromanager/`

- [ ] **Step 1: Đưa docs ra ngoài tạm để create-next-app không báo lỗi thư mục không rỗng**

```bash
mv docs ../km-docs-tmp
ls -A   # chỉ còn .git
```

- [ ] **Step 2: Scaffold Next.js vào thư mục hiện tại**

```bash
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-turbopack
```
Trả lời prompt còn lại bằng mặc định. Kết quả: có `src/app/`, `package.json`, `tsconfig.json`.

- [ ] **Step 3: Đưa docs trở lại**

```bash
mv ../km-docs-tmp/* docs/ 2>/dev/null; rm -rf ../km-docs-tmp; mv docs . 2>/dev/null; ls docs/superpowers/specs
```
Nếu `docs/` đã ở đúng chỗ thì bỏ qua. Mục tiêu: `docs/superpowers/specs/2026-06-13-kuromanager-design.md` tồn tại.

- [ ] **Step 4: Chạy thử dev server**

Run: `pnpm dev`
Expected: server lên `http://localhost:3000`, trang mặc định Next.js hiển thị. Dừng server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind cho KuroManager"
```

---

## Task 2: Cài dependencies & khởi tạo shadcn/ui

**Files:**
- Modify: `package.json`
- Create: `components.json`, `src/lib/utils.ts` (do shadcn tạo)

- [ ] **Step 1: Cài runtime deps**

```bash
pnpm add @supabase/supabase-js @supabase/ssr @tanstack/react-query react-hook-form zod @hookform/resolvers sonner @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Khởi tạo shadcn/ui**

```bash
pnpm dlx shadcn@latest init -d
```
Chọn base color `slate` nếu được hỏi. Tạo `components.json` + `src/lib/utils.ts`.

- [ ] **Step 3: Thêm vài component shadcn dùng xuyên suốt M1**

```bash
pnpm dlx shadcn@latest add button input label card dialog dropdown-menu select textarea badge avatar sonner
```

- [ ] **Step 4: Verify build không lỗi type**

Run: `pnpm tsc --noEmit`
Expected: không có lỗi.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: thêm deps (supabase, react-query, dnd-kit, rhf, zod) + shadcn/ui"
```

---

## Task 3: Cấu hình Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/__tests__/smoke.test.ts`
- Modify: `package.json` (script `test`)

- [ ] **Step 1: Viết test smoke (failing vì chưa có config)**

`src/lib/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('chạy được vitest', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận chưa chạy được**

Run: `pnpm vitest run`
Expected: FAIL — `vitest: command not found` hoặc không có config.

- [ ] **Step 3: Cài vitest + tạo config**

```bash
pnpm add -D vitest
```
`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
```
Thêm vào `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Chạy lại, xác nhận pass**

Run: `pnpm test`
Expected: PASS — 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: cấu hình Vitest"
```

---

## Task 4: Supabase clients + biến môi trường

**Files:**
- Create: `.env.local`, `.env.example`
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Tạo file env**

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
`.env.local`: copy từ `.env.example` rồi điền giá trị thật từ Supabase Dashboard (Project Settings → API). Đảm bảo `.env.local` nằm trong `.gitignore` (Next.js đã ignore sẵn).

- [ ] **Step 2: Client browser**

`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 3: Client server (Next 16 — cookies async)**

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // gọi từ Server Component — bỏ qua, middleware sẽ refresh
          }
        },
      },
    },
  )
}
```

- [ ] **Step 4: Client cho middleware (refresh session)**

`src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
```

- [ ] **Step 5: Verify type**

Run: `pnpm tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Supabase clients (browser/server/middleware) + env example"
```

---

## Task 5: Migration schema toàn bộ bảng

**Files:**
- Create: `db/migrations/0001_init.sql`

> Chạy SQL: dán vào Supabase Dashboard → SQL Editor → Run. (Hoặc Supabase CLI `supabase db push` nếu đã link.) Mỗi task SQL có 1 step verify bằng query.

- [ ] **Step 1: Viết migration schema**

`db/migrations/0001_init.sql`:
```sql
-- profiles: mở rộng auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);

-- invitations
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null default 'member' check (role in ('admin','member')),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','expired')),
  invited_by uuid references public.profiles(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
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
  story_points int,
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
```

- [ ] **Step 2: Chạy migration trên Supabase**

Dán nội dung file vào SQL Editor → Run.
Expected: "Success. No rows returned".

- [ ] **Step 3: Verify bảng đã tạo**

Run trong SQL Editor:
```sql
select table_name from information_schema.tables
where table_schema='public' order by table_name;
```
Expected: trả về `comments, invitations, issues, profiles, projects, sprints`.

- [ ] **Step 4: Commit**

```bash
git add db/migrations/0001_init.sql
git commit -m "feat(db): schema bảng profiles/projects/sprints/issues/comments/invitations"
```

---

## Task 6: Triggers, updated_at, partial unique sprint, tạo profile khi signup

**Files:**
- Create: `db/migrations/0002_triggers.sql`

- [ ] **Step 1: Viết triggers**

`db/migrations/0002_triggers.sql`:
```sql
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

-- tạo profile khi có user mới trong auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Chạy trên Supabase**

Dán vào SQL Editor → Run.
Expected: Success.

- [ ] **Step 3: Verify trigger tạo profile hoạt động**

Tại Dashboard → Authentication → Add user (email test, auto-confirm). Sau đó:
```sql
select id, email, role from public.profiles;
```
Expected: có 1 dòng profile khớp user vừa tạo, role `member`.

- [ ] **Step 4: Promote user test thành admin (để test luồng admin sau)**

```sql
update public.profiles set role='admin' where email='<email_test>';
```
Expected: UPDATE 1.

- [ ] **Step 5: Commit**

```bash
git add db/migrations/0002_triggers.sql
git commit -m "feat(db): trigger updated_at, tạo profile khi signup, partial unique sprint active"
```

---

## Task 7: RLS policies

**Files:**
- Create: `db/policies/0003_rls.sql`

- [ ] **Step 1: Viết RLS**

`db/policies/0003_rls.sql`:
```sql
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

-- profiles
create policy profiles_select on public.profiles for select using (public.is_member());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy profiles_admin_update on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- invitations (chỉ admin)
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
```

- [ ] **Step 2: Chạy trên Supabase**

Dán vào SQL Editor → Run.
Expected: Success.

- [ ] **Step 3: Verify RLS đã bật**

```sql
select relname, relrowsecurity from pg_class
where relname in ('profiles','projects','sprints','issues','comments','invitations');
```
Expected: cột `relrowsecurity` = `true` cho cả 6 bảng.

- [ ] **Step 4: Commit**

```bash
git add db/policies/0003_rls.sql
git commit -m "feat(db): RLS policies + helper is_member/is_admin"
```

---

## Task 8: zod validation schemas

**Files:**
- Create: `src/lib/validation/auth.ts`, `src/lib/validation/project.ts`, `src/lib/validation/invite.ts`
- Test: `src/lib/validation/validation.test.ts`

- [ ] **Step 1: Viết test (failing)**

`src/lib/validation/validation.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { signUpSchema } from './auth'
import { createProjectSchema } from './project'
import { inviteSchema } from './invite'

describe('signUpSchema', () => {
  it('chấp nhận input hợp lệ', () => {
    const r = signUpSchema.safeParse({ email: 'a@b.com', password: '123456', fullName: 'A' })
    expect(r.success).toBe(true)
  })
  it('từ chối password ngắn', () => {
    const r = signUpSchema.safeParse({ email: 'a@b.com', password: '123', fullName: 'A' })
    expect(r.success).toBe(false)
  })
})

describe('createProjectSchema', () => {
  it('key phải in hoa 2-10 ký tự', () => {
    expect(createProjectSchema.safeParse({ name: 'Web', key: 'WEB' }).success).toBe(true)
    expect(createProjectSchema.safeParse({ name: 'Web', key: 'web' }).success).toBe(false)
    expect(createProjectSchema.safeParse({ name: 'Web', key: 'W' }).success).toBe(false)
  })
})

describe('inviteSchema', () => {
  it('email hợp lệ + role hợp lệ', () => {
    expect(inviteSchema.safeParse({ email: 'a@b.com', role: 'member' }).success).toBe(true)
    expect(inviteSchema.safeParse({ email: 'x', role: 'member' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `pnpm test`
Expected: FAIL — không import được module.

- [ ] **Step 3: Viết schemas**

`src/lib/validation/auth.ts`:
```ts
import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(1, 'Nhập tên'),
  token: z.string().optional(),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
```

`src/lib/validation/project.ts`:
```ts
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nhập tên project'),
  key: z.string().regex(/^[A-Z0-9]{2,10}$/, 'Key in hoa, 2-10 ký tự'),
  description: z.string().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
```

`src/lib/validation/invite.ts`:
```ts
import { z } from 'zod'

export const inviteSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  role: z.enum(['admin', 'member']),
})

export type InviteInput = z.infer<typeof inviteSchema>
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `pnpm test`
Expected: PASS — tất cả test validation pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: zod schemas (auth, project, invite) + test"
```

---

## Task 9: lib/rank.ts (thuần) + test

**Files:**
- Create: `src/lib/rank.ts`
- Test: `src/lib/rank.test.ts`

> `computeRank` dùng cho kéo-thả ở M2/M3, nhưng là logic thuần nên làm TDD ngay tại nền tảng.

- [ ] **Step 1: Viết test (failing)**

`src/lib/rank.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computeRank, RANK_STEP } from './rank'

describe('computeRank', () => {
  it('danh sách rỗng → 0', () => {
    expect(computeRank(undefined, undefined)).toBe(0)
  })
  it('chèn cuối (chỉ có prev) → prev + STEP', () => {
    expect(computeRank(1000, undefined)).toBe(1000 + RANK_STEP)
  })
  it('chèn đầu (chỉ có next) → next - STEP', () => {
    expect(computeRank(undefined, 1000)).toBe(1000 - RANK_STEP)
  })
  it('chèn giữa → trung bình', () => {
    expect(computeRank(1000, 2000)).toBe(1500)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `pnpm test`
Expected: FAIL — không import được `./rank`.

- [ ] **Step 3: Viết implementation**

`src/lib/rank.ts`:
```ts
export const RANK_STEP = 1024

/**
 * Tính rank cho item chèn giữa `prev` và `next` (theo thứ tự hiển thị).
 * - Cả hai undefined: danh sách rỗng → 0
 * - Chỉ prev: chèn cuối → prev + STEP
 * - Chỉ next: chèn đầu → next - STEP
 * - Cả hai: trung bình
 */
export function computeRank(prev: number | undefined, next: number | undefined): number {
  if (prev === undefined && next === undefined) return 0
  if (next === undefined) return prev! + RANK_STEP
  if (prev === undefined) return next - RANK_STEP
  return (prev + next) / 2
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: computeRank() cho sắp xếp kéo-thả + test"
```

---

## Task 10: Providers (React Query + Toaster)

**Files:**
- Create: `src/lib/providers.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Tạo providers**

`src/lib/providers.tsx`:
```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
```

- [ ] **Step 2: Bọc layout**

Trong `src/app/layout.tsx`, import `Providers` và bọc `{children}`:
```tsx
import { Providers } from '@/lib/providers'
// ... trong <body>:
//   <Providers>{children}</Providers>
```

- [ ] **Step 3: Verify type + dev**

Run: `pnpm tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Providers (React Query + Toaster)"
```

---

## Task 11: Auth — server actions + middleware

**Files:**
- Create: `src/app/auth/actions.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Server actions auth**

`src/app/auth/actions.ts`:
```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signInSchema, signUpSchema } from '@/lib/validation/auth'

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: error.message }
  redirect('/projects')
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  })
  if (error) return { error: error.message }
  redirect('/projects')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: Middleware auth guard**

`src/middleware.ts`:
```ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC = ['/login', '/signup', '/invite', '/auth']

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 3: Verify type**

Run: `pnpm tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(auth): server actions signIn/signUp/signOut + middleware guard"
```

---

## Task 12: Trang login & signup

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/signup/page.tsx`
- Create: `src/components/auth/AuthForm.tsx`

- [ ] **Step 1: Component form dùng chung**

`src/components/auth/AuthForm.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Action = (fd: FormData) => Promise<{ error?: string } | void>

export function AuthForm({
  mode,
  action,
  token,
  defaultEmail,
}: {
  mode: 'signin' | 'signup'
  action: Action
  token?: string
  defaultEmail?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await action(formData)
      if (res?.error) {
        setError(res.error)
        toast.error(res.error)
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {mode === 'signup' && (
        <div className="space-y-1">
          <Label htmlFor="fullName">Họ tên</Label>
          <Input id="fullName" name="fullName" required />
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={defaultEmail} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      {token && <input type="hidden" name="token" value={token} />}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Đang xử lý…' : mode === 'signin' ? 'Đăng nhập' : 'Đăng ký'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Trang login**

`src/app/login/page.tsx`:
```tsx
import Link from 'next/link'
import { signIn } from '@/app/auth/actions'
import { AuthForm } from '@/components/auth/AuthForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Đăng nhập KuroManager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthForm mode="signin" action={signIn} />
          <p className="text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link href="/signup" className="underline">
              Đăng ký
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Trang signup**

`src/app/signup/page.tsx`:
```tsx
import { signUp } from '@/app/auth/actions'
import { AuthForm } from '@/components/auth/AuthForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Đăng ký KuroManager</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm mode="signup" action={signUp} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Verify thủ công**

Run: `pnpm dev`, mở `http://localhost:3000/login`. Đăng nhập bằng user test (Task 6). Kỳ vọng: redirect sang `/projects` (hiện 404 vì chưa có trang — bình thường, sẽ làm Task 14). Chưa đăng nhập mà vào `/projects` → bị đẩy về `/login`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): trang login & signup"
```

---

## Task 13: Mời thành viên — RPC accept + server actions

**Files:**
- Create: `db/functions/0004_accept_invite.sql`
- Create: `src/app/members/actions.ts`

- [ ] **Step 1: RPC accept invite (security definer)**

`db/functions/0004_accept_invite.sql`:
```sql
-- Đánh dấu invitation đã dùng + set role cho profile vừa tạo.
-- Gọi sau khi user đăng ký bằng token. Chạy bằng quyền definer để bỏ qua RLS.
create or replace function public.accept_invite(p_token text, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  inv public.invitations;
begin
  select * into inv from public.invitations
   where token = p_token and status = 'pending' and expires_at > now();
  if not found then
    raise exception 'Lời mời không hợp lệ hoặc đã hết hạn';
  end if;

  update public.profiles set role = inv.role where id = p_user_id;
  update public.invitations set status = 'accepted' where id = inv.id;
end $$;
```
Dán vào SQL Editor → Run. Expected: Success.

- [ ] **Step 2: Server actions thành viên**

`src/app/members/actions.ts`:
```ts
'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { inviteSchema } from '@/lib/validation/invite'

export async function inviteMember(formData: FormData) {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const token = randomBytes(24).toString('hex')
  const { error } = await supabase.from('invitations').insert({
    email: parsed.data.email,
    role: parsed.data.role,
    token,
  })
  if (error) return { error: error.message }

  const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/invite/${token}`
  revalidatePath('/settings/members')
  // MVP: trả link để admin gửi tay (chưa tích hợp email service)
  return { link }
}

export async function acceptInvite(token: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('accept_invite', {
    p_token: token,
    p_user_id: userId,
  })
  if (error) return { error: error.message }
  return {}
}

export async function updateRole(userId: string, role: 'admin' | 'member') {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/settings/members')
  return {}
}
```

> **Ghi chú MVP:** chưa gắn email service nên `inviteMember` trả về `link` để admin copy gửi tay. Tích hợp Resend/email là việc giai đoạn sau (thêm vào non-goals đã nêu trong spec).

- [ ] **Step 3: Thêm env site url**

Thêm vào `.env.example` và `.env.local`: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

- [ ] **Step 4: Verify type**

Run: `pnpm tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(members): RPC accept_invite + server actions mời/đổi role"
```

---

## Task 14: Trang nhận lời mời `/invite/[token]`

**Files:**
- Create: `src/app/invite/[token]/page.tsx`
- Create: `src/app/invite/[token]/InviteClient.tsx`

- [ ] **Step 1: Server component đọc invitation**

`src/app/invite/[token]/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { InviteClient } from './InviteClient'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  // đọc invitation qua RPC riêng để bỏ qua RLS chỉ-admin
  const { data } = await supabase
    .rpc('invite_preview', { p_token: token })
    .single<{ email: string; status: string; expired: boolean }>()

  if (!data || data.status !== 'pending' || data.expired) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Lời mời không hợp lệ hoặc đã hết hạn.</p>
      </div>
    )
  }
  return <InviteClient token={token} email={data.email} />
}
```

- [ ] **Step 2: Thêm RPC `invite_preview`**

Bổ sung vào `db/functions/0004_accept_invite.sql` rồi chạy lại đoạn này trên SQL Editor:
```sql
create or replace function public.invite_preview(p_token text)
returns table(email text, status text, expired boolean)
language sql security definer set search_path = public as $$
  select email, status, (expires_at <= now()) as expired
  from public.invitations where token = p_token
$$;
```

- [ ] **Step 3: Client component đăng ký bằng token**

`src/app/invite/[token]/InviteClient.tsx`:
```tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { acceptInvite } from '@/app/members/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function InviteClient({ token, email }: { token: string; email: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password: String(fd.get('password')),
        options: { data: { full_name: String(fd.get('fullName')) } },
      })
      if (error || !data.user) {
        toast.error(error?.message ?? 'Đăng ký thất bại')
        return
      }
      const res = await acceptInvite(token, data.user.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Tham gia thành công!')
      router.push('/projects')
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Tham gia KuroManager</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fullName">Họ tên</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Đang xử lý…' : 'Tham gia'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Verify type**

Run: `pnpm tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(members): trang nhận lời mời /invite/[token]"
```

---

## Task 15: Query hooks projects & members

**Files:**
- Create: `src/lib/queries/projects.ts`
- Create: `src/lib/queries/members.ts`

- [ ] **Step 1: Hook projects**

`src/lib/queries/projects.ts`:
```ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Project = {
  id: string
  key: string
  name: string
  description: string | null
  lead_id: string | null
  archived_at: string | null
  created_at: string
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
```

- [ ] **Step 2: Hook members**

`src/lib/queries/members.ts`:
```ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Member = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'member'
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async (): Promise<Member[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,role')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Member[]
    },
  })
}
```

- [ ] **Step 3: Verify type**

Run: `pnpm tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(queries): hook useProjects, useMembers"
```

---

## Task 16: Layout app + nút đăng xuất

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/AppNav.tsx`

- [ ] **Step 1: Nav**

`src/components/AppNav.tsx`:
```tsx
import Link from 'next/link'
import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

export function AppNav() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <nav className="flex gap-4">
        <Link href="/projects" className="font-semibold">
          KuroManager
        </Link>
        <Link href="/settings/members" className="text-sm text-muted-foreground">
          Thành viên
        </Link>
      </nav>
      <form action={signOut}>
        <Button variant="ghost" size="sm">
          Đăng xuất
        </Button>
      </form>
    </header>
  )
}
```

- [ ] **Step 2: Layout nhóm `(app)`**

`src/app/(app)/layout.tsx`:
```tsx
import { AppNav } from '@/components/AppNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AppNav />
      <main className="p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Verify type**

Run: `pnpm tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: layout app + nav + đăng xuất"
```

---

## Task 17: Trang projects (danh sách + tạo)

**Files:**
- Create: `src/app/projects/actions.ts`
- Create: `src/app/(app)/projects/page.tsx`
- Create: `src/components/project/ProjectList.tsx`
- Create: `src/components/project/CreateProjectDialog.tsx`

- [ ] **Step 1: Server action tạo/archive project**

`src/app/projects/actions.ts`:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createProjectSchema } from '@/lib/validation/project'

export async function createProject(formData: FormData) {
  const parsed = createProjectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('projects').insert(parsed.data)
  if (error) return { error: error.message }
  revalidatePath('/projects')
  return {}
}

export async function archiveProject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projects')
  return {}
}
```

- [ ] **Step 2: Dialog tạo project**

`src/components/project/CreateProjectDialog.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createProject } from '@/app/projects/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const qc = useQueryClient()

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await createProject(fd)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Đã tạo project')
      qc.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Tạo project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project mới</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Tên</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="key">Key (vd WEB)</Label>
            <Input id="key" name="key" placeholder="WEB" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Mô tả</Label>
            <Input id="description" name="description" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Đang tạo…' : 'Tạo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Danh sách project**

`src/components/project/ProjectList.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useProjects } from '@/lib/queries/projects'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ProjectList() {
  const { data, isLoading } = useProjects()

  if (isLoading) return <p className="text-muted-foreground">Đang tải…</p>
  if (!data?.length) return <p className="text-muted-foreground">Chưa có project nào.</p>

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((p) => (
        <Link key={p.id} href={`/projects/${p.key}/board`}>
          <Card className="transition hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{p.name}</CardTitle>
              <Badge variant="secondary">{p.key}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {p.description ?? '—'}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Trang projects**

`src/app/(app)/projects/page.tsx`:
```tsx
import { ProjectList } from '@/components/project/ProjectList'
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dự án</h1>
        <CreateProjectDialog />
      </div>
      <ProjectList />
    </div>
  )
}
```

- [ ] **Step 5: Verify thủ công**

Run: `pnpm dev`, đăng nhập, vào `/projects`. Tạo project key `WEB`. Kỳ vọng: card xuất hiện ngay (link tới board sẽ 404 đến khi làm M2 — chấp nhận). Thử key `web` (thường) → toast lỗi validation.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(projects): trang danh sách + dialog tạo project"
```

---

## Task 18: Trang quản lý thành viên `/settings/members`

**Files:**
- Create: `src/app/(app)/settings/members/page.tsx`
- Create: `src/components/members/MemberList.tsx`
- Create: `src/components/members/InviteDialog.tsx`

- [ ] **Step 1: Dialog mời**

`src/components/members/InviteDialog.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { inviteMember } from '@/app/members/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function InviteDialog() {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<string>()
  const [pending, startTransition] = useTransition()

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await inviteMember(fd)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setLink(res.link)
      toast.success('Đã tạo lời mời — copy link gửi cho thành viên')
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Mời thành viên</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mời thành viên</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Vai trò</Label>
            <Select name="role" defaultValue="member">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Đang tạo…' : 'Tạo lời mời'}
          </Button>
          {link && (
            <div className="rounded bg-muted p-2 text-xs break-all">{link}</div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Danh sách thành viên + đổi role**

`src/components/members/MemberList.tsx`:
```tsx
'use client'

import { useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMembers } from '@/lib/queries/members'
import { updateRole } from '@/app/members/actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export function MemberList() {
  const { data, isLoading } = useMembers()
  const [, startTransition] = useTransition()
  const qc = useQueryClient()

  if (isLoading) return <p className="text-muted-foreground">Đang tải…</p>

  function changeRole(id: string, role: 'admin' | 'member') {
    startTransition(async () => {
      const res = await updateRole(id, role)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Đã đổi vai trò')
      qc.invalidateQueries({ queryKey: ['members'] })
    })
  }

  return (
    <ul className="divide-y rounded border">
      {data?.map((m) => (
        <li key={m.id} className="flex items-center justify-between p-3">
          <div>
            <p className="font-medium">{m.full_name ?? m.email}</p>
            <p className="text-sm text-muted-foreground">{m.email}</p>
          </div>
          <Select
            defaultValue={m.role}
            onValueChange={(v) => changeRole(m.id, v as 'admin' | 'member')}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 3: Trang members**

`src/app/(app)/settings/members/page.tsx`:
```tsx
import { MemberList } from '@/components/members/MemberList'
import { InviteDialog } from '@/components/members/InviteDialog'

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thành viên</h1>
        <InviteDialog />
      </div>
      <MemberList />
    </div>
  )
}
```

- [ ] **Step 4: Verify thủ công luồng mời đầy đủ**

Run: `pnpm dev`. Đăng nhập bằng admin (Task 6). Vào `/settings/members` → "Mời thành viên" với email mới → copy link `/invite/<token>`. Mở link (cửa sổ ẩn danh) → đăng ký → kỳ vọng tham gia thành công, vào `/projects`. Quay lại admin, refresh `/settings/members` → thấy thành viên mới với đúng role.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(members): trang quản lý thành viên + mời + đổi role"
```

---

## Task 19: Trang chủ redirect + dọn dẹp

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Redirect trang gốc về /projects**

`src/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/projects')
}
```

- [ ] **Step 2: Verify toàn bộ**

Run: `pnpm tsc --noEmit && pnpm test && pnpm build`
Expected: type sạch, test pass, build thành công.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: redirect trang gốc về /projects"
```

---

## Hoàn tất M1

Sau Task 19, KuroManager đã có: auth email/password, mời thành viên (link tay), CRUD project, quản lý thành viên, schema + RLS đầy đủ cho cả M2/M3. Đây là phần mềm chạy được, test được.

**Tiếp theo:** viết plan **M2 — Issues + Board** (RPC `create_issue`, IssueForm, IssueDetail, BoardView dnd-kit, optimistic update).
