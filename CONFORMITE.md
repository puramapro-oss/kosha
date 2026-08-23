# CONFORMITÉ NIYAMA — KOSHA

**Date audit** : 2026-08-23
**Auditeur** : agent audit/conformité (lecture seule, code applicatif uniquement)
**Référence** : `~/purama/NIYAMA-BRIEF.md` (checklist §7)
**Périmètre** : `/Users/matissdornier/purama/kosha` (repo réel, code lu fichier par fichier)

## VERDICT : ORANGE — 2 gaps (1 majeur chiffre FACTS.md, 1 mineur re-acceptance CGU non câblée)

Le socle légal NIYAMA est réellement implémenté (pas de décor) : pages légales, bandeau cookies fonctionnel, preuve d'acceptation horodatée en base, export RGPD réel, suppression de compte réelle avec cron, disclosure IA rendue dans le chat. Deux écarts empêchent le VERT : un chiffre de répartition CA codé en dur qui correspond exactement à un split déclaré OBSOLÈTE par `FACTS.md`, et un composant de "ré-acceptation CGU après bump de version" qui existe dans le package partagé mais n'est jamais monté dans l'app.

---

## 1. Pages légales

| Page | Fichier | Statut |
|---|---|---|
| `/mentions-legales` | `src/app/mentions-legales/page.tsx` | ✅ présente, contenu réel via `buildMentionsLegales()` + `KOSHA_LEGAL_CONFIG` |
| `/cgu` | `src/app/cgu/page.tsx` | ✅ présente, clauses génériques + clauses spécifiques KOSHA (Fil de Vie, Score d'Humanité, Points, modération Aria) — `src/lib/legal-config.ts:22-43` |
| `/politique-confidentialite` | `src/app/politique-confidentialite/page.tsx` | ✅ présente |
| `/cgv` | `src/app/cgv/page.tsx` | ✅ **requise et présente** — paiement Stripe réel confirmé (`src/app/api/cagnottes/[id]/contribute/route.ts:52` : `stripe.checkout.sessions.create` mode `payment`, carte réelle). Clauses spécifiques CGV cagnotte (répartition 70/15/5/10, absence de remboursement) — `src/lib/legal-config.ts:44-59` |

Les 4 pages font 22 lignes chacune et délèguent au composant `LegalPage` + builder du socle partagé `packages/legal/src/content/*.ts` — contenu réel, pas de Lorem, pas de placeholder.

**Preuve** : `src/lib/legal-config.ts:11-21` déclare `famille: 'karma_wellness'` (correspond à Famille 1 NIYAMA "apps qui paient les utilisateurs"), `aPaiement: true`, `aChatIA: true` — cohérent avec le code réel (Stripe checkout cagnottes + chat Aria).

## 2. Bandeau consentement cookies

**Fichier** : `packages/legal/src/components/CookieConsentBanner.tsx`, monté via `src/components/CookieConsentBannerClient.tsx`.

- 3 actions réelles : `data-testid="cookie-accept"` (Tout accepter), `cookie-refuse` (Tout refuser), `cookie-customize` → `cookie-save-choices` (Personnaliser + Enregistrer) — lignes 60-96.
- "Nécessaire" toujours actif et non décochable (checkbox `disabled` ligne 46) — cohérent (session/auth).
- `mesure` et `marketing` par défaut `false`, rien n'est déposé avant choix explicite (`useState(false)` lignes 21-22).
- Persistance : visiteur anonyme → localStorage only (`useCookieConsent`) ; utilisateur connecté → sync serveur via `POST /api/legal/cookie-consent` (`src/app/api/legal/cookie-consent/route.ts`), upsert `onConflict: 'user_id'` dans `cookie_consents`.
- Table SQL réelle avec RLS `auth.uid() = user_id` sur SELECT/INSERT/UPDATE — `packages/legal/sql/001_legal_core.sql:56-79`.

✅ Fonctionnel, pas un décor.

## 3. Preuve d'acceptation CGU horodatée

**Fichier** : `src/app/api/legal/accept/route.ts`.

- Écrit réellement dans `legal_acceptances` (upsert `onConflict: 'user_id,doc_type'`) — ligne 33-43.
- Version acceptée **toujours calculée côté serveur** (`CURRENT_LEGAL_VERSIONS[docType]`), jamais transmise par le client — commentaire ligne 7-9, empêche la falsification.
- IP + user-agent capturés (ligne 39-40).
- Déclenché à l'inscription email : `src/app/(auth)/signup/page.tsx:61-70` (fire-and-forget après `data.session`).
- Déclenché à l'inscription/connexion OAuth : `src/app/auth/callback/route.ts` (upsert idempotent des 3 `ACCEPTABLE_DOC_TYPES`).
- Table SQL avec `UNIQUE (user_id, doc_type)` + policies RLS `select/insert/update own` — `packages/legal/sql/001_legal_core.sql:21-52`.
- Visible par l'utilisateur sur `/settings/ma-memoire` (liste des acceptations avec version + date, `src/app/(dashboard)/settings/ma-memoire/page.tsx:16-30`).

✅ Réel, pas un stub `{success:true}`.

**GAP mineur (ORANGE)** — `LegalReacceptanceGate` (`packages/legal/src/components/LegalReacceptanceGate.tsx`) : composant conçu pour bloquer l'usage de l'app quand une nouvelle version de CGU/CGV/confidentialité doit être re-acceptée (docstring ligne 20-25). Recherche exhaustive (`grep -rl "LegalReacceptanceGate" src/app src/components`) : **aucune app kosha ne l'importe** — seul le fichier source du package le référence. Aujourd'hui sans conséquence (toutes les versions sont `1.0`, `src/lib/legal/versions.ts`), mais le jour où une clause CGU change de version, les utilisateurs existants ne seront jamais invités à ré-accepter : la preuve horodatée resterait bloquée sur l'ancienne version sans que l'app ne le détecte ni ne le bloque. À câbler dans le layout `(dashboard)` avant tout futur bump de `CURRENT_LEGAL_VERSIONS`.

## 4. Page « Ma mémoire »

**Fichier** : `src/app/(dashboard)/settings/ma-memoire/page.tsx` + `packages/legal/src/components/MaMemoirePage.tsx`.

- **Export RGPD réel** : bouton → `GET /api/legal/my-data` (`src/app/api/legal/my-data/route.ts`) — agrège profil, `legal_acceptances`, `cookie_consents` + tables additionnelles (`EXTRA_TABLES`), retourne un fichier `mes-donnees.json` téléchargeable (`Content-Disposition: attachment`). Pas un stub.
- **Suppression de compte réelle** : `AccountDeletionButton` (`packages/legal/src/components/AccountDeletionButton.tsx`) → confirmation par saisie littérale `DELETE_MY_ACCOUNT` → `POST /api/account/delete` (`src/app/api/account/delete/route.ts`) programme la suppression dans 30 jours (période de grâce, annulable via `DELETE`). Exécution effective par le cron quotidien `src/app/api/cron/account-deletion/route.ts` : `status: 'executing'` → `auth.admin.deleteUser(user_id)` — commentaire ligne 5 : "ne JAMAIS renvoyer `{success:true}`" sans confirmation réelle.
- Table `account_deletion_requests` avec RLS + index `(status, scheduled_for)` pour le sweep cron — `packages/legal/sql/001_legal_core.sql:85-114`.

✅ Réel de bout en bout (demande → grâce 30j → exécution → purge auth.users).

## 5. Déclaration IA sur chaque UI de chat IA réelle

**Recherche exhaustive** (`grep -rln "assistant\|chatbot\|Claude\|IA " src/app/(dashboard)`, hors `aria/`) : **une seule interface de chat IA réelle dans KOSHA : Aria** (`src/components/AriaChatClient.tsx`, montée par les 3 routes `aria/page.tsx`, `aria/[id]/page.tsx`, `aria/oubli-moi/page.tsx`).

- `AIDisclosure` **réellement rendu** dans le header du chat, visible sur chaque conversation : `src/components/AriaChatClient.tsx:235` — `<AIDisclosure appName={APP_NAME} className="text-center text-[11px] text-white/35 py-2 px-4 border-b border-white/[0.04]" />`, juste sous le header, avant la zone de messages.
- Texte : "Vous échangez avec l'assistant IA de {appName}, pas avec un humain." (`packages/legal/src/components/AIDisclosure.tsx:16`) — conforme IA Act transparence.
- Autre usage IA dans le code (`fraud-check`, modération posts) : pas des interfaces de "chat" au sens conversationnel avec l'utilisateur, donc hors périmètre de cette obligation — mais notez que la modération automatisée par Aria est explicitement disclosée dans les CGU (`src/lib/legal-config.ts:38-42`, clause "Modération des publications").

✅ 1/1 interface de chat IA porte la disclosure, réellement affichée (pas juste importée).

## 6. Lexique interdit

Recherche mécanique sur tout le texte applicatif (`src/app`, `src/components`, `src/lib`, `messages/*.json`) pour les patterns à risque : `garanti(e)?`, `sans risque`, `100% sûr`, `rendement garanti`, `placement garanti`, `soigne`, `guérit`, `diagnostic médical`, `avis/notes/installs rémunérés`.

**0 occurrence problématique.** Les seules occurrences de "garanti(t)" trouvées sont des clauses juridiques standards sans lien avec une promesse de gain :
- `src/lib/legal-config.ts:50` — "garantissant l'intégrité et la date de l'engagement" (horodatage OpenTimestamps, factuel).
- `src/lib/legal/content/mentions-legales.ts:67` — "ne peut garantir l'absence totale d'erreurs" (limitation de responsabilité, sens négatif).
- `src/lib/legal/content/cgu.ts:26` — "chaque utilisateur garantit l'exactitude des informations" (obligation de l'utilisateur, pas une promesse de l'app).
- `src/lib/legal/content/cgu.ts:61` — "ne peut garantir une disponibilité absolue" (limitation de responsabilité SLA, sens négatif).

**Piège BRIEF non implémenté (positif)** : `BRIEF.md` §"8 sources de gains" liste en position 5 "S'abonner aux comptes Instagram/TikTok/YouTube PURAMA + avis App Store/Play Store" comme source de récompense — c'est exactement le pattern interdit par la Famille 1 NIYAMA ("JAMAIS d'avis/notes/installs rémunérés"). Recherche exhaustive dans le code (missions, API, seed SQL `db/p6_missions.sql`) : **aucune trace** — les catégories de missions réellement codées sont `ecology, social, health, knowledge, creativity` (`db/p6_missions.sql`), aucune mission "avis store" ou "abonnement réseau social". Cette fonctionnalité du BRIEF a été correctement exclue du V1-CORE livré, évitant une violation réelle.

## 7. Chiffres affichés vs `FACTS.md`

| Chiffre kosha | Fichier:ligne | FACTS.md | Statut |
|---|---|---|---|
| Parrainage : filleul -50% 1er mois, parrain 50% du 1er paiement + 10% récurrent | `src/lib/constants.ts:158-163` (`REFERRAL`) | "50% du premier paiement + carte à vie" (§9.2) | ✅ cohérent |
| WALLET / cagnotte contribution min 1€ | `src/lib/legal-config.ts:48` | — (pas de chiffre verrouillé équivalent) | — pas de conflit |
| Split cagnotte 70% projet / 15% contributeurs / 5% sécurité / 10% fonds VIDA (dont asso) | `src/lib/constants.ts:147-152` (`CAGNOTTE_SPLIT`), utilisé réellement dans `src/lib/treezor.ts` | Cohérent avec BRIEF.md propre à KOSHA ("Répartition automatique de chaque cagnotte... Fonds commun VIDA: 10% (dont 5% Asso PURAMA)") ; FACTS.md ne verrouille pas de chiffre spécifique "cagnotte" (différent du split KARMA global) | ✅ pas de conflit avec FACTS.md, auto-cohérent avec BRIEF |
| **Split CA mensuel : 50% users / 10% asso / 10% ADYA / 30% SASU** | **`src/lib/constants.ts:132-141` (`CA_SPLIT`)** | **"Split KARMA : 50% users / 10% asso / 40% SASU — anciens 50/10/10/30 et 50/20/30 OBSOLÈTES" (CLAUDE.md §9.1 / FACTS.md ligne 7)** | **❌ GAP MAJEUR** |

**Détail du gap** : `CA_SPLIT` (`src/lib/constants.ts:136-141`) code en dur `{ users: 0.50, asso: 0.10, adya: 0.10, sasu: 0.30 }` — c'est **exactement** le split `50/10/10/30` que `FACTS.md` et `CLAUDE.md §9.1` déclarent explicitement **OBSOLÈTE** au profit de `50/10/40`. Recherche d'usage (`grep -rln "CA_SPLIT" src`) : la constante n'est référencée nulle part hors de sa propre déclaration — elle n'est **pas câblée à un flux de paiement réel** (cohérent avec le commentaire ligne 132 "Phase 2 post-SASU" et le stub Treezor Phase 1, `src/lib/treezor.ts:3` "Aucune transaction réelle"). Aucun impact financier actif aujourd'hui, mais c'est un nombre business verrouillé codé en dur qui ne matche pas `FACTS.md` — par la règle même de `FACTS.md` ("Écart = CONFORMITE.md rouge, Pilier 19"), ceci doit être corrigé avant l'activation de la Phase 2 (sinon la redistribution réelle appliquera un split obsolète et non conforme à la dernière décision Tissma).

## 8. Migration SQL légale

**Documenté dans `ERRORS.md`** (`ERRORS.md:17-18`, entrée `2026-08-23`) :
> "Socle légal NIYAMA : `ssh root@72.62.191.111` (password + clé) → `Connection refused` port 22 | fail2ban/ban transitoire (PIEGES.md §4)... Migration `001_legal_core.sql` exécutée via l'API pg-meta (`POST https://auth.purama.dev/pg/query`)... 3 tables (`legal_acceptances`, `cookie_consents`, `account_deletion_requests`) + grants explicites créées et vérifiées sans SSH."

Blocage documenté + résolution documentée le jour même, conformément à la règle "bug résolu → ligne ajoutée le jour même". Une seconde entrée (`ERRORS.md:18`) documente l'absence de `src/types/database.ts` dans ce projet (client Supabase non typé, donc rien à régénérer). Le schéma SQL source (`packages/legal/sql/001_legal_core.sql`) est cohérent avec les colonnes utilisées par le code applicatif (`doc_type`, `version`, `accepted_at`, `ip`, `user_agent`, contrainte `UNIQUE(user_id, doc_type)` correspondant exactement à l'`onConflict` de l'upsert).

Vérification live en base non effectuée par cet audit (lecture seule côté code applicatif, hors périmètre SSH/DB) — statut retenu : **documenté et vraisemblable**, à confirmer par un accès DB direct si une certification finale l'exige.

## 9. Cohérence promesse marketing ↔ réalité Stripe (piège type jyoti)

- **Aucune page pricing/abonnement live** trouvée dans l'app (`find src/app -iname "*pricing*" -o -iname "*abonnement*"` : rien). `PLANS` (`src/lib/constants.ts:49-127`) et `createKoshaStripeProducts()` (`src/lib/stripe.ts`) existent mais ne sont **utilisés par aucune route API de checkout d'abonnement live** (recherche `grep -rln "getStripe\|PLANS\." src/app` : seulement `internal/stripe-fulfillment`, `cagnottes/[id]/contribute`, `stripe/webhook` — tous liés aux **cagnottes**, pas à un abonnement). `createKoshaStripeProducts` n'est appelée qu'au "premier setup admin" (commentaire `src/lib/stripe.ts`), pas exposée à l'utilisateur final.
- **Chaînes "essai gratuit 14j / sans engagement"** trouvées dans `messages/fr.json:474-475` et `messages/en.json:126` (`trialCta`, `trialNote`, `pricingTrial`) — recherche d'usage (`grep -rn "trialCta\|trialNote\|pricingTrial" src`) : **0 résultat**. Ces clés i18n sont mortes : aucun composant kosha n'utilise `next-intl` (`grep -rln "useTranslations\|getTranslations" src` : 0 résultat) — les fichiers `messages/*.json` sont un reliquat de template non branché. **Aucune promesse "essai gratuit sans carte" n'est donc réellement affichée à l'utilisateur aujourd'hui** : pas de piège live du type jyoti sur kosha.
- **Le seul paiement réel et actif** est la contribution à une cagnotte (`src/app/api/cagnottes/[id]/contribute/route.ts:52` — `mode: 'payment'`, `payment_method_types: ['card']`, `unit_amount: body.amount_cents`, débit immédiat). La promesse correspondante dans les CGV (`src/lib/legal-config.ts:48`, "paiement en ligne sécurisé via Stripe, immédiatement débité") **correspond exactement** au comportement réel du code : carte exigée, débit immédiat, pas de "sans carte" trompeur.

✅ Pas de contradiction marketing/Stripe détectée sur le flux réellement actif. Point de vigilance signalé (chaînes i18n mortes) pour éviter qu'une future page pricing ne les réactive sans vérifier leur exactitude vs le vrai flux de checkout d'alors.

---

## Récapitulatif checklist NIYAMA §7

| Item | Statut |
|---|---|
| Famille déclarée = code réel | ✅ `famille: 'karma_wellness'` (`src/lib/legal-config.ts:15`), cohérent avec wallet/points/parrainage réels |
| Socle complet, liens légaux testés, consent fonctionnel | ✅ 4 pages légales réelles, cookie banner fonctionnel |
| Lexique interdit : 0 occurrence | ✅ 0 occurrence problématique |
| Pièges spécifiques de l'app vérifiés | ✅ piège "avis rémunérés" du BRIEF non implémenté en code (bon signe) |
| Fiches stores privacy générées | ⚠️ non vérifié dans ce périmètre (hors code applicatif web audité — App Privacy/Data Safety relèvent du build mobile Expo, non trouvé dans ce repo) |
| Preuves d'acceptation CGU actives | ✅ signup + OAuth callback, upsert réel en base |
| Registres/exports à jour | ✅ export RGPD réel (`/api/legal/my-data`) |

## Gaps à corriger

1. **[MAJEUR]** `src/lib/constants.ts:132-141` — `CA_SPLIT` = `50/10/10/30` (obsolète selon FACTS.md/CLAUDE.md §9.1) → aligner sur `50/10/40` (ou supprimer `adya: 0.10` et redistribuer) avant toute activation Phase 2/Treezor réel.
2. **[MINEUR]** `LegalReacceptanceGate` (package `@purama/legal`) jamais monté dans kosha → aucun blocage utilisateur en cas de bump futur de `CURRENT_LEGAL_VERSIONS`. À câbler dans `src/app/(dashboard)/layout.tsx` avant le premier changement de version CGU/CGV.

---

VERDICT:kosha:ORANGE:2
