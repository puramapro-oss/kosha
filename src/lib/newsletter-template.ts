/**
 * KOSHA Newsletter — HTML Template
 * Template FR responsive dark pour la Living Newsletter™
 */
import { APP_NAME } from './constants'
import type { NewsletterBlocks } from './newsletter'

export function renderNewsletterHTML(args: {
  firstName: string
  weekIso: string
  blocks: NewsletterBlocks
  actionLabel: string
  actionTrackerUrl: string                  // /api/newsletter/action/<emailId>?next=<...>
  unsubscribeUrl: string                    // /api/newsletter/unsubscribe?token=<...>
  preferencesUrl: string                    // /settings/newsletter
}): string {
  const { firstName, weekIso, blocks, actionLabel, actionTrackerUrl, unsubscribeUrl, preferencesUrl } = args
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!doctype html>
<html lang="fr"><body style="margin:0;padding:0;background:#0A0A0F;color:#F8FAFC;font-family:-apple-system,system-ui,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;padding:8px 0 24px;">
      <div style="display:inline-block;font-size:22px;font-weight:700;letter-spacing:0.5px;background:linear-gradient(135deg,#7C3AED,#06B6D4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${escape(APP_NAME)}</div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-top:4px;">Semaine ${escape(weekIso)}</div>
    </div>

    <h1 style="font-size:24px;line-height:1.3;font-weight:700;margin:0 0 24px;color:#fff;">Bonjour ${escape(firstName)},</h1>

    ${section('Où on en est', blocks.ou_on_en_est, '#7C3AED')}
    ${section('Impact déclenché', blocks.impact_declenche, '#06B6D4')}
    ${section('Idée qui élève', blocks.idee_qui_eleve, '#F59E0B')}

    <div style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.10));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin:24px 0;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);margin-bottom:8px;">Ton action de la semaine</div>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:rgba(255,255,255,0.92);">${escape(blocks.action_vida)}</p>
      <a href="${actionTrackerUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#06B6D4);color:#fff;text-decoration:none;padding:14px 26px;border-radius:100px;font-weight:600;font-size:14px;">${escape(actionLabel)}</a>
      <div style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.35);">~ 2 min</div>
    </div>

    ${section('Trace personnelle', blocks.trace_personnelle, '#10B981')}

    <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.65);margin:32px 0 0;font-style:italic;border-left:2px solid rgba(255,255,255,0.15);padding-left:12px;">${escape(blocks.fermeture_calme)}</p>

    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:40px 0 16px;" />

    <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.30);line-height:1.6;margin:0;">
      SASU PURAMA — 8 Rue de la Chapelle, 25560 Frasne, France<br>
      <a href="${preferencesUrl}" style="color:rgba(255,255,255,0.50);text-decoration:none;">Préférences</a> ·
      <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.50);text-decoration:none;">Se désabonner en 1 clic</a>
    </p>
  </div>
</body></html>`

  function section(title: string, content: string, accent: string): string {
    return `
    <div style="margin:24px 0;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${accent};font-weight:600;margin-bottom:6px;">${escape(title)}</div>
      <p style="font-size:15px;line-height:1.65;color:rgba(255,255,255,0.85);margin:0;">${escape(content)}</p>
    </div>`
  }
}
