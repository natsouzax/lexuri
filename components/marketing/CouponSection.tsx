'use client'

import { useState } from 'react'
import Link from 'next/link'

const COUPON = 'LEARN'

const INCLUDED = [
  'Unlimited YouTube & music content',
  'Advanced AI chunk detection',
  'Automated SRS review scheduling',
  'Detailed progress reports',
  'Priority support',
  'Early access to every new feature',
]

export default function CouponSection() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(COUPON).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ border: '2px solid var(--clay)', borderRadius: 24, padding: '36px 32px', background: 'rgba(200,111,74,0.04)', position: 'relative', textAlign: 'center' }}>
        <span style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'var(--clay)', color: '#fff', fontSize: '0.7rem', fontWeight: 900, padding: '4px 16px', borderRadius: 999, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
          2 WEEKS FREE
        </span>

        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Your Premium access coupon
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.7rem', letterSpacing: '0.08em', padding: '14px 28px', borderRadius: 14, border: '2px dashed rgba(255,250,240,0.2)', userSelect: 'all' }}>
            {COUPON}
          </div>
          <button onClick={handleCopy} title="Copy coupon" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 12, border: '1.5px solid var(--line)', background: copied ? 'var(--moss)' : '#fff', color: copied ? '#fff' : 'var(--ink)', fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'background 180ms ease, color 180ms ease', whiteSpace: 'nowrap' }}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
          {INCLUDED.map((item) => (
            <li key={item} style={{ fontSize: '0.86rem', color: 'var(--muted)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--clay)', fontWeight: 900, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>

        <Link href={`/settings/billing?coupon=${COUPON}`} className="btn-primary" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '14px', borderRadius: 14, fontSize: '0.95rem', textDecoration: 'none', boxSizing: 'border-box' }}>
          Activate Premium now →
        </Link>
        <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 12, lineHeight: 1.55 }}>
          No credit card. No commitment. Cancel anytime.
        </p>
      </div>

      <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: '22px 26px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '0.95rem' }}>How to redeem</div>
        {[
          ['1', 'Copy the code above'],
          ['2', 'Click "Activate Premium now"'],
          ['3', 'Paste the code in the coupon field on the billing page'],
          ['4', 'Enjoy 2 weeks of full Premium access'],
        ].map(([step, text]) => (
          <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--clay)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 900, flexShrink: 0 }}>
              {step}
            </span>
            <span style={{ fontSize: '0.87rem', color: 'var(--muted)', lineHeight: 1.6, paddingTop: 3 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
