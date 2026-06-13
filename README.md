# KuroManager

Công cụ quản lý dự án kiểu Jira (Scrum) cho team nhỏ. Board Kanban kéo-thả, backlog & sprint, mời thành viên, realtime.

## Stack

- **Next.js 16** (App Router, Server Actions, `proxy.ts` thay middleware) + TypeScript + Tailwind + shadcn/ui (Base UI)
- **Supabase**: Postgres + Auth (email/password) + Row Level Security + Realtime
- React Query · dnd-kit · react-hook-form + zod · sonner · Vitest

## Tính năng (MVP)

- Đăng nhập email/mật khẩu, mời thành viên qua link, phân vai admin/member
- CRUD project (mỗi project có `key`, vd `WEB` → issue `WEB-12`)
- Issue: Story / Task / Bug, độ ưu tiên, story point, người nhận, comment
- **Backlog**: tạo sprint, xếp issue vào sprint, bắt đầu sprint
- **Board** Kanban: 4 cột (To Do / In Progress / In Review / Done), kéo-thả đổi trạng thái & thứ tự, realtime
- Hoàn tất sprint: issue chưa Done tự về backlog

## Chạy local

Yêu cầu: Node 20+, pnpm, Docker (cho Supabase local), Supabase CLI.

```bash
pnpm install

# Khởi động Supabase local (Postgres + Auth + Realtime) — tự áp migrations
supabase start

# Lấy keys ghi vào .env.local (xem .env.example)
supabase status -o env
# NEXT_PUBLIC_SUPABASE_URL=...  NEXT_PUBLIC_SUPABASE_ANON_KEY=...  SUPABASE_SERVICE_ROLE_KEY=...

# Tạo user admin để đăng nhập (admin@test.com / password123)
bash scripts/seed.sh

pnpm dev   # http://localhost:3000
```

> Nếu đã chạy `supabase start` từ trước và thêm migration mới: `supabase migration up --local`.

## Lệnh

| Lệnh | Việc |
|------|------|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Build & chạy production |
| `pnpm test` | Unit test (Vitest) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |

## Cấu trúc

```
src/
  app/                  # routes + server actions (auth, projects, issues, sprints, comments, members)
  components/           # board/, backlog/, issue/, project/, members/, auth/, ui/ (shadcn)
  lib/
    supabase/           # client browser/server/proxy
    queries/            # hook React Query bọc Supabase (UI không gọi Supabase trực tiếp)
    validation/         # zod schemas
    rank.ts             # tính rank kéo-thả (có test)
    issue-meta.ts       # labels/columns dùng chung
  hooks/useRealtime.ts  # subscribe + invalidate query
  proxy.ts              # auth guard (Next 16 đổi middleware → proxy)
supabase/migrations/    # schema + RLS + RPC + realtime publication
docs/superpowers/       # spec & implementation plan
```

## Tài liệu thiết kế

- Spec: `docs/superpowers/specs/2026-06-13-kuromanager-design.md`
- Plan M1: `docs/superpowers/plans/2026-06-13-kuromanager-m1-foundation.md`
