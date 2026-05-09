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
  const [secret, setSecret] = useState('')
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()

  const loadSettings = async () => {
    try {
      const records = await pb.collection('settings').getFullList()
      if (records.length > 0) {
        setSettingsId(records[0].id)
        setUrl(records[0].webhook_url || '')
        setSecret(records[0].webhook_secret || '')
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
        await pb
          .collection('settings')
          .update(settingsId, { webhook_url: url, webhook_secret: secret })
      } else {
        const record = await pb
          .collection('settings')
          .create({ webhook_url: url, webhook_secret: secret })
        setSettingsId(record.id)
      }
      toast({ title: 'Sucesso', description: 'Configurações de webhook atualizadas.' })
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
      setTesting(true)
      const res = await pb.send('/backend/v1/webhooks/test', { method: 'POST' })
      toast({
        title: 'Teste Enviado com Sucesso',
        description: `O evento de teste foi disparado (HTTP ${res.status}) em ${res.timeMs || 0}ms.`,
      })
    } catch (e: any) {
      const errorMessage = e.response?.message || e.message || 'Falha ao disparar webhook de teste.'
      toast({
        title: 'Erro no Teste',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
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
          <CardTitle>Configuração do Endpoint</CardTitle>
          <CardDescription>Defina a URL HTTPS e o segredo de autenticação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">URL do Webhook</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.suaempresa.com/webhook"
                className="font-mono text-sm"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Chave Secreta (Authorization Header)
              </label>
              <Input
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Bearer token..."
                className="font-mono text-sm"
                type="password"
              />
              <p className="text-xs text-slate-500">
                A chave será enviada no header Authorization.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || saving}
                className="w-full sm:w-auto"
              >
                {testing ? 'Testando...' : 'Testar Conexão'}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
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
                <div key={log.id} className="flex flex-col p-3 bg-slate-50 border rounded-lg gap-2">
                  <div className="flex justify-between items-center">
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
                  {log.response && (
                    <div className="mt-2 p-2 bg-slate-100 rounded border border-slate-200 text-xs font-mono text-slate-600 overflow-x-auto max-h-32">
                      {typeof log.response === 'string'
                        ? log.response
                        : JSON.stringify(log.response, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
