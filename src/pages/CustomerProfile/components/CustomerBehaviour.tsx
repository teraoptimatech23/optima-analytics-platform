import { Activity, Lightbulb } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerProfileInsights } from '@/data/customerProfileSelectors'
import { formatCurrency, formatDays, formatFrequency, formatPercent } from '@/data/formatters'

interface CustomerBehaviourProps {
  behaviour: CustomerProfileInsights['behaviour']
  insights: string[]
}

export default function CustomerBehaviour({ behaviour, insights }: CustomerBehaviourProps) {
  const metrics = [
    ['Purchase Frequency', formatFrequency(behaviour.avgFrequency)],
    ['Repeat Purchase Rate', formatPercent(behaviour.repeatRate)],
    ['Retention', formatPercent(behaviour.retentionRate)],
    ['Churn', formatPercent(behaviour.churnRate)],
    ['Voucher Usage', formatPercent(behaviour.voucherUsageRate)],
    ['Membership Rate', formatPercent(behaviour.membershipRate)],
    ['Average Recency', formatDays(behaviour.avgRecency)],
    ['Average Basket', formatCurrency(behaviour.avgBasket)],
    ['Items / Transaction', behaviour.avgItemsPerTransaction.toFixed(2).replace('.', ',')],
  ]

  return (
    <section className="customer-profile__grid customer-profile__grid--two" aria-label="Perilaku dan insight otomatis">
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={Activity} title="Perilaku Pelanggan" subtitle="Agregasi filter aktif" />
        <div className="metric-grid">
          {metrics.map(([label, value]) => (
            <article className="metric-tile" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="profile-panel profile-insights-card">
        <SectionTitle icon={Lightbulb} title="Insight Utama" subtitle="Dihasilkan dari agregasi aktif" tone="orange" />
        <ol>
          {insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ol>
      </GlassCard>
    </section>
  )
}
