'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { Sparkles, Globe, Zap } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Props {
  estimatedMonthlyEarnings: number      // €
  liveCommunityImpact: number            // total actions communauté
  suggestedActionLabel: string
  suggestedActionHref: string
}

/**
 * Le moment WOW (BRIEF §2) — visible dès l'ouverture.
 * 3 KPIs animés :
 * - Gains potentiels du mois (estimation perso)
 * - Impact mondial en direct (compteur communauté)
 * - Action faisable en 30 secondes (lien)
 */
export default function MomentWow({
  estimatedMonthlyEarnings,
  liveCommunityImpact,
  suggestedActionLabel,
  suggestedActionHref,
}: Props) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Aperçu instantané">
      <KpiCard
        icon={<Sparkles className="w-5 h-5" aria-hidden />}
        label="Gains potentiels ce mois"
        primary={<AnimatedEuros target={estimatedMonthlyEarnings} />}
        helper="Estimation basée sur ton profil"
        accent="violet"
      />
      <KpiCard
        icon={<Globe className="w-5 h-5" aria-hidden />}
        label="Impact mondial en direct"
        primary={<AnimatedNumber target={liveCommunityImpact} />}
        helper="Actions faites par la communauté"
        accent="cyan"
      />
      <KpiCard
        icon={<Zap className="w-5 h-5" aria-hidden />}
        label="Action de 30 secondes"
        primary={
          <a
            href={suggestedActionHref}
            className="inline-block text-base md:text-lg font-display font-semibold gradient-text-kosha hover:opacity-80 transition-opacity"
          >
            {suggestedActionLabel} →
          </a>
        }
        helper="Tu peux le faire maintenant"
        accent="emerald"
      />
    </section>
  )
}

type Accent = 'violet' | 'cyan' | 'emerald'
const ACCENTS: Record<Accent, { bg: string; ring: string }> = {
  violet: { bg: 'rgba(124,58,237,0.10)', ring: 'rgba(124,58,237,0.20)' },
  cyan: { bg: 'rgba(6,182,212,0.10)', ring: 'rgba(6,182,212,0.20)' },
  emerald: { bg: 'rgba(16,185,129,0.10)', ring: 'rgba(16,185,129,0.20)' },
}

function KpiCard({
  icon,
  label,
  primary,
  helper,
  accent,
}: {
  icon: React.ReactNode
  label: string
  primary: React.ReactNode
  helper: string
  accent: Accent
}) {
  const colors = ACCENTS[accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass rounded-2xl p-5"
      style={{ borderColor: colors.ring }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: colors.bg, color: '#fff' }}
        >
          {icon}
        </span>
        <p className="text-white/55 text-xs uppercase tracking-wider">{label}</p>
      </div>
      <div className="text-2xl md:text-3xl font-display font-bold mb-1">{primary}</div>
      <p className="text-white/40 text-xs mt-1.5">{helper}</p>
    </motion.div>
  )
}

function AnimatedEuros({ target }: { target: number }) {
  const value = useAnimatedNumber(target, 1.5)
  return <span className="gradient-text-kosha">{formatPrice(value)}</span>
}

function AnimatedNumber({ target }: { target: number }) {
  const value = useAnimatedNumber(target, 1.5)
  return (
    <span className="gradient-text-kosha">
      {Math.round(value).toLocaleString('fr-FR')}
    </span>
  )
}

function useAnimatedNumber(target: number, duration = 1.5): number {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) => v)
  const [val, setVal] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    const controls = animate(motionValue, target, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
    })
    const unsub = display.on('change', (v) => setVal(v))
    return () => {
      controls.stop()
      unsub()
    }
  }, [target, motionValue, display, duration])

  return val
}
