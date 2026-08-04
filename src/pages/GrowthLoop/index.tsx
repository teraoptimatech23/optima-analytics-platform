import { Link } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  Gauge,
  Instagram,
  Lightbulb,
  MapPin,
  Megaphone,
  RefreshCcw,
  MessageSquare,
  Route,
  Sparkles,
  Star,
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
    outcome: 'Read paid, organic, reputation, influencer, and local discovery signals as one traffic system.',
    pages: ['Google Ads', 'Meta Ads', 'YouTube Ads', 'Organic Social', 'Influencer', 'Rating & Review'],
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

const engagementRepLayers = [
  {
    id: 'engagement',
    label: 'Engagement Engine',
    icon: Activity,
    route: '/customer-insights/motivasi-pelanggan',
    role: 'Build relevance and repeat interaction by reading what customers need, feel, and do after acquisition.',
    focus: 'From customer understanding to retained behaviour',
    evidence: [
      { label: 'Motivation', route: '/customer-insights/motivasi-pelanggan', detail: 'Behavioural proxy and survey-aligned motivation signals.' },
      { label: 'Perception', route: '/customer-insights/persepsi-pelanggan', detail: 'Structured perception score and labelled sentiment bands.' },
      { label: 'Journey', route: '/purchase-analytics/customer-journey', detail: 'Stage movement from acquisition to repeat, dormant, and churn risk.' },
      { label: 'Recommendation', route: '/recommendation', detail: 'Targeted action queue with evidence and owner.' },
    ],
  },
  {
    id: 'rep',
    label: 'REP Engine',
    icon: TrendingUp,
    route: '/purchase-analytics/rfm-analysis',
    role: 'Translate retention, expansion, and profitability into measurable customer value loops.',
    focus: 'Repeat order, retention, expansion, and predicted value',
    evidence: [
      { label: 'RFM', route: '/purchase-analytics/rfm-analysis', detail: 'Snapshot segmentation from recency, unique transactions, and monetary value.' },
      { label: 'Cohort', route: '/purchase-analytics/cohort-analysis', detail: 'Weighted retention by first-purchase cohort age and maturity.' },
      { label: 'Churn', route: '/predictive-analytics/churn-prediction', detail: 'Risk score with temporal split, baseline, calibration, and threshold guardrails.' },
      { label: 'CLV', route: '/predictive-analytics/customer-lifetime-value-prediction', detail: 'Historical and predicted value separated by explicit horizon.' },
    ],
  },
]

const actionTrackingStages = [
  {
    id: 'recommendation',
    label: 'Recommendation',
    icon: Target,
    status: 'Connected',
    description: 'Evidence-backed recommendations are already available as the starting point of the action loop.',
    signals: ['Evidence', 'Target', 'Owner', 'Priority'],
  },
  {
    id: 'execution',
    label: 'Execution',
    icon: Activity,
    status: 'Tracking missing',
    description: 'Action events need to capture owner, start date, completion status, cost, and affected scope.',
    signals: ['Action ID', 'Owner', 'Status', 'Window'],
  },
  {
    id: 'result',
    label: 'Result',
    icon: BarChart3,
    status: 'Measurement missing',
    description: 'Outcome windows and before-after KPI evidence are required before impact can be reported.',
    signals: ['KPI Delta', 'Revenue', 'Retention', 'Cost'],
  },
  {
    id: 'learning',
    label: 'Learning Loop',
    icon: RefreshCcw,
    status: 'Feedback planned',
    description: 'Measured outcomes should feed recommendation reliability, prioritization, and model backtests.',
    signals: ['Outcome Label', 'Reliability', 'Backtest', 'Next Priority'],
  },
]

const trafficEngineSources = [
  {
    id: 'paid-media',
    label: 'Paid Media Performance',
    icon: Megaphone,
    status: 'Connected',
    route: '/marketing-analytics/campaign-performance',
    description: 'Google Ads, Meta Ads, YouTube Ads, and cross-channel campaign performance are already represented in the marketing layer.',
    signals: ['Spend', 'Clicks', 'Conversions', 'ROAS'],
  },
  {
    id: 'google-maps-review',
    label: 'Google Maps Review',
    icon: MapPin,
    status: 'Source planned',
    route: '/customer-insights/persepsi-pelanggan',
    description: 'Local discovery, store rating, review volume, review recency, and outlet-level reputation should feed perception and traffic quality.',
    signals: ['Rating', 'Review Volume', 'Recency', 'Outlet Reputation'],
  },
  {
    id: 'organic-social',
    label: 'TikTok / Instagram Organic',
    icon: Instagram,
    status: 'Source planned',
    route: '/marketing-analytics/campaign-performance',
    description: 'Organic reach, engagement, saves, shares, and content velocity should be separated from paid campaign traffic.',
    signals: ['Reach', 'Engagement', 'Shares', 'Content Velocity'],
  },
  {
    id: 'influencer',
    label: 'Influencer & Creator Traffic',
    icon: Users,
    status: 'Source planned',
    route: '/marketing-analytics/attribution',
    description: 'Creator mentions, promo codes, affiliate links, and campaign windows can enrich traffic source classification without claiming causality.',
    signals: ['Creator Mentions', 'Promo Codes', 'Affiliate Links', 'Campaign Window'],
  },
  {
    id: 'rating-review',
    label: 'Rating / Review Intelligence',
    icon: Star,
    status: 'Source planned',
    route: '/customer-insights/persepsi-pelanggan',
    description: 'Structured review attributes should support perception, pain point detection, and outlet prioritization once review data exists.',
    signals: ['Topic Tags', 'Sentiment Label', 'Issue Frequency', 'Outlet Priority'],
  },
  {
    id: 'ugc-word-of-mouth',
    label: 'UGC & Word of Mouth',
    icon: MessageSquare,
    status: 'Source planned',
    route: '/ai-insight',
    description: 'User-generated posts, comments, and community conversation are useful as qualitative demand signals when captured with source reliability.',
    signals: ['Mentions', 'Comments', 'UGC Posts', 'Reliability'],
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
      icon: Database,
      tone: 'data',
    },
    {
      label: 'Revenue Signal',
      value: revenueKpi?.value ?? '-',
      detail: revenueKpi ? `${revenueKpi.change} vs benchmark` : data.scope.periodLabel,
      route: '/',
      icon: TrendingUp,
      tone: 'revenue',
    },
    {
      label: 'Top Customer Need',
      value: topNeed?.label ?? '-',
      detail: topNeed ? `Importance ${topNeed.importance.toFixed(2)} - performance ${topNeed.performance.toFixed(2)}` : 'No active need signal',
      route: '/customer-insights/kebutuhan-pelanggan',
      icon: Users,
      tone: 'need',
    },
    {
      label: 'Priority Friction',
      value: topPain?.title ?? '-',
      detail: topPain ? `${topPain.severity} - ${topPain.impact}` : 'No active pain point',
      route: '/customer-insights/pain-points',
      icon: Gauge,
      tone: 'friction',
    },
    {
      label: 'Next Decision',
      value: topRecommendation?.title ?? '-',
      detail: topRecommendation ? `${topRecommendation.priority} priority - ${topRecommendation.owner}` : 'No recommendation',
      route: '/recommendation',
      icon: Target,
      tone: 'decision',
    },
    {
      label: 'Forecast Layer',
      value: 'Predictive',
      detail: 'Churn, CLV, demand, and sales forecast close the learning loop.',
      route: '/predictive-analytics/sales-forecast',
      icon: BrainCircuit,
      tone: 'forecast',
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
        {evidenceCards(data).map((card) => {
          const Icon = card.icon
          return (
            <Link className="growth-evidence-link" to={card.route} key={card.label} aria-label={`${card.label}: ${card.value}`}>
              <GlassCard interactive={false} className={`growth-evidence-card growth-evidence-card--${card.tone}`}>
                <span className="growth-evidence-card__aura" aria-hidden="true" />
                <span className="growth-evidence-card__beam" aria-hidden="true" />
                <div className="growth-evidence-card__top">
                  <span className="growth-evidence-card__label">{card.label}</span>
                  <span className="growth-evidence-card__icon" aria-hidden="true"><Icon size={18} strokeWidth={1.9} /></span>
                </div>
                <strong>{card.value}</strong>
                <small>{card.detail}</small>
              </GlassCard>
            </Link>
          )
        })}
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

      <GlassCard interactive={false} className="growth-traffic-panel">
        <div className="growth-panel-head">
          <div><span>Traffic Engine Coverage</span><h2>Paid, Organic, Reputation, and Creator Signals</h2></div>
          <small>Organic and review sources are mapped as planned inputs, not fabricated metrics.</small>
        </div>
        <div className="growth-traffic-panel__sources">
          {trafficEngineSources.map((source) => {
            const Icon = source.icon
            return (
              <Link className="growth-traffic-source" to={source.route} key={source.id}>
                <i><Icon size={18} strokeWidth={1.9} /></i>
                <div>
                  <span>{source.status}</span>
                  <strong>{source.label}</strong>
                  <p>{source.description}</p>
                  <small>{source.signals.join(' - ')}</small>
                </div>
              </Link>
            )
          })}
        </div>
        <p className="growth-traffic-panel__note">
          Data layer saat ini sudah mencakup paid campaign analytics. Google Maps review, organic social, influencer, dan rating/review perlu connector atau ingest pipeline sebelum bisa dihitung sebagai metric aktif.
        </p>
      </GlassCard>

      <GlassCard interactive={false} className="growth-action-panel">
        <div className="growth-panel-head">
          <div><span>Action Tracking Loop</span><h2>Recommendation to Execution to Learning</h2></div>
          <small>Execution outcome tracking is mapped as a required layer, not shown as measured impact yet.</small>
        </div>
        <div className="growth-action-panel__summary">
          <div>
            <span>Belum ada action tracking</span>
            <strong>Closed-loop instrumentation is not active yet</strong>
            <p>
              Recommendation generation is available, but execution events, outcome measurement, and feedback learning are not yet captured as one operational loop.
            </p>
          </div>
          <em>{data.recommendations.length} recommendations ready to track</em>
        </div>
        <div className="growth-action-panel__stages">
          {actionTrackingStages.map((stage, index) => {
            const Icon = stage.icon
            return (
              <article className={`growth-action-stage growth-action-stage--${stage.id}`} key={stage.id}>
                <span className="growth-action-stage__index">0{index + 1}</span>
                <i><Icon size={18} strokeWidth={1.9} /></i>
                <div>
                  <em>{stage.status}</em>
                  <strong>{stage.label}</strong>
                  <p>{stage.description}</p>
                  <small>{stage.signals.join(' - ')}</small>
                </div>
              </article>
            )
          })}
        </div>
        <p className="growth-action-panel__note">
          No execution impact or learning uplift is estimated until recommendation actions and outcome windows are logged in the data layer.
        </p>
      </GlassCard>

      <GlassCard interactive={false} className="growth-rep-panel">
        <div className="growth-panel-head">
          <div><span>Engagement / REP Engine</span><h2>BEA Narrative Labels for Retention Analytics</h2></div>
          <small>RFM, Cohort, Journey, Churn, and CLV stay as existing analytics; this layer explains how they work together in the BEA framework.</small>
        </div>
        <div className="growth-rep-panel__tracks">
          {engagementRepLayers.map((layer) => {
            const Icon = layer.icon
            return (
              <article className={`growth-rep-track growth-rep-track--${layer.id}`} key={layer.id}>
                <Link className="growth-rep-track__head" to={layer.route}>
                  <i><Icon size={19} strokeWidth={1.9} /></i>
                  <div>
                    <span>{layer.focus}</span>
                    <strong>{layer.label}</strong>
                    <p>{layer.role}</p>
                  </div>
                </Link>
                <div className="growth-rep-track__evidence">
                  {layer.evidence.map((item) => (
                    <Link to={item.route} key={item.label}>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </Link>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
        <p className="growth-rep-panel__note">
          Narasi BEA ini tidak mengubah data layer atau definisi metric. It gives the existing customer analytics a clearer business role: Engagement keeps customers active; REP measures repeat, retention, expansion, and value creation.
        </p>
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
