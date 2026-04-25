'use client'

import { motion } from 'framer-motion'
import { ACTION_VISUALS, type FilDeVieEntry } from '@/lib/fil-de-vie'
import { formatRelativeDate } from '@/lib/utils'

interface Props {
  entries: FilDeVieEntry[]
  emptyLabel?: string
  maxItems?: number
}

export default function FilDeVieTimeline({
  entries,
  emptyLabel = "Ton Fil de Vie commence ici. La première action sera ton point d'origine.",
  maxItems,
}: Props) {
  const list = maxItems ? entries.slice(0, maxItems) : entries

  if (list.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-white/40 text-4xl mb-3" aria-hidden>
          ◯
        </p>
        <p className="text-white/55 text-sm leading-relaxed max-w-xs mx-auto">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <ol className="relative pl-8 space-y-5">
      {/* Vertical line */}
      <div
        aria-hidden
        className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/40 via-cyan-500/30 to-transparent"
      />
      {list.map((entry, idx) => {
        const visual = ACTION_VISUALS[entry.action_type] ?? {
          emoji: '◇',
          color: '#7C3AED',
          humanLabel: 'Action',
        }

        return (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.4), duration: 0.4 }}
            className="relative"
          >
            {/* Pastille */}
            <span
              className="absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-[#0A0A0F]"
              style={{
                backgroundColor: `${visual.color}20`,
                color: visual.color,
                boxShadow: `0 0 14px ${visual.color}30`,
              }}
              aria-hidden
            >
              {visual.emoji}
            </span>

            <div className="space-y-1">
              <p className="text-white/85 text-sm font-medium">{entry.action_label}</p>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <span>{visual.humanLabel}</span>
                <span>•</span>
                <time dateTime={entry.created_at}>{formatRelativeDate(entry.created_at)}</time>
              </div>
              {entry.impact_data && Object.values(entry.impact_data).some((v) => v && v > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {entry.impact_data.kg_dechets ? (
                    <ImpactBadge label={`${entry.impact_data.kg_dechets} kg déchets`} color="#10B981" />
                  ) : null}
                  {entry.impact_data.arbres ? (
                    <ImpactBadge label={`${entry.impact_data.arbres} arbres`} color="#10B981" />
                  ) : null}
                  {entry.impact_data.l_eau ? (
                    <ImpactBadge label={`${entry.impact_data.l_eau} L eau`} color="#06B6D4" />
                  ) : null}
                  {entry.impact_data.personnes ? (
                    <ImpactBadge label={`${entry.impact_data.personnes} personne(s)`} color="#EC4899" />
                  ) : null}
                </div>
              )}
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}

function ImpactBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-medium"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  )
}
