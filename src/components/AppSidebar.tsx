import { Link, useLocation } from 'react-router-dom'
import { Calendar, Settings, BarChart } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import useAuthStore from '@/stores/useAuthStore'

export function AppSidebar() {
  const { user } = useAuthStore()
  const location = useLocation()

  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mt-4">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {user?.role === 'profissional' && (
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
              {user?.role === 'proprietario' && (
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
              {user?.role === 'master' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/dashboard/master'}>
                    <Link to="/dashboard/master">
                      <Settings /> Administração Master
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
