import { Clock, Link2 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MarketBasketRow } from '@/data/purchaseBehaviourSelectors'
import { formatPercent, formatScore } from '@/data/formatters'

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function PurchaseTimeAndBasket({ heatmap, peakHour, peakDay, basket }: { heatmap: number[][]; peakHour: string; peakDay: string; basket: MarketBasketRow[] }) {
  const max = Math.max(1, ...heatmap.flat())
  return (
    <section className="purchase-behaviour__grid purchase-behaviour__grid--two">
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={Clock} title="Time Analysis" subtitle={`Peak: ${peakDay} ${peakHour}`} />
        <div className="purchase-heatmap">
          {heatmap.map((row, dayIndex) => (
            <div className="purchase-heatmap__row" key={DAYS[dayIndex]}>
              <strong>{DAYS[dayIndex]}</strong>
              {row.map((value, hour) => (
                <span key={hour} title={`${DAYS[dayIndex]} ${String(hour).padStart(2, '0')}.00: ${value.toLocaleString('id-ID')} tx`} style={{ opacity: 0.22 + (value / max) * 0.78 }} />
              ))}
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={Link2} title="Market Basket Analysis" subtitle="Association sederhana antar kategori" tone="purple" />
        <div className="basket-list">
          {basket.map((row) => (
            <article key={row.pair}>
              <header><strong>{row.pair}</strong><b>Lift {formatScore(row.lift, 1)}</b></header>
              <ProgressBar value={row.lift} max={Math.max(1, ...basket.map((item) => item.lift))} tone="purple" size="sm" />
              <small>Support {formatPercent(row.support)} · Confidence {formatPercent(row.confidence)}</small>
            </article>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
