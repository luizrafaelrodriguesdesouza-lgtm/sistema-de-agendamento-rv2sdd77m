import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    try {
      setLoading(true)
      const [records, waRecords] = await Promise.all([
        pb
          .collection('webhook_logs')
          .getList(1, 50, { sort: '-created' })
          .catch(() => ({ items: [] })),
        pb
          .collection('whatsapp_logs')
          .getList(1, 50, { sort: '-created' })
          .catch(() => ({ items: [] })),
      ])
      setLogs(records.items || [])
      setWhatsappLogs(waRecords.items || [])
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
  useRealtime('whatsapp_logs', () => {
    loadLogs()
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Logs do Sistema</h2>
        <p className="text-slate-500 mt-1">
          Histórico de eventos de webhooks, integrações e atividades do sistema.
        </p>
      </div>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Logs de Webhook</CardTitle>
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
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Logs do WhatsApp</CardTitle>
              <CardDescription>
                Histórico de mensagens de confirmação enviadas aos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-slate-500">Carregando logs...</p>
                ) : whatsappLogs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg border">
                    Nenhum log do WhatsApp encontrado.
                  </p>
                ) : (
                  whatsappLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col md:flex-row md:justify-between md:items-center p-4 bg-slate-50 border rounded-lg gap-2"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-700">
                            {log.phone_number || 'Sem Número'}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              log.status === 'sent'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : log.status === 'skipped'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                            }
                          >
                            {log.status === 'sent'
                              ? 'Enviado'
                              : log.status === 'skipped'
                                ? 'Ignorado'
                                : 'Falha'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mt-2">
                          {log.message_text}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-rose-600 mt-2 p-2 bg-rose-50 rounded border border-rose-100 break-all">
                            Erro: {log.error_message}
                          </p>
                        )}
                        <span className="text-xs text-slate-500 block mt-2">
                          {format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')} • Ref:{' '}
                          {log.booking_id}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
