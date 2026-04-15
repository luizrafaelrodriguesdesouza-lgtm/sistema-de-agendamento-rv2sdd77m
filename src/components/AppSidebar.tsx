import { Link, useLocation } from 'react-router-dom'
import { Calendar, Settings, BarChart, Users, Globe } from 'lucide-react'
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
  const userRole = (user as any)?.tipo || (user as any)?.role

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
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
