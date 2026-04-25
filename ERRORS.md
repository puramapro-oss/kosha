# KOSHA — ERRORS LOG

Format : `| DATE | BUG | CAUSE | FIX |`

| DATE | BUG | CAUSE | FIX |
|------|-----|-------|-----|
| 2026-04-25 | `Could not find a declaration file for module 'javascript-opentimestamps'` | Lib npm publiée sans .d.ts officiel | Créer `src/types/javascript-opentimestamps.d.ts` avec module declare minimal (Ops.OpSHA256, Context.StreamSerialization, DetachedTimestampFile, stamp/upgrade/verify) |
| 2026-04-25 | `profiles!cagnottes_owner_id_fkey` join PostgREST ne trouve pas la relation | cagnottes.owner_id → auth.users.id (pas profiles.id direct) | Ne PAS utiliser de join PostgREST pour relations indirectes — fetch séparé avec Map<userId, profile> |
| 2026-04-25 | `compute_cagnotte_split` import en TS échoue car constants utilise `contributeurs` (FR) pas `contributors` (EN) | Mismatch nommage FR/EN entre constants.ts et code TS | Aligner sur les noms FR du constants (autoritaire) — `CAGNOTTE_SPLIT.contributeurs` |
| 2026-04-25 | Stripe API 401 "Invalid API Key" lors création webhook | STRIPE_SECRET_KEY de `~/purama/.env.secrets` (`...Ni7m`) est REVOKED chez Stripe | Utiliser celle de `~/purama/CLAUDE-2.md` (`...gyY1`) qui est la valide. Resync Vercel env via `vercel env rm` + `vercel env add` |
| 2026-04-25 | fil_de_vie CHECK constraint refuse de nouveaux action_types après ALTER | Le CHECK est par défaut DROP+CREATE — toute extension de l'union TS doit être suivie d'un ALTER coté SQL | Toujours faire UNION du type TS et du SQL CHECK ensemble + ajouter chaque nouveau type dans `ACTION_VISUALS` map (Record exhaustif) |
