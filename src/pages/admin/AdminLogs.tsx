import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    try {
      setLoading(true)
      const records = await pb.collection('webhook_logs').getList(1, 50, {
        sort: '-created',
      })
      setLogs(records.items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  useRealtime('webhook_logs', () => {
    loadLogs()
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Logs do Sistema</h2>
        <p className="text-slate-500 mt-1">
          Histórico de eventos de webhooks e atividades do sistema.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Todos os Logs</CardTitle>
          <CardDescription>
            Listagem completa dos eventos disparados pela plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Carregando logs...</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg border">
                Nenhum log encontrado.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg"
                >
                  <div>
                    <span className="font-semibold text-slate-700 block">{log.event}</span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')}
                    </span>
                  </div>
                  <Badge
                    className={
                      log.status >= 200 && log.status < 300
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0'
                        : 'bg-rose-100 text-rose-700 hover:bg-rose-100 border-0'
                    }
                  >
                    {log.status === 0 ? 'Erro de Rede' : `${log.status} HTTP`}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
