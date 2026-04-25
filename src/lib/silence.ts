/**
 * KOSHA — Mode Silence
 * BRIEF — anti-burnout : un user peut couper toutes les notifs sur des plages horaires.
 *
 * `isInSilenceWindow(silence, now)` : vrai si l'instant tombe dans la zone de silence.
 *   - Si paused_until > now → silence
 *   - Sinon, si jour-de-semaine ∈ days_of_week ET hour ∈ [start_hour, end_hour) → silence
 *   - Plage qui chevauche minuit gérée (start > end → on additionne 24h)
 */
import { z } from 'zod'

export interface SilenceConfig {
  user_id: string
  enabled: boolean
  start_hour: number | null
  end_hour: number | null
  days_of_week: number[]                 // 0=dim, 1=lun, ..., 6=sam
  paused_until: string | null
  updated_at?: string
}

export function isInSilenceWindow(s: SilenceConfig | null | undefined, now = new Date()): boolean {
  if (!s || !s.enabled) return false
  if (s.paused_until && new Date(s.paused_until).getTime() > now.getTime()) return true
  if (s.start_hour === null || s.end_hour === null) return false

  const dow = now.getDay()
  if (!s.days_of_week.includes(dow)) return false

  const h = now.getHours() + now.getMinutes() / 60
  const start = s.start_hour
  const end = s.end_hour

  if (start === end) return false
  if (start < end) {
    return h >= start && h < end
  }
  // Plage qui chevauche minuit (ex: 22h → 7h)
  return h >= start || h < end
}

export const SilenceUpdateSchema = z.object({
  enabled: z.boolean(),
  start_hour: z.number().int().min(0).max(23).nullable().optional(),
  end_hour: z.number().int().min(0).max(23).nullable().optional(),
  days_of_week: z.array(z.number().int().min(0).max(6)).min(0).max(7).optional(),
  paused_until: z.string().datetime().nullable().optional(),
})
export type SilenceUpdateInput = z.infer<typeof SilenceUpdateSchema>
