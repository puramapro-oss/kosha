# KOSHA — HANDOFF

**Last session ended** : 2026-04-25 19:30
**Phase completed** : P5 ✅ (VIDA IA Aria livré : chat SSE streaming + mémoire cognitive + auto-title + RGPD)
**Next session** : P6 — VIDA MISSIONS (missions rémunérées : actions positives → € ou Points)
**Resume command** : `cd ~/purama/kosha && claude --dangerously-skip-permissions --continue`

---

## ✅ P1 + P2 + P3 + P4 + P5 livrés et live
- **Web** : https://kosha.purama.dev → 200
- **GitHub** : https://github.com/puramapro-oss/kosha
- **Vercel** : puramapro-oss-projects/kosha
- **Latest deploy** : `kosha-oz1hr4cib-puramapro-oss-projects.vercel.app`
- **Build** : 36 routes, 0 erreur TS, warnings cosmétiques uniquement
- **DB** : schema `kosha` avec 23 tables (P1-P5 : +5 Aria — conversations, messages, user_memory, actions_log, cache)
- **Stripe webhook prod** : `we_1TQ8cI4Y1unNvKtX6EtyfECR` (8 events)
- **Modération IA Aria** : opérationnelle (Haiku rapide, 8 catégories)
- **Tests E2E** : **18/18 PASS** (P1-P5 complet, durée 2m48s)

## 📋 Prochaine session — protocole de reprise

1. **Lire** : CLAUDE.md (kosha local) → BRIEF.md → task_plan.md → progress.md → ERRORS.md → PATTERNS.md
2. **Charger 5 skills Purama** : business + design-code + spiritual + purama-system + wealth-engine
3. **Vérifier état** : `npm run build && npx tsc --noEmit` → confirmer 0 erreur
4. **Vérifier live** : `curl -s https://kosha.purama.dev/api/status | grep -q "ok"`
5. **Continuer P6** : tables missions, completions, organizations, mission_funds + UI /missions + admin /org
6. **NEVER** recoder ce qui marche en P1-P5

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
- **Stripe webhook KOSHA** : `we_1TQ8cI4Y1unNvKtX6EtyfECR` — secret `whsec_MgzeEOZw4D2YrbPDKKTD7p0P0eHt5F5l`
- **Tables P4** : posts, cercles, cercle_membres, reactions, story_rewards, silence_mode (tous avec triggers SQL)
- **Modération Aria** : Haiku rapide, score 0-100, 3 statuts (published/pending_review/blocked)

## ⚠️ Risques / TODO

- ✅ **UAT P1+P2+P3+P4+P5** : 18/18 tests Playwright PASS sur prod live (cf e2e/RAPPORT_UAT.md + e2e/uat-aria.spec.ts)
- ✅ **Stripe E2E webhook** : signature HMAC autonome → contribution + cagnotte raised + split 70/15/5/10 + fil_de_vie + impact (3 tests)
- ✅ **P5 Aria livré** : tables (5) + APIs SSE/CRUD/oubli-moi + pages chat plein écran + auto-title + mémoire cognitive + Fil de Vie auto
- TODO P6 : Tables missions/completions/organizations/mission_funds + UI /missions + /org/dashboard
- TODO P11 : VAPID Web Push keys (générer via `npx web-push generate-vapid-keys`) — pour notifs push web
- TODO ARIA : cache 24h Upstash KV (skip P5 — implémentable plus tard sans casser l'existant)
- TODO ARIA : suggestions contextuelles dashboard (anticipation interface — annoncé P5.5 du plan, deferred à P11 polish)
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
