import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays, Clock, User } from 'lucide-react'
import { format, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UpcomingSectionProps {
  appointments: any[]
  loading: boolean
  onCancel: (id: string) => void
  onReschedule: (app: any) => void
}

export function UpcomingSection({
  appointments,
  loading,
  onCancel,
  onReschedule,
}: UpcomingSectionProps) {
  const today = startOfDay(new Date())

  const upcoming = useMemo(() => {
    return appointments
      .filter((a) => new Date(a.data) >= today)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [appointments, today])

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <CalendarDays className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-semibold text-slate-800">Serviços Agendados</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed flex flex-col items-center">
          <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">Nenhum agendamento futuro</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcoming.map((app) => (
            <Card
              key={app.id}
              className="border-l-4 border-l-primary hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">
                      {app.expand?.servico_id?.nome || 'Serviço'}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <User className="w-4 h-4" />{' '}
                      {app.expand?.profissional_id?.name || 'Profissional'}
                    </p>
                  </div>
                  <Badge
                    variant={app.status === 'confirmado' ? 'default' : 'secondary'}
                    className={
                      app.status === 'confirmado'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
                        : ''
                    }
                  >
                    {app.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div className="bg-slate-100 px-3 py-2 rounded-md">
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {format(new Date(app.data), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <p className="font-bold text-primary">
                    R$ {(app.expand?.servico_id?.preco || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onCancel(app.id)}
                    disabled={app.status === 'cancelado' || app.status === 'concluido'}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => onReschedule(app)}
                    disabled={app.status === 'cancelado' || app.status === 'concluido'}
                  >
                    Remarcar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
