import { AlertTriangle, ArrowRight } from 'lucide-react'
import Badge from '@/components/common/Badge/Badge'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { PainPointRow } from '@/data/types'
import './PainPointCard.less'

const SEVERITY_TONE = {
  Kritis: 'red',
  Tinggi: 'orange',
  Sedang: 'cyan',
} as const

interface PainPointCardProps {
  items: PainPointRow[]
}

export default function PainPointCard({ items }: PainPointCardProps) {
  return (
    <GlassCard className="pain-card">
      <SectionTitle icon={AlertTriangle} title="Pain Points Utama" subtitle="(Berdasarkan Dampak Bisnis)" tone="red" />

      <div className="pain-card__list">
        {items.map(({ title, impact, loss, severity }) => (
          <article className={`pain-row pain-row--${SEVERITY_TONE[severity]}`} key={title}>
            <span className="pain-row__icon">
              <AlertTriangle size={15} strokeWidth={2} />
            </span>

            <div className="pain-row__copy">
              <strong>{title}</strong>
              <span>{impact}</span>
            </div>

            <Badge tone={SEVERITY_TONE[severity]}>{severity}</Badge>

            <div className="pain-row__loss">
              <span>Dampak ke Repeat Purchase</span>
              <strong>{loss}</strong>
            </div>
          </article>
        ))}
      </div>

      <button className="card-link" type="button">
        Lihat Semua Pain Points <ArrowRight size={13} />
      </button>
    </GlassCard>
  )
}
