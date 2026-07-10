'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { playSelect } from '@/lib/sfx'

interface DuoOptionProps {
  selected: boolean
  onSelect: () => void
  label: string
  icon?: ReactNode
  sublabel?: string
  variant?: 'option' | 'goal'
}

const VARIANT_CLASS: Record<NonNullable<DuoOptionProps['variant']>, string> = {
  option: 'onboard-option',
  goal: 'onboard-goal',
}

export default function DuoOption({ selected, onSelect, label, icon, sublabel, variant = 'option' }: DuoOptionProps) {
  const baseClass = VARIANT_CLASS[variant]
  return (
    <motion.button
      type="button"
      className={`${baseClass}${selected ? ' selected' : ''}`}
      onClick={() => { playSelect(); onSelect() }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.12 }}
    >
      {icon && <span className="onboard-goal-icon">{icon}</span>}
      <span>{label}</span>
      {sublabel && <span className="onboard-level-desc">{sublabel}</span>}
    </motion.button>
  )
}
