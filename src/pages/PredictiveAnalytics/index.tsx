import type { ComponentType } from 'react'
import { BrainCircuit, Database, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import AIInsight from '@/pages/AIInsight'
import ChurnPrediction from '@/pages/PredictiveAnalytics/ChurnPrediction'
import CLVPrediction from '@/pages/PredictiveAnalytics/CLVPrediction'
import DemandForecast from '@/pages/PredictiveAnalytics/DemandForecast'
import SalesForecast from '@/pages/PredictiveAnalytics/SalesForecast'
import '@/pages/ValueLoop/index.less'

const predictiveModules: Array<{
  id: string
  label: string
  scope: string
  component: ComponentType
}> = [
  { id: 'insights', label: 'Cross-Loop Insights', scope: 'Signals and anomalies across customer, traffic, engagement, retention, and value.', component: AIInsight },
  { id: 'churn', label: 'Churn Prediction', scope: 'Retention risk model with existing temporal guardrails and validation.', component: ChurnPrediction },
  { id: 'clv', label: 'CLV Prediction', scope: 'Historical and predicted customer value with explicit horizons.', component: CLVPrediction },
  { id: 'demand', label: 'Demand Forecast', scope: 'Demand outlook by category and outlet from the existing model.', component: DemandForecast },
  { id: 'sales', label: 'Sales Forecast', scope: 'Revenue and sales outlook from the existing forecast pipeline.', component: SalesForecast },
]

export default function PredictiveAnalytics() {
  const [searchParams] = useSearchParams()
  const requestedView = searchParams.get('view')
  const defaultModule = predictiveModules[0]
  if (!defaultModule) return null

  const activeModule = predictiveModules.find((item) => item.id === requestedView) ?? defaultModule
  const ActiveAnalytics = activeModule.component

  return (
    <div className="value-loop-stage value-loop-stage--blue">
      <header className="value-loop-stage__header">
        <div className="value-loop-stage__identity">
          <span className="value-loop-stage__icon" aria-hidden="true"><BrainCircuit size={24} /></span>
          <div>
            <span>Intelligence Layer</span>
            <h1>Predictive Analytics</h1>
            <p>Model existing yang membaca sinyal dari seluruh Digital Value Loop dalam satu workspace analisis.</p>
          </div>
        </div>
        <div className="value-loop-stage__health" aria-label="Predictive model governance">
          <span>Model policy</span>
          <strong><ShieldCheck size={28} /></strong>
          <em>Validated models only</em>
        </div>
      </header>

      <section className="value-loop-stage__orientation" aria-label="Predictive analytics scope">
        <div>
          <span><BrainCircuit size={15} />Cross-loop intelligence</span>
          <strong>Customer, Traffic, Engagement, Retention, and Value signals feed one advanced layer.</strong>
        </div>
        <div>
          <span><Database size={15} />Evidence boundary</span>
          <strong>No generated prediction is presented without an existing model and validation pipeline.</strong>
          <small>Next best offer remains outside the active model set until a validated model is available.</small>
        </div>
      </section>

      <nav className="value-loop-stage__tabs" aria-label="Predictive analytics models" role="tablist">
        {predictiveModules.map((item) => {
          const active = item.id === activeModule.id
          return (
            <Link
              className={active ? 'is-active' : undefined}
              key={item.id}
              role="tab"
              aria-selected={active}
              to={`/predictive-analytics?view=${item.id}`}
              title={item.scope}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <section className="value-loop-stage__detail" aria-label={`${activeModule.label} model analytics`}>
        <div className="value-loop-stage__detail-head">
          <div><span>Predictive Model</span><h2>{activeModule.label}</h2></div>
          <p>{activeModule.scope}</p>
        </div>
        <ActiveAnalytics />
      </section>
    </div>
  )
}
