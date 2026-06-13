import { ChangePasswordForm } from './ChangePasswordForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Lần đầu đăng nhập — vui lòng đặt mật khẩu mới để tiếp tục.
          </p>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
