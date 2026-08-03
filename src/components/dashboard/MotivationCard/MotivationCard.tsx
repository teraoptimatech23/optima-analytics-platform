import { Coffee, Heart, MapPin, ShieldCheck, Star, Tag, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MotivationRow } from '@/data/types'
import './MotivationCard.less'

const SCALE_MAX = 5
const TONES = ['blue', 'purple', 'cyan', 'orange'] as const

// Icon per driver, falling back to a star for anything not mapped.
const ICONS: Record<string, LucideIcon> = {
  Rasa: Star,
  Harga: Tag,
  Convenience: Zap,
  Lokasi: MapPin,
  'Brand Trust': ShieldCheck,
  'Menu Seasonal': Coffee,
}

const formatScore = (score: number) => score.toFixed(1).replace('.', ',')

interface MotivationCardProps {
  items: MotivationRow[]
}

export default function MotivationCard({ items }: MotivationCardProps) {
  return (
    <GlassCard className="motivation-card">
      <SectionTitle icon={Heart} title="Pendorong Motivasi" tone="cyan" />

      <div className="motivation-card__list">
        {items.map((item, index) => {
          const Icon = ICONS[item.label] ?? Star
          const tone = TONES[index % TONES.length] ?? 'blue'

          return (
            <div className={`motivation-row motivation-row--${tone}`} key={item.label}>
              <span className="motivation-row__icon">
                <Icon size={14} strokeWidth={2} />
              </span>
              <strong className="motivation-row__label">{item.label}</strong>
              <ProgressBar
                value={item.value}
                max={SCALE_MAX}
                tone={tone}
                size="sm"
                label={`${item.label}: ${item.value} dari ${SCALE_MAX}`}
              />
              <em className="motivation-row__value">{formatScore(item.value)}</em>
            </div>
          )
        })}
      </div>

      <span className="card-note motivation-card__note">Skala: 1 (Rendah) – 5 (Tinggi)</span>
    </GlassCard>
  )
}
