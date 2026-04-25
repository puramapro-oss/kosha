import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import OubliMoiButton from '@/components/AriaOubliMoiButton'

export const dynamic = 'force-dynamic'

export default async function AriaOubliMoiPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/aria/oubli-moi')

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.08), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-xl mx-auto space-y-6">
        <Link href="/aria" className="text-white/45 hover:text-white text-sm">← Aria</Link>

        <div className="glass rounded-2xl p-7 space-y-5">
          <h1 className="text-2xl font-display font-bold text-white">Effacer ma mémoire Aria</h1>

          <div className="text-white/65 text-sm leading-relaxed space-y-3">
            <p>
              Aria mémorise tes préférences (ton, longueur de réponse), tes thèmes récurrents et quelques faits factuels que tu as partagés.
              Cette mémoire améliore la pertinence de ses réponses au fil du temps.
            </p>
            <p>
              <strong className="text-white/85">Cette action est définitive</strong> : Aria oubliera tout, et toutes tes conversations seront archivées.
              Tu repartiras de zéro lors de ta prochaine question.
            </p>
            <p className="text-white/45 text-xs">
              Ce que nous gardons (audit légal, anonymisé) : compteurs d&apos;usage agrégés et logs d&apos;actions. Aucun contenu personnel.
            </p>
          </div>

          <OubliMoiButton />
        </div>
      </div>
    </main>
  )
}
