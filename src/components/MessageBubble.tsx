import type { ChatMessage } from './chat-types'

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'text-white'
            : 'text-white/90 bg-white/[0.04] border border-white/[0.06]'
        }`}
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, #7C3AED 0%, #5b21b6 100%)',
                boxShadow: '0 4px 16px -6px rgba(124,58,237,0.4)',
              }
            : undefined
        }
      >
        {message.content}
        {message.pending && message.content.length === 0 && (
          <span className="inline-flex items-center gap-1.5 text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.15s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
          </span>
        )}
        {message.pending && message.content.length > 0 && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-white/60 animate-pulse" />
        )}
      </div>
    </div>
  )
}
