import { ArrowRight, Brain } from 'lucide-react'
import type { NeedRow } from '@/data/types'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import './NeedsCard.less'

const SCALE_MAX = 5

const formatScore = (score: number) => score.toFixed(1).replace('.', ',')
const formatGap = (gap: number) => (gap > 0 ? '+' : '') + gap.toFixed(1).replace('.', ',')

interface NeedsCardProps {
  items: NeedRow[]
}

export default function NeedsCard({ items }: NeedsCardProps) {
  return (
    <GlassCard className="needs-card">
      <SectionTitle icon={Brain} title="Kebutuhan Pelanggan" subtitle="(Importance vs Performance)" tone="purple" />

      <div className="needs-card__legend">
        <span className="needs-card__key needs-card__key--perf">Performance</span>
        <span className="needs-card__key needs-card__key--imp">Importance (target)</span>
      </div>

      <div className="needs-card__list">
        {items.map(({ key, label, icon: Icon, importance, performance }) => {
          const gap = performance - importance
          const tone = gap <= -0.15 ? 'behind' : gap >= 0.15 ? 'ahead' : 'even'

          return (
            <div className={`needs-row needs-row--${tone}`} key={key}>
              <span className="needs-row__icon">
                <Icon size={15} strokeWidth={1.9} />
              </span>

              <div className="needs-row__copy">
                <strong className="needs-row__label">{label}</strong>
                <span className="needs-row__scores">
                  Performance <b>{formatScore(performance)}</b> · Target <b>{formatScore(importance)}</b>
                </span>
              </div>

              {/* One track on the 1–5 scale: the fill is what customers get,
                  the marker is what they expect. The distance is the gap. */}
              <div
                className="needs-meter"
                title={`${label} — performance ${formatScore(performance)}, importance ${formatScore(importance)}, gap ${formatGap(gap)}`}
              >
                <span className="needs-meter__fill" style={{ width: `${(performance / SCALE_MAX) * 100}%` }} />
                <span className="needs-meter__target" style={{ left: `${(importance / SCALE_MAX) * 100}%` }} />
              </div>

              <em className="needs-row__gap">{formatGap(gap)}</em>
            </div>
          )
        })}
      </div>

      <footer className="needs-card__footer">
        <span className="card-note">Skala 1–5 · gap = performance dikurangi importance</span>
        <button className="card-link needs-card__link" type="button">
          Lihat Semua Kebutuhan <ArrowRight size={13} />
        </button>
      </footer>
    </GlassCard>
  )
}
