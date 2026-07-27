// Shared icon set — replaces emoji used as UI elements across the app.
// Same feather-style stroke convention already used in Sidebar/AppTopNav:
// stroke="currentColor", rounded caps, no fill. Size/color inherit from
// the parent via `currentColor` + font-size, unless width/height passed.

interface IconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}

export function MusicNoteIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

export function TapIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M9 11.5V6a2 2 0 0 1 4 0v4" />
      <path d="M13 10V4a2 2 0 0 1 4 0v7" />
      <path d="M17 10.5a2 2 0 0 1 4 0V14a7 7 0 0 1-7 7h-1.5a6 6 0 0 1-4.9-2.55L4 12.9a1.8 1.8 0 0 1 2.75-2.3L9 12.5" />
    </svg>
  )
}

export function RepeatIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M17 2.1 21 6l-4 3.9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 21.9 3 18l4-3.9" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

export function FlameIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M12 22a6.5 6.5 0 0 0 6.5-6.5c0-3.5-2.5-5-3.5-8-1 1.5-1.8 2.2-2.5 2 .3-2.5-.5-5-2.5-6.5-.3 2.5-1.2 4-3 5.5C4.8 10 4 12 4 14.5A6.5 6.5 0 0 0 12 22Z" />
    </svg>
  )
}

export function SnowflakeIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H8" />
    </svg>
  )
}

export function StarIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style} fill="currentColor" stroke="none">
      <path d="M12 2.5l2.9 6.3 6.85.75-5.1 4.75 1.4 6.8L12 17.8l-6.05 3.3 1.4-6.8-5.1-4.75 6.85-.75L12 2.5Z" />
    </svg>
  )
}

export function CheckCircleIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.3l2.3 2.3 4.7-4.8" />
    </svg>
  )
}

export function BellIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 13 6 8Z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  )
}

export function TargetIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function BookIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </svg>
  )
}

export function TrophyIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M8 21h8" /><path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4" />
      <path d="M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" />
    </svg>
  )
}

export function ListIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3.5" y1="6" x2="3.5" y2="6" />
      <line x1="3.5" y1="12" x2="3.5" y2="12" />
      <line x1="3.5" y1="18" x2="3.5" y2="18" />
    </svg>
  )
}

export function DiscIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

export function SoundOnIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z" />
      <path d="M16.5 9a4 4 0 0 1 0 6" />
      <path d="M19 6.5a8 8 0 0 1 0 11" />
    </svg>
  )
}

export function SoundOffIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z" />
      <line x1="17" y1="9" x2="22" y2="14" />
      <line x1="22" y1="9" x2="17" y2="14" />
    </svg>
  )
}

export function SearchIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="19" y1="19" x2="15.2" y2="15.2" />
    </svg>
  )
}

export function PencilIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  )
}

export function HandPointIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 12V4.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M14 12.2V6a1.5 1.5 0 0 1 3 0v6.5" />
      <path d="M17 12.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a5 5 0 0 1-4-2l-3.2-4.3a1.5 1.5 0 0 1 2.3-1.9L8 12" />
    </svg>
  )
}

export function PianoIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M7.5 5v8" /><path d="M11.5 5v8" /><path d="M15.5 5v8" />
    </svg>
  )
}

export function LockIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  )
}

export function MoonIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  )
}

export function LeafIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M5 19c8 0 13-5 13-13V5h-1C9 5 5 10 5 18v1Z" />
      <path d="M5 19c2-5 4.5-8 8.5-10.5" />
    </svg>
  )
}

export function CardsIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <rect x="3" y="6" width="12" height="15" rx="2" />
      <path d="M8.5 6.5 17 3l3.5 10-3.5 1.2" />
    </svg>
  )
}

export function ConfettiIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M4 20 14 4" />
      <circle cx="18" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="20" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="4.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="M15.5 9.5l2 2" />
      <path d="M12.5 12.5l2 2" />
    </svg>
  )
}

// STUDY_LEVELS (lib/mvp.ts) rendered a raw emoji per level (🌱🌿🌳) — this
// keeps one icon, differentiated by fill strength, instead of 3 lookalikes.
export function LevelIcon({ level, size = 18, className, style }: IconProps & { level: 'beginner' | 'intermediate' | 'advanced' }) {
  const opacity = level === 'beginner' ? 0.5 : level === 'intermediate' ? 0.75 : 1
  return <LeafIcon size={size} className={className} style={{ ...style, opacity }} />
}

// DAY_INFO (lib/mvp.ts) rendered 📖 / 🃏 / ✍️ for the three review-cycle days.
export function DayIcon({ day, size = 18, className, style }: IconProps & { day: 1 | 2 | 3 }) {
  if (day === 1) return <BookIcon size={size} className={className} style={style} />
  if (day === 2) return <CardsIcon size={size} className={className} style={style} />
  return <PencilIcon size={size} className={className} style={style} />
}

export function GlobeIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  )
}
