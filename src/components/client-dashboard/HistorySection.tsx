import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { History } from 'lucide-react'
import { format, startOfDay } from 'date-fns'

interface HistorySectionProps {
  appointments: any[]
  professionals: any[]
  loading: boolean
}

export function HistorySection({ appointments, professionals, loading }: HistorySectionProps) {
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')
  const [historyProf, setHistoryProf] = useState('all')
  const [historyServ, setHistoryServ] = useState('all')

  const today = startOfDay(new Date())

  const history = useMemo(() => {
    let filtered = appointments
      .filter((a) => new Date(a.data) < today)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    if (historyDateFrom) {
      const startD = new Date(historyDateFrom + 'T00:00:00')
      filtered = filtered.filter((a) => new Date(a.data) >= startD)
    }
    if (historyDateTo) {
      const endD = new Date(historyDateTo + 'T23:59:59')
      filtered = filtered.filter((a) => new Date(a.data) <= endD)
    }
    if (historyProf !== 'all') {
      filtered = filtered.filter((a) => a.profissional_id === historyProf)
    }
    if (historyServ !== 'all') {
      filtered = filtered.filter((a) => a.servico_id === historyServ)
    }

    return filtered
  }, [appointments, today, historyDateFrom, historyDateTo, historyProf, historyServ])

  const uniqueServiceIds = Array.from(
    new Set(appointments.filter((a) => a.expand?.servico_id).map((a) => a.servico_id)),
  )

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <History className="w-6 h-6 text-slate-600" />
        <h2 className="text-2xl font-semibold text-slate-800">Histórico de Serviços Realizados</h2>
      </div>

      <Card className="bg-slate-50/50">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>A partir de</Label>
            <Input
              type="date"
              value={historyDateFrom}
              onChange={(e) => setHistoryDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Até</Label>
            <Input
              type="date"
              value={historyDateTo}
              onChange={(e) => setHistoryDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select value={historyProf} onValueChange={setHistoryProf}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select value={historyServ} onValueChange={setHistoryServ}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueServiceIds.map((id) => {
                  const s = appointments.find((a) => a.servico_id === id)?.expand?.servico_id
                  if (!s) return null
                  return (
                    <SelectItem key={id} value={id}>
                      {s.nome}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed flex flex-col items-center">
          <History className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">Nenhum serviço realizado ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((app) => (
            <Card key={app.id} className="hover:bg-slate-50 transition-colors">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-slate-800">
                      {app.expand?.servico_id?.nome || 'Serviço'}
                    </h4>
                    <Badge
                      variant="outline"
                      className={
                        app.status === 'concluido'
                          ? 'text-emerald-600 border-emerald-200'
                          : app.status === 'cancelado'
                            ? 'text-red-600 border-red-200'
                            : 'text-slate-600'
                      }
                    >
                      {app.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    Com {app.expand?.profissional_id?.name || 'Profissional'}
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                  <p className="text-sm text-slate-600 font-medium bg-white px-2 py-1 border rounded">
                    {format(new Date(app.data), 'dd/MM/yyyy')}
                  </p>
                  <p className="font-bold text-slate-800">
                    R$ {(app.expand?.servico_id?.preco || 0).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
