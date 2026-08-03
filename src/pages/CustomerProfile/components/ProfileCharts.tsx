import { BarChart3, MapPin, PieChart, ShoppingBag, UserRound } from 'lucide-react'
import DonutChart from '@/components/charts/DonutChart/DonutChart'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerProfileInsights, DistributionRow, PreferenceRow, RankedMetricRow } from '@/data/customerProfileSelectors'
import { formatClv, formatNumber, formatPercent } from '@/data/formatters'

const COLORS = ['#2f73ff', '#7d55f5', '#25c4df', '#ff9b3d', '#1c9b68', '#ef4e5b']

function Bars({ rows }: { rows: DistributionRow[] | PreferenceRow[] }) {
  return (
    <div className="profile-bars">
      {rows.map((row, index) => (
        <div className="profile-bars__row" key={row.label}>
          <span>{row.label}</span>
          <strong>{formatPercent(row.share, 0)}</strong>
          <ProgressBar value={row.share * 100} tone={index % 2 === 0 ? 'blue' : 'purple'} size="sm" />
        </div>
      ))}
    </div>
  )
}

function RankedList({ rows }: { rows: RankedMetricRow[] }) {
  return (
    <div className="ranked-list">
      {rows.map((row, index) => (
        <article className="ranked-list__row" key={row.id}>
          <span className="ranked-list__index">{index + 1}</span>
          <div>
            <strong>{row.label}</strong>
            <span>{formatNumber(row.customerCount)} pelanggan · {formatPercent(row.share)}</span>
          </div>
          <small>{row.satisfaction.toFixed(1).replace('.', ',')}/5 · {formatClv(row.clv)}</small>
        </article>
      ))}
    </div>
  )
}

export function DemographicsSection({ demographics }: { demographics: CustomerProfileInsights['demographics'] }) {
  const genderTotal = demographics.genders.reduce((sum, row) => sum + row.count, 0)

  return (
    <section className="customer-profile__grid customer-profile__grid--three" aria-label="Demografi pelanggan">
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={BarChart3} title="Kelompok Umur" subtitle="Distribusi pelanggan" />
        <Bars rows={demographics.ageGroups} />
      </GlassCard>
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={PieChart} title="Gender" subtitle="Komposisi basis" tone="purple" />
        <DonutChart
          centerValue={formatNumber(genderTotal)}
          centerLabel="pelanggan"
          data={demographics.genders.map((row, index) => ({ label: row.label, value: row.count, color: COLORS[index] ?? COLORS[0]! }))}
        />
        <Bars rows={demographics.genders} />
      </GlassCard>
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={UserRound} title="RFM Segment" subtitle="Field pekerjaan/income tidak tersedia" tone="cyan" />
        <Bars rows={demographics.segments} />
      </GlassCard>
    </section>
  )
}

export function LocationsSection({ locations }: { locations: CustomerProfileInsights['locations'] }) {
  return (
    <section className="customer-profile__grid customer-profile__grid--three" aria-label="Sebaran pelanggan">
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={MapPin} title="Top Region" subtitle="Share, satisfaction, CLV" />
        <RankedList rows={locations.regions} />
      </GlassCard>
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={MapPin} title="Top City" subtitle="Share, satisfaction, CLV" tone="purple" />
        <RankedList rows={locations.cities} />
      </GlassCard>
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={MapPin} title="Top Outlet" subtitle="Share, satisfaction, CLV" tone="orange" />
        <RankedList rows={locations.outlets} />
      </GlassCard>
    </section>
  )
}

export function PreferencesSection({ preferences }: { preferences: CustomerProfileInsights['preferences'] }) {
  return (
    <section className="customer-profile__grid customer-profile__grid--three preferences-grid" aria-label="Preferensi pelanggan">
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={ShoppingBag} title="Kategori Favorit" subtitle="Menu favorit tidak tersedia per customer" />
        <Bars rows={preferences.categories} />
      </GlassCard>
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={ShoppingBag} title="Channel Pembelian" subtitle="Dine in, takeaway, delivery" tone="purple" />
        <Bars rows={preferences.purchaseChannels} />
      </GlassCard>
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={ShoppingBag} title="Jam Favorit" subtitle="Payment method tidak tersedia" tone="cyan" />
        <Bars rows={preferences.visitHours} />
      </GlassCard>
      <GlassCard interactive={false} className="profile-panel">
        <SectionTitle icon={ShoppingBag} title="Platform Delivery" subtitle="GrabFood, GoFood, ShopeeFood" tone="orange" />
        <Bars rows={preferences.deliveryPlatforms} />
      </GlassCard>
    </section>
  )
}
