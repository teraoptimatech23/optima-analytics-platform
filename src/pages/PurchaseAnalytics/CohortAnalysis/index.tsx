import { useEffect, useMemo, useState } from 'react'
import {
  BadgeInfo,
  CalendarClock,
  ChartNoAxesColumn,
  Clock3,
  GalleryVerticalEnd,
  Inbox,
  LineChart,
  ReceiptText,
  RefreshCcw,
  Sparkles,
  Table2,
  TriangleAlert,
  UsersRound,
  X,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultCohortAnalysisLocalFilters,
  getCohortMetricValue,
  queryCohortAnalysis,
} from '@/data/cohortAnalysisSelectors'
import type {
  CohortAnalysisLocalFilters,
  CohortAnalysisPayload,
  CohortAnalysisResult,
  CohortCell,
  CohortMetric,
  CohortRow,
} from '@/data/cohortAnalysisSelectors'
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatDays,
  formatNumber,
  formatPercent,
} from '@/data/formatters'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const cohortTypeLabels: Record<CohortAnalysisLocalFilters['cohortType'], string> = {
  'first-purchase': 'First Purchase Month',
  acquisition: 'Acquisition Month',
  'membership-join': 'Membership Join Month',
  'first-campaign': 'First Campaign Activity Month',
}

const metricLabels: Record<CohortMetric, string> = {
  retention: 'Retention Rate',
  activeCustomers: 'Active Customers',
  revenueRetention: 'Revenue Retention',
  revenue: 'Revenue',
  transactions: 'Transactions',
  averageBasket: 'Average Basket',
  cumulativeRevenuePerCustomer: 'Cumulative Revenue / Customer',
}

function formatNullablePercent(value: number | null) {
  return value === null ? 'N/A' : formatPercent(value, 1)
}

function formatMetric(metric: CohortMetric, value: number | null) {
  if (value === null) return 'N/A'
  if (metric === 'retention' || metric === 'revenueRetention') return formatPercent(value, 1)
  if (metric === 'revenue' || metric === 'averageBasket' || metric === 'cumulativeRevenuePerCustomer') return formatCompactCurrency(value)
  return formatCompactNumber(value)
}

function heatIntensity(cell: CohortCell, metric: CohortMetric) {
  if (cell.status === 'immature') return 0
  const value = getCohortMetricValue(cell, metric)
  if (value === null) return 0
  if (metric === 'retention') return Math.min(1, value)
  if (metric === 'revenueRetention') return Math.min(1, value / 1.5)
  if (metric === 'averageBasket') return Math.min(1, value / 90000)
  if (metric === 'cumulativeRevenuePerCustomer') return Math.min(1, value / 900000)
  if (metric === 'revenue') return Math.min(1, value / 90000000)
  if (metric === 'transactions') return Math.min(1, value / 2500)
  return Math.min(1, value / Math.max(1, cell.cohortSize))
}

function SummaryCards({ data }: { data: CohortAnalysisResult }) {
  const cards = [
    { label: 'Total Cohorts', value: formatNumber(data.summary.totalCohorts), detail: cohortTypeLabels[data.summary.cohortType], icon: GalleryVerticalEnd },
    { label: 'Eligible Customers', value: formatCompactNumber(data.summary.eligibleCustomers), detail: 'Customer dengan first valid purchase', icon: UsersRound },
    { label: 'Average Cohort Size', value: formatCompactNumber(data.summary.averageCohortSize), detail: 'Eligible customers / total cohorts', icon: ChartNoAxesColumn },
    { label: 'Month 1 Retention', value: formatNullablePercent(data.summary.weightedRetentionM1), detail: 'Weighted by cohort size', icon: LineChart },
    { label: 'Month 3 Retention', value: formatNullablePercent(data.summary.weightedRetentionM3), detail: 'Weighted by cohort size', icon: LineChart },
    { label: 'Month 6 Retention', value: formatNullablePercent(data.summary.weightedRetentionM6), detail: 'Matured cohorts only', icon: LineChart },
    { label: 'Best Retaining Cohort', value: data.summary.bestRetentionCohort ?? 'N/A', detail: 'Minimum sample + maturity applied', icon: Sparkles },
    { label: 'Highest Revenue Retention', value: data.summary.highestRevenueRetentionCohort ?? 'N/A', detail: 'Revenue retention may exceed 100%', icon: ReceiptText },
    { label: 'Median Time to Second', value: data.summary.medianTimeToSecondPurchase === null ? 'N/A' : formatDays(data.summary.medianTimeToSecondPurchase), detail: 'Observed second purchases', icon: Clock3 },
    { label: 'Realized Value / Customer', value: formatCompactCurrency(data.summary.cumulativeRevenuePerCustomer), detail: 'Not predicted CLV', icon: ReceiptText },
  ]
  return (
    <section className="cohort-summary" aria-label="Cohort KPI summary">
      {cards.map(({ label, value, detail, icon: Icon }) => (
        <GlassCard className="cohort-kpi" interactive={false} key={label}>
          <span className="cohort-kpi__icon"><Icon size={18} /></span>
          <span className="cohort-kpi__label">{label}</span>
          <strong>{value}</strong>
          <small>{detail}</small>
        </GlassCard>
      ))}
    </section>
  )
}

function LocalFilters({
  data,
  local,
  setLocal,
}: {
  data: CohortAnalysisResult
  local: CohortAnalysisLocalFilters
  setLocal: React.Dispatch<React.SetStateAction<CohortAnalysisLocalFilters>>
}) {
  const patch = <K extends keyof CohortAnalysisLocalFilters>(key: K, value: CohortAnalysisLocalFilters[K]) => setLocal((state) => ({ ...state, [key]: value }))
  return (
    <section className="cohort-filters" aria-label="Cohort local filters">
      <select aria-label="Cohort type" value={local.cohortType} onChange={(event) => patch('cohortType', event.target.value as CohortAnalysisLocalFilters['cohortType'])}>
        {Object.entries(cohortTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select aria-label="Heatmap metric" value={local.metric} onChange={(event) => patch('metric', event.target.value as CohortMetric)}>
        {Object.entries(metricLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select aria-label="Comparison dimension" value={local.comparisonDimension} onChange={(event) => patch('comparisonDimension', event.target.value as CohortAnalysisLocalFilters['comparisonDimension'])}>
        <option value="acquisition">Acquisition Source</option>
        <option value="firstChannel">First Purchase Channel</option>
        <option value="memberAtEntry">Member at Entry</option>
        <option value="segment">Customer Segment</option>
        <option value="location">Location</option>
        <option value="gender">Gender</option>
        <option value="ageBand">Age Band</option>
      </select>
      <select aria-label="Return scope" value={local.returnScope} onChange={(event) => patch('returnScope', event.target.value as CohortAnalysisLocalFilters['returnScope'])}>
        <option value="anywhere">Return Anywhere</option>
        <option value="same-entry-scope">Return to Same Entry Scope</option>
      </select>
      <select aria-label="Acquisition source" value={local.acquisition} onChange={(event) => patch('acquisition', event.target.value)}>
        <option value="all">Semua Acquisition</option>
        {data.availableAcquisitions.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select aria-label="First channel" value={local.firstChannel} onChange={(event) => patch('firstChannel', event.target.value)}>
        <option value="all">Semua First Channel</option>
        {data.availableChannels.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select aria-label="Member at entry" value={local.memberAtEntry} onChange={(event) => patch('memberAtEntry', event.target.value as CohortAnalysisLocalFilters['memberAtEntry'])}>
        <option value="all">Semua Member Status</option>
        <option value="member">Member at Entry</option>
        <option value="non-member">Non-Member at Entry</option>
      </select>
      <select aria-label="Reliability filter" value={local.reliability} onChange={(event) => patch('reliability', event.target.value as CohortAnalysisLocalFilters['reliability'])}>
        <option value="all">Semua Reliability</option>
        <option value="high">High Reliability</option>
        <option value="medium">Medium Reliability</option>
        <option value="low">Low Reliability</option>
      </select>
      <label>
        <span>Min Size</span>
        <input aria-label="Minimum cohort size" min={1} max={500} type="number" value={local.minCohortSize} onChange={(event) => patch('minCohortSize', Number(event.target.value))} />
      </label>
      <label>
        <span>Max Age</span>
        <input aria-label="Maximum cohort age" min={1} max={11} type="number" value={local.maxAge} onChange={(event) => patch('maxAge', Number(event.target.value))} />
      </label>
      <button type="button" onClick={() => setLocal(defaultCohortAnalysisLocalFilters)}>
        <RefreshCcw size={15} />
        Reset Cohort Filters
      </button>
    </section>
  )
}

function RetentionHeatmap({ data, metric, onSelect }: { data: CohortAnalysisResult; metric: CohortMetric; onSelect: (row: CohortRow) => void }) {
  const ages = Array.from({ length: data.summary.maximumObservedAge + 1 }, (_, index) => index)
  return (
    <GlassCard interactive={false} className="cohort-panel cohort-heatmap-card">
      <div className="cohort-panel__head">
        <SectionTitle icon={Table2} title="Customer Retention Heatmap" subtitle={`${metricLabels[metric]} by cohort age`} />
        <small>Immature cells are unavailable, not 0%.</small>
      </div>
      <div className="cohort-heatmap-wrap">
        <table className="cohort-heatmap">
          <thead>
            <tr>
              <th>Cohort</th>
              <th>Size</th>
              {ages.map((age) => <th key={age}>M{age}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.cohorts.map((row) => (
              <tr key={row.cohortPeriod}>
                <th><button type="button" onClick={() => onSelect(row)}>{row.cohortLabel}</button></th>
                <td>{formatCompactNumber(row.cohortSize)}</td>
                {ages.map((age) => {
                  const cell = row.cells[age]
                  const value = cell ? getCohortMetricValue(cell, metric) : null
                  const intensity = cell ? heatIntensity(cell, metric) : 0
                  return (
                    <td key={`${row.cohortPeriod}-${age}`}>
                      <span
                        className={`cohort-cell cohort-cell--${cell?.status ?? 'immature'}`}
                        style={{ '--intensity': intensity } as React.CSSProperties}
                        title={cell ? `${row.cohortLabel} M${age}: ${formatMetric(metric, value)}; active ${formatNumber(cell.activeCustomers)} / size ${formatNumber(cell.cohortSize)}; status ${cell.status}` : 'Unavailable'}
                      >
                        {cell?.status === 'immature' ? '-' : formatMetric(metric, value)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function RetentionCurve({ data }: { data: CohortAnalysisResult }) {
  const max = Math.max(0.01, ...data.weightedRetentionCurve.map((point) => point.retentionRate ?? 0))
  return (
    <GlassCard interactive={false} className="cohort-panel">
      <SectionTitle icon={LineChart} title="Retention Curve" subtitle="Weighted overall curve, matured cells only" />
      <div className="cohort-bars" role="img" aria-label="Weighted retention curve">
        {data.weightedRetentionCurve.map((point) => (
          <article key={point.cohortAge}>
            <span style={{ height: `${Math.max(4, ((point.retentionRate ?? 0) / max) * 100)}%` }} title={`M${point.cohortAge}: ${formatNullablePercent(point.retentionRate)}`} />
            <strong>M{point.cohortAge}</strong>
            <small>{formatNullablePercent(point.retentionRate)}</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function RevenueRetention({ data }: { data: CohortAnalysisResult }) {
  const max = Math.max(0.01, ...data.revenueRetentionCurve.map((point) => point.revenueRetention ?? 0))
  return (
    <GlassCard interactive={false} className="cohort-panel">
      <SectionTitle icon={ReceiptText} title="Revenue Retention" subtitle="Revenue retention may exceed 100%" />
      <div className="cohort-bars cohort-bars--revenue" role="img" aria-label="Revenue retention curve">
        {data.revenueRetentionCurve.map((point) => (
          <article key={point.cohortAge}>
            <span style={{ height: `${Math.max(4, ((point.revenueRetention ?? 0) / max) * 100)}%` }} title={`M${point.cohortAge}: ${formatNullablePercent(point.revenueRetention)}`} />
            <strong>M{point.cohortAge}</strong>
            <small>{formatNullablePercent(point.revenueRetention)}</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function CohortSizeTrend({ data }: { data: CohortAnalysisResult }) {
  const max = Math.max(1, ...data.cohortSizeTrend.map((row) => row.cohortSize))
  return (
    <GlassCard interactive={false} className="cohort-panel">
      <SectionTitle icon={ChartNoAxesColumn} title="Cohort Size Trend" subtitle="Separates cohort volume from retention performance" />
      <div className="cohort-size-list">
        {data.cohortSizeTrend.map((row) => (
          <article key={row.cohortPeriod}>
            <div>
              <strong>{row.cohortLabel}</strong>
              <span>{formatCompactNumber(row.cohortSize)} customers - first basket {row.firstBasket === null ? 'N/A' : formatCompactCurrency(row.firstBasket)}</span>
            </div>
            <small>Member {formatPercent(row.memberShare)} / Voucher {formatPercent(row.voucherShare)}</small>
            <i><b style={{ width: `${Math.max(3, (row.cohortSize / max) * 100)}%` }} /></i>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function TimeToSecondPurchase({ data }: { data: CohortAnalysisResult }) {
  return (
    <GlassCard interactive={false} className="cohort-panel cohort-table-card">
      <SectionTitle icon={Clock3} title="Time to Second Purchase" subtitle="Window metrics use eligible observation opportunity" />
      <div className="cohort-table-wrap">
        <table className="cohort-table">
          <thead>
            <tr>
              <th>Cohort</th>
              <th>Eligible</th>
              <th>Converted</th>
              <th>Rate</th>
              <th>Median</th>
              <th>P25</th>
              <th>P75</th>
              <th>Within 7d</th>
              <th>Within 14d</th>
              <th>Within 30d</th>
            </tr>
          </thead>
          <tbody>
            {data.timeToSecondPurchase.map((row) => (
              <tr key={row.cohortPeriod}>
                <td><strong>{row.cohortLabel}</strong></td>
                <td>{formatCompactNumber(row.eligibleCustomers)}</td>
                <td>{formatCompactNumber(row.convertedCustomers)}</td>
                <td>{formatNullablePercent(row.conversionRate)}</td>
                <td>{row.medianDays === null ? 'N/A' : formatDays(row.medianDays)}</td>
                <td>{row.p25 === null ? 'N/A' : formatDays(row.p25)}</td>
                <td>{row.p75 === null ? 'N/A' : formatDays(row.p75)}</td>
                <td>{formatNullablePercent(row.within7Days)}</td>
                <td>{formatNullablePercent(row.within14Days)}</td>
                <td>{formatNullablePercent(row.within30Days)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function ComparisonTable({ data }: { data: CohortAnalysisResult }) {
  return (
    <GlassCard interactive={false} className="cohort-panel cohort-table-card">
      <SectionTitle icon={UsersRound} title="Cohort Comparison" subtitle="Reliability warning applied for small or immature groups" />
      <div className="cohort-table-wrap">
        <table className="cohort-table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Customers</th>
              <th>M1</th>
              <th>M3</th>
              <th>M6</th>
              <th>Revenue Ret. M3</th>
              <th>Second Purchase</th>
              <th>Median Second</th>
              <th>Cum. Value / Customer</th>
              <th>Reliability</th>
            </tr>
          </thead>
          <tbody>
            {data.comparisons.slice(0, 12).map((row) => (
              <tr key={`${row.dimension}-${row.id}`}>
                <td><strong>{row.label}</strong></td>
                <td>{formatCompactNumber(row.cohortCustomers)}</td>
                <td>{formatNullablePercent(row.retentionM1)}</td>
                <td>{formatNullablePercent(row.retentionM3)}</td>
                <td>{formatNullablePercent(row.retentionM6)}</td>
                <td>{formatNullablePercent(row.revenueRetentionM3)}</td>
                <td>{formatNullablePercent(row.secondPurchaseRate)}</td>
                <td>{row.medianTimeToSecondPurchase === null ? 'N/A' : formatDays(row.medianTimeToSecondPurchase)}</td>
                <td>{formatCompactCurrency(row.cumulativeRevenuePerCustomer)}</td>
                <td><span className={`cohort-reliability cohort-reliability--${row.reliabilityStatus}`}>{row.reliabilityStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function InsightsAndRecommendations({ data }: { data: CohortAnalysisResult }) {
  return (
    <section className="cohort-grid cohort-grid--two">
      <GlassCard interactive={false} className="cohort-panel cohort-notes">
        <SectionTitle icon={Sparkles} title="Cohort Insights" subtitle="Generated from active filters" />
        <ol>{data.insights.map((item) => <li key={item}>{item}</li>)}</ol>
      </GlassCard>
      <GlassCard interactive={false} className="cohort-panel cohort-actions">
        <SectionTitle icon={CalendarClock} title="Recommended Actions" subtitle="No causal claim, no hardcoded retention" />
        <div className="cohort-actions__list">
          {data.recommendations.map((item) => (
            <article key={item.id}>
              <span className={`cohort-priority cohort-priority--${item.priority}`}>{item.priority}</span>
              <strong>{item.issue}</strong>
              <p>{item.evidence}</p>
              <small>{item.action}</small>
              <em>{item.reliabilityNote}</em>
            </article>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}

function Methodology({ data }: { data: CohortAnalysisResult }) {
  return (
    <GlassCard interactive={false} className="cohort-panel cohort-method">
      <SectionTitle icon={BadgeInfo} title="Methodology & Limitations" subtitle="Temporal guardrails for cohort analysis" />
      <div>
        <section>
          <strong>Methodology</strong>
          <ul>{data.methodology.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <strong>Limitations</strong>
          <ul>{data.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>
    </GlassCard>
  )
}

function CohortDrawer({ row, onClose }: { row: CohortRow | null; onClose: () => void }) {
  if (!row) return null
  return (
    <aside className="cohort-drawer" aria-label="Cohort detail drawer">
      <div className="cohort-drawer__panel">
        <button className="cohort-drawer__close" type="button" aria-label="Close drawer" onClick={onClose}><X size={18} /></button>
        <span className={`cohort-reliability cohort-reliability--${row.reliabilityStatus}`}>{row.reliabilityStatus} reliability - {row.reliabilityScore}/100</span>
        <h2>{row.cohortLabel}</h2>
        <p>Original cohort size {formatNumber(row.cohortSize)} customers. Month 0 is the cohort entry month; later months are cohort age, not raw calendar month.</p>
        <dl>
          <div><dt>Entry Revenue</dt><dd>{formatCurrency(row.cohortEntryRevenue)}</dd></div>
          <div><dt>First Basket</dt><dd>{row.firstBasket === null ? 'N/A' : formatCurrency(row.firstBasket)}</dd></div>
          <div><dt>Second Purchase</dt><dd>{formatNullablePercent(row.secondPurchaseRate)}</dd></div>
          <div><dt>Median Second</dt><dd>{row.medianTimeToSecondPurchase === null ? 'N/A' : formatDays(row.medianTimeToSecondPurchase)}</dd></div>
          <div><dt>Member at Entry</dt><dd>{formatPercent(row.memberAtEntryRate)}</dd></div>
          <div><dt>Voucher at Entry</dt><dd>{formatPercent(row.voucherAtEntryRate)}</dd></div>
        </dl>
        <section>
          <strong>Cohort Cells</strong>
          <div className="cohort-drawer__cells">
            {row.cells.map((cell) => (
              <article key={cell.cohortAge}>
                <span>M{cell.cohortAge}</span>
                <strong>{cell.status === 'immature' ? 'Immature' : formatNullablePercent(cell.retentionRate)}</strong>
                <small>{formatCompactNumber(cell.activeCustomers)} active - {formatCompactCurrency(cell.revenue)}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}

export default function CohortAnalysis() {
  const filters = useFilterStore((state) => state.filters)
  const [payload, setPayload] = useState<CohortAnalysisPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [local, setLocal] = useState<CohortAnalysisLocalFilters>(defaultCohortAnalysisLocalFilters)
  const [selected, setSelected] = useState<CohortRow | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/assets/cohortAnalysis.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<CohortAnalysisPayload>
      })
      .then((json) => {
        if (!cancelled) {
          setPayload(json)
          setError(null)
        }
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const data = useMemo(() => (payload ? queryCohortAnalysis(payload, filters, local) : null), [payload, filters, local])

  let body
  if (loading) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data cohort gagal dimuat" description={error} />
  } else if (!data || data.summary.eligibleCustomers === 0) {
    body = (
      <StateMessage
        icon={Inbox}
        title="Tidak ada cohort pelanggan untuk kombinasi filter ini."
        description="Perluas cohort-entry period, wilayah, acquisition, channel, member status, atau turunkan minimum cohort size."
        action={<button className="cohort-button" type="button" onClick={() => setLocal(defaultCohortAnalysisLocalFilters)}>Reset Cohort Filters</button>}
      />
    )
  } else {
    body = (
      <>
        <LocalFilters data={data} local={local} setLocal={setLocal} />
        <SummaryCards data={data} />
        <RetentionHeatmap data={data} metric={local.metric} onSelect={setSelected} />
        <section className="cohort-grid cohort-grid--two">
          <RetentionCurve data={data} />
          <RevenueRetention data={data} />
        </section>
        <section className="cohort-grid cohort-grid--two">
          <CohortSizeTrend data={data} />
          <TimeToSecondPurchase data={data} />
        </section>
        <ComparisonTable data={data} />
        <InsightsAndRecommendations data={data} />
        <Methodology data={data} />
      </>
    )
  }

  return (
    <div className="cohort-page">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Cohort Analysis' : data ? `${data.summary.eligibleCustomers} eligible customers dianalisis` : 'Cohort Analysis siap'}
      </p>
      <section className="cohort-page__hero">
        <div className="hero-copy">
          <span>Purchase Analytics</span>
          <h1>
            Cohort Analysis
            <GalleryVerticalEnd size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.filterLabel}. Cohort: ${cohortTypeLabels[data.summary.cohortType]} - Analysis Cutoff: ${data.summary.analysisCutoff} - Maximum Observed Age: Month ${data.summary.maximumObservedAge} - ${formatCompactNumber(data.summary.eligibleCustomers)} eligible customers.`
              : 'Analisis retensi, frekuensi, dan nilai pelanggan berdasarkan periode akuisisi atau transaksi pertama.'}
          </p>
        </div>
        <div className="cohort-page__badge" title="Cell kosong pada cohort terbaru dapat berarti periode tersebut belum matang, bukan retention 0%.">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Transaction Dataset</span>
        </div>
      </section>
      {body}
      <footer className="cohort-page__source">
        Sumber Data: `public/assets/cohortAnalysis.json`, dibangun offline dari customer lifecycle dan customer-month activity compact. Filter periode adalah cohort-entry period; activity lanjutan tetap dihitung sampai analysis cutoff.
      </footer>
      <CohortDrawer row={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
