import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { format } from 'date-fns'
import { MessageCircle } from 'lucide-react'

export default function ProfessionalDashboard() {
  const { user } = useAuth()
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Painel do Profissional</h2>
        <p className="text-slate-500 mt-1">Gerencie sua agenda e seu portfólio de serviços.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Pacientes confirmados e agendamentos pendentes.</CardDescription>
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
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((a) => {
                      const telefone = a.cliente_telefone || ''
                      const cleanPhone = telefone.replace(/\D/g, '')
                      const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null

                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {a.expand?.cliente_id?.name || a.cliente_nome || 'Paciente'}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {a.expand?.servico_id?.nome || 'Serviço não definido'}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {format(new Date(a.data), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            {whatsappLink ? (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium text-sm bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                              >
                                <MessageCircle className="w-4 h-4 mr-1.5" />
                                {telefone}
                              </a>
                            ) : (
                              <span className="text-slate-400 text-sm">Não informado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={a.status === 'confirmado' ? 'default' : 'secondary'}
                              className={
                                a.status === 'confirmado'
                                  ? 'bg-emerald-500 hover:bg-emerald-600'
                                  : ''
                              }
                            >
                              {a.status.toUpperCase()}
                            </Badge>
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Meus Serviços</CardTitle>
                <CardDescription>Os procedimentos que você oferece.</CardDescription>
              </div>
            </div>
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
                        R$ {s.preco.toFixed(2)}{' '}
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
