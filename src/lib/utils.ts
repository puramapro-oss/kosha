import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatPrice = (n: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n)

export const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))

export const formatDateTime = (d: string | Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))

export function formatRelativeDate(date: string | Date): string {
  const diffMin = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffMin < 1440) return `Il y a ${Math.floor(diffMin / 60)}h`
  if (diffMin < 2880) return 'Hier'
  if (diffMin < 10080) return `Il y a ${Math.floor(diffMin / 1440)}j`
  return formatDate(date)
}

export function getGreeting(name?: string | null): string {
  const h = new Date().getHours()
  const n = name ? ` ${name}` : ''
  if (h >= 5 && h < 12) return `Bonjour${n}`
  if (h >= 12 && h < 18) return `Bon après-midi${n}`
  if (h >= 18 && h < 22) return `Bonsoir${n}`
  return `Tu travailles tard${n}`
}

export const getInitials = (name: string): string =>
  name.split(' ').map((n) => n[0] ?? '').join('').toUpperCase().slice(0, 2)

export const stringToColor = (s: string): string => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  const palette = ['#7C3AED', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1']
  return palette[Math.abs(h) % palette.length] as string
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const generateReferralCode = (length = 8): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans I, 0, O, 1 pour éviter confusion
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

// SHA-256 hash pour cache IA (V7.2 §71)
export async function sha256(text: string): Promise<string> {
  const buffer = new TextEncoder().encode(text.toLowerCase().trim())
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
