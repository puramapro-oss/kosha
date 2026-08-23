import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import { MaMemoirePage, type LegalAcceptanceRow } from '@/lib/legal'

export const dynamic = 'force-dynamic'

export default async function MaMemoire() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/settings/ma-memoire')

  const [{ data: acceptations }, { data: deletionRequest }] = await Promise.all([
    supabase.from('legal_acceptances').select('doc_type, version, accepted_at').eq('user_id', user.id),
    supabase
      .from('account_deletion_requests')
      .select('scheduled_for')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .maybeSingle(),
  ])

  const rows: LegalAcceptanceRow[] = (acceptations ?? []).map((a: { doc_type: string; version: string; accepted_at: string }) => ({
    docType: a.doc_type,
    version: a.version,
    acceptedAt: a.accepted_at,
  }))

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center justify-between">
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white/85">
          <ArrowLeft className="w-4 h-4" />
          Réglages
        </Link>
      </header>

      <MaMemoirePage
        appName="KOSHA"
        acceptations={rows}
        deletionScheduledFor={(deletionRequest as { scheduled_for: string } | null)?.scheduled_for ?? null}
      />
    </div>
  )
}
