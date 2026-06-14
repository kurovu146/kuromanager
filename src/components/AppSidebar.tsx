'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderKanban, Users, LogOut } from 'lucide-react'
import { signOut } from '@/app/auth/actions'
import { useCurrentProfile } from '@/lib/queries/me'
import { Button } from '@/components/ui/button'

function initials(name: string | null | undefined, email: string | undefined) {
  const base = name?.trim() || email || '?'
  return base.slice(0, 2).toUpperCase()
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: me } = useCurrentProfile()

  const nav = [
    { href: '/projects', label: 'Dự án', icon: FolderKanban, active: pathname.startsWith('/projects') },
    {
      href: '/settings/members',
      label: 'Thành viên',
      icon: Users,
      active: pathname.startsWith('/settings'),
    },
  ]

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary font-display text-xl leading-none text-primary-foreground">
          K
        </span>
        <span className="font-display text-[1.35rem] leading-none">KuroManager</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <p className="px-3 pb-1.5 text-[0.7rem] font-medium tracking-wider text-muted-foreground/70 uppercase">
          Không gian làm việc
        </p>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              item.active
                ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
            }`}
          >
            {item.active && (
              <span className="absolute top-1/2 -left-px h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand" />
            )}
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand">
            {initials(me?.full_name, me?.email)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{me?.full_name || me?.email || '…'}</p>
            <p className="text-xs text-muted-foreground">
              {me?.role === 'admin' ? 'Quản trị' : 'Thành viên'}
            </p>
          </div>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </Button>
        </form>
      </div>
    </aside>
  )
}
