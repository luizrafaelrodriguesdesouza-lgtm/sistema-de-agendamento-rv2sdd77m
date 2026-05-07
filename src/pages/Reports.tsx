import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, DollarSign, ListOrdered, TrendingUp } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import pb from '@/lib/pocketbase/client'
import useAuthStore from '@/stores/useAuthStore'
import { format, subDays, endOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

export default function Reports() {
  const navigate = useNavigate()
  const { user } = useAuthStore() as any
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    if (
      !user ||
      (user.tipo !== 'master' &&
        user.tipo !== 'proprietario' &&
        user.role !== 'master' &&
        user.role !== 'proprietario')
    ) {
      navigate('/')
      return
    }
    fetchData()
  }, [startDate, endDate, user, navigate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const start = new Date(startDate).toISOString()
      const end = endOfDay(new Date(endDate)).toISOString()

      const records = await pb.collection('agendamentos').getFullList({
        filter: `data >= '${start}' && data <= '${end}'`,
        expand: 'servico_id,profissional_id',
        sort: '-data',
      })
      setAgendamentos(records)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const metrics = useMemo(() => {
    let totalBookings = agendamentos.length
    let totalRevenue = 0
    let completedBookings = 0
    const serviceCount: Record<string, number> = {}
    const dailyRevenue: Record<string, number> = {}

    agendamentos.forEach((a) => {
      const isConfirmedOrCompleted = a.status === 'concluido' || a.status === 'confirmado'
      const price = a.expand?.servico_id?.preco || 0
      if (isConfirmedOrCompleted) {
        totalRevenue += price
        completedBookings++
        const day = format(parseISO(a.data), 'dd/MM', { locale: ptBR })
        dailyRevenue[day] = (dailyRevenue[day] || 0) + price
      }
      const sName = a.expand?.servico_id?.nome || 'Desconhecido'
      serviceCount[sName] = (serviceCount[sName] || 0) + 1
    })

    const avgTicket = completedBookings > 0 ? totalRevenue / completedBookings : 0
    const pieData = Object.entries(serviceCount).map(([name, value]) => ({ name, value }))
    const lineData = Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }))
    return { totalBookings, totalRevenue, avgTicket, pieData, lineData }
  }, [agendamentos])

  const handleExport = () => {
    const headers = ['Cliente', 'Profissional', 'Serviço', 'Data', 'Status', 'Preço']
    const rows = agendamentos.map((a) => [
      `"${a.cliente_nome || a.expand?.cliente_id?.name || '-'}"`,
      `"${a.expand?.profissional_id?.name || '-'}"`,
      `"${a.expand?.servico_id?.nome || '-'}"`,
      `"${format(parseISO(a.data), 'dd/MM/yyyy HH:mm')}"`,
      `"${a.status}"`,
      a.expand?.servico_id?.preco || 0,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_${startDate}_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#9333ea', '#db2777']

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard & Relatórios</h1>
          <p className="text-slate-500">Acompanhe o desempenho do seu negócio</p>
        </div>
        <div className="flex flex-wrap items-end gap-3 bg-white p-3 rounded-lg border shadow-sm">
          <div className="space-y-1">
            <Label htmlFor="start" className="text-xs">
              Data Inicial
            </Label>
            <Input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end" className="text-xs">
              Data Final
            </Label>
            <Input
              id="end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            className="h-9 w-9 shrink-0"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
            <ListOrdered className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{metrics.totalBookings}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  metrics.totalRevenue,
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  metrics.avgTicket,
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receita Diária</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : metrics.lineData.length > 0 ? (
              <ChartContainer
                config={{ revenue: { label: 'Receita', color: 'hsl(var(--primary))' } }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics.lineData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                    <YAxis fontSize={12} tickFormatter={(v) => `R$${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Serviços Populares</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : metrics.pieData.length > 0 ? (
              <ChartContainer config={{ value: { label: 'Qtd', color: 'hsl(var(--primary))' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {metrics.pieData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : agendamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Nenhum agendamento no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  agendamentos.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{format(parseISO(a.data), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="font-medium">
                        {a.cliente_nome || a.expand?.cliente_id?.name || '-'}
                      </TableCell>
                      <TableCell>{a.expand?.profissional_id?.name || '-'}</TableCell>
                      <TableCell>{a.expand?.servico_id?.nome || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          {a.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(a.expand?.servico_id?.preco || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
