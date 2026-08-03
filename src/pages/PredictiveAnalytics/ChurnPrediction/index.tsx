import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BadgeInfo,
  BrainCircuit,
  Info,
  LineChart,
  RefreshCcw,
  ShieldAlert,
  SlidersHorizontal,
  TriangleAlert,
  Users,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultChurnPredictionLocalFilters,
  queryChurnPrediction,
} from '@/data/churnPredictionSelectors'
import type { ChurnKpi, ChurnPredictionJson, ChurnPredictionLocalFilters, ChurnPredictionResult } from '@/data/churnPredictionSelectors'
import type { ChurnHorizon } from '@/config/churnPredictionConfig'
import { churnPredictionConfig } from '@/config/churnPredictionConfig'
import { formatCompactCurrency, formatCompactNumber, formatCurrency, formatDays, formatPercent, formatScore } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const kpiIcons = [Users, ShieldAlert, Activity, BrainCircuit]

function formatKpi(card: ChurnKpi) {
  if (card.display === 'percent') return formatPercent(card.value)
  if (card.display === 'currency') return formatCompactCurrency(card.value)
  if (card.display === 'score') return formatScore(card.value, 2)
  return formatCompactNumber(card.value)
}

function SummaryCards({ data }: { data: ChurnPredictionResult }) {
  return (
    <section className="churn-summary" aria-label="Churn Prediction KPI summary">
      {data.kpis.map((card, index) => {
        const Icon = kpiIcons[index % kpiIcons.length]!
        return (
          <GlassCard interactive={false} className={`churn-kpi churn-kpi--${card.tone}`} key={card.id}>
            <span className="churn-kpi__icon"><Icon size={18} /></span>
            <span className="churn-kpi__label">{card.label}</span>
            <strong>{formatKpi(card)}</strong>
            <small>{card.detail}</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function RiskDistribution({ data }: { data: ChurnPredictionResult }) {
  const max = Math.max(...data.riskBands.map((row) => row.customerCount), 1)
  return (
    <GlassCard interactive={false} className="churn-panel churn-risk">
      <div className="churn-panel__head">
        <div><span>Current Predictions</span><h2>Churn Risk Distribution</h2></div>
        <small>Band memakai threshold policy aktif dan tidak menyatakan kepastian churn.</small>
      </div>
      <div className="churn-risk__rows">
        {data.riskBands.map((row) => (
          <article key={row.band} className={`churn-band churn-band--${row.band}`}>
            <div><strong>{row.label}</strong><span>{formatCompactNumber(row.customerCount)} pelanggan - {formatPercent(row.customerShare)}</span></div>
            <i style={{ width: `${Math.max(3, (row.customerCount / max) * 100)}%` }} />
            <dl>
              <div><dt>Avg Probability</dt><dd>{formatPercent(row.averageProbability)}</dd></div>
              <div><dt>Avg Recency</dt><dd>{formatDays(row.averageRecency)}</dd></div>
              <div><dt>Avg Monetary</dt><dd>{formatCompactCurrency(row.averageMonetary)}</dd></div>
              <div><dt>Value at Risk</dt><dd>{formatCompactCurrency(row.expectedValueAtRisk)}</dd></div>
              <div><dt>Member Rate</dt><dd>{formatPercent(row.memberRate)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function ModelPerformance({ data }: { data: ChurnPredictionResult }) {
  return (
    <GlassCard interactive={false} className="churn-panel churn-model">
      <div className="churn-panel__head">
        <div><span>Temporal Backtest</span><h2>Model Performance</h2></div>
        <small>Threshold dipilih dari validation; test hanya untuk reporting.</small>
      </div>
      <div className="churn-model__cards">
        {data.modelPerformance.map((row) => (
          <article key={row.modelName} className={row.isSelected ? 'is-selected' : ''}>
            <span>{row.isBaseline ? 'Baseline' : 'Selected Model'}</span>
            <strong>{row.modelName}</strong>
            <dl>
              <div><dt>PR-AUC</dt><dd>{formatScore(row.prAuc, 2)}</dd></div>
              <div><dt>ROC-AUC</dt><dd>{formatScore(row.rocAuc, 2)}</dd></div>
              <div><dt>Precision</dt><dd>{formatPercent(row.precision)}</dd></div>
              <div><dt>Recall</dt><dd>{formatPercent(row.recall)}</dd></div>
              <div><dt>Lift@10</dt><dd>{formatScore(row.liftAt10, 2)}x</dd></div>
            </dl>
          </article>
        ))}
      </div>
      <p>Train: {data.meta.modelVersion} - Reference {data.summary.predictionReferenceDate} - Horizon {data.summary.predictionHorizonDays} hari - Observation {data.summary.observationWindowDays} hari.</p>
    </GlassCard>
  )
}

function CurvePanel({ data }: { data: ChurnPredictionResult }) {
  const roc = data.rocCurve
  const pr = data.precisionRecallCurve
  const lift = data.liftCurve
  return (
    <GlassCard interactive={false} className="churn-panel churn-curves">
      <div className="churn-panel__head">
        <div><span>Curves from Test Set</span><h2>ROC, PR, Lift & Calibration</h2></div>
        <small>Curve berasal dari pipeline evaluasi, bukan titik statis.</small>
      </div>
      <div className="churn-curve-grid">
        <div className="curve-box" aria-label="ROC curve">
          <strong>ROC Curve</strong>
          {roc.map((point, index) => <i key={`${point.falsePositiveRate}-${index}`} style={{ left: `${point.falsePositiveRate * 100}%`, bottom: `${point.truePositiveRate * 100}%` }} />)}
        </div>
        <div className="curve-box" aria-label="Precision recall curve">
          <strong>Precision-Recall</strong>
          {pr.map((point, index) => <i key={`${point.recall}-${index}`} style={{ left: `${point.recall * 100}%`, bottom: `${point.precision * 100}%` }} />)}
        </div>
        <div className="curve-list">
          <strong>Lift & Gains</strong>
          {lift.map((row) => (
            <article key={row.targetedShare}>
              <span>Top {formatPercent(row.targetedShare, 0)}</span>
              <b>{formatScore(row.lift, 2)}x</b>
              <small>{formatPercent(row.churnCapturedShare)} churn captured</small>
            </article>
          ))}
        </div>
        <div className="curve-list">
          <strong>Calibration</strong>
          {data.calibration.slice(0, 6).map((row) => (
            <article key={row.bucket}>
              <span>{row.bucket}</span>
              <b>{formatPercent(row.predictedProbability)}</b>
              <small>Observed {formatPercent(row.observedRate)} - n={formatCompactNumber(row.sampleCount)}</small>
            </article>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

function ConfusionAndDrivers({ data }: { data: ChurnPredictionResult }) {
  const matrix = data.confusionMatrix
  const maxDriver = Math.max(...data.globalDrivers.map((row) => row.importance), 1)
  return (
    <div className="churn-grid churn-grid--two">
      <GlassCard interactive={false} className="churn-panel churn-confusion">
        <div className="churn-panel__head"><div><span>Selected Threshold</span><h2>Confusion Matrix</h2></div></div>
        <div className="churn-confusion__grid">
          <article><span>True Positive</span><strong>{formatCompactNumber(matrix.truePositive)}</strong><small>Predicted churn dan actual churn.</small></article>
          <article><span>False Positive</span><strong>{formatCompactNumber(matrix.falsePositive)}</strong><small>Diprediksi churn tetapi kembali.</small></article>
          <article><span>False Negative</span><strong>{formatCompactNumber(matrix.falseNegative)}</strong><small>Diprediksi aman tetapi churn.</small></article>
          <article><span>True Negative</span><strong>{formatCompactNumber(matrix.trueNegative)}</strong><small>Diprediksi aman dan kembali.</small></article>
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="churn-panel churn-drivers">
        <div className="churn-panel__head"><div><span>Explainability</span><h2>Top Churn Drivers</h2></div></div>
        {data.globalDrivers.map((row) => (
          <article key={row.feature}>
            <div><strong>{row.label}</strong><span>{row.direction === 'risk-up' ? 'risk-up' : 'risk-down'}</span></div>
            <i style={{ width: `${Math.max(4, (row.importance / maxDriver) * 100)}%` }} />
            <small>{row.interpretation}</small>
          </article>
        ))}
      </GlassCard>
    </div>
  )
}

function ComparisonAndCustomers({ data }: { data: ChurnPredictionResult }) {
  return (
    <div className="churn-grid churn-grid--two">
      <GlassCard interactive={false} className="churn-panel churn-table-card">
        <div className="churn-panel__head"><div><span>Segment Performance</span><h2>Risk by Comparison Dimension</h2></div></div>
        <div className="churn-table-wrap">
          <table className="churn-table">
            <thead><tr><th>Dimension</th><th>Eligible</th><th>High Risk</th><th>Avg Prob.</th><th>Value at Risk</th><th>Driver</th></tr></thead>
            <tbody>
              {data.comparisonRows.slice(0, 10).map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.label}</strong></td>
                  <td>{formatCompactNumber(row.eligibleCustomers)}</td>
                  <td>{formatPercent(row.highRiskShare)}</td>
                  <td>{formatPercent(row.averageProbability)}</td>
                  <td>{formatCompactCurrency(row.expectedValueAtRisk)}</td>
                  <td>{row.primaryDriver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="churn-panel churn-table-card">
        <div className="churn-panel__head"><div><span>Synthetic ID</span><h2>High-Risk Customer Table</h2></div><small>Top 250 only.</small></div>
        <div className="churn-table-wrap">
          <table className="churn-table">
            <thead><tr><th>Customer</th><th>Risk</th><th>Band</th><th>Recency</th><th>Tx</th><th>Value at Risk</th><th>Driver</th></tr></thead>
            <tbody>
              {data.customers.slice(0, 12).map((row) => (
                <tr key={row.customerId}>
                  <td><strong>{row.customerId}</strong></td>
                  <td>{formatPercent(row.churnProbability)}</td>
                  <td><em className={`risk-pill risk-pill--${row.riskBand}`}>{row.riskBandLabel}</em></td>
                  <td>{formatDays(row.recencyDays)}</td>
                  <td>{formatCompactNumber(row.transactionCount)}</td>
                  <td>{formatCurrency(row.expectedValueAtRisk)}</td>
                  <td>{row.primaryRiskDriver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

function InsightsActions({ data }: { data: ChurnPredictionResult }) {
  return (
    <div className="churn-grid churn-grid--two">
      <GlassCard interactive={false} className="churn-panel churn-notes">
        <div className="churn-panel__head"><div><span>Detected Signals</span><h2>Churn Prediction Insights</h2></div></div>
        <ol>{data.insights.map((row) => <li key={row}>{row}</li>)}</ol>
      </GlassCard>
      <GlassCard interactive={false} className="churn-panel churn-notes">
        <div className="churn-panel__head"><div><span>Guardrails</span><h2>Methodology</h2></div></div>
        <ol>{data.methodology.map((row) => <li key={row}>{row}</li>)}</ol>
      </GlassCard>
      <GlassCard interactive={false} className="churn-panel churn-actions">
        <div className="churn-panel__head"><div><span>Retention Support</span><h2>Recommended Actions</h2></div></div>
        {data.recommendations.map((row) => (
          <article key={row.id}>
            <span>{row.priority}</span>
            <strong>{row.segment}</strong>
            <p>{row.evidence}</p>
            <small>{row.action} {row.reliabilityNote}</small>
          </article>
        ))}
      </GlassCard>
      <GlassCard interactive={false} className="churn-panel churn-actions">
        <div className="churn-panel__head"><div><span>Monitoring</span><h2>Fairness & Drift</h2></div></div>
        {[...data.fairness, ...data.drift].map((row) => (
          <article key={row.label}>
            <span>{'status' in row ? row.status : 'Stable'}</span>
            <strong>{row.label}</strong>
            <p>{'sampleCount' in row ? `${formatCompactNumber(row.sampleCount)} sample - avg risk ${formatPercent(row.averagePredictedRisk)}` : `value ${formatScore(row.value, 2)}`}</p>
          </article>
        ))}
      </GlassCard>
    </div>
  )
}

export default function ChurnPrediction() {
  useInsights()
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<ChurnPredictionLocalFilters>(defaultChurnPredictionLocalFilters)
  const [payload, setPayload] = useState<ChurnPredictionJson | null>(null)
  const [payloadError, setPayloadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/assets/churnPrediction.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Churn prediction aggregate gagal dimuat (${response.status})`)
        return response.json() as Promise<ChurnPredictionJson>
      })
      .then((json) => { if (active) setPayload(json) })
      .catch((fetchError: unknown) => { if (active) setPayloadError(fetchError instanceof Error ? fetchError.message : 'Churn aggregate gagal dimuat') })
    return () => { active = false }
  }, [])

  const data = useMemo(() => (payload ? queryChurnPrediction(payload, filters, localFilters) : null), [payload, filters, localFilters])
  const setLocal = <K extends keyof ChurnPredictionLocalFilters>(key: K, value: ChurnPredictionLocalFilters[K]) => setLocalFilters((state) => ({ ...state, [key]: value }))

  let body
  if (loading || (!data && !error && !payloadError)) {
    body = <DashboardSkeleton />
  } else if (error || payloadError) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error ?? payloadError ?? 'Unknown error'} />
  } else if (!data || data.summary.eligibleCustomers === 0) {
    body = <StateMessage icon={Users} title="Tidak ada pelanggan eligible untuk kombinasi filter ini." description="Perluas filter global, reset filter lokal, atau gunakan horizon lain." action={<button className="churn-button" type="button" onClick={() => setLocalFilters(defaultChurnPredictionLocalFilters)}>Reset Churn Filters</button>} />
  } else {
    body = (
      <>
        <SummaryCards data={data} />
        <div className="churn-grid churn-grid--two"><RiskDistribution data={data} /><ModelPerformance data={data} /></div>
        <CurvePanel data={data} />
        <ConfusionAndDrivers data={data} />
        <ComparisonAndCustomers data={data} />
        <InsightsActions data={data} />
      </>
    )
  }

  return (
    <div className="churn-prediction">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Churn Prediction' : data ? `${data.summary.eligibleCustomers} eligible customers dianalisis` : 'Churn Prediction siap'}
      </p>
      <section className="churn-prediction__hero">
        <div className="hero-copy">
          <span>Predictive Analytics</span>
          <h1>Churn Prediction <LineChart size={22} strokeWidth={2} /></h1>
          <p>
            {data
              ? `Reference Date: ${data.summary.predictionReferenceDate} - Horizon: ${data.summary.predictionHorizonDays} Hari - Observation Window: ${data.summary.observationWindowDays} Hari. Identifikasi pelanggan yang berisiko tidak kembali berdasarkan pola transaksi, engagement, pengalaman, dan lifecycle pelanggan.`
              : 'Identifikasi pelanggan yang berisiko tidak kembali berdasarkan pola transaksi, engagement, pengalaman, dan lifecycle pelanggan.'}
          </p>
        </div>
        <div className="churn-prediction__badge" title="Probabilitas churn merupakan estimasi model dan bukan kepastian perilaku pelanggan.">
          <BadgeInfo size={16} /><span>Prediction Source: Synthetic Customer Dataset</span><Info size={14} />
        </div>
      </section>

      {data && (
        <section className="churn-prediction__filters" aria-label="Churn Prediction filters">
          <div className="churn-prediction__filters-title"><SlidersHorizontal size={16} /><span>Prediction Controls</span></div>
          <select aria-label="Prediction horizon" value={localFilters.horizon} onChange={(event) => setLocal('horizon', Number(event.target.value) as ChurnHorizon)}>
            {[30, 60, 90].map((days) => <option key={days} value={days}>{days} Hari</option>)}
          </select>
          <select aria-label="Threshold policy" value={localFilters.thresholdPolicy} onChange={(event) => setLocal('thresholdPolicy', event.target.value as ChurnPredictionLocalFilters['thresholdPolicy'])}>
            {Object.entries(churnPredictionConfig.thresholdPolicies).map(([id, policy]) => <option key={id} value={id}>{policy.label}</option>)}
          </select>
          <select aria-label="Risk band" value={localFilters.riskBand} onChange={(event) => setLocal('riskBand', event.target.value as ChurnPredictionLocalFilters['riskBand'])}>
            <option value="all">Semua Risk Band</option>
            {churnPredictionConfig.riskBands.map((band) => <option key={band.id} value={band.id}>{band.label}</option>)}
          </select>
          <select aria-label="Membership filter" value={localFilters.member} onChange={(event) => setLocal('member', event.target.value as ChurnPredictionLocalFilters['member'])}>
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
          <select aria-label="Primary risk driver" value={localFilters.driver} onChange={(event) => setLocal('driver', event.target.value)}>
            <option value="all">Semua Driver</option>
            {data.available.drivers.map((driver) => <option key={driver} value={driver}>{driver}</option>)}
          </select>
          <select aria-label="Comparison dimension" value={localFilters.comparison} onChange={(event) => setLocal('comparison', event.target.value as ChurnPredictionLocalFilters['comparison'])}>
            <option value="segment">Customer Segment</option>
            <option value="age">Age Group</option>
            <option value="gender">Gender</option>
            <option value="member">Member</option>
            <option value="channel">Preferred Channel</option>
            <option value="location">Location</option>
            <option value="acquisition">Acquisition Source</option>
            <option value="rfm">RFM Segment</option>
            <option value="journey">Journey Stage</option>
          </select>
          <label>Search<input aria-label="Search synthetic customer ID" value={localFilters.search} onChange={(event) => setLocal('search', event.target.value)} /></label>
          <button type="button" aria-label="Reset Churn filters" onClick={() => setLocalFilters(defaultChurnPredictionLocalFilters)}><RefreshCcw size={15} /> Reset</button>
        </section>
      )}

      {body}
      {data && <footer className="churn-prediction__source">Model version: {data.meta.modelVersion}. Feature version: {data.meta.featureVersion}. Churn target: no valid transaction during horizon after prediction reference date. Customer with insufficient history is excluded from prediction.</footer>}
    </div>
  )
}
