import { Lightbulb, ShieldAlert } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerNeedsInsights } from '@/data/customerNeedsSelectors'
import { formatNumber, formatPriority } from '@/data/formatters'

interface NeedsInsightsRecommendationsProps {
  data: CustomerNeedsInsights
}

export default function NeedsInsightsRecommendations({ data }: NeedsInsightsRecommendationsProps) {
  return (
    <section className="customer-needs__grid customer-needs__grid--two" aria-label="Insight dan rekomendasi kebutuhan">
      <GlassCard interactive={false} className="needs-panel needs-insights">
        <SectionTitle icon={Lightbulb} title="Insight Kebutuhan Pelanggan" subtitle="Dihasilkan dari agregasi aktif" />
        <ol>
          {data.insights.map((insight) => <li key={insight}>{insight}</li>)}
        </ol>
      </GlassCard>

      <GlassCard interactive={false} className="needs-panel">
        <SectionTitle icon={ShieldAlert} title="Kebutuhan yang Belum Terpenuhi" subtitle="Importance di atas rata-rata, performance di bawah rata-rata" tone="orange" />
        <div className="unmet-list">
          {data.unmetNeeds.slice(0, 5).map((need) => (
            <article key={need.needId}>
              <header>
                <strong>{need.label}</strong>
                <b>{formatPriority(need.severity)}</b>
              </header>
              <p>{need.relatedPainPoint}</p>
              <small>{formatNumber(need.affectedCustomers)} pelanggan terdampak · {need.affectedLocation}</small>
            </article>
          ))}
        </div>
      </GlassCard>

      <GlassCard interactive={false} className="needs-panel needs-recommendations">
        <SectionTitle icon={ShieldAlert} title="Rekomendasi Prioritas" subtitle="Berangkat dari ranking priority score" tone="purple" />
        <div className="recommendation-grid">
          {data.recommendations.map((item) => (
            <article key={item.needId}>
              <span>{item.priority}</span>
              <strong>{item.issue}</strong>
              <p>{item.evidence}</p>
              <small>{item.action}</small>
            </article>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
