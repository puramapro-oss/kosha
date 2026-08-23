import type { Metadata } from 'next'
import { buildCGU, LegalPage } from '@/lib/legal'
import { KOSHA_LEGAL_CONFIG } from '@/lib/legal-config'
import { CURRENT_LEGAL_VERSIONS, LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — KOSHA',
  description: 'CGU de KOSHA par SASU PURAMA.',
}

export default function CGU() {
  const sections = buildCGU(KOSHA_LEGAL_CONFIG)
  const derniereMiseAJour = LEGAL_VERSIONS_HISTORY.cgu.at(-1)?.date ?? CURRENT_LEGAL_VERSIONS.cgu

  return (
    <LegalPage
      titre="Conditions Générales d'Utilisation"
      sections={sections}
      derniereMiseAJour={derniereMiseAJour}
    />
  )
}
