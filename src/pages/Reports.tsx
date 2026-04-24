import { useEffect, useState } from 'react'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { DollarSign, CalendarDays, Activity } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function Reports() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchReports = async () => {
      if (!date?.from) return

      setLoading(true)
      try {
        const startStr = format(date.from, 'yyyy-MM-dd 00:00:00')
        const endStr = format(date.to || date.from, 'yyyy-MM-dd 23:59:59')
        const filter = `data >= '${startStr}' && data <= '${endStr}'`

        const records = await pb.collection('agendamentos').getFullList({
          filter,
          expand: 'profissional_id,servico_id,cliente_id',
          sort: '-data',
        })
        setData(records)
      } catch (error) {
        console.error('Failed to fetch reports:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os relatórios.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [date, toast])

  const totalAppointments = data.length
  const expectedRevenue = data
    .filter((item) => item.status === 'confirmado' || item.status === 'concluido')
    .reduce((acc, curr) => acc + (curr.expand?.servico_id?.preco || 0), 0)

  const statusCounts = data.reduce(
    (acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const statusMap: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmado: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    concluido: { label: 'Concluído', color: 'bg-green-100 text-green-800 border-green-200' },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        <div className="flex items-center space-x-2">
          <DatePickerWithRange date={date} setDate={setDate} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalAppointments}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Prevista</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(expectedRevenue)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Baseado em agendamentos confirmados e concluídos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Badge key={status} variant="outline" className={statusMap[status]?.color || ''}>
                    {statusMap[status]?.label || status}: {count}
                  </Badge>
                ))}
                {Object.keys(statusCounts).length === 0 && (
                  <span className="text-sm text-muted-foreground">Sem dados</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
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
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum agendamento encontrado no período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(item.data), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {item.cliente_nome || item.expand?.cliente_id?.name || 'Cliente Avulso'}
                    </TableCell>
                    <TableCell>{item.expand?.profissional_id?.name || '-'}</TableCell>
                    <TableCell>{item.expand?.servico_id?.nome || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusMap[item.status]?.color || ''}>
                        {statusMap[item.status]?.label || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.expand?.servico_id?.preco || 0)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
