import { useMemo, useState } from 'react'
import {
  BadgeInfo,
  GitBranch,
  Info,
  RefreshCcw,
  Route,
  SlidersHorizontal,
  TriangleAlert,
  Users,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultCustomerJourneyLocalFilters,
  queryCustomerJourney,
} from '@/data/customerJourneySelectors'
import type { CustomerJourneyLocalFilters, CustomerJourneyInsights, JourneyKpi } from '@/data/customerJourneySelectors'
import { formatCompactCurrency, formatCompactNumber, formatDays, formatPercent } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const kpiIcons = [Users, GitBranch, Route, BadgeInfo]

function formatKpi(card: JourneyKpi) {
  if (card.display === 'percent') return formatPercent(card.value)
  if (card.display === 'currency') return formatCompactCurrency(card.value)
  if (card.display === 'days') return formatDays(card.value)
  return formatCompactNumber(card.value)
}

function JourneySummaryCards({ data }: { data: CustomerJourneyInsights }) {
  return (
    <section className="journey-summary" aria-label="Customer Journey KPI summary">
      {data.kpis.map((card, index) => {
        const Icon = kpiIcons[index % kpiIcons.length]!
        return (
          <GlassCard interactive={false} className={`journey-kpi journey-kpi--${card.tone}`} key={card.id}>
            <span className="journey-kpi__icon"><Icon size={18} /></span>
            <span className="journey-kpi__label">{card.label}</span>
            <strong>{formatKpi(card)}</strong>
            <small>{card.detail}</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function JourneyFunnel({ data }: { data: CustomerJourneyInsights }) {
  const max = Math.max(...data.funnel.map((step) => step.count), 1)
  return (
    <GlassCard interactive={false} className="journey-panel journey-funnel">
      <div className="journey-panel__head">
        <div>
          <span>Positive Progression</span>
          <h2>Customer Journey Funnel</h2>
        </div>
        <small>At-Risk, Dormant, Churned, dan Reactivated dipisah dari funnel progres positif.</small>
      </div>
      <div className="journey-funnel__steps">
        {data.funnel.map((step) => (
          <article key={step.id}>
            <div>
              <strong>{step.label}</strong>
              <span>{formatCompactNumber(step.count)} customers</span>
            </div>
            <div className="journey-funnel__bar">
              <i style={{ width: `${Math.max(4, (step.count / max) * 100)}%` }} />
            </div>
            <dl>
              <div><dt>From Previous</dt><dd>{formatPercent(step.conversionFromPrevious)}</dd></div>
              <div><dt>Cumulative</dt><dd>{formatPercent(step.cumulativeConversion)}</dd></div>
              <div><dt>Drop-Off</dt><dd>{formatCompactNumber(step.dropOffCount)} - {formatPercent(step.dropOffRate)}</dd></div>
              <div><dt>Median Time</dt><dd>{step.medianDaysToStage === null ? 'N/A' : formatDays(step.medianDaysToStage)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function LifecycleSnapshot({ data }: { data: CustomerJourneyInsights }) {
  return (
    <GlassCard interactive={false} className="journey-panel">
      <div className="journey-panel__head">
        <div>
          <span>End-Period Snapshot</span>
          <h2>Lifecycle Stage at Period End</h2>
        </div>
        <small>Snapshot dihitung dari histori transaksi sampai akhir periode.</small>
      </div>
      <div className="journey-stage-grid">
        {data.lifecycleSnapshot.map((stage) => (
          <article key={stage.id}>
            <strong>{stage.label}</strong>
            <span>{formatCompactNumber(stage.count)} customers</span>
            <div><i style={{ width: `${Math.max(3, stage.share * 100)}%` }} /></div>
            <small>{stage.description}</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function LifecycleTransitions({ data }: { data: CustomerJourneyInsights }) {
  return (
    <GlassCard interactive={false} className="journey-panel journey-table-card">
      <div className="journey-panel__head">
        <div>
          <span>During Selected Period</span>
          <h2>Customer Lifecycle Flow</h2>
        </div>
        <small>Source stage = akhir periode sebelumnya. Target stage = akhir periode aktif.</small>
      </div>
      <div className="journey-transition-list">
        {data.transitions.map((transition) => (
          <article className={`journey-transition journey-transition--${transition.direction}`} key={`${transition.source}-${transition.target}`}>
            <div>
              <span>{transition.sourceLabel}</span>
              <strong>{transition.targetLabel}</strong>
            </div>
            <b>{formatCompactNumber(transition.count)}</b>
            <small>{formatPercent(transition.share)} of scoped customers</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function AcquisitionCohorts({ data }: { data: CustomerJourneyInsights }) {
  return (
    <GlassCard interactive={false} className="journey-panel journey-table-card">
      <div className="journey-panel__head">
        <div>
          <span>Acquisition Cohort</span>
          <h2>Cohort Quality</h2>
        </div>
        <small>Cohort memakai signup month, bukan bulan transaksi pertama.</small>
      </div>
      <div className="journey-table-wrap">
        <table className="journey-table">
          <thead>
            <tr>
              <th>Cohort</th>
              <th>Acquired</th>
              <th>First Purchase</th>
              <th>Repeat</th>
              <th>Active End</th>
              <th>Avg CLV</th>
            </tr>
          </thead>
          <tbody>
            {data.cohorts.map((row) => (
              <tr key={row.cohort}>
                <td><strong>{row.cohort}</strong></td>
                <td>{formatCompactNumber(row.acquired)}</td>
                <td>{formatPercent(row.firstPurchaseRate)}</td>
                <td>{formatPercent(row.repeatRate)}</td>
                <td>{formatPercent(row.activeAtPeriodEndRate)}</td>
                <td>{formatCompactCurrency(row.avgClv)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function JourneyBreakdowns({ data }: { data: CustomerJourneyInsights }) {
  const renderRows = (rows: CustomerJourneyInsights['segmentBreakdown']) => rows.slice(0, 6).map((row) => (
    <article key={row.label}>
      <div>
        <strong>{row.label}</strong>
        <span>{formatCompactNumber(row.customers)} customers - {formatPercent(row.share)} share</span>
      </div>
      <small>Repeat {formatPercent(row.repeatRate)} / Churn {formatPercent(row.churnRate)} / CLV {formatCompactCurrency(row.avgClv)}</small>
      <i style={{ width: `${Math.max(4, row.share * 100)}%` }} />
    </article>
  ))

  return (
    <div className="journey-grid journey-grid--two">
      <GlassCard interactive={false} className="journey-panel journey-breakdown">
        <div className="journey-panel__head"><div><span>Segment</span><h2>Lifecycle by Segment</h2></div></div>
        <div className="journey-breakdown__rows">{renderRows(data.segmentBreakdown)}</div>
      </GlassCard>
      <GlassCard interactive={false} className="journey-panel journey-breakdown">
        <div className="journey-panel__head"><div><span>Period Activity</span><h2>Lifecycle by Channel</h2></div></div>
        <div className="journey-breakdown__rows">{renderRows(data.channelBreakdown)}</div>
      </GlassCard>
    </div>
  )
}

function JourneyInsights({ data }: { data: CustomerJourneyInsights }) {
  return (
    <div className="journey-grid journey-grid--two">
      <GlassCard interactive={false} className="journey-panel journey-notes">
        <div className="journey-panel__head"><div><span>Detected Signals</span><h2>Data-Driven Notes</h2></div></div>
        <ol>
          {data.insights.map((insight) => <li key={insight}>{insight}</li>)}
        </ol>
      </GlassCard>
      <GlassCard interactive={false} className="journey-panel journey-notes">
        <div className="journey-panel__head"><div><span>Methodology</span><h2>Temporal Guardrails</h2></div></div>
        <ol>
          {data.methodology.map((note) => <li key={note}>{note}</li>)}
        </ol>
      </GlassCard>
    </div>
  )
}

export default function CustomerJourney() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<CustomerJourneyLocalFilters>(defaultCustomerJourneyLocalFilters)
  const data = useMemo(() => (cube ? queryCustomerJourney(cube, filters, localFilters) : null), [cube, filters, localFilters])
  const setLocal = <K extends keyof CustomerJourneyLocalFilters>(key: K, value: CustomerJourneyLocalFilters[K]) => setLocalFilters((state) => ({ ...state, [key]: value }))

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else if (!data || data.scope.customers === 0) {
    body = (
      <StateMessage
        icon={Users}
        title="Tidak ada customer journey pada filter aktif."
        description="Perluas periode, wilayah, segment, channel, acquisition source, atau reset analysis filters."
        action={<button className="journey-button" type="button" onClick={() => setLocalFilters(defaultCustomerJourneyLocalFilters)}>Reset Analysis Filters</button>}
      />
    )
  } else {
    body = (
      <>
        <JourneySummaryCards data={data} />
        <div className="journey-grid journey-grid--two">
          <JourneyFunnel data={data} />
          <LifecycleSnapshot data={data} />
        </div>
        <div className="journey-grid journey-grid--two">
          <LifecycleTransitions data={data} />
          <AcquisitionCohorts data={data} />
        </div>
        <JourneyBreakdowns data={data} />
        <JourneyInsights data={data} />
      </>
    )
  }

  return (
    <div className="customer-journey">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Customer Journey' : data ? `${data.scope.customers} customers dianalisis` : 'Customer Journey siap'}
      </p>
      <section className="customer-journey__hero">
        <div className="hero-copy">
          <span>Purchase Analytics</span>
          <h1>
            Customer Journey
            <Route size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.filterLabel} - ${formatCompactNumber(data.scope.periodCustomers)} active period customers - ${formatCompactNumber(data.scope.periodTransactions)} period transactions. Analisis perjalanan pelanggan dari acquisition, transaksi pertama, repeat purchase, loyalty, risiko churn, hingga reactivation.`
              : 'Analisis perjalanan pelanggan dari acquisition, transaksi pertama, repeat purchase, loyalty, risiko churn, hingga reactivation.'}
          </p>
        </div>
        <div className="customer-journey__badge" title="Journey stage diturunkan dari histori transaksi dan aturan lifecycle yang terdokumentasi.">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Customer Lifecycle Dataset</span>
          <Info size={14} />
        </div>
      </section>

      {data && (
        <section className="customer-journey__filters" aria-label="Customer Journey local filters">
          <div className="customer-journey__filters-title"><SlidersHorizontal size={16} /><span>Analysis filters</span></div>
          <select aria-label="Customer segment filter" value={localFilters.segment} onChange={(event) => setLocal('segment', event.target.value)}>
            <option value="all">Semua Segment</option>
            {data.availableSegments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
          </select>
          <select aria-label="Channel filter" value={localFilters.channel} onChange={(event) => setLocal('channel', event.target.value)}>
            <option value="all">Semua Channel</option>
            {data.availableChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
          <select aria-label="Acquisition source filter" value={localFilters.acquisition} onChange={(event) => setLocal('acquisition', event.target.value)}>
            <option value="all">Semua Acquisition</option>
            {data.availableAcquisitions.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
          <select aria-label="Membership filter" value={localFilters.membership} onChange={(event) => setLocal('membership', event.target.value as CustomerJourneyLocalFilters['membership'])}>
            <option value="all">Semua Membership</option>
            <option value="member">Member</option>
            <option value="non-member">Non Member</option>
          </select>
          <button type="button" aria-label="Reset analysis filters" onClick={() => setLocalFilters(defaultCustomerJourneyLocalFilters)}><RefreshCcw size={15} /> Reset Analysis Filters</button>
        </section>
      )}

      {body}

      <footer className="customer-journey__source">
        Sumber Data: compact lifecycle fact dari `customers.csv` dan customer-month-channel fact dari `transactions.csv`, dengan support temporal dari signup date, cohort month, membership date, first/second purchase date, last purchase, CLV, campaign flag, voucher usage, dan activity period.
      </footer>
    </div>
  )
}
