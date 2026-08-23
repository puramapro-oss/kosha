export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string | null
  pending?: boolean
}
