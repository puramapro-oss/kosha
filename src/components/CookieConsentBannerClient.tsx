'use client'

import { CookieConsentBanner, type CookieConsent } from '@/lib/legal'
import { APP_NAME } from '@/lib/constants'

function syncConsent(consent: CookieConsent) {
  fetch('/api/legal/cookie-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mesure: consent.mesure, marketing: consent.marketing }),
  }).catch(() => {})
}

export default function CookieConsentBannerClient() {
  return <CookieConsentBanner appName={APP_NAME} onConsent={syncConsent} />
}
