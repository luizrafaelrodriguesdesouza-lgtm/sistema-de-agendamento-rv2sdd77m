import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { Users, Globe, Building2, CalendarCheck, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import useMasterStore from '@/stores/useMasterStore'
import { Button } from '@/components/ui/button'
import { UserManagement } from '@/components/admin/UserManagement'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { RefreshCw, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  const { toast } = useToast()
  const [failedWebhooks, setFailedWebhooks] = useState<any[]>([])
  const { selectedOwnerId } = useMasterStore()
  const [pendingCount, setPendingCount] = useState(0)
  const [webhookLogsCount, setWebhookLogsCount] = useState(0)

  const [totalClinics, setTotalClinics] = useState(0)
  const [totalApps, setTotalApps] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersResult = await pb.collection('users').getList(1, 1, {
          filter: "tipo = 'proprietario' && status_aprovacao = 'pendente'",
        })
        setPendingCount(usersResult.totalItems)

        const logsResult = await pb.collection('webhook_logs').getList(1, 1)
        setWebhookLogsCount(logsResult.totalItems)

        const appsFilter = selectedOwnerId
          ? `servico_id.proprietario_id = '${selectedOwnerId}'`
          : ''

        const clinicsResult = await pb.collection('users').getList(1, 1, {
          filter: "tipo = 'proprietario'",
        })
        setTotalClinics(clinicsResult.totalItems)

        const appsList = await pb.collection('agendamentos').getFullList({
          filter: appsFilter,
          expand: 'servico_id',
        })

        setTotalApps(appsList.length)
        const revenue = appsList.reduce((acc, a) => {
          if (a.status === 'concluido' || a.status === 'confirmado') {
            return acc + (a.expand?.servico_id?.preco || 0)
          }
          return acc
        }, 0)
        setTotalRevenue(revenue)

        const failedResult = await pb.collection('agendamentos').getFullList({
          filter: 'webhook_failed = true',
          expand: 'cliente_id',
        })
        setFailedWebhooks(failedResult)
      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
      }
    }
    fetchData()
  }, [selectedOwnerId])

  useRealtime('agendamentos', () => {
    pb.collection('agendamentos')
      .getFullList({
        filter: 'webhook_failed = true',
        expand: 'cliente_id',
      })
      .then(setFailedWebhooks)
      .catch(console.error)
  })

  const handleResendWebhook = async (id: string) => {
    try {
      await pb.send(`/backend/v1/webhooks/resend/${id}`, { method: 'POST' })
      toast({ title: 'Sucesso', description: 'Webhook reenviado com sucesso.' })
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Falha ao reenviar webhook.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Dashboard Master</h2>
          <p className="text-slate-500 mt-1">Visão geral do sistema e integrações.</p>
        </div>
        {selectedOwnerId && (
          <Button asChild variant="outline">
            <Link to="/dashboard/proprietario">Ir para Dashboard da Clínica</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              {selectedOwnerId ? 'Agendamentos da Clínica' : 'Total de Agendamentos'}
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalApps}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              {selectedOwnerId ? 'Receita da Clínica' : 'Receita Total do Sistema'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">R$ {totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        {!selectedOwnerId && (
          <Card className="shadow-sm border-slate-200 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Clínicas Ativas</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalClinics}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/approvals"
          className="block outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        >
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Aprovações Pendentes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
              <p className="text-xs text-slate-500 mt-1">Proprietários aguardando aprovação</p>
            </CardContent>
          </Card>
        </Link>
        <Link
          to="/admin/webhooks"
          className="block outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        >
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Eventos de Webhook
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{webhookLogsCount}</div>
              <p className="text-xs text-slate-500 mt-1">Logs registrados no sistema</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {failedWebhooks.length > 0 && (
        <div className="pt-8 border-t border-slate-200 mt-8 animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">Falhas de Webhook</h3>
              <p className="text-sm text-slate-500">
                Agendamentos que falharam ao notificar sistemas externos.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {failedWebhooks.map((fw) => (
              <div
                key={fw.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-rose-50/50"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    Agendamento: {fw.cliente_nome || fw.expand?.cliente_id?.name || 'Sem nome'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Data do Serviço: {new Date(fw.data).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 sm:mt-0 bg-white"
                  onClick={() => handleResendWebhook(fw.id)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reenviar Webhook
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-8 border-t border-slate-200 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gerenciamento de Usuários</h2>
            <p className="text-slate-500 mt-1">
              Gerencie os usuários cadastrados no sistema e remova registros indesejados.
            </p>
          </div>
        </div>
        <UserManagement />
      </div>
    </div>
  )
}
