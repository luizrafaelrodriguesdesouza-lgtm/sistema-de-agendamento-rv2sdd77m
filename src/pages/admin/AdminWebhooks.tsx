import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

export default function AdminWebhooks() {
  const [url, setUrl] = useState('')
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadSettings = async () => {
    try {
      const records = await pb.collection('settings').getFullList()
      if (records.length > 0) {
        setSettingsId(records[0].id)
        setUrl(records[0].webhook_url || '')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadLogs = async () => {
    try {
      const records = await pb.collection('webhook_logs').getList(1, 10, {
        sort: '-created',
      })
      setLogs(records.items)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadSettings()
    loadLogs()
  }, [])

  useRealtime('webhook_logs', () => {
    loadLogs()
  })

  const handleSave = async () => {
    if (url && !url.startsWith('https://')) {
      toast({
        title: 'URL Inválida',
        description: 'O webhook deve usar HTTPS.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      if (settingsId) {
        await pb.collection('settings').update(settingsId, { webhook_url: url })
      } else {
        const record = await pb.collection('settings').create({ webhook_url: url })
        setSettingsId(record.id)
      }
      toast({ title: 'Sucesso', description: 'URL de webhook atualizada.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao salvar URL.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!url) {
      toast({
        title: 'Aviso',
        description: 'Configure uma URL e salve primeiro.',
        variant: 'destructive',
      })
      return
    }
    try {
      await pb.send('/backend/v1/webhooks/test', { method: 'POST' })
      toast({ title: 'Teste Enviado', description: 'O evento de teste foi disparado.' })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao disparar webhook de teste.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Configurações de Webhook</h2>
        <p className="text-slate-500 mt-1">Gerencie a integração de eventos em tempo real.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Endpoint de Destino</CardTitle>
          <CardDescription>Defina a URL HTTPS que receberá os eventos do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">URL do Webhook</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.suaempresa.com/webhook"
                className="font-mono text-sm flex-1"
                type="url"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTest}>
                  Testar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Logs Recentes</CardTitle>
          <CardDescription>
            Últimos 10 eventos disparados para o webhook configurado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length === 0 ? (
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
                        ? 'bg-emerald-100 text-emerald-700 border-0'
                        : 'bg-rose-100 text-rose-700 border-0'
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
