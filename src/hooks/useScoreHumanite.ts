'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { ScoreComponents } from '@/lib/score'
import { SCORE_HUMANITE_INITIAL } from '@/lib/constants'

interface UseScoreResult {
  score: number
  components: ScoreComponents
  isLoading: boolean
  date: string | null
}

const DEFAULT_COMPONENTS: ScoreComponents = {
  fiabilite: 5,
  entraide: 5,
  regularite: 5,
  impact: 5,
}

/**
 * Subscribe au dernier snapshot du Score d'Humanité d'un user.
 * Realtime sur kosha.score_humanite_history (UPSERT par trigger fil_de_vie).
 */
export function useScoreHumanite(userId: string | null): UseScoreResult {
  const [score, setScore] = useState<number>(SCORE_HUMANITE_INITIAL)
  const [components, setComponents] = useState<ScoreComponents>(DEFAULT_COMPONENTS)
  const [date, setDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setScore(SCORE_HUMANITE_INITIAL)
      setComponents(DEFAULT_COMPONENTS)
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    let isMounted = true

    void (async () => {
      setIsLoading(true)
      const { data } = await supabase
        .from('score_humanite_history')
        .select('score, components, date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!isMounted) return
      if (data) {
        setScore(Number(data.score))
        setComponents(data.components as ScoreComponents)
        setDate(data.date)
      }
      setIsLoading(false)
    })()

    const channel = supabase
      .channel(`score:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'kosha',
          table: 'score_humanite_history',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!isMounted) return
          const row = payload.new as { score: string | number; components: ScoreComponents; date: string }
          setScore(Number(row.score))
          setComponents(row.components)
          setDate(row.date)
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return { score, components, isLoading, date }
}
