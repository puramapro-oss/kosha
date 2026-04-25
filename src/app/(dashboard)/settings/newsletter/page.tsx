import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import NewsletterSettingsClient from '@/components/NewsletterSettingsClient'

export const dynamic = 'force-dynamic'

interface SubscriberRow {
  subscribed: boolean
  frequency: string
  unsubscribe_token: string
  last_sent_at: string | null
}

interface EmailRow {
  id: string
  week_iso: string
  subject: string
  action_kind: string
  action_label: string
  sent_at: string
  opened_at: string | null
  action_taken_at: string | null
}

export default async function NewsletterSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/settings/newsletter')

  const service = createServiceClient()

  // Backstop : si pas de row subscriber (très ancien user pré-trigger), upsert
  const { data: existing } = await service
    .from('newsletter_subscribers')
    .select('subscribed, frequency, unsubscribe_token, last_sent_at')
    .eq('user_id', user.id)
    .maybeSingle()

  let subscriber: SubscriberRow
  if (existing) {
    subscriber = existing as SubscriberRow
  } else {
    const { data: created } = await service
      .from('newsletter_subscribers')
      .insert({ user_id: user.id })
      .select('subscribed, frequency, unsubscribe_token, last_sent_at')
      .single()
    subscriber = created as SubscriberRow
  }

  const { data: emails } = await service
    .from('newsletter_emails')
    .select('id, week_iso, subject, action_kind, action_label, sent_at, opened_at, action_taken_at')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(8)

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white/85">
          <ArrowLeft className="w-4 h-4" />
          Tableau de bord
        </Link>
      </header>

      <div>
        <h1 className="text-3xl font-display font-bold gradient-text-kosha">Living Newsletter</h1>
        <p className="text-white/60 text-sm mt-2 max-w-prose">
          1 email par semaine. 6 blocs fixes : où on en est, impact déclenché, idée qui élève, action concrète &lt; 2 min,
          trace personnelle, fermeture calme. Aucun appel à l&apos;action commercial. Tu peux te désabonner en 1 clic à tout moment.
        </p>
      </div>

      <NewsletterSettingsClient
        initialSubscribed={subscriber.subscribed}
        unsubscribeToken={subscriber.unsubscribe_token}
        lastSentAt={subscriber.last_sent_at}
        emails={(emails ?? []) as EmailRow[]}
      />
    </div>
  )
}
