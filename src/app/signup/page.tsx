import Link from 'next/link'
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
        <CardContent className="space-y-4">
          <AuthForm mode="signup" action={signUp} />
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link href="/login" className="underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
