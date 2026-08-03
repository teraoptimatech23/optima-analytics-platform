import { MapPinned, MonitorSmartphone, PieChart, UsersRound } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { GoogleAdsBreakdownRow, GoogleAdsInsights } from '@/data/googleAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas } from '@/data/formatters'

function BreakdownCard({ icon: Icon, title, subtitle, rows }: { icon: typeof PieChart; title: string; subtitle: string; rows: GoogleAdsBreakdownRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.conversions))
  return (
    <GlassCard interactive={false} className="google-panel google-breakdown">
      <SectionTitle icon={Icon} title={title} subtitle={subtitle} />
      <div className="google-breakdown__rows">
        {rows.slice(0, 6).map((row) => (
          <article key={row.id}>
            <div>
              <strong>{row.label}</strong>
              <span>{formatCompactNumber(row.conversions)} conv. · CPA {formatCompactCurrency(row.cpa)} · ROAS {formatRoas(row.roas)}</span>
            </div>
            <span className="google-breakdown__bar"><i style={{ width: `${Math.max(3, (row.conversions / max) * 100)}%` }} /></span>
            <small>CTR {formatPercent(row.ctr, 2)}</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

export default function GoogleAdsBreakdowns({ data }: { data: GoogleAdsInsights }) {
  return (
    <>
      <section className="google-ads__grid google-ads__grid--two">
        <BreakdownCard icon={PieChart} title="Campaign Type Analysis" subtitle="Search, PMax, App sesuai dataset" rows={data.campaignTypes} />
        <BreakdownCard icon={MonitorSmartphone} title="Performance by Device" subtitle="Mobile, Desktop, Tablet" rows={data.devices} />
      </section>
      <section className="google-ads__grid google-ads__grid--three">
        <BreakdownCard icon={UsersRound} title="Audience by Age" subtitle="Age range dari Google Ads aggregate" rows={data.ageGroups} />
        <BreakdownCard icon={UsersRound} title="Audience by Gender" subtitle="Gender dari Google Ads aggregate" rows={data.genders} />
        <BreakdownCard icon={MapPinned} title="Geographic Performance" subtitle="Location campaign, mengikuti filter wilayah" rows={data.locations} />
      </section>
    </>
  )
}
