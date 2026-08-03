import { useEffect, useMemo, useState } from 'react'
import {
  BadgeInfo,
  CircleDollarSign,
  GitBranch,
  Info,
  RefreshCcw,
  SearchCheck,
  SlidersHorizontal,
  TriangleAlert,
  Users,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultRFMLocalFilters,
  queryRFMAnalysis,
} from '@/data/rfmSelectors'
import type { RFMAnalysisInsights, RFMLocalFilters, RFMJson, RFMKpi } from '@/data/rfmSelectors'
import type { RFMScore } from '@/config/rfmConfig'
import { formatCompactCurrency, formatCompactNumber, formatCurrency, formatDays, formatFrequency, formatPercent } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const kpiIcons = [Users, SearchCheck, GitBranch, CircleDollarSign]

function formatKpi(card: RFMKpi) {
  if (card.display === 'currency') return formatCompactCurrency(card.value)
  if (card.display === 'days') return formatDays(card.value)
  if (card.display === 'frequency') return `${formatFrequency(card.value)} transaksi`
  if (card.display === 'percent') return formatPercent(card.value)
  return formatCompactNumber(card.value)
}

function SummaryCards({ data }: { data: RFMAnalysisInsights }) {
  return (
    <section className="rfm-summary" aria-label="RFM KPI summary">
      {data.kpis.map((card, index) => {
        const Icon = kpiIcons[index % kpiIcons.length]!
        return (
          <GlassCard interactive={false} className={`rfm-kpi rfm-kpi--${card.tone}`} key={card.id}>
            <span className="rfm-kpi__icon"><Icon size={18} /></span>
            <span>{card.label}</span>
            <strong>{formatKpi(card)}</strong>
            <small>{card.detail}</small>
            {card.delta !== undefined && (
              <em>{card.delta > 0 ? '+' : ''}{card.display === 'percent' ? formatPercent(card.delta) : card.delta.toFixed(1).replace('.', ',')} vs previous</em>
            )}
          </GlassCard>
        )
      })}
    </section>
  )
}

function SegmentDistribution({ data }: { data: RFMAnalysisInsights }) {
  const max = Math.max(...data.segments.map((row) => row.customerCount), 1)
  return (
    <GlassCard interactive={false} className="rfm-panel rfm-segments">
      <div className="rfm-panel__head">
        <div><span>Mutually Exclusive</span><h2>RFM Segment Distribution</h2></div>
        <small>Customer share, revenue contribution, dan value concentration.</small>
      </div>
      <div className="rfm-segments__rows">
        {data.segments.map((row) => (
          <article key={row.segmentId}>
            <div>
              <strong>{row.label}</strong>
              <span>{formatCompactNumber(row.customerCount)} pelanggan - {formatPercent(row.customerShare)} share</span>
            </div>
            <i style={{ width: `${Math.max(3, (row.customerCount / max) * 100)}%` }} />
            <dl>
              <div><dt>Avg Recency</dt><dd>{formatDays(row.averageRecency)}</dd></div>
              <div><dt>Avg Frequency</dt><dd>{formatFrequency(row.averageFrequency)}</dd></div>
              <div><dt>Avg Monetary</dt><dd>{formatCompactCurrency(row.averageMonetary)}</dd></div>
              <div><dt>Revenue Share</dt><dd>{formatPercent(row.revenueShare)}</dd></div>
              <div><dt>VCI</dt><dd>{row.valueConcentrationIndex.toFixed(2).replace('.', ',')}x</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function RFMMatrix({ data }: { data: RFMAnalysisInsights }) {
  const maxMetric = Math.max(...data.matrix.map((cell) => data.summary.eligibleCustomers ? cell.customerCount : 0), 1)
  return (
    <GlassCard interactive={false} className="rfm-panel rfm-matrix">
      <div className="rfm-panel__head">
        <div><span>R x F</span><h2>RFM Matrix</h2></div>
        <small>Y = Recency score, X = Frequency score, bubble = customer count.</small>
      </div>
      <div className="rfm-matrix__grid" role="img" aria-label="RFM matrix by recency and frequency score">
        {[5, 4, 3, 2, 1].map((rScore) => (
          [1, 2, 3, 4, 5].map((fScore) => {
            const cell = data.matrix.find((item) => item.rScore === rScore && item.fScore === fScore)
            const size = Math.max(22, Math.sqrt((cell?.customerCount ?? 0) / maxMetric) * 64)
            return (
              <div className="rfm-matrix__cell" key={`${rScore}-${fScore}`}>
                <button type="button" title={`R${rScore} F${fScore}: ${cell?.customerCount ?? 0} pelanggan, top segment ${cell?.topSegment ?? '-'}`}>
                  <span style={{ width: size, height: size }}>{cell?.customerCount ? formatCompactNumber(cell.customerCount) : '-'}</span>
                </button>
              </div>
            )
          })
        ))}
      </div>
      <div className="rfm-matrix__axis"><span>Frequency score 1 to 5</span><span>Recency score 5 at top</span></div>
    </GlassCard>
  )
}

function DistributionTable({ title, rows }: { title: string; rows: RFMAnalysisInsights['recencyDistribution'] }) {
  return (
    <GlassCard interactive={false} className="rfm-panel rfm-table-card">
      <div className="rfm-panel__head"><div><span>Distribution</span><h2>{title}</h2></div></div>
      <div className="rfm-table-wrap">
        <table className="rfm-table">
          <thead>
            <tr>
              <th>Bucket</th>
              <th>Customers</th>
              <th>Share</th>
              <th>Avg F</th>
              <th>Avg M</th>
              <th>Top Segment</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bucket}>
                <td><strong>{row.bucket}</strong></td>
                <td>{formatCompactNumber(row.customerCount)}</td>
                <td>{formatPercent(row.customerShare)}</td>
                <td>{formatFrequency(row.averageFrequency)}</td>
                <td>{formatCompactCurrency(row.averageMonetary)}</td>
                <td>{row.topSegment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function ScoreDistribution({ data }: { data: RFMAnalysisInsights }) {
  return (
    <GlassCard interactive={false} className="rfm-panel rfm-score-dist">
      <div className="rfm-panel__head">
        <div><span>Score 1-5</span><h2>RFM Score Distribution</h2></div>
        <small>R score 5 berarti paling baru membeli.</small>
      </div>
      {data.scoreDistribution.map((row) => (
        <article key={row.score}>
          <strong>Score {row.score}</strong>
          <div><span>R</span><i style={{ width: `${Math.max(2, row.recencyShare * 100)}%` }} /><b>{formatCompactNumber(row.recency)}</b></div>
          <div><span>F</span><i style={{ width: `${Math.max(2, row.frequencyShare * 100)}%` }} /><b>{formatCompactNumber(row.frequency)}</b></div>
          <div><span>M</span><i style={{ width: `${Math.max(2, row.monetaryShare * 100)}%` }} /><b>{formatCompactNumber(row.monetary)}</b></div>
        </article>
      ))}
    </GlassCard>
  )
}

function Comparison({ data }: { data: RFMAnalysisInsights }) {
  return (
    <GlassCard interactive={false} className="rfm-panel rfm-table-card">
      <div className="rfm-panel__head">
        <div><span>Profile</span><h2>RFM by Comparison Dimension</h2></div>
      </div>
      <div className="rfm-table-wrap">
        <table className="rfm-table">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Customers</th>
              <th>Champions</th>
              <th>At Risk</th>
              <th>Lost</th>
              <th>Avg Recency</th>
              <th>Avg Monetary</th>
              <th>Top Segment</th>
            </tr>
          </thead>
          <tbody>
            {data.comparisonRows.slice(0, 10).map((row) => (
              <tr key={row.id}>
                <td><strong>{row.label}</strong></td>
                <td>{formatCompactNumber(row.customerCount)}</td>
                <td>{formatPercent(row.championsShare)}</td>
                <td>{formatPercent(row.atRiskShare)}</td>
                <td>{formatPercent(row.lostShare)}</td>
                <td>{formatDays(row.averageRecency)}</td>
                <td>{formatCompactCurrency(row.averageMonetary)}</td>
                <td>{row.topSegment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function MovementAndCustomers({ data }: { data: RFMAnalysisInsights }) {
  return (
    <div className="rfm-grid rfm-grid--two">
      <GlassCard interactive={false} className="rfm-panel rfm-transitions">
        <div className="rfm-panel__head"><div><span>Previous Snapshot</span><h2>Segment Movement</h2></div></div>
        {data.transitions.map((row) => (
          <article key={`${row.sourceSegmentId}-${row.targetSegmentId}-${row.movement}`}>
            <div><span>{row.sourceLabel}</span><strong>{row.targetLabel}</strong></div>
            <b>{formatCompactNumber(row.customerCount)}</b>
            <small>{row.movement} - {formatPercent(row.transitionShare)}</small>
          </article>
        ))}
      </GlassCard>
      <GlassCard interactive={false} className="rfm-panel rfm-table-card">
        <div className="rfm-panel__head"><div><span>Synthetic ID</span><h2>Customer RFM Explorer</h2></div><small>Top 250 by RFM score and monetary.</small></div>
        <div className="rfm-table-wrap">
          <table className="rfm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>RFM</th>
                <th>Segment</th>
                <th>Recency</th>
                <th>Frequency</th>
                <th>Monetary</th>
                <th>Channel</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.slice(0, 12).map((row) => (
                <tr key={row.customerId}>
                  <td><strong>{row.customerId}</strong></td>
                  <td>{row.rfmCode}</td>
                  <td>{row.segmentLabel}</td>
                  <td>{formatDays(row.recencyDays)}</td>
                  <td>{formatCompactNumber(row.transactionCount)}</td>
                  <td>{formatCurrency(row.monetary)}</td>
                  <td>{row.preferredChannel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

function Notes({ data }: { data: RFMAnalysisInsights }) {
  return (
    <div className="rfm-grid rfm-grid--two">
      <GlassCard interactive={false} className="rfm-panel rfm-notes">
        <div className="rfm-panel__head"><div><span>Detected Signals</span><h2>RFM Insights</h2></div></div>
        <ol>{data.insights.map((insight) => <li key={insight}>{insight}</li>)}</ol>
      </GlassCard>
      <GlassCard interactive={false} className="rfm-panel rfm-notes">
        <div className="rfm-panel__head"><div><span>Guardrails</span><h2>Methodology</h2></div></div>
        <ol>{data.methodology.map((note) => <li key={note}>{note}</li>)}</ol>
      </GlassCard>
    </div>
  )
}

function Actions({ data }: { data: RFMAnalysisInsights }) {
  return (
    <GlassCard interactive={false} className="rfm-panel rfm-actions">
      <div className="rfm-panel__head">
        <div><span>Decision Support</span><h2>Recommended RFM Actions</h2></div>
        <small>Tanpa klaim uplift otomatis.</small>
      </div>
      <div className="rfm-actions__grid">
        {data.recommendations.map((row) => (
          <article key={`${row.segmentId}-${row.title}`} className={`rfm-action rfm-action--${row.priority}`}>
            <span>{row.priority}</span>
            <h3>{row.title}</h3>
            <p>{row.evidence}</p>
            <strong>{row.action}</strong>
            <small>{row.preferredChannel} - {row.preferredProduct} - {row.reliabilityNote}</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

export default function RFMAnalysis() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<RFMLocalFilters>(defaultRFMLocalFilters)
  const [rfmData, setRfmData] = useState<RFMJson | null>(null)
  const [rfmError, setRfmError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    fetch('/assets/rfmAnalysis.json')
      .then((response) => {
        if (!response.ok) throw new Error(`RFM aggregate gagal dimuat (${response.status})`)
        return response.json() as Promise<RFMJson>
      })
      .then((payload) => {
        if (active) setRfmData(payload)
      })
      .catch((fetchError: unknown) => {
        if (active) setRfmError(fetchError instanceof Error ? fetchError.message : 'RFM aggregate gagal dimuat')
      })
    return () => {
      active = false
    }
  }, [])
  const data = useMemo(() => (cube && rfmData ? queryRFMAnalysis(rfmData, filters, localFilters) : null), [cube, rfmData, filters, localFilters])
  const setLocal = <K extends keyof RFMLocalFilters>(key: K, value: RFMLocalFilters[K]) => setLocalFilters((state) => ({ ...state, [key]: value }))

  let body
  if (loading || (!data && !error && !rfmError)) {
    body = <DashboardSkeleton />
  } else if (error || rfmError) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error ?? rfmError ?? 'Unknown error'} />
  } else if (!data || data.summary.eligibleCustomers === 0) {
    body = (
      <StateMessage
        icon={Users}
        title="Tidak ada pelanggan dengan transaksi valid untuk kombinasi filter ini."
        description="Perluas periode, gunakan observation window lebih panjang, reset filter, atau pilih semua outlet/channel."
        action={<button className="rfm-button" type="button" onClick={() => setLocalFilters(defaultRFMLocalFilters)}>Reset RFM Filters</button>}
      />
    )
  } else {
    body = (
      <>
        {data.insufficientSample && (
          <StateMessage
            icon={Info}
            title="Histori transaksi belum cukup untuk membentuk segment RFM yang andal."
            description="Sample masih di bawah minimum. Perluas periode atau gunakan scope yang lebih luas."
          />
        )}
        <SummaryCards data={data} />
        <div className="rfm-grid rfm-grid--two">
          <SegmentDistribution data={data} />
          <RFMMatrix data={data} />
        </div>
        <div className="rfm-grid rfm-grid--three">
          <DistributionTable title="Recency Distribution" rows={data.recencyDistribution} />
          <DistributionTable title="Frequency Distribution" rows={data.frequencyDistribution} />
          <DistributionTable title="Monetary Distribution" rows={data.monetaryDistribution} />
        </div>
        <div className="rfm-grid rfm-grid--two">
          <ScoreDistribution data={data} />
          <Comparison data={data} />
        </div>
        <MovementAndCustomers data={data} />
        <Actions data={data} />
        <Notes data={data} />
      </>
    )
  }

  return (
    <div className="rfm-analysis">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat RFM Analysis' : data ? `${data.summary.eligibleCustomers} eligible customers dianalisis` : 'RFM Analysis siap'}
      </p>
      <section className="rfm-analysis__hero">
        <div className="hero-copy">
          <span>Purchase Analytics</span>
          <h1>
            RFM Analysis
            <SearchCheck size={23} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.summary.periodLabel} - Analysis Date: ${data.summary.analysisDate} - Observation Window: ${data.summary.observationWindowLabel} - ${formatCompactNumber(data.summary.eligibleCustomers)} eligible customers. Segmentasikan pelanggan berdasarkan recency, frequency, dan monetary untuk memahami loyalitas, nilai pelanggan, serta peluang aktivasi.`
              : 'Segmentasikan pelanggan berdasarkan recency, frequency, dan monetary untuk memahami loyalitas, nilai pelanggan, serta peluang aktivasi.'}
          </p>
        </div>
        <div className="rfm-analysis__badge" title="Segmentasi RFM menggambarkan perilaku transaksi historis dan bukan prediksi pasti terhadap perilaku masa depan.">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Transaction Dataset</span>
          <Info size={14} />
        </div>
      </section>

      {data && (
        <section className="rfm-analysis__filters" aria-label="RFM local filters">
          <div className="rfm-analysis__filters-title"><SlidersHorizontal size={16} /><span>RFM filters</span></div>
          <select aria-label="RFM calculation scope" value={localFilters.scopeMode} onChange={(event) => setLocal('scopeMode', event.target.value as RFMLocalFilters['scopeMode'])}>
            <option value="global">Global Customer RFM</option>
            <option value="scoped">Scoped Behaviour RFM</option>
          </select>
          <select aria-label="Observation window" value={localFilters.observationWindow} onChange={(event) => setLocal('observationWindow', event.target.value as RFMLocalFilters['observationWindow'])}>
            <option value="filter-period">Filter Period</option>
            <option value="90d">Rolling 90 Days</option>
            <option value="180d">Rolling 180 Days</option>
            <option value="365d">Rolling 365 Days</option>
            <option value="lifetime">Lifetime sampai Analysis Date</option>
          </select>
          <select aria-label="Scoring method" value={localFilters.scoringMethod} onChange={(event) => setLocal('scoringMethod', event.target.value as RFMLocalFilters['scoringMethod'])}>
            <option value="quantile">Quantile Scoring</option>
            <option value="business">Business Rule Scoring</option>
          </select>
          <select aria-label="RFM segment" value={localFilters.segment} onChange={(event) => setLocal('segment', event.target.value as RFMLocalFilters['segment'])}>
            <option value="all">Semua Segment</option>
            {data.available.segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.label}</option>)}
          </select>
          <select aria-label="Channel filter" value={localFilters.channel} onChange={(event) => setLocal('channel', event.target.value)}>
            <option value="all">Semua Channel</option>
            {data.available.channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
          <select aria-label="Movement filter" value={localFilters.movement} onChange={(event) => setLocal('movement', event.target.value as RFMLocalFilters['movement'])}>
            <option value="all">Semua Movement</option>
            <option value="upgraded">Upgraded</option>
            <option value="stable">Stable</option>
            <option value="downgraded">Downgraded</option>
            <option value="reactivated">Reactivated</option>
            <option value="new">New</option>
          </select>
          <select aria-label="Membership filter" value={localFilters.membership} onChange={(event) => setLocal('membership', event.target.value as RFMLocalFilters['membership'])}>
            <option value="all">Semua Membership</option>
            <option value="member">Member</option>
            <option value="non-member">Non Member</option>
          </select>
          <select aria-label="Comparison dimension" value={localFilters.comparison} onChange={(event) => setLocal('comparison', event.target.value as RFMLocalFilters['comparison'])}>
            <option value="segment">Customer Segment</option>
            <option value="age">Age Group</option>
            <option value="gender">Gender</option>
            <option value="occupation">Occupation</option>
            <option value="member">Member</option>
            <option value="channel">Preferred Channel</option>
            <option value="location">Location</option>
            <option value="product">Product Preference</option>
            <option value="acquisition">Acquisition Source</option>
          </select>
          {(['rScore', 'fScore', 'mScore'] as const).map((key) => (
            <select key={key} aria-label={`${key} filter`} value={localFilters[key]} onChange={(event) => setLocal(key, event.target.value === 'all' ? 'all' : Number(event.target.value) as RFMScore)}>
              <option value="all">{key.toUpperCase()} All</option>
              {[5, 4, 3, 2, 1].map((score) => <option key={score} value={score}>Score {score}</option>)}
            </select>
          ))}
          <button type="button" aria-label="Reset RFM filters" onClick={() => setLocalFilters(defaultRFMLocalFilters)}><RefreshCcw size={15} /> Reset RFM Filters</button>
        </section>
      )}

      {data && <p className="rfm-analysis__scope">{data.scopeNote}</p>}
      {body}
      <footer className="rfm-analysis__source">
        Sumber Data: compact customer-month-outlet-channel RFM fact dari `transactions.csv`, `transaction_items.csv`, `customers.csv`, `products.csv`, dan `outlets.csv`.
      </footer>
    </div>
  )
}
