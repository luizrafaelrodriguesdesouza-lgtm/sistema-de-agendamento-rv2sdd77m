import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import useMasterStore from '@/stores/useMasterStore'
import { useToast } from '@/hooks/use-toast'
import { Copy } from 'lucide-react'

export default function OwnerDashboard() {
  const { user } = useAuth()
  const { selectedOwnerId } = useMasterStore()
  const { toast } = useToast()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user) return

    const targetId = user.tipo === 'master' ? selectedOwnerId : user.id
    if (user.tipo === 'master' && !targetId) {
      setProfessionals([])
      setAppointments([])
      setLoading(false)
      return
    }

    try {
      const profs = await pb.collection('users').getFullList({
        filter: `proprietario_id = '${targetId}'`,
      })
      setProfessionals(profs)

      if (profs.length > 0) {
        const profIds = profs.map((p) => `"${p.id}"`).join(',')
        const apps = await pb.collection('agendamentos').getFullList({
          filter: `profissional_id ?~ [${profIds}]`,
          expand: 'servico_id,profissional_id',
        })
        setAppointments(apps)
      } else {
        setAppointments([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, selectedOwnerId])

  useRealtime('users', () => loadData())
  useRealtime('agendamentos', () => loadData())

  const totalRevenue = appointments.reduce((acc, app) => {
    if (app.status === 'concluido' || app.status === 'confirmado') {
      return acc + (app.expand?.servico_id?.preco || 0)
    }
    return acc
  }, 0)

  const noShowApps = appointments.filter((a) => a.status === 'cancelado').length
  const totalApps = appointments.length
  const noShowRate = totalApps > 0 ? ((noShowApps / totalApps) * 100).toFixed(1) : '0.0'

  const chartData = professionals.map((p) => {
    const profApps = appointments.filter(
      (a) => a.profissional_id === p.id && (a.status === 'concluido' || a.status === 'confirmado'),
    )
    const revenue = profApps.reduce((acc, a) => acc + (a.expand?.servico_id?.preco || 0), 0)
    return {
      name: p.name.split(' ')[1] || p.name.split(' ')[0],
      receita: revenue,
    }
  })

  const chartConfig = {
    receita: {
      label: 'Receita',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Visão Geral da Clínica</h2>
          <p className="text-slate-500 mt-1">Métricas e performance da sua empresa.</p>
        </div>
        {user?.tipo === 'proprietario' && user?.codigo_acesso && (
          <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-lg border border-primary/20">
            <div>
              <p className="text-xs font-medium text-slate-500">Código da Clínica (Convite)</p>
              <p className="text-lg font-bold text-primary tracking-wider">{user.codigo_acesso}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(user.codigo_acesso || '')
                toast({ title: 'Código copiado!' })
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Carregando métricas...</div>
      ) : user?.tipo === 'master' && !selectedOwnerId ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed shadow-sm">
          <p className="text-slate-500 mb-2">Nenhuma clínica selecionada.</p>
          <p className="text-sm text-slate-400">
            Selecione uma clínica no topo da página para ver seus dados.
          </p>
        </div>
      ) : professionals.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed shadow-sm">
          <p className="text-slate-500 mb-2">Nenhum profissional vinculado a esta clínica.</p>
          <p className="text-sm text-slate-400">
            Convide profissionais usando o Código da Clínica.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Receita Total Estimada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-800">R$ {totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Agendamentos Totais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-800">{totalApps}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Taxa de Cancelamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-rose-500">{noShowRate}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle>Receita por Profissional</CardTitle>
                <CardDescription>Comparativo de faturamento bruto.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full mt-4">
                  <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      className="stroke-slate-200"
                    />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis
                      tickFormatter={(val) => `R$${val}`}
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="receita"
                      fill="var(--color-receita)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle>Gestão da Equipe</CardTitle>
                <CardDescription>Profissionais vinculados a sua clínica.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {professionals.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center p-4 border rounded-xl bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {p.name ? p.name[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            Comissão Base: {p.comissao || 0}%
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          p.status_aprovacao === 'aprovado'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-0'
                        }
                      >
                        {p.status_aprovacao === 'aprovado' ? 'Ativo' : 'Pendente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
