'use client'

import { useEffect, useRef, useState } from 'react'
import { APP_NAME } from '@/lib/constants'

const CINEMATIC_DURATION_MS = 3000
const STORAGE_KEY = 'kosha_cinematic_seen'
const SCRAMBLE_CHARS = 'KO・SHA・कोश・蔵・ARIA・∞・◇・◈・▲'

interface Props {
  onComplete?: () => void
}

/**
 * Cinématique d'ouverture KOSHA — 3s max, skippable, accessible.
 * Multisensoriel BRIEF §9 : scramble effect text + aberration chromatique + fade.
 * Respecte prefers-reduced-motion (skip auto si actif).
 */
export default function CinematicIntro({ onComplete }: Props) {
  const [visible, setVisible] = useState(false)
  const [scrambled, setScrambled] = useState(APP_NAME)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completeRef = useRef(false)

  function complete() {
    if (completeRef.current) return
    completeRef.current = true
    setVisible(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    onComplete?.()
  }

  useEffect(() => {
    // Skip si déjà vue dans la session
    let alreadySeen = false
    try {
      alreadySeen = window.sessionStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      /* ignore */
    }

    // Skip si reduced motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (alreadySeen || reducedMotion) {
      onComplete?.()
      return
    }

    setVisible(true)

    // Scramble effect (les lettres défilent puis se figent)
    let elapsed = 0
    const tickMs = 50
    const lockSequence = APP_NAME.length
    intervalRef.current = setInterval(() => {
      elapsed += tickMs
      const lockedCount = Math.min(
        lockSequence,
        Math.floor((elapsed / (CINEMATIC_DURATION_MS - 800)) * lockSequence)
      )
      const next = APP_NAME.split('')
        .map((real, i) =>
          i < lockedCount
            ? real
            : SCRAMBLE_CHARS.charAt(Math.floor(Math.random() * SCRAMBLE_CHARS.length))
        )
        .join('')
      setScrambled(next)
    }, tickMs)

    const timeout = setTimeout(complete, CINEMATIC_DURATION_MS)

    return () => {
      clearTimeout(timeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Skip via Escape ou click
  useEffect(() => {
    if (!visible) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') complete()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={complete}
      aria-label="Passer la cinématique"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0F] cursor-pointer animate-scramble-in"
      style={{
        background:
          'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(ellipse 50% 30% at 80% 60%, rgba(6,182,212,0.12), transparent 60%), #0A0A0F',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <h1
          className="text-6xl md:text-8xl font-display font-bold tracking-tight gradient-text-animated aberration"
          style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"calt" 0' }}
        >
          {scrambled}
        </h1>
        <p className="text-white/40 text-xs uppercase tracking-[0.3em]">L&apos;univers où agir = être payé</p>
      </div>
      <span className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs uppercase tracking-wider">
        Tape Échap pour passer
      </span>
    </button>
  )
}
