'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Dot {
  id: string
  lng: number
  lat: number
  amount_cents: number
  ts: number
}

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0A0A0F' } },
    { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.18, 'raster-saturation': -1, 'raster-brightness-min': 0.05, 'raster-brightness-max': 0.6 } },
  ],
}

export default function MapLibreCanvas({ dots }: { dots: Dot[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [10, 30],
      zoom: 1.2,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      dragRotate: false,
    })
    map.scrollZoom.disable()
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Sync dots → markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const presentIds = new Set(dots.map((d) => d.id))

    // Add/keep markers
    for (const dot of dots) {
      if (markersRef.current.has(dot.id)) continue
      const el = document.createElement('div')
      el.className = 'kosha-impact-dot'
      el.style.width = `${Math.min(28, 8 + dot.amount_cents / 1000)}px`
      el.style.height = el.style.width
      el.style.borderRadius = '50%'
      el.style.background = 'radial-gradient(circle, #06B6D4 0%, #7C3AED 60%, transparent 70%)'
      el.style.boxShadow = '0 0 18px rgba(124,58,237,0.65)'
      el.style.pointerEvents = 'none'
      el.style.opacity = '0'
      el.style.transition = 'opacity 600ms ease-out'
      const marker = new maplibregl.Marker({ element: el }).setLngLat([dot.lng, dot.lat]).addTo(map)
      markersRef.current.set(dot.id, marker)
      // Fade in
      requestAnimationFrame(() => {
        el.style.opacity = '0.9'
      })
    }

    // Cleanup very old markers (keep last 30)
    if (markersRef.current.size > 30) {
      const sortedIds = Array.from(markersRef.current.keys())
      const toRemove = sortedIds.slice(0, sortedIds.length - 30)
      for (const id of toRemove) {
        if (!presentIds.has(id)) {
          markersRef.current.get(id)?.remove()
          markersRef.current.delete(id)
        }
      }
    }
  }, [dots])

  return <div ref={containerRef} className="w-full h-[420px]" aria-label="Carte des impacts mondiaux" role="img" />
}
