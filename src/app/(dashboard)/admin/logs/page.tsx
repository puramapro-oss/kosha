import { listAdminLogs } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLogs() {
  const logs = await listAdminLogs(200)
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-display font-bold text-white">Audit logs</h1>
        <p className="text-white/55 text-sm mt-2">
          Toute action admin est tracée ici (table immuable <code>admin_logs</code>).
        </p>
      </header>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03]">
            <tr className="text-left text-white/55 text-xs uppercase tracking-widest">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Cible</th>
              <th className="px-4 py-3">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/55">
                  Aucun événement admin.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-white/[0.02] align-top">
                  <td className="px-4 py-3 text-white/65 text-xs whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-white/75 font-mono text-xs">{l.admin_email}</td>
                  <td className="px-4 py-3 text-white/85 font-medium">{l.action_type}</td>
                  <td className="px-4 py-3 text-white/65 text-xs">
                    {l.target_type ? `${l.target_type}/${l.target_id}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-white/55 text-xs font-mono break-all max-w-md">
                    {l.payload ? JSON.stringify(l.payload) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
