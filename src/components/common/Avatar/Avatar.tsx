import clsx from 'clsx'
import './Avatar.less'

interface AvatarProps {
  initials: string
  tone?: 'blue' | 'purple' | 'cyan' | 'orange'
}

export default function Avatar({ initials, tone = 'blue' }: AvatarProps) {
  return <span className={clsx('avatar', `avatar--${tone}`)}>{initials}</span>
}
