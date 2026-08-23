import type { Metadata, Viewport } from 'next'
import { Sora, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import './globals.css'
import { APP_NAME, APP_URL, APP_TAGLINE, APP_PROMISE } from '@/lib/constants'
import CookieConsentBannerClient from '@/components/CookieConsentBannerClient'

const sora = Sora({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0A0F',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: `${APP_NAME} — ${APP_TAGLINE}`, template: `%s — ${APP_NAME}` },
  description: APP_PROMISE,
  applicationName: APP_NAME,
  authors: [{ name: 'Purama', url: 'https://purama.dev' }],
  keywords: ['kosha', 'purama', 'cagnotte', 'réseau social', 'éveil', 'gains', 'IA Aria', 'redistribution'],
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: APP_URL,
    siteName: `${APP_NAME} by Purama`,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_PROMISE,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_PROMISE,
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="dark" suppressHydrationWarning>
      <body className={`${sora.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <CookieConsentBannerClient />
          <Toaster
            position="top-center"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'rgba(10, 10, 15, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#F8FAFC',
                backdropFilter: 'blur(20px)',
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
