import { Fragment } from 'react'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DonutChart from '@/components/charts/DonutChart/DonutChart'
import type { DonutSlice } from '@/components/charts/DonutChart/DonutChart'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import './PurchaseCard.less'

export interface PurchaseChannel {
  label: string
  value: number
  icon: LucideIcon
  tone: 'blue' | 'purple' | 'cyan' | 'orange' | 'green'
}

// Cube order is Sunday-first; the card reads Monday-first.
const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const DAY_INDEX = [1, 2, 3, 4, 5, 6, 0]
const HOURS = ['07.00 - 10.00', '11.00 - 15.00', '16.00 - 21.00']
const INTENSITY_LABELS = ['Sangat sepi', 'Sepi', 'Sedang', 'Ramai', 'Sangat ramai']

interface PurchaseCardProps {
  frequency: DonutSlice[]
  averageLabel: string
  channels: PurchaseChannel[]
  /** 3 hour-bands × 7 days, values 0–4, normalised to the busiest cell. */
  heatmap: number[][]
}

export default function PurchaseCard({ frequency, averageLabel, channels, heatmap }: PurchaseCardProps) {
  return (
    <GlassCard className="purchase-card">
      <SectionTitle icon={ShoppingCart} title="Perilaku Pembelian" />

      <div className="purchase-card__body">
        <section className="purchase-card__block">
          <h4 className="purchase-card__subtitle">
            Frekuensi Pembelian <span>(per bulan)</span>
          </h4>

          <div className="purchase-card__donut">
            <DonutChart data={frequency} centerValue={averageLabel} centerLabel="Kunjungan/bulan" />

            <ul className="purchase-card__legend">
              {frequency.map((slice) => (
                <li key={slice.label}>
                  <i style={{ background: slice.color }} aria-hidden="true" />
                  <span>{slice.label}</span>
                  <strong>{slice.value}%</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="purchase-card__block">
          <h4 className="purchase-card__subtitle">Channel Pembelian</h4>

          <div className="purchase-card__channels">
            {channels.map(({ label, value, icon: Icon, tone }) => (
              <div className="channel-row" key={label}>
                <Icon className={`channel-row__icon channel-row__icon--${tone}`} size={14} strokeWidth={1.9} />
                <span className="channel-row__label" title={label}>{label}</span>
                <ProgressBar value={value} tone={tone} size="sm" label={`${label}: ${value}% dari total transaksi`} />
                <strong className="channel-row__value">{value}%</strong>
              </div>
            ))}
          </div>

          <h4 className="purchase-card__subtitle purchase-card__subtitle--spaced">
            Waktu Pembelian Terbanyak <span>(Hari)</span>
          </h4>

          <div className="heatmap" role="img" aria-label="Waktu pembelian terbanyak per hari">
            <span className="heatmap__corner" />
            {DAYS.map((day) => (
              <span className="heatmap__day" key={day}>{day}</span>
            ))}

            {HOURS.map((hour, rowIndex) => (
              <Fragment key={hour}>
                <span className="heatmap__hour">{hour}</span>
                {DAYS.map((day, columnIndex) => {
                  const level = heatmap[rowIndex]?.[DAY_INDEX[columnIndex] ?? 0] ?? 0
                  return (
                    <span
                      className={`heatmap__cell heatmap__cell--${level}`}
                      key={`${hour}-${day}`}
                      title={`${day} ${hour} — ${INTENSITY_LABELS[level] ?? INTENSITY_LABELS[0]}`}
                    />
                  )
                })}
              </Fragment>
            ))}
          </div>

          <div className="heatmap-legend">
            <span>Sepi</span>
            <i className="heatmap__cell heatmap__cell--1" />
            <i className="heatmap__cell heatmap__cell--2" />
            <i className="heatmap__cell heatmap__cell--3" />
            <i className="heatmap__cell heatmap__cell--4" />
            <span>Ramai</span>
          </div>
        </section>
      </div>

      <button className="card-link" type="button">
        Lihat Detail <ArrowRight size={13} />
      </button>
    </GlassCard>
  )
}
