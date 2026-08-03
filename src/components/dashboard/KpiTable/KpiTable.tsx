import { ArrowRight, BarChart3, CircleCheck } from 'lucide-react'
import Badge from '@/components/common/Badge/Badge'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import Sparkline from '@/components/charts/Sparkline/Sparkline'
import type { KpiSummaryRow } from '@/data/types'
import './KpiTable.less'

interface KpiTableProps {
  rows: KpiSummaryRow[]
}

export default function KpiTable({ rows }: KpiTableProps) {
  return (
    <GlassCard className="kpi-table-card">
      <SectionTitle
        icon={BarChart3}
        title="Ringkasan KPI Utama"
        meta={<Badge tone="neutral">This Quarter</Badge>}
      />

      <div className="kpi-table" role="table">
        <div className="kpi-table__head" role="row">
          <span role="columnheader">KPI</span>
          <span role="columnheader">Current</span>
          <span role="columnheader">vs Kuartal Lalu</span>
          <span role="columnheader">Target</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Trend</span>
        </div>

        {rows.map(({ label, current, change, target, status, trend, tone, down }) => (
          <div className="kpi-table__row" role="row" key={label}>
            <strong className="kpi-table__label">{label}</strong>
            <span className="kpi-table__current">{current}</span>
            <span className={`kpi-table__change ${down ? 'kpi-table__change--down' : ''}`}>
              <i className={`trend-arrow ${down ? 'trend-arrow--down' : ''}`} aria-hidden="true" />
              {change}
            </span>
            <span className="kpi-table__target">{target}</span>
            <span className="kpi-table__status">
              <CircleCheck size={13} strokeWidth={2} />
              {status}
            </span>
            <span className="kpi-table__trend">
              <Sparkline data={trend} tone={tone} strokeWidth={2} />
            </span>
          </div>
        ))}
      </div>

      <button className="card-link" type="button">
        Lihat KPI Lainnya <ArrowRight size={13} />
      </button>
    </GlassCard>
  )
}
