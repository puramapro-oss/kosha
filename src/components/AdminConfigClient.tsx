'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save } from 'lucide-react'

interface ConfigItem {
  key: string
  value: unknown
  description: string | null
  updated_by: string | null
  updated_at: string
}

export default function AdminConfigClient({ initialItems }: { initialItems: ConfigItem[] }) {
  const [items, setItems] = useState<Array<ConfigItem & { dirty?: string }>>(
    initialItems.map((i) => ({ ...i }))
  )
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ key: string; kind: 'ok' | 'err'; msg: string } | null>(null)

  function startEdit(idx: number, raw: string) {
    setItems((arr) => {
      const copy = [...arr]
      copy[idx] = { ...copy[idx], dirty: raw }
      return copy
    })
  }

  function save(idx: number) {
    setFeedback(null)
    const item = items[idx]
    if (item.dirty === undefined) return
    let parsed: unknown
    try {
      parsed = JSON.parse(item.dirty)
    } catch {
      // Si pas un JSON valide, on traite comme string
      parsed = item.dirty
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: item.key, value: parsed, description: item.description }),
        })
        const data = await res.json()
        if (!res.ok) {
          setFeedback({ key: item.key, kind: 'err', msg: data.error ?? 'Erreur' })
          return
        }
        setItems((arr) => {
          const copy = [...arr]
          copy[idx] = {
            ...copy[idx],
            value: parsed,
            dirty: undefined,
            updated_at: new Date().toISOString(),
          }
          return copy
        })
        setFeedback({ key: item.key, kind: 'ok', msg: 'Sauvegardé.' })
      } catch {
        setFeedback({ key: item.key, kind: 'err', msg: 'Pas de connexion.' })
      }
    })
  }

  return (
    <div className="space-y-3">
      {items.map((it, idx) => {
        const display = it.dirty !== undefined ? it.dirty : JSON.stringify(it.value)
        const isDirty = it.dirty !== undefined && it.dirty !== JSON.stringify(it.value)
        return (
          <div key={it.key} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-mono text-white/85">{it.key}</p>
                {it.description && <p className="text-xs text-white/45 mt-1">{it.description}</p>}
              </div>
              <span className="text-[10px] text-white/35">
                {new Date(it.updated_at).toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={display}
                onChange={(e) => startEdit(idx, e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-black/25 border border-white/10 font-mono text-sm text-white focus:outline-none focus:border-white/40"
              />
              <button
                onClick={() => save(idx)}
                disabled={!isDirty || isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
            <AnimatePresence>
              {feedback && feedback.key === it.key && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs mt-2 ${feedback.kind === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}
                >
                  {feedback.msg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
