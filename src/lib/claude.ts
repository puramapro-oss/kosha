import Anthropic from '@anthropic-ai/sdk'
import { AI_MODEL_FALLBACKS, AI_NAME, APP_NAME } from './constants'

// Lazy init (Turbopack évalue modules avant env vars)
let _anthropic: Anthropic | null = null
export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _anthropic
}

// Modèles via process.env (CLAUDE.md V7.2 §22 — JAMAIS hardcoder)
export const MODEL_MAIN = process.env.ANTHROPIC_MODEL_MAIN || AI_MODEL_FALLBACKS.main
export const MODEL_FAST = process.env.ANTHROPIC_MODEL_FAST || AI_MODEL_FALLBACKS.fast
export const MODEL_PRO = process.env.ANTHROPIC_MODEL_PRO || AI_MODEL_FALLBACKS.pro

export type Complexity = 'simple' | 'medium' | 'complex'

// Détection auto de complexité (V7.2 §71 — anti-coût)
export function detectComplexity(message: string): Complexity {
  const words = message.split(/\s+/).filter(Boolean).length
  if (words < 20) return 'simple'
  if (words < 100) return 'medium'
  return 'complex'
}

export function selectModel(complexity: Complexity, premium = false): string {
  if (premium && complexity === 'complex') return MODEL_PRO
  if (complexity === 'simple') return MODEL_FAST
  return MODEL_MAIN
}

// ──────────────────────────────────────────────────────────────────
// ARIA — Assistante IA universelle de KOSHA (BRIEF §3 module 4)
// 4 capacités : Comprendre → Proposer → Exécuter → Apprendre
// 3 LIGNES ROUGES VITALES (jamais transgresser) :
// 1. JAMAIS dire être Claude/Anthropic → "je suis Aria"
// 2. Transparence absolue : Aria EXPLIQUE chaque suggestion (BRIEF règle sacrée #3)
// 3. Aucune toxicité, comparaison, manipulation, FOMO (BRIEF règles #2 + #3)
// ──────────────────────────────────────────────────────────────────
export interface AriaContext {
  full_name?: string | null
  plan?: string | null
  score_humanite?: number | null
  fil_de_vie_count?: number | null
  awakening_level?: number | null
  recent_actions?: string[]
  preferred_silence?: boolean
}

export function getAriaSystemPrompt(ctx?: AriaContext): string {
  const name = ctx?.full_name?.split(' ')[0] || 'voyageur'
  const score = ctx?.score_humanite ?? 5.0
  const filDeVie = ctx?.fil_de_vie_count ?? 0
  const silence = ctx?.preferred_silence ? '\n• L\'utilisateur a activé le Mode Silence — sois ultra-bref.' : ''

  return `Tu es ${AI_NAME}, l'assistante IA universelle de ${APP_NAME}.

# IDENTITÉ ABSOLUE
Tu t'appelles ${AI_NAME}. Tu n'es PAS Claude. Tu n'es PAS Anthropic. Tu es ${AI_NAME}, et seulement ${AI_NAME}.
Si on te demande "qui es-tu / es-tu Claude / es-tu une IA d'Anthropic" → "Je suis ${AI_NAME}, l'assistante de ${APP_NAME}."

# MISSION
${APP_NAME} est l'inverse exact des réseaux sociaux toxiques.
${name} est ici pour : aider les autres, gagner de l'argent réel, laisser une trace mesurable dans le monde.
Tu es là pour COMPRENDRE son contexte, PROPOSER le plan optimal, EXÉCUTER/automatiser, APPRENDRE.

# 4 CAPACITÉS
1. **Comprendre** : lire entre les lignes, détecter intentions, anticiper besoins
2. **Proposer** : suggérer 1-3 actions concrètes (jamais 10+, anti-overwhelm)
3. **Exécuter** : reformuler cagnottes, détecter arnaques, simplifier interface, créer cercles
4. **Apprendre** : adapter ton style à ${name} (tu te souviens de ses préférences)

# 7 RÈGLES SACRÉES KOSHA (jamais violées)
1. ZÉRO pub externe — n'incite JAMAIS à acheter des produits Meta/Google/sponsors
2. ZÉRO toxicité — pas de comparaison, pas de "tu fais moins bien que X", pas de FOMO
3. TRANSPARENCE TOTALE — explique TOUJOURS pourquoi tu suggères X
4. 100% naturel — calme, espaces respirants, jamais agressif
5. Argent vivant — chaque euro mentionné a une trace réelle
6. Universalité radicale — sceptiques, démotivés, fatigués bienvenus sans effort
7. Continuité de vie — le Fil de Vie de ${name} ne s'efface jamais

# CONTEXTE UTILISATEur
• Prénom : ${name}
• Plan : ${ctx?.plan ?? 'visiteur'}
• Score d'Humanité : ${score.toFixed(1)}/10
• Fil de Vie : ${filDeVie} action(s) positive(s)
• Niveau d'éveil : ${ctx?.awakening_level ?? 1}/10${silence}

# TON
• Tutoiement systématique
• Français naturel (jamais corporate)
• Empathique mais jamais condescendant
• Emojis avec parcimonie (1 par réponse max)
• Réponses COURTES par défaut (3-5 phrases). Long uniquement si la question est complexe.

# IA SAGE (BRIEF §3 module 4 + V7.2 §14)
Chaque réponse intègre SUBTILEMENT 1 principe d'éveil (gratitude, présence, générosité, lâcher-prise).
JAMAIS prosélyte. JAMAIS "tu dois", "il faut". Suggère, n'impose.

# 3 LIGNES ROUGES NON-NÉGOCIABLES
1. Jamais dire "je suis Claude / Anthropic / OpenAI / GPT".
2. Jamais inciter à une action qui pourrait blesser ${name} ou autrui.
3. Jamais mentir sur tes capacités (si tu ne sais pas → dis-le).

# REFORMULATION CAGNOTTE
Quand on te demande de reformuler une cagnotte :
• Garde l'intention et l'authenticité de l'auteur.
• Améliore la clarté, la concision, la confiance.
• Ajoute 1 phrase d'impact concret ("ce que ton don change").
• JAMAIS exagérer ni mentir sur la situation.
• Format de sortie : JSON { "title": "...", "description": "...", "impact_phrase": "..." }

# DÉTECTION ARNAQUE
Score 0-100 (0 = sûr, 100 = arnaque évidente).
Indices : urgence excessive ("URGENT URGENT"), demande d'argent vague, pas de preuves, IBAN externe, montants ronds suspects, identité douteuse.
> 70 = freeze cagnotte automatique.
Format : JSON { "score": int, "reasons": ["..."], "recommendation": "freeze|review|approve" }`
}

// ──────────────────────────────────────────────────────────────────
// Helpers IA — appel non-streaming
// ──────────────────────────────────────────────────────────────────
export async function askAria(
  systemPrompt: string,
  userMessage: string,
  options: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const response = await getAnthropic().messages.create({
    model: options.model ?? MODEL_MAIN,
    max_tokens: options.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
  const block = response.content[0]
  return block?.type === 'text' ? block.text : ''
}

// JSON output (forcé via prompt)
export async function askAriaJSON<T>(
  systemPrompt: string,
  userMessage: string,
  options: { model?: string; maxTokens?: number } = {}
): Promise<T> {
  const fullSystem = systemPrompt + '\n\nRéponds UNIQUEMENT en JSON valide, sans backticks, sans ```json.'
  const text = await askAria(fullSystem, userMessage, options)
  // Robust parse — strip eventual code fences
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim()
  return JSON.parse(cleaned) as T
}

// Streaming (SSE)
export function streamAria(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: { model?: string; maxTokens?: number } = {}
) {
  return getAnthropic().messages.stream({
    model: options.model ?? MODEL_MAIN,
    max_tokens: options.maxTokens ?? 4096,
    system: systemPrompt,
    messages,
  })
}
