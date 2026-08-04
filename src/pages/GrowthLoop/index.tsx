import { Link } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  Gauge,
  Lightbulb,
  Megaphone,
  RefreshCcw,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { formatCompactCurrency, formatCompactNumber } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import './index.less'

const loopSteps = [
  {
    id: 'data',
    title: 'Data',
    subtitle: 'Collect the operating truth',
    icon: Database,
    route: '/',
    proof: 'POS, customer, survey, outlet, product, campaign, and media signals.',
  },
  {
    id: 'analysis',
    title: 'Analysis',
    subtitle: 'Turn signals into insight',
    icon: BarChart3,
    route: '/ai-insight',
    proof: 'Needs, pain points, purchase behaviour, journey, cohort, basket, RFM.',
  },
  {
    id: 'decision',
    title: 'Decision',
    subtitle: 'Prioritize the next move',
    icon: Target,
    route: '/recommendation',
    proof: 'Evidence-backed recommendations with risk, target, and action.',
  },
  {
    id: 'value',
    title: 'Value',
    subtitle: 'Create customer and revenue impact',
    icon: Sparkles,
    route: '/marketing-analytics/campaign-performance',
    proof: 'Campaign, conversion, retention, offer, product, and outlet actions.',
  },
  {
    id: 'learning',
    title: 'Learning',
    subtitle: 'Measure, backtest, and repeat',
    icon: RefreshCcw,
    route: '/predictive-analytics/sales-forecast',
    proof: 'Forecast validation, model backtest, attribution, cohort, and repeat loop.',
  },
]

const engines = [
  {
    id: 'customer-insight',
    label: 'Customer Insight',
    icon: Users,
    route: '/customer-insights/profil-pelanggan',
    outcome: 'Understand who buys, what they need, what blocks them, and what motivates them.',
    pages: ['Profil Pelanggan', 'Kebutuhan', 'Pain Points', 'Motivasi', 'Persepsi'],
  },
  {
    id: 'journey',
    label: 'Customer Journey',
    icon: Route,
    route: '/purchase-analytics/customer-journey',
    outcome: 'Map acquisition, first purchase, repeat, loyal, dormant, and churn risk stages.',
    pages: ['Customer Journey', 'Cohort', 'RFM', 'Churn'],
  },
  {
    id: 'traffic',
    label: 'Traffic Engine',
    icon: Megaphone,
    route: '/marketing-analytics/campaign-performance',
    outcome: 'Read paid traffic quality and cross-channel campaign performance.',
    pages: ['Google Ads', 'Meta Ads', 'YouTube Ads', 'Campaign Performance'],
  },
  {
    id: 'conversion',
    label: 'Conversion Engine',
    icon: Gauge,
    route: '/marketing-analytics/attribution',
    outcome: 'Connect traffic, campaign, channel, basket, and conversion value.',
    pages: ['Attribution', 'Market Basket', 'Purchase Behaviour'],
  },
  {
    id: 'engagement',
    label: 'Engagement Engine',
    icon: Activity,
    route: '/customer-insights/motivasi-pelanggan',
    outcome: 'Grow relevance through motivation, perception, membership, and voucher signals.',
    pages: ['Motivasi', 'Persepsi', 'Recommendation'],
  },
  {
    id: 'rep',
    label: 'REP Engine',
    icon: TrendingUp,
    route: '/predictive-analytics/customer-lifetime-value-prediction',
    outcome: 'Drive repeat order, retention, and predictive value with CLV and forecast views.',
    pages: ['CLV Prediction', 'Sales Forecast', 'Demand Forecast', 'Churn Prediction'],
  },
]

function evidenceCards(data: NonNullable<ReturnType<typeof useDashboardStore.getState>['data']>) {
  const revenueKpi = data.kpis.find((item) => item.id === 'revenue')
  const topNeed = data.needs[0]
  const topPain = data.painPoints[0]
  const topRecommendation = data.recommendations[0]

  return [
    {
      label: 'Data Coverage',
      value: formatCompactNumber(data.scope.transactions),
      detail: `${formatCompactNumber(data.scope.customers)} customers - ${data.scope.outlets} outlets`,
      route: '/',
    },
    {
      label: 'Revenue Signal',
      value: revenueKpi?.value ?? '-',
      detail: revenueKpi ? `${revenueKpi.change} vs benchmark` : data.scope.periodLabel,
      route: '/',
    },
    {
      label: 'Top Customer Need',
      value: topNeed?.label ?? '-',
      detail: topNeed ? `Importance ${topNeed.importance.toFixed(2)} - performance ${topNeed.performance.toFixed(2)}` : 'No active need signal',
      route: '/customer-insights/kebutuhan-pelanggan',
    },
    {
      label: 'Priority Friction',
      value: topPain?.title ?? '-',
      detail: topPain ? `${topPain.severity} - ${topPain.impact}` : 'No active pain point',
      route: '/customer-insights/pain-points',
    },
    {
      label: 'Next Decision',
      value: topRecommendation?.title ?? '-',
      detail: topRecommendation ? `${topRecommendation.priority} priority - ${topRecommendation.owner}` : 'No recommendation',
      route: '/recommendation',
    },
    {
      label: 'Forecast Layer',
      value: 'Predictive',
      detail: 'Churn, CLV, demand, and sales forecast close the learning loop.',
      route: '/predictive-analytics/sales-forecast',
    },
  ]
}

export default function GrowthLoop() {
  useInsights()
  const data = useDashboardStore((state) => state.data)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)

  if (loading || (!data && !error)) return <DashboardSkeleton />
  if (error) return <StateMessage icon={Lightbulb} tone="danger" title="Growth Loop gagal dimuat" description={error} />
  if (!data) return <StateMessage icon={Lightbulb} title="Belum ada data Growth Loop" description="Ubah filter global untuk memuat command center." />

  const actionValue = data.recommendations.reduce((sum, item) => {
    const numeric = Number(item.impact.replace(/[^0-9]/g, ''))
    return sum + (Number.isFinite(numeric) ? numeric : 0)
  }, 0)

  return (
    <div className="growth-loop-page">
      <section className="growth-loop-page__hero">
        <div className="hero-copy">
          <span>BEA Framework Layer</span>
          <h1>Growth Loop / DDDVL Command Center <BrainCircuit size={22} strokeWidth={2} /></h1>
          <p>
            Narasi Data Driven Digital Value Loop untuk membaca bisnis BARECA sebagai mesin pertumbuhan: data dikumpulkan,
            dianalisis, diputuskan, dieksekusi menjadi value, lalu dipelajari kembali melalui model dan validator.
          </p>
        </div>
        <div className="growth-loop-page__badge">
          <Sparkles size={16} /> Data - Analysis - Decision - Value - Learning
        </div>
      </section>

      <section className="growth-loop-page__evidence" aria-label="Growth loop evidence summary">
        {evidenceCards(data).map((card) => (
          <Link to={card.route} key={card.label}>
            <GlassCard interactive={false} className="growth-evidence-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.detail}</small>
            </GlassCard>
          </Link>
        ))}
      </section>

      <GlassCard interactive={false} className="growth-loop-map">
        <div className="growth-panel-head">
          <div><span>DDDVL Operating Model</span><h2>From Signal to Compounding Learning</h2></div>
          <small>Setiap node terhubung ke halaman analytics yang sudah berjalan.</small>
        </div>
        <div className="growth-loop-map__steps">
          {loopSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <Link className="growth-loop-step" to={step.route} key={step.id}>
                <span className="growth-loop-step__index">0{index + 1}</span>
                <i><Icon size={19} /></i>
                <strong>{step.title}</strong>
                <em>{step.subtitle}</em>
                <small>{step.proof}</small>
              </Link>
            )
          })}
        </div>
      </GlassCard>

      <section className="growth-loop-page__grid">
        <GlassCard interactive={false} className="growth-engine-panel">
          <div className="growth-panel-head"><div><span>BARECA Growth Engines</span><h2>DDDVL Di Industri BARECA</h2></div></div>
          <div className="growth-engine-panel__list">
            {engines.map((engine) => {
              const Icon = engine.icon
              return (
                <Link to={engine.route} className="growth-engine-row" key={engine.id}>
                  <i><Icon size={18} /></i>
                  <div>
                    <strong>{engine.label}</strong>
                    <p>{engine.outcome}</p>
                    <span>{engine.pages.join(' - ')}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </GlassCard>

        <GlassCard interactive={false} className="growth-decision-panel">
          <div className="growth-panel-head"><div><span>Decision Board</span><h2>Insight to Action</h2></div></div>
          <div className="growth-decision-panel__metrics">
            <article><span>Action Queue</span><strong>{data.recommendations.length}</strong><small>Evidence-backed recommendations</small></article>
            <article><span>Potential Impact Index</span><strong>{formatCompactCurrency(actionValue)}</strong><small>Parsed from active recommendation impacts</small></article>
            <article><span>Learning Backstop</span><strong>4 Models</strong><small>Churn, CLV, Demand, Sales Forecast</small></article>
          </div>
          <ol>
            {data.recommendations.slice(0, 4).map((item) => (
              <li key={item.index}>
                <CheckCircle2 size={16} />
                <div><strong>{item.title}</strong><span>{item.description}</span></div>
              </li>
            ))}
          </ol>
        </GlassCard>
      </section>

      <footer className="growth-loop-page__source">
        Framework reference: BEA DDDVL material. Dashboard implementation: Optima Analytics Platform data, aggregate, insight, recommendation, and predictive layers.
      </footer>
    </div>
  )
}
