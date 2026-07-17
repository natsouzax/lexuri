'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

const FAQS = [
  {
    q: 'What exactly is a "chunk" in Lexuri?',
    a: 'A chunk is a multi-word expression that native speakers use as a single unit — phrasal verbs like "give up", idioms like "at the end of the day", or collocations like "make a decision". Learning chunks instead of isolated words is how you develop real fluency.',
  },
  {
    q: 'How is this different from Duolingo or Anki?',
    a: 'Duolingo focuses on gamified isolated sentences. Anki is powerful but requires you to find and create your own cards. Lexuri automatically extracts chunks from content you actually enjoy (YouTube videos, songs), so your learning is grounded in real, meaningful context.',
  },
  {
    q: 'Do I need to already speak some English?',
    a: "The platform is designed for B1 level and above (intermediate). You should be able to understand basic English sentences. If you're a complete beginner, the demo lesson will show you exactly what to expect.",
  },
  {
    q: 'What languages is the interface available in?',
    a: 'The app interface is in English, but chunk translations and examples are available in 12 native languages including Portuguese, Spanish, French, German, Japanese, Korean, Chinese, and more.',
  },
  {
    q: 'What happens if I cancel Premium?',
    a: 'You keep all your saved chunks and flashcard history. Your account reverts to the free plan limits (5 feed lessons/week, 5 YouTube imports/week, 5 music songs/week). No data is deleted.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'The web app is fully responsive and works great on mobile browsers. A dedicated iOS and Android app is on the roadmap — follow the Roadmap page for updates.',
  },
]

function FAQItem({ q, a, index, inView }: { q: string; a: string; index: number; inView: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      className="faq-item"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.07, ease: EASE_OUT }}
    >
      <button
        className="faq-question"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {q}
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          style={{
            flexShrink: 0, fontSize: '1.2rem', fontWeight: 300,
            lineHeight: 1, color: 'var(--clay)',
          }}
          aria-hidden
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            style={{ overflow: 'hidden' }}
          >
            <p className="faq-answer">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })

  return (
    <section className="mkt-section mkt-section-cream">
      <div className="mkt-container">
        <motion.div
          ref={ref}
          style={{ textAlign: 'center', marginBottom: 52 }}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <span className="mkt-eyebrow">FAQ</span>
          <h2 className="mkt-h2">Common questions</h2>
        </motion.div>

        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {FAQS.map((faq, i) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}
