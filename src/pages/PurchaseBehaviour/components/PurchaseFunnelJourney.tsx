import { GitBranch, Route } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { FunnelStep } from '@/data/purchaseBehaviourSelectors'
import { formatNumber, formatPercent } from '@/data/formatters'

function StepList({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="purchase-step-list">
      {steps.map((step, index) => (
        <article key={step.id}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div>
            <header><strong>{step.label}</strong><b>{formatPercent(step.share, 0)}</b></header>
            <ProgressBar value={step.share * 100} tone={index % 2 === 0 ? 'blue' : 'purple'} size="sm" />
            <small>{formatNumber(step.value)} pelanggan</small>
          </div>
        </article>
      ))}
    </div>
  )
}

export default function PurchaseFunnelJourney({ funnel, journey }: { funnel: FunnelStep[]; journey: FunnelStep[] }) {
  return (
    <section className="purchase-behaviour__grid purchase-behaviour__grid--two">
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={GitBranch} title="Purchase Funnel" subtitle="Customer -> high CLV" />
        <StepList steps={funnel} />
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={Route} title="Customer Journey" subtitle="Lifecycle sederhana dari aggregate customer" tone="purple" />
        <StepList steps={journey} />
      </GlassCard>
    </section>
  )
}
