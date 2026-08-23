import type { Metadata } from 'next'
import { buildCGV, LegalPage } from '@/lib/legal'
import { KOSHA_LEGAL_CONFIG } from '@/lib/legal-config'
import { CURRENT_LEGAL_VERSIONS, LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — KOSHA',
  description: 'CGV de KOSHA par SASU PURAMA.',
}

export default function CGV() {
  const sections = buildCGV(KOSHA_LEGAL_CONFIG)
  const derniereMiseAJour = LEGAL_VERSIONS_HISTORY.cgv.at(-1)?.date ?? CURRENT_LEGAL_VERSIONS.cgv

  return (
    <LegalPage
      titre="Conditions Générales de Vente"
      sections={sections}
      derniereMiseAJour={derniereMiseAJour}
    />
  )
}
