import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { Users, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState(0)
  const [webhookLogsCount, setWebhookLogsCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersResult = await pb.collection('users').getList(1, 1, {
          filter: "tipo = 'proprietario' && status_aprovacao = 'pendente'",
        })
        setPendingCount(usersResult.totalItems)

        const logsResult = await pb.collection('webhook_logs').getList(1, 1)
        setWebhookLogsCount(logsResult.totalItems)
      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Dashboard Master</h2>
        <p className="text-slate-500 mt-1">Visão geral do sistema e integrações.</p>
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
    </div>
  )
}
