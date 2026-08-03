import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import './Button.less'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'glass' | 'primary' | 'ghost'
}

export default function Button({ children, className, variant = 'glass', type = 'button', ...props }: ButtonProps) {
  return (
    <button className={clsx('ui-button', `ui-button--${variant}`, className)} type={type} {...props}>
      {children}
    </button>
  )
}
