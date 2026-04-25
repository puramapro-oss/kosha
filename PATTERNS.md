# KOSHA — PATTERNS (réutilisables)

## i18n (porté de YANA)
- next-intl + 16 locales
- Default = `fr`
- Cookie `locale` > Accept-Language header > defaultLocale
- RTL : `['ar']`
- Messages : `messages/{locale}.json`
- Config : `src/i18n/request.ts` + `src/i18n/config.ts`

## Auth (porté de YANA)
- @supabase/ssr + Google OAuth via auth.purama.dev
- Middleware : `src/middleware.ts` avec `PUBLIC_PATHS` whitelist
- Wildcard OAuth allow list : `https://*.purama.dev/**`

## VPS Supabase
- IP : 72.62.191.111
- SSH : `sshpass -p '+Awy3cwg;NoutOTH' ssh root@72.62.191.111`
- Postgres via docker : `docker exec -i supabase-db psql -U postgres -d postgres`
- Auth via docker : `supabase-auth` container, env vars `GOTRUE_*`

## Vercel CLI (V7.2 §17 + §37)
- `vercel --token $VERCEL_TOKEN --scope puramapro-oss --yes`
- `vercel domains add SLUG.purama.dev --token $VERCEL_TOKEN --scope puramapro-oss`
- env vars : `vercel env add NAME production --token $VERCEL_TOKEN --scope puramapro-oss`
- JAMAIS dashboard manuel (V7.2 §37 INTERDIT)

## GitHub via gh CLI
- Org : puramapro-oss
- `gh repo create puramapro-oss/REPO --public --source=. --remote=origin --push`
- Auth : `gh auth status` (déjà loggé via gh-credential-helper)
