export default function ReformBox({
  label,
  title,
  description,
  selected,
  onSelect,
  disabled,
}: {
  label: string
  title: string
  description: string
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`text-left p-4 rounded-xl border transition-all w-full ${
        selected
          ? 'bg-violet-500/15 border-violet-400/50 shadow-lg shadow-violet-500/10'
          : disabled
            ? 'bg-white/3 border-white/5 opacity-50 cursor-not-allowed'
            : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-2">{label}</p>
      <p className="text-white text-sm font-display font-semibold mb-2 line-clamp-2">{title || '—'}</p>
      <p className="text-white/65 text-xs leading-relaxed line-clamp-5">{description || '—'}</p>
    </button>
  )
}
