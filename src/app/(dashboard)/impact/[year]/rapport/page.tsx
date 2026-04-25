import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getYearlyReport } from '@/lib/impact'
import RapportPrintClient from '@/components/RapportPrintClient'

export const dynamic = 'force-dynamic'

interface RapportPageProps {
  params: Promise<{ year: string }>
}

export default async function RapportAnnuelPage({ params }: RapportPageProps) {
  const { year } = await params
  const yearInt = parseInt(year, 10)
  if (Number.isNaN(yearInt) || yearInt < 2025 || yearInt > new Date().getFullYear() + 1) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/impact/${year}/rapport`)

  const report = await getYearlyReport(user.id, yearInt)

  return <RapportPrintClient report={report} />
}
