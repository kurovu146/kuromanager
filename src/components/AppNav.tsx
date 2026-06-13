import Link from 'next/link'
import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

export function AppNav() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <nav className="flex items-center gap-4">
        <Link href="/projects" className="font-semibold">
          KuroManager
        </Link>
        <Link href="/settings/members" className="text-sm text-muted-foreground hover:text-foreground">
          Thành viên
        </Link>
      </nav>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          Đăng xuất
        </Button>
      </form>
    </header>
  )
}
