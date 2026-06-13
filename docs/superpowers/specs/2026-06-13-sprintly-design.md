# Sprintly — Thiết kế (Design Spec)

> Ngày: 2026-06-13 · Trạng thái: Đã duyệt thiết kế, chờ review spec → writing-plans

## 1. Mục tiêu

Sprintly là công cụ quản lý dự án kiểu Jira (Scrum) cho **một team nhỏ (1 nhóm)**. MVP tập trung vào vòng làm việc Scrum cốt lõi: quản lý nhiều project, viết issue (Story/Task/Bug), lập kế hoạch sprint từ backlog, và theo dõi tiến độ qua Kanban board kéo-thả có realtime.

### Người dùng & quy mô
- 1 workspace dùng chung (toàn bộ app = 1 team). Không multi-organization.
- Vài người dùng đồng thời, có phân vai `admin` / `member`.

### Tiêu chí thành công (MVP)
- Admin tạo project (có `key`), mời thành viên qua email.
- Thành viên tạo issue, gán assignee/priority/story point, viết comment.
- Lập sprint từ backlog, start/complete sprint.
- Board hiển thị issue của sprint active theo 4 cột, kéo-thả đổi trạng thái/thứ tự, người khác thấy cập nhật realtime.

## 2. Non-goals (YAGNI — không làm ở MVP)

- Epic, sub-task, quan hệ cha-con giữa issue.
- Custom workflow / custom field / custom issue type.
- Roadmap, report/burndown chart, dashboard analytics.
- Multi-workspace / multi-organization.
- Phân quyền theo từng project (mọi member thấy mọi project).
- Attachment/upload file, label/tag, @mention notification, email digest.
- Mobile app riêng (web responsive là đủ).

> Các mục trên có thể là giai đoạn sau; data model được thiết kế để mở rộng được nhưng không hiện thực hóa bây giờ.

## 3. Tech Stack

- **Next.js 16** (App Router, Server Components + Server Actions / Route Handlers) + **TypeScript** (strict).
- **Tailwind CSS** + **shadcn/ui** (Radix primitives).
- **Supabase**: Postgres + Auth (email/password) + Realtime + Row Level Security (RLS).
- **dnd-kit** — kéo-thả board & backlog (accessible).
- **TanStack Query (React Query)** — server state, cache, optimistic update.
- **react-hook-form + zod** — form & validation (zod schema dùng chung client/server).
- **sonner** — toast.
- **Vitest** — unit test cho business logic thuần.

## 4. Mô hình dữ liệu (Postgres)

Tất cả bảng bật RLS. Khóa chính `uuid` (`gen_random_uuid()`) trừ khi ghi rõ. Mốc thời gian `created_at timestamptz default now()`, `updated_at` cập nhật qua trigger.

### 4.1 `profiles`
Mở rộng `auth.users` (1-1). Tạo tự động qua trigger `on auth.users insert`.
- `id uuid pk` → ref `auth.users.id` (on delete cascade)
- `email text not null`
- `full_name text`
- `avatar_url text`
- `role text not null default 'member'` — enum check: `admin` | `member`
- `created_at`

> Người dùng đầu tiên (seed) là `admin`. Người được mời nhận role theo invitation.

### 4.2 `invitations`
- `id uuid pk`
- `email text not null`
- `role text not null default 'member'` (admin|member)
- `token text not null unique` — dùng cho link `/invite/[token]`
- `status text not null default 'pending'` — `pending` | `accepted` | `expired`
- `invited_by uuid` → profiles.id
- `expires_at timestamptz not null` (mặc định now() + 7 ngày)
- `created_at`

### 4.3 `projects`
- `id uuid pk`
- `key text not null unique` — prefix in hoa (vd `WEB`), 2–10 ký tự `[A-Z0-9]`, dùng để sinh issue key
- `name text not null`
- `description text`
- `lead_id uuid` → profiles.id (null được)
- `issue_seq int not null default 0` — bộ đếm để sinh số thứ tự issue (tăng atomic)
- `archived_at timestamptz` (null = active)
- `created_at`

### 4.4 `sprints`
- `id uuid pk`
- `project_id uuid not null` → projects.id (on delete cascade)
- `name text not null` (vd "Sprint 1")
- `goal text`
- `status text not null default 'planned'` — `planned` | `active` | `completed`
- `start_date date`, `end_date date`
- `completed_at timestamptz`
- `created_at`

> **Bất biến:** mỗi project chỉ tối đa **1 sprint `active`** tại một thời điểm (đảm bảo bằng partial unique index: `unique (project_id) where status = 'active'`).

### 4.5 `issues`
- `id uuid pk`
- `project_id uuid not null` → projects.id (on delete cascade)
- `key text not null unique` — vd `WEB-12` (sinh từ project.key + project.issue_seq)
- `title text not null`
- `description text`
- `type text not null default 'task'` — `story` | `task` | `bug`
- `status text not null default 'todo'` — `todo` | `in_progress` | `in_review` | `done` (4 cột board)
- `priority text not null default 'medium'` — `lowest` | `low` | `medium` | `high` | `highest`
- `story_points int` (null được)
- `assignee_id uuid` → profiles.id (null = chưa giao)
- `reporter_id uuid not null` → profiles.id
- `sprint_id uuid` → sprints.id (on delete set null) — **null = ở Backlog**
- `rank double precision not null` — thứ tự sắp xếp (trong cột board hoặc trong backlog)
- `created_at`, `updated_at`

### 4.6 `comments`
- `id uuid pk`
- `issue_id uuid not null` → issues.id (on delete cascade)
- `author_id uuid not null` → profiles.id
- `body text not null`
- `created_at`, `updated_at`

### 4.7 Index
- `issues (project_id, sprint_id, status, rank)` — query board.
- `issues (project_id, sprint_id) where sprint_id is null` — backlog.
- `comments (issue_id, created_at)`.
- `sprints (project_id, status)`.

## 5. Logic nghiệp vụ then chốt

### 5.1 Sinh issue key (RPC `create_issue`)
Để tránh race condition, tạo issue qua RPC Postgres (`security definer`):
1. `update projects set issue_seq = issue_seq + 1 where id = :project_id returning issue_seq` (atomic).
2. `key := project.key || '-' || issue_seq`.
3. Insert issue với key đó, `rank` = max(rank)+1024 trong phạm vi đích (mặc định backlog).
4. Trả issue vừa tạo.

### 5.2 Tính rank (kéo-thả)
- Float rank, bước nhảy 1024.
- Chèn giữa A và B: `rank = (A.rank + B.rank) / 2`. Chèn đầu: `min - 1024`. Chèn cuối: `max + 1024`.
- Hàm thuần `computeRank(prev?, next?)` ở `lib/rank.ts` (có Vitest).
- Rebalance (đánh số lại đều) là non-goal MVP; chỉ thêm nếu thực sự gặp giới hạn float.

### 5.3 Máy trạng thái sprint (RPC + hàm thuần)
- `planned → active`: chỉ khi project chưa có sprint active (partial unique index chặn ở DB; UI cũng kiểm tra). Set `start_date`.
- `active → completed`: set `completed_at`. Issue chưa `done` trong sprint → chuyển về **backlog** (`sprint_id = null`) hoặc sang sprint kế (MVP: về backlog, có toast tóm tắt). Hàm thuần `resolveSprintCompletion(issues)` quyết định issue nào move (có Vitest).

### 5.4 Vị trí của issue
- `sprint_id = null` → Backlog.
- `sprint_id = <sprint planned>` → đã xếp vào sprint chờ chạy (hiện ở Backlog view, mục sprint đó).
- `sprint_id = <sprint active>` → hiện trên Board.
- Board chỉ render issue có `sprint_id` = sprint active của project.

## 6. RLS Policies

Nguyên tắc: **đã đăng nhập và có profile = là member** thì truy cập được dữ liệu team. Một số thao tác quản trị chỉ `admin`.

- Helper SQL: `is_member()` = `exists(select 1 from profiles where id = auth.uid())`; `is_admin()` = `exists(select 1 from profiles where id = auth.uid() and role = 'admin')`.
- `profiles`: SELECT cho mọi member (để hiển thị assignee/avatar). UPDATE chỉ bản thân (trừ cột `role` chỉ admin đổi được).
- `projects`, `sprints`, `issues`, `comments`: SELECT/INSERT/UPDATE cho member. DELETE issue/comment: tác giả hoặc admin. DELETE/archive project: admin.
- `invitations`: chỉ admin INSERT/SELECT/DELETE. Endpoint accept-invite chạy server-side (service role) để tạo profile khi user đăng ký bằng token.

## 7. Trang & Route

| Route | Mô tả |
|-------|-------|
| `/login`, `/signup` | Auth (email/password). Signup thường đi kèm token mời. |
| `/invite/[token]` | Trang nhận lời mời → đăng ký/đăng nhập → tạo profile với role từ invitation. |
| `/projects` | Danh sách project (active/archived). Admin tạo project mới (đặt name + key). |
| `/projects/[key]/board` | Kanban board sprint active: 4 cột, kéo-thả, optimistic + realtime. Header có sprint name, nút complete sprint. |
| `/projects/[key]/backlog` | Backlog + danh sách sprint (planned). Tạo sprint, kéo issue giữa backlog ↔ sprint, start sprint. |
| Issue detail | Modal (route song song / intercepting hoặc dialog): sửa field, đổi assignee/status/points, comment list + thêm comment. |
| `/settings/members` | Danh sách thành viên, mời qua email (admin), đổi role, gỡ thành viên. |

Middleware bảo vệ route: chưa đăng nhập → `/login`. Chưa có profile (chưa được mời/seed) → trang thông báo.

## 8. Kiến trúc code

```
src/
  app/                      # routes (App Router)
  lib/
    supabase/               # createBrowserClient, createServerClient, middleware client
    queries/                # hooks: useProjects, useIssues, useSprints, useComments, useMembers (React Query + Supabase)
    rank.ts                 # computeRank() — thuần, test
    sprint.ts               # resolveSprintCompletion(), sprint state helpers — thuần, test
    validation/             # zod schemas (issue, project, sprint, invite)
  components/
    board/                  # BoardView, BoardColumn, IssueCard (dnd-kit)
    backlog/                # BacklogView, SprintSection, BacklogItem
    issue/                  # IssueDetail, IssueForm, CommentList, CommentForm
    project/                # ProjectList, ProjectForm
    members/                # MemberList, InviteForm
    ui/                     # shadcn primitives
  hooks/                    # useRealtime(table, filter) — subscribe + invalidate query
db/
  migrations/               # *.sql — schema, index, partial unique, triggers
  policies/                 # *.sql — RLS
  functions/                # *.sql — RPC: create_issue, start_sprint, complete_sprint
  seed.sql                  # admin đầu tiên + project mẫu (dev)
```

**Ranh giới module:** mỗi hook trong `lib/queries/` là interface dữ liệu duy nhất cho UI (UI không gọi Supabase trực tiếp). Logic thuần (`rank.ts`, `sprint.ts`) tách khỏi I/O để test độc lập. RPC giữ bất biến nghiệp vụ ở DB (key, sprint active duy nhất).

## 9. Realtime

- Hook `useRealtime(channel, { table, filter })` subscribe Supabase Realtime.
- Board: subscribe `issues` filter theo `project_id` + sprint active → on change `queryClient.invalidateQueries(['issues', projectId, sprintId])`.
- Issue detail: subscribe `comments` filter theo `issue_id`.
- Kết hợp optimistic update: thao tác local cập nhật ngay; event realtime của chính mình bị bỏ qua/được hợp nhất để tránh nhấp nháy.

## 10. Xử lý lỗi & trải nghiệm

- Validation bằng zod ở cả form (client) và Server Action (server).
- Kéo-thả: optimistic update; lỗi → rollback cache + toast.
- Toast (sonner) cho mọi mutation thất bại; loading skeleton cho board/backlog.
- Empty states: project chưa có issue, backlog rỗng, chưa có sprint.
- Auth: middleware redirect; thông báo rõ khi token mời hết hạn.

## 11. Testing

- **Vitest (unit)** — bắt buộc cho logic thuần:
  - `computeRank()` — chèn đầu/giữa/cuối, danh sách rỗng.
  - `resolveSprintCompletion()` — issue done ở lại, chưa done về backlog.
  - sinh issue key (test logic format; race condition phủ ở mức RPC).
  - zod schemas — input hợp lệ/không hợp lệ.
- **Playwright (E2E)** — sau MVP, cho luồng chính (đăng nhập → tạo issue → kéo board). Không bắt buộc trong MVP.

## 12. Milestone (spec bao cả 3; implementation plan sẽ tách phase)

### M1 — Nền tảng
- Scaffold Next.js + Tailwind + shadcn + Supabase client.
- Migrations: toàn bộ schema + index + partial unique + trigger `updated_at` + trigger tạo profile.
- RLS policies + helper `is_member`/`is_admin`.
- Auth: signup/login, middleware, trigger profile.
- Invitations: admin mời, `/invite/[token]`, accept tạo profile.
- Projects: list + tạo (name, key), archive.
- `/settings/members`.

### M2 — Issues + Board
- RPC `create_issue` (sinh key + rank).
- IssueForm (tạo/sửa), IssueDetail modal, comment.
- BoardView 4 cột với dnd-kit, optimistic update đổi status + rank.
- `lib/rank.ts` + test.

### M3 — Sprint/Backlog + Realtime
- BacklogView + SprintSection, tạo sprint, kéo issue backlog ↔ sprint.
- RPC `start_sprint` / `complete_sprint` + `lib/sprint.ts` + test.
- Realtime hook cho board & comments.
- Hoàn thiện empty states, toast, loading.

## 13. Quyết định mở (chốt mặc định, đổi được khi review)

- Issue detail dùng **dialog/modal** (không trang riêng) cho MVP — nhanh, hợp board.
- Complete sprint → issue chưa done **về backlog** (không tự sang sprint kế).
- Mọi member thấy mọi project (chưa phân quyền cấp project).
