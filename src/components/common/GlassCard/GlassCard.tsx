import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import clsx from 'clsx'
import './GlassCard.less'

interface GlassCardProps extends HTMLMotionProps<'section'> {
  children: ReactNode
  /** Disables the hover lift for cards that are purely decorative containers. */
  interactive?: boolean
  /** Slightly denser padding, used by the compact KPI row. */
  compact?: boolean
}

export default function GlassCard({
  className,
  children,
  interactive = true,
  compact = false,
  ...props
}: GlassCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      className={clsx('glass-card', compact && 'glass-card--compact', className)}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 0.68, 0.32, 1] }}
      whileHover={interactive && !reduceMotion ? { y: -2 } : undefined}
      {...props}
    >
      {children}
    </motion.section>
  )
}
