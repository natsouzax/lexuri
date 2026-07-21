import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Lexuri — Aprenda inglês com as músicas que você ama',
  description:
    'Projeto de pesquisa: aprender inglês ouvindo música, com letra sincronizada, tradução por toque e revisões curtas em 3 dias.',
}

const STEPS = [
  { icon: '🎵', title: 'Ouça uma música', desc: 'Letra sincronizada na tela, no seu nível de inglês.' },
  { icon: '👆', title: 'Toque no que não entender', desc: 'Tradução e significado na hora. Salve as palavras que quiser aprender.' },
  { icon: '🔁', title: 'Revise em 3 dias curtos', desc: 'Flashcards, jogo da memória e complete a letra. Poucos minutos por dia.' },
]

export default function HomePage() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clay)', background: 'rgba(200,111,74,0.1)', padding: '4px 14px', borderRadius: 999 }}>
        Projeto de pesquisa
      </span>

      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: 'clamp(1.9rem, 6vw, 2.6rem)', lineHeight: 1.15, margin: '20px 0 12px', color: 'var(--ink)' }}>
        Aprenda inglês com as músicas que você ama
      </h1>

      <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 32px' }}>
        Estamos testando uma ideia simples: ouvir música com a letra na tela,
        tocar nas palavras para entender, e revisar em sessões curtas.
        Sem cobrança, sem pegadinha — só queremos saber se funciona para você.
      </p>

      <Link
        href="/register"
        className="btn-primary"
        style={{ display: 'inline-block', padding: '14px 40px', fontSize: '1.05rem', borderRadius: 14 }}
      >
        Começar agora
      </Link>
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 10 }}>
        Leva menos de 2 minutos.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 48, textAlign: 'left' }}>
        {STEPS.map((s) => (
          <div key={s.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink)' }}>{s.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
