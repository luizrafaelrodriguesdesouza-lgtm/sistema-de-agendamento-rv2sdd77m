import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Settings, BarChart, Users, Globe, LogOut, FileText } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
import useAuthStore from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'

export function AppSidebar() {
  const { user, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const userRole = (user as any)?.tipo || (user as any)?.role

  const handleLogout = () => {
    try {
      signOut()
      navigate('/login')
    } catch (error) {
      toast({
        title: 'Aviso',
        description: 'Ocorreu um erro ao encerrar a sessão, mas você foi desconectado localmente.',
        variant: 'destructive',
      })
      navigate('/login')
    }
  }

  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mt-4">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userRole === 'profissional' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/dashboard/profissional'}
                  >
                    <Link to="/dashboard/profissional">
                      <Calendar /> Agenda do Profissional
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {userRole === 'proprietario' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/dashboard/proprietario'}
                  >
                    <Link to="/dashboard/proprietario">
                      <BarChart /> Visão Geral da Clínica
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {userRole === 'master' && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/admin/dashboard'}>
                      <Link to="/admin/dashboard">
                        <Settings /> Dashboard Master
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/admin/approvals'}>
                      <Link to="/admin/approvals">
                        <Users /> Aprovações
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/admin/webhooks'}>
                      <Link to="/admin/webhooks">
                        <Globe /> Webhooks
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/admin/logs'}>
                      <Link to="/admin/logs">
                        <FileText /> Logs
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <LogOut /> Sair
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
