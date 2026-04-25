'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CAGNOTTE_TYPE_LABELS,
  CAGNOTTE_STATUS_LABELS,
  formatEur,
  progressPercent,
  type CagnotteWithOwner,
} from '@/lib/cagnottes'
import { stringToColor } from '@/lib/utils'

export default function CagnotteCard({ cagnotte, index = 0 }: { cagnotte: CagnotteWithOwner; index?: number }) {
  const typeMeta = CAGNOTTE_TYPE_LABELS[cagnotte.type]
  const statusMeta = CAGNOTTE_STATUS_LABELS[cagnotte.status]
  const pct = progressPercent(cagnotte.raised_amount_cents, cagnotte.target_amount_cents)
  const ownerColor = stringToColor(cagnotte.owner_name ?? cagnotte.id)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4), ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group glass rounded-2xl overflow-hidden flex flex-col hover:border-white/15 transition-colors"
    >
      <Link href={`/cagnottes/${cagnotte.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-2xl">
        {/* Visual header — gradient + emoji type */}
        <div
          className="relative h-32 flex items-center justify-center text-5xl"
          style={{
            background: `linear-gradient(135deg, ${ownerColor} 0%, #06B6D4 100%)`,
          }}
          aria-hidden
        >
          <span className="opacity-90 drop-shadow-md">{typeMeta.emoji}</span>
          <span className={`absolute top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${statusMeta.tone}`}>
            {statusMeta.label}
          </span>
        </div>

        <div className="p-5 flex flex-col gap-3 flex-1">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{typeMeta.label}</p>
            <h3 className="text-base font-display font-semibold text-white mt-1 line-clamp-2 leading-snug">
              {cagnotte.title}
            </h3>
          </div>

          <p className="text-xs text-white/55 line-clamp-2 leading-relaxed">
            {cagnotte.description_aria || cagnotte.description}
          </p>

          {/* Progression */}
          <div className="mt-auto space-y-1.5">
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-white/85">{formatEur(cagnotte.raised_amount_cents)}</span>
              <span className="text-white/40">/ {formatEur(cagnotte.target_amount_cents)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40">
              <span>
                {cagnotte.contributors_count} contributeur{cagnotte.contributors_count > 1 ? 's' : ''}
              </span>
              <span className="font-mono">{pct}%</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
