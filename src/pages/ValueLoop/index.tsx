import type { ComponentType } from 'react'
import { ArrowRight, CheckCircle2, Database, Layers3 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import CustomerProfile from '@/pages/CustomerProfile'
import CustomerNeeds from '@/pages/CustomerNeeds'
import PainPoints from '@/pages/PainPoints'
import CustomerMotivation from '@/pages/CustomerMotivation'
import CustomerPerception from '@/pages/CustomerInsights/CustomerPerception'
import PurchaseBehaviour from '@/pages/PurchaseBehaviour'
import CustomerJourney from '@/pages/PurchaseAnalytics/CustomerJourney'
import MarketBasket from '@/pages/PurchaseAnalytics/MarketBasket'
import CampaignPerformance from '@/pages/MarketingAnalytics/CampaignPerformance'
import GoogleAdsAnalytics from '@/pages/MarketingAnalytics/GoogleAds'
import MetaAdsAnalytics from '@/pages/MarketingAnalytics/MetaAds'
import YouTubeAdsAnalytics from '@/pages/MarketingAnalytics/YouTubeAds'
import Attribution from '@/pages/MarketingAnalytics/Attribution'
import RFMAnalysis from '@/pages/PurchaseAnalytics/RFMAnalysis'
import CohortAnalysis from '@/pages/PurchaseAnalytics/CohortAnalysis'
import ChurnPrediction from '@/pages/PredictiveAnalytics/ChurnPrediction'
import CLVPrediction from '@/pages/PredictiveAnalytics/CLVPrediction'
import SalesForecast from '@/pages/PredictiveAnalytics/SalesForecast'
import DemandForecast from '@/pages/PredictiveAnalytics/DemandForecast'
import Recommendation from '@/pages/Recommendation'
import AIInsight from '@/pages/AIInsight'
import {
  valueLoopCoverage,
  valueLoopStageById,
  type ValueLoopStageId,
} from '@/config/valueLoop'
import './index.less'

const analyticsComponents: Record<string, ComponentType> = {
  'customer-profile': CustomerProfile,
  'customer-needs': CustomerNeeds,
  'pain-points': PainPoints,
  'customer-motivation': CustomerMotivation,
  'customer-perception': CustomerPerception,
  'purchase-behaviour': PurchaseBehaviour,
  'purchase-engagement': PurchaseBehaviour,
  'customer-journey': CustomerJourney,
  'market-basket': MarketBasket,
  'campaign-performance': CampaignPerformance,
  'google-ads': GoogleAdsAnalytics,
  'meta-ads': MetaAdsAnalytics,
  'youtube-ads': YouTubeAdsAnalytics,
  attribution: Attribution,
  'rfm-analysis': RFMAnalysis,
  'cohort-analysis': CohortAnalysis,
  'churn-prediction': ChurnPrediction,
  'clv-prediction': CLVPrediction,
  'sales-forecast': SalesForecast,
  'demand-forecast': DemandForecast,
  recommendations: Recommendation,
  'conversion-funnel': PurchaseBehaviour,
  'checkout-journey': CustomerJourney,
  'channel-conversion': CampaignPerformance,
  'conversion-attribution': Attribution,
  overview: AIInsight,
  'customer-prediction': CustomerJourney,
  'traffic-prediction': Attribution,
  'conversion-prediction': CampaignPerformance,
  'engagement-prediction': CustomerMotivation,
  'retention-prediction': ChurnPrediction,
  'value-revenue-prediction': CLVPrediction,
  'ai-insight': AIInsight,
  'profit-overview': SalesForecast,
  'channel-profitability': CampaignPerformance,
}

interface ValueLoopStagePageProps {
  stageId: ValueLoopStageId
}

export default function ValueLoopStagePage({ stageId }: ValueLoopStagePageProps) {
  const stage = valueLoopStageById[stageId]
  const [searchParams] = useSearchParams()
  const requestedView = searchParams.get('view')
  const defaultModule = stage.analytics[0]
  if (!defaultModule) return null

  const activeModule = stage.analytics.find((item) => item.id === requestedView) ?? defaultModule
  const ActiveAnalytics = analyticsComponents[activeModule.id]
  if (!ActiveAnalytics) return null

  const Icon = stage.icon

  return (
    <div className={`value-loop-stage value-loop-stage--${stage.tone}`}>
      <header className="value-loop-stage__header">
        <div className="value-loop-stage__identity">
          <span className="value-loop-stage__icon" aria-hidden="true"><Icon size={24} /></span>
          <div>
            <span>Data-Driven Digital Value Loop</span>
            <h1>{stage.label}</h1>
            <p>{stage.summary}</p>
          </div>
        </div>

        <div className="value-loop-stage__health" aria-label={`${stage.label} health score ${stage.score} dari 100`}>
          <span>Loop Health</span>
          <strong>{stage.score}<small>/100</small></strong>
          <em><CheckCircle2 size={14} />{stage.status}</em>
        </div>
      </header>

      <section className="value-loop-stage__orientation" aria-label="Loop scope and data readiness">
        <div>
          <span><Layers3 size={15} />Decision question</span>
          <strong>{stage.question}</strong>
        </div>
        <div>
          <span><Database size={15} />Source schemas</span>
          <p>{stage.sources.map((source) => <b key={source}>{source}</b>)}</p>
          <small>Adapter-ready; existing synthetic data remains the active development source.</small>
        </div>
      </section>

      <div className="value-loop-stage__coverage" aria-label="Analytics coverage">
        {valueLoopCoverage.map((item) => <span key={item}>{item}</span>)}
      </div>

      <nav className="value-loop-stage__tabs" aria-label={`${stage.label} analytics`} role="tablist">
        {stage.analytics.map((item) => {
          const active = item.id === activeModule.id
          return (
            <Link
              className={active ? 'is-active' : undefined}
              key={item.id}
              role="tab"
              aria-selected={active}
              to={`${stage.route}?view=${item.id}`}
              title={item.description}
            >
              <span>{item.label}</span>
              {active && <ArrowRight size={14} aria-hidden="true" />}
            </Link>
          )
        })}
      </nav>

      <section className="value-loop-stage__detail" aria-label={`${activeModule.label} detailed analytics`}>
        <div className="value-loop-stage__detail-head">
          <div>
            <span>Loop Analysis</span>
            <h2>{activeModule.label}</h2>
          </div>
          <p>{activeModule.description}</p>
        </div>
        <ActiveAnalytics />
      </section>
    </div>
  )
}
