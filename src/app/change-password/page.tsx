import { ChangePasswordForm } from './ChangePasswordForm'

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary font-display text-2xl leading-none text-primary-foreground">
            K
          </span>
          <h1 className="font-display text-3xl">Đổi mật khẩu</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Lần đầu đăng nhập — đặt mật khẩu mới để tiếp tục.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-[0_8px_30px_-18px_rgba(40,30,20,0.35)]">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
