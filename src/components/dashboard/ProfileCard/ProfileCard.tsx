import { ArrowRight, Users } from 'lucide-react'
import Avatar from '@/components/common/Avatar/Avatar'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { ProfileRow } from '@/data/types'
import './ProfileCard.less'

const TONES = ['blue', 'purple', 'cyan', 'orange'] as const

interface ProfileCardProps {
  items: ProfileRow[]
  total: string
}

export default function ProfileCard({ items, total }: ProfileCardProps) {
  return (
    <GlassCard className="profile-card">
      <SectionTitle icon={Users} title="Profil Pelanggan" meta={`Total Responden: ${total}`} />

      <div className="profile-card__list">
        {items.map((item, index) => {
          const tone = TONES[index % TONES.length] ?? 'blue'

          return (
            <article className="profile-row" key={item.label}>
              <Avatar initials={item.label.slice(0, 2).toUpperCase()} tone={tone} />

              <div className="profile-row__copy">
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </div>

              <div className={`profile-row__metric profile-row__metric--${tone}`}>
                <strong>{item.value}%</strong>
                <ProgressBar value={item.value} tone={tone} size="sm" label={`${item.label}: ${item.value}%`} />
              </div>
            </article>
          )
        })}
      </div>

      <button className="card-link" type="button">
        Lihat Semua Profil <ArrowRight size={13} />
      </button>
    </GlassCard>
  )
}
