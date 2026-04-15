import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function MasterDashboard() {
  const { toast } = useToast()

  const handleTest = () => {
    toast({
      title: 'Webhook Disparado!',
      description: 'O evento de teste foi enviado. Verifique seu servidor.',
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Administração Master</h2>
        <p className="text-slate-500 mt-1">Gestão global do sistema e integrações.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Aprovações de Novas Clínicas</CardTitle>
            <CardDescription>Validar credenciais de novas empresas registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-xl bg-white shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800 text-lg">Clínica Bela Vida Ltda</p>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      Pendente
                    </Badge>
                  </div>
                  <p className="text-sm font-mono text-slate-500">CNPJ: 12.345.678/0001-90</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Aprovar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Integração de Webhooks</CardTitle>
            <CardDescription>Envie eventos em tempo real para sistemas externos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">
                URL do Endpoint de Destino (HTTPS)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  defaultValue="https://api.empresa.com/webhook"
                  className="font-mono text-sm"
                />
                <Button variant="secondary" onClick={handleTest} className="shrink-0">
                  Testar Conexão
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-sm text-slate-700 mb-3">Logs Recentes</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                  <span className="text-slate-600">POST /appointment.created</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">200 OK</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                  <span className="text-slate-600">POST /professional.approved</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">200 OK</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
