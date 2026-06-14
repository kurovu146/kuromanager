import { signIn } from '@/app/auth/actions'
import { AuthForm } from '@/components/auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary font-display text-2xl leading-none text-primary-foreground">
            K
          </span>
          <h1 className="font-display text-3xl">KuroManager</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Quản lý dự án &amp; sprint cho team của bạn
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-[0_8px_30px_-18px_rgba(40,30,20,0.35)]">
          <AuthForm mode="signin" action={signIn} />
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Chưa có tài khoản? Liên hệ admin để được thêm vào team.
        </p>
      </div>
    </div>
  )
}
