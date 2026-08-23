import type { Metadata } from 'next'
import { buildMentionsLegales, LegalPage } from '@/lib/legal'
import { KOSHA_LEGAL_CONFIG } from '@/lib/legal-config'
import { CURRENT_LEGAL_VERSIONS, LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Mentions Légales — KOSHA',
  description: 'Mentions légales de KOSHA par SASU PURAMA.',
}

export default function MentionsLegales() {
  const sections = buildMentionsLegales(KOSHA_LEGAL_CONFIG)
  const derniereMiseAJour = LEGAL_VERSIONS_HISTORY.mentions.at(-1)?.date ?? CURRENT_LEGAL_VERSIONS.mentions

  return (
    <LegalPage
      titre="Mentions Légales"
      sections={sections}
      derniereMiseAJour={derniereMiseAJour}
    />
  )
}
