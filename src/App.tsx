import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import Layout from './components/Layout'
import DashboardLayout from './components/DashboardLayout'

import Index from './pages/Index'
import Login from './pages/Login'
import Register from './pages/Register'
import PendingApproval from './pages/PendingApproval'
import Tracking from './pages/Tracking'
import ClientDashboard from './pages/ClientDashboard'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import MasterDashboard from './pages/MasterDashboard'
import NotFound from './pages/NotFound'

import { AuthProvider } from './hooks/use-auth'
import { DataProvider } from './stores/useDataStore'

const App = () => (
  <AuthProvider>
    <DataProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/pendente" element={<PendingApproval />} />
              <Route path="/meus-agendamentos" element={<ClientDashboard />} />
              <Route path="/consulta/:reference" element={<Tracking />} />
            </Route>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/profissional" element={<ProfessionalDashboard />} />
              <Route path="/dashboard/proprietario" element={<OwnerDashboard />} />
              <Route path="/dashboard/master" element={<MasterDashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </DataProvider>
  </AuthProvider>
)

export default App
