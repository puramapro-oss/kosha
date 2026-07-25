import { ImageResponse } from 'next/og'
import { APP_NAME, APP_TAGLINE, APP_PROMISE } from '@/lib/constants'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${APP_NAME} — ${APP_TAGLINE}`

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: '#0A0A0F',
          fontFamily: 'system-ui, sans-serif',
          color: '#F8FAFC',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 480,
            height: 480,
            background:
              'radial-gradient(circle at 100% 0%, rgba(124,58,237,0.35) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 480,
            height: 480,
            background:
              'radial-gradient(circle at 0% 100%, rgba(6,182,212,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            K
          </div>
          <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: 2, opacity: 0.85 }}>
            {APP_NAME} by Purama
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 980 }}>
          <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15 }}>
            {APP_TAGLINE}
          </span>
          <span style={{ fontSize: 26, opacity: 0.6, maxWidth: 900 }}>
            {APP_PROMISE}
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
