import { Activity, MapPinned, PieChart, UsersRound, Video } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MetaAdsBreakdownRow, MetaAdsInsights } from '@/data/metaAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatFrequency, formatPercent } from '@/data/formatters'

function BreakdownCard({ icon: Icon, title, subtitle, rows }: { icon: typeof PieChart; title: string; subtitle: string; rows: MetaAdsBreakdownRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.conversions))
  return (
    <GlassCard interactive={false} className="google-panel google-breakdown">
      <SectionTitle icon={Icon} title={title} subtitle={subtitle} />
      <div className="google-breakdown__rows">
        {rows.slice(0, 6).map((row) => (
          <article key={row.id}>
            <div>
              <strong>{row.label}</strong>
              <span>{formatCompactNumber(row.conversions)} conv. · CPA {formatCompactCurrency(row.cpa)} · Freq {formatFrequency(row.frequency)}</span>
            </div>
            <span className="google-breakdown__bar"><i style={{ width: `${Math.max(3, (row.conversions / max) * 100)}%` }} /></span>
            <small>Eng {formatPercent(row.engagementRate, 2)}</small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

export default function MetaAdsBreakdowns({ data }: { data: MetaAdsInsights }) {
  return (
    <>
      <section className="google-ads__grid google-ads__grid--two">
        <BreakdownCard icon={PieChart} title="Campaign Objective Analysis" subtitle="Awareness, Traffic, Conversion, Retargeting" rows={data.objectives} />
        <BreakdownCard icon={UsersRound} title="Audience Performance" subtitle="Dimensi dapat diganti dari filter lokal" rows={data.audienceRows} />
      </section>
      <section className="google-ads__grid google-ads__grid--three">
        <BreakdownCard icon={MapPinned} title="Geographic Performance" subtitle="Location dari Meta Ads aggregate" rows={data.locations} />
        <BreakdownCard icon={Activity} title="Engagement Performance" subtitle="Total engagement dan cost efficiency" rows={[...data.campaigns].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 6).map((row) => ({ ...row, id: row.campaignId, label: row.campaignName }))} />
        <BreakdownCard icon={Video} title="Video Performance" subtitle="Total video views tanpa completion quartile palsu" rows={[...data.campaigns].sort((a, b) => b.videoViews - a.videoViews).slice(0, 6).map((row) => ({ ...row, id: row.campaignId, label: row.campaignName }))} />
      </section>
    </>
  )
}
