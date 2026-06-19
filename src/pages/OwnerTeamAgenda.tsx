import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import useMasterStore from '@/stores/useMasterStore'
import { Clock, User as UserIcon } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function OwnerTeamAgenda() {
  const { user } = useAuth()
  const { selectedOwnerId } = useMasterStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getTargetId = () => (user?.tipo === 'master' ? selectedOwnerId : user?.id)

  const loadData = async () => {
    const targetId = getTargetId()
    if (!targetId) {
      setAppointments([])
      setLoading(false)
      return
    }

    try {
      const records = await pb.collection('agendamentos').getFullList({
        filter: `(profissional_id.proprietario_id = '${targetId}' || profissional_id = '${targetId}') && data >= @now`,
        sort: 'data',
        expand: 'profissional_id,servico_id',
      })
      setAppointments(records)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, selectedOwnerId])

  useRealtime('agendamentos', () => loadData())

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Agenda da Equipe</h2>
        <p className="text-slate-500 mt-1">Próximos agendamentos de todos os profissionais.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Próximos Agendamentos</CardTitle>
          <CardDescription>Acompanhe o fluxo de clientes da sua clínica.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Carregando agenda...</div>
          ) : appointments.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500">
              Nenhum agendamento futuro encontrado para a equipe.
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((app) => {
                const appDate = parseISO(app.data)
                return (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row justify-between p-4 border rounded-xl bg-white hover:border-primary/50 transition-colors gap-4"
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex flex-col items-center justify-center text-primary shrink-0">
                        <span className="text-xs font-bold">{format(appDate, 'dd')}</span>
                        <span className="text-[10px] uppercase">
                          {format(appDate, 'MMM', { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800">
                            {app.cliente_nome || 'Cliente não identificado'}
                          </h4>
                          <Badge
                            variant="outline"
                            className={
                              app.status === 'confirmado'
                                ? 'bg-emerald-50 text-emerald-700'
                                : app.status === 'cancelado'
                                  ? 'bg-rose-50 text-rose-700'
                                  : app.status === 'concluido'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-amber-50 text-amber-700'
                            }
                          >
                            {app.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {format(appDate, 'HH:mm')}
                          <span className="mx-1">•</span>
                          {app.expand?.servico_id?.nome}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5" />{' '}
                          {app.expand?.profissional_id?.name || 'Profissional'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
