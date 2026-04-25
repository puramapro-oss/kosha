import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, BarChart3, Users, Sliders, FileText, ArrowLeft } from 'lucide-react'
import { isSuperAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const NAV = [
  { href: '/admin', label: 'Vue d\'ensemble', icon: BarChart3 },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/config', label: 'Configuration', icon: Sliders },
  { href: '/admin/logs', label: 'Audit logs', icon: FileText },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await isSuperAdmin()
  if (!ctx) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white/85">
            <ArrowLeft className="w-4 h-4" />
            Tableau de bord
          </Link>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-100 text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          Espace Pilote — {ctx.email}
        </div>
      </div>

      <nav className="flex flex-wrap gap-2">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white/85 hover:bg-white/[0.08]"
          >
            <n.icon className="w-4 h-4" />
            {n.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
