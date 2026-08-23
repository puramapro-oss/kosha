import { createClient } from '@/lib/supabase-server'
import { computeDocsEnAttente, type LegalDocType } from '@/lib/legal'
import LegalReacceptanceGateClient from '@/components/LegalReacceptanceGateClient'

export const dynamic = 'force-dynamic'

/**
 * Layout partagé de tout le dashboard authentifié — monte `LegalReacceptanceGate` pour
 * bloquer l'usage de l'app dès qu'une version de CGU/CGV/confidentialité change
 * (CONFORMITE.md gap mineur, NIYAMA-BRIEF.md). Chaque page garde sa propre redirection
 * `/login` si non connecté ; ce layout ne fait qu'ajouter la vérification de version pour
 * les utilisateurs déjà authentifiés, sans dupliquer la logique d'auth de chaque page.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let docsEnAttente: LegalDocType[] = []

  if (user) {
    const { data: acceptations } = await supabase
      .from('legal_acceptances')
      .select('doc_type, version')
      .eq('user_id', user.id)

    const dernieresAcceptations = Object.fromEntries(
      (acceptations ?? []).map((a: { doc_type: string; version: string }) => [a.doc_type, a.version])
    ) as Partial<Record<LegalDocType, string>>

    docsEnAttente = computeDocsEnAttente(dernieresAcceptations)
  }

  return (
    <>
      {children}
      {user && <LegalReacceptanceGateClient docsEnAttente={docsEnAttente} />}
    </>
  )
}
