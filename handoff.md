# KOSHA — HANDOFF

**Last session ended** : 2026-04-25 17:35
**Phase completed** : P2 ✅
**Next session** : P3 — VIDA CAGNOTTE (cœur financier — 5 types de cagnottes + Stripe + Treezor + Aria reformulation + carte mondiale)
**Resume command** : `cd ~/purama/kosha && claude --dangerously-skip-permissions --continue`

---

## ✅ P1 + P2 livrés et live
- **Web** : https://kosha.purama.dev → 200
- **GitHub** : https://github.com/puramapro-oss/kosha (commit `d1f94bd`)
- **Vercel** : puramapro-oss-projects/kosha
- **DB** : schema `kosha` avec profiles + fil_de_vie + score_humanite_history + universe_personnel + onboarding_responses

## 📋 Prochaine session — protocole de reprise

1. **Lire** : CLAUDE.md (kosha local) → BRIEF.md → task_plan.md → progress.md → ERRORS.md → PATTERNS.md
2. **Charger 5 skills Purama** : business + design-code + spiritual + purama-system + wealth-engine
3. **Vérifier état** : `npm run build && npx tsc --noEmit` → confirmer 0 erreur
4. **Vérifier live** : `curl -s https://kosha.purama.dev/api/status | grep -q "ok"`
5. **Continuer P3** : commencer par lib/treezor.ts (stub) + lib/opentimestamps.ts + tables SQL cagnottes
6. **NEVER** recoder ce qui marche en P1+P2

---

## 🔑 Critical context (à ne jamais oublier)

- Slug : `kosha` | Domain : `kosha.purama.dev` | Schema PG : `kosha`
- Bundle mobile : `dev.purama.kosha`
- IA : `Aria` (jamais "Claude" — see `src/lib/claude.ts` system prompt)
- Vercel scope : `puramapro-oss-projects` (PAS `puramapro-oss` — c'est le perso)
- Vercel env : `printf "valeur" | vercel env add NAME env --token "$VTOKEN" --scope puramapro-oss-projects --force`
- VPS SSH : `sshpass -p '+Awy3cwg;NoutOTH' ssh root@72.62.191.111`
- Postgres via : `docker exec -i supabase-db psql -U postgres -d postgres`
- Auth via : `https://auth.purama.dev` (Kong proxy → GoTrue)
- Google OAuth déjà actif (wildcard `*.purama.dev`)

## ⚠️ Risques / TODO
- ❗ UAT P1+P2 : Tissma doit signup en navigation privée → onboarding → score 5.0/10 + Fil de Vie 1 entry + click "Action 30s" → Fil de Vie 2 entries
- TODO P3 : Treezor sandbox API key (stub `stub_phase_1_simulate_only` actuellement)
- TODO P3 : MapTiler API key (peut utiliser tiles OSM publics gratuits en attendant)
- TODO P3 : Stripe webhook secret (créer endpoint `/api/stripe/webhook` puis update env via CLI)
- TODO P4 : VAPID Web Push keys
- ⚠️ /profile bundle = 337 kB (Recharts) → P5 design polish : `dynamic({ssr:false})` pour code-splitting

## 📂 Files de planning (gitignored, secrets)
- BRIEF.md, CLAUDE.md, CLAUDE-2.md, db/*.sql

## 📂 Files trackés (root)
- README.md, task_plan.md, progress.md, handoff.md, ERRORS.md, PATTERNS.md

---

## 🎯 P3 — VIDA CAGNOTTE (preview, ~5h)

Cœur financier de KOSHA. 5 types de cagnottes avec Aria reformulation + Stripe checkout + Treezor split 70/15/5/10 + carte mondiale impact.

### Tables SQL à créer (P3.1)
```sql
-- 5 types : communautaire | projet_vie | action_immediate | humanitaire | hybride
CREATE TABLE kosha.cagnottes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('communautaire', 'projet_vie', 'action_immediate', 'humanitaire', 'hybride')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_amount_cents BIGINT NOT NULL CHECK (target_amount_cents > 0),
  raised_amount_cents BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'frozen', 'fraud_check', 'cancelled')),
  ai_score_arnaque INT,                  -- 0-100, > 70 = freeze
  ai_reformulation_done BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  geolocation_geohash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ
);

CREATE TABLE kosha.cagnotte_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cagnotte_id UUID NOT NULL REFERENCES kosha.cagnottes(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES auth.users(id),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  message TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  paid_via TEXT NOT NULL CHECK (paid_via IN ('stripe', 'treezor')),
  stripe_payment_id TEXT,
  treezor_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Split 70/15/5/10 (BRIEF §3 module 2)
CREATE TABLE kosha.cagnotte_splits (
  cagnotte_id UUID PRIMARY KEY REFERENCES kosha.cagnottes(id) ON DELETE CASCADE,
  projet_amount_cents BIGINT DEFAULT 0,        -- 70%
  contributors_amount_cents BIGINT DEFAULT 0,  -- 15%
  securite_amount_cents BIGINT DEFAULT 0,      -- 5%
  fonds_vida_amount_cents BIGINT DEFAULT 0,    -- 10% (dont 5% Asso)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- "Argent à mémoire" — chaque don a une trace blockchain BTC
CREATE TABLE kosha.argent_memoire (
  contribution_id UUID PRIMARY KEY REFERENCES kosha.cagnotte_contributions(id),
  from_user_id UUID,
  to_cagnotte_id UUID,
  action_label TEXT,
  amount_cents BIGINT,
  ots_proof_url TEXT,                          -- OpenTimestamps proof
  bitcoin_block_height INT,
  stamped_at TIMESTAMPTZ
);

CREATE TABLE kosha.fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cagnotte_id UUID REFERENCES kosha.cagnottes(id),
  signal_type TEXT CHECK (signal_type IN ('ai_detected', 'community_reported', 'stripe_radar')),
  severity INT CHECK (severity BETWEEN 1 AND 10),
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compteurs live (BRIEF §3 module 6)
CREATE TABLE kosha.impact_global (
  id INT PRIMARY KEY DEFAULT 1,
  kg_dechets BIGINT DEFAULT 0,
  arbres BIGINT DEFAULT 0,
  l_eau BIGINT DEFAULT 0,
  personnes BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (id = 1)
);
```

### Lib files (P3.2)
- `src/lib/treezor.ts` — stub createTreezorUser, splitPayout (Phase 1 = log + simulate)
- `src/lib/opentimestamps.ts` — `stampHash(sha256)` via lib `javascript-opentimestamps` (déjà installé), `verifyProof()`
- `src/lib/cagnottes.ts` — calculateSplit(amount), validateCagnotte (Zod schema)

### Pages (P3.3-P3.6)
- `/cagnottes` — grid filtrable (type, raised %, deadline)
- `/cagnottes/nouvelle` — wizard 4 steps : type → titre/description → image + Aria reformulation → confirmation
- `/cagnottes/[id]` — détail + barre progression realtime + bouton contribuer (Stripe Checkout)
- `/impact-mondial` — MapLibre + tiles MapTiler (ou OSM publics) + points lumineux temps réel via Supabase realtime

### API routes
- `POST /api/cagnottes/create` — Zod + Aria reformulation (Sonnet)
- `POST /api/cagnottes/[id]/contribute` — Stripe Checkout Session (lance redirect)
- `POST /api/stripe/webhook` — `checkout.session.completed` → log contribution + déclenche split + INSERT fil_de_vie + INSERT argent_memoire (OTS stamp)
- `POST /api/treezor/split` — stub Phase 1 (log uniquement) / Phase 2 vraie split SEPA
- `POST /api/cagnottes/[id]/report` — signalement communautaire
- `POST /api/aria/fraud-check` — Aria score 0-100 (Haiku rapide)

### GATE P3
- 1 cagnotte test créable end-to-end
- Stripe checkout test (carte 4242) → contribution loggée + split calculé
- Aria reformulation testée sur 1 cagnotte
- Carte mondiale charge avec ≥1 point lumineux
- Anti-fraude : cagnotte avec mots-clés "URGENT URGENT BTC" → freeze auto

### Risques P3
- Treezor : stub mode (vraie clé post-SASU). Logger les transactions simulées dans une table `treezor_simulated`.
- Stripe webhook : doit être créé manuellement via API curl + envoyer secret dans Vercel via CLI (V7.2 §17 + §37)
- OpenTimestamps : peut être lent (call API publique) → async background, log entry sans attendre proof Bitcoin (qui peut prendre 1h)

### Notes de session
- Si > 50% context → /compact entre P3.X et P3.X+1
- Si > 60% → handoff intermédiaire P3 partiel
- Estimated 5h (le plus gros phase, peut nécessiter 2 sessions)
