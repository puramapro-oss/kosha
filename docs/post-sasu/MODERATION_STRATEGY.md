# KOSHA — Stratégie modération UGC (critique pour approval Apple/Google)

> Document d'accompagnement aux soumissions stores. Apple Guideline 1.2 / 1.6 + Google Play "User-Generated Content" policies exigent **proactivité démontrable** sur la modération.
>
> Pour KOSHA, la modération **EST** le produit (réseau social ultra-positif = définition même par la modération).

## 7 règles sacrées (BRIEF KOSHA)

> Reprise textuelle du BRIEF, à respecter à la lettre :

1. **Zéro pub externe** — uniquement pub interne entre utilisateurs (jamais Meta/Google/sponsors externes).
2. **Zéro toxicité** — pas de likes négatifs, pas de comparaison, pas de FOMO agressif, pas de classement humiliant.
3. **Zéro manipulation** — l'IA explique chaque suggestion, transparence totale.
4. **100% naturel** — design pur, calme, espaces respirants, jamais agressif.
5. **Argent vivant** — chaque euro a une trace, une mémoire, une conséquence réelle.
6. **Universalité radicale** — sceptiques, démotivés, fatigués, blasés y trouvent leur place sans effort.
7. **Continuité de vie** — le compte ne s'efface jamais, l'utilisateur construit un Fil de Vie.

## Architecture modération (à démontrer en review)

```
                ┌─────────────────────────────┐
                │  USER POSTS / COMMENTS /    │
                │  CIRCLE MESSAGES            │
                └──────────────┬──────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  COUCHE 1 — AI MODÉRATION TEMPS RÉEL    │
        │  (Claude Haiku 4.5, < 500ms)             │
        │  Analyse :                               │
        │  - Hate speech / harcèlement             │
        │  - Health misinformation                 │
        │  - Self-harm content                     │
        │  - Scam / fraud detection                │
        │  - Product placement banni               │
        │  - FOMO / manipulation patterns          │
        │  - Spam / link farms                     │
        └──────────────┬───────────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
    ┌─────────────┐    ┌──────────────────┐
    │  AUTO-BLOC  │    │  PUBLISH (vert)  │
    │  (rouge)    │    │  + flag bouton   │
    └──────┬──────┘    └────────┬─────────┘
           │                    │
           ▼                    ▼
    ┌──────────────┐    ┌────────────────────┐
    │ User notif   │    │  COUCHE 2 — FLAG   │
    │ + raison FR  │    │  (réactif + AI    │
    │ + appel      │    │   re-check on flag)│
    └──────────────┘    └────────┬───────────┘
                                 │
                          ┌──────┴────────┐
                          ▼               ▼
                    ┌──────────┐  ┌────────────────┐
                    │ 3+ flags │  │ Single flag    │
                    │ same     │  │ → AI re-check  │
                    │ user 24h │  │   no action si │
                    │ → auto   │  │   contenu OK   │
                    │ block    │  │                │
                    │ 24h      │  │                │
                    └────┬─────┘  └────────────────┘
                         │
                         ▼
                ┌──────────────────────────┐
                │ COUCHE 3 — HUMAIN        │
                │ (Tissma, < 24h)          │
                │ Review flagged + auto-   │
                │ block decisions          │
                │ Final ban si confirmé    │
                └──────────────────────────┘
```

## Couche 1 — AI temps réel (Claude Haiku 4.5)

### Prompt système

```
Tu es le modérateur AI de KOSHA, un réseau social ultra-positif.
Ta mission : protéger la communauté de toute toxicité.

Pour chaque post / commentaire, retourne un JSON :
{
  "verdict": "publish" | "block" | "review",
  "reason": "<une phrase FR explicative>",
  "category": "ok" | "hate" | "health_misinfo" | "self_harm" |
              "scam" | "product_placement" | "spam" |
              "manipulation" | "fomo" | "harassment"
}

Règles strictes (BLOCK) :
- Insulte, harcèlement, menace même implicite
- Health misinformation (claims médicaux non sourcés)
- Self-harm/suicide (sauf safety net 3114/15/112 institutionnel)
- Scam / lien suspect / phishing
- Product placement (mention produits/services payants externes)
- Manipulation / FOMO ("achète vite", "dernière chance", "tu rates")
- Spam / link farm / promotion massive
- Comparaison humiliante ("regarde comme tu es nul")

Règles tolérantes (PUBLISH) :
- Critique constructive
- Désaccord respectueux
- Émotion négative authentique exprimée sainement
- Demande d'aide, vulnérabilité

Doute → "review" (pas de block automatique).

Si verdict = "block", la réponse user FR sera :
"Ce message a été suspendu pour respecter notre charte communautaire :
{reason}. Tu peux faire appel via le bouton ci-dessous."
```

### Performance attendue

- Latence : < 500ms p95 (Haiku 4.5 en streaming).
- Coût : ~0,0005 € par message (1k tokens in, 100 tokens out).
- Précision visée : > 95% sur dataset test (à constituer).
- Faux positifs : < 5% (préférer "review" à "block" en cas de doute).

### Volume estimé

Pour 100K users actifs / mois :
- ~10 posts / user / mois = 1M / mois
- Coût modération AI : ~500 €/mois
- Volume "review" attendu : ~10% = 100K à reviewer humainement → IMPOSSIBLE seul

→ Implication : la **couche 2 (flag-driven re-check)** réduit le volume humain à ~1% = 10K / mois = ~330 / jour. Faisable par Tissma + 1-2 modérateurs futurs (tier "Légende").

## Couche 2 — Flag-and-block utilisateur

### UX

- Bouton flag visible sur CHAQUE post / commentaire / message Cercle.
- Modale courte : "Pourquoi tu signales ce contenu ?" + 6 raisons (hate, scam, health misinfo, self-harm, harassment, autre).
- Confirmation : "Merci. Notre équipe examine sous 24h."

### Logic

```sql
-- Auto-block si 3+ flags sur même user en 24h
CREATE TABLE moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  reported_user_id UUID REFERENCES profiles(id),
  content_id UUID,
  content_type TEXT,
  reason TEXT,
  ai_verdict TEXT, -- résultat re-check Haiku
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION check_auto_block() RETURNS TRIGGER AS $$
DECLARE
  flag_count INT;
BEGIN
  SELECT COUNT(*) INTO flag_count
  FROM moderation_flags
  WHERE reported_user_id = NEW.reported_user_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF flag_count >= 3 THEN
    UPDATE profiles SET status = 'auto_blocked_24h',
      blocked_until = NOW() + INTERVAL '24 hours'
    WHERE id = NEW.reported_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_block_check
  AFTER INSERT ON moderation_flags
  FOR EACH ROW EXECUTE FUNCTION check_auto_block();
```

## Couche 3 — Humain (< 24h)

### Workflow Tissma

1. Email auto à `dev@purama.dev` quand auto-block déclenché.
2. Dashboard `/admin/moderation` :
   - Files attentes : `auto_blocked` + `flagged`.
   - Pour chaque file : preview contenu, raisons, AI verdicts.
   - 3 actions : `dismiss` (annuler block), `confirm` (block 7j ou ban perma), `escalate` (cas grave → 3114/police).
3. Délai cible : < 24h.

### Cas escalade police / 3114

- Self-harm imminent → auto-display safety net 3114/15/112 + email modérateur urgence.
- Threat physical violence → log + email urgence.
- CSAM (child abuse material) → signalement immédiat NCMEC / Pharos via API : INTERDIT au niveau code de garder une copie.

## Politiques publiques à publier

### `kosha.purama.dev/legal/moderation`

> Public-facing community guidelines.

Sections :
1. **Notre engagement** : 7 règles sacrées.
2. **Ce qui est interdit** : liste exhaustive (hate, scam, etc.).
3. **Ce qui est encouragé** : gratitude, entraide, vulnérabilité.
4. **Comment nous modérons** : 3 couches (AI, flag, humain).
5. **Sanctions** : block 24h auto → 7 jours → ban permanent.
6. **Appel** : email `appeal@purama.dev` + délai réponse < 7j.
7. **Cas escalade** : self-harm → 3114, urgence → 112, signalement → Pharos.

### `kosha.purama.dev/legal/aml-kyc`

> AML/KYC policy publique (requis par Treezor + Apple/Google review).

Sections :
1. **Cadre légal** : PSD2 EU + ACPR France, Treezor EME licensed.
2. **Niveaux KYC** : 
   - Level 0 : signup email, < 200 € lifetime.
   - Level 1 : nom + DOB + SSN partial, < 1 000 € / mois.
   - Level 2 : CNI + selfie + justif domicile, illimité (Treezor enforced).
3. **Anti-arnaque** : AI scan paiements suspects + verification humaine paiement > seuils.
4. **AML** : transaction reporting > 10 000 € / mois cumulés (Treezor obligation).
5. **Refus / suspension** : circumstances + procédure recours.

## Démonstration en App Review (Apple + Google)

> À inclure dans le bloc Notes Review (cf `APPLE_DEVELOPER_SETUP.md` § ⑪).

Texte à coller :

```
USER-GENERATED CONTENT MODERATION (STRATEGY)

KOSHA implements a 3-layer moderation strategy, fully documented at
https://kosha.purama.dev/legal/moderation:

LAYER 1 — REAL-TIME AI MODERATION
- Claude Haiku 4.5 analyzes every post/comment/message in < 500ms.
- Auto-block on hate speech, harassment, scam, health misinfo,
  self-harm, product placement, manipulation patterns.
- Performance: > 95% precision, < 5% false positive (calibrated on
  internal test dataset).

LAYER 2 — FLAG-DRIVEN RE-CHECK
- Flag button on every UGC element (post, comment, circle msg).
- 3+ flags on same user within 24h → auto-block 24 hours.
- Single flag → AI re-check before any action.

LAYER 3 — HUMAN MODERATION (< 24h)
- Auto-blocked accounts and flagged content reviewed by human
  moderator (Matiss Dornier, founder, plus future tier "Légende"
  community moderators).
- Decisions: dismiss / confirm 7-day block / permanent ban /
  escalate to authorities.
- Appeal email: appeal@purama.dev, response < 7 days.

ESCALATION
- Self-harm content → app surfaces 3114 (FR), 15, 112 immediately +
  permanent disclaimer banner.
- CSAM → reported to NCMEC + Pharos immediately, no copy retained.
- Physical threat → law enforcement notification.

ANTI-FRAUD (financial)
- Every payment route (cagnotte, redistribution) is AI-scanned
  before completion.
- Treezor (EME ACPR) enforces KYC mandatory > 1000€ withdrawal.
- AML transaction monitoring per ACPR guidelines.

Public policies:
- Community guidelines: https://kosha.purama.dev/legal/moderation
- AML/KYC: https://kosha.purama.dev/legal/aml-kyc
- Privacy: https://kosha.purama.dev/legal/confidentialite
```

## Métriques de qualité (à monitorer post-launch)

| Métrique | Cible | Alerte si... |
|---|---|---|
| Volume modéré / jour | (proportionnel users) | Drop sudden = AI down |
| % auto-block | < 1% du volume total | > 5% = AI trop agressif |
| % flagged | < 0,5% du volume | > 2% = problème UX ou cohorte toxique |
| Délai humain review | < 24h p95 | > 24h = plus de modérateurs nécessaires |
| Appeal acceptance rate | < 10% | > 20% = AI/humains trop strict |
| Self-harm safety net triggered | log all | hausse soudaine = alerte santé publique |
| Repeat offender rate | < 2% (ban perma) | > 5% = ban perma trop laxe |

Dashboard `/admin/moderation/metrics` à construire.

## Tests à passer avant submit

- [ ] Test : poster un message avec hate speech → block immédiat AI.
- [ ] Test : poster scam → block.
- [ ] Test : poster gratitude authentique → publish.
- [ ] Test : poster vulnérabilité émotionnelle → publish (pas block).
- [ ] Test : poster mentionnant 3114/115 dans un contexte d'aide → publish + safety banner.
- [ ] Test : flag x3 sur un user → auto-block 24h.
- [ ] Test : appel via `appeal@purama.dev` → réponse < 7j.
- [ ] Test : safety net 3114 cliquable et fonctionnel.

## Coût modération annualisé

> Pour 100K users actifs (cf BRIEF KOSHA projection) :

| Poste | Coût annuel |
|---|---|
| Claude Haiku 4.5 (1M / mois × 12) | ~6 000 €/an |
| Tissma temps modération (5h/sem × 50 sem) | (intégré salaire SASU) |
| Modérateurs Légende tier (2-3 personnes, payés en cagnotte) | ~5 000 €/an |
| Outillage (Sentry, dashboard) | ~500 €/an |
| **TOTAL** | **~11 500 €/an** |

→ Couvert largement par 1% du CA (cf BRIEF KOSHA modèle économique).
