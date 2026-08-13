import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout'
import ProtectedRoute from '@/router/ProtectedRoute'
import { flattenSidebarItems, legacyRedirects } from '@/components/layout/Sidebar/sidebarItems'
import Login from '@/pages/Login'
import GrowthLoop from '@/pages/GrowthLoop'
import Summary from '@/pages/Summary'
import Dashboard from '@/pages/Dashboard'
import CustomerProfile from '@/pages/CustomerProfile'
import CustomerNeeds from '@/pages/CustomerNeeds'
import CustomerMotivation from '@/pages/CustomerMotivation'
import CustomerPerception from '@/pages/CustomerInsights/CustomerPerception'
import PlaceholderPage from '@/pages/PlaceholderPage'
import PainPoints from '@/pages/PainPoints'
import PurchaseBehaviour from '@/pages/PurchaseBehaviour'
import MarketBasket from '@/pages/PurchaseAnalytics/MarketBasket'
import CustomerJourney from '@/pages/PurchaseAnalytics/CustomerJourney'
import RFMAnalysis from '@/pages/PurchaseAnalytics/RFMAnalysis'
import CohortAnalysis from '@/pages/PurchaseAnalytics/CohortAnalysis'
import GoogleAdsAnalytics from '@/pages/MarketingAnalytics/GoogleAds'
import MetaAdsAnalytics from '@/pages/MarketingAnalytics/MetaAds'
import YouTubeAdsAnalytics from '@/pages/MarketingAnalytics/YouTubeAds'
import CampaignPerformance from '@/pages/MarketingAnalytics/CampaignPerformance'
import Attribution from '@/pages/MarketingAnalytics/Attribution'
import AIInsight from '@/pages/AIInsight'
import DemandForecast from '@/pages/PredictiveAnalytics/DemandForecast'
import ChurnPrediction from '@/pages/PredictiveAnalytics/ChurnPrediction'
import CLVPrediction from '@/pages/PredictiveAnalytics/CLVPrediction'
import SalesForecast from '@/pages/PredictiveAnalytics/SalesForecast'
import Recommendation from '@/pages/Recommendation'

const implementedRoutes = new Set([
  '/',
  '/summary',
  '/growth-loop',
  '/customer-insights/profil-pelanggan',
  '/customer-insights/kebutuhan-pelanggan',
  '/customer-insights/pain-points',
  '/customer-insights/motivasi-pelanggan',
  '/customer-insights/persepsi-pelanggan',
  '/purchase-analytics/perilaku-pembelian',
  '/purchase-analytics/rfm-analysis',
  '/purchase-analytics/cohort-analysis',
  '/purchase-analytics/market-basket',
  '/purchase-analytics/customer-journey',
  '/marketing-analytics/google-ads',
  '/marketing-analytics/meta-ads',
  '/marketing-analytics/youtube-ads',
  '/marketing-analytics/campaign-performance',
  '/marketing-analytics/attribution',
  '/predictive-analytics/churn-prediction',
  '/predictive-analytics/customer-lifetime-value-prediction',
  '/predictive-analytics/demand-forecast',
  '/predictive-analytics/sales-forecast',
  '/ai-insight',
  '/recommendation',
])

const placeholderRoutes = flattenSidebarItems().filter((item) => !implementedRoutes.has(item.path))

export default function AppRouter() {
  return (
    <Routes>
      {/* The only public route. Everything below sits behind ProtectedRoute. */}
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/growth-loop" element={<GrowthLoop />} />
          <Route path="/customer-insights/profil-pelanggan" element={<CustomerProfile />} />
          <Route path="/customer-insights/kebutuhan-pelanggan" element={<CustomerNeeds />} />
          <Route path="/customer-insights/pain-points" element={<PainPoints />} />
          <Route path="/customer-insights/motivasi-pelanggan" element={<CustomerMotivation />} />
          <Route path="/customer-insights/persepsi-pelanggan" element={<CustomerPerception />} />
          <Route path="/purchase-analytics/perilaku-pembelian" element={<PurchaseBehaviour />} />
          <Route path="/purchase-analytics/rfm-analysis" element={<RFMAnalysis />} />
          <Route path="/purchase-analytics/cohort-analysis" element={<CohortAnalysis />} />
          <Route path="/purchase-analytics/market-basket" element={<MarketBasket />} />
          <Route path="/purchase-analytics/customer-journey" element={<CustomerJourney />} />
          <Route path="/marketing-analytics/google-ads" element={<GoogleAdsAnalytics />} />
          <Route path="/marketing-analytics/meta-ads" element={<MetaAdsAnalytics />} />
          <Route path="/marketing-analytics/youtube-ads" element={<YouTubeAdsAnalytics />} />
          <Route path="/marketing-analytics/campaign-performance" element={<CampaignPerformance />} />
          <Route path="/marketing-analytics/attribution" element={<Attribution />} />
          <Route path="/predictive-analytics/churn-prediction" element={<ChurnPrediction />} />
          <Route path="/predictive-analytics/customer-lifetime-value-prediction" element={<CLVPrediction />} />
          <Route path="/predictive-analytics/demand-forecast" element={<DemandForecast />} />
          <Route path="/predictive-analytics/sales-forecast" element={<SalesForecast />} />
          <Route path="/ai-insight" element={<AIInsight />} />
          <Route path="/recommendation" element={<Recommendation />} />
          {placeholderRoutes.map((item) => (
            <Route
              key={item.id}
              path={item.path}
              element={<PlaceholderPage title={item.label} description={item.description} />}
            />
          ))}
          {Object.entries(legacyRedirects).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
        </Route>
      </Route>

      {/* Unknown paths fall back to the dashboard root, which ProtectedRoute
          then bounces to /login when there is no session. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
