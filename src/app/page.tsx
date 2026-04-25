'use client'

import Link from 'next/link'
import { useState } from 'react'
import CinematicIntro from '@/components/CinematicIntro'
import { APP_NAME, APP_TAGLINE, APP_PROMISE } from '@/lib/constants'

export default function Home() {
  const [introDone, setIntroDone] = useState(false)

  return (
    <>
      <CinematicIntro onComplete={() => setIntroDone(true)} />

      <main
        className="min-h-screen flex items-center justify-center px-4 py-12 relative"
        aria-hidden={!introDone}
      >
        {/* Cosmic background — subtil, jamais agressif (BRIEF règle sacrée #4) */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(6,182,212,0.08), transparent 60%), #0A0A0F',
          }}
        />

        <div
          className={`w-full max-w-xl text-center space-y-10 transition-all duration-700 ${
            introDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {/* Logo + tagline */}
          <header className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-display font-bold gradient-text-animated">
              {APP_NAME}
            </h1>
            <p className="text-white/55 text-sm md:text-base uppercase tracking-[0.25em]">
              {APP_TAGLINE}
            </p>
          </header>

          {/* Promesse */}
          <p className="text-white/75 text-lg md:text-xl leading-relaxed font-display font-light max-w-lg mx-auto">
            {APP_PROMISE}
          </p>

          {/* CTAs (BRIEF — écran d'app, pas landing 13 sections) */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/signup"
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-base hover:from-violet-500 hover:to-cyan-400 transition-all shadow-lg shadow-violet-500/25 glow-violet"
            >
              Commencer (gratuit)
            </Link>
            <Link
              href="/login"
              className="px-7 py-3.5 rounded-2xl glass text-white/85 font-medium text-base hover:bg-white/[0.06] transition-colors"
            >
              Se connecter
            </Link>
          </div>

          {/* 7 règles sacrées — tease subtil */}
          <p className="text-white/35 text-xs leading-relaxed pt-6 border-t border-white/5 max-w-md mx-auto">
            Aucune pub. Aucune toxicité. Aucune comparaison.
            <br />
            Juste toi et le monde, qui s&apos;élèvent ensemble.
          </p>
        </div>
      </main>
    </>
  )
}
