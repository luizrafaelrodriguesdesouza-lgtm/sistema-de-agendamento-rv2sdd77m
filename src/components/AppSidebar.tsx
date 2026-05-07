import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Settings,
  BarChart,
  Users,
  Globe,
  LogOut,
  FileText,
  PieChart,
  Star,
} from 'lucide-react'
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
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/dashboard/profissional'}
                    >
                      <Link to="/dashboard/profissional">
                        <Calendar /> Resumo
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/dashboard/profissional/agenda'}
                    >
                      <Link to="/dashboard/profissional/agenda">
                        <Calendar /> Minha Agenda
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/dashboard/profissional/servicos'}
                    >
                      <Link to="/dashboard/profissional/servicos">
                        <FileText /> Meus Serviços
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              {userRole === 'proprietario' && (
                <>
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
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/dashboard/proprietario/equipe'}
                    >
                      <Link to="/dashboard/proprietario/equipe">
                        <Users /> Equipe
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/dashboard/proprietario/servicos'}
                    >
                      <Link to="/dashboard/proprietario/servicos">
                        <FileText /> Catálogo de Serviços
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/dashboard/proprietario/relatorios'}
                    >
                      <Link to="/dashboard/proprietario/relatorios">
                        <PieChart /> Relatórios
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/dono/plano'}>
                      <Link to="/dono/plano">
                        <Star /> Meu Plano
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
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
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/admin/reports'}>
                      <Link to="/admin/reports">
                        <PieChart /> Relatórios
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
