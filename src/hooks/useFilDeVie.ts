'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { FilDeVieEntry } from '@/lib/fil-de-vie'

interface UseFilDeVieResult {
  entries: FilDeVieEntry[]
  isLoading: boolean
  error: string | null
}

/**
 * Subscribe au Fil de Vie d'un user en temps réel.
 * Realtime via Supabase channel sur kosha.fil_de_vie filtré user_id.
 *
 * Quand une nouvelle action est loggée → push immédiat dans la liste.
 */
export function useFilDeVie(userId: string | null, limit = 20): UseFilDeVieResult {
  const [entries, setEntries] = useState<FilDeVieEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setEntries([])
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    let isMounted = true

    // Initial fetch
    void (async () => {
      setIsLoading(true)
      const { data, error: fetchError } = await supabase
        .from('fil_de_vie')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!isMounted) return
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setEntries((data ?? []) as FilDeVieEntry[])
      }
      setIsLoading(false)
    })()

    // Realtime subscription — KOSHA active sur ce schema (cf p2_vida_core.sql ALTER PUBLICATION)
    const channel = supabase
      .channel(`fil_de_vie:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'kosha',
          table: 'fil_de_vie',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!isMounted) return
          const newEntry = payload.new as FilDeVieEntry
          setEntries((prev) => {
            // Anti-dup (au cas où INSERT arrive aussi via fetch initial)
            if (prev.find((e) => e.id === newEntry.id)) return prev
            return [newEntry, ...prev].slice(0, limit)
          })
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      void supabase.removeChannel(channel)
    }
  }, [userId, limit])

  return { entries, isLoading, error }
}
