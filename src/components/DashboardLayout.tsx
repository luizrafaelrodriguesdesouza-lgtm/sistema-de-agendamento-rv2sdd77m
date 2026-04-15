import { Outlet, Navigate } from 'react-router-dom'
import { Header } from './Header'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import useAuthStore from '@/stores/useAuthStore'

export default function DashboardLayout() {
  const { user } = useAuthStore()

  if (!user || user.role === 'cliente') {
    return <Navigate to="/login" replace />
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans text-foreground selection:bg-primary/20">
        <AppSidebar />
        <SidebarInset className="flex w-full flex-col flex-1 bg-background">
          <Header />
          <div className="p-4 flex items-center gap-3 border-b bg-white shadow-sm md:hidden">
            <SidebarTrigger />
            <span className="font-semibold text-primary">Painel de Gestão</span>
          </div>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
