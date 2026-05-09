import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { Logo } from '@/components/Logo'

export default function Tracking() {
  const { reference } = useParams()
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reference) return
    const fetchApp = async () => {
      try {
        const result = await pb
          .collection('agendamentos')
          .getFirstListItem(`referencia = '${reference}'`, {
            expand: 'servico_id,profissional_id',
          })
        setAppointment(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchApp()
  }, [reference])

  return (
    <div className="container max-w-2xl py-20 px-4 flex-1">
      <div className="animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <Logo className="h-16" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">
          Acompanhar Agendamento
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Buscando informações...</p>
          </div>
        ) : !appointment ? (
          <Card className="text-center py-12 border-dashed">
            <CardContent>
              <p className="text-rose-500 font-medium mb-4">Agendamento não encontrado.</p>
              <p className="text-slate-500 text-sm mb-6">
                Verifique o código de referência e tente novamente.
              </p>
              <Link to="/">
                <Button>Fazer novo agendamento</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="text-center border-b pb-6 bg-slate-50/50 rounded-t-xl">
              <Badge className="mx-auto mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                Ref: {appointment.referencia}
              </Badge>
              <CardTitle className="text-2xl">{appointment.expand?.servico_id?.nome}</CardTitle>
              <CardDescription className="text-base mt-2">
                Status do seu agendamento
              </CardDescription>
              <div className="mt-4">
                <Badge
                  variant={appointment.status === 'confirmado' ? 'default' : 'secondary'}
                  className="text-sm px-4 py-1"
                >
                  {appointment.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-6 border-b pb-6">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Data e Hora
                  </p>
                  <p className="text-lg font-medium text-slate-800">
                    {format(new Date(appointment.data), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Profissional
                  </p>
                  <p className="text-lg font-medium text-slate-800">
                    {appointment.expand?.profissional_id?.name}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Paciente
                </p>
                <p className="text-base text-slate-800">
                  {appointment.cliente_nome || appointment.expand?.cliente_id?.name}
                </p>
                <p className="text-sm text-slate-500">
                  {appointment.cliente_email || appointment.expand?.cliente_id?.email}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center mt-6">
                <span className="font-semibold text-slate-700">Valor Total</span>
                <span className="font-bold text-primary text-xl">
                  R$ {appointment.expand?.servico_id?.preco.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
