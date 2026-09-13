import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout'
import ProtectedRoute from '@/router/ProtectedRoute'
import { legacyRedirects } from '@/components/layout/Sidebar/valueLoopSidebarItems'
import Login from '@/pages/Login'
import Summary from '@/pages/Summary'
import ValueLoopStagePage from '@/pages/ValueLoop'

export default function ValueLoopRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/summary" replace />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/value-loop/customer-behavior" element={<ValueLoopStagePage stageId="customer-behavior" />} />
          <Route path="/value-loop/traffic-acquisition" element={<ValueLoopStagePage stageId="traffic-acquisition" />} />
          <Route path="/value-loop/conversion" element={<ValueLoopStagePage stageId="conversion" />} />
          <Route path="/value-loop/engagement" element={<ValueLoopStagePage stageId="engagement" />} />
          <Route path="/value-loop/retention" element={<ValueLoopStagePage stageId="retention" />} />
          <Route path="/value-loop/analytics" element={<ValueLoopStagePage stageId="analytics" />} />
          <Route path="/value-loop/profit-optimization" element={<ValueLoopStagePage stageId="profit-optimization" />} />
          {Object.entries(legacyRedirects).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/summary" replace />} />
    </Routes>
  )
}
