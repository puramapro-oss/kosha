'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function NouveauCerclePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [intention, setIntention] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [maxMembers, setMaxMembers] = useState(12)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/cercles/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            intention: intention.trim(),
            visibility,
            max_members: maxMembers,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Création impossible.')
          return
        }
        router.push(`/cercles/${data.id}?created=1`)
      } catch {
        setError('Pas de connexion.')
      }
    })
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.10), transparent 60%), #0A0A0F',
        }}
      />

      <div className="max-w-xl mx-auto space-y-6">
        <Link href="/cercles" className="inline-block text-white/45 hover:text-white/85 text-sm transition-colors">
          ← Cercles
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-2xl p-6 space-y-5"
        >
          <header>
            <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Nouveau cercle</p>
            <h1 className="text-2xl font-display font-bold text-white">Ouvre un espace.</h1>
            <p className="text-white/55 text-sm mt-1.5 leading-relaxed">
              Un cercle = jusqu&apos;à 12 voyageurs autour d&apos;une intention claire. Tu en seras le capitaine.
            </p>
          </header>

          <div>
            <label className="block text-xs font-mono text-white/55 mb-1.5">Nom du cercle ({name.length}/60)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Ex : Méditation matin France"
              maxLength={60}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:bg-white/8 focus:border-violet-400/50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-white/55 mb-1.5">Intention ({intention.length}/500)</label>
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value.slice(0, 500))}
              placeholder="Pour quoi est-ce qu'on se rassemble ? Quelle est la promesse partagée ?"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:bg-white/8 focus:border-violet-400/50 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-white/55 mb-1.5">Visibilité</label>
              <div className="flex gap-1.5">
                {(['public', 'private'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={`flex-1 py-2.5 rounded-lg text-xs transition-colors border ${
                      visibility === v
                        ? 'bg-violet-500/15 border-violet-400/40 text-white'
                        : 'bg-white/3 border-white/8 text-white/55 hover:bg-white/8'
                    }`}
                  >
                    {v === 'public' ? 'Public' : 'Privé'}
                  </button>
                ))}
              </div>
              {visibility === 'private' && (
                <p className="text-[10px] text-white/40 mt-1.5">
                  Visible uniquement par toi et tes invités (à venir P5).
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-white/55 mb-1.5">Max membres</label>
              <select
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:bg-white/8 focus:border-violet-400/50 focus:outline-none"
              >
                <option value={6}>6 (intime)</option>
                <option value={12}>12 (équilibre)</option>
                <option value={24}>24 (large)</option>
              </select>
            </div>
          </div>

          {error && (
            <div role="alert" className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={submit}
              disabled={isPending || name.trim().length < 3 || intention.trim().length < 10}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-violet-500 hover:to-cyan-400 text-sm shadow-lg shadow-violet-500/20"
            >
              {isPending ? 'Création…' : '✶ Ouvrir le cercle'}
            </button>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
