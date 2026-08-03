import { useEffect, useMemo, useState } from 'react'
import {
  BadgeInfo,
  BrainCircuit,
  CircleDollarSign,
  LineChart,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  Users,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultClvPredictionLocalFilters,
  queryClvPrediction,
} from '@/data/clvPredictionSelectors'
import type { ClvHorizon, ClvKpi, ClvPredictionJson, ClvPredictionLocalFilters, ClvPredictionResult } from '@/data/clvPredictionSelectors'
import { formatCompactCurrency, formatCompactNumber, formatCurrency, formatPercent, formatScore } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const kpiIcons = [Users, CircleDollarSign, BrainCircuit, LineChart, TriangleAlert, ShieldCheck]

function formatKpi(card: ClvKpi) {
  if (card.display === 'currency') return formatCompactCurrency(card.value)
  if (card.display === 'percent') return formatPercent(card.value)
  if (card.display === 'score') return formatScore(card.value, 2)
  return formatCompactNumber(card.value)
}

function SummaryCards({ data }: { data: ClvPredictionResult }) {
  return (
    <section className="clv-summary" aria-label="CLV Prediction KPI summary">
      {data.kpis.map((card, index) => {
        const Icon = kpiIcons[index % kpiIcons.length]!
        return (
          <GlassCard interactive={false} className={`clv-kpi clv-kpi--${card.tone}`} key={card.id}>
            <span className="clv-kpi__icon"><Icon size={18} /></span>
            <span className="clv-kpi__label">{card.label}</span>
            <strong>{formatKpi(card)}</strong>
            <small>{card.detail}</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function ValueBands({ data }: { data: ClvPredictionResult }) {
  const max = Math.max(...data.bands.map((row) => row.predictedClv), 1)
  return (
    <GlassCard interactive={false} className="clv-panel clv-bands">
      <div className="clv-panel__head">
        <div><span>Current Prediction</span><h2>Value Band Distribution</h2></div>
        <small>Band dibuat dari ranking predicted future value pada horizon aktif.</small>
      </div>
      {data.bands.map((row) => (
        <article key={row.band}>
          <div><strong>{row.band}</strong><span>{formatCompactNumber(row.customerCount)} pelanggan - {formatPercent(row.share)}</span></div>
          <i style={{ width: `${Math.max(3, (row.predictedClv / max) * 100)}%` }} />
          <dl>
            <div><dt>Historical</dt><dd>{formatCompactCurrency(row.historicalClv)}</dd></div>
            <div><dt>Predicted</dt><dd>{formatCompactCurrency(row.predictedClv)}</dd></div>
            <div><dt>Avg Predicted</dt><dd>{formatCompactCurrency(row.averagePredictedClv)}</dd></div>
            <div><dt>Reliability</dt><dd>{formatScore(row.reliabilityScore, 0)}/100</dd></div>
          </dl>
        </article>
      ))}
    </GlassCard>
  )
}

function ModelPanel({ data }: { data: ClvPredictionResult }) {
  return (
    <GlassCard interactive={false} className="clv-panel clv-model">
      <div className="clv-panel__head">
        <div><span>Temporal Backtest</span><h2>Model & Baseline</h2></div>
        <small>Model dipilih dari validation WAPE; test hanya untuk pelaporan.</small>
      </div>
      <div className="clv-model__cards">
        {data.modelPerformance.map((row) => (
          <article key={`${row.modelName}-${row.isSelected}`} className={row.isSelected ? 'is-selected' : ''}>
            <span>{row.isSelected ? 'Selected Model' : 'Baseline'}</span>
            <strong>{row.modelName}</strong>
            <dl>
              <div><dt>WAPE</dt><dd>{formatPercent(row.wape)}</dd></div>
              <div><dt>MAE</dt><dd>{formatCompactCurrency(row.mae)}</dd></div>
              <div><dt>RMSE</dt><dd>{formatCompactCurrency(row.rmse)}</dd></div>
              <div><dt>Bias</dt><dd>{formatPercent(row.bias)}</dd></div>
              <div><dt>Top 10%</dt><dd>{formatPercent(row.topDecileCapture)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
      <p>Train {data.model.trainPeriod} - Validation {data.model.validationPeriod} - Test {data.model.testPeriod} - Interval: {data.model.residualIntervalSource}.</p>
    </GlassCard>
  )
}

function IntervalAndCalibration({ data }: { data: ClvPredictionResult }) {
  return (
    <div className="clv-grid clv-grid--two">
      <GlassCard interactive={false} className="clv-panel clv-interval">
        <div className="clv-panel__head"><div><span>Prediction Range</span><h2>Future CLV Interval</h2></div></div>
        <div className="clv-interval__meter">
          <span>{formatCompactCurrency(data.summary.predictionLowerTotal)}</span>
          <strong>{formatCompactCurrency(data.summary.predictedFutureClv)}</strong>
          <span>{formatCompactCurrency(data.summary.predictionUpperTotal)}</span>
        </div>
        <p>Lower/upper memakai quantile residual validation model aktif, bukan persentase arbitrary. Predicted future CLV tetap dipisah dari historical CLV.</p>
      </GlassCard>
      <GlassCard interactive={false} className="clv-panel clv-calibration">
        <div className="clv-panel__head"><div><span>Historical Backtest</span><h2>Actual vs Predicted</h2></div></div>
        {data.calibration.map((row) => (
          <article key={row.bucket}>
            <span>{row.bucket} - n={formatCompactNumber(row.sampleCount)}</span>
            <strong>{formatCompactCurrency(row.averagePredicted)}</strong>
            <small>Actual {formatCompactCurrency(row.averageActual)} - gap {formatCompactCurrency(row.gap)}</small>
          </article>
        ))}
      </GlassCard>
    </div>
  )
}

function ComparisonAndCustomers({ data }: { data: ClvPredictionResult }) {
  return (
    <div className="clv-grid clv-grid--two">
      <GlassCard interactive={false} className="clv-panel clv-table-card">
        <div className="clv-panel__head"><div><span>Scoped Behaviour CLV</span><h2>Comparison Dimension</h2></div></div>
        <div className="clv-table-wrap">
          <table className="clv-table">
            <thead><tr><th>Dimension</th><th>Customers</th><th>Historical</th><th>Predicted</th><th>Value at Risk</th><th>Reliable</th><th>Driver</th></tr></thead>
            <tbody>
              {data.comparisons.slice(0, 12).map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.label}</strong></td>
                  <td>{formatCompactNumber(row.customerCount)}</td>
                  <td>{formatCompactCurrency(row.historicalClv)}</td>
                  <td>{formatCompactCurrency(row.predictedClv)}</td>
                  <td>{formatCompactCurrency(row.valueAtRisk)}</td>
                  <td>{formatPercent(row.reliableShare)}</td>
                  <td>{row.primaryDriver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="clv-panel clv-table-card">
        <div className="clv-panel__head"><div><span>Customer Snapshot</span><h2>Top Expected Value</h2></div><small>Top 300 only.</small></div>
        <div className="clv-table-wrap">
          <table className="clv-table">
            <thead><tr><th>Customer</th><th>Band</th><th>Historical</th><th>Predicted</th><th>Interval</th><th>Reliability</th><th>Cold Start</th></tr></thead>
            <tbody>
              {data.customers.slice(0, 14).map((row) => (
                <tr key={row.customerId}>
                  <td><strong>{row.customerId}</strong><small>{row.segment}</small></td>
                  <td><em className={`clv-pill clv-pill--${row.reliabilityStatus}`}>{row.valueBand}</em></td>
                  <td>{formatCurrency(row.historicalClv)}</td>
                  <td>{formatCurrency(row.predictedClv)}</td>
                  <td>{formatCompactCurrency(row.predictionLower)} - {formatCompactCurrency(row.predictionUpper)}</td>
                  <td>{row.reliabilityScore}/100</td>
                  <td>{row.coldStart ? 'Ya' : 'Tidak'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

function DriversAndBacktest({ data }: { data: ClvPredictionResult }) {
  const max = Math.max(...data.drivers.map((row) => row.importance), 1)
  return (
    <div className="clv-grid clv-grid--two">
      <GlassCard interactive={false} className="clv-panel clv-drivers">
        <div className="clv-panel__head"><div><span>Explainability</span><h2>Value Drivers</h2></div></div>
        {data.drivers.map((row) => (
          <article key={row.feature}>
            <div><strong>{row.label}</strong><span>{row.direction}</span></div>
            <i style={{ width: `${Math.max(4, (row.importance / max) * 100)}%` }} />
            <small>{row.interpretation}</small>
          </article>
        ))}
      </GlassCard>
      <GlassCard interactive={false} className="clv-panel clv-table-card">
        <div className="clv-panel__head"><div><span>Test Set Only</span><h2>Actual vs Predicted Samples</h2></div></div>
        <div className="clv-table-wrap">
          <table className="clv-table">
            <thead><tr><th>Reference</th><th>Customer</th><th>Predicted</th><th>Actual</th><th>Error</th><th>Cold Start</th></tr></thead>
            <tbody>
              {data.actualVsPredicted.slice(0, 12).map((row) => (
                <tr key={`${row.customerId}-${row.referenceDate}`}>
                  <td>{row.referenceDate}</td>
                  <td><strong>{row.customerId}</strong></td>
                  <td>{formatCurrency(row.predictedFutureClv)}</td>
                  <td>{formatCurrency(row.actualFutureClv)}</td>
                  <td>{formatCompactCurrency(row.error)}</td>
                  <td>{row.coldStart ? 'Ya' : 'Tidak'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

function InsightActions({ data }: { data: ClvPredictionResult }) {
  return (
    <div className="clv-grid clv-grid--two">
      <GlassCard interactive={false} className="clv-panel clv-notes">
        <div className="clv-panel__head"><div><span>Detected Signals</span><h2>CLV Insights</h2></div></div>
        <ol>{data.insights.map((row) => <li key={row}>{row}</li>)}</ol>
      </GlassCard>
      <GlassCard interactive={false} className="clv-panel clv-actions">
        <div className="clv-panel__head"><div><span>Decision Support</span><h2>Recommended Actions</h2></div></div>
        {data.recommendations.map((row) => (
          <article key={row.id}>
            <span>{row.priority}</span>
            <strong>{row.target}</strong>
            <p>{row.evidence}</p>
            <small>{row.action} {row.reliabilityNote}</small>
          </article>
        ))}
      </GlassCard>
      <GlassCard interactive={false} className="clv-panel clv-notes">
        <div className="clv-panel__head"><div><span>Guardrails</span><h2>Methodology</h2></div></div>
        <ol>{data.methodology.map((row) => <li key={row}>{row}</li>)}</ol>
      </GlassCard>
      <GlassCard interactive={false} className="clv-panel clv-notes">
        <div className="clv-panel__head"><div><span>Reliability Notes</span><h2>Limitations</h2></div></div>
        <ol>{data.limitations.map((row) => <li key={row}>{row}</li>)}</ol>
      </GlassCard>
    </div>
  )
}

export default function CLVPrediction() {
  useInsights()
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<ClvPredictionLocalFilters>(defaultClvPredictionLocalFilters)
  const [payload, setPayload] = useState<ClvPredictionJson | null>(null)
  const [payloadError, setPayloadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/assets/clvPrediction.json')
      .then((response) => {
        if (!response.ok) throw new Error(`CLV prediction aggregate gagal dimuat (${response.status})`)
        return response.json() as Promise<ClvPredictionJson>
      })
      .then((json) => { if (active) setPayload(json) })
      .catch((fetchError: unknown) => { if (active) setPayloadError(fetchError instanceof Error ? fetchError.message : 'CLV aggregate gagal dimuat') })
    return () => { active = false }
  }, [])

  const data = useMemo(() => (payload ? queryClvPrediction(payload, filters, localFilters) : null), [payload, filters, localFilters])
  const setLocal = <K extends keyof ClvPredictionLocalFilters>(key: K, value: ClvPredictionLocalFilters[K]) => setLocalFilters((state) => ({ ...state, [key]: value }))

  let body
  if (loading || (!data && !error && !payloadError)) {
    body = <DashboardSkeleton />
  } else if (error || payloadError) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error ?? payloadError ?? 'Unknown error'} />
  } else if (!data || data.summary.eligibleCustomers === 0) {
    body = <StateMessage icon={Users} title="Tidak ada customer eligible untuk kombinasi filter ini." description="Perluas filter global atau reset filter lokal CLV." action={<button className="clv-button" type="button" onClick={() => setLocalFilters(defaultClvPredictionLocalFilters)}>Reset CLV Filters</button>} />
  } else {
    body = (
      <>
        <SummaryCards data={data} />
        <div className="clv-grid clv-grid--two"><ValueBands data={data} /><ModelPanel data={data} /></div>
        <IntervalAndCalibration data={data} />
        <ComparisonAndCustomers data={data} />
        <DriversAndBacktest data={data} />
        <InsightActions data={data} />
      </>
    )
  }

  return (
    <div className="clv-prediction">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Customer Lifetime Value Prediction' : data ? `${data.summary.eligibleCustomers} customer dianalisis` : 'CLV Prediction siap'}
      </p>
      <section className="clv-prediction__hero">
        <div className="hero-copy">
          <span>Predictive Analytics</span>
          <h1>Customer Lifetime Value Prediction <CircleDollarSign size={22} strokeWidth={2} /></h1>
          <p>
            {data
              ? `Reference Date: ${data.summary.predictionReferenceDate} - Horizon: ${data.summary.predictionHorizonDays} Hari - Observation Window: ${data.summary.observationWindowMonths} Bulan. Historical CLV tetap dipisah dari predicted future CLV dan prediction interval berbasis residual backtest.`
              : 'Estimasi future customer value berbasis histori transaksi, lifecycle, segment, dan backtest temporal.'}
          </p>
        </div>
        <div className="clv-prediction__badge" title="Predicted CLV bukan revenue pasti dan tidak dipakai untuk aksi otomatis.">
          <BadgeInfo size={16} /><span>Decision Support - Not Guaranteed Revenue</span>
        </div>
      </section>

      {data && (
        <section className="clv-prediction__filters" aria-label="CLV Prediction filters">
          <div className="clv-prediction__filters-title"><SlidersHorizontal size={16} /><span>Prediction Controls</span></div>
          <select aria-label="Prediction horizon" value={localFilters.horizon} onChange={(event) => setLocal('horizon', Number(event.target.value) as ClvHorizon)}>
            {[90, 180].map((days) => <option key={days} value={days}>{days} Hari</option>)}
          </select>
          <select aria-label="Value band" value={localFilters.valueBand} onChange={(event) => setLocal('valueBand', event.target.value as ClvPredictionLocalFilters['valueBand'])}>
            <option value="all">Semua Value Band</option>
            {['Top Value', 'High Value', 'Core Value', 'Low Value'].map((band) => <option key={band} value={band}>{band}</option>)}
          </select>
          <select aria-label="Reliability" value={localFilters.reliability} onChange={(event) => setLocal('reliability', event.target.value as ClvPredictionLocalFilters['reliability'])}>
            <option value="all">Semua Reliability</option>
            <option value="high">High Reliability</option>
            <option value="medium">Medium Reliability</option>
            <option value="low">Low Reliability</option>
          </select>
          <select aria-label="Membership filter" value={localFilters.member} onChange={(event) => setLocal('member', event.target.value as ClvPredictionLocalFilters['member'])}>
            <option value="all">Semua Membership</option>
            <option value="member">Member</option>
            <option value="non-member">Non Member</option>
          </select>
          <select aria-label="RFM segment" value={localFilters.rfmSegment} onChange={(event) => setLocal('rfmSegment', event.target.value)}>
            <option value="all">Semua RFM Segment</option>
            {data.available.rfmSegments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
          </select>
          <select aria-label="Journey stage" value={localFilters.journeyStage} onChange={(event) => setLocal('journeyStage', event.target.value)}>
            <option value="all">Semua Journey Stage</option>
            {data.available.journeyStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
          <select aria-label="Model filter" value={localFilters.model} onChange={(event) => setLocal('model', event.target.value)}>
            <option value="all">Semua Model/Fallback</option>
            {data.available.models.map((model) => <option key={model} value={model}>{model}</option>)}
          </select>
          <select aria-label="Comparison dimension" value={localFilters.comparison} onChange={(event) => setLocal('comparison', event.target.value as ClvPredictionLocalFilters['comparison'])}>
            <option value="segment">Customer Segment</option>
            <option value="acquisition">Acquisition Source</option>
            <option value="location">Location</option>
            <option value="gender">Gender</option>
            <option value="age">Age Group</option>
            <option value="member">Membership</option>
            <option value="rfm">RFM Segment</option>
            <option value="journey">Journey Stage</option>
            <option value="channel">Preferred Channel</option>
          </select>
          <label>Search<input aria-label="Search synthetic customer ID" value={localFilters.search} onChange={(event) => setLocal('search', event.target.value)} /></label>
          <button type="button" aria-label="Reset CLV filters" onClick={() => setLocalFilters(defaultClvPredictionLocalFilters)}><RefreshCcw size={15} /> Reset</button>
        </section>
      )}

      {body}
      {data && <footer className="clv-prediction__source">Model version: {data.model.selectedModel}. Historical CLV: observed sampai reference date. Predicted CLV: future value horizon aktif; bukan revenue pasti dan tidak menjalankan aksi otomatis.</footer>}
    </div>
  )
}
