'use client'

import { useRouter } from 'next/navigation'
import { LegalReacceptanceGate, type LegalDocType } from '@/lib/legal'
import { APP_NAME } from '@/lib/constants'

async function acceptDoc(docType: LegalDocType) {
  const res = await fetch('/api/legal/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docType }),
  })
  if (!res.ok) throw new Error('accept failed')
}

export default function LegalReacceptanceGateClient({ docsEnAttente }: { docsEnAttente: LegalDocType[] }) {
  const router = useRouter()

  if (docsEnAttente.length === 0) return null

  async function handleAccept(docType: LegalDocType) {
    await acceptDoc(docType)
    router.refresh()
  }

  return <LegalReacceptanceGate appName={APP_NAME} docsEnAttente={docsEnAttente} onAccept={handleAccept} />
}
