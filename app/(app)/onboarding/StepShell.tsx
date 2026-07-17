'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { EASE_OUT } from '@/lib/easing'

interface StepShellProps {
  stepKey: string
  direction: 1 | -1
  children: ReactNode
}

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

export default function StepShell({ stepKey, direction, children }: StepShellProps) {
  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="onboard-step"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
