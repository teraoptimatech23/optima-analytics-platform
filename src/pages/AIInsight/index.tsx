import { useMemo, useState } from 'react'
import { BadgeInfo, BrainCircuit, Inbox, Search, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { defaultAIInsightLocalFilters, queryAIInsights } from '@/data/aiInsightSelectors'
import type { AIInsightItem, AIInsightLocalFilters } from '@/data/aiInsightSelectors'
import { formatPercent } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import AIInsightSummaryCards from './components/AIInsightSummaryCards'
import DetectedAnomalies from './components/DetectedAnomalies'
import ExecutiveInsightSummary from './components/ExecutiveInsightSummary'
import InsightDetailDrawer from './components/InsightDetailDrawer'
import InsightFeed from './components/InsightFeed'
import InsightThemes from './components/InsightThemes'
import OpportunitiesRisks from './components/OpportunitiesRisks'
import PriorityActions from './components/PriorityActions'
import RelatedSignals from './components/RelatedSignals'
import WhatChanged from './components/WhatChanged'
import './index.less'

export default function AIInsight() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<AIInsightLocalFilters>(defaultAIInsightLocalFilters)
  const [selectedInsight, setSelectedInsight] = useState<AIInsightItem | null>(null)
  const data = useMemo(() => (cube ? queryAIInsights(cube, filters, localFilters) : null), [cube, filters, localFilters])
  const hasNoInsights = !loading && !error && data !== null && data.allInsights.length === 0

  const updateFilter = <K extends keyof AIInsightLocalFilters>(key: K, value: AIInsightLocalFilters[K]) => {
    setLocalFilters((state) => ({ ...state, [key]: value }))
  }

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else if (hasNoInsights || !data) {
    body = (
      <StateMessage
        icon={Inbox}
        title="Belum ada insight signifikan untuk kombinasi filter ini."
        description="Coba perluas periode atau kurangi filter. Insight engine tidak memaksa insight ketika evidence belum melewati threshold."
      />
    )
  } else {
    body = (
      <>
        <AIInsightSummaryCards data={data} />
        <ExecutiveInsightSummary insights={data.executiveInsights} onSelect={setSelectedInsight} />
        <div className="ai-insight__split">
          <OpportunitiesRisks insights={data.allInsights} onSelect={setSelectedInsight} />
          <PriorityActions actions={data.actions} />
        </div>
        <div className="ai-insight__split">
          <DetectedAnomalies anomalies={data.anomalies} />
          <RelatedSignals relationships={data.relationships} />
        </div>
        <div className="ai-insight__split">
          <InsightThemes themes={data.themes} />
          <WhatChanged changes={data.changes} />
        </div>
        <InsightFeed data={data} onSelect={setSelectedInsight} />
        <InsightDetailDrawer insight={selectedInsight} methodology={data.methodology} onClose={() => setSelectedInsight(null)} />
      </>
    )
  }

  return (
    <div className="ai-insight">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat AI Insight' : data ? `${data.summary.totalInsights} insight tersedia` : 'AI Insight siap'}
      </p>
      <section className="ai-insight__hero">
        <div className="hero-copy">
          <span>Enterprise Business Intelligence</span>
          <h1>
            AI Insight
            <BrainCircuit size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.filterLabel} · ${data.summary.totalInsights} insight · rata-rata confidence ${formatPercent(data.summary.avgConfidence)}. Ringkasan otomatis mengenai peluang, risiko, perubahan penting, dan tindakan prioritas berdasarkan seluruh data pelanggan dan pemasaran.`
              : 'Ringkasan otomatis mengenai peluang, risiko, perubahan penting, dan tindakan prioritas berdasarkan seluruh data pelanggan dan pemasaran.'}
          </p>
        </div>
        <div className="ai-insight__badge">
          <BadgeInfo size={16} />
          <span>{data?.engineLabel ?? 'Insight Engine: Data-Driven Rules'}</span>
        </div>
      </section>

      {data && (
        <section className="ai-insight__filters" aria-label="Filter lokal AI Insight">
          <div className="ai-insight__filters-title">
            <SlidersHorizontal size={16} />
            <span>Insight filters</span>
          </div>
          <label>
            <Search size={16} />
            <input value={localFilters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Cari insight, entity, source..." />
          </label>
          <select aria-label="Filter category" value={localFilters.category} onChange={(event) => updateFilter('category', event.target.value as AIInsightLocalFilters['category'])}>
            <option value="all">Semua Category</option>
            {data.availableCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label="Filter priority" value={localFilters.priority} onChange={(event) => updateFilter('priority', event.target.value as AIInsightLocalFilters['priority'])}>
            <option value="all">Semua Priority</option>
            {data.availablePriorities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label="Filter confidence" value={localFilters.confidence} onChange={(event) => updateFilter('confidence', event.target.value as AIInsightLocalFilters['confidence'])}>
            <option value="all">Semua Confidence</option>
            <option value="high">High Evidence</option>
            <option value="medium">Medium Evidence</option>
            <option value="low">Low Evidence</option>
          </select>
          <select aria-label="Filter source module" value={localFilters.sourceModule} onChange={(event) => updateFilter('sourceModule', event.target.value as AIInsightLocalFilters['sourceModule'])}>
            <option value="all">Semua Source</option>
            {data.availableSourceModules.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label="Filter sentiment" value={localFilters.sentiment} onChange={(event) => updateFilter('sentiment', event.target.value as AIInsightLocalFilters['sentiment'])}>
            <option value="all">Semua Sentiment</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
          <select aria-label="Filter affected entity" value={localFilters.affectedEntity} onChange={(event) => updateFilter('affectedEntity', event.target.value)}>
            {data.availableEntities.map((item) => <option key={item} value={item}>{item === 'all' ? 'Semua Entity' : item}</option>)}
          </select>
          <select aria-label="Sort insight" value={localFilters.sort} onChange={(event) => updateFilter('sort', event.target.value as AIInsightLocalFilters['sort'])}>
            <option value="priority">Priority</option>
            <option value="confidence">Confidence</option>
            <option value="latest">Latest</option>
            <option value="impact">Largest Impact</option>
          </select>
        </section>
      )}

      {body}

      <footer className="ai-insight__source">
        Sumber Data: insights.json aggregate layer, selector Profil Pelanggan, Kebutuhan Pelanggan, Pain Points, Perilaku Pembelian, Google Ads, Meta Ads, dan Campaign Performance. Tidak ada provider AI eksternal atau API key baru.
      </footer>
    </div>
  )
}
