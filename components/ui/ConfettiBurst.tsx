'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { EASE_OUT } from '@/lib/easing'

const COLORS = ['#C86F4A', '#46624A', '#F6CA5F', '#BEDCEB', '#D7EAD2']

interface ConfettiBurstProps {
  count?: number
}

export default function ConfettiBurst({ count = 28 }: ConfettiBurstProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        angle: (Math.PI * 2 * i) / count + Math.random() * 0.5,
        distance: 80 + Math.random() * 120,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        delay: Math.random() * 0.15,
      })),
    [count],
  )

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance + 40,
            rotate: p.rotate,
            scale: 0.6,
          }}
          transition={{ duration: 1.1, delay: p.delay, ease: EASE_OUT }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  )
}
