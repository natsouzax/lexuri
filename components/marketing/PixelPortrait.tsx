'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const SIZE = 80

// Foto real em pixel art (public/natan_pixel_art.jpeg). Como é uma imagem
// estática, o "piscar" é simulado por uma faixa cor-de-pele sobreposta bem
// em cima dos olhos, que aparece rapidamente e some — não dá pra animar os
// pixels da imagem em si.
export default function PixelPortrait() {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 140)
    }, 3200 + Math.random() * 1800)
    return () => clearInterval(id)
  }, [])

  return (
    // Entrada (uma vez, ao rolar até o footer) num wrapper separado do
    // balanço contínuo — animar `y` nos dois ao mesmo tempo no mesmo
    // elemento faria um brigar com o outro.
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        animate={{ y: [0, -4, 0], rotate: [0, -2, 0, 2, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'relative',
          width: SIZE,
          height: SIZE,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid rgba(255,250,240,0.18)',
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/natan_pixel_art.jpeg"
          alt="Natan, pixel art"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 58%',
            imageRendering: 'pixelated',
            display: 'block',
          }}
        />
        <div
          aria-hidden
          className="pixel-blink-overlay"
          style={{
            position: 'absolute',
            left: '20%',
            right: '20%',
            top: '43%',
            height: '7%',
            background: '#caa27a',
            opacity: blink ? 1 : 0,
            transition: 'opacity 60ms linear',
          }}
        />
      </motion.div>
    </motion.div>
  )
}
