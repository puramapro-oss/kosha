/**
 * KOSHA P9 — VIDA NEWSLETTER (Living Newsletter™)
 *
 * Structure FIXE 6 blocs (ordre immuable, jamais d'autre bloc) :
 *   1. ou_on_en_est       — état du monde / saison / écosystème
 *   2. impact_declenche   — ce que TON action a réellement déclenché cette semaine
 *   3. idee_qui_eleve     — 1 phrase qui ouvre une porte intérieure
 *   4. action_vida        — 1 action concrète <2min cette semaine
 *   5. trace_personnelle  — récap fil_de_vie de la semaine
 *   6. fermeture_calme    — 1 phrase de clôture, ZÉRO appel
 */
import { z } from 'zod'
import { createServiceClient } from './supabase'
import { askAriaJSON, MODEL_MAIN } from './claude'
import { getResend } from './resend'
import { AI_NAME, APP_NAME, APP_URL } from './constants'
import { getCurrentRituel } from './rituels'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface NewsletterBlocks {
  ou_on_en_est: string          // 2-3 phrases ; état honnête de l'éco/communauté
  impact_declenche: string      // 1-2 phrases personnalisées sur l'impact réel de l'user
  idee_qui_eleve: string        // 1 phrase, sagesse / éveil
  action_vida: string           // 1 phrase de proposition + libellé bouton
  trace_personnelle: string     // récap fil_de_vie de la semaine en 1-2 phrases
  fermeture_calme: string       // 1 phrase, jamais "clique sur"
}

export interface WeeklySnapshot {
  user_id: string
  full_name: string | null
  fil_de_vie_count_week: number
  score_humanite: number
  score_humanite_delta_week: number
  rituel_current_label: string | null
  rituel_current_week: string | null
  cagnottes_supported_week: number
  missions_done_week: number
  // Cumul global pour ramener à l'échelle planétaire
  global_kg_dechets: number
  global_arbres: number
  global_personnes: number
}

export interface GeneratedContent {
  subject: string                   // ≤ 60 char, jamais clickbait
  blocks: NewsletterBlocks
  action_kind: 'mission' | 'rituel' | 'cagnotte' | 'gratitude' | 'cercle'
  action_label: string              // texte du bouton (≤ 28 char)
  action_url_relative: string       // /missions/X ou /rituels ou /aria
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. computeWeeklySnapshot — données réelles depuis DB
// ─────────────────────────────────────────────────────────────────────────────
export async function computeWeeklySnapshot(userId: string): Promise<WeeklySnapshot | null> {
  const admin = createServiceClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [profileRes, fdvRes, scoreRes, rituel, cagnotteRes, missionRes, impactRes] = await Promise.all([
    admin.from('profiles').select('full_name, score_humanite').eq('id', userId).maybeSingle(),
    admin
      .from('fil_de_vie')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo),
    admin
      .from('score_humanite_history')
      .select('score, created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true })
      .limit(1),
    getCurrentRituel(),
    admin
      .from('cagnotte_contributions')
      .select('id', { count: 'exact', head: true })
      .eq('contributor_id', userId)
      .eq('status', 'succeeded')
      .gte('created_at', sevenDaysAgo),
    admin
      .from('mission_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('created_at', sevenDaysAgo),
    admin.from('impact_global').select('kg_dechets, arbres, personnes').limit(1),
  ])

  if (!profileRes.data) return null

  const scoreNow = Number(profileRes.data.score_humanite ?? 5.0)
  const scoreWeekAgo = Number(scoreRes.data?.[0]?.score ?? scoreNow)
  const impactRow = impactRes.data?.[0] as { kg_dechets?: number; arbres?: number; personnes?: number } | undefined

  return {
    user_id: userId,
    full_name: profileRes.data.full_name ?? null,
    fil_de_vie_count_week: Number(fdvRes.count ?? 0),
    score_humanite: scoreNow,
    score_humanite_delta_week: Number((scoreNow - scoreWeekAgo).toFixed(2)),
    rituel_current_label: rituel?.theme_label ?? null,
    rituel_current_week: rituel?.week_iso ?? null,
    cagnottes_supported_week: Number(cagnotteRes.count ?? 0),
    missions_done_week: Number(missionRes.count ?? 0),
    global_kg_dechets: Math.round(Number(impactRow?.kg_dechets ?? 0)),
    global_arbres: Math.round(Number(impactRow?.arbres ?? 0)),
    global_personnes: Math.round(Number(impactRow?.personnes ?? 0)),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. generateNewsletterContent — Aria remplit les 6 blocs
// ─────────────────────────────────────────────────────────────────────────────
const generatedSchema = z.object({
  subject: z.string().min(8).max(80),
  blocks: z.object({
    ou_on_en_est: z.string().min(20).max(500),
    impact_declenche: z.string().min(20).max(500),
    idee_qui_eleve: z.string().min(10).max(280),
    action_vida: z.string().min(10).max(300),
    trace_personnelle: z.string().min(10).max(400),
    fermeture_calme: z.string().min(8).max(200),
  }),
  action_kind: z.enum(['mission', 'rituel', 'cagnotte', 'gratitude', 'cercle']),
  action_label: z.string().min(3).max(40),
  action_url_relative: z
    .string()
    .startsWith('/')
    .max(120),
})

export async function generateNewsletterContent(snapshot: WeeklySnapshot): Promise<GeneratedContent> {
  const firstName = snapshot.full_name?.split(' ')[0] ?? 'voyageur'

  const system = `Tu es ${AI_NAME}, l'assistante de ${APP_NAME}. Tu écris la newsletter HEBDOMADAIRE de ${firstName}.

# RÈGLES SACRÉES (jamais violées)
- 6 blocs FIXES dans cet ordre EXACT (jamais en sauter, jamais en ajouter)
- ZÉRO promotionnel — tu ne vends rien, tu n'incites pas à acheter
- ZÉRO comparaison — pas de "tu fais moins/plus que X"
- ZÉRO urgence fabriquée — pas de "URGENT", "DERNIER JOUR", "FOMO"
- 1 ACTION CONCRÈTE, RÉALISABLE EN <2 MINUTES, ALIGNÉE avec sa semaine
- TON : tutoiement, calme, FR naturel, jamais corporate, JAMAIS d'emoji dans le subject
- Pas de markdown — texte brut uniquement (le HTML est ailleurs)
- TRANSPARENCE : tu cites des chiffres réels (cf. snapshot)

# FORMAT JSON exact :
{
  "subject": "phrase claire ≤ 60 char, sans CLICKBAIT, sans emoji",
  "blocks": {
    "ou_on_en_est": "2-3 phrases sur l'état de la communauté KOSHA cette semaine (rituel, impact global cumulé)",
    "impact_declenche": "1-2 phrases personnalisées sur ${firstName} : ce qu'il/elle a déclenché en 7 jours",
    "idee_qui_eleve": "1 phrase qui ouvre une porte intérieure — sagesse, présence, gratitude. Naturelle, jamais prosélyte.",
    "action_vida": "1 phrase introduisant l'action proposée. SUIVIE par le label du bouton dans 'action_label'.",
    "trace_personnelle": "1-2 phrases qui racontent les actions enregistrées dans son Fil de Vie cette semaine.",
    "fermeture_calme": "1 phrase apaisante. Jamais de 'clique', jamais de signature, jamais de PS."
  },
  "action_kind": "mission" | "rituel" | "cagnotte" | "gratitude" | "cercle",
  "action_label": "Texte court du bouton ≤ 28 char (ex: 'Rejoindre le rituel')",
  "action_url_relative": "/missions/partage-citation-positive" ou "/rituels" ou "/cagnottes" ou "/feed" ou "/aria"
}

# CHOIX DE L'ACTION
- Si rituel courant existe → privilégier "rituel" → /rituels
- Si user n'a fait aucune mission cette semaine → "mission" → /missions
- Si user a un fil_de_vie >= 5 → "cagnotte" → /cagnottes (encourager à donner)
- Sinon → "gratitude" → /aria (parler à Aria 2min)`

  const user = `# SNAPSHOT de ${firstName} (semaine ${snapshot.rituel_current_week ?? 'courante'})
- Score d'Humanité : ${snapshot.score_humanite.toFixed(2)} (delta semaine : ${snapshot.score_humanite_delta_week >= 0 ? '+' : ''}${snapshot.score_humanite_delta_week.toFixed(2)})
- Actions ajoutées au Fil de Vie cette semaine : ${snapshot.fil_de_vie_count_week}
- Missions accomplies cette semaine : ${snapshot.missions_done_week}
- Cagnottes soutenues cette semaine : ${snapshot.cagnottes_supported_week}
- Rituel courant : ${snapshot.rituel_current_label ?? 'aucun'}

# IMPACT GLOBAL CUMULÉ KOSHA
- ${snapshot.global_kg_dechets.toLocaleString('fr-FR')} kg de déchets retirés
- ${snapshot.global_arbres.toLocaleString('fr-FR')} arbres protégés
- ${snapshot.global_personnes.toLocaleString('fr-FR')} personnes touchées

Génère la newsletter de cette semaine pour ${firstName}. Réponds UNIQUEMENT le JSON.`

  const raw = await askAriaJSON<GeneratedContent>(system, user, { model: MODEL_MAIN, maxTokens: 2000 })
  // Normaliser et valider
  const parsed = generatedSchema.parse(raw)
  return parsed
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. renderNewsletterHTML — template FR responsive dark
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// 4. sendWeeklyNewsletter — orchestre tout (snapshot → Aria → render → Resend → log)
// ─────────────────────────────────────────────────────────────────────────────
export interface SendResult {
  ok: boolean
  email_id?: string
  resend_message_id?: string
  skipped_reason?: string
  error?: string
}

export async function sendWeeklyNewsletter(userId: string, weekIso: string): Promise<SendResult> {
  const admin = createServiceClient()

  // 1) Vérifier abonnement actif
  const { data: sub } = await admin
    .from('newsletter_subscribers')
    .select('subscribed, frequency, unsubscribe_token')
    .eq('user_id', userId)
    .maybeSingle()
  if (!sub || !sub.subscribed || sub.frequency !== 'weekly') {
    return { ok: false, skipped_reason: 'unsubscribed_or_paused' }
  }

  // 2) Vérifier email user
  const { data: userResp } = await admin.auth.admin.getUserById(userId)
  const email = userResp?.user?.email
  if (!email) return { ok: false, skipped_reason: 'no_email' }

  // 3) Anti-doublon : skip si déjà envoyé cette semaine
  const { data: existing } = await admin
    .from('newsletter_emails')
    .select('id')
    .eq('user_id', userId)
    .eq('week_iso', weekIso)
    .maybeSingle()
  if (existing) {
    return { ok: false, skipped_reason: 'already_sent_this_week' }
  }

  // 4) Snapshot + génération Aria
  const snapshot = await computeWeeklySnapshot(userId)
  if (!snapshot) return { ok: false, skipped_reason: 'no_profile' }

  let content: GeneratedContent
  try {
    content = await generateNewsletterContent(snapshot)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    console.error('[newsletter] Aria generation failed', msg)
    return { ok: false, error: 'aria_generation_failed: ' + msg }
  }

  // 5) Insert row PRE-send pour avoir l'email_id (utilisé dans tracker)
  const { data: emailRow, error: insErr } = await admin
    .from('newsletter_emails')
    .insert({
      user_id: userId,
      week_iso: weekIso,
      subject: content.subject,
      blocks: content.blocks,
      action_label: content.action_label,
      action_url: content.action_url_relative,
      action_kind: content.action_kind,
    })
    .select('id')
    .single()
  if (insErr || !emailRow) {
    return { ok: false, error: 'insert_failed: ' + (insErr?.message ?? 'unknown') }
  }

  // 6) URLs
  const actionTrackerUrl = `${APP_URL}/api/newsletter/action/${emailRow.id}?next=${encodeURIComponent(content.action_url_relative)}`
  const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`
  const preferencesUrl = `${APP_URL}/settings/newsletter`
  const firstName = snapshot.full_name?.split(' ')[0] ?? 'toi'

  const html = renderNewsletterHTML({
    firstName,
    weekIso,
    blocks: content.blocks,
    actionLabel: content.action_label,
    actionTrackerUrl,
    unsubscribeUrl,
    preferencesUrl,
  })

  // 7) Resend send
  let resendId: string | undefined
  try {
    const result = await getResend().emails.send({
      from: `${APP_NAME} <noreply@purama.dev>`,
      to: email,
      subject: content.subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
    resendId = result.data?.id
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    console.error('[newsletter] Resend send failed', msg)
    // Cleanup la row email_log car pas envoyé
    await admin.from('newsletter_emails').delete().eq('id', emailRow.id)
    return { ok: false, email_id: emailRow.id, error: 'resend_send_failed: ' + msg }
  }

  // 8) Update row avec resend_message_id + bump last_sent_at
  await Promise.all([
    admin.from('newsletter_emails').update({ resend_message_id: resendId ?? null }).eq('id', emailRow.id),
    admin
      .from('newsletter_subscribers')
      .update({ last_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId),
  ])

  return { ok: true, email_id: emailRow.id, resend_message_id: resendId }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. weekIso helper (cohérent avec rituels)
// ─────────────────────────────────────────────────────────────────────────────
export function currentWeekIso(d = new Date()): string {
  // ISO week-year format "2026-W17" — strict to UTC pour aligner avec rituels_calendar
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const diff = (target.getTime() - firstThursday.getTime()) / 86_400_000
  const week = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
