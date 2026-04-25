/**
 * Page publique de confirmation de désabonnement (lien depuis email).
 * Pas d'auth — accessible avec le token uniquement.
 * On affiche un état clair + bouton de réabonnement 1 clic.
 */
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import UnsubscribeReactivateForm from '@/components/UnsubscribeReactivateForm'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ ok?: string }>
}

export default async function UnsubscribePage({ params, searchParams }: PageProps) {
  const { token } = await params
  const sp = await searchParams
  const okFromQuery = sp.ok === '1'

  const service = createServiceClient()
  const { data: sub } = await service
    .from('newsletter_subscribers')
    .select('subscribed, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  const tokenValid = Boolean(sub)
  const currentlySubscribed = sub?.subscribed === true

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full glass rounded-3xl p-8 md:p-10 text-center space-y-5">
        {!tokenValid ? (
          <>
            <h1 className="text-2xl font-display font-bold gradient-text-kosha">Lien invalide</h1>
            <p className="text-white/70 leading-relaxed">
              Ce lien de désabonnement n&apos;est pas valide ou a expiré. Tu peux gérer tes préférences depuis ton tableau de bord.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-block px-5 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] text-white text-sm hover:bg-white/[0.08]"
              >
                Ouvrir KOSHA
              </Link>
            </div>
          </>
        ) : currentlySubscribed ? (
          <>
            <h1 className="text-2xl font-display font-bold gradient-text-kosha">Toujours abonné·e</h1>
            <p className="text-white/70 leading-relaxed">
              Tu reçois la newsletter hebdomadaire. Si tu souhaites te désabonner, clique ci-dessous.
            </p>
            <UnsubscribeReactivateForm token={token} initialSubscribed={true} />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-display font-bold gradient-text-kosha">Désabonné·e</h1>
            {okFromQuery ? (
              <p className="text-white/70 leading-relaxed">
                C&apos;est fait. Tu ne recevras plus aucune newsletter de KOSHA. Aucune confirmation à valider.
              </p>
            ) : (
              <p className="text-white/70 leading-relaxed">
                Tu n&apos;es pas abonné·e à la newsletter. Tu peux te ré-abonner en 1 clic ci-dessous.
              </p>
            )}
            <UnsubscribeReactivateForm token={token} initialSubscribed={false} />
          </>
        )}

        <p className="text-xs text-white/35 pt-4 border-t border-white/5">
          Tu peux aussi gérer tes préférences dans{' '}
          <Link href="/settings/newsletter" className="underline underline-offset-2 hover:text-white/65">
            ton compte
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
