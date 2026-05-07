import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import Layout from './components/Layout'
import DashboardLayout from './components/DashboardLayout'
import { AdminRoute } from './components/AdminRoute'

import Index from './pages/Index'
import Booking from './pages/Booking'
import Login from './pages/Login'
import Register from './pages/Register'
import PendingApproval from './pages/PendingApproval'
import Tracking from './pages/Tracking'
import ClientDashboard from './pages/ClientDashboard'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import ProfessionalServices from './pages/ProfessionalServices'
import ProfessionalSchedule from './pages/ProfessionalSchedule'
import OwnerDashboard from './pages/OwnerDashboard'
import OwnerTeam from './pages/OwnerTeam'
import OwnerServices from './pages/OwnerServices'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminApprovals from './pages/admin/AdminApprovals'
import AdminWebhooks from './pages/admin/AdminWebhooks'
import AdminLogs from './pages/admin/AdminLogs'
import Reports from './pages/Reports'
import NotFound from './pages/NotFound'

import { AuthProvider } from './hooks/use-auth'

const IndexRouteWrapper = () => {
  const [searchParams] = useSearchParams()
  if (searchParams.get('salao')) {
    return <Booking />
  }
  return <Index />
}

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<IndexRouteWrapper />} />
            <Route path="/:slug" element={<Booking />} />
            <Route path="/agendar/:proprietarioId" element={<Booking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pendente" element={<PendingApproval />} />
            <Route path="/meus-agendamentos" element={<ClientDashboard />} />
            <Route path="/consulta/:reference" element={<Tracking />} />
          </Route>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Reports />} />
            <Route path="/dashboard/profissional" element={<ProfessionalDashboard />} />
            <Route path="/dashboard/profissional/servicos" element={<ProfessionalServices />} />
            <Route path="/dashboard/profissional/agenda" element={<ProfessionalSchedule />} />
            <Route path="/dashboard/proprietario" element={<OwnerDashboard />} />
            <Route path="/dashboard/proprietario/equipe" element={<OwnerTeam />} />
            <Route path="/dashboard/proprietario/servicos" element={<OwnerServices />} />
            <Route path="/dashboard/proprietario/relatorios" element={<Reports />} />
            <Route element={<AdminRoute />}>
              {' '}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/approvals" element={<AdminApprovals />} />
              <Route path="/admin/webhooks" element={<AdminWebhooks />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/reports" element={<Reports />} />
            </Route>{' '}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
