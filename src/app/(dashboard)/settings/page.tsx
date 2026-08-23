import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/settings')

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white/85">
          <ArrowLeft className="w-4 h-4" />
          Tableau de bord
        </Link>
      </header>

      <div>
        <h1 className="text-3xl font-display font-bold gradient-text-kosha">Réglages</h1>
        <p className="text-white/60 text-sm mt-2">Gère ta newsletter et tes données personnelles.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/settings/newsletter"
          className="group rounded-xl bg-white/[0.04] border border-white/10 p-4 hover:bg-white/[0.08] hover:border-white/20 transition-colors block"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-white flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-white">Newsletter</span>
            <span className="ml-auto text-white/40 group-hover:text-white/85 text-xs transition-colors">→</span>
          </div>
          <p className="text-xs text-white/55 leading-relaxed">1 email/semaine, 6 blocs, 1 action concrète</p>
        </Link>

        <Link
          href="/settings/ma-memoire"
          className="group rounded-xl bg-white/[0.04] border border-white/10 p-4 hover:bg-white/[0.08] hover:border-white/20 transition-colors block"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-white flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-white">Ma mémoire</span>
            <span className="ml-auto text-white/40 group-hover:text-white/85 text-xs transition-colors">→</span>
          </div>
          <p className="text-xs text-white/55 leading-relaxed">Voir, exporter et effacer tes données (RGPD)</p>
        </Link>
      </div>
    </div>
  )
}
