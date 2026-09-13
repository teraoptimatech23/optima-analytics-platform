import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Gauge,
  HeartPulse,
  LineChart,
  Megaphone,
  ShieldCheck,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { valueLoopStages } from '@/config/valueLoop'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import './index.less'

const healthScore = 84

const kpiCards = [
  { label: 'Revenue', value: 'Rp4,62B', delta: '18,2%', tone: 'blue', icon: DollarSign, trend: [12, 22, 19, 31, 27, 38, 44, 51, 48, 63, 70] },
  { label: 'Gross Profit', value: 'Rp1,28B', delta: '15,6%', tone: 'purple', icon: Gauge, trend: [18, 26, 22, 31, 35, 42, 39, 48, 54, 50, 62] },
  { label: 'Net Profit', value: 'Rp852M', delta: '12,1%', tone: 'green', icon: Users, trend: [16, 20, 29, 24, 36, 32, 43, 39, 51, 46, 58] },
  { label: 'Profit Margin', value: '18,5%', delta: '0,8 pts', tone: 'orange', icon: BarChart3, trend: [34, 40, 35, 43, 38, 45, 41, 51, 47, 43, 39], negative: true },
  { label: 'Customer Growth', value: '12.845', delta: '15,0%', tone: 'cyan', icon: LineChart, trend: [18, 25, 24, 33, 31, 43, 40, 51, 48, 60, 66] },
  { label: 'Marketing ROI', value: '4,6x', delta: '0,6x', tone: 'pink', icon: TrendingUp, trend: [12, 18, 22, 20, 31, 28, 39, 35, 46, 50, 58] },
]

const engineVisualConfig: Record<string, { number: string; tone: string; statusTone: string }> = {
  'customer-behavior': { number: '1', tone: 'blue', statusTone: 'green' },
  'traffic-acquisition': { number: '2', tone: 'orange', statusTone: 'orange' },
  conversion: { number: '3', tone: 'pink', statusTone: 'pink' },
  engagement: { number: '4', tone: 'cyan', statusTone: 'green' },
  retention: { number: '5', tone: 'green', statusTone: 'violet' },
  analytics: { number: '6', tone: 'violet', statusTone: 'blue' },
  'profit-optimization': { number: '7', tone: 'green', statusTone: 'pink' },
}

const GrowthChartData = [
  { month: 'Jan', revenue: 28, profit: 160 },
  { month: 'Feb', revenue: 31, profit: 185 },
  { month: 'Mar', revenue: 37, profit: 245 },
  { month: 'Apr', revenue: 48, profit: 365 },
  { month: 'May', revenue: 45, profit: 355 },
  { month: 'Jun', revenue: 54, profit: 470 },
]
const FunnelVisualRows = [
  { label: 'Visitors', value: '52.350', rate: '84%', loss: '43.930', lossRate: '(84%)', tone: 'blue', width: 156 },
  { label: 'Add to Cart', value: '8.420', rate: '62%', loss: '5.240', lossRate: '(62%)', tone: 'purple', width: 124 },
  { label: 'Checkout', value: '3.180', rate: '31%', loss: '988', lossRate: '(31%)', tone: 'pink', width: 92 },
  { label: 'Purchase', value: '2.192', rate: '-', loss: '-', lossRate: '', tone: 'green', width: 60 },
]
const ChannelIcons: Record<string, string> = { 'Google Ads': 'G', Instagram: 'IG', TikTok: 'TT', Facebook: 'f', Direct: 'D' }
const RetentionTrend = [78, 84, 82, 88, 92, 96]
const ClvTrend = [118, 135, 142, 158, 171, 182]
const ChartMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

function Sparkline({ points, tone = 'blue' }: { points: number[]; tone?: string }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const coords = points.map((point, index) => {
    const x = (index / Math.max(1, points.length - 1)) * 100
    const y = 44 - ((point - min) / span) * 34
    return `${x},${y}`
  }).join(' ')
  const areaPoints = `0,48 ${coords} 100,48`
  return (
    <svg className={`summary-sparkline summary-sparkline--${tone}`} viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">
      <polygon className="summary-sparkline__area" points={areaPoints} />
      <polyline className="summary-sparkline__line" points={coords} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BusinessMetricCard({ to, accent, label, children }: { to: string; accent: 'growth' | 'leakage' | 'marketing' | 'value'; label: string; children: ReactNode }) {
  return (
    <Link to={to} className={`summary-panel summary-business-card summary-business-card--${accent}`} aria-label={`${label} detail dashboard`}>
      {children}
    </Link>
  )
}

function BusinessMetricCardHeader({ index, title, icon: Icon }: { index: string; title: string; icon: LucideIcon }) {
  return <div className="summary-business-head"><Icon size={15} /><strong>{index}. {title}</strong></div>
}

function BusinessInsightStrip({ icon: Icon, accent = 'green', message, label, value }: { icon: LucideIcon; accent?: 'green' | 'red' | 'blue'; message: string; label?: string; value?: string }) {
  return (
    <div className={`summary-insight-strip summary-insight-strip--${accent}`}>
      <span className="summary-insight-strip__icon"><Icon size={16} /></span>
      <span className="summary-insight-strip__copy"><strong>{message}</strong>{label && <small>{label}</small>}</span>
      {value && <b>{value}</b>}
      <span className="summary-insight-strip__cta"><ArrowRight size={17} /></span>
    </div>
  )
}

const recommendationIcons = [ShoppingCart, Gauge, Megaphone]

function priorityTone(priority: string) {
  const normalized = priority.toLowerCase()
  if (/critical|kritis|high|tinggi/.test(normalized)) return 'high'
  if (/medium|sedang/.test(normalized)) return 'medium'
  return 'low'
}

function impactLabel(impact: string) {
  return /high|tinggi/i.test(impact) ? 'Dampak Tinggi' : /medium|sedang/i.test(impact) ? 'Dampak Sedang' : `Dampak ${impact}`
}

function effortLabel(effort: string) {
  return /^upaya/i.test(effort) ? effort : `Upaya ${effort}`
}
function GrowthComboChart() {
  const width = 322
  const height = 146
  const left = 28
  const right = 34
  const top = 14
  const bottom = 24
  const innerWidth = width - left - right
  const innerHeight = height - top - bottom
  const maxRevenue = 60
  const maxProfit = 700
  const xStep = innerWidth / Math.max(1, GrowthChartData.length - 1)
  const barWidth = 15
  const profitPoints = GrowthChartData.map((item, index) => {
    const x = left + index * xStep
    const y = top + innerHeight - (item.profit / maxProfit) * innerHeight
    return { x, y, item }
  })
  const linePath = profitPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <div className="summary-combo-chart" aria-label="Revenue bar and net profit line chart">
      <div className="summary-chart-legend"><span><i className="is-blue" />Revenue (Rp)</span><span><i className="is-green" />Net Profit (Rp)</span></div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <title>Revenue meningkat dari Januari sampai Juni dan net profit ikut naik.</title>
        {[0, 1, 2, 3].map((tick) => {
          const y = top + (innerHeight / 3) * tick
          return <line key={tick} x1={left} x2={width - right} y1={y} y2={y} className="summary-chart-grid" />
        })}
        {[0, 20, 40, 60].map((tick) => {
          const y = top + innerHeight - (tick / maxRevenue) * innerHeight
          return <text key={tick} x={left - 8} y={y + 4} textAnchor="end" className="summary-chart-axis">{tick}</text>
        })}
        {[0, 200, 400, 600].map((tick) => {
          const y = top + innerHeight - (tick / maxProfit) * innerHeight
          return <text key={tick} x={width - right + 8} y={y + 4} className="summary-chart-axis">{tick === 0 ? '0' : `${tick}M`}</text>
        })}
        {GrowthChartData.map((item, index) => {
          const x = left + index * xStep
          const barHeight = (item.revenue / maxRevenue) * innerHeight
          const y = top + innerHeight - barHeight
          return (
            <g key={item.month}>
              <rect x={x - barWidth / 2} y={y} width={barWidth} height={barHeight} rx="3" className="summary-combo-chart__bar" />
              <text x={x} y={height - 6} textAnchor="middle" className="summary-chart-axis summary-chart-axis--month">{item.month}</text>
            </g>
          )
        })}
        <path d={linePath} className="summary-combo-chart__line" />
        {profitPoints.map((point) => <circle key={point.item.month} cx={point.x} cy={point.y} r="3.4" className="summary-combo-chart__dot" />)}
      </svg>
    </div>
  )
}

function RevenueLeakageFunnel() {
  return (
    <div className="summary-funnel-matrix" aria-label="Revenue leakage funnel">
      <div className="summary-funnel-matrix__right-head">Potential Loss</div>
      {FunnelVisualRows.map((row) => {
        const outer = (170 - row.width) / 2
        const topInset = outer
        const bottomInset = outer + 10
        return (
          <div className="summary-funnel-row" key={row.label}>
            <div className="summary-funnel-stage"><strong>{row.label}</strong><span>{row.value}</span></div>
            <svg className={`summary-funnel-shape summary-funnel-shape--${row.tone}`} viewBox="0 0 170 42" preserveAspectRatio="none" aria-hidden="true">
              <polygon points={`${topInset},0 ${170 - topInset},0 ${170 - bottomInset},42 ${bottomInset},42`} />
            </svg>
            <div className="summary-funnel-loss"><strong>{row.rate}</strong><span>{row.loss}</span>{row.lossRate && <em>{row.lossRate}</em>}</div>
          </div>
        )
      })}
    </div>
  )
}

function MarketingChannelIcon({ channel }: { channel: string }) {
  return <span className={`summary-channel-icon summary-channel-icon--${channel.toLowerCase().replace(/\s+/g, '-')}`}>{ChannelIcons[channel] ?? channel.charAt(0)}</span>
}

function CustomerValueChart() {
  const width = 322
  const height = 148
  const left = 30
  const right = 36
  const top = 16
  const bottom = 24
  const innerWidth = width - left - right
  const innerHeight = height - top - bottom
  const xStep = innerWidth / Math.max(1, ChartMonths.length - 1)
  const retentionPoints = RetentionTrend.map((value, index) => ({ x: left + index * xStep, y: top + innerHeight - ((value - 50) / 50) * innerHeight, value }))
  const clvPoints = ClvTrend.map((value, index) => ({ x: left + index * xStep, y: top + innerHeight - (value / 250) * innerHeight, value }))
  const retentionPath = retentionPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const clvPath = clvPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const clvFill = `${clvPath} L ${left + innerWidth} ${top + innerHeight} L ${left} ${top + innerHeight} Z`

  return (
    <div className="summary-value-chart" aria-label="Retention rate and CLV line chart">
      <div className="summary-chart-legend"><span><i className="is-blue" />Retention Rate (%)</span><span><i className="is-green" />CLV (Rp)</span></div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <title>Retention rate dan CLV meningkat dari Januari sampai Juni.</title>
        {[0, 1, 2, 3].map((tick) => {
          const y = top + (innerHeight / 3) * tick
          return <line key={tick} x1={left} x2={width - right} y1={y} y2={y} className="summary-chart-grid" />
        })}
        {[50, 60, 70, 80, 90, 100].map((tick) => {
          if (tick % 20 !== 0 && tick !== 50) return null
          const y = top + innerHeight - ((tick - 50) / 50) * innerHeight
          return <text key={tick} x={left - 8} y={y + 4} textAnchor="end" className="summary-chart-axis">{tick}%</text>
        })}
        {[0, 50, 100, 150, 200, 250].map((tick) => {
          if (tick % 100 !== 0 && tick !== 250) return null
          const y = top + innerHeight - (tick / 250) * innerHeight
          return <text key={tick} x={width - right + 7} y={y + 4} className="summary-chart-axis">{tick}K</text>
        })}
        <path d={clvFill} className="summary-value-chart__fill" />
        <path d={retentionPath} className="summary-value-chart__line summary-value-chart__line--blue" />
        <path d={clvPath} className="summary-value-chart__line summary-value-chart__line--green" />
        {retentionPoints.map((point, index) => <circle key={`retention-${index}`} cx={point.x} cy={point.y} r="3.4" className="summary-value-chart__dot summary-value-chart__dot--blue" />)}
        {clvPoints.map((point, index) => <circle key={`clv-${index}`} cx={point.x} cy={point.y} r="3.4" className="summary-value-chart__dot summary-value-chart__dot--green" />)}
        {ChartMonths.map((month, index) => <text key={month} x={left + index * xStep} y={height - 6} textAnchor="middle" className="summary-chart-axis summary-chart-axis--month">{month}</text>)}
      </svg>
    </div>
  )
}

export default function Summary() {
  const enginesSectionRef = useRef<HTMLElement | null>(null)
  const conversionCardRef = useRef<HTMLAnchorElement | null>(null)

  useInsights()
  const data = useDashboardStore((state) => state.data)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  useEffect(() => {
    const section = enginesSectionRef.current
    const conversionCard = conversionCardRef.current
    if (!section || !conversionCard) return

    const updateWarningAnchor = () => {
      const sectionRect = section.getBoundingClientRect()
      const cardRect = conversionCard.getBoundingClientRect()
      const center = cardRect.left + cardRect.width / 2 - sectionRect.left
      section.style.setProperty('--engine-alert-x', `${center}px`)
    }

    updateWarningAnchor()
    const frame = window.requestAnimationFrame(updateWarningAnchor)
    const timers = [120, 420, 900].map((delay) => window.setTimeout(updateWarningAnchor, delay))
    const observer = new ResizeObserver(updateWarningAnchor)
    const grid = section.querySelector('.summary-engine-grid')
    observer.observe(section)
    observer.observe(conversionCard)
    if (grid) observer.observe(grid)
    window.addEventListener('resize', updateWarningAnchor)
    grid?.addEventListener('scroll', updateWarningAnchor, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
      observer.disconnect()
      window.removeEventListener('resize', updateWarningAnchor)
      grid?.removeEventListener('scroll', updateWarningAnchor)
    }
  })
  if (loading || (!data && !error)) return <DashboardSkeleton />
  if (error) return <StateMessage icon={AlertTriangle} tone="danger" title="Summary gagal dimuat" description={error} />
  if (!data) return <StateMessage icon={AlertTriangle} title="Belum ada data Summary" description="Ubah filter global untuk memuat executive summary." />

  const topInsight = data.kpiSummary.find((row) => row.onTarget) ?? data.kpiSummary[0]
  const riskInsight = data.painPoints[0]
  const period = data.scope.periodLabel
  const priorityRecommendations = data.recommendations.slice(0, 3)
  const highImpactCount = priorityRecommendations.filter((item) => /high|tinggi/i.test(item.impact)).length
  const executiveImpactText = highImpactCount > 0
    ? `${highImpactCount} high impact`
    : `${priorityRecommendations.length} priorities`


  return (
    <div className="summary-page">
      <section className="summary-hero-grid" aria-label="Business health overview">
        <article className="summary-health-card">
          <div className="summary-card-title">Business Health Score <span title="Weighted executive health score">i</span></div>
          <div className="summary-gauge" style={{ '--score': healthScore } as React.CSSProperties}>
            <div className="summary-gauge__arc" />
            <strong>{healthScore}</strong><span>/100</span>
          </div>
          <div className="summary-health-card__status"><CheckCircle2 size={15} /> Healthy & Growing</div>
          <small>+4 pts vs Kuartal Lalu</small>
          <em title="Main drag: Conversion (-7 pts)"><AlertTriangle size={13} /> Conversion menjadi hambatan utama -7 pts</em>
        </article>

        <div className="summary-kpi-strip">
          {kpiCards.map((card) => {
            const Icon = card.icon
            return (
              <article className={`summary-kpi summary-kpi--${card.tone}`} key={card.label}>
                <div className="summary-kpi__head"><i><Icon size={16} /></i><span>{card.label}</span></div>
                <div className="summary-kpi__value">
                  <strong>{card.value}</strong>
                  <small className={card.negative ? 'is-negative' : ''}>{card.negative ? '-' : '+'}{card.delta}</small>
                </div>
                <em>vs Kuartal Lalu</em>
                <div className="summary-kpi__chart"><Sparkline points={card.trend} tone={card.tone} /></div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="summary-engines" aria-label="Data-Driven Digital Value Loop" ref={enginesSectionRef}>
        <div className="summary-engines__header">
          <div className="summary-engines__title">Data-Driven Digital Value Loop <span title="Seven loops from customer behavior to profit optimization">i</span></div>
          <div className="summary-engine-stepper" aria-hidden="true">
            <span className="summary-engine-stepper__warning">!</span>
          </div>
        </div>
        <div className="summary-engine-grid">
          {valueLoopStages.map((engine, index) => {
            const Icon = engine.icon
            const visual = engineVisualConfig[engine.id] ?? { number: `${index + 1}`, tone: engine.tone, statusTone: engine.tone }
            const needsAttention = /attention|critical|kritis/i.test(engine.status)
            return (
              <div className="summary-engine-item" key={engine.id}>
                <Link className={`summary-engine summary-engine--${visual.tone}${needsAttention ? ' is-drag' : ''}`} to={engine.route} ref={engine.id === 'conversion' ? conversionCardRef : undefined}>
                  <b className="summary-engine__number">{visual.number}</b>
                  <div className="summary-engine__head"><Icon size={30} /><strong>{engine.label}</strong></div>
                  <div className="summary-engine__score"><span>{engine.score}</span><small>/100</small></div>
                  <em className={`summary-engine__status summary-engine__status--${visual.statusTone}`}>{engine.status}</em>
                  <div className="summary-engine__kpi"><strong>{engine.primaryKpi}</strong><Sparkline points={engine.trend} tone={visual.tone} /></div>
                  <p><span>{engine.insight}</span><small>{engine.recommendation}</small></p>
                  <i className="summary-engine__cta"><ArrowRight size={17} /></i>
                </Link>
                {index < valueLoopStages.length - 1 && <span className="summary-engine-connector" aria-hidden="true"><ArrowRight size={25} /></span>}
              </div>
            )
          })}
        </div>
      </section>
      <section className="summary-bottom-grid" aria-label="Executive action summary">
        <Link to="/value-loop/analytics?view=ai-insight" className="summary-panel summary-list-panel summary-action-panel" aria-label="Buka semua key insights">
          <h3>Key Insights</h3>
          <ul>
            <li className="summary-insight-row summary-insight-row--green"><LineChart size={18} /><span>{topInsight?.label ?? 'Revenue'} membaik pada periode {period}.</span></li>
            <li className="summary-insight-row summary-insight-row--pink"><ShoppingCart size={18} /><span>{riskInsight?.title ?? 'Conversion drop-off terbesar terjadi di checkout.'}</span></li>
            <li className="summary-insight-row summary-insight-row--green"><HeartPulse size={18} /><span>Retention dan engagement pelanggan berada pada level kuat.</span></li>
          </ul>
          <span className="summary-insight-context">3 insights aktif | {period}</span>
          <span className="summary-bottom-cta">Lihat semua insight <ArrowRight size={14} /></span>
        </Link>

        <Link to="/value-loop/analytics?view=recommendations" className="summary-panel summary-rec-panel summary-action-panel" aria-label="Buka priority recommendations">
          <h3>Priority Recommendations</h3>
          {priorityRecommendations.map((item, index) => {
            const Icon = recommendationIcons[index] ?? Target
            const tone = priorityTone(item.priority)
            return (
              <div className={`summary-rec summary-rec--${tone}`} key={item.index}>
                <b>{index + 1}</b>
                <Icon size={19} />
                <div><strong>{item.title}</strong><span>{item.description}</span></div>
                <em>{impactLabel(item.impact)}<small>{effortLabel(item.effort)}</small></em>
                <i>{item.priority}</i>
                <ArrowRight className="summary-rec__cue" size={14} />
              </div>
            )
          })}
          <span className="summary-bottom-cta">Lihat semua rekomendasi <ArrowRight size={14} /></span>
        </Link>

        <article className="summary-panel summary-executive">
          <h3>Executive Summary</h3>
          <div className="summary-executive__intro">
            <ShieldCheck size={52} />
            <div>
              <strong><span>Healthy & Growing</span><b>{healthScore}/100</b></strong>
              <p>Conversion adalah loop yang perlu perhatian. Prioritaskan optimasi checkout dan channel ber-ROAS tinggi untuk meningkatkan customer value dan profit growth.</p>
            </div>
          </div>
          <div className="summary-impact"><span>{highImpactCount > 0 ? "High-Impact Opportunities" : "Priority Opportunities"}</span><b>{executiveImpactText}</b></div>
          <div className="summary-executive__stats">
            <span><small>Health Score</small><b>{healthScore}<em>/100</em></b><i>Healthy</i></span>
            <span><small>Loop Priority</small><b>Conversion</b><i>Needs Attention</i></span>
            <span><small>Data Sources</small><b>7 Schemas</b><i>Adapter Ready</i></span>
          </div>
        </article>
      </section>
    </div>
  )
}
