import { searchUsers } from '@/lib/admin'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminUsers({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = sp.q ?? ''
  const users = await searchUsers(q, 100)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold text-white">Utilisateurs ({users.length})</h1>

      <form action="/admin/users" method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Recherche email ou nom..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-semibold"
        >
          Rechercher
        </button>
      </form>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03]">
            <tr className="text-left text-white/55 text-xs uppercase tracking-widest">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Actions</th>
              <th className="px-4 py-3">Inscrit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-white/55">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/85 font-mono text-xs truncate max-w-[200px]">{u.email ?? '—'}</td>
                  <td className="px-4 py-3 text-white/75">{u.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-white/70">{u.plan ?? 'free'}</td>
                  <td className="px-4 py-3">
                    {u.role === 'super_admin' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[11px]">super</span>
                    ) : (
                      <span className="text-white/55 text-xs">{u.role ?? 'user'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/75">
                    {Number(u.score_humanite ?? 0).toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/75">{u.fil_de_vie_count ?? 0}</td>
                  <td className="px-4 py-3 text-white/45 text-xs">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
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
