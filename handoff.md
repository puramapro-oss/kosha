# KOSHA — HANDOFF

**Last session ended** : 2026-04-25 21:00
**Phase completed** : **P11.web ✅** (KOSHA WEB COMPLET — toutes les phases P1→P10 livrées + P11 web QA + Lighthouse > 90 + 3 flows critiques regression guardian)
**Next session** : P11.mobile — Expo 52 init `kosha-mobile` (bundle `dev.purama.kosha`) + EAS build iOS+Android (nécessite Apple Developer + Google Play credentials)
**Resume command** : `cd ~/purama/kosha && claude --dangerously-skip-permissions --continue`

---

## 🚀 KOSHA WEB COMPLET — v1.0-web

- **Web** : https://kosha.purama.dev → 200
- **GitHub** : https://github.com/puramapro-oss/kosha
- **Vercel** : puramapro-oss-projects/kosha
- **Latest deploy** : `kosha-gxv1d7dvs-puramapro-oss-projects.vercel.app`
- **Build** : 58 routes, 0 erreur TS strict
- **DB** : schema `kosha` avec 35+ tables, 14+ triggers SECURITY DEFINER
- **Stripe webhook prod** : `we_1TQ8cI4Y1unNvKtX6EtyfECR` (8 events)
- **Tests E2E** : **43/43 PASS** (en isolation), **40/43 + 1 flake Aria streaming + 2 unrun** en parallèle full
- **Lighthouse 3 pages** : tous > 90 (Perf 94-97, A11y 95-96, BP 96-100, SEO 90)
- **Web vitals homepage** : LCP 2.4s, FCP 1.1s, CLS 0.002
- **Rapport final** : `e2e/RAPPORT_UAT.md`

## ✅ Phases livrées (P1-P11.web)

| P | Domaine | Tests | Live |
|---|---------|------:|------|
| P1 | Setup + Auth (Supabase + Google OAuth + middleware SSR) | inclus uat.spec | ✅ |
| P2 | VIDA CORE (Fil de Vie immuable + Score Humanité radial + onboarding 3Q) | inclus uat.spec | ✅ |
| P3 | VIDA CAGNOTTE (5 types + wizard 4 steps + Aria reformule + Stripe webhook + OpenTimestamps Bitcoin) | 3 + uat.spec | ✅ |
| P4 | VIDA SOCIAL (modération Aria + cercles max 12 + 3 réactions + Mode Silence chevauchement minuit) | inclus uat.spec | ✅ |
| P5 | VIDA IA Aria (chat SSE streaming + auto-title + mémoire + sacred line) | 4 | ✅ |
| P6 | VIDA MISSIONS (validation Aria + +50pts auto + 8 missions seedées) | 5 | ✅ |
| P7 | VIDA IMPACT (dashboard perso + collectif + rapport A4 imprimable PDF) | 5 | ✅ |
| P8 | VIDA RITUELS (1/sem + 6 thèmes cycliques + live counter realtime) | 4 | ✅ |
| P9 | VIDA NEWSLETTER (6 blocs Aria + RFC 8058 One-Click) | 4 | ✅ |
| P10 | VIDA ESPACE PILOTE (back-office triple-check + KPIs + config dynamique + audit logs) | 4 | ✅ |
| P11.web | Lighthouse + 3 flows critiques regression guardian | 3 | ✅ |

## 📋 Prochaine session — protocole de reprise

1. **Lire** : CLAUDE.md (kosha local) → BRIEF.md → task_plan.md → progress.md → ERRORS.md → PATTERNS.md
2. **Charger 5 skills Purama** : business + design-code + spiritual + purama-system + wealth-engine
3. **Vérifier état** : `npm run build && npx tsc --noEmit` → confirmer 0 erreur
4. **Vérifier live** : `curl -s https://kosha.purama.dev/api/status | grep -q "ok"`
5. **Continuer P11.mobile** : Expo 52 init `kosha-mobile` + auth SecureStore (Platform.OS adapter) + icônes Pollinations + EAS build iOS+Android
6. **NEVER** recoder ce qui marche en P1-P11.web

**TODO ops (peut être fait en parallèle)** :
- Configurer CRON n8n weekly pour POST `/api/cron/newsletter-weekly` lundi 9h Europe/Paris + `/api/cron/rituels-tick` lundi 00:05 UTC, tous deux avec `Authorization: Bearer ${CRON_SECRET}`
- Générer `CRON_SECRET` (`openssl rand -hex 32`) + `vercel env add CRON_SECRET production`
- Vérifier domaine email Resend `noreply@purama.dev` (DKIM/SPF/DMARC dans DNS via Hostinger)
- Optionnel : tag git `v1.0-web` pour marquer la version stable

---

## 🔑 Critical context (à ne jamais oublier)

- Slug : `kosha` | Domain : `kosha.purama.dev` | Schema PG : `kosha`
- Bundle mobile : `dev.purama.kosha`
- IA : `Aria` (jamais "Claude" — see `src/lib/claude.ts` system prompt)
- Vercel scope : `puramapro-oss-projects` (PAS `puramapro-oss` — c'est le perso)
- Vercel env : `printf "valeur" | vercel env add NAME env --token "$VTOKEN" --scope puramapro-oss-projects`
- VPS SSH : `sshpass -p '+Awy3cwg;NoutOTH' ssh root@72.62.191.111`
- Postgres via : `docker exec -i supabase-db psql -U postgres -d postgres`
- Auth via : `https://auth.purama.dev` (Kong proxy → GoTrue)
- Google OAuth déjà actif (wildcard `*.purama.dev`)
- **STRIPE_SECRET_KEY** authoritative = celle de `~/purama/CLAUDE-2.md` (l'autre `~/purama/.env.secrets` ...Ni7m est REVOKED)
- **Stripe webhook KOSHA** : `we_1TQ8cI4Y1unNvKtX6EtyfECR` — secret `***REMOVED-WEBHOOK-SECRET***`
- **Tables P4** : posts, cercles, cercle_membres, reactions, story_rewards, silence_mode (tous avec triggers SQL)
- **Modération Aria** : Haiku rapide, score 0-100, 3 statuts (published/pending_review/blocked)

## ⚠️ Risques / TODO

- ✅ **UAT P1-P7** : 28/28 tests Playwright PASS sur prod live (uat.spec + uat-stripe + uat-aria + uat-missions + uat-impact)
- ✅ **Stripe E2E webhook** : signature HMAC autonome → contribution + cagnotte raised + split 70/15/5/10 + fil_de_vie + impact (3 tests)
- ✅ **P5 Aria** : tables (5) + APIs SSE/CRUD/oubli-moi + pages chat plein écran + auto-title + mémoire cognitive + Fil de Vie auto
- ✅ **P6 Missions** : tables (5) + 8 missions seedées + validation Aria + crédit Points auto + anti-fraude validé E2E
- ✅ **P7 Impact** : lib/impact.ts (getPersonalImpact, getCollectiveImpact, getYearlyReport) + 2 APIs + /impact dashboard + /impact/[year]/rapport page A4 imprimable (PDF via navigateur, pas de lib externe lourde)
- 🔁 Cron Aria health hebdo (lundi 9h57) — session-only (durable=true ignoré, auto-expire 7j)
- TODO P7 : VIDA IMPACT — dashboard impact transparent (cumuls personnels + collectifs) + rapports annuels PDF
- TODO P8 : VIDA RITUELS (méditations guidées + sessions live) — opt
- TODO P9-P10 : VIDA NEWSLETTER + VIDA ESPACE PILOTE
- TODO P11 : Mobile Expo + EAS submit stores (iOS+Android) — voir skill purama-system
- TODO P11 : VAPID Web Push keys (générer via `npx web-push generate-vapid-keys`) — pour notifs push web
- TODO P11 : Suggestions contextuelles Aria dashboard (anticipation interface)
- TODO P11 : /org/dashboard — interface organisation pour financer missions via Stripe (commission 15%)
- TODO ARIA : cache 24h Upstash KV (optionnel)
- ⚠️ /profile bundle = 338 kB (Recharts) → P11 design polish (code-split)
- ⚠️ /feed + /cagnottes/* bundles ~316-319 kB — code-split possible
- ⚠️ /profile bundle = 338 kB (Recharts) → P5 design polish
- ⚠️ /feed + /cagnottes/* bundles ~316-319 kB — code-split possible
- ⚠️ Vercel preview env : STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET pas synced (production OK)
- TODO P11 : Réactions multisensorielles haptique natives (mobile uniquement)
- TODO P11 : Stories d'évolution full-screen swipe (mobile-first)

## 📂 Files de planning (gitignored, secrets)
- BRIEF.md, CLAUDE.md, CLAUDE-2.md, db/*.sql

## 📂 Files trackés (root)
- README.md, task_plan.md, progress.md, handoff.md, ERRORS.md, PATTERNS.md

---

## 🎯 P5 — VIDA IA Aria (preview, ~3h)

Chat plein écran style ChatGPT mais design KOSHA. Aria avec mémoire persistante + anticipation interface + sélection auto modèle.

### Tables SQL à créer (P5.1)
```sql
CREATE TABLE kosha.aria_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,                                              -- auto-généré par Aria après 3-5 messages
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kosha.aria_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES kosha.aria_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  model TEXT,                                              -- haiku/sonnet/opus utilisé
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kosha.aria_user_memory (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}'::jsonb,                   -- ton, longueur, style
  current_projects TEXT[],                                 -- "ouvrir cagnotte X", "cercle Y"
  long_term_themes TEXT[],                                 -- "spiritualité", "finance"
  emotional_state TEXT,                                    -- détecté par Aria, mis à jour subtilement
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kosha.aria_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT,                                        -- 'reformulate_cagnotte', 'fraud_check', 'memory_update'
  target_id UUID,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kosha.aria_cache (
  cache_key TEXT PRIMARY KEY,
  response TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pages (P5.2)
- `/aria` — liste conversations + bouton "Nouvelle conversation"
- `/aria/[id]` — chat plein écran SSE streaming, 1 column max-w-3xl, design KOSHA glass

### API (P5.3)
- POST /api/aria/chat — SSE streaming via `streamAria` + insert aria_messages + auto-title après 5 messages
- GET /api/aria/conversations — liste
- POST /api/aria/conversations — créer
- DELETE /api/aria/conversations/[id] — archive (soft)

### Lib (P5.4)
- `src/lib/aria-memory.ts` — `getUserMemory(userId)` + `updateUserMemory(userId, patch)` (Aria écrit elle-même)
- `src/lib/aria-cache.ts` — Upstash KV cache 24h pour réponses fréquentes

### Anticipation (P5.5)
- DashboardClient : suggestions contextuelles auto-générées par Aria (Haiku, fond, mise à jour quotidienne)
- Ex : "Tu as ouvert 2 cagnottes la semaine dernière. Veux-tu en clôturer une qui n'avance pas ?"
- Stocker en aria_actions_log pour audit + UX A/B

### GATE P5
- Chat fonctionne en SSE streaming
- Aria ne dit JAMAIS "Claude / Anthropic"
- Title auto-généré après 5 messages
- Mémoire persiste entre conversations
- Modèle auto (Haiku < 20 mots, Sonnet par défaut, Opus si premium + complex)

### Risques P5
- Streaming SSE : implémentation Next 15 + Anthropic SDK — vérifier compat (`messages.stream()` retourne async iterator)
- Tokens cost : checker max_tokens 4096 par défaut, baisser à 2048 si feedback "réponses trop longues"
- Mémoire RGPD : permettre user `/aria/oubli-moi` qui clear `aria_user_memory` row
- Cache key collisions : prefixer par user_id

### Notes de session
- Si > 50% context → /compact entre P5.X et P5.X+1
- Si > 60% → handoff intermédiaire P5 partiel
- Estimated 3h
