import { Resend } from 'resend'
import { APP_NAME } from './constants'

let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return _resend
}

const FROM = `${APP_NAME} <noreply@purama.dev>`

// Wrapper résilient — log mais ne throw pas si Resend down (anti-cascade)
async function safeSend(payload: { to: string; subject: string; html: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const result = await getResend().emails.send({ from: FROM, ...payload })
    return { ok: true, id: result.data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    console.error('[resend] send failed', msg)
    return { ok: false, error: msg }
  }
}

// 10 emails BRIEF §11 + V7.2 §61 — implémentés progressivement (P1 = welcome only)
export const sendWelcomeEmail = (email: string, name: string) =>
  safeSend({
    to: email,
    subject: `Bienvenue sur ${APP_NAME}, ${name}`,
    html: welcomeHtml(name),
  })

function welcomeHtml(name: string): string {
  return `<!doctype html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; background: #0A0A0F; color: #F8FAFC; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.10)); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 32px;">
    <h1 style="font-size: 28px; margin: 0 0 16px; background: linear-gradient(135deg, #7C3AED, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Bienvenue ${name}</h1>
    <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.85); margin: 0 0 16px;">
      Tu viens de rejoindre KOSHA. Pas une app de plus — un univers où agir = être payé,
      où aider = recevoir, où exister = laisser une trace réelle dans le monde.
    </p>
    <p style="font-size: 14px; line-height: 1.5; color: rgba(255,255,255,0.6); margin: 0 0 24px;">
      Aucune pub. Aucune toxicité. Aucune comparaison. Juste toi, et le monde, qui s'élèvent ensemble.
    </p>
    <a href="https://kosha.purama.dev/dashboard" style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; text-decoration: none; padding: 14px 28px; border-radius: 100px; font-weight: 600;">Ouvrir KOSHA</a>
  </div>
  <p style="text-align: center; margin-top: 24px; color: rgba(255,255,255,0.4); font-size: 12px;">
    SASU PURAMA — 8 Rue de la Chapelle, 25560 Frasne, France<br>
    <a href="https://kosha.purama.dev/settings/notifications" style="color: rgba(255,255,255,0.5);">Préférences email</a>
  </p>
</body></html>`
}
