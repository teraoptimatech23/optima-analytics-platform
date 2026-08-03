import { ArrowUpRight, TrendingUpDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { AIInsightChange } from '@/data/aiInsightSelectors'
import { formatSignedPercent } from '@/data/formatters'

export default function WhatChanged({ changes }: { changes: AIInsightChange[] }) {
  return (
    <GlassCard interactive={false} className="ai-panel">
      <SectionTitle icon={TrendingUpDown} title="What Changed This Period" subtitle="Perubahan terbesar yang melewati threshold" tone="cyan" />
      <div className="ai-change-list">
        {changes.length ? changes.map((change) => (
          <article key={change.id} className={`ai-sentiment--${change.sentiment}`}>
            <div>
              <strong>{change.label}</strong>
              <span>{change.sourceModule}</span>
            </div>
            <b>{formatSignedPercent(change.delta)}</b>
            <small>{change.previous} → {change.current}</small>
            <Link to={change.route}>Detail <ArrowUpRight size={14} /></Link>
          </article>
        )) : <div className="ai-empty">Tidak ada perubahan yang melewati significance threshold.</div>}
      </div>
    </GlassCard>
  )
}
