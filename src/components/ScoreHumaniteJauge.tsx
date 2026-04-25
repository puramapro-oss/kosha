'use client'

import { motion } from 'framer-motion'
import type { ScoreComponents } from '@/lib/score'
import { getScoreExplanation } from '@/lib/score'

interface Props {
  score: number               // 0-10
  components: ScoreComponents
  size?: number               // px
  showExplanation?: boolean
}

export default function ScoreHumaniteJauge({
  score,
  components,
  size = 180,
  showExplanation = true,
}: Props) {
  const radius = size / 2 - 12
  const circumference = 2 * Math.PI * radius
  const ratio = Math.min(1, Math.max(0, score / 10))
  const dashOffset = circumference * (1 - ratio)
  const explanation = getScoreExplanation(score, components)

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="img"
        aria-label={`Score d'Humanité : ${score.toFixed(1)} sur 10`}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl md:text-5xl font-display font-bold gradient-text-kosha"
          >
            {score.toFixed(1)}
          </motion.span>
          <span className="text-xs text-white/40 uppercase tracking-wider mt-1">/ 10</span>
        </div>
      </div>

      {showExplanation && (
        <p className="text-white/55 text-xs text-center max-w-[200px] leading-relaxed">
          {explanation}
        </p>
      )}
    </div>
  )
}
