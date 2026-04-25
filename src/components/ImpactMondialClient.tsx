'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { formatEur } from '@/lib/cagnottes'

const MapLibreCanvas = dynamic(() => import('./MapLibreCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-[420px] rounded-2xl bg-white/3 animate-pulse" />,
})

interface InitialData {
  total_collected_cents: number
  contributors_unique: number
  cagnottes_completed: number
  cagnottes_active: number
  recent: Array<{
    id: string
    amount_cents: number
    paid_at: string | null
    cagnotte_title: string
    cagnotte_geo: string | null
  }>
}

interface LiveDot {
  id: string
  lng: number
  lat: number
  amount_cents: number
  ts: number
}

export default function ImpactMondialClient({ initial }: { initial: InitialData }) {
  const [stats, setStats] = useState({
    total_collected_cents: initial.total_collected_cents,
    contributors_unique: initial.contributors_unique,
    cagnottes_completed: initial.cagnottes_completed,
    cagnottes_active: initial.cagnottes_active,
  })
  const [feed, setFeed] = useState(initial.recent)
  const [dots, setDots] = useState<LiveDot[]>([])
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('kosha-impact-mondial')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'kosha',
          table: 'cagnotte_contributions',
          filter: 'status=eq.succeeded',
        },
        async (payload) => {
          const row = payload.new as { id: string; cagnotte_id: string; amount_cents: number; paid_at: string | null }
          // Fetch cagnotte title for the feed
          const { data: c } = await supabase
            .from('cagnottes')
            .select('title, geolocation_label, geolocation_geohash')
            .eq('id', row.cagnotte_id)
            .maybeSingle()

          const cagnotteTitle = (c?.title as string | undefined) ?? 'Cagnotte'
          const geo = (c?.geolocation_label as string | null) ?? null

          setStats((s) => ({
            ...s,
            total_collected_cents: s.total_collected_cents + row.amount_cents,
          }))
          setFeed((prev) =>
            [
              { id: row.id, amount_cents: row.amount_cents, paid_at: row.paid_at, cagnotte_title: cagnotteTitle, cagnotte_geo: geo },
              ...prev,
            ].slice(0, 20)
          )

          const coords = pickCoordsFromGeoLabel(geo)
          if (coords) {
            const dot: LiveDot = { id: row.id, lng: coords.lng, lat: coords.lat, amount_cents: row.amount_cents, ts: Date.now() }
            setDots((prev) => [...prev.slice(-30), dot])
          }
        }
      )
      .subscribe()
    channelRef.current = channel
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Collecté ensemble" value={formatEur(stats.total_collected_cents)} accent="#7C3AED" />
        <Stat label="Voyageurs" value={stats.contributors_unique.toLocaleString('fr-FR')} accent="#06B6D4" />
        <Stat label="Cagnottes vivantes" value={stats.cagnottes_active.toLocaleString('fr-FR')} accent="#10B981" />
        <Stat label="Atteintes" value={stats.cagnottes_completed.toLocaleString('fr-FR')} accent="#F59E0B" />
      </section>

      <section className="glass rounded-2xl overflow-hidden">
        <MapLibreCanvas dots={dots} />
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="text-sm font-display font-semibold text-white/85 mb-3">Battements récents</h2>
        {feed.length === 0 ? (
          <p className="text-white/45 text-sm py-6 text-center italic">Le silence avant les premières lumières.</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-auto pr-2">
            {feed.map((c) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-baseline justify-between gap-3 text-sm py-2 border-b border-white/5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white/85 truncate">{c.cagnotte_title}</p>
                  {c.cagnotte_geo && <p className="text-[10px] text-white/35 mt-0.5">📍 {c.cagnotte_geo}</p>}
                </div>
                <span className="font-mono text-xs text-violet-300 shrink-0">{formatEur(c.amount_cents)}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0.5, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-4"
    >
      <p className="text-2xl font-display font-bold" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-[11px] text-white/50 mt-1">{label}</p>
    </motion.div>
  )
}

/**
 * Best-effort fallback : pas de géocodage backend pour l'instant. Si geo_label
 * matche un nom de ville/région connu, on retourne ses coords. Sinon null
 * (le dot ne s'affiche pas — la stat compte quand même).
 */
const KNOWN_PLACES: Array<{ match: RegExp; lng: number; lat: number }> = [
  { match: /paris|île-de-france|idf/i, lng: 2.3522, lat: 48.8566 },
  { match: /marseille|bouches/i, lng: 5.3698, lat: 43.2965 },
  { match: /lyon|rhône/i, lng: 4.8357, lat: 45.7640 },
  { match: /toulouse|haute-garonne/i, lng: 1.4442, lat: 43.6047 },
  { match: /bordeaux|gironde/i, lng: -0.5792, lat: 44.8378 },
  { match: /nantes|loire-atlantique/i, lng: -1.5536, lat: 47.2184 },
  { match: /strasbourg|alsace|bas-rhin/i, lng: 7.7521, lat: 48.5734 },
  { match: /lille|nord/i, lng: 3.0573, lat: 50.6292 },
  { match: /frasne|doubs|franche-comté|besançon/i, lng: 6.1539, lat: 46.8525 },
  { match: /rennes|bretagne|ille-et-vilaine/i, lng: -1.6778, lat: 48.1173 },
  { match: /nice|alpes-maritimes/i, lng: 7.2620, lat: 43.7102 },
  { match: /montpellier|hérault/i, lng: 3.8767, lat: 43.6108 },
  { match: /grenoble|isère/i, lng: 5.7245, lat: 45.1885 },
  { match: /bruxelles|belgique/i, lng: 4.3517, lat: 50.8503 },
  { match: /genève|suisse romande/i, lng: 6.1432, lat: 46.2044 },
  { match: /montréal|québec/i, lng: -73.5673, lat: 45.5017 },
  { match: /dakar|sénégal/i, lng: -17.4677, lat: 14.7167 },
  { match: /casablanca|maroc/i, lng: -7.5898, lat: 33.5731 },
]

function pickCoordsFromGeoLabel(label: string | null): { lng: number; lat: number } | null {
  if (!label) return null
  for (const place of KNOWN_PLACES) {
    if (place.match.test(label)) return { lng: place.lng, lat: place.lat }
  }
  return null
}
