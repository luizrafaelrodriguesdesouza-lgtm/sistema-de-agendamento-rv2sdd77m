import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loadingApps, setLoadingApps] = useState(true)

  const loadAppointments = async () => {
    if (!user) return
    try {
      const records = await pb.collection('agendamentos').getFullList({
        filter: `cliente_id = '${user.id}'`,
        sort: '-data',
        expand: 'servico_id,profissional_id',
      })
      setAppointments(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingApps(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [user])

  useRealtime('agendamentos', () => {
    loadAppointments()
  })

  return (
    <div className="container py-8 px-4 animate-fade-in flex-1 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Olá, {user?.name?.split(' ')[0] || 'Cliente'}!
          </h2>
          <p className="text-slate-500 mt-1">Aqui estão seus agendamentos.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold text-slate-800">Meus Agendamentos</h3>
        </div>

        {loadingApps ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-500">Carregando seus agendamentos...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed flex flex-col items-center justify-center">
            <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium mb-2">Você ainda não tem agendamentos.</p>
            <p className="text-slate-500 text-sm mb-6">
              Acesse o link do seu estabelecimento de preferência para marcar um horário.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((app) => {
              const isConfirmed = app.status === 'confirmado'

              return (
                <Link to={`/consulta/${app.referencia}`} key={app.id} className="block group">
                  <Card
                    className={`h-full transition-all duration-300 border-2 ${isConfirmed ? 'hover:border-primary/50 hover:shadow-md' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <Badge
                          variant="secondary"
                          className={isConfirmed ? 'bg-emerald-100 text-emerald-700' : ''}
                        >
                          {app.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {format(new Date(app.data), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-800 leading-tight">
                          {app.expand?.servico_id?.nome || 'Serviço'}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1">
                          com {app.expand?.profissional_id?.name || 'Profissional'}
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t flex justify-between items-center">
                        <span className="text-xs font-mono text-slate-400">
                          Ref: {app.referencia}
                        </span>
                        <span className="text-sm font-medium text-primary group-hover:underline">
                          Ver detalhes →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
