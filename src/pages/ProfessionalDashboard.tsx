import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  CalendarDays,
  CalendarRange,
} from 'lucide-react'

export default function ProfessionalDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user) return
    try {
      const [apps, servs] = await Promise.all([
        pb.collection('agendamentos').getFullList({
          filter: `profissional_id = '${user.id}'`,
          sort: 'data',
          expand: 'cliente_id,servico_id',
        }),
        pb.collection('servicos').getFullList({
          filter: `profissional_id = '${user.id}'`,
        }),
      ])
      setAppointments(apps)
      setServices(servs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('agendamentos', () => loadData())
  useRealtime('servicos', () => loadData())

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await pb.collection('agendamentos').update(id, { status: newStatus })
      toast({ title: 'Sucesso', description: `Agendamento atualizado para ${newStatus}.` })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  const monthStr = format(now, 'yyyy-MM')
  const yearStr = format(now, 'yyyy')

  let dailyRev = 0
  let monthlyRev = 0
  let yearlyRev = 0

  appointments.forEach((a) => {
    if (a.status === 'concluido') {
      const aDate = new Date(a.data)
      const aDateStr = format(aDate, 'yyyy-MM-dd')
      const aMonthStr = format(aDate, 'yyyy-MM')
      const aYearStr = format(aDate, 'yyyy')
      const price = a.expand?.servico_id?.preco || 0

      if (aDateStr === todayStr) dailyRev += price
      if (aMonthStr === monthStr) monthlyRev += price
      if (aYearStr === yearStr) yearlyRev += price
    }
  })

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge className="bg-indigo-500 hover:bg-indigo-600">CONCLUÍDO</Badge>
      case 'confirmado':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">CONFIRMADO</Badge>
      case 'cancelado':
        return <Badge variant="destructive">CANCELADO</Badge>
      default:
        return <Badge variant="secondary">PENDENTE</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Painel do Profissional</h2>
        <p className="text-slate-500 mt-1">
          Gerencie sua agenda, faturamento e portfólio de serviços.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Faturamento Diário</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(dailyRev)}</div>
            <p className="text-xs text-slate-500 mt-1">Hoje</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Faturamento Mensal</CardTitle>
            <CalendarDays className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(monthlyRev)}</div>
            <p className="text-xs text-slate-500 mt-1">Este mês</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Faturamento Anual</CardTitle>
            <CalendarRange className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(yearlyRev)}</div>
            <p className="text-xs text-slate-500 mt-1">Este ano</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="shadow-sm border-slate-200 xl:col-span-2">
          <CardHeader>
            <CardTitle>Agendamentos</CardTitle>
            <CardDescription>Gerencie os status dos seus pacientes.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-slate-500">Carregando...</div>
            ) : appointments.length === 0 ? (
              <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border">
                Nenhum agendamento encontrado.
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Data / Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((a) => {
                      const telefone = a.cliente_telefone || ''
                      const cleanPhone = telefone.replace(/\D/g, '')
                      const whatsappLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : null

                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {a.expand?.cliente_id?.name || a.cliente_nome || 'Paciente'}
                            {whatsappLink && (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-emerald-600 hover:text-emerald-700 font-medium text-xs mt-1 transition-colors"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {telefone}
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {a.expand?.servico_id?.nome || 'Serviço não definido'}
                            <div className="text-xs text-slate-400 mt-1">
                              {formatCurrency(a.expand?.servico_id?.preco || 0)}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {format(new Date(a.data), 'dd/MM/yyyy')}
                            <div className="text-xs font-medium text-slate-800 mt-1">
                              {format(new Date(a.data), 'HH:mm')}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(a.status)}</TableCell>
                          <TableCell className="text-right">
                            {a.status === 'pendente' || a.status === 'confirmado' ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8"
                                  onClick={() => updateStatus(a.id, 'concluido')}
                                  title="Marcar como Concluído"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 w-8"
                                  onClick={() => updateStatus(a.id, 'cancelado')}
                                  title="Cancelar Agendamento"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">Finalizado</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Meus Serviços</CardTitle>
            <CardDescription>Os procedimentos que você oferece.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-slate-500">Carregando...</div>
            ) : services.length === 0 ? (
              <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border">
                Você ainda não tem serviços cadastrados.
              </div>
            ) : (
              <ul className="space-y-3">
                {services.map((s) => (
                  <li
                    key={s.id}
                    className="flex justify-between items-center p-4 border rounded-xl bg-white hover:border-primary/30 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{s.nome}</p>
                      <p className="text-sm font-medium text-primary mt-1">
                        {formatCurrency(s.preco)}
                        <span className="text-slate-400 font-normal ml-2">{s.duracao} min</span>
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={s.ativo ? 'bg-emerald-100 text-emerald-700' : ''}
                    >
                      {s.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
