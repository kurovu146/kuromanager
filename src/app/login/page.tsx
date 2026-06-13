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
