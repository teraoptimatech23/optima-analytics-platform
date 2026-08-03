import { Coffee, Gem, MapPin, Sofa, Sparkles, Tag, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Badge from '@/components/common/Badge/Badge'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import './PerceptionCard.less'

const ASSOCIATION_ICONS: Record<string, LucideIcon> = {
  Rasa: Coffee,
  Kenyamanan: Sofa,
  Harga: Tag,
  Promo: Tag,
  Lokasi: MapPin,
  'Layanan Cepat': Zap,
  Convenience: Zap,
}

interface PerceptionCardProps {
  traits: string[]
  associations: { label: string; value: string }[]
  /** 0..1 on the Tradisional→Modern axis. */
  positionX: number
  /** 0..1 on the Harga→Premium axis. */
  positionY: number
}

export default function PerceptionCard({ traits, associations, positionX, positionY }: PerceptionCardProps) {
  return (
    <GlassCard className="perception-card">
      <SectionTitle icon={Gem} title="Persepsi Pelanggan" tone="purple" />

      <div className="perception-card__body">
        <section className="perception-card__block">
          <h4 className="perception-card__subtitle">Posisi Brand</h4>

          <div
            className="brand-matrix"
            role="img"
            aria-label={`Posisi brand Kopi Kenangan: ${positionX > 0.5 ? 'modern' : 'tradisional'}, ${positionY > 0.5 ? 'premium' : 'terjangkau'}`}
          >
            <span className="brand-matrix__axis brand-matrix__axis--top">Premium</span>
            <span className="brand-matrix__axis brand-matrix__axis--bottom">Harga</span>
            <span className="brand-matrix__axis brand-matrix__axis--left">Tradisional</span>
            <span className="brand-matrix__axis brand-matrix__axis--right">Modern</span>
            <span
              className="brand-matrix__dot"
              style={{ left: `${positionX * 100}%`, top: `${(1 - positionY) * 100}%` }}
              title="Posisi dihitung dari skor persepsi digital dan harga"
            >
              Kopi<br />Kenangan
            </span>
          </div>

          <span className="card-note">Dihitung dari skor persepsi responden pada slice ini.</span>
        </section>

        <section className="perception-card__block">
          <h4 className="perception-card__subtitle">
            Kepribadian Brand <span>(Top 5)</span>
          </h4>

          <div className="perception-card__traits">
            {traits.map((trait) => (
              <Badge key={trait} tone="purple">{trait}</Badge>
            ))}
          </div>

          <h4 className="perception-card__subtitle perception-card__subtitle--spaced">
            Asosiasi Teratas di Benak Pelanggan
          </h4>

          <div className="perception-card__associations">
            {associations.map(({ label, value }) => {
              const Icon = ASSOCIATION_ICONS[label] ?? Sparkles
              return (
                <article key={label}>
                  <span className="perception-card__bubble">
                    <Icon size={15} strokeWidth={1.9} />
                  </span>
                  <span className="perception-card__association-label">{label}</span>
                  <strong>{value}</strong>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </GlassCard>
  )
}
