import type { Metadata } from 'next'
import { buildPolitiqueConfidentialite, LegalPage } from '@/lib/legal'
import { KOSHA_LEGAL_CONFIG } from '@/lib/legal-config'
import { CURRENT_LEGAL_VERSIONS, LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — KOSHA',
  description: 'Politique de confidentialité et protection des données personnelles de KOSHA.',
}

export default function PolitiqueConfidentialite() {
  const sections = buildPolitiqueConfidentialite(KOSHA_LEGAL_CONFIG, process.env)
  const derniereMiseAJour = LEGAL_VERSIONS_HISTORY.confidentialite.at(-1)?.date ?? CURRENT_LEGAL_VERSIONS.confidentialite

  return (
    <LegalPage
      titre="Politique de Confidentialité"
      sections={sections}
      derniereMiseAJour={derniereMiseAJour}
    />
  )
}
