import { listDynamicConfig } from '@/lib/admin'
import AdminConfigClient from '@/components/AdminConfigClient'

export const dynamic = 'force-dynamic'

export default async function AdminConfig() {
  const items = await listDynamicConfig()
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-display font-bold text-white">Configuration dynamique</h1>
        <p className="text-white/55 text-sm mt-2">
          Modifie prix, textes et features sans redeploy. Chaque changement est loggé dans <code>admin_logs</code>.
        </p>
      </header>
      <AdminConfigClient initialItems={items} />
    </div>
  )
}
