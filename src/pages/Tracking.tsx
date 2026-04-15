import { useParams } from 'react-router-dom'
import useDataStore from '@/stores/useDataStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function Tracking() {
  const { reference } = useParams()
  const { appointments, services, professionals, setAppointments } = useDataStore()
  const { toast } = useToast()

  const app = appointments.find((a) => a.reference === reference)

  if (!app) {
    return (
      <div className="container py-32 text-center animate-fade-in flex-1">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Agendamento não encontrado</h2>
        <p className="text-slate-500">Verifique se o código de referência está correto.</p>
      </div>
    )
  }

  const srv = services.find((s) => s.id === app.serviceId)
  const prof = professionals.find((p) => p.id === app.professionalId)

  const handleCancel = () => {
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'Cancelado' } : a)),
      )
      toast({ title: 'Agendamento Cancelado' })
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'Confirmado') return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
    if (status === 'Cancelado') return 'bg-rose-100 text-rose-700 hover:bg-rose-100'
    return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
  }

  return (
    <div className="container max-w-lg py-20 px-4 animate-fade-in-up flex-1 flex flex-col justify-center">
      <Card className="shadow-elevation border-0 overflow-hidden">
        <div className="bg-primary h-2 w-full"></div>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Comprovante de Reserva</CardTitle>
            <Badge className={getStatusColor(app.status)} variant="secondary">
              {app.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Cód. Referência</span>
            <span className="font-mono font-bold tracking-wider text-primary">{app.reference}</span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-3">
              <span className="text-slate-500">Paciente</span>
              <span className="font-medium text-right">{app.clientName}</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-slate-500">Serviço</span>
              <span className="font-medium text-right">{srv?.name}</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-slate-500">Profissional</span>
              <span className="font-medium text-right">{prof?.name}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-500">Data e Hora</span>
              <span className="font-medium text-right">
                {app.date} às {app.time}
              </span>
            </div>
          </div>

          {app.status === 'Confirmado' && (
            <Button
              variant="outline"
              className="w-full mt-4 text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={handleCancel}
            >
              Cancelar Reserva
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
