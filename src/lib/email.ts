import { Resend } from 'resend'

// Địa chỉ gửi. Chưa verify domain trên Resend → dùng onboarding@resend.dev (sandbox,
// chỉ gửi được tới email tài khoản Resend). Verify domain rồi đặt RESEND_FROM=
// 'KuroManager <noreply@your-domain.com>' để gửi tới mọi người.
const FROM = process.env.RESEND_FROM ?? 'KuroManager <onboarding@resend.dev>'

export async function sendInviteEmail(to: string, link: string, role: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { sent: false as const, error: 'Chưa cấu hình RESEND_API_KEY' }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Lời mời tham gia KuroManager',
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:480px">
      <h2 style="margin:0 0 8px">Bạn được mời vào KuroManager</h2>
      <p>Bạn được mời tham gia với vai trò <b>${role === 'admin' ? 'Admin' : 'Member'}</b>.</p>
      <p style="margin:20px 0">
        <a href="${link}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;border-radius:8px;text-decoration:none">Tham gia ngay</a>
      </p>
      <p style="font-size:13px;color:#555">Hoặc mở link:<br>${link}</p>
      <p style="color:#999;font-size:12px;margin-top:24px">Lời mời hết hạn sau 7 ngày.</p>
    </div>`,
  })
  if (error) return { sent: false as const, error: error.message }
  return { sent: true as const }
}
