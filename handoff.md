# KOSHA — HANDOFF

**Last session ended** : 2026-04-25 18:05
**Phase completed** : P3 ✅ (VIDA CAGNOTTE livré + Stripe webhook prod actif)
**Next session** : P4 — VIDA SOCIAL (feed inversé positif + cercles + stories rémunérées)
**Resume command** : `cd ~/purama/kosha && claude --dangerously-skip-permissions --continue`

---

## ✅ P1 + P2 + P3 livrés et live
- **Web** : https://kosha.purama.dev → 200
- **GitHub** : https://github.com/puramapro-oss/kosha (commit `d2b7f71`)
- **Vercel** : puramapro-oss-projects/kosha
- **Latest deploy** : `kosha-i84131se4-puramapro-oss-projects.vercel.app`
- **Build** : 24 routes, 0 erreur TS, 1 warning cosmétique
- **DB** : schema `kosha` avec 12 tables (P1+P2+P3)
- **Stripe webhook prod** : `we_1TQ8cI4Y1unNvKtX6EtyfECR` (7 events)

## 📋 Prochaine session — protocole de reprise

1. **Lire** : CLAUDE.md (kosha local) → BRIEF.md → task_plan.md → progress.md → ERRORS.md → PATTERNS.md
2. **Charger 5 skills Purama** : business + design-code + spiritual + purama-system + wealth-engine
3. **Vérifier état** : `npm run build && npx tsc --noEmit` → confirmer 0 erreur
4. **Vérifier live** : `curl -s https://kosha.purama.dev/api/status | grep -q "ok"`
5. **Continuer P4** : commencer par tables SQL posts/cercles/reactions, puis /feed (positif filtré IA)
6. **NEVER** recoder ce qui marche en P1+P2+P3

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

## ⚠️ Risques / TODO

- ❗ **UAT P3** : Tissma doit créer 1 cagnotte (wizard 4 steps), faire un don test (Stripe test cards en mode live = risk pour vrai prélèvement — préférer 1€ réel sur cagnotte test puis refund), vérifier Fil de Vie + Impact Mondial map
- ❗ **UAT P1+P2** toujours en attente
- TODO P4 : VAPID Web Push keys (générer via `npx web-push generate-vapid-keys`)
- TODO P4 : Tables posts/cercles/cercle_membres/reactions/story_rewards/silence_mode
- TODO P5 : code-split Recharts + MapLibre dynamique (déjà fait pour MapLibre)
- TODO P6 : Treezor live API key (post-SASU)
- ⚠️ /profile bundle = 338 kB (Recharts) → P5 design polish
- ⚠️ Vercel preview env : STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET pas synced (production OK)

## 📂 Files de planning (gitignored, secrets)
- BRIEF.md, CLAUDE.md, CLAUDE-2.md, db/*.sql

## 📂 Files trackés (root)
- README.md, task_plan.md, progress.md, handoff.md, ERRORS.md, PATTERNS.md

---

## 🎯 P4 — VIDA SOCIAL (preview, ~4h)

Réseau social inversé : zéro toxicité, zéro likes, zéro followers. Énergie + gratitude + soutien comme seules réactions.

### Tables SQL à créer (P4.1)
```sql
-- posts : contenu positif uniquement (modération IA Aria)
CREATE TABLE kosha.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  cercle_id UUID REFERENCES kosha.cercles(id), -- nullable si post public
  content TEXT NOT NULL CHECK (length(content) BETWEEN 10 AND 2000),
  ai_moderation_score INT,                  -- 0-100, > 70 = bloqué
  ai_moderation_reason TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('pending_review','published','blocked','deleted')),
  type TEXT CHECK (type IN ('text','story','milestone','gratitude')),
  media_url TEXT,
  reactions_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- cercles : groupes thématiques max 12 membres (BRIEF — Communauté d'amour)
CREATE TABLE kosha.cercles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 3 AND 60),
  intention TEXT NOT NULL CHECK (length(intention) BETWEEN 10 AND 500),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  max_members INT NOT NULL DEFAULT 12 CHECK (max_members BETWEEN 3 AND 24),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kosha.cercle_membres (
  cercle_id UUID NOT NULL REFERENCES kosha.cercles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','captain')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  streak_days INT DEFAULT 0,
  PRIMARY KEY (cercle_id, user_id)
);

-- reactions : 3 types uniquement (energie/gratitude/soutien)
CREATE TABLE kosha.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES kosha.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('energie','gratitude','soutien')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id, type)
);

-- story_rewards : auto-rémunération stories d'évolution
CREATE TABLE kosha.story_rewards (
  story_post_id UUID PRIMARY KEY REFERENCES kosha.posts(id),
  reward_cents INT DEFAULT 0,
  paid_via TEXT,
  paid_at TIMESTAMPTZ
);

-- silence_mode : Mode Silence (BRIEF — Notifications IA adaptées)
CREATE TABLE kosha.silence_mode (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  start_hour INT CHECK (start_hour BETWEEN 0 AND 23),
  end_hour INT CHECK (end_hour BETWEEN 0 AND 23),
  days_of_week INT[] DEFAULT '{0,1,2,3,4,5,6}',
  paused_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALTER PUBLICATION supabase_realtime ADD TABLE kosha.posts, kosha.reactions, kosha.cercles, kosha.cercle_membres;
```

### Pages (P4.2-P4.6)
- `/feed` — feed positif filtré, 0 likes, 0 followers, 3 réactions max
- `/cercles` — grid cercles + bouton "Ouvrir un cercle"
- `/cercles/[id]` — chat + activité + membres + intention
- `/stories` — full-screen swipe vertical (TikTok-style mais positif)
- `/silence` — config Mode Silence calendrier

### API
- `POST /api/posts/create` — Aria modère AVANT publication
- `POST /api/posts/[id]/react` — toggle reaction (3 types max)
- `POST /api/cercles/create` + `/api/cercles/[id]/join`
- `POST /api/silence/update`

### Lib
- `src/lib/moderation.ts` — `moderatePost(text)` via Aria Haiku → score 0-100
- `src/lib/silence.ts` — `isInSilenceWindow(userId)` check timezone

### GATE P4
- Post comparatif/négatif/FOMO → bloqué auto par Aria
- 3 réactions seulement (energie/gratitude/soutien)
- Silence Mode bloque vraiment les notifs
- Cercle ne peut dépasser 12 membres

### Risques P4
- Moderation IA peut être trop stricte → seuil tunable (commencer à 60 plutôt que 70)
- VAPID keys à générer ET ajouter via vercel env (CLI uniquement)
- Stories full-screen = re-design header conditionnel
- Realtime sur posts → /feed se met à jour en live

### Notes de session
- Si > 50% context → /compact entre P4.X et P4.X+1
- Si > 60% → handoff intermédiaire P4 partiel
- Estimated 4h
