# KOSHA — HANDOFF

**Last session ended** : 2026-04-25 17:18
**Phase completed** : P1 ✅
**Next session** : P2 — VIDA CORE (Fil de Vie + Score d'Humanité + Onboarding)
**Resume command** : `cd ~/purama/kosha && claude --dangerously-skip-permissions --continue`

---

## ✅ P1 livré et live
- **Web** : https://kosha.purama.dev → 200
- **GitHub** : https://github.com/puramapro-oss/kosha
- **Vercel** : puramapro-oss-projects/kosha (`dpl_J4oJC4ac3YCGTqdqyUXjWJ3t5c5d`)
- **DB** : schema `kosha` créé sur VPS, exposé PostgREST, Tissma super_admin seedé

## 📋 Prochaine session — protocole de reprise

1. **Lire** : CLAUDE.md (kosha local) → BRIEF.md → task_plan.md → progress.md → ERRORS.md → PATTERNS.md
2. **Charger 5 skills Purama** (loi 16 V7.2 PROGRESSIVE DISCLOSURE) : business + design-code + spiritual + purama-system + wealth-engine
3. **Vérifier état** : `npm run build && npx tsc --noEmit` → confirmer 0 erreur
4. **Vérifier live** : `curl -s https://kosha.purama.dev/api/status | grep -q "ok"`
5. **Continuer P2** : commencer par les tables SQL de fil_de_vie + score_humanite (porter pattern P1.4 SSH VPS)
6. **NEVER** recoder ce qui marche en P1

---

## 🔑 Critical context (à ne jamais oublier)

- Slug : `kosha` | Domain : `kosha.purama.dev` | Schema PG : `kosha`
- Bundle mobile : `dev.purama.kosha`
- IA : `Aria` (jamais "Claude" — see `src/lib/claude.ts` system prompt)
- Vercel scope : `puramapro-oss-projects` (PAS `puramapro-oss` — c'est le perso)
- Vercel env : `printf "valeur" | vercel env add NAME env --token "$VTOKEN" --scope puramapro-oss-projects --force` (V7.2 §37)
- VPS SSH : `sshpass -p '+Awy3cwg;NoutOTH' ssh root@72.62.191.111`
- Postgres via : `docker exec -i supabase-db psql -U postgres -d postgres`
- Auth via : `https://auth.purama.dev` (Kong proxy → GoTrue)
- Google OAuth déjà actif côté VPS (wildcard `*.purama.dev`)

## ⚠️ Risques / TODO listés
- Treezor sandbox API key absente → stub mode P1, vraie clé pour P3 cagnottes
- Stripe webhook secret = placeholder → créer endpoint en P3 et update env var
- MapTiler key vide → P3 cagnottes carte mondiale
- VAPID Web Push à générer → P4 social

## 📂 Files de planning au root (gitignored, secrets)
- BRIEF.md (BRIEF KOSHA complet, 446 lignes)
- CLAUDE.md (V7.2 CORE)
- CLAUDE-2.md (Purama God Mode 74 sections)
- db/schema.sql (P1 SQL)

## 📂 Files de planning trackés (au root)
- README.md (présenté GitHub)
- task_plan.md (P1✅ → P11)
- progress.md (état détaillé)
- handoff.md (ce fichier)
- ERRORS.md (vide)
- PATTERNS.md (Vercel CLI + GitHub gh + VPS SSH + Supabase + Aria + i18n + design)

---

## 🎯 P2 — VIDA CORE (preview)

Objectif : profil enrichi, Fil de Vie irréversible, Score d'Humanité temps réel, onboarding 30s.

### Tables SQL à créer (P2.1)
```sql
-- fil_de_vie : IMMUTABLE log d'actions positives
CREATE TABLE kosha.fil_de_vie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_label TEXT NOT NULL,
  impact_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS : user voit/insère sa propre fil_de_vie. JAMAIS DELETE/UPDATE (immuable)

CREATE TABLE kosha.score_humanite_history (
  user_id UUID, date DATE,
  score NUMERIC(3,1),
  components JSONB,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE kosha.universe_personnel (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  niveau_conscience INT, energie INT, equilibre INT, contribution INT,
  evolved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kosha.onboarding_responses (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  q1_motivation TEXT, q2_priorité TEXT, q3_disponibilité TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : INSERT fil_de_vie → UPDATE profiles.fil_de_vie_count + recompute score
```

### Pages
- `/onboarding` — 3 questions glass cards full-screen swipe → `kosha.onboarding_responses` + `profiles.onboarding_completed=true`
- `/dashboard` — version réelle (remplace placeholder P1) avec MomentWow (3 KPIs animés realtime)
- `/profile` — Fil de Vie timeline + ScoreHumaniteJauge + UniverPersonelRadar

### Composants
- `<MomentWow />`, `<FilDeVieTimeline />`, `<ScoreHumaniteJauge />`, `<UniverPersonelRadar />`

### Hooks
- `useFilDeVie` (Supabase realtime), `useScoreHumanite`

### GATE P2
- Onboarding < 30s mesuré
- Fil de Vie immuable (DELETE bloqué par RLS)
- Score realtime push après insert fil_de_vie
- Affichage transparent ("Tu as 5.0/10 grâce à...")

Estimated 3h.
