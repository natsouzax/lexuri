'use client'

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getDayLabels(): string[] {
  const labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(DAY_INITIALS[d.getDay()])
  }
  return labels
}

interface Props {
  weekActivity: boolean[]   // index 0 = today, index 6 = 6 days ago
}

export default function WeeklyCalendar({ weekActivity }: Props) {
  const dayLabels = getDayLabels()
  const displayActivity = [...weekActivity].reverse() // oldest → newest (left to right)

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: '18px 16px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        {displayActivity.map((active, i) => {
          const isToday = i === 6
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flex: 1 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: active ? 'var(--moss)' : 'transparent',
                border: `2px solid ${active ? 'var(--moss)' : isToday ? 'var(--clay)' : 'var(--line)'}`,
                transition: 'background 200ms ease, border-color 200ms ease',
              }} />
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 900,
                letterSpacing: '0.05em',
                color: isToday ? 'var(--clay)' : 'var(--muted)',
                textTransform: 'uppercase',
              }}>
                {dayLabels[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
