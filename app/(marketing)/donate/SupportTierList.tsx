'use client'

interface Tier {
  amount: string
  label: string
  desc: string
}

export default function SupportTierList({ supporters }: { supporters: Tier[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {supporters.map(({ amount, label, desc }) => (
        <a
          key={label}
          href="https://ko-fi.com/verbly"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: '20px 28px',
            background: 'var(--paper)',
            textDecoration: 'none',
            color: 'inherit',
            gap: 16,
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--clay)'
            ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow-md)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--line)'
            ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
          }}
        >
          <div>
            <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>{desc}</div>
          </div>
          <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.1rem', color: 'var(--clay)', flexShrink: 0 }}>{amount}</div>
        </a>
      ))}
    </div>
  )
}
