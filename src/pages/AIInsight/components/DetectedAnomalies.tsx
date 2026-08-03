import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AIInsightAnomaly } from '@/data/aiInsightSelectors'
import { formatPercent, formatScore } from '@/data/formatters'

export default function DetectedAnomalies({ anomalies }: { anomalies: AIInsightAnomaly[] }) {
  return (
    <GlassCard interactive={false} className="ai-panel">
      <SectionTitle icon={AlertTriangle} title="Detected Anomalies" subtitle="Deviasi time series, bukan klaim sebab-akibat" tone="orange" />
      <div className="ai-anomaly-list">
        {anomalies.length ? anomalies.map((anomaly) => (
          <article key={anomaly.id}>
            <div>
              <strong>{anomaly.metric}</strong>
              <span>{anomaly.period} · {anomaly.affectedDimension}</span>
            </div>
            <b>{anomaly.formattedObserved}</b>
            <small>Expected {anomaly.expectedRange}</small>
            <em>Deviation {formatScore(anomaly.deviation)} · {formatPercent(anomaly.confidence)} confidence</em>
            <p>{anomaly.possibleRelatedFactors.length ? anomaly.possibleRelatedFactors.join(', ') : 'Perlu investigasi faktor operasional atau campaign.'}</p>
            {anomaly.route && <Link to={anomaly.route}>Source <ArrowUpRight size={14} /></Link>}
          </article>
        )) : <div className="ai-empty">Tidak ada anomali yang melewati threshold untuk filter aktif.</div>}
      </div>
    </GlassCard>
  )
}
